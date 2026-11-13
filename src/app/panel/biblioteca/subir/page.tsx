import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { SubirArchivoForm } from "./SubirArchivoForm";

export const metadata: Metadata = { title: "Subir archivo" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function SubirArchivoPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <EncabezadoPagina titulo="Subir archivo" descripcion="Elegí el archivo y completá los datos." />
      <SubirArchivoForm />
    </section>
  );
}
