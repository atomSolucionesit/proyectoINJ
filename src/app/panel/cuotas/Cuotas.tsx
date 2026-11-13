"use client";

import { useEffect, useState } from "react";
import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { puede } from "@/lib/auth/permisos";
import { avisosDePago, guardarConfigCuotas, leerCuotas, marcarAvisosVistos, pagarCuota, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { AvisoPagoCuota, ConfigCuotas, Cuota, CuotasAlumno, EstadoCuota, MetodoPagoCuota } from "@/lib/mvp/tipos";
import { cn, formatearDia, formatearFecha, formatearPesos } from "@/lib/utils";
import { campo } from "../cursos/Cursos";
import { EstadoDeCuenta, fechaVencimiento, IconoWhatsApp, nombreMes, nombresMetodo, RecordatorioWhatsApp, resumenCuenta } from "./EstadoCuenta";

/* ---------- Formatos ---------- */

const estilosEstado: Record<EstadoCuota, { titulo: string; chip: string }> = {
  pagada: { titulo: "Pagada", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  pendiente: { titulo: "Falta pagar", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  vencida: { titulo: "Vencida", chip: "bg-red-50 text-red-700 ring-red-200" },
};

const deuda = (cuotas: Cuota[]) => cuotas.filter((c) => c.estado !== "pagada");

/* ---------- Página ---------- */

/** Tutor: las cuotas de sus hijos, con el botón para pagarlas. Administrador: avisos de pago, valor de la cuota y estado de todos. */
export function Cuotas() {
  const yo = useUsuario();
  const { avisosCuotas } = useAlmacen();
  const admin = puede(yo.rol, "cuotas:gestionar");
  const [carga, setCarga] = useState<{ config: ConfigCuotas; alumnos: CuotasAlumno[] } | { error: string } | null>(null);
  const [version, setVersion] = useState(0);

  // Se vuelve a leer al cambiar algo y, para el administrador, cuando llega un pago nuevo.
  useEffect(() => {
    let vigente = true;
    void leerCuotas().then((r) => vigente && setCarga(r));
    return () => {
      vigente = false;
    };
  }, [version, avisosCuotas]);

  const recargar = () => setVersion((v) => v + 1);

  const contenido = !carga ? (
    <Tarjeta className="p-6 text-center">
      <p className="text-sm text-slate-500">Cargando…</p>
    </Tarjeta>
  ) : "error" in carga ? (
    <Tarjeta className="p-6 text-center">
      <p className="text-sm font-medium text-red-700">{carga.error}</p>
      <button type="button" onClick={recargar} className="mt-3 text-sm font-semibold text-blue-800 hover:underline">
        Reintentar
      </button>
    </Tarjeta>
  ) : admin ? (
    <VistaAdministrador config={carga.config} alumnos={carga.alumnos} onCambio={recargar} />
  ) : (
    <VistaTutor alumnos={carga.alumnos} config={carga.config} onCambio={recargar} />
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Cuotas"
        descripcion={
          admin
            ? "Pagos de los tutores, valor de la cuota y estado de cuenta de cada alumno, con recordatorio de deuda por WhatsApp."
            : "El estado de cuenta de tus hijos. Podés pagar las cuotas desde acá."
        }
      />
      {contenido}
    </>
  );
}

/* ---------- Tutor ---------- */

function VistaTutor({ alumnos, config, onCambio }: { alumnos: CuotasAlumno[]; config: ConfigCuotas; onCambio: () => void }) {
  if (alumnos.length === 0) {
    return <EstadoVacio icono="alumnos" titulo="No hay alumnos vinculados" descripcion="Pedile a la escuela que vincule a tus hijos con tu cuenta." />;
  }

  return (
    <div className="space-y-8">
      <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
        <Icono nombre="eventos" className="h-4 w-4 shrink-0" />
        Cuota mensual: <strong className="text-slate-900">{formatearPesos(config.monto)}</strong>, vence el día{" "}
        <strong className="text-slate-900">{config.diaVencimiento}</strong> de cada mes.
      </p>
      {alumnos.map((alumno) => (
        <CuotasDeHijo key={alumno.alumnoId} alumno={alumno} onPagada={onCambio} />
      ))}
    </div>
  );
}

function CuotasDeHijo({ alumno, onPagada }: { alumno: CuotasAlumno; onPagada: () => void }) {
  const [pagando, setPagando] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
          {alumno.nombre.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{alumno.nombre}</p>
          {alumno.curso && <p className="text-xs text-slate-500">{alumno.curso}</p>}
        </div>
      </div>

      <div className="mb-3">
        <EstadoDeCuenta alumno={alumno} />
      </div>

      {exito && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
          <Icono nombre="check" className="h-5 w-5 shrink-0" />
          {exito}
        </p>
      )}

      <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
        {alumno.cuotas.map((cuota) => (
          <div key={cuota.mes}>
            <FilaCuota cuota={cuota} accion={cuota.estado !== "pagada" && pagando !== cuota.mes ? () => (setPagando(cuota.mes), setExito(null)) : undefined} />
            {pagando === cuota.mes && (
              <PagoCuota
                alumno={alumno}
                cuota={cuota}
                onVolver={() => setPagando(null)}
                onPagada={(metodo) => {
                  setPagando(null);
                  setExito(`¡Listo! Se pagó la cuota de ${nombreMes(cuota.mes).toLowerCase()} con ${nombresMetodo[metodo]}.`);
                  onPagada();
                }}
              />
            )}
          </div>
        ))}
      </Tarjeta>
    </div>
  );
}

function FilaCuota({ cuota, accion }: { cuota: Cuota; accion?: () => void }) {
  const estilo = estilosEstado[cuota.estado];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">{nombreMes(cuota.mes)}</p>
        <p className="text-xs text-slate-500">
          {cuota.estado === "pagada" && cuota.pagadaEn
            ? `Pagada el ${formatearFecha(cuota.pagadaEn)}${cuota.metodo ? ` con ${nombresMetodo[cuota.metodo]}` : ""}`
            : `Vence el ${fechaVencimiento(cuota.vencimiento)}`}
        </p>
      </div>
      <span className="text-lg font-extrabold tabular-nums text-slate-900">{formatearPesos(cuota.monto)}</span>
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", estilo.chip)}>{estilo.titulo}</span>
      {accion && (
        <button
          type="button"
          onClick={accion}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] sm:w-auto"
        >
          <Icono nombre="pago" className="h-4 w-4" />
          Pagar
        </button>
      )}
    </div>
  );
}

