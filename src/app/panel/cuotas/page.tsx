import type { Metadata } from "next";
import { Cuotas } from "./Cuotas";

export const metadata: Metadata = { title: "Cuotas" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function CuotasPage() {
  return (
    <section>
      <Cuotas />
    </section>
  );
}
