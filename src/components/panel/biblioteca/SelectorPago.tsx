"use client";

import type { MetodoPago } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";
import { Icono } from "../Icono";

export const nombresPago: Record<MetodoPago, string> = { efectivo: "Efectivo", mercadopago: "Mercado Pago" };

const opciones: { metodo: MetodoPago; detalle: string; elegido: string }[] = [
  { metodo: "efectivo", detalle: "Pagás en la biblioteca al retirar", elegido: "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200" },
  { metodo: "mercadopago", detalle: "Pagás ahora desde el celular", elegido: "border-[#009ee3] bg-sky-50 text-sky-900 ring-2 ring-sky-200" },
];

/** Dos botones para elegir cómo pagar. Hay que elegir uno antes de poder pagar. */
export function SelectorPago({ valor, onChange }: { valor: MetodoPago | null; onChange: (m: MetodoPago) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-slate-900">¿Cómo vas a pagar?</legend>
      <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-3">
        {opciones.map((o) => {
          const elegido = valor === o.metodo;
          return (
            <button
              key={o.metodo}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => onChange(o.metodo)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-center transition-all active:scale-[0.98]",
                elegido ? o.elegido : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
              )}
            >
              <span className="flex items-center gap-2 text-base font-bold">
                {o.metodo === "efectivo" ? <span aria-hidden>💵</span> : <Icono nombre="pago" className="h-5 w-5" />}
                {nombresPago[o.metodo]}
                {elegido && <Icono nombre="check" className="h-5 w-5" />}
              </span>
              <span className="text-xs text-slate-500">{o.detalle}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
