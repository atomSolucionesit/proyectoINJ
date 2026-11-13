import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { bibliotecaConfig } from "../compartido/biblioteca";
import { Publica, UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { NoticiasService, type DatosNoticia } from "./noticias.service";

// Se acepta hasta el máximo general para poder responder "la imagen supera los 5 MB" en vez de un error genérico.
const conImagen = FileInterceptor("imagen", { limits: { fileSize: bibliotecaConfig.tamanoMaximo } });

/** Lo que lee el sitio público (sin sesión). */
@Controller("publico")
@Publica()
export class NoticiasPublicasController {
  constructor(private readonly noticias: NoticiasService) {}

  /** ?limite=3 para las últimas. */
  @Get("noticias")
  publicadas(@Query("limite") limite: unknown) {
    return this.noticias.publicadas(limite);
  }

  @Get("noticias/:slug")
  publicada(@Param("slug") slug: string) {
    return this.noticias.publicadaPorSlug(slug);
  }

  /** Los nombres son al azar y nunca se reutilizan: el navegador la puede guardar para siempre. */
  @Get("imagenes/:archivo")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async imagen(@Param("archivo") archivo: string) {
    const { contenido, tipo, tamano } = await this.noticias.leerImagen(archivo);
    return new StreamableFile(contenido, { type: tipo, length: tamano });
  }
}

@Controller("noticias")
export class NoticiasController {
  constructor(private readonly noticias: NoticiasService) {}

  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion) {
    return this.noticias.listar(yo);
  }

  /** multipart/form-data: titulo, categoria, resumen, contenido, publicada ("true"/"false") e "imagen" (opcional). */
  @Post()
  @UseInterceptors(conImagen)
  crear(@UsuarioActual() yo: UsuarioSesion, @Body() datos: DatosNoticia, @UploadedFile() imagen: Express.Multer.File | undefined) {
    return this.noticias.crear(yo, datos, imagen);
  }

  /** Igual que crear, más "quitarImagen" ("true") para dejarla sin foto. */
  @Put(":id")
  @UseInterceptors(conImagen)
  editar(
    @UsuarioActual() yo: UsuarioSesion,
    @Param("id") id: string,
    @Body() datos: DatosNoticia,
    @UploadedFile() imagen: Express.Multer.File | undefined,
  ) {
    return this.noticias.editar(yo, id, datos, imagen);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    await this.noticias.eliminar(yo, id);
  }
}
