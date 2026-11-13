import type { Metadata } from "next";
import Link from "next/link";
import { Icono } from "@/components/panel/Icono";
import { AmonestacionesCurso } from "./AmonestacionesCurso";

export const metadata: Metadata = { title: "Amonestaciones" };

// El contenido se arma en el navegador con los datos de la API (ver panel/layout.tsx).
export const instant = false;

export default function AmonestacionesCursoPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/panel/amonestaciones" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-800">
        <Icono nombre="volver" className="h-4 w-4" />
        Cursos
      </Link>
      <AmonestacionesCurso />
    </section>
  );
}
