import Link from "next/link";
import Image from "next/image";
import { cacheLife } from "next/cache";
import { siteConfig } from "@/config/site";
import { navegacionSitio } from "@/config/navegacion";

async function anioActual() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const anio = await anioActual();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Columna 1: Identidad y Escudo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 bg-white/10 rounded-xl p-1 border border-white/20">
                <Image
                  src="/images/logo.png"
                  alt="Escudo Instituto Niño Jesús"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight uppercase">
                  Instituto Niño Jesús
                </h3>
                <p className="text-xs font-semibold text-amber-400">
                  {siteConfig.codigo} • {siteConfig.ciudad}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comunidad educativa comprometida con la formación integral en valores humanos y excelencia académica en Paso de los Libres, Corrientes.
            </p>
            <div className="pt-2">
              <span className="inline-block rounded-md bg-blue-900/60 px-2.5 py-1 text-[11px] font-semibold text-blue-200 border border-blue-700/50">
                Diócesis y Gestión Privada I-9
              </span>
            </div>
          </div>

          {/* Columna 2: Navegación Rápida */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
            <ul className="space-y-2 text-xs">
              {navegacionSitio.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-amber-400 transition-colors">
                    {item.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Niveles Educativos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Niveles Educativos</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-semibold">Nivel Inicial:</span> Salas de 3, 4 y 5 años
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-slate-300 font-semibold">Nivel Primario:</span> 1° a 6° Grado
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span className="text-slate-300 font-semibold">Nivel Secundario:</span> Ciclo Básico y Orientado
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/admisiones"
                className="inline-block text-xs font-bold text-amber-400 hover:underline"
              >
                Información de inscripciones 2026 →
              </Link>
            </div>
          </div>

          {/* Columna 4: Contacto & Ubicación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contacto</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">📍</span>
                <span>{siteConfig.ciudad}, {siteConfig.provincia}, Argentina</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-400 shrink-0">📞</span>
                <span>{siteConfig.contacto.telefono}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-400 shrink-0">✉️</span>
                <span>{siteConfig.contacto.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-400 shrink-0">🕒</span>
                <span>{siteConfig.contacto.horario}</span>
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900/60 border border-blue-700/60 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 transition-colors"
              >
                🔐 Acceso Portal Institucional
              </Link>
            </div>
          </div>

        </div>

        {/* Barra inferior de derechos */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {anio} {siteConfig.nombre} ({siteConfig.codigo}). Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Paso de los Libres, Corrientes</span>
            <span>•</span>
            <Link href="/contacto" className="hover:text-white transition-colors">
              Mesa de Ayuda
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
