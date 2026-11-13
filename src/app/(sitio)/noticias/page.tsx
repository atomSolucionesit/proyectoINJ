import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoContenido, EsqueletoTarjetas, TarjetaNoticia } from "@/components/sitio/Contenido";
import { leerNoticias } from "@/lib/contenido";

export const metadata: Metadata = {
  title: "Noticias y Novedades",
  description: "Actualidad, anuncios institucionales y novedades del Instituto Niño Jesús I-9.",
};

async function ListaNoticias() {
  const noticias = await leerNoticias();
  if (!noticias) return <AvisoContenido titulo="No pudimos cargar las noticias" texto="Probá de nuevo en unos minutos." />;
  if (noticias.length === 0) return <AvisoContenido titulo="Todavía no hay noticias" texto="Muy pronto vas a encontrar acá las novedades del instituto." />;
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {noticias.map((noticia) => (
        <TarjetaNoticia key={noticia.id} noticia={noticia} />
      ))}
    </div>
  );
}

export default function NoticiasPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
            Comunicación Oficial
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Noticias y Novedades
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Mantente al día con todas las actividades, proyectos, comunicados y logros de la comunidad del Instituto Niño Jesús I-9.
          </p>
        </div>

        {/* Grilla de Noticias: se lee de la API en cada visita */}
        <Suspense fallback={<EsqueletoTarjetas className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" />}>
          <ListaNoticias />
        </Suspense>

      </div>
    </div>
  );
}
