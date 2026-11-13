import Image from "next/image";
import Link from "next/link";
import { esImagenSubida, fechaNoticia, partesFecha, urlImagen } from "@/lib/contenido";
import type { Evento, Noticia } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

/** Foto de la noticia, o el logo sobre fondo azul si no tiene. Ocupa todo el contenedor (que debe ser `relative`). */
export function ImagenNoticia({ imagen, alt, sizes, className }: { imagen: string | null; alt: string; sizes: string; className?: string }) {
  if (!imagen) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950">
        <Image src="/images/logo.png" alt="" width={80} height={80} className="h-20 w-20 object-contain opacity-80" />
      </div>
    );
  }
  return (
    <Image
      src={urlImagen(imagen)}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={esImagenSubida(imagen)}
      className={cn("object-cover", className)}
    />
  );
}

/** Tarjeta de una noticia en los listados (inicio y /noticias). */
export function TarjetaNoticia({ noticia }: { noticia: Noticia }) {
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:shadow-xl">
      <div>
        <div className="relative h-52 w-full overflow-hidden bg-slate-200">
          <ImagenNoticia
            imagen={noticia.imagen}
            alt={noticia.titulo}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 rounded-full bg-blue-950/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {noticia.categoria}
          </span>
        </div>
        <div className="p-6">
          <time className="text-xs font-semibold text-slate-500">{fechaNoticia(noticia.publicadaEn)}</time>
          <h2 className="mt-1 mb-3 line-clamp-2 text-xl font-bold text-blue-950 transition-colors group-hover:text-blue-700">
            {noticia.titulo}
          </h2>
          <p className="line-clamp-3 text-xs leading-relaxed text-slate-600 sm:text-sm">{noticia.resumen}</p>
        </div>
      </div>

      <div className="px-6 pt-2 pb-6">
        <Link href={`/noticias/${noticia.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950">
          Continuar leyendo
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

/** Tarjeta de un evento del calendario. */
export function TarjetaEvento({ evento }: { evento: Evento }) {
  const { dia, mes, anio } = partesFecha(evento.fecha);
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:p-8">
      <div className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-900 p-4 text-center text-white sm:w-24 sm:flex-col sm:gap-0">
        <span className="text-2xl leading-none font-black text-amber-400 sm:text-3xl">{dia}</span>
        <span className="mt-1 text-xs font-bold tracking-wider uppercase">{mes}</span>
        <span className="text-[10px] text-blue-200">{anio}</span>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">{evento.categoria}</span>
          {evento.horario && <span className="text-xs font-medium text-slate-500">{evento.horario}</span>}
        </div>

        <h3 className="text-xl font-bold text-blue-950">{evento.titulo}</h3>
        {evento.descripcion && <p className="text-xs leading-relaxed text-slate-600">{evento.descripcion}</p>}

        {evento.lugar && (
          <p className="flex items-center gap-1.5 pt-2 text-xs text-slate-500">
            <span>📍</span>
            <span>{evento.lugar}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** Esqueletos mientras llegan los datos. */
export function EsqueletoTarjetas({ cantidad = 3, alto = "h-96", className }: { cantidad?: number; alto?: string; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className={cn("animate-pulse rounded-3xl border border-slate-200 bg-white", alto)} />
      ))}
    </div>
  );
}

/** Mensaje cuando no hay nada para mostrar o la API no respondió. */
export function AvisoContenido({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <p className="text-lg font-bold text-blue-950">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{texto}</p>
    </div>
  );
}
