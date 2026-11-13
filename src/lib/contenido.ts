/**
 * Noticias y eventos: lo comparten el sitio público (Server Components) y el panel.
 * Las funciones `leer…` piden los datos a la API sin sesión (rutas /publico del backend).
 */

import type { Evento, Noticia } from "@/lib/mvp/tipos";
import { eventosPublicosEjemplo, MODO_DEMO, noticiasPublicasEjemplo } from "@/lib/mvp/datosDemo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Categorías sugeridas (se puede escribir otra). */
export const categoriasNoticias = ["Institucional", "Académico", "Comunidad", "Deportes", "Cultura", "Pastoral", "Infraestructura"];
export const categoriasEventos = ["Institucional", "Académico", "Deportes", "Cultura", "Pastoral", "Reunión"];

/** Las imágenes del sitio ("/images/…") se sirven desde Next; las subidas, desde la API. */
export function urlImagen(imagen: string) {
  // "data:…": imagen subida en el modo demo (queda guardada en el navegador).
  return imagen.startsWith("/") || imagen.startsWith("data:") ? imagen : `${API}/publico/imagenes/${encodeURIComponent(imagen)}`;
}

/** Las imágenes subidas vienen de la API (en desarrollo, localhost): se muestran tal cual, sin el optimizador de Next. */
export const esImagenSubida = (imagen: string) => !imagen.startsWith("/");

/** "Párrafo uno\n\nPárrafo dos" → ["Párrafo uno", "Párrafo dos"] */
export const parrafos = (texto: string) =>
  texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Fecha de publicación, ej: "3 de noviembre de 2026". */
export function fechaNoticia(fecha: string | null) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(fecha));
}

// Las fechas de los eventos son solo el día ("2026-11-14"): se leen en UTC para que no se corran por la zona horaria.
const diaUTC = (fecha: string) => new Date(`${fecha}T12:00:00.000Z`);
const formato = (opciones: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-AR", { ...opciones, timeZone: "UTC" });

/** "2026-11-14" → { dia: "14", mes: "NOV", anio: "2026" } para el bloque de fecha. */
export function partesFecha(fecha: string) {
  const d = diaUTC(fecha);
  return {
    dia: formato({ day: "2-digit" }).format(d),
    mes: formato({ month: "short" }).format(d).replace(".", "").toUpperCase(),
    anio: formato({ year: "numeric" }).format(d),
  };
}

/** "2026-11-14" → "sábado 14 de noviembre" */
export const fechaEvento = (fecha: string) => formato({ weekday: "long", day: "numeric", month: "long" }).format(diaUTC(fecha));

/** Hoy en Argentina, como "2026-11-10". */
export const hoyEnArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

/* ---------- Lectura para el sitio público ---------- */

/** `null` si no se pudo hablar con la API (el sitio muestra un aviso en vez de romperse). */
async function leer<T>(ruta: string): Promise<T | null> {
  try {
    const respuesta = await fetch(`${API}/publico${ruta}`, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) return null;
    return (await respuesta.json()) as T;
  } catch {
    return null;
  }
}

// En el modo demo el sitio muestra las noticias y eventos de ejemplo (lo que se carga en el panel queda en el navegador).
export const leerNoticias = async (limite?: number) =>
  MODO_DEMO ? noticiasPublicasEjemplo.slice(0, limite) : leer<Noticia[]>(`/noticias${limite ? `?limite=${limite}` : ""}`);

export const leerEventos = async () => (MODO_DEMO ? eventosPublicosEjemplo : leer<Evento[]>("/eventos"));

/** La noticia publicada, `"no-existe"` si no está (o no está publicada) y `null` si la API no respondió. */
export async function leerNoticia(slug: string): Promise<Noticia | "no-existe" | null> {
  if (MODO_DEMO) return noticiasPublicasEjemplo.find((n) => n.slug === slug) ?? "no-existe";
  try {
    const respuesta = await fetch(`${API}/publico/noticias/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(8000) });
    if (respuesta.status === 404) return "no-existe";
    return respuesta.ok ? ((await respuesta.json()) as Noticia) : null;
  } catch {
    return null;
  }
}
