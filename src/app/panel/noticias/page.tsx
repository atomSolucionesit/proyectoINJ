import type { Metadata } from "next";

export const metadata: Metadata = { title: "Noticias" };

export default function PanelNoticiasPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Noticias</h1>
      <p className="mt-2 text-slate-600">Administrar noticias del sitio.</p>
    </section>
  );
}
