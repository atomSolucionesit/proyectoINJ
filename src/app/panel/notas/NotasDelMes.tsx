"use client";

import { useEffect, useState } from "react";
import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { sancionesDeAlumno, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import { materiasNotas, notasEjemplo, tiposNota } from "@/lib/mvp/datosDemo";
import type { Sanciones } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

const formatoNota = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const mesActual = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(
  new Date(),
);

const promedio = (notas: number[]) => notas.reduce((total, n) => total + n, 0) / notas.length;

/** Emoji según el promedio: de 8 a 10 feliz con globos, de 5 a menos de 8 neutra, menos de 5 triste llorando. */
function emojiPromedio(prom: number) {
  if (prom >= 8) return { emoji: "😄🎈", texto: "¡Excelente!" };
  if (prom >= 5) return { emoji: "😐", texto: "Regular" };
  return { emoji: "😭", texto: "A mejorar" };
}

/**
 * Notas del mes por materia: conceptuales, actitudinales y procedimentales, con su promedio.
 * El alumno ve las suyas; el padre/madre, las de cada uno de sus hijos.
 */
export function NotasDelMes() {
  const yo = useUsuario();
  const { usuarios } = useAlmacen();

  if (yo.rol !== "padre") {
    return (
      <>
        <EncabezadoPagina titulo="Notas del mes" descripcion={`Tus calificaciones de ${mesActual}.`} />
        <NotasDeAlumno alumnoId={yo.id} sinNotas="Todavía no se cargaron tus notas de este mes." />
      </>
    );
  }

  const hijos = usuarios.filter((u) => u.padreId === yo.id && u.rol === "alumno").sort((a, b) => a.nombre.localeCompare(b.nombre));
  return (
    <>
      <EncabezadoPagina titulo="Notas del mes" descripcion={`Calificaciones de ${mesActual} de tus hijos.`} />
      {hijos.length > 0 ? (
        <div className="space-y-8">
          {hijos.map((hijo) => (
            <div key={hijo.id}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
                  {hijo.nombre.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{hijo.nombre}</p>
                  {hijo.curso && <p className="text-xs text-slate-500">{hijo.curso}</p>}
                </div>
              </div>
              <NotasDeAlumno alumnoId={hijo.id} sinNotas={`Todavía no se cargaron las notas de ${hijo.nombre} de este mes.`} />
            </div>
          ))}
        </div>
      ) : (
        <EstadoVacio icono="alumnos" titulo="No hay alumnos vinculados" descripcion="Pedile a la escuela que vincule a tus hijos con tu cuenta." />
      )}
    </>
  );
}

function NotasDeAlumno({ alumnoId, sinNotas }: { alumnoId: string; sinNotas: string }) {
  const notas = notasEjemplo[alumnoId];
  return (
    <>
      <div className="space-y-4">
        {materiasNotas.map((materia) => {
          const deMateria = notas?.[materia];
          const prom = deMateria ? promedio(deMateria) : null;
          return (
            <Tarjeta key={materia} className="p-4 sm:p-5">
              <h3 className="font-bold text-slate-900">{materia}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                {tiposNota.map((tipo, i) => (
                  <Casilla key={tipo} titulo={tipo} valor={deMateria ? String(deMateria[i]) : "—"} />
                ))}
                <Casilla
                  titulo="Promedio"
                  valor={prom === null ? "—" : formatoNota.format(prom)}
                  emoji={prom === null ? undefined : emojiPromedio(prom)}
                  className={cn(
                    "col-span-3 sm:col-span-1",
                    prom === null
                      ? "border-slate-200 bg-slate-50"
                      : prom >= 8
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : prom >= 5
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-red-200 bg-red-50 text-red-900",
                  )}
                />
              </div>
            </Tarjeta>
          );
        })}
      </div>
      {!notas && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Icono nombre="alerta" className="h-4 w-4" />
          {sinNotas}
        </p>
      )}
      <SancionesDeAlumno alumnoId={alumnoId} />
    </>
  );
}

/** Al final de las notas: amonestaciones y apercibimientos (los pone el preceptor; acá solo se ven). */
function SancionesDeAlumno({ alumnoId }: { alumnoId: string }) {
  const [carga, setCarga] = useState<{ alumnoId: string; datos: Sanciones } | { alumnoId: string; error: string } | null>(null);

  useEffect(() => {
    let vigente = true;
    void sancionesDeAlumno(alumnoId).then((r) => {
      if (vigente) setCarga("error" in r ? { alumnoId, error: r.error } : { alumnoId, datos: r });
    });
    return () => {
      vigente = false;
    };
  }, [alumnoId]);

  const datos = carga?.alumnoId === alumnoId && "datos" in carga ? carga.datos : null;
  const error = carga?.alumnoId === alumnoId && "error" in carga ? carga.error : null;
  const casilla = (valor: number | undefined) =>
    valor === undefined ? "border-slate-200 bg-slate-50" : valor > 0 ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <Tarjeta className="mt-4 p-4 sm:p-5">
      <h3 className="font-bold text-slate-900">Amonestaciones y apercibimientos</h3>
      {error ? (
        <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <Casilla titulo="Amonestaciones" valor={datos ? String(datos.amonestaciones) : "…"} className={casilla(datos?.amonestaciones)} />
            <Casilla titulo="Apercibimientos" valor={datos ? String(datos.apercibimientos) : "…"} className={casilla(datos?.apercibimientos)} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Las carga el preceptor. Si tenés dudas, consultá en preceptoría.</p>
        </>
      )}
    </Tarjeta>
  );
}

function Casilla({
  titulo,
  valor,
  emoji,
  className,
}: {
  titulo: string;
  valor: string;
  emoji?: { emoji: string; texto: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-1 py-3 text-center", className)}>
      <span className="w-full break-words text-[11px] font-semibold leading-tight text-slate-500 sm:text-xs">{titulo}</span>
      <span className="mt-1 flex items-center gap-1.5 text-2xl font-extrabold tabular-nums">
        {valor}
        {emoji && (
          <span role="img" aria-label={emoji.texto} title={emoji.texto} className="text-xl leading-none">
            {emoji.emoji}
          </span>
        )}
      </span>
    </div>
  );
}
