import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cursos" };

export default function CursosPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Cursos</h1>
      <p className="mt-2 text-slate-600">Gestión de cursos y divisiones.</p>
    </section>
  );
}
