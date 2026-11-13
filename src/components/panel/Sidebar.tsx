"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navegacionParaRol } from "@/config/navegacion";
import type { Rol } from "@/lib/auth/permisos";
import { siteConfig } from "@/config/site";
import { useAlmacen } from "@/lib/mvp/almacen";
import { cn, esRutaActiva } from "@/lib/utils";
import { Icono } from "./Icono";

/** Menú lateral: solo visible en pantallas grandes (en celular se usa MobileNav). */
export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const items = navegacionParaRol(rol);
  const { avisosCuotas } = useAlmacen();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-gradient-to-b from-blue-950 via-blue-950 to-indigo-950 text-blue-100 lg:flex">
      <Link href="/panel" className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
          <Image src="/images/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold uppercase tracking-tight text-white">{siteConfig.nombre}</span>
          <span className="text-xs font-medium text-amber-300">Panel de gestión</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-300/70">Menú</p>
        {items.map((item) => {
          const activo = esRutaActiva(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activo ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white",
              )}
            >
              <Icono
                nombre={item.icono}
                className={cn(activo ? "text-amber-300" : "text-blue-300/80 group-hover:text-blue-100")}
              />
              {item.titulo}
              {item.href === "/panel/cuotas" && avisosCuotas > 0 ? (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${avisosCuotas} pagos nuevos`}>
                  {avisosCuotas}
                </span>
              ) : (
                activo && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white"
        >
          <Icono nombre="externo" className="text-blue-300/80" />
          Ver sitio público
        </Link>
      </div>
    </aside>
  );
}
