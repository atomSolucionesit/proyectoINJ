"use client";

import { useEffect, useState } from "react";
import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { asistenciaDeAlumno, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { AsistenciaMateria, EstadoAsistencia, Usuario } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

/**
 * Asistencia y positivos/negativos por materia. Solo lectura:
 * el alumno ve la suya y el padre/madre la de cada uno de sus hijos. Los carga el profesor desde Cursos.
 */
export function Asistencias() {
  const yo = useUsuario();
  const { usuarios } = useAlmacen();

  if (yo.rol !== "padre") {
    return (
      <>
        <EncabezadoPagina titulo="Asistencias" descripcion="Tu asistencia y tus positivos y negativos en cada materia." />
        <AvisoSoloLectura />
        <AsistenciaDeAlumno alumnoId={yo.id} />
      </>
    );
  }

  const hijos = usuarios.filter((u) => u.padreId === yo.id && u.rol === "alumno").sort((a, b) => a.nombre.localeCompare(b.nombre));
  return (
    <>
      <EncabezadoPagina titulo="Asistencias" descripcion="Asistencia y positivos y negativos de tus hijos en cada materia." />
      <AvisoSoloLectura />
      {hijos.length > 0 ? (
        <div className="space-y-8">
          {hijos.map((hijo) => (
            <div key={hijo.id}>
              <EncabezadoHijo hijo={hijo} />
              <AsistenciaDeAlumno alumnoId={hijo.id} />
            </div>
          ))}
        </div>
      ) : (
        <EstadoVacio icono="alumnos" titulo="No hay alumnos vinculados" descripcion="Pedile a la escuela que vincule a tus hijos con tu cuenta." />
      )}
    </>
  );
}

function AvisoSoloLectura() {
  return (
    <p className="mb-5 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
      <Icono nombre="alerta" className="h-4 w-4 shrink-0" />
      Solo lectura. La asistencia y los positivos y negativos los carga cada profesor.
    </p>
  );
}

function EncabezadoHijo({ hijo }: { hijo: Usuario }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
        {hijo.nombre.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-slate-900">{hijo.nombre}</p>
        {hijo.curso && <p className="text-xs text-slate-500">{hijo.curso}</p>}
      </div>
    </div>
  );
}

type Carga = { alumnoId: string; materias: AsistenciaMateria[] } | { alumnoId: string; error: string };

function AsistenciaDeAlumno({ alumnoId }: { alumnoId: string }) {
  const [carga, setCarga] = useState<Carga | null>(null);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void asistenciaDeAlumno(alumnoId).then((r) => vigente && setCarga({ alumnoId, ...r }));
    return () => {
      vigente = false;
    };
  }, [alumnoId, reintento]);

  if (!carga || carga.alumnoId !== alumnoId) {
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
        <button type="button" onClick={() => setReintento((r) => r + 1)} className="mt-3 text-sm font-semibold text-blue-800 hover:underline">
          Reintentar
        </button>
      </Tarjeta>
    );
  }
  if (carga.materias.length === 0) {
    return <EstadoVacio icono="asistencia" titulo="Todavía no hay registros" descripcion="Cuando los profesores tomen asistencia, va a aparecer acá." />;
  }

  return (
    <div className="space-y-4">
      {carga.materias.map((m) => (
        <TarjetaMateria key={m.materia} datos={m} />
      ))}
    </div>
  );
}

const estilosEstado: Record<EstadoAsistencia, { titulo: string; chip: string }> = {
  presente: { titulo: "Presente", chip: "bg-emerald-50 text-emerald-800" },
  tarde: { titulo: "Tarde", chip: "bg-amber-50 text-amber-800" },
  ausente: { titulo: "Ausente", chip: "bg-red-50 text-red-700" },
};

const fechaClase = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00.000Z`));

function TarjetaMateria({ datos }: { datos: AsistenciaMateria }) {
  const total = datos.presente + datos.tarde + datos.ausente;
  // Las llegadas tarde cuentan como asistencia (igual que en el resumen del profesor).
  const porcentaje = total ? Math.round(((datos.presente + datos.tarde) / total) * 100) : null;

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="font-bold text-slate-900">{datos.materia}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
            porcentaje === null
              ? "bg-slate-100 text-slate-500"
              : porcentaje >= 85
                ? "bg-emerald-50 text-emerald-800"
                : porcentaje >= 75
                  ? "bg-amber-50 text-amber-800"
                  : "bg-red-50 text-red-700",
          )}
        >
          {porcentaje === null ? "Sin clases tomadas" : `${porcentaje}% de asistencia`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-5 sm:gap-3 sm:p-5">
        <Dato titulo="Presentes" valor={datos.presente} color="text-emerald-700" />
        <Dato titulo="Tardes" valor={datos.tarde} color="text-amber-700" />
        <Dato titulo="Ausentes" valor={datos.ausente} color="text-red-700" />
        <Dato titulo="Positivos" valor={datos.positivos} signo="+" color="text-emerald-700" fondo="border-emerald-200 bg-emerald-50" />
        <Dato titulo="Negativos" valor={datos.negativos} signo="−" color="text-red-700" fondo="border-red-200 bg-red-50" />
      </div>

      {datos.registros.length > 0 && (
        <details className="group border-t border-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-slate-50 sm:px-5">
            Ver día por día ({datos.registros.length} {datos.registros.length === 1 ? "clase" : "clases"})
            <Icono nombre="flecha" className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
            {datos.registros.map((r) => (
              <li key={r.fecha} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <span className="capitalize text-slate-700">{fechaClase(r.fecha)}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", estilosEstado[r.estado].chip)}>{estilosEstado[r.estado].titulo}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Tarjeta>
  );
}

function Dato({ titulo, valor, color, signo, fondo }: { titulo: string; valor: number; color: string; signo?: string; fondo?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-1 py-3 text-center", fondo)}>
      <span className="text-[11px] font-semibold leading-tight text-slate-500 sm:text-xs">{titulo}</span>
      <span className={cn("mt-1 text-2xl font-extrabold tabular-nums", color)}>
        {signo && valor > 0 ? signo : ""}
        {valor}
      </span>
    </div>
  );
}
