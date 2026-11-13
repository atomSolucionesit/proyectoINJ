"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import {
  asistenciaDelDia,
  guardarAsistencia,
  materiasParaAsistencia,
  puntosDelCurso,
  quitarPunto,
  resumenAsistencia,
  sumarPunto,
  useAlmacen,
  useUsuario,
} from "@/lib/mvp/almacen";
import type { EstadoAsistencia, ResumenAsistencia, TipoPunto, Usuario } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";
import { campo } from "../../Cursos";

const opciones: { estado: EstadoAsistencia; letra: string; titulo: string; activo: string }[] = [
  { estado: "presente", letra: "P", titulo: "Presente", activo: "bg-emerald-600 text-white border-emerald-600" },
  { estado: "tarde", letra: "T", titulo: "Tarde", activo: "bg-amber-500 text-white border-amber-500" },
  { estado: "ausente", letra: "A", titulo: "Ausente", activo: "bg-red-600 text-white border-red-600" },
];

/** Fecha de hoy en la hora local ("2026-11-06"). */
function hoy() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 10);
}

type Dia = { clave: string; marcas: Record<string, EstadoAsistencia>; yaTomada: boolean } | { clave: string; error: string };

export function TomarAsistencia() {
  const { id } = useParams<{ id: string }>();
  const yo = useUsuario();
  const { cursos, usuarios } = useAlmacen();
  const curso = cursos.find((c) => c.id === id);
  const materias = curso ? materiasParaAsistencia(yo, curso) : [];

  if (!curso || materias.length === 0) {
    return (
      <EstadoVacio
        icono="cursos"
        titulo="No podés tomar asistencia en este curso"
        descripcion="Solo aparecen los cursos y las materias que das."
        accion={{ titulo: "Volver a cursos", href: "/panel/cursos" }}
      />
    );
  }

  const alumnos = usuarios.filter((u) => u.rol === "alumno" && u.cursoId === curso.id).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return <Planilla cursoId={curso.id} cursoNombre={curso.nombre} materias={materias} alumnos={alumnos} />;
}

type Puntos = Record<string, Record<TipoPunto, number>>;

/**
 * Lista del curso para tomar asistencia (presente / tarde / ausente) y poner positivos y negativos.
 * `embebida`: dentro de la página del curso (sin el enlace de volver ni el título grande).
 */
