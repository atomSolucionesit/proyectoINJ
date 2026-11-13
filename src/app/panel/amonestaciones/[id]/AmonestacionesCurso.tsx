"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { cambiarSancion, sancionesDelCurso, useAlmacen } from "@/lib/mvp/almacen";
import type { Sanciones, TipoSancion, Usuario } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

const SIN_SANCIONES: Sanciones = { amonestaciones: 0, apercibimientos: 0 };

/** Alumnos del curso con sus amonestaciones y apercibimientos. Cada toque de − / + se guarda solo. */
export function AmonestacionesCurso() {
  const { id } = useParams<{ id: string }>();
  const { cursos, usuarios } = useAlmacen();
  const curso = cursos.find((c) => c.id === id);
  const alumnos = usuarios.filter((u) => u.rol === "alumno" && u.cursoId === id).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const [carga, setCarga] = useState<{ cursoId: string; datos: Record<string, Sanciones> } | { cursoId: string; error: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void sancionesDelCurso(id).then((r) => {
      if (vigente) setCarga("error" in r ? { cursoId: id, error: r.error } : { cursoId: id, datos: r.sanciones });
    });
    return () => {
      vigente = false;
    };
  }, [id, reintento]);

  if (!curso) {
    return <EstadoVacio icono="cursos" titulo="Curso no encontrado" descripcion="Puede que lo hayan borrado." accion={{ titulo: "Volver a cursos", href: "/panel/amonestaciones" }} />;
  }

  const datos = carga?.cursoId === id && "datos" in carga ? carga.datos : null;

  async function cambiar(alumno: Usuario, tipo: TipoSancion, cantidad: number) {
    if (!datos || cantidad < 0 || cantidad > 99) return;
    setError(null);
    const anterior = datos[alumno.id] ?? SIN_SANCIONES;
    const poner = (valor: Sanciones) =>
      setCarga((c) => (c && "datos" in c && c.cursoId === id ? { ...c, datos: { ...c.datos, [alumno.id]: valor } } : c));
    // Se ve el cambio enseguida; si no se pudo guardar, vuelve al número anterior.
    poner({ ...anterior, [tipo]: cantidad });
    const r = await cambiarSancion(alumno.id, tipo, cantidad);
    if ("error" in r) {
      poner(anterior);
      setError(`No se guardó el cambio de ${alumno.nombre}: ${r.error}`);
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Amonestaciones</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{curso.nombre}</h1>
        <p className="mt-2 text-sm text-blue-100">
          Tocá <strong>+</strong> para sumar y <strong>−</strong> para restar. Se guarda solo.
        </p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {alumnos.length === 0 ? (
        <EstadoVacio icono="alumnos" titulo="Este curso no tiene alumnos" descripcion="Cuando se agreguen alumnos al curso, van a aparecer acá." />
      ) : carga?.cursoId === id && "error" in carga ? (
        <Tarjeta className="p-6 text-center">
          <p className="text-sm font-medium text-red-700">{carga.error}</p>
          <button type="button" onClick={() => setReintento((r) => r + 1)} className="mt-3 text-sm font-semibold text-blue-800 hover:underline">
            Reintentar
          </button>
        </Tarjeta>
      ) : (
        <Tarjeta className={cn("divide-y divide-slate-100 overflow-hidden", !datos && "pointer-events-none opacity-50")}>
          {alumnos.map((alumno) => {
            const s = datos?.[alumno.id] ?? SIN_SANCIONES;
            return (
              <div key={alumno.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
                    {alumno.nombre.charAt(0)}
                  </span>
                  <p className="truncate text-base font-semibold text-slate-900">{alumno.nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
                  <Contador titulo="Amonestaciones" valor={s.amonestaciones} nombre={alumno.nombre} onCambiar={(n) => void cambiar(alumno, "amonestaciones", n)} />
                  <Contador titulo="Apercibimientos" valor={s.apercibimientos} nombre={alumno.nombre} onCambiar={(n) => void cambiar(alumno, "apercibimientos", n)} />
                </div>
              </div>
            );
          })}
        </Tarjeta>
      )}
    </div>
  );
}

/** − cantidad + (la cantidad en grande en el medio). */
function Contador({ titulo, valor, nombre, onCambiar }: { titulo: string; valor: number; nombre: string; onCambiar: (n: number) => void }) {
  const boton = "flex h-11 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold leading-none transition-all active:scale-95 disabled:opacity-30";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-slate-500">{titulo}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCambiar(valor - 1)}
          disabled={valor === 0}
          aria-label={`Restar uno en ${titulo} de ${nombre}`}
          className={cn(boton, "border-slate-300 bg-white text-slate-600 hover:bg-slate-100")}
        >
          −
        </button>
        <span className={cn("w-8 text-center text-2xl font-extrabold tabular-nums", valor > 0 ? "text-red-700" : "text-slate-400")} aria-live="polite">
          {valor}
        </span>
        <button
          type="button"
          onClick={() => onCambiar(valor + 1)}
          disabled={valor >= 99}
          aria-label={`Sumar uno en ${titulo} de ${nombre}`}
          className={cn(boton, "border-red-300 bg-red-50 text-red-700 hover:bg-red-100")}
        >
          +
        </button>
      </div>
    </div>
  );
}
