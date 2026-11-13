import type { Metadata } from "next";
import { CursosAmonestaciones } from "./CursosAmonestaciones";

export const metadata: Metadata = { title: "Amonestaciones" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function AmonestacionesPage() {
  return (
    <section>
      <CursosAmonestaciones />
    </section>
  );
}
