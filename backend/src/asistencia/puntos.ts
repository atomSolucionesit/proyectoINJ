import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Injectable, Param, Post, Query } from "@nestjs/common";
import type { TipoPunto } from "../generated/prisma/client";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { PrismaService } from "../prisma/prisma.service";
import { AsistenciaService } from "./asistencia.service";

const tipos: TipoPunto[] = ["positivo", "negativo"];
const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

/** Positivos y negativos: los pone quien toma asistencia en esa materia (el profesor, solo en las suyas). */
@Injectable()
export class PuntosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asistencia: AsistenciaService,
  ) {}

  /** Cuántos positivos y negativos tiene cada alumno del curso en la materia. */
  async listar(yo: UsuarioSesion, cursoId: string, materia: unknown) {
    const { nombreMateria } = await this.asistencia.materiaPermitida(yo, cursoId, materia);
    const grupos = await this.prisma.punto.groupBy({ by: ["alumnoId", "tipo"], where: { cursoId, materia: nombreMateria }, _count: { _all: true } });
    const puntos: Record<string, Record<TipoPunto, number>> = {};
    for (const { alumnoId, tipo, _count } of grupos) {
      puntos[alumnoId] ??= { positivo: 0, negativo: 0 };
      puntos[alumnoId][tipo] = _count._all;
    }
    return { puntos };
  }

  async poner(yo: UsuarioSesion, cursoId: string, datos: { materia?: unknown; tipo?: unknown; alumnoId?: unknown }) {
    const { nombreMateria } = await this.asistencia.materiaPermitida(yo, cursoId, datos.materia);
    const tipo = tipos.find((t) => t === datos.tipo);
    if (!tipo) throw new BadRequestException("Elegí positivo o negativo.");
    const alumnoId = texto(datos.alumnoId);
    const alumno = await this.prisma.usuario.findFirst({ where: { id: alumnoId, rol: "alumno", cursoId } });
    if (!alumno) throw new BadRequestException("Ese alumno ya no está en este curso. Actualizá la página.");
    const punto = await this.prisma.punto.create({ data: { cursoId, materia: nombreMateria, alumnoId, tipo, puestoPorId: yo.id } });
    return { id: punto.id };
  }

  async quitar(yo: UsuarioSesion, cursoId: string, id: string) {
    const punto = await this.prisma.punto.findFirst({ where: { id, cursoId } });
    if (!punto) return;
    await this.asistencia.materiaPermitida(yo, cursoId, punto.materia);
    await this.prisma.punto.delete({ where: { id } });
  }
}

@Controller("cursos/:id/puntos")
export class PuntosController {
  constructor(private readonly puntos: PuntosService) {}

  /** ?materia=Matemática */
  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Query("materia") materia: unknown) {
    return this.puntos.listar(yo, id, materia);
  }

  /** { materia, alumnoId, tipo: "positivo" | "negativo" } */
  @Post()
  poner(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: { materia?: unknown; tipo?: unknown; alumnoId?: unknown }) {
    return this.puntos.poner(yo, id, datos);
  }

  @Delete(":puntoId")
  @HttpCode(204)
  async quitar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Param("puntoId") puntoId: string) {
    await this.puntos.quitar(yo, id, puntoId);
  }
}
