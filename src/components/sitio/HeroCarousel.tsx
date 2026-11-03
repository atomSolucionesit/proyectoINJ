"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export type SlideHero = {
  id: number;
  etiqueta: string;
  titulo: string;
  resaltado: string;
  descripcion: string;
  botonPrincipal: { texto: string; href: string };
  botonSecundario: { texto: string; href: string };
  insignia: string;
  enfoque: string;
};

const SLIDES: SlideHero[] = [
  {
    id: 1,
    etiqueta: "Institución Educativa I-9 • Paso de los Libres",
    titulo: "INSTITUTO",
    resaltado: "NIÑO JESÚS",
    descripcion:
      "Educación de excelencia con valores cristianos y humanos. Acompañamos a las familias en la formación académica y personal de sus hijos en los niveles Inicial, Primario y Secundario.",
    botonPrincipal: { texto: "Conocer Propuesta Educativa", href: "#niveles" },
    botonSecundario: { texto: "Admisiones 2026", href: "/admisiones" },
    insignia: "Paso de los Libres, Corrientes",
    enfoque: "Edificio Histórico e Identidad",
  },
  {
    id: 2,
    etiqueta: "Niveles Inicial, Primario y Secundario",
    titulo: "TRAYECTORIA EDUCATIVA",
    resaltado: "INTEGRAL Y CONTINUA",
    descripcion:
      "Acompañamos el crecimiento de tus hijos desde el jardín de infantes hasta el bachillerato con docentes de profunda vocación y continuo compromiso pedagógico.",
    botonPrincipal: { texto: "Nuestros Niveles", href: "/niveles" },
    botonSecundario: { texto: "Proyecto Pedagógico", href: "/institucional" },
    insignia: "3 Niveles de Formación",
    enfoque: "Innovación & Calidad en el Aula",
  },
  {
    id: 3,
    etiqueta: "Formación en Valores y Convivencia",
    titulo: "UNA COMUNIDAD BASADA EN",
    resaltado: "EL RESPETO Y LA SOLIDARIDAD",
    descripcion:
      "Cultivamos el amor por el conocimiento, el trabajo en equipo, la espiritualidad y la responsabilidad social para construir un futuro prometedor.",
    botonPrincipal: { texto: "Ideario Institucional", href: "/institucional" },
    botonSecundario: { texto: "Contáctanos", href: "/contacto" },
    insignia: "Valores Cristianos y Ciudadanos",
    enfoque: "Comunidad & Convivencia Fraterna",
  },
  {
    id: 4,
    etiqueta: "Ciclo Lectivo 2026 Abierto",
    titulo: "INSCRIPCIONES Y",
    resaltado: "ADMISIÓN ABIERTA",
    descripcion:
      "Sumate a la gran familia del Instituto Niño Jesús I-9. Solicitá tu entrevista presencial o completá el formulario de preinscripción online.",
    botonPrincipal: { texto: "Postular a Admisión", href: "/admisiones" },
    botonSecundario: { texto: "Consultar por WhatsApp", href: "/contacto" },
    insignia: "Vacantes Disponibles",
    enfoque: "Inscripciones Ciclo 2026",
  },
];

