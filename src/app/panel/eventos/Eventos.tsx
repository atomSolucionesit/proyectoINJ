"use client";

import { useState } from "react";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { puede } from "@/lib/auth/permisos";
import { categoriasEventos, fechaEvento, hoyEnArgentina, partesFecha } from "@/lib/contenido";
import { eliminarEvento, guardarEvento, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import { avisar } from "@/lib/mvp/avisos";
import type { Evento } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

/* ---------- Diseño según el tema del evento ---------- */

type Tema = { emoji: string; fondo: string; chip: string; acento: string };

/** Colores e ícono de cada categoría. */
const temasPorCategoria: Record<string, Tema> = {
  Académico: { emoji: "📚", fondo: "from-sky-500 via-blue-600 to-indigo-700", chip: "bg-sky-100 text-sky-900", acento: "text-sky-700" },
  Deportes: { emoji: "🏅", fondo: "from-emerald-500 via-green-600 to-teal-700", chip: "bg-emerald-100 text-emerald-900", acento: "text-emerald-700" },
  Cultura: { emoji: "🎭", fondo: "from-fuchsia-500 via-purple-600 to-violet-700", chip: "bg-fuchsia-100 text-fuchsia-900", acento: "text-fuchsia-700" },
  Pastoral: { emoji: "🕊️", fondo: "from-amber-400 via-orange-500 to-rose-500", chip: "bg-amber-100 text-amber-900", acento: "text-orange-700" },
  Institucional: { emoji: "🏫", fondo: "from-blue-800 via-blue-900 to-indigo-950", chip: "bg-blue-100 text-blue-900", acento: "text-blue-800" },
  Reunión: { emoji: "👥", fondo: "from-slate-500 via-slate-600 to-slate-800", chip: "bg-slate-200 text-slate-800", acento: "text-slate-700" },
};
const temaGeneral: Tema = { emoji: "📅", fondo: "from-blue-600 via-indigo-600 to-indigo-800", chip: "bg-indigo-100 text-indigo-900", acento: "text-indigo-700" };

/** Si el nombre habla de algo puntual, el ícono lo muestra (el primero que coincide gana). */
const iconosPorTema: [RegExp, string][] = [
  [/cienc|laborator|experiment/i, "🔬"],
  [/robót|robot|tecnolog|program/i, "🤖"],
  [/vóley|voley|básquet|basquet|fútbol|futbol|handball|torneo|olimp/i, "🏐"],
  [/egresad|colación|diploma|graduac/i, "🎓"],
  [/navidad|pesebre/i, "🎄"],
  [/misa|oración|parroquia|catequesis|confirmación|comunión/i, "⛪"],
  [/concierto|música|musica|coro|ensamble|canto/i, "🎵"],
  [/arte|pintur|muestra|dibujo|plástic/i, "🎨"],
  [/patri|bandera|independencia|revolución|tradición|san martín|belgrano|sarmiento/i, "🇦🇷"],
  [/padres|familia|tutores/i, "👨‍👩‍👧"],
  [/reunión|reunion/i, "👥"],
  [/feria|kermés|kermes/i, "🎪"],
  [/libro|lectura|biblioteca/i, "📖"],
  [/viaje|excursión|campamento|salida/i, "🚌"],
  [/examen|evaluación|mesa/i, "📝"],
  [/acto/i, "🎤"],
];

function temaDe(evento: Evento): Tema {
  const base = temasPorCategoria[evento.categoria] ?? temaGeneral;
  const texto = `${evento.titulo} ${evento.descripcion ?? ""}`;
  const icono = iconosPorTema.find(([patron]) => patron.test(texto))?.[1];
  return icono ? { ...base, emoji: icono } : base;
}

/** Días que faltan (0 = hoy). Las fechas son solo el día, se comparan en UTC. */
const diasHasta = (fecha: string, hoy: string) => Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / 86_400_000);

function textoFaltan(dias: number) {
  if (dias === 0) return "¡Es hoy!";
  if (dias === 1) return "¡Es mañana!";
  if (dias < 7) return `Faltan ${dias} días`;
  const semanas = Math.round(dias / 7);
  return dias < 30 ? `Faltan ${dias} días` : `Falta${semanas === 1 ? "" : "n"} ${semanas} semanas`;
}

