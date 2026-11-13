import type { Metadata } from "next";
import Link from "next/link";
import { Icono } from "@/components/panel/Icono";
import { DetalleReserva } from "./DetalleReserva";

export const metadata: Metadata = { title: "Reserva de impresión" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function ReservaPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/panel/biblioteca" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-800">
        <Icono nombre="volver" className="h-4 w-4" />
        Biblioteca
      </Link>
      <DetalleReserva />
    </section>
  );
}
