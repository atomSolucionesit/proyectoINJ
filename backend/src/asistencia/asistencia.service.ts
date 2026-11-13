import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { EstadoAsistencia } from "../generated/prisma/client";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { comoTexto, leerFecha } from "../compartido/fechas";

const estados: EstadoAsistencia[] = ["presente", "tarde", "ausente"];

export type DatosAsistencia = { fecha?: unknown; materia?: unknown; registros?: unknown };

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

@Injectable()
export class AsistenciaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lo tomado ese día en esa materia (vacío si todavía no se tomó). */
  async delDia(yo: UsuarioSesion, cursoId: string, materia: unknown, fecha: unknown) {
    const { nombreMateria } = await this.materiaPermitida(yo, cursoId, materia);
    const registros = await this.prisma.asistencia.findMany({
      where: { cursoId, materia: nombreMateria, fecha: leerFecha(fecha) },
      select: { alumnoId: true, estado: true },
    });
    return { registros };
  }

  /** Guarda la asistencia de todo el curso para ese día. Si ya estaba tomada, la corrige. */
  async guardar(yo: UsuarioSesion, cursoId: string, datos: DatosAsistencia) {
    const { nombreMateria } = await this.materiaPermitida(yo, cursoId, datos.materia);
    const fecha = leerFecha(datos.fecha);
    if (!Array.isArray(datos.registros) || datos.registros.length === 0) throw new BadRequestException("No hay alumnos para guardar.");

    const delCurso = new Set(
      (await this.prisma.usuario.findMany({ where: { cursoId, rol: "alumno" }, select: { id: true } })).map((a) => a.id),
    );
    const registros = datos.registros.map((r: { alumnoId?: unknown; estado?: unknown }) => {
      const alumnoId = texto(r?.alumnoId);
      const estado = estados.find((e) => e === r?.estado);
      if (!delCurso.has(alumnoId)) throw new BadRequestException("Hay un alumno que ya no está en este curso. Actualizá la página.");
      if (!estado) throw new BadRequestException("Marcá a cada alumno como presente, tarde o ausente.");
      return { alumnoId, estado };
    });

    await this.prisma.$transaction(
      registros.map(({ alumnoId, estado }) =>
        this.prisma.asistencia.upsert({
          where: { cursoId_materia_fecha_alumnoId: { cursoId, materia: nombreMateria, fecha, alumnoId } },
          update: { estado, tomadaPorId: yo.id },
          create: { cursoId, materia: nombreMateria, fecha, alumnoId, estado, tomadaPorId: yo.id },
        }),
      ),
    );
    return { guardados: registros.length };
  }

  /** Totales por alumno en esa materia y los días en que se tomó. */
  async resumen(yo: UsuarioSesion, cursoId: string, materia: unknown) {
    const { nombreMateria } = await this.materiaPermitida(yo, cursoId, materia);
    const where = { cursoId, materia: nombreMateria };
    const [porAlumno, dias] = await Promise.all([
      this.prisma.asistencia.groupBy({ by: ["alumnoId", "estado"], where, _count: { _all: true } }),
      this.prisma.asistencia.findMany({ where, distinct: ["fecha"], select: { fecha: true }, orderBy: { fecha: "desc" } }),
    ]);

    const alumnos: Record<string, Record<EstadoAsistencia, number>> = {};
    for (const { alumnoId, estado, _count } of porAlumno) {
      alumnos[alumnoId] ??= { presente: 0, tarde: 0, ausente: 0 };
      alumnos[alumnoId][estado] = _count._all;
    }
    return { dias: dias.map((d) => comoTexto(d.fecha)), alumnos };
  }

  /**
   * El admin puede tomar cualquier materia del curso; el profesor, solo las materias que da él.
   * Devuelve el nombre de la materia tal como está guardado en el curso. Lo usan también los positivos y negativos.
   */
  async materiaPermitida(yo: UsuarioSesion, cursoId: string, materia: unknown) {
    if (!puede(yo.rol, "asistencia:tomar")) throw new ForbiddenException("No tenés permiso para tomar asistencia.");
    const curso = await this.prisma.curso.findUnique({ where: { id: cursoId }, include: { docentes: true } });
    if (!curso) throw new NotFoundException("Ese curso ya no existe. Actualizá la página.");

    const asignacion = curso.docentes.find((d) => d.materia.toLowerCase() === texto(materia).toLowerCase());
    if (!asignacion) throw new BadRequestException("Elegí una materia del curso.");
    if (yo.rol === "profesor" && asignacion.profesorId !== yo.id) {
      throw new ForbiddenException(`Solo podés tomar asistencia en tus materias. ${asignacion.materia} la da otro profesor.`);
    }
    return { nombreMateria: asignacion.materia };
  }
}
