import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admisiones" };

export default function AdmisionesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Admisiones</h1>
      <p className="mt-2 text-slate-600">Requisitos e información de inscripción.</p>
    </section>
  );
}
