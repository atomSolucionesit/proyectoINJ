"use server";

import { del, head } from "@vercel/blob";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirSesion } from "@/lib/auth/dal";
import { puede } from "@/lib/auth/permisos";
import { bibliotecaConfig, calcularTotal } from "@/config/biblioteca";
import * as datos from "@/lib/biblioteca/datos";
import { esDuenoReserva, puedeBorrarArchivo, puedeVerArchivo } from "@/lib/biblioteca/acceso";
import { crearPreferencia } from "@/lib/biblioteca/mercadopago";

export type EstadoFormulario = { error?: string } | undefined;

const RUTA = "/panel/biblioteca";

/* ---------- Archivos ---------- */

/**
 * Se llama desde el navegador después de subir el archivo a Vercel Blob, para registrarlo en la base.
 * No redirige: devuelve a dónde ir y el formulario navega.
 */
export async function registrarArchivo(entrada: {
  pathname: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  /** "biblioteca" solo lo pueden elegir los roles con permiso de publicar. */
  destino: string;
  /** Días que queda publicado; vacío = permanente. */
  duracion: string;
}): Promise<{ error: string } | { ok: true; siguiente: string }> {
  const sesion = await requerirSesion();

  const nombre = entrada.nombre.trim().slice(0, 200);
  if (!nombre) return { error: "Poné un nombre para el archivo." };
  if (!entrada.pathname.startsWith("biblioteca/")) return { error: "Archivo inválido." };

  // Alumnos, padres y bibliotecaria solo pueden subir para imprimir: nunca queda publicado.
  const publica = entrada.destino === "biblioteca" && puede(sesion.rol, "biblioteca:publicar");
  let diasDeVida: number | null = bibliotecaConfig.diasArchivoImpresion;
  if (publica) {
    const opcion = bibliotecaConfig.duraciones.find((d) => String(d.dias ?? "") === entrada.duracion);
    if (!opcion) return { error: "Elegí por cuánto tiempo queda publicado." };
    diasDeVida = opcion.dias;
  }

  const categoria = bibliotecaConfig.categorias.some((c) => c.id === entrada.categoria) ? entrada.categoria : "otros";

  // Tomamos tamaño y tipo de Vercel Blob, no de lo que manda el navegador.
  let blob;
  try {
    blob = await head(entrada.pathname);
  } catch {
    return { error: "No se encontró el archivo subido. Probá de nuevo." };
  }

  const id = await datos.crearArchivo({
    nombre,
    descripcion: publica ? entrada.descripcion.trim().slice(0, 1000) || null : null,
    categoria,
    visibilidad: publica ? "biblioteca" : "impresion",
    pathname: blob.pathname,
    url: blob.url,
    tipo: blob.contentType,
    tamano: blob.size,
    subido_por: sesion.uid,
    subido_por_nombre: sesion.nombre,
    diasDeVida,
  });

  revalidatePath(RUTA);
  return { ok: true, siguiente: publica ? RUTA : `${RUTA}/imprimir/${id}` };
}

export async function eliminarArchivo(id: string) {
  const sesion = await requerirSesion();
  const archivo = await datos.obtenerArchivo(id);
  if (!archivo || !puedeBorrarArchivo(sesion, archivo)) return;

  await del(archivo.pathname);
  await datos.borrarArchivo(id);
  refresh();
}

/* ---------- Reservas de impresión ---------- */

function entero(valor: FormDataEntryValue | null, min: number, max: number) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export async function reservarImpresion(archivoId: string, _estado: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const sesion = await requerirSesion();
  const archivo = await datos.obtenerArchivo(archivoId);
  if (!archivo || !puedeVerArchivo(sesion, archivo)) return { error: "El archivo ya no existe." };

  const paginas = entero(formData.get("paginas"), 1, 2000);
  const copias = entero(formData.get("copias"), 1, 100);
  if (!paginas) return { error: "Indicá cuántas carillas tiene (entre 1 y 2000)." };
  if (!copias) return { error: "Indicá la cantidad de copias (entre 1 y 100)." };

  const opciones = {
    paginas,
    copias,
    color: formData.get("color") === "on",
    anillado: formData.get("anillado") === "on",
  };

  const reservaId = await datos.crearReserva({
    ...opciones,
    archivo_id: archivo.id,
    archivo_nombre: archivo.nombre,
    doble_faz: formData.get("doble_faz") === "on",
    notas: String(formData.get("notas") ?? "").trim().slice(0, 500) || null,
    total: calcularTotal(opciones),
    solicitante: sesion.uid,
    solicitante_nombre: sesion.nombre,
  });

  return irAPagar(reservaId);
}

/** Genera un nuevo link de pago para una reserva pendiente. Solo la paga quien la hizo. */
export async function pagarReserva(reservaId: string) {
  const sesion = await requerirSesion();
  const reserva = await datos.obtenerReserva(reservaId);
  if (!reserva || !esDuenoReserva(sesion, reserva)) redirect(RUTA);
  return irAPagar(reservaId);
}

/** Crea el checkout de Mercado Pago y redirige ahí. Siempre termina en un redirect. */
async function irAPagar(reservaId: string): Promise<never> {
  const reserva = await datos.obtenerReserva(reservaId);
  if (!reserva) redirect(RUTA);
  if (reserva.estado !== "pendiente_pago") redirect(`${RUTA}/reservas/${reserva.id}`);

  let url: string;
  try {
    const preferencia = await crearPreferencia(reserva);
    await datos.guardarPreferencia(reserva.id, preferencia.id);
    url = preferencia.url;
  } catch (error) {
    console.error("[biblioteca] Error al crear el pago:", error);
    revalidatePath(RUTA);
    // La reserva queda guardada como pendiente: se puede reintentar desde su detalle.
    redirect(`${RUTA}/reservas/${reserva.id}?error=pago`);
  }

  redirect(url);
}

/**
 * - Cancelar: solo quien hizo el pedido, mientras no esté pagado.
 * - Lista / retirada: solo la bibliotecaria (permiso "biblioteca:pedidos").
 */
export async function cambiarEstadoReserva(reservaId: string, estado: "lista" | "retirada" | "cancelada") {
  const sesion = await requerirSesion();
  const reserva = await datos.obtenerReserva(reservaId);
  if (!reserva) return;

  const autorizado = estado === "cancelada" ? esDuenoReserva(sesion, reserva) : puede(sesion.rol, "biblioteca:pedidos");
  if (!autorizado) return;

  await datos.cambiarEstado(reservaId, estado);
  refresh();
}
