import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/** Hashea una contraseña con scrypt. Formato: `scrypt:<salt>:<hash>` (base64url). */
export async function hashearPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function verificarPassword(password: string, guardado: string) {
  const [algoritmo, salt, hash] = guardado.split(":");
  if (algoritmo !== "scrypt" || !salt || !hash) return false;
  const esperado = Buffer.from(hash, "base64url");
  const calculado = await scryptAsync(password, Buffer.from(salt, "base64url"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}
