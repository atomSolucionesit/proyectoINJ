"use client";

import Image from "next/image";
import Link from "next/link";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { puede } from "@/lib/auth/permisos";
import { esImagenSubida, fechaNoticia, urlImagen } from "@/lib/contenido";
import { eliminarNoticia, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { NoticiaPanel } from "@/lib/mvp/tipos";
import { cn, formatearDia } from "@/lib/utils";

/** Quien edita ve también los borradores y puede editarlas o borrarlas; el resto, las publicadas. */
export function Noticias() {
  const yo = useUsuario();
  const { noticias } = useAlmacen();
  const edita = puede(yo.rol, "noticias:editar");

  if (noticias.length === 0) {
    return edita ? (
      <EstadoVacio
        icono="noticias"
        titulo="Todavía no hay noticias"
        descripcion="Escribí la primera: aparece en el inicio y en la sección Noticias del sitio."
        accion={{ titulo: "Nueva noticia", href: "/panel/noticias/nueva" }}
      />
    ) : (
      <EstadoVacio icono="noticias" titulo="Todavía no hay noticias" descripcion="Cuando se publiquen noticias las vas a ver acá." />
    );
  }

  const borradores = noticias.filter((n) => !n.publicada).length;

  return (
    <div className="space-y-3">
      {edita && borradores > 0 && (
        <p className="text-sm text-slate-500">
          {borradores === 1 ? "1 borrador sin publicar" : `${borradores} borradores sin publicar`}: solo se ven acá, no en el sitio.
        </p>
      )}
      {noticias.map((noticia) => (
        <FilaNoticia key={noticia.id} noticia={noticia} edita={edita} />
      ))}
    </div>
  );
}

function FilaNoticia({ noticia, edita }: { noticia: NoticiaPanel; edita: boolean }) {
  return (
    <Tarjeta className="flex gap-4 p-3 sm:p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 sm:h-24 sm:w-32">
        {noticia.imagen ? (
          <Image
            src={urlImagen(noticia.imagen)}
            alt=""
            fill
            sizes="128px"
            unoptimized={esImagenSubida(noticia.imagen)}
            className="object-cover"
          />
        ) : (
          <Icono nombre="noticias" className="absolute inset-0 m-auto h-8 w-8 text-blue-200" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              noticia.publicada ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700",
            )}
          >
            {noticia.publicada ? "Publicada" : "Borrador"}
          </span>
          <span className="text-xs font-medium text-slate-500">{noticia.categoria}</span>
        </div>
        <h2 className="mt-1 line-clamp-2 font-bold text-slate-900">{noticia.titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {noticia.publicada ? fechaNoticia(noticia.publicadaEn) : `Creada el ${formatearDia(noticia.creadoEn)}`}
          {noticia.autorNombre && ` • ${noticia.autorNombre}`}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {noticia.publicada && (
            <Link
              href={`/noticias/${noticia.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
            >
              <Icono nombre="externo" className="h-3.5 w-3.5" />
              Ver en el sitio
            </Link>
          )}
          {edita && (
            <>
              <Link href={`/panel/noticias/${noticia.id}`} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Editar
              </Link>
              <button
                type="button"
                onClick={() => confirm(`¿Borrar la noticia "${noticia.titulo}"? No se puede deshacer.`) && void eliminarNoticia(noticia.id)}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    </Tarjeta>
  );
}
