import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Contacto</h1>
      <p className="mt-2 text-slate-600">Formulario de contacto y datos de la institución.</p>
    </section>
  );
}
