import type { Metadata } from "next";
import { NotasDelMes } from "./NotasDelMes";

export const metadata: Metadata = { title: "Notas del mes" };

// El contenido se arma en el navegador con los datos del alumno (ver panel/layout.tsx).
export const instant = false;

export default function NotasPage() {
  return (
    <section>
      <NotasDelMes />
    </section>
  );
}
