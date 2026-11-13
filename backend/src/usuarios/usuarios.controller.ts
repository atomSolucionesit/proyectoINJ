import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { UsuariosService, type DatosCuenta, type DatosFamilia, type DatosNuevoUsuario } from "./usuarios.service";

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion) {
    return this.usuarios.listar(yo);
  }

  @Post()
  crear(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosNuevoUsuario) {
    return this.usuarios.crear(yo, datos);
  }

  /** Tutor/a con sus hijos/as: { tutor: {...}, hijos: [{..., cursoId}] }. */
  @Post("familia")
  crearFamilia(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosFamilia) {
    return this.usuarios.crearFamilia(yo, datos);
  }

  @Put(":id")
  editar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: DatosCuenta) {
    return this.usuarios.editar(yo, id, datos);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    await this.usuarios.eliminar(yo, id);
  }
}
