import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Noticia } from "../generated/prisma/client";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { ImagenesNoticias } from "./imagenes-noticias";

/** Campos del formulario (llegan como texto porque el formulario es multipart, por la imagen). */
export type DatosNoticia = {
  titulo?: unknown;
  categoria?: unknown;
  resumen?: unknown;
  contenido?: unknown;
  publicada?: unknown;
  quitarImagen?: unknown;
};

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const siONo = (valor: unknown) => valor === true || valor === "true";

const conAutor = { autor: { select: { nombre: true } } } as const;

/** Lo que ve el sitio público. */
function publicaNoticia({ id, slug, titulo, categoria, resumen, contenido, imagen, publicadaEn, autor }: Noticia & { autor: { nombre: string } | null }) {
  return { id, slug, titulo, categoria, resumen, contenido, imagen, publicadaEn, autorNombre: autor?.nombre ?? null };
}

/** Lo que ve el panel: además, si está publicada y las fechas. */
function panelNoticia(noticia: Noticia & { autor: { nombre: string } | null }) {
  const { publicada, creadoEn, actualizadoEn } = noticia;
  return { ...publicaNoticia(noticia), publicada, creadoEn, actualizadoEn };
}

/** "Apertura de Inscripciones 2026" → "apertura-de-inscripciones-2026" */
function armarSlug(titulo: string) {
  return (
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100)
      .replace(/-+$/, "") || "noticia"
  );
}

@Injectable()
export class NoticiasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imagenes: ImagenesNoticias,
  ) {}

  /* ---------- Sitio público ---------- */

  async publicadas(limite: unknown) {
    const cantidad = Number(limite);
    const noticias = await this.prisma.noticia.findMany({
      where: { publicada: true },
      include: conAutor,
      orderBy: { publicadaEn: "desc" },
      take: Number.isInteger(cantidad) && cantidad > 0 ? Math.min(cantidad, 50) : undefined,
    });
    return noticias.map(publicaNoticia);
  }

  async publicadaPorSlug(slug: string) {
    const noticia = await this.prisma.noticia.findUnique({ where: { slug }, include: conAutor });
    if (!noticia?.publicada) throw new NotFoundException("Esa noticia no existe o ya no está publicada.");
    return publicaNoticia(noticia);
  }

  leerImagen(nombre: string) {
    return this.imagenes.leer(nombre);
  }

  /* ---------- Panel ---------- */

  /** Quien edita ve también los borradores; el resto, solo lo publicado. */
  async listar(yo: UsuarioSesion) {
    const noticias = await this.prisma.noticia.findMany({
      where: puede(yo.rol, "noticias:editar") ? {} : { publicada: true },
      include: conAutor,
      orderBy: { creadoEn: "desc" },
    });
    return noticias.map(panelNoticia);
  }

  async crear(yo: UsuarioSesion, datos: DatosNoticia, imagen: Express.Multer.File | undefined) {
    this.controlar(yo);
    const campos = this.validar(datos);
    const slug = await this.slugLibre(armarSlug(campos.titulo));
    const nombreImagen = imagen ? await this.imagenes.guardar(imagen) : null;

    const noticia = await this.prisma.noticia.create({
      data: { ...campos, slug, imagen: nombreImagen, autorId: yo.id, publicadaEn: campos.publicada ? new Date() : null },
      include: conAutor,
    });
    return panelNoticia(noticia);
  }

  async editar(yo: UsuarioSesion, id: string, datos: DatosNoticia, imagen: Express.Multer.File | undefined) {
    this.controlar(yo);
    const actual = await this.buscar(id);
    const campos = this.validar(datos);

    // Imagen nueva: reemplaza a la anterior. "Quitar imagen": la noticia queda sin foto.
    let nombreImagen = actual.imagen;
    if (imagen) nombreImagen = await this.imagenes.guardar(imagen);
    else if (siONo(datos.quitarImagen)) nombreImagen = null;

    const noticia = await this.prisma.noticia.update({
      where: { id },
      data: {
        ...campos,
        imagen: nombreImagen,
        // La fecha de publicación es la de la primera vez que se publicó.
        publicadaEn: campos.publicada ? (actual.publicadaEn ?? new Date()) : actual.publicadaEn,
      },
      include: conAutor,
    });
    if (nombreImagen !== actual.imagen) await this.imagenes.borrar(actual.imagen);
    return panelNoticia(noticia);
  }

  async eliminar(yo: UsuarioSesion, id: string) {
    this.controlar(yo);
    const noticia = await this.buscar(id);
    await this.prisma.noticia.delete({ where: { id } });
    await this.imagenes.borrar(noticia.imagen);
  }

  /* ---------- Ayudas ---------- */

  private controlar(yo: UsuarioSesion) {
    if (!puede(yo.rol, "noticias:editar")) throw new ForbiddenException("No tenés permiso para publicar noticias.");
  }

  private async buscar(id: string) {
    const noticia = await this.prisma.noticia.findUnique({ where: { id } });
    if (!noticia) throw new NotFoundException("Esa noticia ya no existe. Actualizá la página.");
    return noticia;
  }

  private validar(datos: DatosNoticia) {
    const titulo = texto(datos.titulo);
    const categoria = texto(datos.categoria);
    const resumen = texto(datos.resumen);
    const contenido = texto(datos.contenido);
    if (titulo.length < 5) throw new BadRequestException("Escribí un título de al menos 5 letras.");
    if (titulo.length > 160) throw new BadRequestException("El título puede tener hasta 160 caracteres.");
    if (!categoria) throw new BadRequestException("Elegí una categoría.");
    if (categoria.length > 40) throw new BadRequestException("La categoría puede tener hasta 40 caracteres.");
    if (!resumen) throw new BadRequestException("Escribí un resumen corto: es lo que se ve en el listado.");
    if (resumen.length > 400) throw new BadRequestException("El resumen puede tener hasta 400 caracteres.");
    if (!contenido) throw new BadRequestException("Escribí el texto de la noticia.");
    if (contenido.length > 20_000) throw new BadRequestException("El texto es demasiado largo (máximo 20.000 caracteres).");
    return { titulo, categoria, resumen, contenido, publicada: siONo(datos.publicada) };
  }

  /** Si ya hay una noticia con esa dirección, le agrega -2, -3… */
  private async slugLibre(base: string) {
    const usados = new Set(
      (await this.prisma.noticia.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((n) => n.slug),
    );
    let slug = base;
    for (let i = 2; usados.has(slug); i++) slug = `${base}-${i}`;
    return slug;
  }
}
