import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsuariosPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <p className="mt-2 text-slate-600">Usuarios del panel y sus roles.</p>
    </section>
  );
}
