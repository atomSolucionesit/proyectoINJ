import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";
import type { ReservaImpresion } from "./datos";

const API = "https://api.mercadopago.com";

function token() {
  const valor = process.env.MP_ACCESS_TOKEN;
  if (!valor) throw new Error("Falta la variable de entorno MP_ACCESS_TOKEN (ver .env.local).");
  return valor;
}

/** URL pública del sitio, para que Mercado Pago sepa a dónde volver. */
function urlSitio() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!respuesta.ok) {
    throw new Error(`Mercado Pago respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  return respuesta.json() as Promise<T>;
}

/** Crea un checkout de Mercado Pago para la reserva y devuelve el link de pago. */
export async function crearPreferencia(reserva: Pick<ReservaImpresion, "id" | "archivo_nombre" | "copias" | "total" | "codigo_retiro">) {
  const base = urlSitio();
  const volver = `${base}/panel/biblioteca/reservas/${reserva.id}`;
  // Mercado Pago no acepta auto_return ni webhooks apuntando a localhost.
  const esPublico = base.startsWith("https://");

  const preferencia = await llamar<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: reserva.id,
          title: `Impresión: ${reserva.archivo_nombre}`.slice(0, 250),
          description: `${reserva.copias} copia(s) • Código de retiro ${reserva.codigo_retiro}`,
          quantity: 1,
          unit_price: reserva.total,
          currency_id: "ARS",
        },
      ],
      external_reference: reserva.id,
      statement_descriptor: siteConfig.sigla,
      back_urls: { success: volver, pending: volver, failure: volver },
      ...(esPublico && { auto_return: "approved", notification_url: `${base}/api/mercadopago/webhook` }),
    }),
  });

  return { id: preferencia.id, url: preferencia.init_point };
}

type Pago = {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
};

/**
 * Consulta un pago directamente a Mercado Pago (nunca confiamos en lo que llega por la URL)
 * y devuelve el id de la reserva si el pago está aprobado y cubre el total.
 */
export async function verificarPago(paymentId: string, totalEsperado?: (reservaId: string) => Promise<number | null>) {
  if (!/^\d+$/.test(paymentId)) return null;
  const pago = await llamar<Pago>(`/v1/payments/${paymentId}`);
  if (pago.status !== "approved" || pago.currency_id !== "ARS" || !pago.external_reference) return null;

  if (totalEsperado) {
    const total = await totalEsperado(pago.external_reference);
    if (total === null || pago.transaction_amount < total) return null;
  }
  return { reservaId: pago.external_reference, paymentId: String(pago.id) };
}

/**
 * Valida la firma `x-signature` de los webhooks de Mercado Pago.
 * Si no se configuró MP_WEBHOOK_SECRET se omite (igual se verifica el pago contra la API).
 */
export function firmaWebhookValida(headers: Headers, dataId: string) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;

  const partes = Object.fromEntries(
    (headers.get("x-signature") ?? "").split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  if (!partes.ts || !partes.v1) return false;

  const manifiesto = `id:${dataId.toLowerCase()};request-id:${headers.get("x-request-id") ?? ""};ts:${partes.ts};`;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(manifiesto).digest("hex"));
  const recibida = Buffer.from(partes.v1);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
