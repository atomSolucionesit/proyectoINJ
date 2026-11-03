import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva noticia" };

export default function NuevaNoticiaPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Nueva noticia</h1>
      <p className="mt-2 text-slate-600">Formulario de creación de noticia.</p>
    </section>
  );
}
