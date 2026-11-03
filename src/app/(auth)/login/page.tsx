import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  // TODO: conectar con una Server Action de autenticación (src/actions/panel).
  return (
    <form className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-xl font-bold">Acceso al panel</h1>
      <input name="email" type="email" placeholder="Email" required className="rounded border px-3 py-2" />
      <input name="password" type="password" placeholder="Contraseña" required className="rounded border px-3 py-2" />
      <Button type="submit">Ingresar</Button>
    </form>
  );
}
