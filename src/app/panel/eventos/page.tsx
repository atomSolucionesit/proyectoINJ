import type { Metadata } from "next";

export const metadata: Metadata = { title: "Eventos" };

export default function PanelEventosPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Eventos</h1>
      <p className="mt-2 text-slate-600">Administrar eventos y calendario.</p>
    </section>
  );
}
