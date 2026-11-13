"use client";

import { useParams } from "next/navigation";
import { EstadoVacio } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { abrirArchivo, puedeVerArchivo, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import { formatearTamano } from "@/lib/utils";
import { ReservaForm } from "./ReservaForm";

export function Imprimir() {
  const { id } = useParams<{ id: string }>();
  const yo = useUsuario();
  const archivo = useAlmacen().archivos.find((a) => a.id === id);

  if (!archivo || !puedeVerArchivo(yo, archivo)) {
    return (
      <EstadoVacio
        icono="archivo"
        titulo="Archivo no encontrado"
        descripcion="Puede que se haya borrado o que no tengas acceso."
        accion={{ titulo: "Volver a la biblioteca", href: "/panel/biblioteca" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <Icono nombre="archivo" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{archivo.nombre}</p>
          <p className="text-xs text-slate-500">{formatearTamano(archivo.tamano)}</p>
        </div>
        <button
          type="button"
          onClick={() => void abrirArchivo(archivo.id)}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
        >
          Ver
        </button>
      </div>
      <ReservaForm archivoId={archivo.id} />
    </div>
  );
}
