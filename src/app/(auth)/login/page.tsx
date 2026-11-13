import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  // LoginForm lee `?redirect=` de la URL, por eso va dentro de un Suspense.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
