import type { Metadata } from "next";
import { TomarAsistencia } from "./TomarAsistencia";

export const metadata: Metadata = { title: "Asistencia" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function AsistenciaPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <TomarAsistencia />
    </section>
  );
}
