import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { FormNoticia } from "../FormNoticia";

export const metadata: Metadata = { title: "Nueva noticia" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function NuevaNoticiaPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <EncabezadoPagina titulo="Nueva noticia" descripcion="Escribila, agregale una foto y publicala en el sitio." />
      <FormNoticia />
    </section>
  );
}
