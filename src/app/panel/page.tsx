import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resumen" };

export default function PanelPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Resumen</h1>
      <p className="mt-2 text-slate-600">Estadísticas y accesos rápidos de la gestión.</p>
    </section>
  );
}
