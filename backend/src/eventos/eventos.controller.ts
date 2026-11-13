import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { Publica, UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { EventosService, type DatosEvento } from "./eventos.service";

/** Lo que lee el sitio público (sin sesión). */
@Controller("publico/eventos")
@Publica()
export class EventosPublicosController {
  constructor(private readonly eventos: EventosService) {}

  @Get()
  proximos() {
    return this.eventos.proximos();
  }
}

@Controller("eventos")
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  @Get()
  listar() {
    return this.eventos.listar();
  }

  /** { titulo, fecha: "2026-11-14", horario, lugar, categoria, descripcion } */
  @Post()
  crear(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosEvento) {
    return this.eventos.crear(yo, datos);
  }

  @Put(":id")
  editar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: DatosEvento) {
    return this.eventos.editar(yo, id, datos);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    await this.eventos.eliminar(yo, id);
  }
}
