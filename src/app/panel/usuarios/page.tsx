import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { Usuarios } from "./Usuarios";

export const metadata: Metadata = { title: "Usuarios" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function UsuariosPage() {
  return (
    <section>
      <EncabezadoPagina titulo="Usuarios" descripcion="Cuentas del panel. El rol define a qué secciones entra cada uno." />
      <Usuarios />
    </section>
  );
}
