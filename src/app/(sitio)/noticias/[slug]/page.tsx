import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AvisoContenido, ImagenNoticia } from "@/components/sitio/Contenido";
import { fechaNoticia, leerNoticia, parrafos } from "@/lib/contenido";

export async function generateMetadata({ params }: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const noticia = await leerNoticia((await params).slug);
  if (!noticia || noticia === "no-existe") return { title: "Noticias" };
  return { title: noticia.titulo, description: noticia.resumen };
}

async function Articulo({ params }: { params: PageProps<"/noticias/[slug]">["params"] }) {
  const noticia = await leerNoticia((await params).slug);
  if (noticia === "no-existe") notFound();
  if (!noticia) return <AvisoContenido titulo="No pudimos cargar la noticia" texto="Probá de nuevo en unos minutos." />;

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-blue-900">Inicio</Link>
        <span>/</span>
        <Link href="/noticias" className="hover:text-blue-900">Noticias</Link>
        <span>/</span>
        <span className="truncate text-slate-800">{noticia.titulo}</span>
      </nav>

      {/* Encabezado del artículo */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 uppercase">{noticia.categoria}</span>
          <time className="text-xs text-slate-500">{fechaNoticia(noticia.publicadaEn)}</time>
        </div>

        <h1 className="text-3xl leading-tight font-black tracking-tight text-blue-950 sm:text-4xl">{noticia.titulo}</h1>
        <p className="text-base font-medium text-slate-600">{noticia.resumen}</p>
      </header>

      {/* Imagen destacada */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-slate-900 shadow-lg sm:h-96">
        <ImagenNoticia imagen={noticia.imagen} alt={noticia.titulo} sizes="(min-width: 768px) 768px, 100vw" />
      </div>

      {/* Cuerpo del artículo */}
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-xs sm:p-10 sm:text-base">
        {parrafos(noticia.contenido).map((parrafo, i) => (
          <p key={i} className="whitespace-pre-line">
            {parrafo}
          </p>
        ))}
      </div>
    </>
  );
}

export default function NoticiaPage({ params }: PageProps<"/noticias/[slug]">) {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-72 animate-pulse rounded-3xl bg-slate-200 sm:h-96" />
              <div className="h-64 animate-pulse rounded-3xl bg-white" />
            </div>
          }
        >
          <Articulo params={params} />
        </Suspense>

        {/* Botón Volver */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            ← Volver al listado de noticias
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-800"
          >
            Consultar a la escuela
          </Link>
        </div>
      </div>
    </div>
  );
}
