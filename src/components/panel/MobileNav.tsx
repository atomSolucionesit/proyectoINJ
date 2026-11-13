"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navegacionParaRol } from "@/config/navegacion";
import type { Rol } from "@/lib/auth/permisos";
import { cerrarSesion, useAlmacen } from "@/lib/mvp/almacen";
import { cn, esRutaActiva } from "@/lib/utils";
import { Icono } from "./Icono";

/** Barra de pestañas inferior + hoja "Más" con el resto del menú. Solo en celular/tablet. */
export function MobileNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navegacionParaRol(rol);
  const principales = items.filter((item) => item.principal);
  const { avisosCuotas } = useAlmacen();
  const [abierto, setAbierto] = useState(false);
  const enSecundaria = !principales.some((item) => esRutaActiva(pathname, item.href));

  // Bloquea el scroll de fondo mientras la hoja está abierta.
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => {
                const activo = esRutaActiva(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center text-xs font-semibold transition-colors",
                      activo ? "bg-blue-50 text-blue-900" : "text-slate-600 active:bg-slate-100",
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-xl",
                        activo ? "bg-blue-900 text-amber-300" : "bg-slate-100 text-blue-900",
                      )}
                    >
                      <Icono nombre={item.icono} />
                      {item.href === "/panel/cuotas" && avisosCuotas > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {avisosCuotas}
                        </span>
                      )}
                    </span>
                    {item.titulo}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/"
                onClick={() => setAbierto(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 active:bg-slate-50"
              >
                <Icono nombre="externo" className="h-4 w-4" />
                Ver sitio
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setAbierto(false);
                  await cerrarSesion();
                  router.push("/login");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-700 active:bg-red-100"
              >
                <Icono nombre="salir" className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {principales.map((item) => {
            const activo = !abierto && esRutaActiva(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  onClick={() => setAbierto(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                    activo ? "text-blue-900" : "text-slate-500",
                  )}
                >
                  <span className={cn("rounded-full px-4 py-1 transition-colors", activo && "bg-blue-100")}>
                    <Icono nombre={item.icono} />
                  </span>
                  {item.titulo}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setAbierto(!abierto)}
              aria-expanded={abierto}
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                abierto || enSecundaria ? "text-blue-900" : "text-slate-500",
              )}
            >
              <span className={cn("relative rounded-full px-4 py-1 transition-colors", (abierto || enSecundaria) && "bg-blue-100")}>
                <Icono nombre={abierto ? "cerrar" : "menu"} />
                {!abierto && avisosCuotas > 0 && <span className="absolute top-0 right-2 h-2.5 w-2.5 rounded-full bg-red-500" aria-label="Hay pagos nuevos" />}
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
