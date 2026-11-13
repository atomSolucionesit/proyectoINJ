import type { Metadata } from "next";
import { Resumen } from "./Resumen";

export const metadata: Metadata = { title: "Resumen" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function PanelPage() {
  return <Resumen />;
}
