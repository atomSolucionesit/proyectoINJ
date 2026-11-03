import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eventos y Calendario Escolar",
  description: "Próximos actos, jornadas y actividades del Instituto Niño Jesús I-9 de Paso de los Libres.",
};

const EVENTOS = [
  {
    id: 1,
    dia: "14",
    mes: "NOV",
    anio: "2026",
    titulo: "Feria Anual de Ciencias, Robótica y Arte",
    lugar: "Polideportivo y Salón de Usos Múltiples",
    horario: "09:00 a 16:00 hs",
    categoria: "Académico",
    descripcion:
      "Muestra multidisciplinaria donde los alumnos de Primaria y Secundaria exponen proyectos de investigación, robótica y expresiones plásticas.",
  },
  {
    id: 2,
    dia: "21",
    mes: "NOV",
    anio: "2026",
    titulo: "Torneo Intercolegial de Vóley y Básquet",
    lugar: "Campo de Deportes del Instituto",
    horario: "14:30 hs",
    categoria: "Deportes",
    descripcion:
      "Jornada deportiva que convoca a instituciones educativas de la zona para promover la sana competencia, el compañerismo y la actividad física.",
  },
  {
    id: 3,
    dia: "05",
    mes: "DIC",
    anio: "2026",
    titulo: "Acto de Egresados y Colación de Grado",
    lugar: "Patio Central Institucional",
    horario: "19:30 hs",
    categoria: "Institucional",
    descripcion:
      "Ceremonia oficial de entrega de diplomas y reconocimientos a las promociones de Nivel Inicial, Primario y Secundario.",
  },
  {
    id: 4,
    dia: "12",
    mes: "DIC",
    anio: "2026",
    titulo: "Misa de Acción de Gracias y Pesebre Viviente",
    lugar: "Parroquia y Comunidad Educativa",
    horario: "18:00 hs",
    categoria: "Pastoral",
    descripcion:
      "Encuentro de la comunidad escolar y las familias para dar gracias por el ciclo compartido y celebrar el advenimiento de la Navidad.",
  },
];

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

        {/* Lista de eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTOS.map((ev) => (
            <div
              key={ev.id}
              className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6"
            >
              {/* Bloque de fecha */}
              <div className="shrink-0 flex sm:flex-col items-center justify-center rounded-2xl bg-blue-900 text-white p-4 sm:w-24 text-center">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 leading-none">{ev.dia}</span>
                <span className="text-xs font-bold tracking-wider uppercase mt-1">{ev.mes}</span>
                <span className="text-[10px] text-blue-200">{ev.anio}</span>
              </div>

              {/* Contenido del evento */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    {ev.categoria}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{ev.horario}</span>
                </div>

                <h3 className="text-xl font-bold text-blue-950">{ev.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ev.descripcion}</p>
                
                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                  <span>📍</span>
                  <span>{ev.lugar}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

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
