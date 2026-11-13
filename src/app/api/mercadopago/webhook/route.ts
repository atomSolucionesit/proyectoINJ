import { NextResponse, type NextRequest } from "next/server";
import { marcarPagada, obtenerReserva } from "@/lib/biblioteca/datos";
import { firmaWebhookValida, verificarPago } from "@/lib/biblioteca/mercadopago";

// Mercado Pago avisa acá cuando cambia un pago. Solo funciona con el sitio publicado (https),
// en local el pago se confirma al volver del checkout.
export async function POST(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const cuerpo = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string } };

  const tipo = cuerpo.type ?? parametros.get("type");
  const pagoId = String(cuerpo.data?.id ?? parametros.get("data.id") ?? "");

  if (tipo !== "payment" || !pagoId) return new NextResponse(null, { status: 200 });
  if (!firmaWebhookValida(request.headers, parametros.get("data.id") ?? pagoId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    const pago = await verificarPago(pagoId, async (id) => (await obtenerReserva(id))?.total ?? null);
    if (pago) await marcarPagada(pago.reservaId, pago.paymentId);
  } catch (error) {
    console.error("[mercadopago] Error procesando webhook:", error);
    // 500 hace que Mercado Pago reintente más tarde.
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
