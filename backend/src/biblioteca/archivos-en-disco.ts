import { Injectable } from "@nestjs/common";
import { createReadStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Guarda el contenido de los archivos de la biblioteca en una carpeta (UPLOAD_DIR), con el id como nombre. */
@Injectable()
export class ArchivosEnDisco {
  private readonly carpeta = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

  private ruta(id: string) {
    // Los ids son UUID, pero por las dudas nunca se sale de la carpeta.
    return path.join(this.carpeta, path.basename(id));
  }

  async guardar(id: string, contenido: Buffer) {
    await mkdir(this.carpeta, { recursive: true });
    await writeFile(this.ruta(id), contenido);
  }

  leer(id: string) {
    return createReadStream(this.ruta(id));
  }

  async borrar(id: string) {
    await rm(this.ruta(id), { force: true });
  }
}
