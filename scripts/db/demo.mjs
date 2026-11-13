// Crea una cuenta de prueba por cada rol. Uso: npm run db:demo
// Todas usan la contraseña Demo2026! — borralas antes de publicar el sitio.
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const PASSWORD = "Demo2026!";

// Mismo formato que src/lib/auth/password.ts
function hashear(password) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("base64url")}:${scryptSync(password, salt, 64).toString("base64url")}`;
}

async function crear({ nombre, email, rol, curso = null, dni = null, padreEmail = null }) {
  await sql.query(
    `insert into usuarios (nombre, email, password_hash, rol, curso, dni, padre_id)
     values ($1, $2, $3, $4, $5, $6, (select id from usuarios where email = $7))
     on conflict (email) do nothing`,
    [nombre, email, hashear(PASSWORD), rol, curso, dni, padreEmail],
  );
  console.log(`✓ ${rol.padEnd(13)} ${email}`);
}

await crear({ nombre: "Laura Gómez", email: "profesor@demo.com", rol: "profesor" });
await crear({ nombre: "Marta Díaz", email: "biblioteca@demo.com", rol: "bibliotecaria" });
await crear({ nombre: "Carlos Pérez", email: "padre@demo.com", rol: "padre" });
await crear({ nombre: "Sofía Pérez", email: "alumno@demo.com", rol: "alumno", curso: "3° Año A", dni: "45.123.456", padreEmail: "padre@demo.com" });

console.log(`\nContraseña de todas las cuentas: ${PASSWORD}`);
