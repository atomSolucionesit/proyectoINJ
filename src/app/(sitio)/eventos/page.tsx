import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvisoContenido, EsqueletoTarjetas, TarjetaEvento } from "@/components/sitio/Contenido";
import { leerEventos } from "@/lib/contenido";

export const metadata: Metadata = {
  title: "Eventos y Calendario Escolar",
  description: "Próximos actos, jornadas y actividades del Instituto Niño Jesús I-9 de Paso de los Libres.",
};

async function ListaEventos() {
  const eventos = await leerEventos();
  if (!eventos) return <AvisoContenido titulo="No pudimos cargar el calendario" texto="Probá de nuevo en unos minutos." />;
  if (eventos.length === 0) return <AvisoContenido titulo="No hay eventos próximos" texto="Cuando se programen actos y actividades los vas a ver acá." />;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {eventos.map((evento) => (
        <TarjetaEvento key={evento.id} evento={evento} />
      ))}
    </div>
  );
}

export default function EventosPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
            Agenda Institucional
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Eventos y Actividades
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Acompañá a nuestros estudiantes en las celebraciones, jornadas académicas y encuentros comunitarios del Instituto Niño Jesús.
          </p>
        </div>

        {/* Próximos eventos: se leen de la API en cada visita */}
        <Suspense fallback={<EsqueletoTarjetas cantidad={4} alto="h-56" className="grid grid-cols-1 gap-6 md:grid-cols-2" />}>
          <ListaEventos />
        </Suspense>

        <div className="text-center pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            ¿Tenés dudas sobre alguna fecha del calendario escolar? Consultá a nuestra secretaría.
          </p>
          <Link
            href="/contacto"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition-colors"
          >
            Contactar por Agenda
          </Link>
        </div>

      </div>
    </div>
  );
}
