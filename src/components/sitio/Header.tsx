"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { navegacionSitio } from "@/config/navegacion";

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur shadow-xs border-b border-slate-200">
      {/* Barra superior institucional */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white text-xs py-2 px-4 border-b border-blue-800/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              {siteConfig.codigo} • {siteConfig.ciudad}, {siteConfig.provincia}
            </span>
            <span className="hidden sm:inline text-blue-200">|</span>
            <span className="hidden sm:inline text-blue-100">{siteConfig.contacto.horario}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${siteConfig.contacto.telefono}`}
              className="text-blue-100 hover:text-white transition-colors hidden md:inline"
            >
              📞 {siteConfig.contacto.telefono}
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-bold text-blue-950 hover:bg-amber-300 transition-all shadow-xs"
            >
              Portal Escolar
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra principal con Logo y Navegación */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1 shadow-sm border border-slate-200 group-hover:shadow transition-shadow">
            <Image
              src="/images/logo.png"
              alt="Escudo Instituto Niño Jesús"
              width={52}
              height={52}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-blue-950 group-hover:text-blue-700 transition-colors uppercase">
                Instituto Niño Jesús
              </span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-blue-800">
                I-9
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Paso de los Libres, Corrientes • Diócesis y Comunidad
            </p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
          {navegacionSitio.map((item) => {
            const activo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  activo
                    ? "bg-blue-50 text-blue-900 font-bold border-b-2 border-blue-700"
                    : "text-slate-700 hover:text-blue-900 hover:bg-slate-100/80"
                }`}
              >
                {item.titulo}
              </Link>
            );
          })}
        </nav>

        {/* Botón CTA y Menú Hamburguesa Móvil */}
        <div className="flex items-center gap-3">
          <Link
            href="/admisiones"
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-900 hover:shadow-md transition-all active:scale-95"
          >
            Admisiones 2026
          </Link>

          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="lg:hidden inline-flex items-center justify-center rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-950 focus:outline-hidden"
            aria-label="Abrir menú de navegación"
          >
            {menuAbierto ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú Móvil desplegable */}
      {menuAbierto && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-1">
            {navegacionSitio.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    activo
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-blue-900"
                  }`}
                >
                  <span>{item.titulo}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/admisiones"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center rounded-xl bg-blue-800 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-900 transition-colors"
            >
              Inscripciones y Admisiones 2026
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center rounded-xl border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Ingresar al Panel Escolar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
