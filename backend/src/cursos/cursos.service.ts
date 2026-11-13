import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Curso, DocenteCurso, Usuario } from "../generated/prisma/client";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { nombreCurso } from "./nombre-curso";
import { UsuariosService, type DatosNuevoAlumno } from "../usuarios/usuarios.service";

/** Secundaria: de 1° a 6° Año. */
export const ANIOS = [1, 2, 3, 4, 5, 6];

type CursoCompleto = Curso & { docentes: (DocenteCurso & { profesor: Pick<Usuario, "nombre"> })[] };

const conDocentes = { docentes: { include: { profesor: { select: { nombre: true } } }, orderBy: { materia: "asc" } } } as const;

function publicoCurso({ docentes, ...curso }: CursoCompleto) {
  return {
    ...curso,
    nombre: nombreCurso(curso),
    docentes: docentes.map(({ profesor, ...d }) => ({ ...d, profesorNombre: profesor.nombre })),
  };
}

export type DatosCurso = { anio?: unknown; division?: unknown };
export type DatosDocente = { profesorId?: unknown; materia?: unknown };

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

@Injectable()
export class CursosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarios: UsuariosService,
  ) {}

  /**
   * - Admin: todos los cursos.
   * - Profesores: solo los cursos donde dan alguna materia.
   * - Alumnos: su curso. Padres: los cursos de sus hijos. Así ven qué profesor da cada materia.
   * - Bibliotecaria: ninguno.
   */
  async listar(yo: UsuarioSesion) {
    const orderBy = [{ anio: "asc" as const }, { division: "asc" as const }];
    const where =
      yo.rol === "profesor"
        ? { docentes: { some: { profesorId: yo.id } } }
        : puede(yo.rol, "seccion:cursos")
          ? {}
          : { alumnos: { some: { OR: [{ id: yo.id }, { padreId: yo.id }] } } };
    return (await this.prisma.curso.findMany({ where, include: conDocentes, orderBy })).map(publicoCurso);
  }

  async crear(yo: UsuarioSesion, datos: DatosCurso) {
    this.controlarPermiso(yo);
    const anio = Number(datos.anio);
    const division = texto(datos.division).toUpperCase();
    if (!ANIOS.includes(anio)) throw new BadRequestException("Elegí un año de 1° a 6°.");
    if (!division || division.length > 10) throw new BadRequestException("Poné la división (por ejemplo A o B).");
    if (await this.prisma.curso.findUnique({ where: { anio_division: { anio, division } } })) {
      throw new BadRequestException(`El curso ${nombreCurso({ anio, division })} ya existe.`);
    }
    return publicoCurso(await this.prisma.curso.create({ data: { anio, division }, include: conDocentes }));
  }

  /** Los alumnos del curso quedan sin curso; las materias asignadas se borran. */
  async eliminar(yo: UsuarioSesion, id: string) {
    this.controlarPermiso(yo);
    await this.prisma.curso.deleteMany({ where: { id } });
  }

  async asignarDocente(yo: UsuarioSesion, cursoId: string, datos: DatosDocente) {
    this.controlarPermiso(yo);
    const curso = await this.buscar(cursoId);
    const materia = texto(datos.materia).slice(0, 80);
    const profesorId = texto(datos.profesorId);
    if (!materia) throw new BadRequestException("Poné la materia.");
    const profesor = profesorId ? await this.prisma.usuario.findUnique({ where: { id: profesorId } }) : null;
    if (profesor?.rol !== "profesor") throw new BadRequestException("Elegí un profesor.");

    const existente = await this.prisma.docenteCurso.findUnique({
      where: { cursoId_materia: { cursoId, materia } },
      include: { profesor: { select: { nombre: true } } },
    });
    if (existente) {
      throw new BadRequestException(`${materia} en ${nombreCurso(curso)} ya la da ${existente.profesor.nombre}. Quitala primero para cambiar de profesor.`);
    }
    await this.prisma.docenteCurso.create({ data: { cursoId, profesorId, materia } });
  }

  async quitarDocente(yo: UsuarioSesion, cursoId: string, asignacionId: string) {
    this.controlarPermiso(yo);
    await this.prisma.docenteCurso.deleteMany({ where: { id: asignacionId, cursoId } });
  }

  /** Crea la cuenta de un alumno nuevo, ya anotado en el curso. */
  async crearAlumno(yo: UsuarioSesion, cursoId: string, datos: DatosNuevoAlumno) {
    await this.controlarAlumnos(yo, cursoId);
    return this.usuarios.crearAlumno(cursoId, datos);
  }

  /** Anota a un alumno que ya tiene cuenta (si estaba en otro curso, lo cambia). */
  async agregarAlumno(yo: UsuarioSesion, cursoId: string, alumnoId: string) {
    await this.controlarAlumnos(yo, cursoId);
    const alumno = await this.prisma.usuario.findUnique({ where: { id: alumnoId } });
    if (alumno?.rol !== "alumno") throw new BadRequestException("Elegí un alumno.");
    await this.prisma.usuario.update({ where: { id: alumnoId }, data: { cursoId } });
  }

  async quitarAlumno(yo: UsuarioSesion, cursoId: string, alumnoId: string) {
    await this.controlarAlumnos(yo, cursoId);
    await this.prisma.usuario.updateMany({ where: { id: alumnoId, cursoId }, data: { cursoId: null } });
  }

  private controlarPermiso(yo: UsuarioSesion) {
    if (!puede(yo.rol, "cursos:gestionar")) throw new ForbiddenException("No tenés permiso para modificar cursos.");
  }

  /** Alumnos de un curso: los maneja el admin, o un profesor que da alguna materia en ese curso. */
  private async controlarAlumnos(yo: UsuarioSesion, cursoId: string) {
    if (!puede(yo.rol, "cursos:alumnos")) throw new ForbiddenException("No tenés permiso para modificar los alumnos de un curso.");
    await this.buscar(cursoId);
    if (yo.rol !== "profesor") return;
    const daClase = await this.prisma.docenteCurso.findFirst({ where: { cursoId, profesorId: yo.id } });
    if (!daClase) throw new ForbiddenException("Solo podés agregar o quitar alumnos en los cursos donde das alguna materia.");
  }

  private async buscar(id: string) {
    const curso = await this.prisma.curso.findUnique({ where: { id } });
    if (!curso) throw new NotFoundException("Ese curso ya no existe. Actualizá la página.");
    return curso;
  }
}
