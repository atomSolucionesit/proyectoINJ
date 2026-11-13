import type { Metadata } from "next";
import { Asistencias } from "./Asistencias";

export const metadata: Metadata = { title: "Asistencias" };

// El contenido se arma en el navegador con los datos del alumno (ver panel/layout.tsx).
export const instant = false;

export default function AsistenciasPage() {
  return (
    <section>
      <Asistencias />
    </section>
  );
}
