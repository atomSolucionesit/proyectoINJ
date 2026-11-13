import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Logger } from "@nestjs/common";

/** Contraseña que reciben las cuentas nuevas (en la demo, todas usan la misma). Cambiala con PASSWORD_INICIAL. */
export const passwordInicial = () => process.env.PASSWORD_INICIAL || "pasodeloslibres";

/** Minutos que dura una sesión antes de tener que volver a ingresar. */
export const minutosDeSesion = () => {
  const minutos = Number(process.env.SESION_MINUTOS);
  return Number.isInteger(minutos) && minutos > 0 ? minutos : 60;
};

/** Para comparar nombres al ingresar: sin mayúsculas, tildes ni espacios de más. "  Sofía  PÉREZ " → "sofia perez". */
export const normalizarNombre = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const soloDigitos = (valor: unknown) => (typeof valor === "string" ? valor.replace(/\D/g, "") : "");

/** "45123456" → "45.123.456" */
export const formatoDni = (dni: string) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ---------- Contraseña visible para el administrador ---------- */

const logger = new Logger("Cuentas");
let avisado = false;

/** Clave de 32 bytes para cifrar las contraseñas. Sale de PASSWORD_KEY (o, si falta, de JWT_SECRET). */
function clave() {
  const base = process.env.PASSWORD_KEY || process.env.JWT_SECRET;
  if (!base) throw new Error("Falta PASSWORD_KEY (o JWT_SECRET) en backend/.env.");
  if (!process.env.PASSWORD_KEY && !avisado) {
    avisado = true;
    logger.warn("Falta PASSWORD_KEY en .env: las contraseñas se cifran con JWT_SECRET. Si cambiás JWT_SECRET, el administrador deja de verlas.");
  }
  return createHash("sha256").update(base).digest();
}

/** Cifra la contraseña (AES-256-GCM) para guardarla junto al hash: el administrador la puede ver en Usuarios. */
export function cifrarPassword(password: string) {
  const iv = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", clave(), iv);
  const datos = Buffer.concat([cifrador.update(password, "utf8"), cifrador.final()]);
  return [iv, cifrador.getAuthTag(), datos].map((b) => b.toString("base64url")).join(".");
}

/** `null` si no hay contraseña guardada o no se puede leer (por ejemplo, si cambió la clave). */
export function descifrarPassword(cifrada: string | null) {
  if (!cifrada) return null;
  try {
    const [iv, etiqueta, datos] = cifrada.split(".").map((p) => Buffer.from(p, "base64url"));
    const descifrador = createDecipheriv("aes-256-gcm", clave(), iv);
    descifrador.setAuthTag(etiqueta);
    return Buffer.concat([descifrador.update(datos), descifrador.final()]).toString("utf8");
  } catch {
    return null;
  }
}