const opcionesPago: { metodo: MetodoPagoCuota; titulo: string; detalle: string; elegido: string }[] = [
  { metodo: "mercadopago", titulo: "Mercado Pago", detalle: "Con tu cuenta o dinero en Mercado Pago", elegido: "border-[#009ee3] bg-sky-50 text-sky-900 ring-2 ring-sky-200" },
  { metodo: "tarjeta", titulo: "Tarjeta", detalle: "Cualquier tarjeta de crédito o débito", elegido: "border-blue-800 bg-blue-50 text-blue-900 ring-2 ring-blue-200" },
];

/** Paso de pago (simulado): elegir Mercado Pago o tarjeta y confirmar. */
function PagoCuota({
  alumno,
  cuota,
  onVolver,
  onPagada,
}: {
  alumno: CuotasAlumno;
  cuota: Cuota;
  onVolver: () => void;
  onPagada: (metodo: MetodoPagoCuota) => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPagoCuota | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pagar() {
    if (!metodo) return;
    setProcesando(true);
    setError(null);
    const r = await pagarCuota(alumno.alumnoId, cuota.mes, metodo);
    setProcesando(false);
    if ("error" in r) return setError(r.error);
    onPagada(metodo);
  }

  return (
    <div className="space-y-4 border-t border-blue-100 bg-blue-50/40 px-4 py-4 sm:px-5">
      <p className="text-sm font-bold text-slate-900">
        Pagar {nombreMes(cuota.mes).toLowerCase()} de {alumno.nombre}: {formatearPesos(cuota.monto)}
      </p>
      <div role="radiogroup" aria-label="Forma de pago" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {opcionesPago.map((o) => {
          const elegido = metodo === o.metodo;
          return (
            <button
              key={o.metodo}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => setMetodo(o.metodo)}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98]",
                elegido ? o.elegido : "border-slate-300 bg-white text-slate-800 hover:border-slate-400",
              )}
            >
              <Icono nombre="pago" className="h-6 w-6 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{o.titulo}</span>
                <span className="block text-xs text-slate-500">{o.detalle}</span>
              </span>
              {elegido && <Icono nombre="check" className="h-5 w-5 shrink-0" />}
            </button>
          );
        })}
      </div>
      <p className="rounded-xl bg-white p-3 text-xs text-slate-600">
        Pago de prueba: esta versión no cobra de verdad. En la versión final se abre Mercado Pago, donde se paga con la cuenta o con cualquier tarjeta.
      </p>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onVolver} disabled={procesando} className="rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Volver
        </button>
        <button
          type="button"
          onClick={() => void pagar()}
          disabled={!metodo || procesando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#009ee3] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#008ac6] active:scale-[0.98] disabled:opacity-50"
        >
          <Icono nombre="check" className="h-4 w-4" />
          {procesando ? "Procesando…" : metodo ? `Pagar ${formatearPesos(cuota.monto)}` : "Elegí cómo pagar"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Administrador ---------- */

function VistaAdministrador({ config, alumnos, onCambio }: { config: ConfigCuotas; alumnos: CuotasAlumno[]; onCambio: () => void }) {
  return (
    <div className="space-y-6">
      <AvisosDePago />
      <ValorCuota config={config} onGuardado={onCambio} />
      <EstadoAlumnos alumnos={alumnos} onCambio={onCambio} />
    </div>
  );
}

function AvisosDePago() {
  const { avisosCuotas } = useAlmacen();
  const [carga, setCarga] = useState<{ avisos: AvisoPagoCuota[] } | { error: string } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    void avisosDePago().then((r) => vigente && setCarga(r));
    return () => {
      vigente = false;
    };
  }, [avisosCuotas, version]);

  const avisos = carga && "avisos" in carga ? carga.avisos : [];
  const nuevos = avisos.filter((a) => !a.visto).length;

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <Icono nombre="mensajes" className="h-5 w-5 text-blue-800" />
          Avisos de pago
          {nuevos > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{nuevos} nuevos</span>}
        </h2>
        {nuevos > 0 && (
          <button
            type="button"
            onClick={async () => {
              if (await marcarAvisosVistos()) setVersion((v) => v + 1);
            }}
            className="text-sm font-semibold text-blue-800 hover:underline"
          >
            Marcar como vistos
          </button>
        )}
      </div>
      {carga && "error" in carga ? (
        <p className="px-4 py-4 text-sm font-medium text-red-700 sm:px-5">{carga.error}</p>
      ) : avisos.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">{carga ? "Todavía no hay pagos." : "Cargando…"}</p>
      ) : (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {avisos.map((a) => (
            <li key={a.id} className={cn("flex items-start gap-3 px-4 py-3 text-sm sm:px-5", !a.visto && "bg-amber-50/70")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.visto ? "bg-slate-300" : "bg-red-500")} />
              <div className="min-w-0 flex-1">
                <p className="text-slate-800">
                  <strong>{a.tutorNombre}</strong> pagó la cuota de <strong>{nombreMes(a.mes).toLowerCase()}</strong> de {a.alumnoNombre}
                  {a.curso ? ` (${a.curso})` : ""}.
                </p>
                <p className="text-xs text-slate-500">
                  {formatearPesos(a.monto)} • {nombresMetodo[a.metodo]} • {formatearFecha(a.pagadoEn)}
                </p>
              </div>
              {!a.visto && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">Nuevo</span>}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

/** Cambia el valor y el vencimiento para todas las cuentas: se aplica solo a las cuotas sin pagar. */
function ValorCuota({ config, onGuardado }: { config: ConfigCuotas; onGuardado: () => void }) {
  const [monto, setMonto] = useState(String(config.monto));
  const [dia, setDia] = useState(String(config.diaVencimiento));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ error: string } | { ok: string } | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    const r = await guardarConfigCuotas({ monto: Number(monto), diaVencimiento: Number(dia) });
    setGuardando(false);
    if ("error" in r) return setMensaje(r);
    setMensaje({
      ok: `Listo: la cuota pasa a ${formatearPesos(r.ok.monto)} y vence el día ${r.ok.diaVencimiento}. Ya se actualizó en todas las cuentas (las cuotas ya pagadas no cambian).`,
    });
    onGuardado();
  }

  return (
    <Tarjeta className="p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-bold text-slate-900">
        <Icono nombre="configuracion" className="h-5 w-5 text-blue-800" />
        Valor de la cuota
      </h2>
      <p className="mt-1 text-sm text-slate-500">Al guardar, cambia automáticamente en todas las cuentas para las cuotas que todavía no se pagaron.</p>
      <form onSubmit={guardar} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Valor mensual (pesos)</span>
          <input type="number" inputMode="numeric" min={1} step={1} required value={monto} onChange={(e) => setMonto(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Vence el día</span>
          <input type="number" inputMode="numeric" min={1} max={28} required value={dia} onChange={(e) => setDia(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60 sm:py-2.5"
        >
          <Icono nombre="check" className="h-4 w-4" />
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
      {mensaje && "error" in mensaje && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{mensaje.error}</p>}
      {mensaje && "ok" in mensaje && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{mensaje.ok}</p>}
    </Tarjeta>
  );
}

type FiltroAlumnos = "todos" | "vencidas" | "al-dia";

/** Estado de cuenta de cada alumno, con filtro de morosos y el recordatorio de deuda por WhatsApp. */
function EstadoAlumnos({ alumnos, onCambio }: { alumnos: CuotasAlumno[]; onCambio: () => void }) {
  const [filtro, setFiltro] = useState<FiltroAlumnos>("todos");
  const [busqueda, setBusqueda] = useState("");
  const resumenes = new Map(alumnos.map((a) => [a.alumnoId, resumenCuenta(a.cuotas)]));
  const resumen = (a: CuotasAlumno) => resumenes.get(a.alumnoId) ?? resumenCuenta(a.cuotas);
  const alDia = alumnos.filter((a) => deuda(a.cuotas).length === 0);
  const morosos = alumnos.filter((a) => resumen(a).vencidas.length > 0);
  const totalVencido = morosos.reduce((t, a) => t + resumen(a).vencido, 0);

  const q = busqueda.trim().toLowerCase();
  const visibles = alumnos.filter((a) => {
    if (filtro === "vencidas" && resumen(a).vencidas.length === 0) return false;
    if (filtro === "al-dia" && resumen(a).saldo > 0) return false;
    return !q || [a.nombre, a.curso ?? "", a.tutorNombre ?? ""].some((t) => t.toLowerCase().includes(q));
  });

  const filtros: { valor: FiltroAlumnos; titulo: string }[] = [
    { valor: "todos", titulo: `Todos (${alumnos.length})` },
    { valor: "vencidas", titulo: `Con atraso (${morosos.length})` },
    { valor: "al-dia", titulo: `Al día (${alDia.length})` },
  ];

  return (
    <Tarjeta className="overflow-hidden">
      <div className="space-y-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Icono nombre="alumnos" className="h-5 w-5 text-blue-800" />
            Estado de cuenta por alumno
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {alDia.length} al día • {morosos.length} con cuotas vencidas
            {totalVencido > 0 && ` (${formatearPesos(totalVencido)} vencidos en total)`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div role="tablist" aria-label="Filtrar alumnos" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {filtros.map((f) => (
              <button
                key={f.valor}
                type="button"
                role="tab"
                aria-selected={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filtro === f.valor ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {f.titulo}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Buscar alumno, curso o tutor…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${campo} sm:ml-auto sm:max-w-xs`}
          />
        </div>
      </div>
      {visibles.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">{alumnos.length === 0 ? "Todavía no hay alumnos." : "Ningún alumno coincide con el filtro."}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visibles.map((alumno) => {
            const r = resumen(alumno);
            const ultimo = alumno.recordatorios[0];
            return (
              <li key={alumno.alumnoId}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{alumno.nombre}</p>
                      <p className="truncate text-xs text-slate-500">
                        {alumno.curso ?? "Sin curso"} • Tutor/a: {alumno.tutorNombre ?? "sin vincular"}
                      </p>
                      {ultimo && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <IconoWhatsApp className="h-3 w-3" />
                          Avisado el {formatearDia(ultimo.enviadoEn)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          r.vencidas.length > 0 ? "bg-red-50 text-red-700" : r.saldo > 0 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800",
                        )}
                      >
                        {r.vencidas.length > 0 ? `${r.vencidas.length} vencida${r.vencidas.length === 1 ? "" : "s"}` : r.saldo > 0 ? "Pendiente" : "Al día"}
                      </span>
                      {r.saldo > 0 && <p className="mt-1.5 text-xs font-semibold tabular-nums text-slate-700">{formatearPesos(r.saldo)}</p>}
                    </div>
                    <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5">
                    <EstadoDeCuenta alumno={alumno} />
                    <RecordatorioWhatsApp alumno={alumno} onCambio={onCambio} />
                    <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
                      {alumno.cuotas.map((c) => (
                        <FilaCuota key={c.mes} cuota={c} />
                      ))}
                    </Tarjeta>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
