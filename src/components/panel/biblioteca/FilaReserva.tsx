import Link from "next/link";
import { quienRetira } from "@/lib/mvp/almacen";
import type { ReservaImpresion } from "@/lib/mvp/tipos";
import { formatearFecha, formatearPesos } from "@/lib/utils";
import { Icono } from "../Icono";
import { EstadoReserva } from "./EstadoReserva";

/** `pedido`: vista de la bibliotecaria, muestra quién lo pidió y desde cuándo está pagado. */
export function FilaReserva({ reserva, pedido = false }: { reserva: ReservaImpresion; pedido?: boolean }) {
  return (
    <Link
      href={`/panel/biblioteca/reservas/${reserva.id}`}
      className="group flex items-center gap-3 p-4 transition-colors hover:bg-slate-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
        <Icono nombre="imprimir" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold text-slate-900">{reserva.archivoNombre}</p>
          <EstadoReserva estado={reserva.estado} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {pedido && <span className="font-semibold text-slate-700">{quienRetira(reserva)} • </span>}
          {reserva.copias} {reserva.copias === 1 ? "copia" : "copias"}
          {reserva.metodoPago === "efectivo" ? " • 💵 efectivo" : reserva.metodoPago === "mercadopago" ? " • Mercado Pago" : ""} •{" "}
          {pedido && reserva.pagadoEn ? `pagado ${formatearFecha(reserva.pagadoEn)}` : formatearFecha(reserva.creadoEn)}
        </p>
      </div>
      <span className="text-right">
        <span className="block font-bold text-slate-900">{formatearPesos(reserva.total)}</span>
      </span>
      <Icono nombre="flecha" className="h-4 w-4 text-slate-300 group-hover:text-blue-700" />
    </Link>
  );
}
