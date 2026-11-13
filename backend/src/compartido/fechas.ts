import { BadRequestException } from "@nestjs/common";

/** Hoy en Argentina, como "2026-11-13" (el servidor puede estar en otra zona horaria). */
export function hoyArgentina() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

/** Date (columna DATE) → "2026-11-13". */
export const comoTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** "2026-11-06" → Date (sin hora). Se rechazan fechas inválidas o futuras. */
export function leerFecha(valor: unknown, mensajeFuturo = "No se puede tomar asistencia de un día que todavía no llegó.") {
  const fecha = typeof valor === "string" ? valor.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new BadRequestException("La fecha no es válida.");
  const dia = new Date(`${fecha}T00:00:00.000Z`);
  // Un día de margen por la diferencia horaria entre el navegador y el servidor.
  if (dia.getTime() > Date.now() + 24 * 60 * 60 * 1000) throw new BadRequestException(mensajeFuturo);
  return dia;
}
