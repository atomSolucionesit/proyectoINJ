import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { Eventos } from "./Eventos";

export const metadata: Metadata = { title: "Eventos" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function PanelEventosPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <EncabezadoPagina titulo="Eventos" descripcion="Actos, actividades y celebraciones del Instituto. Los próximos también aparecen en el sitio." />
      <Eventos />
    </section>
  );
}
