"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { roles } from "@/lib/auth/permisos";
import { leerAsistenciaPersonal, marcarAsistenciaPersonal, useAlmacen } from "@/lib/mvp/almacen";
import type { AsistenciaPersonal, EstadoAsistencia } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

const opciones: { estado: EstadoAsistencia; letra: string; titulo: string; activo: string }[] = [
  { estado: "presente", letra: "P", titulo: "Presente", activo: "border-emerald-600 bg-emerald-600 text-white" },
  { estado: "tarde", letra: "T", titulo: "Tarde", activo: "border-amber-500 bg-amber-500 text-white" },
  { estado: "ausente", letra: "A", titulo: "Ausente", activo: "border-red-600 bg-red-600 text-white" },
];

const estilosEstado: Record<EstadoAsistencia, { titulo: string; chip: string }> = {
  presente: { titulo: "Presente", chip: "bg-emerald-50 text-emerald-800" },
  tarde: { titulo: "Tarde", chip: "bg-amber-50 text-amber-800" },
  ausente: { titulo: "Ausente", chip: "bg-red-50 text-red-700" },
};

const fechaLarga = (fecha: string, conDiaSemana = true) =>
  new Intl.DateTimeFormat("es-AR", { ...(conDiaSemana && { weekday: "long" }), day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${fecha}T12:00:00.000Z`),
  );

/**
 * Administrador: profesores y preceptores con sus presentes, tardanzas y faltas.
 * La asistencia de hoy se marca tocando P / T / A en cada uno (se guarda sola).
 */
export function Docentes() {
  const { cursos } = useAlmacen();
  const [carga, setCarga] = useState<{ fecha: string; personal: AsistenciaPersonal[] } | { error: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void leerAsistenciaPersonal().then((r) => vigente && setCarga(r));
    return () => {
      vigente = false;
    };
  }, [version]);

  if (!carga) {
    return (
      <Tarjeta className="p-6 text-center">
        <p className="text-sm text-slate-500">Cargando…</p>
      </Tarjeta>
    );
  }
  if ("error" in carga) {
    return (
      <Tarjeta className="p-6 text-center">
        <p className="text-sm font-medium text-red-700">{carga.error}</p>
        <button type="button" onClick={() => setVersion((v) => v + 1)} className="mt-3 text-sm font-semibold text-blue-800 hover:underline">
          Reintentar
        </button>
      </Tarjeta>
    );
  }
  if (carga.personal.length === 0) {
    return <EstadoVacio icono="docentes" titulo="Todavía no hay profesores ni preceptores" descripcion="Creá sus cuentas desde la sección Usuarios." />;
  }

  const { fecha, personal } = carga;

  /** Se ve enseguida; si no se pudo guardar, vuelve atrás y avisa. */
  async function marcar(persona: AsistenciaPersonal, estado: EstadoAsistencia) {
    setError(null);
    const anterior = persona.hoy;
    const actualizar = (hoy: EstadoAsistencia | null) =>
      setCarga((c) => {
        if (!c || "error" in c) return c;
        return {
          ...c,
          personal: c.personal.map((p) => {
            if (p.personaId !== persona.personaId) return p;
            const registros = [{ fecha, estado: hoy }, ...p.registros.filter((r) => r.fecha !== fecha)].filter(
              (r): r is { fecha: string; estado: EstadoAsistencia } => r.estado !== null,
            );
            const cuenta = (e: EstadoAsistencia) => registros.filter((r) => r.estado === e).length;
            return { ...p, hoy, registros, presente: cuenta("presente"), tarde: cuenta("tarde"), ausente: cuenta("ausente") };
          }),
        };
      });
    actualizar(estado);
    const r = await marcarAsistenciaPersonal(persona.personaId, fecha, estado);
    if ("error" in r) {
      actualizar(anterior);
      setError(`No se guardó la asistencia de ${persona.nombre}: ${r.error}`);
    }
  }

  const cuentaHoy = (e: EstadoAsistencia | null) => personal.filter((p) => p.hoy === e).length;

  return (
    <div className="space-y-5">
      <Tarjeta className="p-4 sm:p-5">
        <p className="text-sm text-slate-500">Asistencia de hoy</p>
        <p className="text-lg font-bold capitalize text-slate-900">{fechaLarga(fecha)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{cuentaHoy("presente")} presentes</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{cuentaHoy("tarde")} tarde</span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">{cuentaHoy("ausente")} ausentes</span>
          {cuentaHoy(null) > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{cuentaHoy(null)} sin marcar</span>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Tocá P (presente), T (tarde) o A (ausente) en cada uno. Se guarda solo.</p>
      </Tarjeta>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        {personal.map((persona) => {
          const clases = cursos.flatMap((curso) =>
            curso.docentes.filter((d) => d.profesorId === persona.personaId).map((d) => ({ ...d, curso })),
          );
          const total = persona.presente + persona.tarde + persona.ausente;
          // Las llegadas tarde cuentan como asistencia.
          const porcentaje = total ? Math.round(((persona.presente + persona.tarde) / total) * 100) : null;
          return (
            <Tarjeta key={persona.personaId} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase",
                      persona.rol === "preceptor" ? "bg-violet-100 text-violet-900" : "bg-indigo-100 text-indigo-900",
                    )}
                  >
                    {persona.nombre.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{persona.nombre}</p>
                    <p className="truncate text-xs text-slate-500">
                      <span className={cn("font-semibold", persona.rol === "preceptor" ? "text-violet-700" : "text-indigo-700")}>{roles[persona.rol]}</span> •{" "}
                      {persona.email}
                    </p>
                  </div>
                  <div role="radiogroup" aria-label={`Asistencia de hoy de ${persona.nombre}`} className="flex shrink-0 gap-1.5">
                    {opciones.map((o) => {
                      const elegido = persona.hoy === o.estado;
                      return (
                        <button
                          key={o.estado}
                          type="button"
                          role="radio"
                          aria-checked={elegido}
                          aria-label={o.titulo}
                          title={o.titulo}
                          onClick={() => void marcar(persona, o.estado)}
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
                </div>

                {persona.rol === "profesor" &&
                  (clases.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {clases.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/panel/cursos/${c.curso.id}`}
                            className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                          >
                            {c.materia} • {c.curso.anio}° {c.curso.division}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">Sin materias asignadas. Asignale una desde un curso.</p>
                  ))}

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Dato titulo="Presentes" valor={persona.presente} color="text-emerald-700" />
                  <Dato titulo="Tardanzas" valor={persona.tarde} color="text-amber-700" />
                  <Dato titulo="Faltas" valor={persona.ausente} color="text-red-700" />
                  <Dato
                    titulo="Asistencia"
                    valor={porcentaje === null ? "—" : `${porcentaje}%`}
                    color={porcentaje === null ? "text-slate-400" : porcentaje >= 90 ? "text-emerald-700" : porcentaje >= 75 ? "text-amber-700" : "text-red-700"}
                  />
                </div>
              </div>

              {persona.registros.length > 0 && (
                <details className="group border-t border-slate-100">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-slate-50">
                    Ver día por día
                    <Icono nombre="flecha" className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 text-sm">
                    {persona.registros.map((r) => (
                      <li key={r.fecha} className="flex items-center justify-between gap-3 px-4 py-2">
                        <span className="capitalize text-slate-700">{fechaLarga(r.fecha)}</span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", estilosEstado[r.estado].chip)}>{estilosEstado[r.estado].titulo}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}

function Dato({ titulo, valor, color }: { titulo: string; valor: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-1 py-2">
      <p className="text-[11px] font-semibold text-slate-500">{titulo}</p>
      <p className={cn("text-xl font-extrabold tabular-nums", color)}>{valor}</p>
    </div>
  );
}
