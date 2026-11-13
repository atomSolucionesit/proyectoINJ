import "server-only";
import { neon } from "@neondatabase/serverless";

let cliente: ReturnType<typeof neon> | null = null;

/** `true` si hay una base de datos configurada en .env.local. */
export function dbConfigurada() {
  return Boolean(process.env.DATABASE_URL);
}

/** Cliente SQL de Postgres (Neon). Se crea la primera vez que se usa. */
export function db() {
  if (!cliente) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta la variable de entorno DATABASE_URL (ver .env.local).");
    cliente = neon(url);
  }
  return cliente;
}

/** Ejecuta una consulta con parámetros `$1, $2...` y devuelve las filas tipadas. */
export async function consultar<T>(texto: string, parametros: unknown[] = []): Promise<T[]> {
  return (await db().query(texto, parametros)) as T[];
}

export type ProblemaDb = "sin-configurar" | "sin-conexion";

/**
 * Carga datos para una página sin romperla si la base no está lista.
 * Si falta DATABASE_URL no lo registra como error (es esperable mientras se configura);
 * si la base falla de verdad, sí lo registra.
 */
export async function cargarDatos<T>(
  origen: string,
  cargar: () => Promise<T>,
): Promise<{ ok: true; datos: T } | { ok: false; problema: ProblemaDb }> {
  if (!dbConfigurada()) return { ok: false, problema: "sin-configurar" };
  try {
    return { ok: true, datos: await cargar() };
  } catch (error) {
    console.error(`[${origen}]`, error);
    return { ok: false, problema: "sin-conexion" };
  }
}
