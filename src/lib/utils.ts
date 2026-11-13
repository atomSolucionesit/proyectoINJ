/** Une clases de Tailwind ignorando valores vacíos. */
export function cn(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

/** Indica si `href` corresponde a la ruta actual (o a una subruta suya). */
export function esRutaActiva(pathname: string, href: string, raiz = "/panel") {
  return href === raiz ? pathname === raiz : pathname === href || pathname.startsWith(`${href}/`);
}

/** `1500` → `$ 1.500` */
export function formatearPesos(monto: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto);
}

/** `2400000` → `2,3 MB` */
export function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString("es-AR", { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`;
}

/** Fecha y hora corta en horario de Argentina. */
export function formatearFecha(fecha: Date | string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(fecha));
}

/** Solo la fecha, ej: `12 nov 2026`. */
export function formatearDia(fecha: Date | string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(fecha));
}
