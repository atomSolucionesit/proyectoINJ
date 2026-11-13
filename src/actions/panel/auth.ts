"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, type Sesion } from "@/lib/auth/session";
import { verificarPassword } from "@/lib/auth/password";
import { buscarParaLogin } from "@/lib/usuarios/datos";
import { dbConfigurada } from "@/lib/db";

export type LoginState = { error?: string } | undefined;

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Administrador principal, definido en .env.local (sirve aunque no haya base de datos). */
function esAdmin(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  return !!adminEmail && !!adminPassword && safeEqual(email, adminEmail) && safeEqual(password, adminPassword);
}

/** El rol sale de la cuenta, no de lo que elija la persona: así nadie puede entrar como profesor sin serlo. */
async function autenticar(email: string, password: string): Promise<Sesion | null> {
  if (esAdmin(email, password)) {
    return { uid: "admin", nombre: "Administración", email, rol: "admin" };
  }
  if (!dbConfigurada()) return null;
  const usuario = await buscarParaLogin(email);
  if (!usuario || !(await verificarPassword(password, usuario.password_hash))) return null;
  return { uid: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const destino = String(formData.get("redirect") ?? "");

  let sesion: Sesion | null;
  try {
    sesion = await autenticar(email, password);
  } catch (error) {
    console.error("[login]", error);
    return { error: "No se pudo verificar la cuenta. Revisá la conexión con la base de datos." };
  }
  if (!sesion) return { error: "Email o contraseña incorrectos." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(sesion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Solo se permite volver a rutas internas del panel.
  redirect(destino.startsWith("/panel") ? destino : "/panel");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