export function Planilla({
  cursoId,
  cursoNombre,
  materias,
  alumnos,
  embebida = false,
}: {
  cursoId: string;
  cursoNombre: string;
  materias: string[];
  alumnos: Usuario[];
  embebida?: boolean;
}) {
  const [materia, setMateria] = useState(materias[0]);
  const [fecha, setFecha] = useState(hoy);
  const [dia, setDia] = useState<Dia | null>(null);
  const [resumen, setResumen] = useState<{ materia: string; datos: ResumenAsistencia | { error: string } } | null>(null);
  // Se incrementa para volver a pedir los datos (después de guardar o al reintentar).
  const [version, setVersion] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ error: string } | { ok: string } | null>(null);
  const [puntos, setPuntos] = useState<{ materia: string; datos: Puntos } | { materia: string; error: string } | null>(null);
  /** El último positivo/negativo puesto, para poder deshacerlo. */
  const [ultimo, setUltimo] = useState<{ id: string; materia: string; alumnoId: string; tipo: TipoPunto; nombre: string } | null>(null);
  const [errorPuntos, setErrorPuntos] = useState<string | null>(null);

  const clave = `${materia}|${fecha}|${version}`;
  const cargando = dia?.clave !== clave;

  useEffect(() => {
    let vigente = true;
    void asistenciaDelDia(cursoId, materia, fecha).then((resultado) => {
      if (!vigente) return;
      if ("error" in resultado) return setDia({ clave, error: resultado.error });
      // Los que todavía no tienen marca arrancan como presentes.
      const marcas = Object.fromEntries(resultado.registros.map((r) => [r.alumnoId, r.estado]));
      setDia({ clave, marcas, yaTomada: resultado.registros.length > 0 });
    });
    return () => {
      vigente = false;
    };
  }, [cursoId, materia, fecha, clave]);

  useEffect(() => {
    let vigente = true;
    void resumenAsistencia(cursoId, materia).then((datos) => vigente && setResumen({ materia, datos }));
    return () => {
      vigente = false;
    };
  }, [cursoId, materia, version]);

  useEffect(() => {
    let vigente = true;
    void puntosDelCurso(cursoId, materia).then((r) => {
      if (vigente) setPuntos("error" in r ? { materia, error: r.error } : { materia, datos: r.puntos });
    });
    return () => {
      vigente = false;
    };
  }, [cursoId, materia]);

  const puntosCargados = puntos?.materia === materia && "datos" in puntos ? puntos.datos : null;
  const errorCargaPuntos = puntos?.materia === materia && "error" in puntos ? puntos.error : null;
  const puntosDe = (alumnoId: string) => puntosCargados?.[alumnoId] ?? { positivo: 0, negativo: 0 };

  /** Suma o resta en pantalla sin esperar al servidor (si falla, se vuelve atrás). */
  function moverPunto(m: string, alumnoId: string, tipo: TipoPunto, delta: number) {
    setPuntos((anterior) => {
      if (!anterior || anterior.materia !== m || !("datos" in anterior)) return anterior;
      const actual = anterior.datos[alumnoId] ?? { positivo: 0, negativo: 0 };
      return { ...anterior, datos: { ...anterior.datos, [alumnoId]: { ...actual, [tipo]: Math.max(0, actual[tipo] + delta) } } };
    });
  }

  async function darPunto(alumno: Usuario, tipo: TipoPunto) {
    setErrorPuntos(null);
    const m = materia;
    moverPunto(m, alumno.id, tipo, 1);
    const r = await sumarPunto(cursoId, { materia: m, alumnoId: alumno.id, tipo });
    if ("error" in r) {
      moverPunto(m, alumno.id, tipo, -1);
      return setErrorPuntos(r.error);
    }
    setUltimo({ id: r.id, materia: m, alumnoId: alumno.id, tipo, nombre: alumno.nombre });
  }

  async function deshacerPunto() {
    if (!ultimo) return;
    const u = ultimo;
    setUltimo(null);
    setErrorPuntos(null);
    moverPunto(u.materia, u.alumnoId, u.tipo, -1);
    const r = await quitarPunto(cursoId, u.id);
    if ("error" in r) {
      moverPunto(u.materia, u.alumnoId, u.tipo, 1);
      setErrorPuntos(r.error);
    }
  }

  const marcas = dia && "marcas" in dia && !cargando ? dia.marcas : null;
  const estadoDe = (alumnoId: string): EstadoAsistencia => marcas?.[alumnoId] ?? "presente";

  function marcar(alumnoId: string, estado: EstadoAsistencia) {
    setMensaje(null);
    setDia((anterior) => (anterior && "marcas" in anterior ? { ...anterior, marcas: { ...anterior.marcas, [alumnoId]: estado } } : anterior));
  }

  function todosPresentes() {
    setMensaje(null);
    setDia((anterior) =>
      anterior && "marcas" in anterior ? { ...anterior, marcas: Object.fromEntries(alumnos.map((a) => [a.id, "presente" as const])) } : anterior,
    );
  }

  async function guardar() {
    setGuardando(true);
    const resultado = await guardarAsistencia(cursoId, {
      materia,
      fecha,
      registros: alumnos.map((a) => ({ alumnoId: a.id, estado: estadoDe(a.id) })),
    });
    setGuardando(false);
    setMensaje(resultado);
    if ("ok" in resultado) setVersion((v) => v + 1);
  }

  const cuenta = (estado: EstadoAsistencia) => alumnos.filter((a) => estadoDe(a.id) === estado).length;

  return (
    <div className="space-y-5">
      {embebida ? (
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Lista de alumnos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Marcá la asistencia y tocá Guardar. Los positivos (+) y negativos (−) se guardan solos al tocarlos.
          </p>
        </div>
      ) : (
        <>
          <Link href={`/panel/cursos/${cursoId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-800">
            <Icono nombre="volver" className="h-4 w-4" />
            {cursoNombre}
          </Link>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Asistencia</h1>
            <p className="mt-1 text-sm text-slate-500">
              {cursoNombre}. Marcá a cada alumno y guardá. Los positivos (+) y negativos (−) se guardan solos al tocarlos.
            </p>
          </div>
        </>
      )}

      <Tarjeta className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Materia</span>
          <select
            value={materia}
            onChange={(e) => {
              setMateria(e.target.value);
              setUltimo(null);
              setErrorPuntos(null);
            }}
            className={`mt-1 ${campo}`}
          >
            {materias.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>
          <input type="date" value={fecha} max={hoy()} required onChange={(e) => e.target.value && setFecha(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
      </Tarjeta>

      {alumnos.length === 0 ? (
        <EstadoVacio icono="alumnos" titulo="Este curso no tiene alumnos" descripcion="Agregalos desde la página del curso." />
      ) : dia && "error" in dia && !cargando ? (
        <Tarjeta className="p-5 text-center">
          <p className="text-sm font-medium text-red-700">{dia.error}</p>
          <button type="button" onClick={() => setVersion((v) => v + 1)} className="mt-3 text-sm font-semibold text-blue-800 hover:underline">
            Reintentar
          </button>
        </Tarjeta>
      ) : (
        <Tarjeta className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-600">
              {cargando ? (
                "Cargando…"
              ) : (
                <>
                  <span className={cn("mr-2 rounded-full px-2 py-0.5 text-xs font-semibold", marcas && dia && "yaTomada" in dia && dia.yaTomada ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600")}>
                    {dia && "yaTomada" in dia && dia.yaTomada ? "Ya tomada" : "Sin tomar"}
                  </span>
                  {cuenta("presente")} presentes • {cuenta("tarde")} tarde • {cuenta("ausente")} ausentes
                </>
              )}
            </p>
            <button type="button" onClick={todosPresentes} disabled={cargando} className="text-sm font-semibold text-blue-800 hover:underline disabled:opacity-50">
              Todos presentes
            </button>
          </div>

          <ul className={cn("divide-y divide-slate-100", cargando && "pointer-events-none opacity-50")}>
            {alumnos.map((alumno) => (
              <li key={alumno.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                <p className="min-w-0 basis-full truncate font-semibold text-slate-900 sm:flex-1 sm:basis-auto">{alumno.nombre}</p>
                <div role="radiogroup" aria-label={`Asistencia de ${alumno.nombre}`} className="flex shrink-0 gap-1.5">
                  {opciones.map((o) => {
                    const elegido = estadoDe(alumno.id) === o.estado;
                    return (
                      <button
                        key={o.estado}
                        type="button"
                        role="radio"
                        aria-checked={elegido}
                        aria-label={o.titulo}
                        title={o.titulo}
                        onClick={() => marcar(alumno.id, o.estado)}
                        className={cn(
                          "h-10 w-10 rounded-xl border text-sm font-bold transition-colors",
                          elegido ? o.activo : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                        )}
                      >
                        {o.letra}
                      </button>
                    );
                  })}
                </div>
                <span aria-hidden className="hidden h-8 w-px bg-slate-200 sm:block" />
                <div className="flex shrink-0 gap-1.5">
                  <BotonPunto
                    tipo="positivo"
                    cantidad={puntosDe(alumno.id).positivo}
                    nombre={alumno.nombre}
                    deshabilitado={!puntosCargados}
                    onClick={() => void darPunto(alumno, "positivo")}
                  />
                  <BotonPunto
                    tipo="negativo"
                    cantidad={puntosDe(alumno.id).negativo}
                    nombre={alumno.nombre}
                    deshabilitado={!puntosCargados}
                    onClick={() => void darPunto(alumno, "negativo")}
                  />
                </div>
              </li>
            ))}
          </ul>

          {(errorPuntos ?? errorCargaPuntos) ? (
            <p className="border-t border-slate-100 px-4 py-3 text-sm font-medium text-red-700 sm:px-5">{errorPuntos ?? errorCargaPuntos}</p>
          ) : (
            ultimo?.materia === materia && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-4 py-3 text-sm text-slate-700 sm:px-5">
                <span>
                  Se le puso un <strong className={ultimo.tipo === "positivo" ? "text-emerald-700" : "text-red-700"}>{ultimo.tipo}</strong> a{" "}
                  <strong>{ultimo.nombre}</strong>.
                </span>
                <button type="button" onClick={() => void deshacerPunto()} className="font-semibold text-blue-800 underline hover:text-blue-950">
                  Deshacer
                </button>
              </p>
            )
          )}

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
            {mensaje && "error" in mensaje && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{mensaje.error}</p>}
            {mensaje && "ok" in mensaje && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{mensaje.ok}</p>}
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || cargando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60"
            >
              <Icono nombre="check" className="h-4 w-4" />
              {guardando ? "Guardando…" : "Guardar asistencia"}
            </button>
          </div>
        </Tarjeta>
      )}

      {resumen?.materia === materia && <Resumen datos={resumen.datos} alumnos={alumnos} materia={materia} />}
    </div>
  );
}

/** Botón de positivo (+) o negativo (−) con la cantidad que lleva el alumno en la materia. */
function BotonPunto({
  tipo,
  cantidad,
  nombre,
  deshabilitado,
  onClick,
}: {
  tipo: TipoPunto;
  cantidad: number;
  nombre: string;
  deshabilitado: boolean;
  onClick: () => void;
}) {
  const positivo = tipo === "positivo";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={`Ponerle un ${tipo} a ${nombre}. Tiene ${cantidad}.`}
      title={positivo ? "Sumar un positivo" : "Sumar un negativo"}
      className={cn(
        "inline-flex h-10 min-w-16 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50",
        positivo ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
      )}
    >
      <span className="text-lg leading-none">{positivo ? "+" : "−"}</span>
      <span className="tabular-nums">{cantidad}</span>
    </button>
  );
}

/** Totales de la materia: porcentaje de asistencia, tardes y faltas de cada alumno. */
function Resumen({ datos, alumnos, materia }: { datos: ResumenAsistencia | { error: string }; alumnos: Usuario[]; materia: string }) {
  if ("error" in datos) return <p className="text-center text-sm text-red-700">{datos.error}</p>;
  if (datos.dias.length === 0) return null;

  return (
    <Tarjeta className="overflow-hidden">
      <h2 className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900 sm:px-5">
        Resumen de {materia} <span className="font-normal text-slate-500">
          • {datos.dias.length} {datos.dias.length === 1 ? "clase tomada" : "clases tomadas"}
        </span>
      </h2>
      <ul className="divide-y divide-slate-100 text-sm">
        {alumnos.map((alumno) => {
          const { presente = 0, tarde = 0, ausente = 0 } = datos.alumnos[alumno.id] ?? {};
          const total = presente + tarde + ausente;
          // Las llegadas tarde cuentan como asistencia.
          const porcentaje = total ? Math.round(((presente + tarde) / total) * 100) : null;
          return (
            <li key={alumno.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <p className="min-w-0 flex-1 truncate font-medium text-slate-900">{alumno.nombre}</p>
              <span className="text-xs text-slate-500">
                {ausente} {ausente === 1 ? "falta" : "faltas"} • {tarde} tarde
              </span>
              <span
                className={cn(
                  "w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold",
                  porcentaje === null ? "bg-slate-100 text-slate-500" : porcentaje >= 85 ? "bg-emerald-50 text-emerald-800" : porcentaje >= 75 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700",
                )}
              >
                {porcentaje === null ? "—" : `${porcentaje}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </Tarjeta>
  );
}
