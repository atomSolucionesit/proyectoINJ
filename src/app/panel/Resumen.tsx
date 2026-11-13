"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { navegacionParaRol } from "@/config/navegacion";
import { siteConfig } from "@/config/site";
import { Icono, type NombreIcono } from "@/components/panel/Icono";
import { puede, roles, type Rol } from "@/lib/auth/permisos";
import { useUsuario } from "@/lib/mvp/almacen";

type Atajo = { titulo: string; href: string; icono: NombreIcono };

function atajosPara(rol: Rol): Atajo[] {
  const atajos: Atajo[] = [];
  if (puede(rol, "biblioteca:pedidos")) atajos.push({ titulo: "Ver pedidos", href: "/panel/biblioteca#pedidos", icono: "imprimir" });
  if (puede(rol, "noticias:editar")) atajos.push({ titulo: "Nueva noticia", href: "/panel/noticias/nueva", icono: "agregar" });
  if (puede(rol, "seccion:biblioteca")) atajos.push({ titulo: "Imprimir un archivo", href: "/panel/biblioteca/subir", icono: "imprimir" });
  if (puede(rol, "eventos:editar")) atajos.push({ titulo: "Cargar evento", href: "/panel/eventos", icono: "eventos" });
  return atajos.slice(0, 3);
}

export function Resumen() {
  const denegado = useSearchParams().has("denegado");

  return (
    <div className="space-y-8">
      {denegado && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
          Tu cuenta no tiene acceso a esa sección.
        </p>
      )}

      {/* Bienvenida */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {siteConfig.sigla} {siteConfig.codigo} • {siteConfig.ciudad}
          </span>
          <Bienvenida />
        </div>
      </section>

      {/* Secciones */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Secciones</h2>
        <Secciones />
      </section>
    </div>
  );
}

function Bienvenida() {
  const { nombre, rol } = useUsuario();
  const atajos = atajosPara(rol);

  return (
    <>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">¡Hola, {nombre.split(" ")[0]}!</h1>
      <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
        Ingresaste como <strong className="text-amber-300">{roles[rol]}</strong> al panel del {siteConfig.nombre}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {atajos.map((atajo, i) => (
          <Link
            key={atajo.href}
            href={atajo.href}
            className={
              i === 0
                ? "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-blue-950 shadow-sm transition-all hover:bg-amber-300 active:scale-[0.98] sm:py-2.5"
                : "inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 sm:py-2.5"
            }
          >
            <Icono nombre={atajo.icono} className="h-4 w-4" />
            {atajo.titulo}
          </Link>
        ))}
      </div>
    </>
  );
}

function Secciones() {
  const { rol } = useUsuario();
  const secciones = navegacionParaRol(rol).filter((item) => item.href !== "/panel");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {secciones.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 transition-colors group-hover:bg-blue-900 group-hover:text-amber-300">
            <Icono nombre={item.icono} className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900">{item.titulo}</span>
            <span className="block truncate text-sm text-slate-500">{item.descripcion}</span>
          </span>
          <Icono nombre="flecha" className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" />
        </Link>
      ))}
    </div>
  );
}
