import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docentes" };

export default function DocentesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Docentes</h1>
      <p className="mt-2 text-slate-600">Gestión de docentes.</p>
    </section>
  );
}
