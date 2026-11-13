import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

/** Tamaño máximo de la imagen de una noticia: 5 MB. */
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

/** Formatos aceptados, con los primeros bytes de cada uno (así no se cuela otro tipo de archivo renombrado). */
const formatos = [
  { extension: "jpg", tipo: "image/jpeg", firma: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extension: "png", tipo: "image/png", firma: (b: Buffer) => b.subarray(0, 4).toString("hex") === "89504e47" },
  { extension: "webp", tipo: "image/webp", firma: (b: Buffer) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

/** Las imágenes del sitio (carpeta public/images del frontend) se guardan como ruta; las subidas, como nombre de archivo. */
export const esImagenDelSitio = (imagen: string) => imagen.startsWith("/");

/** Guarda las imágenes de las noticias en UPLOAD_DIR/noticias, con un nombre al azar. */
@Injectable()
export class ImagenesNoticias {
  private readonly carpeta = path.join(path.resolve(process.env.UPLOAD_DIR ?? "./uploads"), "noticias");

  private ruta(nombre: string) {
    // Nunca se sale de la carpeta, aunque pidan "../algo".
    return path.join(this.carpeta, path.basename(nombre));
  }

  /** Valida la imagen y la guarda. Devuelve el nombre con el que quedó. */
  async guardar(archivo: Express.Multer.File) {
    if (archivo.size === 0) throw new BadRequestException("La imagen está vacía. Elegila de nuevo.");
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      throw new BadRequestException(`La imagen supera el máximo de ${TAMANO_MAXIMO_IMAGEN / 1024 / 1024} MB. Probá con una más liviana.`);
    }
    const formato = formatos.find((f) => f.firma(archivo.buffer));
    if (!formato) throw new BadRequestException("La imagen tiene que ser JPG, PNG o WebP.");

    const nombre = `${randomUUID()}.${formato.extension}`;
    await mkdir(this.carpeta, { recursive: true });
    await writeFile(this.ruta(nombre), archivo.buffer);
    return nombre;
  }

  async leer(nombre: string) {
    const formato = formatos.find((f) => nombre.endsWith(`.${f.extension}`));
    const ruta = this.ruta(nombre);
    const info = formato ? await stat(ruta).catch(() => null) : null;
    if (!formato || !info?.isFile()) throw new NotFoundException("La imagen ya no existe.");
    return { contenido: createReadStream(ruta), tipo: formato.tipo, tamano: info.size };
  }

  /** Borra una imagen subida (las del sitio no se tocan). */
  async borrar(imagen: string | null) {
    if (imagen && !esImagenDelSitio(imagen)) await rm(this.ruta(imagen), { force: true });
  }
}
