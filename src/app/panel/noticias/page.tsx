import type { Metadata } from "next";
import { BotonAccion, EncabezadoPagina } from "@/components/panel/ui";
import { Permitido } from "@/components/panel/Permitido";
import { Noticias } from "./Noticias";

export const metadata: Metadata = { title: "Noticias" };

const nueva = { titulo: "Nueva noticia", href: "/panel/noticias/nueva" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function PanelNoticiasPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <EncabezadoPagina titulo="Noticias" descripcion="Las publicadas aparecen en el inicio y en la sección Noticias del sitio.">
        <Permitido permiso="noticias:editar">
          <BotonAccion {...nueva} />
        </Permitido>
      </EncabezadoPagina>
      <Noticias />
    </section>
  );
}
