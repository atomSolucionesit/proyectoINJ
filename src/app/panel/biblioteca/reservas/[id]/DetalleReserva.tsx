"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { EstadoReserva, estadosReserva } from "@/components/panel/biblioteca/EstadoReserva";
import { puede } from "@/lib/auth/permisos";
import {
  abrirArchivo,
  cambiarEstadoReserva,
  esDuenoReserva,
  pagarReserva,
  puedeVerReserva,
  quienRetira,
  useAlmacen,
  useUsuario,
} from "@/lib/mvp/almacen";
import { nombresPago, SelectorPago } from "@/components/panel/biblioteca/SelectorPago";
import type { MetodoPago, ReservaImpresion, Usuario } from "@/lib/mvp/tipos";
import { cn, formatearFecha, formatearPesos } from "@/lib/utils";

export function DetalleReserva() {
  const { id } = useParams<{ id: string }>();
  const yo = useUsuario();
  const { reservas, archivos } = useAlmacen();
  const reserva = reservas.find((r) => r.id === id);

  // La bibliotecaria no ve pedidos sin pagar; cada uno ve solo los suyos.
  if (!reserva || !puedeVerReserva(yo, reserva)) {
    return (
      <EstadoVacio
        icono="imprimir"
        titulo="Reserva no encontrada"
        descripcion="Puede que no exista o que no tengas acceso."
        accion={{ titulo: "Volver a la biblioteca", href: "/panel/biblioteca" }}
      />
    );
  }

  const archivoDisponible = archivos.some((a) => a.id === reserva.archivoId);

  return (
    <div className="space-y-5">
      {/* Quién retira: nombre y apellido + curso */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 p-6 text-center text-white shadow-lg">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Retira</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">{reserva.solicitanteNombre}</p>
        {reserva.solicitanteCurso && <p className="mt-1 text-lg font-bold text-white">{reserva.solicitanteCurso}</p>}
        <p className="mx-auto mt-3 max-w-xs text-sm text-blue-100">{estadosReserva[reserva.estado].descripcion}</p>
        <EstadoReserva estado={reserva.estado} className="mt-4" />
      </div>

      <Progreso reserva={reserva} />

      {/* Detalle */}
      <Tarjeta className="p-4 sm:p-6">
        <h2 className="font-bold text-slate-900">{reserva.archivoNombre}</h2>
        {!esDuenoReserva(yo, reserva) && (
          <p className="mt-0.5 text-sm text-slate-500">
            Pedido de <strong className="text-slate-700">{reserva.solicitanteNombre}</strong>
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Dato titulo="Carillas" valor={reserva.paginas} />
          <Dato titulo="Copias" valor={reserva.copias} />
          <Dato titulo="Faz" valor={reserva.dobleFaz ? "Doble faz" : "Simple faz"} />
          {reserva.metodoPago && <Dato titulo="Forma de pago" valor={nombresPago[reserva.metodoPago]} />}
          <Dato titulo="Reservada" valor={formatearFecha(reserva.creadoEn)} />
          {reserva.pagadoEn && (
            <Dato titulo={reserva.metodoPago === "efectivo" ? "Confirmada" : "Pagada"} valor={formatearFecha(reserva.pagadoEn)} />
          )}
          {archivoDisponible && reserva.archivoId && (
            <div>
              <dt className="text-slate-500">Archivo</dt>
              <dd>
                <button type="button" onClick={() => void abrirArchivo(reserva.archivoId!)} className="font-semibold text-blue-800 hover:underline">
                  Abrir
                </button>
              </dd>
            </div>
          )}
        </dl>
        {reserva.notas && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">“{reserva.notas}”</p>}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-slate-500">Total</span>
          <span className="text-2xl font-extrabold text-slate-900">{formatearPesos(reserva.total)}</span>
        </div>
      </Tarjeta>

      <Acciones reserva={reserva} yo={yo} />
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{titulo}</dt>
      <dd className="font-semibold text-slate-900">{valor}</dd>
    </div>
  );
}

const etapas = ["pendiente_pago", "pagada", "lista", "retirada"] as const;
const titulosEtapa = ["Reservada", "Pagada", "Lista", "Retirada"];

function Progreso({ reserva }: { reserva: ReservaImpresion }) {
  if (reserva.estado === "cancelada") return null;
  const actual = etapas.indexOf(reserva.estado);

  return (
    <ol className="grid grid-cols-4 gap-1">
      {titulosEtapa.map((titulo, i) => {
        // "Reservada" se completa al pagar; el resto cuando llega a esa etapa.
        const hecho = i < actual || (i === actual && i > 0);
        return (
          <li key={titulo} className="text-center">
            <div className={cn("h-1.5 rounded-full", hecho ? "bg-blue-700" : i === actual ? "bg-amber-400" : "bg-slate-200")} />
            <p className={cn("mt-1.5 text-[11px] font-semibold", hecho || i === actual ? "text-slate-800" : "text-slate-400")}>{titulo}</p>
          </li>
        );
      })}
    </ol>
  );
}

const botonPrimario =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-60";

/** Quien pidió: paga o cancela. Bibliotecaria: marca lista / retirada. */
function Acciones({ reserva, yo }: { reserva: ReservaImpresion; yo: Usuario }) {
  // Recién reservada (?pagar=1&metodo=…): se muestra el pago con la forma elegida, sin pasos extra.
  const parametros = useSearchParams();
  const metodoInicial = (["efectivo", "mercadopago"] as const).find((m) => m === parametros.get("metodo")) ?? null;
  const [metodo, setMetodo] = useState<MetodoPago | null>(metodoInicial);
  const [pagando, setPagando] = useState(parametros.get("pagar") === "1" && metodoInicial !== null);
  const dueno = esDuenoReserva(yo, reserva);
  const bibliotecaria = puede(yo.rol, "biblioteca:pedidos");
  const efectivo = reserva.metodoPago === "efectivo";

  if (reserva.estado === "pendiente_pago" && dueno) {
    if (pagando && metodo) return <PagoSimulado reserva={reserva} metodo={metodo} onCancelar={() => setPagando(false)} />;
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
          La biblioteca todavía no recibió tu pedido: le llega recién cuando lo pagás.
        </p>
        <SelectorPago valor={metodo} onChange={setMetodo} />
        <button
          type="button"
          onClick={() => setPagando(true)}
          disabled={!metodo}
          className={cn(botonPrimario, metodo === "efectivo" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#009ee3] hover:bg-[#008ac6]")}
        >
          <Icono nombre="pago" className="h-4 w-4" />
          {metodo ? `Pagar ${formatearPesos(reserva.total)}` : "Elegí cómo vas a pagar"}
        </button>
        <button
          type="button"
          onClick={() => confirm("¿Cancelar esta reserva?") && void cambiarEstadoReserva(reserva.id, "cancelada")}
          className="w-full rounded-xl py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Cancelar reserva
        </button>
      </div>
    );
  }

  if (reserva.estado === "pagada" && bibliotecaria) {
    return (
      <button type="button" onClick={() => void cambiarEstadoReserva(reserva.id, "lista")} className={cn(botonPrimario, "bg-emerald-600 hover:bg-emerald-700")}>
        <Icono nombre="imprimir" className="h-4 w-4" />
        Marcar como impresa y lista para retirar
      </button>
    );
  }

  if (reserva.estado === "lista" && bibliotecaria) {
    return (
      <div className="space-y-2">
        {efectivo && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
            💵 Cobrar {formatearPesos(reserva.total)} en efectivo al entregar.
          </p>
        )}
        <button
        type="button"
        onClick={() =>
          confirm(`¿Confirmás que se le entregó la impresión a ${quienRetira(reserva)}?`) && void cambiarEstadoReserva(reserva.id, "retirada")
        }
        className={cn(botonPrimario, "bg-blue-800 hover:bg-blue-900")}
      >
          <Icono nombre="check" className="h-4 w-4" />
          {efectivo ? "Cobrado y entregado" : "Marcar como retirada"}
        </button>
      </div>
    );
  }

  if (reserva.estado === "pagada" || reserva.estado === "lista") {
    const cobrar = efectivo ? ` Llevá ${formatearPesos(reserva.total)} en efectivo.` : "";
    return (
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">
        {reserva.estado === "pagada"
          ? `La biblioteca ya recibió tu pedido. Vas a ver acá cuando esté listo.${cobrar}`
          : `Pasá por la biblioteca y decí tu nombre y curso: ${quienRetira(reserva)}.${cobrar}`}
      </p>
    );
  }

  return null;
}

/**
 * MVP: simula el pago. Mercado Pago: en la versión final este paso abre el checkout.
 * Efectivo: el pedido se manda a la biblioteca y se paga al retirarlo.
 */
function PagoSimulado({ reserva, metodo, onCancelar }: { reserva: ReservaImpresion; metodo: MetodoPago; onCancelar: () => void }) {
  const [procesando, setProcesando] = useState(false);
  const efectivo = metodo === "efectivo";

  return (
    <Tarjeta className="overflow-hidden">
      <div className={cn("flex items-center justify-between px-5 py-3 text-white", efectivo ? "bg-emerald-600" : "bg-[#009ee3]")}>
        <span className="font-bold">{efectivo ? "💵 Pago en efectivo" : "Mercado Pago (prueba)"}</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">MVP</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Impresión: {reserva.archivoNombre}</span>
          <span className="text-xl font-extrabold text-slate-900">{formatearPesos(reserva.total)}</span>
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {efectivo
            ? `Al confirmar, la biblioteca recibe tu pedido. Pagás ${formatearPesos(reserva.total)} en efectivo cuando lo retirás.`
            : "Esta versión no cobra de verdad. En la versión final este paso abre Mercado Pago y el pedido se confirma cuando se acredita el pago."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancelar} disabled={procesando} className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Volver
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={async () => {
              setProcesando(true);
              // Si sale bien la pantalla cambia sola; si falla, aparece el aviso y se puede reintentar.
              if (!(await pagarReserva(reserva.id, metodo))) setProcesando(false);
            }}
            className={cn(botonPrimario, efectivo ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#009ee3] hover:bg-[#008ac6]")}
          >
            <Icono nombre="check" className="h-4 w-4" />
            {procesando ? "Procesando…" : efectivo ? "Confirmar pedido" : "Confirmar pago"}
          </button>
        </div>
      </div>
    </Tarjeta>
  );
}
