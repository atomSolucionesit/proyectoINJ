import type { Metadata } from "next";
import { EncabezadoPagina, EstadoVacio } from "@/components/panel/ui";

export const metadata: Metadata = { title: "Mensajes" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function MensajesPage() {
  return (
    <section>
      <EncabezadoPagina
        titulo="Mensajes"
        descripcion="Consultas recibidas desde el formulario de contacto."
      />
      <EstadoVacio
        icono="mensajes"
        titulo="Bandeja vacía"
        descripcion="Acá vas a ver las consultas que lleguen desde la página de contacto."
      />
    </section>
  );
}
