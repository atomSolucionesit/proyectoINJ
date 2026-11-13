import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoPagina } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { Imprimir } from "./Imprimir";

export const metadata: Metadata = { title: "Reservar impresión" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function ImprimirPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/panel/biblioteca" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-800">
        <Icono nombre="volver" className="h-4 w-4" />
        Biblioteca
      </Link>
      <EncabezadoPagina titulo="Reservar impresión" descripcion="Elegí cómo la querés y pagala para que la preparen." />
      <Imprimir />
    </section>
  );
}
