import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/panel/ui";
import { Cursos } from "./Cursos";

export const metadata: Metadata = { title: "Cursos" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function CursosPage() {
  return (
    <section>
      <EncabezadoPagina titulo="Cursos" descripcion="Secundaria de 1° a 6° Año. Entrá a un curso para ver sus alumnos y tomar asistencia." />
      <Cursos />
    </section>
  );
}
