import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import type { DatosNuevoAlumno } from "../usuarios/usuarios.service";
import { CursosService, type DatosCurso, type DatosDocente } from "./cursos.service";

@Controller("cursos")
export class CursosController {
  constructor(private readonly cursos: CursosService) {}

  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion) {
    return this.cursos.listar(yo);
  }

  @Post()
  crear(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosCurso) {
    return this.cursos.crear(yo, datos);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    await this.cursos.eliminar(yo, id);
  }

  /* ---------- Profesores por materia ---------- */

  @Post(":id/docentes")
  @HttpCode(204)
  async asignarDocente(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: DatosDocente) {
    await this.cursos.asignarDocente(yo, id, datos);
  }

  @Delete(":id/docentes/:asignacionId")
  @HttpCode(204)
  async quitarDocente(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Param("asignacionId") asignacionId: string) {
    await this.cursos.quitarDocente(yo, id, asignacionId);
  }

  /* ---------- Alumnos ---------- */

  /** Alumno nuevo: crea su cuenta ya anotada en el curso. */
  @Post(":id/alumnos")
  crearAlumno(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: DatosNuevoAlumno) {
    return this.cursos.crearAlumno(yo, id, datos);
  }

  @Put(":id/alumnos/:alumnoId")
  @HttpCode(204)
  async agregarAlumno(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Param("alumnoId") alumnoId: string) {
    await this.cursos.agregarAlumno(yo, id, alumnoId);
  }

  @Delete(":id/alumnos/:alumnoId")
  @HttpCode(204)
  async quitarAlumno(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Param("alumnoId") alumnoId: string) {
    await this.cursos.quitarAlumno(yo, id, alumnoId);
  }
}
