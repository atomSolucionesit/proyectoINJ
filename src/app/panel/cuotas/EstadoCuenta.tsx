"use client";

import { useState } from "react";
import { Icono } from "@/components/panel/Icono";
import { siteConfig } from "@/config/site";
import { guardarTelefonoCuotas, registrarRecordatorioCuotas } from "@/lib/mvp/almacen";
import type { Cuota, CuotasAlumno, MetodoPagoCuota } from "@/lib/mvp/tipos";
import { cn, formatearDia, formatearFecha, formatearPesos } from "@/lib/utils";
import { campo } from "../cursos/Cursos";

/* ---------- Formatos ---------- */

/** "2026-11" → "Noviembre 2026" */
export function nombreMes(mes: string) {
  const texto = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T12:00:00.000Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "2026-11-10" → "10 de noviembre" */
export const fechaVencimiento = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00.000Z`));

/** "2026-11-10" → "10/11" */
const fechaCorta = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

export const nombresMetodo: Record<MetodoPagoCuota, string> = { mercadopago: "Mercado Pago", tarjeta: "Tarjeta" };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/* ---------- Cálculos ---------- */

const DIA_MS = 24 * 60 * 60 * 1000;

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Totales del ciclo lectivo: lo que se cobró hasta hoy, lo pagado, lo que se debe y cuántos días de atraso lleva. */
export function resumenCuenta(cuotas: Cuota[]) {
  const pagadas = cuotas.filter((c) => c.estado === "pagada");
  const vencidas = cuotas.filter((c) => c.estado === "vencida");
  const pendientes = cuotas.filter((c) => c.estado === "pendiente");
  const suma = (lista: Cuota[]) => lista.reduce((t, c) => t + c.monto, 0);
  // La cuota vencida más vieja marca el atraso.
  const masVieja = vencidas.map((c) => c.vencimiento).sort()[0];
  const diasAtraso = masVieja ? Math.max(0, Math.round((Date.parse(`${hoyLocal()}T12:00:00Z`) - Date.parse(`${masVieja}T12:00:00Z`)) / DIA_MS)) : 0;
  return {
    total: suma(cuotas),
    pagado: suma(pagadas),
    saldo: suma(vencidas) + suma(pendientes),
    vencido: suma(vencidas),
    vencidas,
    pendientes,
    diasAtraso,
  };
}

/** Movimientos en orden: cada cuota es un cargo el día que vence y cada pago, un crédito el día que se hizo. */
function movimientos(cuotas: Cuota[]) {
  const lista: { fecha: string; concepto: string; cargo: number; pago: number }[] = [];
  for (const c of cuotas) {
    lista.push({ fecha: c.vencimiento, concepto: `Cuota ${nombreMes(c.mes).toLowerCase()}`, cargo: c.monto, pago: 0 });
    if (c.estado === "pagada" && c.pagadaEn) {
      lista.push({
        fecha: c.pagadaEn.slice(0, 10),
        concepto: `Pago cuota ${nombreMes(c.mes).toLowerCase()}${c.metodo ? ` (${nombresMetodo[c.metodo]})` : ""}`,
        cargo: 0,
        pago: c.monto,
      });
    }
  }
  // A igual fecha, primero el cargo y después el pago.
  lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || b.cargo - a.cargo);
  let saldo = 0;
  return lista.map((m) => ({ ...m, saldo: (saldo += m.cargo - m.pago) }));
}

/* ---------- Estado de cuenta ---------- */

/** Resumen de la cuenta del alumno y el detalle de movimientos (lo ven el tutor y el administrador). */
export function EstadoDeCuenta({ alumno }: { alumno: CuotasAlumno }) {
  const r = resumenCuenta(alumno.cuotas);
  const filas = movimientos(alumno.cuotas);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Dato titulo="Cuotas del ciclo" valor={formatearPesos(r.total)} />
        <Dato titulo="Pagado" valor={formatearPesos(r.pagado)} tono="verde" />
        <Dato titulo="Saldo" valor={formatearPesos(r.saldo)} tono={r.vencido > 0 ? "rojo" : r.saldo > 0 ? "ambar" : "verde"} />
      </div>

      <p
        className={cn(
          "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
          r.vencidas.length > 0 ? "bg-red-50 text-red-800" : r.pendientes.length > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800",
        )}
      >
        <Icono nombre={r.vencidas.length > 0 ? "alerta" : "check"} className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {r.vencidas.length > 0
            ? `${plural(r.vencidas.length, "cuota vencida", "cuotas vencidas")} por ${formatearPesos(r.vencido)} • ${plural(r.diasAtraso, "día", "días")} de atraso.`
            : r.pendientes.length > 0
              ? `Sin atrasos. Falta pagar ${plural(r.pendientes.length, "cuota", "cuotas")} que todavía no ${r.pendientes.length === 1 ? "venció" : "vencieron"}.`
              : "Está al día con las cuotas."}
        </span>
      </p>

      {filas.length > 0 && (
        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-blue-800">
            Ver movimientos de la cuenta
            <Icono nombre="flecha" className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Fecha</th>
                  <th className="px-4 py-2 font-semibold">Concepto</th>
                  <th className="px-4 py-2 text-right font-semibold">Cargo</th>
                  <th className="px-4 py-2 text-right font-semibold">Pago</th>
                  <th className="px-4 py-2 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {filas.map((m, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatearDia(`${m.fecha}T12:00:00`)}</td>
                    <td className="px-4 py-2 text-slate-800">{m.concepto}</td>
                    <td className="px-4 py-2 text-right text-slate-800">{m.cargo ? formatearPesos(m.cargo) : ""}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{m.pago ? `− ${formatearPesos(m.pago)}` : ""}</td>
                    <td className={cn("px-4 py-2 text-right font-semibold", m.saldo > 0 ? "text-red-700" : "text-slate-900")}>{formatearPesos(m.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

function Dato({ titulo, valor, tono }: { titulo: string; valor: string; tono?: "verde" | "rojo" | "ambar" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-extrabold tabular-nums sm:text-lg",
          tono === "verde" ? "text-emerald-700" : tono === "rojo" ? "text-red-700" : tono === "ambar" ? "text-amber-700" : "text-slate-900",
        )}
      >
        {valor}
      </p>
    </div>
  );
}

/* ---------- Recordatorio por WhatsApp (administrador) ---------- */

/**
 * Número para wa.me: código de país + número, solo dígitos.
 * En Argentina los celulares van con 54 9 + característica + número (sin 0 ni 15).
 */
export function numeroWhatsApp(telefono: string) {
  const d = telefono.replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return `549${d.slice(2)}`;
  return `549${d}`;
}

/** "3772412345" → "3772 41-2345" (solo para mostrar). */
const mostrarTelefono = (t: string) => (t.length === 10 ? `${t.slice(0, 4)} ${t.slice(4, 6)}-${t.slice(6)}` : t);

/** Mensaje de recordatorio con el detalle de las cuotas vencidas. */
export function mensajeRecordatorio(alumno: CuotasAlumno, linkPanel: string) {
  const r = resumenCuenta(alumno.cuotas);
  const detalle = [...r.vencidas]
    .reverse()
    .map((c) => `• ${nombreMes(c.mes)}: ${formatearPesos(c.monto)} (venció el ${fechaCorta(c.vencimiento)})`)
    .join("\n");
  return [
    `Hola${alumno.tutorNombre ? ` ${alumno.tutorNombre}` : ""}, le escribimos de la administración del ${siteConfig.nombre}.`,
    "",
    `Le recordamos que ${alumno.nombre}${alumno.curso ? ` (${alumno.curso})` : ""} tiene ${plural(r.vencidas.length, "cuota vencida", "cuotas vencidas")} sin pagar:`,
    detalle,
    "",
    `Total adeudado: ${formatearPesos(r.vencido)}`,
    "",
    `Puede pagarlas con Mercado Pago o tarjeta desde el panel, en la sección Cuotas: ${linkPanel}`,
    "",
    "Si ya realizó el pago, por favor desestime este mensaje. ¡Muchas gracias!",
  ].join("\n");
}

export function RecordatorioWhatsApp({ alumno, onCambio }: { alumno: CuotasAlumno; onCambio: () => void }) {
  const r = resumenCuenta(alumno.cuotas);
  const [telefono, setTelefono] = useState(alumno.telefono ?? "");
  const [editando, setEditando] = useState(!alumno.telefono);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ error: string } | { ok: string } | null>(null);
  const ultimo = alumno.recordatorios[0];

  const textoPorDefecto = () => mensajeRecordatorio(alumno, `${window.location.origin}/panel/cuotas`);

  async function guardarTelefono(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    const res = await guardarTelefonoCuotas(alumno.alumnoId, telefono);
    setGuardando(false);
    if ("error" in res) return setAviso(res);
    setTelefono(res.ok.telefono ?? "");
    setEditando(!res.ok.telefono);
    setAviso({ ok: res.ok.telefono ? "WhatsApp guardado." : "Se borró el WhatsApp." });
    onCambio();
  }

  async function enviar() {
    if (!alumno.telefono) return;
    const texto = mensaje ?? textoPorDefecto();
    // Se abre en el mismo clic para que el navegador no bloquee la ventana nueva.
    window.open(`https://wa.me/${numeroWhatsApp(alumno.telefono)}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    setAviso(null);
    const res = await registrarRecordatorioCuotas(alumno.alumnoId);
    if ("error" in res) return setAviso({ error: `Se abrió WhatsApp, pero no se pudo registrar el envío: ${res.error}` });
    setMensaje(null);
    setAviso({ ok: "Se abrió WhatsApp con el mensaje. Tocá Enviar en WhatsApp para mandarlo." });
    onCambio();
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <IconoWhatsApp className="h-5 w-5 text-[#25D366]" />
        Recordatorio de pago por WhatsApp
      </h3>

      {editando ? (
        <form onSubmit={guardarTelefono} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">WhatsApp de la familia (con característica, sin 0 ni 15)</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="Ej. 3772 41-2345"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <div className="flex gap-2">
            {alumno.telefono && (
              <button
                type="button"
                onClick={() => (setEditando(false), setTelefono(alumno.telefono ?? ""))}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
          <span>
            WhatsApp: <strong className="tabular-nums text-slate-900">{mostrarTelefono(alumno.telefono ?? "")}</strong>
          </span>
          <button type="button" onClick={() => setEditando(true)} className="text-sm font-semibold text-blue-800 hover:underline">
            Cambiar
          </button>
        </p>
      )}

      {r.vencidas.length === 0 ? (
        <p className="text-sm text-slate-600">No tiene cuotas vencidas: no hace falta mandar recordatorio.</p>
      ) : alumno.telefono && !editando ? (
        <>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Mensaje (lo podés modificar antes de enviarlo)</span>
            <textarea
              rows={9}
              value={mensaje ?? textoPorDefecto()}
              onChange={(e) => setMensaje(e.target.value)}
              className={`mt-1 ${campo} font-normal leading-relaxed`}
            />
          </label>
          <button
            type="button"
            onClick={() => void enviar()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1ebe5b] active:scale-[0.98] sm:w-auto"
          >
            <IconoWhatsApp className="h-5 w-5" />
            Notificar deuda por WhatsApp ({formatearPesos(r.vencido)})
          </button>
        </>
      ) : null}

      {aviso && "error" in aviso && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{aviso.error}</p>}
      {aviso && "ok" in aviso && <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900">{aviso.ok}</p>}

      {ultimo && (
        <div className="text-xs text-slate-500">
          <p>
            Último recordatorio: <strong className="text-slate-700">{formatearFecha(ultimo.enviadoEn)}</strong> por {formatearPesos(ultimo.monto)} (
            {plural(ultimo.meses.length, "cuota", "cuotas")}) • {ultimo.enviadoPorNombre}
          </p>
          {alumno.recordatorios.length > 1 && <p>{plural(alumno.recordatorios.length, "recordatorio enviado", "recordatorios enviados")} en total.</p>}
        </div>
      )}
    </div>
  );
}

export function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 01-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 012.77 6.68c0 5.2-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0012.04.68C5.77.68.67 5.78.67 12.04c0 2 .52 3.96 1.52 5.68L.57 23.62l6.03-1.58a11.33 11.33 0 005.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.32-8.04z" />
    </svg>
  );
}
