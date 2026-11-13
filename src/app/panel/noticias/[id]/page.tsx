import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { EditarNoticia } from "../FormNoticia";

export const metadata: Metadata = { title: "Editar noticia" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function EditarNoticiaPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <EncabezadoPagina titulo="Editar noticia" descripcion="Los cambios se ven en el sitio apenas guardás." />
      <EditarNoticia />
    </section>
  );
}
