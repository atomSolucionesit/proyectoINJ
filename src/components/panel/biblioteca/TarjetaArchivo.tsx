"use client";

import Link from "next/link";
import { bibliotecaConfig } from "@/config/biblioteca";
import { abrirArchivo, eliminarArchivo, puedeBorrarArchivo, useUsuario } from "@/lib/mvp/almacen";
import type { ArchivoBiblioteca } from "@/lib/mvp/tipos";
import { formatearDia, formatearTamano } from "@/lib/utils";
import { Icono } from "../Icono";

const coloresExtension: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  DOC: "bg-blue-50 text-blue-700",
  DOCX: "bg-blue-50 text-blue-700",
  PPT: "bg-orange-50 text-orange-700",
  PPTX: "bg-orange-50 text-orange-700",
  XLS: "bg-emerald-50 text-emerald-700",
  XLSX: "bg-emerald-50 text-emerald-700",
};

export function extensionDe(archivo: ArchivoBiblioteca) {
  return archivo.nombreOriginal.split(".").pop()?.toUpperCase().slice(0, 4) ?? "";
}

export function TarjetaArchivo({ archivo }: { archivo: ArchivoBiblioteca }) {
  const yo = useUsuario();
  const extension = extensionDe(archivo);
  const categoria = bibliotecaConfig.categorias.find((c) => c.id === archivo.categoria)?.nombre ?? "Otros";

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-black ${coloresExtension[extension] ?? "bg-slate-100 text-slate-600"}`}
        >
          <Icono nombre="archivo" className="h-5 w-5" />
          {extension}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-bold text-slate-900">{archivo.nombre}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {archivo.visibilidad === "biblioteca" ? `${categoria} • ` : ""}
            {formatearTamano(archivo.tamano)} • {archivo.subidoPorNombre}
          </p>
          <p className="mt-1.5">
            {archivo.expiraEn ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Se borra el {formatearDia(archivo.expiraEn)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Permanente
              </span>
            )}
          </p>
        </div>
        {puedeBorrarArchivo(yo, archivo) && (
          <button
            type="button"
            aria-label="Eliminar archivo"
            onClick={() => confirm(`¿Eliminar "${archivo.nombre}"? No se puede deshacer.`) && void eliminarArchivo(archivo.id)}
            className="-m-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Icono nombre="eliminar" className="h-4 w-4" />
          </button>
        )}
      </div>

      {archivo.descripcion && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{archivo.descripcion}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 pt-1 sm:mt-auto sm:pt-4">
        <button
          type="button"
          onClick={() => void abrirArchivo(archivo.id)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Icono nombre="descargar" className="h-4 w-4" />
          Abrir
        </button>
        <Link
          href={`/panel/biblioteca/imprimir/${archivo.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98]"
        >
          <Icono nombre="imprimir" className="h-4 w-4" />
          Imprimir
        </Link>
      </div>
    </article>
  );
}