export function HeroCarousel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = SLIDES.length;
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);

  const siguiente = useCallback(() => {
    setActual((prev) => (prev + 1) % total);
  }, [total]);

  const anterior = useCallback(() => {
    setActual((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (pausado) return;
    intervaloRef.current = setInterval(() => {
      siguiente();
    }, 6000);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [pausado, siguiente]);

  return (
    <section
      aria-label="Carrusel Institucional"
      className="relative w-full overflow-hidden bg-slate-950 text-white min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      {/* FONDO PRINCIPAL DEL CARRUSEL: FOTO REAL DE LA ESCUELA INSTITUTO NIÑO JESÚS */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/fachada-instituto.png"
          alt="Edificio del Instituto Niño Jesús - Paso de los Libres"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-transform duration-1000 ease-out scale-102"
        />

        {/* Gradientes elegantes para contrastar texto manteniendo visible la fachada */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/75 to-blue-950/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/60" />

        {/* Patrón de puntos sutil institucional */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Contenido Central del Hero */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Bloque de Textos y Llamados a la Acción */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Badge Institucional Superior */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-blue-900/90 px-4 py-1.5 backdrop-blur shadow-md">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold tracking-wide uppercase text-amber-300">
                {SLIDES[actual].etiqueta}
              </span>
            </div>

            {/* Gran Título de la Escuela con Animación de Slide */}
            <div className="space-y-2 transition-all duration-500 key={actual}">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white drop-shadow-lg">
                {SLIDES[actual].titulo}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                  {SLIDES[actual].resaltado}
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-blue-200 uppercase flex items-center gap-2">
                <span>Colegio Privado I-9</span>
                <span>•</span>
                <span>Paso de los Libres, Corrientes</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{SLIDES[actual].enfoque}</span>
              </p>
            </div>

            {/* Descripción del slide */}
            <p className="max-w-2xl text-base sm:text-lg text-slate-100 leading-relaxed drop-shadow-md">
              {SLIDES[actual].descripcion}
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={SLIDES[actual].botonPrincipal.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3.5 text-sm font-extrabold text-blue-950 shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-yellow-300 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <span>{SLIDES[actual].botonPrincipal.texto}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href={SLIDES[actual].botonSecundario.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/50 bg-white/15 backdrop-blur px-6 py-3.5 text-sm font-bold text-white hover:bg-white/25 hover:border-white transition-all shadow-md"
              >
                <span>{SLIDES[actual].botonSecundario.texto}</span>
              </Link>
            </div>

            {/* Características Rápidas en Footer del Hero */}
            <div className="pt-6 border-t border-white/20 grid grid-cols-3 gap-3 max-w-xl text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-900 text-amber-300 font-bold shadow-xs">
                  ✓
                </span>
                <span>Nivel Inicial, Primario y Secundario</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-900 text-amber-300 font-bold shadow-xs">
                  ✓
                </span>
                <span>Valores Cristianos y Formación Ética</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-900 text-amber-300 font-bold shadow-xs">
                  ✓
                </span>
                <span>Paso de los Libres, Ctes.</span>
              </div>
            </div>

          </div>

          {/* Bloque Lateral con Escudo Oficial y Tarjeta de Identidad */}
          <div className="hidden lg:flex lg:col-span-4 flex-col items-center justify-center">
            <div className="relative group w-full max-w-sm rounded-3xl bg-blue-950/70 p-6 backdrop-blur-md border border-white/25 shadow-2xl transition-all duration-300 hover:border-amber-400/60">
              
              {/* Escudo Oficial Destacado en Alta Definición */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative h-36 w-36 drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/images/logo.png"
                    alt="Escudo Oficial Instituto Niño Jesús I-9"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                <div>
                  <h2 className="text-xl font-black tracking-tight text-white uppercase">
                    Instituto Niño Jesús
                  </h2>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                    I-9 • Paso de los Libres
                  </p>
                </div>

                <div className="w-full rounded-2xl bg-slate-900/80 p-4 border border-blue-800/60 text-left text-xs space-y-2 text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Ciclo Lectivo:</span>
                    <span className="font-bold text-amber-300">2026 Abierto</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Modalidades:</span>
                    <span className="font-bold text-white">Bachiller Orientado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Localidad:</span>
                    <span className="font-bold text-white">Paso de los Libres</span>
                  </div>
                </div>

                <Link
                  href="/admisiones"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-black tracking-wide text-center uppercase transition-all shadow-md"
                >
                  Postular para Admisión
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Controles del Carrusel (Flechas Anterior y Siguiente) */}
      <button
        type="button"
        onClick={anterior}
        aria-label="Diapositiva anterior"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur border border-white/20 hover:bg-amber-400 hover:text-blue-950 transition-all shadow-lg active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={siguiente}
        aria-label="Siguiente diapositiva"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur border border-white/20 hover:bg-amber-400 hover:text-blue-950 transition-all shadow-lg active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>

      {/* Barra de progreso e Indicadores Inferiores */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Contador de slides */}
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-200">
            <span className="text-amber-400 text-sm">0{actual + 1}</span>
            <span className="text-slate-400">/</span>
            <span>0{total}</span>
          </div>

          {/* Dots interactivos de navegación */}
          <div className="flex items-center gap-2 sm:gap-3">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ir a diapositiva ${i + 1}: ${slide.resaltado}`}
                className={`group relative h-2.5 rounded-full transition-all duration-300 ${
                  i === actual
                    ? "w-8 sm:w-12 bg-amber-400 shadow-sm shadow-amber-400/50"
                    : "w-2.5 sm:w-3 bg-white/40 hover:bg-white/80"
                }`}
              >
                <span className="sr-only">{slide.resaltado}</span>
              </button>
            ))}
          </div>

          {/* Estado de pausa o reproducción automática */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-300">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${pausado ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span>{pausado ? "Pausado" : "Automático"}</span>
          </div>

        </div>
      </div>
    </section>
  );
}
