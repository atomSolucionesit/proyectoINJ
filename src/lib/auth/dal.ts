import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { puede, type Permiso } from "./permisos";

/** Sesión actual o `null`. Para Route Handlers, que responden 401 en vez de redirigir. */
export async function obtenerSesion() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // La verificación usa la hora actual (vencimiento): con Cache Components hay que
  // avisar que esto se resuelve en cada request y no al prerenderizar.
  await connection();
  return verifySessionToken(token);
}

/** Sesión actual; si no hay, redirige al login. Usar en Server Actions y páginas. */
export async function requerirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return sesion;
}

/** Sesión actual con un permiso obligatorio; si no lo tiene, vuelve al inicio del panel. */
export async function requerirPermiso(permiso: Permiso) {
  const sesion = await requerirSesion();
  if (!puede(sesion.rol, permiso)) redirect("/panel?denegado=1");
  return sesion;
}
