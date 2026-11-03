import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { HeroCarousel } from "@/components/sitio/HeroCarousel";

export const metadata = {
  title: "Inicio | Instituto Niño Jesús I-9 - Paso de los Libres",
  description:
    "Sitio oficial del Instituto Niño Jesús I-9 de Paso de los Libres, Corrientes. Educación integral con valores en niveles Inicial, Primario y Secundario.",
};

export default function InicioPage() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO PRINCIPAL CON CARRUSEL DE IMÁGENES */}
      <HeroCarousel />

      {/* 2. BARRA DE CIFRAS Y DESTACADOS INSTITUCIONALES */}
      <section className="bg-white border-b border-slate-200 py-8 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight">I-9</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 uppercase">
                Código Oficial en Ctes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tight">3</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 uppercase">
                Niveles: Inicial, Primario, Secundario
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight">+40</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 uppercase">
                Años de Vocación Educativa
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tight">100%</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 uppercase">
                Compromiso y Valores Humanos
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. BIENVENIDA Y PROPUESTA INSTITUCIONAL */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Imagen e Identidad Escolar */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-blue-950 aspect-4/3">
                <Image
                  src="/images/fachada-instituto.png"
                  alt="Fachada Instituto Niño Jesús I-9"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent" />
                
                {/* Badge flotante con escudo */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200">
                  <div className="relative h-12 w-12 shrink-0">
                    <Image
                      src="/images/logo.png"
                      alt="Escudo Instituto Niño Jesús"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-blue-950 uppercase tracking-tight">
                      Instituto Niño Jesús I-9
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Paso de los Libres, Corrientes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Texto de Bienvenida */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                <span>Nuestra Identidad</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight">
                Bienvenidos a la comunidad del{" "}
                <span className="text-blue-700">Instituto Niño Jesús</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                El Instituto Niño Jesús I-9 es una institución educativa de gestión privada ubicada en la ciudad de Paso de los Libres, Corrientes. Nuestra labor pedagógica se fundamenta en el desarrollo armónico de todas las dimensiones de la persona: académica, espiritual, social y física.
              </p>

              <p className="text-slate-600 leading-relaxed">
                Acompañamos a niños, niñas y jóvenes a lo largo de su trayectoria escolar brindando herramientas sólidas para afrontar con éxito el mundo actual, en un clima institucional cálido, respetuoso y con un fuerte sentido de pertenencia familiar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold">
                    ✝
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Valores Cristianos</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Promovemos la solidaridad, el respeto y la empatía cotidiana.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Excelencia Académica</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Docentes titulados con constante actualización curricular.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/institucional"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors"
                >
                  Conocer Nuestra Historia y Misión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  Contactar a Secretaría
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. NIVELES EDUCATIVOS */}
      <section id="niveles" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
              Trayectoria Completa
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
              Niveles Educativos
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Un proyecto pedagógico continuo y articulado que acompaña el desarrollo madurativo y académico desde los 3 años hasta el egreso secundario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Nivel Inicial */}
            <div className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-2xl font-bold text-amber-700">
                    🎈
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Salas de 3, 4 y 5
                  </span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-3 group-hover:text-blue-700 transition-colors">
                  Nivel Inicial
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Espacios de estimulación temprana, juego simbólico, expresión corporal y desarrollo socioafectivo. Introducción a la lectoescritura, artes e iniciación musical en un entorno seguro y afectuoso.
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">✔</span> Socialización y juego guiado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">✔</span> Talleres de expresión artística y música
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">✔</span> Acompañamiento en la primera infancia
                  </li>
                </ul>
              </div>

              <Link
                href="/niveles"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold text-blue-950 hover:bg-amber-300 transition-colors"
              >
                Más sobre Nivel Inicial
              </Link>
            </div>

            {/* Nivel Primario */}
            <div className="group rounded-3xl border-2 border-blue-600 bg-white p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow">
                Articulación Integral
              </span>
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-800">
                    📚
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    1° a 6° Grado
                  </span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-3 group-hover:text-blue-700 transition-colors">
                  Nivel Primario
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Formación sólida en áreas básicas, matemática aplicada, ciencias, comprensión de textos, idioma inglés y tecnología. Fomento de hábitos de estudio, respeto y trabajo colaborativo.
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✔</span> Alfabetización y pensamiento analítico
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✔</span> Inglés, informática y robótica inicial
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✔</span> Educación física y campamentos
                  </li>
                </ul>
              </div>

              <Link
                href="/niveles"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 text-xs font-bold text-white hover:bg-blue-900 transition-colors"
              >
                Más sobre Nivel Primario
              </Link>
            </div>

            {/* Nivel Secundario */}
            <div className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-800">
                    🎓
                  </span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                    Ciclo Básico y Orientado
                  </span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-3 group-hover:text-blue-700 transition-colors">
                  Nivel Secundario
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Preparación académica para los estudios superiores y la inserción responsable en la sociedad. Orientaciones con proyectos de investigación, debates, pasantías y formación ciudadana y ética.
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✔</span> Articulación con universidades
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✔</span> Orientación vocacional y proyectos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✔</span> Liderazgo solidario y pastoral juvenil
                  </li>
                </ul>
              </div>

              <Link
                href="/niveles"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-blue-950 transition-colors"
              >
                Más sobre Nivel Secundario
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PILARES INSTITUCIONALES */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-400/30">
              Por qué elegirnos
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pilares de Nuestra Educación
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Una propuesta educativa sólida que combina tradición en valores con metodologías de enseñanza modernas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:border-amber-400/50 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl mb-4">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Formación en Valores</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Priorizamos la empatía, el compromiso social, la verdad y la convivencia pacífica en cada espacio escolar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:border-amber-400/50 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-xl mb-4">
                🔬
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ciencia y Tecnología</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Aulas y laboratorios para que los estudiantes experimenten, investiguen y desarrollen soluciones creativas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:border-amber-400/50 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl mb-4">
                ⚽
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Deporte y Vida Sana</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Actividades deportivas, campamentos y talleres que estimulan la salud, la disciplina y el compañerismo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:border-amber-400/50 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl mb-4">
                🤝
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Gabinete y Familia</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Acompañamiento psicopedagógico constante y estrecha comunicación con las familias de nuestra comunidad.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. ÚLTIMAS NOTICIAS Y NOVEDADES */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                Vida Escolar
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mt-2">
                Últimas Noticias y Novedades
              </h2>
            </div>
            <Link
              href="/noticias"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-800 hover:text-blue-950 transition-colors"
            >
              Ver todas las noticias
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <article className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                <Image
                  src="/images/hero-edificio.jpg"
                  alt="Inscripciones Abiertas"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 rounded-full bg-blue-900/90 text-white text-[11px] font-bold px-3 py-1 backdrop-blur">
                  Institucional
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <time className="text-xs text-slate-500 font-semibold">Ciclo Lectivo 2026</time>
                  <h3 className="text-lg font-bold text-blue-950 mt-1 mb-2 group-hover:text-blue-700 transition-colors">
                    Apertura de Admisiones e Inscripciones
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Informamos a las familias interesadas que ya se encuentra habilitado el proceso de solicitud de vacantes para los niveles Inicial, Primario y Secundario.
                  </p>
                </div>
                <Link
                  href="/admisiones"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  Conocer requisitos y aranceles →
                </Link>
              </div>
            </article>

            <article className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                <Image
                  src="/images/hero-ciencia.jpg"
                  alt="Muestra de Ciencia y Tecnología"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 rounded-full bg-amber-500 text-blue-950 text-[11px] font-bold px-3 py-1">
                  Académico
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <time className="text-xs text-slate-500 font-semibold">Proyectos Escolares</time>
                  <h3 className="text-lg font-bold text-blue-950 mt-1 mb-2 group-hover:text-blue-700 transition-colors">
                    Feria Anual de Ciencias y Tecnología
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Estudiantes de todos los cursos expusieron investigaciones de física, química, robótica y proyectos sustentables para Paso de los Libres.
                  </p>
                </div>
                <Link
                  href="/noticias"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  Leer crónica completa →
                </Link>
              </div>
            </article>

            <article className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col">
              <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                <Image
                  src="/images/hero-deportes.jpg"
                  alt="Encuentro Deportivo"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white text-[11px] font-bold px-3 py-1">
                  Deportes
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <time className="text-xs text-slate-500 font-semibold">Comunidad</time>
                  <h3 className="text-lg font-bold text-blue-950 mt-1 mb-2 group-hover:text-blue-700 transition-colors">
                    Jornada Deportiva y de Convivencia Familiar
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Un día colmado de juegos, torneos intercolegiales, mateada comunitaria y actividades al aire libre con padres y docentes.
                  </p>
                </div>
                <Link
                  href="/noticias"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  Ver galería de fotos →
                </Link>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* 7. BANNER DE ADMISIONES & LLAMADO A LA ACCIÓN */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white/10 border border-white/20 p-8 sm:p-12 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-blue-950">
                Inscripciones Abiertas
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Sumate a la gran familia del <br className="hidden sm:inline" />
                <span className="text-amber-300">Instituto Niño Jesús</span>
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                Te invitamos a visitarnos en Paso de los Libres, conocer nuestras instalaciones y conversar con el equipo directivo sobre el futuro de tus hijos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/admisiones"
                className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-blue-950 shadow-lg hover:bg-amber-300 transition-all text-center"
              >
                Solicitar Admisión
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all text-center"
              >
                Consultar por WhatsApp / Teléfono
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
