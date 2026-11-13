// Crea o actualiza las tablas en la base de datos. Uso: npm run db:setup
// Ejecuta en orden todos los .sql de esta carpeta (01-..., 02-...). Se puede correr varias veces.
import { readdirSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const carpeta = new URL("./", import.meta.url);
const archivos = readdirSync(carpeta).filter((f) => f.endsWith(".sql")).sort();

for (const nombre of archivos) {
  const sentencias = readFileSync(new URL(nombre, carpeta), "utf8")
    .replace(/--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentencia of sentencias) {
    await sql.query(sentencia);
  }
  console.log(`✓ ${nombre} (${sentencias.length} sentencias)`);
}
