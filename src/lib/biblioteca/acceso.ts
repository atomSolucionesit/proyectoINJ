import "server-only";
import { puede } from "@/lib/auth/permisos";
import type { Sesion } from "@/lib/auth/session";
import type { ArchivoBiblioteca, ReservaImpresion } from "./datos";

function vencido(archivo: ArchivoBiblioteca) {
  return archivo.expira_en !== null && new Date(archivo.expira_en) <= new Date();
}

/** Puede abrir / mandar a imprimir el archivo. */
export function puedeVerArchivo(sesion: Sesion, archivo: ArchivoBiblioteca) {
  if (archivo.subido_por === sesion.uid) return true;
  // La bibliotecaria necesita abrir cualquier archivo para imprimir los pedidos.
  if (puede(sesion.rol, "biblioteca:pedidos") || puede(sesion.rol, "biblioteca:gestionar-archivos")) return true;
  return archivo.visibilidad === "biblioteca" && !vencido(archivo);
}

export function puedeBorrarArchivo(sesion: Sesion, archivo: ArchivoBiblioteca) {
  return archivo.subido_por === sesion.uid || puede(sesion.rol, "biblioteca:gestionar-archivos");
}

export function esDuenoReserva(sesion: Sesion, reserva: ReservaImpresion) {
  return reserva.solicitante === sesion.uid;
}

/** La bibliotecaria solo ve pedidos ya pagados; el dueño ve los suyos siempre. */
export function puedeVerReserva(sesion: Sesion, reserva: ReservaImpresion) {
  return esDuenoReserva(sesion, reserva) || (puede(sesion.rol, "biblioteca:pedidos") && reserva.estado !== "pendiente_pago" && reserva.estado !== "cancelada");
}
