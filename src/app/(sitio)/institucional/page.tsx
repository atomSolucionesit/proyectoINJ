import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Institucional",
  description: "Historia, valores, misión, visión y equipo directivo del Instituto Niño Jesús I-9.",
};

export default function InstitucionalPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Cabecera de Página */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
            Nuestra Identidad
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Proyecto Institucional
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Más de cuatro décadas dedicadas a la formación moral, intelectual y humana de generaciones en Paso de los Libres, Corrientes.
          </p>
        </div>

        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0" />
            <div className="relative z-10 space-y-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-white font-bold text-xl">
                🎯
              </span>
              <h2 className="text-2xl font-bold text-blue-950">Nuestra Misión</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Formar personas íntegras, con sólidas competencias académicas y profundos valores éticos y cristianos, capaces de ser protagonistas conscientes y comprometidos en la transformación positiva de su comunidad.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0" />
            <div className="relative z-10 space-y-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-blue-950 font-bold text-xl">
                🔭
              </span>
              <h2 className="text-2xl font-bold text-blue-950">Nuestra Visión</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Ser un referente educativo provincial y regional, reconocido por la calidez en el trato humano, la continua innovación metodológica y pedagógica, y el testimonio de vida de nuestros egresados.
              </p>
            </div>
          </div>
        </div>

        {/* Reseña Histórica */}
        <div className="rounded-3xl bg-blue-950 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-blue-950 uppercase">
                Tradición y Futuro
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Historia del Instituto Niño Jesús I-9
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed">
                El Instituto Niño Jesús nació como respuesta al anhelo de una comunidad que buscaba una educación de raíz cristiana y excelencia pedagógica en Paso de los Libres. Desde sus orígenes con salas de nivel inicial y primeros grados, la institución experimentó un sostenido crecimiento, consolidando su Nivel Secundario y modernizando sus aulas y espacios de ciencia.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Hoy contamos con generaciones de egresados que enriquecen los ámbitos profesionales, laborales y comunitarios, manteniendo intacto el espíritu de fraternidad y servicio que caracteriza a nuestra casa educativa.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative h-48 w-48 p-4 rounded-3xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <Image
                  src="/images/logo.png"
                  alt="Escudo Instituto Niño Jesús"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Valores Fundacionales */}
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950 text-center mb-8">
            Nuestros Valores Guía
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                titulo: "Respeto y Convivencia",
                desc: "Aceptación de las diferencias y cultivo de un ambiente escolar armónico y cordial.",
                icono: "🤝",
              },
              {
                titulo: "Compromiso Social",
                desc: "Sensibilidad hacia las necesidades del prójimo y proyectos de voluntariado escolar.",
                icono: "❤️",
              },
              {
                titulo: "Búsqueda de la Verdad",
                desc: "Espíritu crítico, rigor intelectual y valoración permanente del conocimiento.",
                icono: "💡",
              },
              {
                titulo: "Sentido de Familia",
                desc: "Alianza permanente entre padres, docentes y directivos en la crianza y formación.",
                icono: "🏡",
              },
            ].map((val) => (
              <div key={val.titulo} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-3xl mb-3 block">{val.icono}</span>
                <h3 className="font-bold text-blue-950 text-base mb-1">{val.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-slate-200">
          <p className="text-slate-600 text-sm mb-4">¿Querés concertar una visita guiada para conocer el colegio?</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-800 transition-colors"
          >
            Contactanos ahora
          </Link>
        </div>

      </div>
    </div>
  );
}
