import type { Metadata } from "next";
import { EncabezadoPagina, EstadoVacio } from "@/components/panel/ui";

export const metadata: Metadata = { title: "Configuración" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function ConfiguracionPage() {
  return (
    <section>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Datos generales del sitio."
      />
      <EstadoVacio
        icono="configuracion"
        titulo="Configuración en preparación"
        descripcion="Pronto vas a poder editar los datos de contacto, redes y horarios del sitio."
      />
    </section>
  );
}
