"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reservarImpresion } from "@/lib/mvp/almacen";
import { bibliotecaConfig, calcularTotal } from "@/config/biblioteca";
import { Icono } from "@/components/panel/Icono";
import { SelectorPago } from "@/components/panel/biblioteca/SelectorPago";
import type { MetodoPago } from "@/lib/mvp/tipos";
import { cn, formatearPesos } from "@/lib/utils";

const { precios } = bibliotecaConfig;

/** Siempre en blanco y negro y sin anillar (color y anillado no se ofrecen). */
export function ReservaForm({ archivoId }: { archivoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [paginas, setPaginas] = useState(1);
  const [copias, setCopias] = useState(1);
  const [dobleFaz, setDobleFaz] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);

  const total = calcularTotal({ paginas: paginas || 0, copias: copias || 0, color: false, anillado: false });

  async function reservar(formData: FormData) {
    if (!metodo) return setError("Elegí cómo vas a pagar: efectivo o Mercado Pago.");
    setPending(true);
    setError(null);
    const resultado = await reservarImpresion(archivoId, {
      paginas,
      copias,
      color: false,
      anillado: false,
      dobleFaz,
      notas: String(formData.get("notas") ?? ""),
    });
    if ("error" in resultado) {
      setError(resultado.error);
      setPending(false);
      return;
    }
    // El pago se hace en el detalle de la reserva: se abre directo en el paso de pago.
    router.push(`/panel/biblioteca/reservas/${resultado.id}?pagar=1&metodo=${metodo}`);
  }

  return (
    <form action={reservar} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Contador
          nombre="paginas"
          titulo="Carillas"
          ayuda="Páginas a imprimir"
          valor={paginas}
          onChange={setPaginas}
          max={2000}
        />
        <Contador nombre="copias" titulo="Copias" ayuda="Juegos completos" valor={copias} onChange={setCopias} max={100} />
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <Opcion nombre="doble_faz" titulo="Doble faz" detalle="Imprime de los dos lados de la hoja" activo={dobleFaz} onChange={setDobleFaz} />
      </div>
      <p className="-mt-2 text-xs text-slate-500">Impresión en blanco y negro: {formatearPesos(precios.bnPorCarilla)} por carilla.</p>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Indicaciones <span className="font-normal text-slate-400">(opcional)</span>
        </span>
        <textarea
          name="notas"
          rows={2}
          maxLength={500}
          placeholder="Ej: solo de la página 3 a la 10"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm"
        />
      </label>

      <SelectorPago
        valor={metodo}
        onChange={(m) => {
          setMetodo(m);
          setError(null);
        }}
      />

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {/* Total + pagar: fijo arriba de la barra inferior en celular, normal en escritorio */}
      <div className="sticky bottom-20 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:p-5 lg:bottom-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatearPesos(total)}</p>
          </div>
          <button
            type="submit"
            disabled={pending || total <= 0 || !metodo}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50",
              metodo === "efectivo" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#009ee3] hover:bg-[#008ac6]",
            )}
          >
            <Icono nombre="pago" className="h-4 w-4" />
            {pending ? "Reservando…" : "Reservar y pagar"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {metodo ? "" : "Primero elegí cómo vas a pagar. "}
          Retirás la impresión en la biblioteca con tu nombre y curso.{" "}
          <Link href="/panel/biblioteca" className="font-semibold text-blue-800 hover:underline">
            Cancelar
          </Link>
        </p>
      </div>
    </form>
  );
}

function Contador({
  nombre,
  titulo,
  ayuda,
  valor,
  onChange,
  max,
}: {
  nombre: string;
  titulo: string;
  ayuda: string;
  valor: number;
  onChange: (n: number) => void;
  max: number;
}) {
  const ajustar = (n: number) => onChange(Math.min(max, Math.max(1, n)));
  const boton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-blue-900 active:bg-slate-200 disabled:opacity-40";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:p-4">
      <label htmlFor={nombre} className="block text-sm font-bold text-slate-900">
        {titulo}
      </label>
      <p className="text-xs text-slate-500">{ayuda}</p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" aria-label={`Menos ${titulo.toLowerCase()}`} className={boton} disabled={valor <= 1} onClick={() => ajustar(valor - 1)}>
          −
        </button>
        <input
          id={nombre}
          name={nombre}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          required
          value={valor || ""}
          onChange={(e) => onChange(Math.min(max, Number(e.target.value)))}
          className="w-full min-w-0 rounded-xl border border-slate-300 py-2.5 text-center text-lg font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <button type="button" aria-label={`Más ${titulo.toLowerCase()}`} className={boton} disabled={valor >= max} onClick={() => ajustar(valor + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function Opcion({
  nombre,
  titulo,
  detalle,
  activo,
  onChange,
}: {
  nombre: string;
  titulo: string;
  detalle: string;
  activo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{titulo}</p>
        <p className="text-xs text-slate-500">{detalle}</p>
      </div>
      <input type="checkbox" name={nombre} checked={activo} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300",
          activo ? "bg-blue-700" : "bg-slate-300",
        )}
      >
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", activo ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}
