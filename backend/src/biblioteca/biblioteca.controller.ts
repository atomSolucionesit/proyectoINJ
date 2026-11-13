import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { bibliotecaConfig } from "../compartido/biblioteca";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { BibliotecaService, type DatosArchivo, type DatosReserva } from "./biblioteca.service";

@Controller("biblioteca")
export class BibliotecaController {
  constructor(private readonly biblioteca: BibliotecaService) {}

  /* ---------- Archivos ---------- */

  @Get("archivos")
  listarArchivos(@UsuarioActual() yo: UsuarioSesion) {
    return this.biblioteca.listarArchivos(yo);
  }

  /** multipart/form-data con el campo "archivo" y los datos (nombre, descripcion, categoria, destino, duracion). */
  @Post("archivos")
  @UseInterceptors(FileInterceptor("archivo", { limits: { fileSize: bibliotecaConfig.tamanoMaximo } }))
  subirArchivo(@UsuarioActual() yo: UsuarioSesion, @UploadedFile() archivo: Express.Multer.File | undefined, @Body() datos: DatosArchivo) {
    return this.biblioteca.subirArchivo(yo, archivo, datos);
  }

  @Get("archivos/:id/contenido")
  async contenido(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    const { archivo, contenido } = await this.biblioteca.contenidoArchivo(yo, id);
    return new StreamableFile(contenido, {
      type: archivo.tipo,
      length: archivo.tamano,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombreOriginal)}`,
    });
  }

  @Delete("archivos/:id")
  @HttpCode(204)
  async eliminarArchivo(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    await this.biblioteca.eliminarArchivo(yo, id);
  }

  /* ---------- Reservas ---------- */

  @Get("reservas")
  listarReservas(@UsuarioActual() yo: UsuarioSesion) {
    return this.biblioteca.listarReservas(yo);
  }

  @Post("reservas")
  reservar(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosReserva) {
    return this.biblioteca.reservar(yo, datos);
  }

  @Post("reservas/:id/pagar")
  @HttpCode(200)
  pagar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() body: { metodo?: unknown }) {
    return this.biblioteca.pagar(yo, id, body?.metodo);
  }

  @Patch("reservas/:id/estado")
  cambiarEstado(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() body: { estado?: unknown }) {
    return this.biblioteca.cambiarEstado(yo, id, body.estado);
  }
}
