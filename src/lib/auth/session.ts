import { createHmac, timingSafeEqual } from "node:crypto";
import { roles, type Rol } from "./permisos";

/** Nombre de la cookie de sesión del panel de control. */
export const SESSION_COOKIE = "session";

/** Duración de la sesión: 7 días. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Datos del usuario guardados en la cookie firmada. */
export type Sesion = { uid: string; nombre: string; email: string; rol: Rol };

type SessionPayload = Sesion & { exp: number };

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno SESSION_SECRET (ver .env.local).");
  return secret;
}

function sign(data: string) {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Crea un token firmado `payload.firma` para guardar en la cookie. */
export function createSessionToken(sesion: Sesion) {
  const payload: SessionPayload = { ...sesion, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Devuelve el contenido de la sesión si la firma es válida y no venció; si no, `null`. */
export function verifySessionToken(token: string | undefined): Sesion | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    // Las cookies viejas (sin rol) dejan de valer y piden iniciar sesión de nuevo.
    const valida = payload.exp > Date.now() && Boolean(payload.uid) && payload.rol in roles;
    return valida ? payload : null;
  } catch {
    return null;
  }
}
