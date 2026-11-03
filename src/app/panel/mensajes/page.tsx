import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mensajes" };

export default function MensajesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Mensajes</h1>
      <p className="mt-2 text-slate-600">Consultas recibidas desde el formulario de contacto.</p>
    </section>
  );
}
