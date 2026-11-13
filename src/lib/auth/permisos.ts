/**
 * Roles y permisos del panel. Este archivo no usa nada del servidor:
 * lo pueden importar el proxy, los componentes de cliente y las Server Actions.
 */

export const roles = {
  admin: "Administrador",
  profesor: "Profesor/a",
  alumno: "Alumno/a",
  padre: "Tutor/a",
  bibliotecaria: "Bibliotecaria",
  preceptor: "Preceptor/a",
} as const;

export type Rol = keyof typeof roles;

/**
 * Roles que se pueden asignar desde la sección Usuarios (el admin se define en .env.local).
 * Los alumnos no: los agrega cada profesor desde su curso.
 */
export const rolesAsignables = ["profesor", "preceptor", "padre", "bibliotecaria"] as const satisfies Rol[];

const permisos = {
  /** Ver la sección Cursos (el admin ve todos; cada profesor, solo los cursos donde da alguna materia). */
  "seccion:cursos": ["admin", "profesor", "preceptor"],
  /** Ver todo el plantel docente con sus materias. */
  "seccion:docentes": ["admin"],
  /** Ver y tomar la asistencia de profesores y preceptores (en la sección Docentes). */
  "personal:asistencia": ["admin"],
  /** Crear y borrar cursos y asignar el profesor de cada materia. */
  "cursos:gestionar": ["admin"],
  /** Agregar y quitar alumnos de un curso (el profesor, solo en sus cursos). */
  "cursos:alumnos": ["admin", "profesor", "preceptor"],
  /** Tomar asistencia (el profesor, solo en sus materias). */
  "asistencia:tomar": ["admin", "profesor", "preceptor"],
  /** Crear cuentas y cambiar la configuración del sitio. */
  "seccion:usuarios": ["admin"],
  "seccion:configuracion": ["admin", "profesor"],
  /** Ver la sección Noticias del panel, publicar y editar noticias: solo el administrador. */
  "noticias:editar": ["admin"],
  /** Crear y editar eventos. */
  "eventos:editar": ["admin", "profesor", "preceptor"],
  /** Ver la ficha de todos los alumnos (el resto solo ve la propia o la de sus hijos). */
  "alumnos:ver-todos": ["admin", "profesor", "preceptor"],
  /** Ver la sección Biblioteca (profesores y padres no la usan). */
  "seccion:biblioteca": ["admin", "preceptor", "alumno", "bibliotecaria"],
  /** Ver la sección Alumnos (la bibliotecaria no la usa). */
  "seccion:alumnos": ["admin", "profesor", "preceptor", "alumno", "padre"],
  /** Ver la sección Cuotas: el tutor, las de sus hijos (y las paga); el administrador, todas. */
  "seccion:cuotas": ["admin", "padre"],
  /** Recibir los avisos de pago y cambiar el valor de la cuota. */
  "cuotas:gestionar": ["admin"],
  /** Subir archivos que quedan en la biblioteca (permanentes o por un tiempo elegido). */
  "biblioteca:publicar": ["admin", "profesor"],
  /** Borrar cualquier archivo de la biblioteca, no solo los propios. */
  "biblioteca:gestionar-archivos": ["admin", "profesor"],
  /** Recibir los pedidos de impresión pagados y marcarlos como listos / retirados. */
  "biblioteca:pedidos": ["admin", "bibliotecaria"],
  /** Ver la sección Notas del mes (el alumno, las suyas; el padre/madre, las de sus hijos). */
  "seccion:notas": ["alumno", "padre"],
  /** Ver la sección Asistencias, solo lectura (el alumno, la suya; el padre/madre, la de sus hijos). */
  "seccion:asistencias": ["alumno", "padre"],
  /** Sección Amonestaciones: poner amonestaciones y apercibimientos. Solo el preceptor. */
  "sanciones:editar": ["preceptor"],
} satisfies Record<string, Rol[]>;

export type Permiso = keyof typeof permisos;

export function puede(rol: Rol | undefined, permiso: Permiso) {
  return !!rol && (permisos[permiso] as readonly Rol[]).includes(rol);
}

/** Rutas del panel que requieren un permiso. El proxy las usa para bloquear el acceso. */
const rutasProtegidas: { prefijo: string; permiso: Permiso }[] = [
  { prefijo: "/panel/cursos", permiso: "seccion:cursos" },
  { prefijo: "/panel/docentes", permiso: "seccion:docentes" },
  { prefijo: "/panel/usuarios", permiso: "seccion:usuarios" },
  { prefijo: "/panel/configuracion", permiso: "seccion:configuracion" },
  { prefijo: "/panel/noticias", permiso: "noticias:editar" },
  { prefijo: "/panel/notas", permiso: "seccion:notas" },
  { prefijo: "/panel/asistencias", permiso: "seccion:asistencias" },
  { prefijo: "/panel/biblioteca", permiso: "seccion:biblioteca" },
  { prefijo: "/panel/alumnos", permiso: "seccion:alumnos" },
  { prefijo: "/panel/cuotas", permiso: "seccion:cuotas" },
  { prefijo: "/panel/amonestaciones", permiso: "sanciones:editar" },
];

export function permisoParaRuta(pathname: string) {
  return rutasProtegidas.find((r) => pathname === r.prefijo || pathname.startsWith(r.prefijo.endsWith("/") ? r.prefijo : `${r.prefijo}/`))
    ?.permiso;
}
