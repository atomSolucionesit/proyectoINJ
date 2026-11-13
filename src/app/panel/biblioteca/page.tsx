import type { Metadata } from "next";
import { Biblioteca } from "./Biblioteca";

export const metadata: Metadata = { title: "Biblioteca" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function BibliotecaPage() {
  return (
    <section className="space-y-8">
      <Biblioteca />
    </section>
  );
}
