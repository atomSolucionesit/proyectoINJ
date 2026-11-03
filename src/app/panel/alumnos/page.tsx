import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alumnos" };

export default function AlumnosPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Alumnos</h1>
      <p className="mt-2 text-slate-600">Gestión de alumnos.</p>
    </section>
  );
}
