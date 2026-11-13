"use client";

import { puede, type Permiso } from "@/lib/auth/permisos";
import { useUsuario } from "@/lib/mvp/almacen";

/** Muestra `children` solo si el rol actual tiene el permiso (por ejemplo, el botón "Nueva noticia"). */
export function Permitido({ permiso, children }: { permiso: Permiso; children: React.ReactNode }) {
  const { rol } = useUsuario();
  return puede(rol, permiso) ? children : null;
}
