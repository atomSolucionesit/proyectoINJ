import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Put } from "@nestjs/common";
import type { EstadoAsistencia } from "../generated/prisma/client";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { comoTexto } from "../compartido/fechas";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";

const SIN_SANCIONES = { amonestaciones: 0, apercibimientos: 0 };

/**
 * Seguimiento de cada alumno:
 * - Amonestaciones y apercibimientos (los cambia solo el preceptor).
 * - Su asistencia y positivos/negativos por materia (solo lectura: el alumno, su familia y el personal).
 */
@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Las de todos los alumnos del curso (pantalla del preceptor). */
  async sancionesDelCurso(yo: UsuarioSesion, cursoId: string) {
    if (!puede(yo.rol, "sanciones:editar")) throw new ForbiddenException("No tenés permiso para ver las amonestaciones del curso.");
    if (!(await this.prisma.curso.findUnique({ where: { id: cursoId } }))) throw new NotFoundException("Ese curso ya no existe. Actualizá la página.");
    const alumnos = await this.prisma.usuario.findMany({ where: { cursoId, rol: "alumno" }, select: { id: true, sanciones: true } });
    const sanciones: Record<string, typeof SIN_SANCIONES> = {};
    for (const a of alumnos) {
      sanciones[a.id] = a.sanciones ? { amonestaciones: a.sanciones.amonestaciones, apercibimientos: a.sanciones.apercibimientos } : { ...SIN_SANCIONES };
    }
    return { sanciones };
  }

  async sanciones(yo: UsuarioSesion, alumnoId: string) {
    const alumno = await this.verAlumno(yo, alumnoId, "No podés ver las amonestaciones de este alumno.", true);
    const s = await this.prisma.sancion.findUnique({ where: { alumnoId: alumno.id } });
    return s ? { amonestaciones: s.amonestaciones, apercibimientos: s.apercibimientos } : { ...SIN_SANCIONES };
  }

  async cambiarSanciones(yo: UsuarioSesion, alumnoId: string, datos: { tipo?: unknown; cantidad?: unknown }) {
    if (!puede(yo.rol, "sanciones:editar")) throw new ForbiddenException("Solo el preceptor puede cambiar amonestaciones y apercibimientos.");
    const alumno = await this.prisma.usuario.findUnique({ where: { id: alumnoId } });
    if (alumno?.rol !== "alumno") throw new NotFoundException("Ese alumno ya no existe. Actualizá la página.");
    const tipo = (["amonestaciones", "apercibimientos"] as const).find((t) => t === datos.tipo);
    if (!tipo) throw new BadRequestException("Elegí amonestaciones o apercibimientos.");
    const cantidad = Number(datos.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 99) throw new BadRequestException("La cantidad tiene que ser de 0 a 99.");
    const s = await this.prisma.sancion.upsert({
      where: { alumnoId },
      update: { [tipo]: cantidad },
      create: { alumnoId, ...SIN_SANCIONES, [tipo]: cantidad },
    });
    return { amonestaciones: s.amonestaciones, apercibimientos: s.apercibimientos };
  }

  /** Asistencia y positivos/negativos por materia: las de su curso y las que tengan registros de antes (si cambió de curso). */
  async asistencia(yo: UsuarioSesion, alumnoId: string) {
    const alumno = await this.verAlumno(yo, alumnoId, "No podés ver la asistencia de este alumno.");
    const [docentes, asistencias, puntos] = await Promise.all([
      alumno.cursoId ? this.prisma.docenteCurso.findMany({ where: { cursoId: alumno.cursoId }, select: { materia: true } }) : [],
      this.prisma.asistencia.findMany({ where: { alumnoId }, select: { materia: true, fecha: true, estado: true }, orderBy: { fecha: "desc" } }),
      this.prisma.punto.findMany({ where: { alumnoId }, select: { materia: true, tipo: true } }),
    ]);
    const nombres = new Set([...docentes, ...asistencias, ...puntos].map((r) => r.materia));
    const materias = [...nombres]
      .sort((a, b) => a.localeCompare(b))
      .map((materia) => {
        const registros = asistencias.filter((a) => a.materia === materia).map((a) => ({ fecha: comoTexto(a.fecha), estado: a.estado }));
        const cuenta = (estado: EstadoAsistencia) => registros.filter((r) => r.estado === estado).length;
        const deLaMateria = puntos.filter((p) => p.materia === materia);
        return {
          materia,
          presente: cuenta("presente"),
          tarde: cuenta("tarde"),
          ausente: cuenta("ausente"),
          positivos: deLaMateria.filter((p) => p.tipo === "positivo").length,
          negativos: deLaMateria.filter((p) => p.tipo === "negativo").length,
          registros,
        };
      });
    return { materias };
  }

  /** El propio alumno, su tutor, el personal que ve a todos los alumnos y (para amonestaciones) el preceptor. */
  private async verAlumno(yo: UsuarioSesion, id: string, mensaje: string, preceptor = false) {
    const alumno = await this.prisma.usuario.findUnique({ where: { id } });
    if (alumno?.rol !== "alumno") throw new NotFoundException("Ese alumno ya no existe.");
    const permitido =
      alumno.id === yo.id || alumno.padreId === yo.id || puede(yo.rol, "alumnos:ver-todos") || (preceptor && puede(yo.rol, "sanciones:editar"));
    if (!permitido) throw new ForbiddenException(mensaje);
    return alumno;
  }
}

@Controller()
export class AlumnosController {
  constructor(private readonly alumnos: AlumnosService) {}

  @Get("cursos/:id/sanciones")
  sancionesDelCurso(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    return this.alumnos.sancionesDelCurso(yo, id);
  }

  @Get("alumnos/:id/sanciones")
  sanciones(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    return this.alumnos.sanciones(yo, id);
  }

  /** { tipo: "amonestaciones" | "apercibimientos", cantidad } */
  @Put("alumnos/:id/sanciones")
  cambiarSanciones(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: { tipo?: unknown; cantidad?: unknown }) {
    return this.alumnos.cambiarSanciones(yo, id, datos);
  }

  @Get("alumnos/:id/asistencia")
  asistencia(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    return this.alumnos.asistencia(yo, id);
  }
}

@Module({
  controllers: [AlumnosController],
  providers: [AlumnosService],
})
export class AlumnosModule {}
