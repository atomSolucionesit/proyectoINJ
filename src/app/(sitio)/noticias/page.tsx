import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Noticias y Novedades",
  description: "Actualidad, anuncios institucionales y novedades del Instituto Niño Jesús I-9.",
};

const NOTICIAS = [
  {
    id: "admisiones-2026",
    titulo: "Apertura del Período de Inscripciones Ciclo Lectivo 2026",
    fecha: "03 de Noviembre, 2026",
    categoria: "Institucional",
    imagen: "/images/hero-edificio.jpg",
    resumen:
      "Informamos a la comunidad de Paso de los Libres y zonas aledañas que se encuentra formalmente abierto el período de postulación de vacantes para los niveles Inicial, Primario y Secundario.",
  },
  {
    id: "feria-ciencias-robotica",
    titulo: "Destacada Participación en la Feria de Ciencias y Tecnología",
    fecha: "28 de Octubre, 2026",
    categoria: "Académico",
    imagen: "/images/hero-ciencia.jpg",
    resumen:
      "Nuestros estudiantes presentaron proyectos innovadores de robótica, energías renovables y cuidado del medio ambiente, recibiendo menciones especiales del jurado zonal.",
  },
  {
    id: "jornada-deportiva-familiar",
    titulo: "Gran Jornada Recreativa y Deportiva con las Familias",
    fecha: "19 de Octubre, 2026",
    categoria: "Comunidad",
    imagen: "/images/hero-deportes.jpg",
    resumen:
      "Con una masiva concurrencia en nuestro predio deportivo, compartimos un sábado de competencias amistosas, mateada, juegos cooperativos y entrega de distinciones al compañerismo.",
  },
  {
    id: "nuevos-espacios-lectura",
    titulo: "Renovación y Ampliación de la Biblioteca y Sala Digital",
    fecha: "12 de Octubre, 2026",
    categoria: "Infraestructura",
    imagen: "/images/hero-1.jpg",
    resumen:
      "Se incorporaron nuevos títulos bibliográficos, computadoras conectadas y sectores de estudio grupal para enriquecer la experiencia de aprendizaje de todos los cursos.",
  },
  {
    id: "talleres-arte-musica",
    titulo: "Muestra de Arte y Concierto del Ensamble Musical Escolar",
    fecha: "04 de Octubre, 2026",
    categoria: "Cultura",
    imagen: "/images/hero-aula.jpg",
    resumen:
      "Alumnos de Nivel Primario y Secundario deleitaron al público con interpretaciones de música instrumental y una galería de obras visuales creadas en clase.",
  },
];

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

        {/* Grilla de Noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {NOTICIAS.map((noticia) => (
            <article
              key={noticia.id}
              className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-52 w-full bg-slate-200 overflow-hidden">
                  <Image
                    src={noticia.imagen}
                    alt={noticia.titulo}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-blue-950/85 text-white text-[11px] font-bold px-3 py-1 backdrop-blur">
                    {noticia.categoria}
                  </span>
                </div>
                <div className="p-6">
                  <time className="text-xs text-slate-500 font-semibold">{noticia.fecha}</time>
                  <h2 className="text-xl font-bold text-blue-950 mt-1 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {noticia.titulo}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {noticia.resumen}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <Link
                  href={`/noticias/${noticia.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950"
                >
                  Continuar leyendo
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
}
