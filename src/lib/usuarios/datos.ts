import "server-only";
import { consultar } from "@/lib/db";
import type { Rol } from "@/lib/auth/permisos";

export type UsuarioPanel = {
  id: string;
  nombre: string;
  email: string;
  rol: Exclude<Rol, "admin">;
  dni: string | null;
  curso: string | null;
  padre_id: string | null;
  padre_nombre: string | null;
  creado_en: Date | string;
};

const columnas = `u.id, u.nombre, u.email, u.rol, u.dni, u.curso, u.padre_id, p.nombre as padre_nombre, u.creado_en`;
const desde = `from usuarios u left join usuarios p on p.id = u.padre_id`;

/** Solo para el login: incluye el hash de la contraseña. */
export async function buscarParaLogin(email: string) {
  const [usuario] = await consultar<{ id: string; nombre: string; email: string; rol: UsuarioPanel["rol"]; password_hash: string }>(
    `select id, nombre, email, rol, password_hash from usuarios where email = $1`,
    [email],
  );
  return usuario ?? null;
}

export function listarUsuarios() {
  return consultar<UsuarioPanel>(`select ${columnas} ${desde} order by u.rol, u.nombre`);
}

export function listarPorRol(rol: UsuarioPanel["rol"]) {
  return consultar<UsuarioPanel>(`select ${columnas} ${desde} where u.rol = $1 order by u.curso nulls last, u.nombre`, [rol]);
}

export async function obtenerUsuario(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [usuario] = await consultar<UsuarioPanel>(`select ${columnas} ${desde} where u.id = $1`, [id]);
  return usuario ?? null;
}

/** Alumnos a cargo de un padre/madre. */
export function listarHijos(padreId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(padreId)) return Promise.resolve([]);
  return consultar<UsuarioPanel>(`select ${columnas} ${desde} where u.padre_id = $1 order by u.nombre`, [padreId]);
}

export async function crearUsuario(datos: {
  nombre: string;
  email: string;
  password_hash: string;
  rol: UsuarioPanel["rol"];
  dni: string | null;
  curso: string | null;
  padre_id: string | null;
}) {
  await consultar(
    `insert into usuarios (nombre, email, password_hash, rol, dni, curso, padre_id) values ($1, $2, $3, $4, $5, $6, $7)`,
    [datos.nombre, datos.email, datos.password_hash, datos.rol, datos.dni, datos.curso, datos.padre_id],
  );
}

export async function eliminarUsuario(id: string) {
  await consultar(`delete from usuarios where id = $1`, [id]);
}
