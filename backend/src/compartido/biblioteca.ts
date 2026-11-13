// Copia de src/config/biblioteca.ts del frontend: si cambiás precios o límites, cambialos en los dos.
export const bibliotecaConfig = {
  precios: {
    /** Precio por carilla impresa en blanco y negro. */
    bnPorCarilla: 100,
    /** Precio por carilla impresa a color. */
    colorPorCarilla: 300,
    /** Recargo por anillar cada copia. */
    anilladoPorCopia: 1500,
  },
  /**
   * Los archivos subidos "solo para imprimir" (alumnos, padres, bibliotecaria) se borran solos
   * después de estos días, salvo que tengan un pedido pagado que todavía no se retiró.
   */
  diasArchivoImpresion: 7,
  /** Opciones de permanencia que eligen los profesores al publicar en la biblioteca. `null` = para siempre. */
  duraciones: [
    { dias: null, nombre: "Permanente" },
    { dias: 7, nombre: "1 semana" },
    { dias: 30, nombre: "1 mes" },
    { dias: 90, nombre: "3 meses" },
    { dias: 180, nombre: "6 meses" },
    { dias: 365, nombre: "1 año" },
  ],
  /** Tamaño máximo por archivo subido: 50 MB. */
  tamanoMaximo: 50 * 1024 * 1024,
  /** Extensiones que se pueden subir y su tipo. Se usa la extensión cuando el navegador no informa el tipo (pasa en Windows). */
  extensiones: {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    txt: "text/plain",
  },
  categorias: [
    { id: "apuntes", nombre: "Apuntes" },
    { id: "libros", nombre: "Libros" },
    { id: "examenes", nombre: "Exámenes" },
    { id: "guias", nombre: "Guías y prácticos" },
    { id: "otros", nombre: "Otros" },
  ],
} as const;

export type OpcionesImpresion = {
  paginas: number;
  copias: number;
  color: boolean;
  anillado: boolean;
};

const tiposPermitidos = new Set<string>(Object.values(bibliotecaConfig.extensiones));

/** Extensiones aceptadas, para el `accept` del selector de archivos. */
export const aceptarArchivos = Object.keys(bibliotecaConfig.extensiones)
  .map((ext) => `.${ext}`)
  .join(",");

const extensionDe = (nombre: string) => nombre.split(".").pop()?.toLowerCase() ?? "";

/**
 * Tipo con el que se guarda el archivo, o `null` si no se puede subir.
 * Primero se usa el tipo que informa el navegador y, si no sirve, la extensión del nombre.
 */
export function tipoDeArchivo(nombre: string, tipo: string): string | null {
  if (tiposPermitidos.has(tipo)) return tipo;
  return (bibliotecaConfig.extensiones as Record<string, string>)[extensionDe(nombre)] ?? null;
}

/** Mensaje para un archivo que no se puede subir, con una pista según la extensión. */
export function errorTipoArchivo(nombre: string) {
  const ext = extensionDe(nombre);
  if (ext === "heic" || ext === "heif") {
    return "Las fotos HEIC del iPhone no se pueden imprimir. Pasala a JPG (o sacá una captura) y subila de nuevo.";
  }
  const cual = ext && ext !== nombre.toLowerCase() ? `Los archivos .${ext} no se pueden subir` : "Ese tipo de archivo no se puede subir";
  return `${cual}. Usá PDF, Word, PowerPoint, Excel, JPG, PNG, WEBP o TXT.`;
}

/** Total a cobrar por una impresión, en pesos. Se usa en el formulario y se recalcula en el servidor. */
export function calcularTotal({ paginas, copias, color, anillado }: OpcionesImpresion) {
  const { bnPorCarilla, colorPorCarilla, anilladoPorCopia } = bibliotecaConfig.precios;
  const porCopia = paginas * (color ? colorPorCarilla : bnPorCarilla) + (anillado ? anilladoPorCopia : 0);
  return porCopia * copias;
}
