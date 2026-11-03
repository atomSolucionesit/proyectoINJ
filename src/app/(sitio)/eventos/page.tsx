import type { Metadata } from "next";

export const metadata: Metadata = { title: "Eventos" };

export default function EventosPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Eventos</h1>
      <p className="mt-2 text-slate-600">Calendario de actividades y eventos.</p>
    </section>
  );
}
