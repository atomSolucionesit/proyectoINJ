"use client";

import { usePathname } from "next/navigation";
import { navegacionPanel } from "@/config/navegacion";
import { esRutaActiva } from "@/lib/utils";

/** Nombre de la sección actual, según la URL. */
export function TituloSeccion() {
  const pathname = usePathname();
  const actual = navegacionPanel.find((item) => esRutaActiva(pathname, item.href));

  return <h2 className="truncate text-base font-bold text-slate-900">{actual?.titulo ?? "Panel"}</h2>;
}
