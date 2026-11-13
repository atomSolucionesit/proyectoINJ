"use client";

import Link from "next/link";
import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { useAlmacen } from "@/lib/mvp/almacen";
import { ANIOS } from "../cursos/Cursos";

/** Cursos agrupados por año. Al tocar uno se ven sus alumnos para poner amonestaciones y apercibimientos. */
export function CursosAmonestaciones() {
  const { cursos, usuarios } = useAlmacen();
  const alumnosEn = (cursoId: string) => usuarios.filter((u) => u.rol === "alumno" && u.cursoId === cursoId).length;
  const anios = ANIOS.filter((anio) => cursos.some((c) => c.anio === anio));

  return (
    <>
      <EncabezadoPagina titulo="Amonestaciones" descripcion="Elegí el curso para ver a sus alumnos y cargar amonestaciones y apercibimientos." />
      {anios.length === 0 ? (
        <EstadoVacio icono="cursos" titulo="Todavía no hay cursos" descripcion="Cuando la administración cree los cursos, van a aparecer acá." />
      ) : (
        <div className="space-y-6">
          {anios.map((anio) => (
            <div key={anio}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">{anio}° Año</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cursos
                  .filter((c) => c.anio === anio)
                  .map((curso) => {
                    const cantidad = alumnosEn(curso.id);
                    return (
                      <Link key={curso.id} href={`/panel/amonestaciones/${curso.id}`}>
                        <Tarjeta className="flex items-center gap-3 p-4 transition-colors hover:border-blue-300">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-extrabold text-blue-900">
                            {curso.anio}°{curso.division}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">{curso.nombre}</p>
                            <p className="text-xs text-slate-500">
                              {cantidad} {cantidad === 1 ? "alumno" : "alumnos"}
                            </p>
                          </div>
                          <Icono nombre="flecha" className="h-4 w-4 text-slate-400" />
                        </Tarjeta>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
