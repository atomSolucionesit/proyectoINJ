import type { Metadata } from "next";
import { Alumnos } from "./Alumnos";

export const metadata: Metadata = { title: "Alumnos" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function AlumnosPage() {
  return (
    <section>
      <Alumnos />
    </section>
  );
}
