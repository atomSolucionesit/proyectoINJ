import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Niveles Educativos",
  description: "Propuesta pedagógica para Nivel Inicial, Nivel Primario y Nivel Secundario del Instituto Niño Jesús I-9.",
};

const NIVELES = [
  {
    id: "inicial",
    nombre: "Nivel Inicial",
    subtitulo: "Salas de 3, 4 y 5 años (Jardín de Infantes)",
    imagen: "/images/hero-aula.jpg",
    color: "border-amber-400",
    badge: "bg-amber-100 text-amber-900",
    descripcion:
      "En el Nivel Inicial brindamos un entorno cálido, contenedor y lúdico. Propiciamos el desarrollo de la autonomía personal, la sociabilidad, la imaginación y la curiosidad espontánea de los niños mediante actividades significativas y proyectos integradores.",
    ejes: [
      "Juego como eje metodológico y motor de aprendizajes",
      "Iniciación en la expresión corporal, música y plástica",
      "Talleres de articulación y aproximación a la lectoescritura",
      "Educación física y psicomotricidad adaptada",
      "Socialización con afecto y respeto por las normas de convivencia",
    ],
    turno: "Turnos Mañana y Tarde con articulación pedagógica",
  },
  {
    id: "primario",
    nombre: "Nivel Primario",
    subtitulo: "1° a 6° Grado",
    imagen: "/images/hero-1.jpg",
    color: "border-blue-600",
    badge: "bg-blue-100 text-blue-900",
    descripcion:
      "El Nivel Primario consolida los aprendizajes fundamentales: comprensión lectora, redacción, matemática aplicada, ciencias sociales y naturales. Incorporamos idioma extranjero inglés y robótica educativa para estimular el pensamiento analítico.",
    ejes: [
      "Comprensión lectora intensiva y pensamiento lógico-matemático",
      "Inglés con enfoque comunicativo y práctico",
      "Informática, alfabetización digital y proyectos de ciencias",
      "Campamentos educativos, salidas de campo y vida en la naturaleza",
      "Acompañamiento psicopedagógico continuo",
    ],
    turno: "Jornada escolar con talleres extracurriculares",
  },
  {
    id: "secundario",
    nombre: "Nivel Secundario",
    subtitulo: "Ciclo Básico y Ciclo Orientado",
    imagen: "/images/hero-ciencia.jpg",
    color: "border-indigo-600",
    badge: "bg-indigo-100 text-indigo-900",
    descripcion:
      "Preparamos a nuestros jóvenes para los desafíos del mundo universitario, terciario y laboral. Desarrollamos el liderazgo ético, la investigación científica, el debate de ideas, las competencias digitales y la vocación de servicio solidario.",
    ejes: [
      "Bachillerato con orientación académica sólida",
      "Laboratorios de física, química y tecnología experimental",
      "Prácticas vocacionales, orientación y visitas universitarias",
      "Proyectos de acción comunitaria y pastoral juvenil",
      "Participación en olimpíadas académicas y torneos deportivos",
    ],
    turno: "Horario académico completo y talleres especiales",
  },
];

export default function NivelesPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
            Oferta Académica Integral
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Niveles Educativos
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Acompañamos cada etapa de crecimiento desde la primera infancia hasta la finalización de los estudios secundarios en el Instituto Niño Jesús I-9.
          </p>
        </div>

        {/* Lista detallada de niveles */}
        <div className="space-y-12">
          {NIVELES.map((nivel, idx) => (
            <div
              key={nivel.id}
              className={`rounded-3xl bg-white border-2 ${nivel.color} p-6 sm:p-10 shadow-sm overflow-hidden`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                <div className={`lg:col-span-6 space-y-4 ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${nivel.badge}`}>
                    {nivel.subtitulo}
                  </span>
                  <h2 className="text-3xl font-extrabold text-blue-950">{nivel.nombre}</h2>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                    {nivel.descripcion}
                  </p>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pilares formativos:
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                      {nivel.ejes.map((eje) => (
                        <li key={eje} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold shrink-0">✓</span>
                          <span>{eje}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <Link
                      href="/admisiones"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-xs"
                    >
                      Solicitar Vacante
                    </Link>
                    <Link
                      href="/contacto"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Consultar a Secretaría
                    </Link>
                  </div>
                </div>

                <div className={`lg:col-span-6 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-md">
                    <Image
                      src={nivel.imagen}
                      alt={nivel.nombre}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
