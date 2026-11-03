import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="mt-2 text-slate-600">Datos generales del sitio.</p>
    </section>
  );
}
