import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { AsistenciaService, type DatosAsistencia } from "./asistencia.service";

@Controller("cursos/:id/asistencia")
export class AsistenciaController {
  constructor(private readonly asistencia: AsistenciaService) {}

  /** ?materia=Matemática&fecha=2026-11-06 */
  @Get()
  delDia(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Query("materia") materia: unknown, @Query("fecha") fecha: unknown) {
    return this.asistencia.delDia(yo, id, materia, fecha);
  }

  /** { materia, fecha, registros: [{ alumnoId, estado: "presente" | "tarde" | "ausente" }] } */
  @Put()
  guardar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: DatosAsistencia) {
    return this.asistencia.guardar(yo, id, datos);
  }

  /** ?materia=Matemática */
  @Get("resumen")
  resumen(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Query("materia") materia: unknown) {
    return this.asistencia.resumen(yo, id, materia);
  }
}