/** "2026-11" → "Noviembre 2026" */
function nombreMes(fecha: string) {
  const texto = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${fecha.slice(0, 7)}-15T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Puntitos suaves de fondo para las tarjetas de color. */
const puntitos = "bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] bg-[length:18px_18px]";

/* ---------- Página ---------- */

/** Calendario: el próximo evento destacado, el resto agrupado por mes y, aparte, los que ya pasaron. */
export function Eventos() {
  const yo = useUsuario();
  const { eventos } = useAlmacen();
  const edita = puede(yo.rol, "eventos:editar");
  /** "nuevo", el evento que se está editando o `null` (formulario cerrado). */
  const [editando, setEditando] = useState<Evento | "nuevo" | null>(null);
  const [verPasados, setVerPasados] = useState(false);

  const hoy = hoyEnArgentina();
  const proximos = eventos.filter((e) => e.fecha >= hoy);
  const pasados = eventos.filter((e) => e.fecha < hoy).reverse();
  const [destacado, ...siguientes] = proximos;

  // Los que siguen, agrupados por mes.
  const porMes = new Map<string, Evento[]>();
  for (const e of siguientes) porMes.set(e.fecha.slice(0, 7), [...(porMes.get(e.fecha.slice(0, 7)) ?? []), e]);

  const editar = (evento: Evento) => {
    setEditando(evento);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {edita &&
        (editando ? (
          <FormEvento key={editando === "nuevo" ? "nuevo" : editando.id} evento={editando === "nuevo" ? undefined : editando} alTerminar={() => setEditando(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditando("nuevo")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 px-5 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-blue-900 active:scale-[0.98] sm:w-auto"
          >
            <Icono nombre="agregar" className="h-5 w-5" />
            Nuevo evento
          </button>
        ))}

      {!destacado ? (
        <EstadoVacio
          icono="eventos"
          titulo="No hay eventos próximos"
          descripcion={edita ? "Cargá los actos y actividades: aparecen en la sección Eventos del sitio." : "Cuando se carguen actos y actividades los vas a ver acá."}
        />
      ) : (
        <>
          <EventoDestacado evento={destacado} hoy={hoy} edita={edita} alEditar={() => editar(destacado)} />

          {[...porMes].map(([mes, delMes]) => (
            <section key={mes}>
              <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold text-slate-900">
                {nombreMes(mes)}
                <span className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {delMes.map((evento) => (
                  <TarjetaEvento key={evento.id} evento={evento} hoy={hoy} edita={edita} alEditar={() => editar(evento)} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {pasados.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setVerPasados((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-xs hover:text-slate-900"
          >
            <span>🗂️ Eventos que ya pasaron ({pasados.length})</span>
            <Icono nombre="flecha" className={cn("h-4 w-4 transition-transform", verPasados ? "-rotate-90" : "rotate-90")} />
          </button>
          {verPasados && (
            <div className="mt-4 grid gap-5 opacity-80 grayscale-[35%] sm:grid-cols-2">
              {pasados.map((evento) => (
                <TarjetaEvento key={evento.id} evento={evento} hoy={hoy} edita={edita} alEditar={() => editar(evento)} pasado />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/** El próximo evento, en grande y con cuenta regresiva. */
function EventoDestacado({ evento, hoy, edita, alEditar }: { evento: Evento; hoy: string; edita: boolean; alEditar: () => void }) {
  const tema = temaDe(evento);
  const { dia, mes, anio } = partesFecha(evento.fecha);
  const faltan = diasHasta(evento.fecha, hoy);

  return (
    <article className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl sm:p-8", tema.fondo)}>
      <div className={cn("pointer-events-none absolute inset-0", puntitos)} />
      <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 select-none text-[11rem] leading-none opacity-20 sm:text-[14rem]">
        {tema.emoji}
      </span>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">Próximo evento</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900 shadow-sm">{textoFaltan(faltan)}</span>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-3xl bg-white text-slate-900 shadow-lg">
            <span className="text-4xl">{tema.emoji}</span>
            <span className="mt-1 text-3xl leading-none font-black">{dia}</span>
            <span className="text-xs font-bold tracking-widest text-slate-500">
              {mes} {anio}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white/80">{evento.categoria}</span>
            <h2 className="mt-1 text-2xl leading-tight font-black tracking-tight sm:text-4xl">{evento.titulo}</h2>
            <p className="mt-2 text-base font-medium capitalize text-white/90">{fechaEvento(evento.fecha)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {evento.horario && <Etiqueta>🕒 {evento.horario}</Etiqueta>}
          {evento.lugar && <Etiqueta>📍 {evento.lugar}</Etiqueta>}
        </div>
        {evento.descripcion && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/95">{evento.descripcion}</p>}

        {edita && <BotonesEdicion evento={evento} alEditar={alEditar} claro />}
      </div>
    </article>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur">{children}</span>;
}

/** Tarjeta con una franja de color e ícono según el tema del evento. */
function TarjetaEvento({ evento, hoy, edita, alEditar, pasado = false }: { evento: Evento; hoy: string; edita: boolean; alEditar: () => void; pasado?: boolean }) {
  const tema = temaDe(evento);
  const { dia, mes } = partesFecha(evento.fecha);
  const faltan = diasHasta(evento.fecha, hoy);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={cn("relative h-32 overflow-hidden bg-gradient-to-br", tema.fondo)}>
        <div className={cn("absolute inset-0", puntitos)} />
        <span aria-hidden className="absolute -right-3 -bottom-6 select-none text-[7.5rem] leading-none opacity-30 transition-transform group-hover:scale-110">
          {tema.emoji}
        </span>
        <span aria-hidden className="absolute top-4 left-4 text-4xl drop-shadow">
          {tema.emoji}
        </span>
        <div className="absolute top-4 right-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white text-slate-900 shadow-md">
          <span className="text-2xl leading-none font-black">{dia}</span>
          <span className="mt-0.5 text-[11px] font-bold tracking-wider text-slate-500">{mes}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", tema.chip)}>{evento.categoria}</span>
          {!pasado && <span className={cn("text-xs font-bold", tema.acento)}>{textoFaltan(faltan)}</span>}
        </div>
        <h3 className="mt-2 text-lg leading-snug font-extrabold text-slate-900">{evento.titulo}</h3>
        <p className="mt-1 text-sm font-medium capitalize text-slate-500">{fechaEvento(evento.fecha)}</p>
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          {evento.horario && <p>🕒 {evento.horario}</p>}
          {evento.lugar && <p>📍 {evento.lugar}</p>}
        </div>
        {evento.descripcion && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{evento.descripcion}</p>}
        {edita && (
          <div className="mt-auto pt-4">
            <BotonesEdicion evento={evento} alEditar={alEditar} />
          </div>
        )}
      </div>
    </article>
  );
}

function BotonesEdicion({ evento, alEditar, claro = false }: { evento: Evento; alEditar: () => void; claro?: boolean }) {
  return (
    <div className={cn("flex gap-2", claro && "mt-5")}>
      <button
        type="button"
        onClick={alEditar}
        className={cn(
          "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
          claro ? "bg-white/20 text-white backdrop-blur hover:bg-white/30" : "border border-slate-200 text-slate-700 hover:bg-slate-50",
        )}
      >
        ✏️ Editar
      </button>
      <button
        type="button"
        onClick={() => confirm(`¿Borrar "${evento.titulo}" del calendario?`) && void eliminarEvento(evento.id)}
        className={cn(
          "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
          claro ? "bg-white/10 text-white hover:bg-red-500/80" : "text-red-700 hover:bg-red-50",
        )}
      >
        Borrar
      </button>
    </div>
  );
}

function FormEvento({ evento, alTerminar }: { evento?: Evento; alTerminar: () => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(formData: FormData) {
    const texto = (clave: string) => String(formData.get(clave) ?? "");
    setError(null);
    setGuardando(true);
    const resultado = await guardarEvento(evento?.id ?? null, {
      titulo: texto("titulo"),
      fecha: texto("fecha"),
      horario: texto("horario"),
      lugar: texto("lugar"),
      categoria: texto("categoria"),
      descripcion: texto("descripcion"),
    });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    avisar(resultado.ok, "exito");
    alTerminar();
  }

  return (
    <Tarjeta className="p-4 sm:p-6">
      <h2 className="font-bold text-slate-900">{evento ? "Editar evento" : "Nuevo evento"}</h2>
      <form action={enviar} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Nombre</span>
          <input name="titulo" defaultValue={evento?.titulo} required minLength={3} maxLength={160} placeholder="Ej: Acto del Día de la Tradición" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>
          <input name="fecha" type="date" defaultValue={evento?.fecha} required className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Horario <span className="font-normal text-slate-400">(opcional)</span>
          </span>
          <input name="horario" defaultValue={evento?.horario ?? ""} maxLength={40} placeholder="Ej: 19:30 hs" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Lugar <span className="font-normal text-slate-400">(opcional)</span>
          </span>
          <input name="lugar" defaultValue={evento?.lugar ?? ""} maxLength={160} placeholder="Ej: Patio central" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Categoría</span>
          <input name="categoria" defaultValue={evento?.categoria ?? "Institucional"} required maxLength={40} list="categorias-eventos" className={campo} />
          <datalist id="categorias-eventos">
            {categoriasEventos.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Descripción <span className="font-normal text-slate-400">(opcional)</span>
          </span>
          <textarea name="descripcion" defaultValue={evento?.descripcion ?? ""} rows={3} maxLength={2000} className={campo} />
        </label>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={alTerminar}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:py-2.5"
          >
            <Icono nombre="check" className="h-4 w-4" />
            {guardando ? "Guardando…" : evento ? "Guardar cambios" : "Agregar al calendario"}
          </button>
        </div>
      </form>
    </Tarjeta>
  );
}
