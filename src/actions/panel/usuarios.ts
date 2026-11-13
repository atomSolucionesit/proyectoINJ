"use server";

import { refresh } from "next/cache";
import { requerirPermiso } from "@/lib/auth/dal";
import { rolesAsignables } from "@/lib/auth/permisos";
import { hashearPassword } from "@/lib/auth/password";
import * as datos from "@/lib/usuarios/datos";

export type EstadoUsuario = { error?: string; ok?: string } | undefined;

function texto(valor: FormDataEntryValue | null, max: number) {
  return String(valor ?? "").trim().slice(0, max);
}

export async function crearUsuario(_estado: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  await requerirPermiso("seccion:usuarios");

  const nombre = texto(formData.get("nombre"), 120);
  const email = texto(formData.get("email"), 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = String(formData.get("rol") ?? "") as (typeof rolesAsignables)[number];

  if (!nombre) return { error: "Poné el nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no es válido." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (!rolesAsignables.includes(rol)) return { error: "Elegí un rol." };
  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return { error: "Ese email ya está en uso." };

  const esAlumno = rol === "alumno";
  const padreId = esAlumno ? texto(formData.get("padre_id"), 36) || null : null;
  if (padreId && (await datos.obtenerUsuario(padreId))?.rol !== "padre") return { error: "El padre/madre elegido no existe." };

  try {
    await datos.crearUsuario({
      nombre,
      email,
      password_hash: await hashearPassword(password),
      rol,
      dni: texto(formData.get("dni"), 20) || null,
      curso: esAlumno ? texto(formData.get("curso"), 40) || null : null,
      padre_id: padreId,
    });
  } catch (error) {
    if (String(error).includes("usuarios_email_key")) return { error: "Ya existe una cuenta con ese email." };
    throw error;
  }

  refresh();
  return { ok: `Cuenta de ${nombre} creada.` };
}

export async function eliminarUsuario(id: string) {
  const sesion = await requerirPermiso("seccion:usuarios");
  if (id === sesion.uid) return; // nadie se borra a sí mismo
  await datos.eliminarUsuario(id);
  refresh();
}
