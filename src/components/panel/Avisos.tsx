"use client";

import { cerrarAviso, useAvisos } from "@/lib/mvp/avisos";
import { cn } from "@/lib/utils";
import { Icono } from "./Icono";

/** Avisos flotantes del panel: arriba de la barra inferior en celular, abajo a la derecha en escritorio. */
export function Avisos() {
  const avisos = useAvisos();
  if (avisos.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-96 lg:bottom-6" aria-live="assertive">
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1",
            aviso.tipo === "error" ? "bg-red-50 text-red-900 ring-red-200" : "bg-emerald-50 text-emerald-900 ring-emerald-200",
          )}
        >
          <p className="flex-1">{aviso.texto}</p>
          <button
            type="button"
            onClick={() => cerrarAviso(aviso.id)}
            aria-label="Cerrar aviso"
            className="-m-1 rounded-lg p-1 opacity-60 hover:opacity-100"
          >
            <Icono nombre="cerrar" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
