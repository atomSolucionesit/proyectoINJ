import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { Docentes } from "./Docentes";

export const metadata: Metadata = { title: "Docentes" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function DocentesPage() {
  return (
    <section>
      <EncabezadoPagina titulo="Docentes" descripcion="Profesores y preceptores: materias, presentes, tardanzas y faltas." />
      <Docentes />
    </section>
  );
}
