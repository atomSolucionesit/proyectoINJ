import type { Metadata } from "next";

export const metadata: Metadata = { title: "Niveles" };

export default function NivelesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Niveles</h1>
      <p className="mt-2 text-slate-600">Nivel inicial, primario y secundario.</p>
    </section>
  );
}
