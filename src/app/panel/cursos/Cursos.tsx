"use client";

import { useState } from "react";
import Link from "next/link";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { Permitido } from "@/components/panel/Permitido";
import { crearCurso, useAlmacen, useUsuario } from "@/lib/mvp/almacen";

export const ANIOS = [1, 2, 3, 4, 5, 6];

export const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

export function Cursos() {
  const yo = useUsuario();
  const { cursos, usuarios } = useAlmacen();
  const alumnosEn = (cursoId: string) => usuarios.filter((u) => u.rol === "alumno" && u.cursoId === cursoId).length;
  const esProfesor = yo.rol === "profesor";
  const anios = ANIOS.filter((anio) => cursos.some((c) => c.anio === anio));

  return (
    <div className="space-y-6">
      <Permitido permiso="cursos:gestionar">
        <NuevoCurso />
      </Permitido>

      {anios.length === 0 &&
        (esProfesor ? (
          <EstadoVacio
            icono="cursos"
            titulo="Todavía no tenés cursos"
            descripcion="Acá vas a ver los cursos donde das clase. Pedile al administrador que te asigne tus materias."
          />
        ) : (
          <EstadoVacio icono="cursos" titulo="Todavía no hay cursos" descripcion="Creá los cursos de 1° a 6° Año con sus divisiones." />
        ))}

      {anios.map((anio) => (
        <div key={anio}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">{anio}° Año</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cursos
              .filter((c) => c.anio === anio)
              .map((curso) => (
                <Link key={curso.id} href={`/panel/cursos/${curso.id}`}>
                  <Tarjeta className="flex items-center gap-3 p-4 transition-colors hover:border-blue-300">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-extrabold text-blue-900">
                      {curso.anio}°{curso.division}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-bold text-slate-900">
                        {curso.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {alumnosEn(curso.id)} alumnos •{" "}
                        {esProfesor
                          ? curso.docentes
                              .filter((d) => d.profesorId === yo.id)
                              .map((d) => d.materia)
                              .join(", ")
                          : `${curso.docentes.length} materias`}
                      </p>
                    </div>
                    <Icono nombre="flecha" className="h-4 w-4 text-slate-400" />
                  </Tarjeta>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NuevoCurso() {
  const [estado, setEstado] = useState<{ error: string } | { ok: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    setPending(true);
    const resultado = await crearCurso(Number(datos.get("anio")), String(datos.get("division") ?? ""));
    setPending(false);
    setEstado(resultado);
    if ("ok" in resultado) form.reset();
  }

  return (
    <Tarjeta className="p-4 sm:p-5">
      <form onSubmit={enviar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block sm:w-40">
          <span className="text-sm font-semibold text-slate-700">Año</span>
          <select name="anio" defaultValue="1" className={`mt-1 ${campo}`}>
            {ANIOS.map((anio) => (
              <option key={anio} value={anio}>
                {anio}° Año
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:w-32">
          <span className="text-sm font-semibold text-slate-700">División</span>
          <input name="division" required maxLength={10} placeholder="A" className={`mt-1 uppercase ${campo}`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60 sm:py-2.5"
        >
          <Icono nombre="agregar" className="h-4 w-4" />
          {pending ? "Creando…" : "Crear curso"}
        </button>
      </form>
      {estado && "error" in estado && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>}
      {estado && "ok" in estado && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{estado.ok}</p>}
    </Tarjeta>
  );
}
