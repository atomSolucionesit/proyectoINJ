"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { roles } from "@/lib/auth/permisos";
import { cerrarSesion } from "@/lib/mvp/almacen";
import type { Usuario } from "@/lib/mvp/tipos";
import { Icono } from "./Icono";
import { TituloSeccion } from "./TituloSeccion";

export function PanelHeader({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const enInicio = usePathname() === "/panel";

  // Vuelve a la página anterior; si se entró directo por URL, va al inicio del panel.
  function volver() {
    if (window.history.length > 1) router.back();
    else router.push("/panel");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {!enInicio && (
          <button
            type="button"
            onClick={volver}
            aria-label="Volver atrás"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 active:scale-[0.97] sm:px-3"
          >
            <Icono nombre="volver" className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
        )}

        <Link
          href="/panel"
          className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs lg:hidden ${enInicio ? "flex" : "hidden"}`}
        >
          <Image src="/images/logo.png" alt="Inicio del panel" width={36} height={36} className="h-full w-full object-contain" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Panel de gestión</p>
          <TituloSeccion />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-800">{usuario.nombre}</p>
            <p className="text-xs font-medium text-blue-700">{roles[usuario.rol]}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-800 to-indigo-900 text-sm font-bold uppercase text-amber-300 ring-2 ring-white shadow">
            {usuario.nombre.charAt(0)}
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            await cerrarSesion();
            router.push("/login");
          }}
          className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:inline-flex"
        >
          <Icono nombre="salir" className="h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  );
}
