"use client";

/**
 * Conexión del panel con el backend (NestJS + Prisma + MySQL, carpeta `backend/`).
 * - Los datos viven en la base: se ven desde cualquier navegador o dispositivo.
 * - La sesión es por pestaña (sessionStorage): se puede tener al alumno en una pestaña
 *   y a la bibliotecaria en otra.
 * - Los datos se actualizan solos cada pocos segundos, al volver a la pestaña y después de cada cambio.
 * - Todos los errores terminan en un mensaje en castellano: en el formulario (`{ error }`) o en un aviso.
 */

import { useSyncExternalStore } from "react";
import type { OpcionesImpresion } from "@/config/biblioteca";
import { puede, type Rol } from "@/lib/auth/permisos";
import { avisar } from "./avisos";
import { cuentasEjemplo, MODO_DEMO, PASSWORD_DEMO } from "./datosDemo";
import { responderDemo } from "./servidorDemo";
import type {
  ArchivoBiblioteca,
  AsistenciaMateria,
  AsistenciaPersonal,
  AvisoPagoCuota,
  ConfigCuotas,
  CuotasAlumno,
  DatosPersona,
  MetodoPagoCuota,
  Curso,
  EstadoAsistencia,
  Evento,
  MetodoPago,
  NoticiaPanel,
  ResumenAsistencia,
  ReservaImpresion,
  Sanciones,
  TipoPunto,
  TipoSancion,
  Usuario,
  Visibilidad,
} from "./tipos";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const CLAVE_TOKEN = "inj-token";
/** Cuándo vence la sesión (ISO). El backend firma el token por SESION_MINUTOS (60); pasado ese tiempo hay que volver a ingresar. */
const CLAVE_EXPIRA = "inj-token-expira";
/** Cada cuánto se buscan pedidos nuevos (por ejemplo, para que le lleguen a la bibliotecaria). */
const INTERVALO_ACTUALIZACION = 10_000;
/** Tiempo máximo de espera de una respuesta. Subidas y descargas tienen más margen por si la conexión es lenta. */
const ESPERA_MAXIMA = 20_000;
const ESPERA_MAXIMA_ARCHIVO = 5 * 60_000;

/* ---------- Estado compartido ---------- */

type Estado = {
  listo: boolean;
  usuario: Usuario | null;
  usuarios: Usuario[];
  cursos: Curso[];
  archivos: ArchivoBiblioteca[];
  reservas: ReservaImpresion[];
  /** Quien edita ve también los borradores. */
  noticias: NoticiaPanel[];
  /** Todos, también los que ya pasaron. */
  eventos: Evento[];
  /** No se pudo hablar con el servidor en el último intento (se sigue reintentando solo). */
  sinConexion: boolean;
  /** La sesión venció o la cuenta se borró: el panel manda al login con un aviso. */
  sesionVencida: boolean;
  /** Administrador: pagos de cuotas que todavía no vio. */
  avisosCuotas: number;
};

const VACIO: Estado = {
  listo: false,
  usuario: null,
  usuarios: [],
  cursos: [],
  archivos: [],
  reservas: [],
  noticias: [],
  eventos: [],
  sinConexion: false,
  sesionVencida: false,
  avisosCuotas: 0,
};

let estado = VACIO;
let iniciado = false;
const oyentes = new Set<() => void>();
const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("inj-panel") : null;

function actualizar(cambios: Partial<Estado>) {
  estado = { ...estado, ...cambios };
  oyentes.forEach((avisar) => avisar());
}

function leerToken() {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function leerExpiracion() {
  try {
    const valor = Date.parse(sessionStorage.getItem(CLAVE_EXPIRA) ?? "");
    return Number.isNaN(valor) ? null : valor;
  } catch {
    return null;
  }
}

function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_EXPIRA);
  } catch {
    // nada
  }
  if (temporizadorSesion) clearTimeout(temporizadorSesion);
  temporizadorSesion = null;
}

let temporizadorSesion: ReturnType<typeof setTimeout> | null = null;

/** La sesión terminó (venció el tiempo, se borró la cuenta o el servidor rechazó el token): el panel vuelve al login con un aviso. */
function vencerSesion() {
  borrarSesion();
  actualizar({ ...VACIO, listo: true, sesionVencida: true });
}

/** Cierra la sesión sola justo cuando vence, aunque la pestaña esté quieta. */
function programarVencimiento() {
  if (temporizadorSesion) clearTimeout(temporizadorSesion);
  const expira = leerExpiracion();
  if (!expira) return;
  // setTimeout no acepta más de ~24 días; la sesión dura mucho menos.
  temporizadorSesion = setTimeout(vencerSesion, Math.max(0, Math.min(expira - Date.now(), 2 ** 31 - 1)));
}

const sesionExpirada = () => {
  const expira = leerExpiracion();
  return expira !== null && Date.now() >= expira;
};

/* ---------- Llamadas a la API ---------- */

type TipoError = "conexion" | "sesion" | "pedido";

/** Error con un mensaje listo para mostrarle al usuario. */
class ErrorApi extends Error {
  constructor(
    message: string,
    readonly tipo: TipoError = "pedido",
  ) {
    super(message);
  }
}

/** Por si el servidor no manda un mensaje: uno según el código de respuesta. */
function mensajeSegunEstado(codigo: number) {
  if (codigo === 400) return "Revisá los datos e intentá de nuevo.";
  if (codigo === 403) return "No tenés permiso para hacer esto.";
  if (codigo === 404) return "Eso ya no existe. Actualizá la página.";
  if (codigo === 409) return "Ya existe un registro con esos datos.";
  if (codigo === 413) return "El archivo es demasiado grande.";
  if (codigo === 429) return "Demasiados intentos. Esperá un momento.";
  if (codigo === 503) return "La base de datos no responde. Probá de nuevo en unos minutos.";
  if (codigo >= 500) return "El servidor tuvo un problema. Probá de nuevo.";
  return "No se pudo completar el pedido. Probá de nuevo.";
}

/** Error de red (no llegó ninguna respuesta), explicado según la causa. */
function errorDeConexion(error: unknown) {
  if (!navigator.onLine) return new ErrorApi("No tenés conexión a internet. Revisá el Wi-Fi o los datos.", "conexion");
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new ErrorApi("El servidor tardó demasiado en responder. Probá de nuevo.", "conexion");
  }
  return new ErrorApi("No se pudo conectar con el servidor. Revisá que el backend esté corriendo.", "conexion");
}

/** Hace el pedido con el token y convierte cualquier falla en un ErrorApi. */
async function pedir(ruta: string, init: RequestInit & { espera?: number } = {}) {
  const { espera = ESPERA_MAXIMA, ...opciones } = init;
  const token = leerToken();
  if (token && sesionExpirada()) {
    vencerSesion();
    throw new ErrorApi("Tu sesión terminó. Volvé a iniciar sesión.", "sesion");
  }
  let respuesta: Response;
  try {
    // Modo demo: responde el servidor simulado del navegador, sin backend.
    if (MODO_DEMO) return await respuestaDemo(ruta, opciones, token);
    respuesta = await fetch(`${API}${ruta}`, {
      ...opciones,
      signal: AbortSignal.timeout(espera),
      headers: {
        ...(opciones.body && !(opciones.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers,
      },
    });
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    throw errorDeConexion(error);
  }
  return revisarRespuesta(respuesta, token);
}

async function respuestaDemo(ruta: string, opciones: RequestInit, token: string | null) {
  return revisarRespuesta(await responderDemo(ruta, opciones, token), token);
}

async function revisarRespuesta(respuesta: Response, token: string | null) {
  if (respuesta.status === 401 && token) {
    // Sesión vencida o cuenta borrada: el panel vuelve al login.
    vencerSesion();
    throw new ErrorApi("Tu sesión terminó. Volvé a iniciar sesión.", "sesion");
  }
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { message?: unknown } | null;
    throw new ErrorApi(typeof cuerpo?.message === "string" ? cuerpo.message : mensajeSegunEstado(respuesta.status));
  }
  return respuesta;
}

async function api<T>(ruta: string, init?: RequestInit & { espera?: number }): Promise<T> {
  const respuesta = await pedir(ruta, init);
  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}

const enviarJson = (method: string, cuerpo?: unknown): RequestInit => ({
  method,
  body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
});

/** Mensaje para mostrar de cualquier error (los inesperados además se registran en la consola). */
function mensajeDe(error: unknown) {
  if (error instanceof ErrorApi) return error.message;
  console.error(error);
  return "Algo salió mal. Probá de nuevo.";
}

/** Convierte un error en `{ error }` para los formularios. */
function comoError(error: unknown) {
  return { error: mensajeDe(error) };
}

const esSesionVencida = (error: unknown) => error instanceof ErrorApi && error.tipo === "sesion";

/** Para acciones de un botón (pagar, marcar lista, borrar…): si falla aparece un aviso. Devuelve si salió bien. */
async function accion(hacer: () => Promise<unknown>, exito: string) {
  try {
    await hacer();
  } catch (error) {
    // Si venció la sesión no hace falta aviso: el panel ya manda al login con el mensaje.
    if (!esSesionVencida(error)) avisar(mensajeDe(error));
    return false;
  }
  avisar(exito, "exito");
  await cambio();
  return true;
}

/* ---------- Carga y actualización ---------- */

async function recargar() {
  if (!leerToken()) return actualizar({ ...VACIO, listo: true, sesionVencida: estado.sesionVencida });
  try {
    const [usuario, usuarios, cursos, archivos, reservas, noticias, eventos] = await Promise.all([
      api<Usuario>("/auth/yo"),
      api<Usuario[]>("/usuarios"),
      api<Curso[]>("/cursos"),
      api<ArchivoBiblioteca[]>("/biblioteca/archivos"),
      api<ReservaImpresion[]>("/biblioteca/reservas"),
      api<NoticiaPanel[]>("/noticias"),
      api<Evento[]>("/eventos"),
    ]);
    // El administrador recibe el aviso cuando un tutor paga una cuota.
    const avisosCuotas = puede(usuario.rol, "cuotas:gestionar") ? (await api<{ noVistos: number }>("/cuotas/avisos")).noVistos : 0;
    if (estado.usuario?.id === usuario.id && avisosCuotas > estado.avisosCuotas) {
      const nuevos = avisosCuotas - estado.avisosCuotas;
      avisar(nuevos === 1 ? "💳 Un tutor pagó una cuota. Mirala en Cuotas." : `💳 ${nuevos} cuotas nuevas pagadas. Mirálas en Cuotas.`, "exito");
    }
    actualizar({ avisosCuotas, listo: true, usuario, usuarios, cursos, archivos, reservas, noticias, eventos, sinConexion: false, sesionVencida: false });
  } catch (error) {
    // Si la sesión venció, `pedir` ya limpió el estado.
    if (esSesionVencida(error)) return;
    // Sin conexión o error del servidor: se mantiene lo último que se cargó y se reintenta solo.
    if (!(error instanceof ErrorApi)) console.error(error);
    actualizar({ listo: true, sinConexion: true });
  }
}

/** Después de cada cambio: recarga esta pestaña y avisa a las demás del mismo navegador. */
async function cambio() {
  await recargar();
  canal?.postMessage("cambio");
}

function iniciar() {
  if (iniciado) return;
  iniciado = true;
  programarVencimiento();
  void recargar();
  canal?.addEventListener("message", () => void recargar());
  // Los cambios de otras personas (otra PC, otro celular) llegan por acá. Sin conexión también se reintenta.
  const refrescar = () => {
    if (document.visibilityState === "visible" && (estado.usuario || estado.sinConexion)) void recargar();
  };
  setInterval(refrescar, INTERVALO_ACTUALIZACION);
  document.addEventListener("visibilitychange", refrescar);
  window.addEventListener("online", refrescar);
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  iniciar();
  return () => oyentes.delete(avisar);
}

/** Vuelve a intentar cargar los datos (botón "Reintentar"). */
export const reintentar = recargar;

/** Datos del panel. En el servidor (y antes de cargar) devuelve `listo: false`. */
export function useAlmacen() {
  return useSyncExternalStore(suscribir, () => estado, () => VACIO);
}

/** Usuario con la sesión iniciada (o `null`), si ya terminó de cargar y el estado de la conexión. */
export function useSesion() {
  const { listo, usuario, sinConexion, sesionVencida } = useAlmacen();
  return { listo, usuario, sinConexion, sesionVencida };
}

/** Usuario actual dentro del panel (PanelShell garantiza que hay sesión antes de mostrar las páginas). */
export function useUsuario() {
  const { usuario } = useSesion();
  if (!usuario) throw new Error("useUsuario se usa solo dentro del panel.");
  return usuario;
}

/* ---------- Cuentas demo (en modo demo las tiene el servidor simulado; con backend, las crea `npm run db:seed`) ---------- */

export { MODO_DEMO };

/**
 * Los accesos rápidos de prueba se muestran en el login solo si NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO=1,
 * o si no está definida y no es un build de producción. En producción no aparecen.
 */
export const MOSTRAR_CUENTAS_DEMO =
  process.env.NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO !== undefined
    ? process.env.NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO === "1"
    : process.env.NODE_ENV !== "production";

/** Accesos rápidos de la pantalla de ingreso: una cuenta de prueba por rol. */
export const cuentasDemo: { nombre: string; password: string; rol: Rol }[] = ["u-admin", "u-profesor", "u-preceptor", "u-biblioteca", "u-padre", "u-alumno"].flatMap(
  (id) => cuentasEjemplo.filter((c) => c.id === id).map(({ nombre, rol }) => ({ nombre, password: PASSWORD_DEMO, rol })),
);

/* ---------- Sesión ---------- */

/** Se ingresa con el nombre completo (no importan mayúsculas ni tildes) y la contraseña. */
export async function iniciarSesion(nombre: string, password: string): Promise<{ error: string } | { usuario: Usuario }> {
  try {
    const { token, expiraEn, usuario } = await api<{ token: string; expiraEn: string; usuario: Usuario }>(
      "/auth/login",
      enviarJson("POST", { nombre, password }),
    );
    sessionStorage.setItem(CLAVE_TOKEN, token);
    sessionStorage.setItem(CLAVE_EXPIRA, expiraEn);
    programarVencimiento();
    await recargar();
    return { usuario };
  } catch (error) {
    return comoError(error);
  }
}

export async function cerrarSesion() {
  borrarSesion();
  actualizar({ ...VACIO, listo: true });
}

/* ---------- Usuarios ---------- */

export async function crearUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  dni: string;
  telefono: string;
  sexo: string;
}): Promise<{ error: string } | { ok: string }> {
  try {
    const usuario = await api<Usuario>("/usuarios", enviarJson("POST", datos));
    await cambio();
    return { ok: `Cuenta de ${usuario.nombre} creada. Ingresa con su nombre completo y la contraseña que pusiste.` };
  } catch (error) {
    return comoError(error);
  }
}

/** Administrador: corrige nombre, DNI, email, teléfono, sexo y, si se completa, la contraseña de una cuenta. */
export async function editarUsuario(
  id: string,
  datos: { nombre: string; dni: string; email: string; telefono: string; sexo: string; password: string },
): Promise<{ error: string } | { ok: Usuario }> {
  try {
    const usuario = await api<Usuario>(`/usuarios/${encodeURIComponent(id)}`, enviarJson("PUT", datos));
    await cambio();
    return { ok: usuario };
  } catch (error) {
    return comoError(error);
  }
}

/** Administrador: crea al tutor y a sus hijos/as juntos (si algún dato está mal, no se crea ninguna cuenta). */
export async function crearFamilia(datos: {
  tutor: DatosPersona;
  hijos: (DatosPersona & { cursoId: string })[];
}): Promise<{ error: string } | { ok: string }> {
  try {
    const { tutor, hijos } = await api<{ tutor: Usuario; hijos: Usuario[] }>("/usuarios/familia", enviarJson("POST", datos));
    await cambio();
    const nombres = hijos.map((h) => h.nombre).join(", ");
    return { ok: `Listo: se crearon las cuentas de ${tutor.nombre} y ${hijos.length === 1 ? "de su hijo/a" : "de sus hijos/as"} ${nombres}.` };
  } catch (error) {
    return comoError(error);
  }
}

export function eliminarUsuario(id: string) {
  return accion(() => api(`/usuarios/${id}`, { method: "DELETE" }), "Cuenta eliminada.");
}

/* ---------- Cursos ---------- */

export async function crearCurso(anio: number, division: string): Promise<{ error: string } | { ok: string }> {
  try {
    const curso = await api<Curso>("/cursos", enviarJson("POST", { anio, division }));
    await cambio();
    return { ok: `Curso ${curso.nombre} creado.` };
  } catch (error) {
    return comoError(error);
  }
}

export function eliminarCurso(id: string) {
  return accion(() => api(`/cursos/${id}`, { method: "DELETE" }), "Curso eliminado.");
}

export async function asignarDocente(cursoId: string, profesorId: string, materia: string): Promise<{ error: string } | { ok: string }> {
  try {
    await api(`/cursos/${cursoId}/docentes`, enviarJson("POST", { profesorId, materia }));
    await cambio();
    return { ok: `${materia.trim()} asignada.` };
  } catch (error) {
    return comoError(error);
  }
}

export function quitarDocente(cursoId: string, asignacionId: string) {
  return accion(() => api(`/cursos/${cursoId}/docentes/${asignacionId}`, { method: "DELETE" }), "Materia quitada del curso.");
}

/** Crea la cuenta de un alumno nuevo, ya anotado en el curso. */
export async function crearAlumno(
  cursoId: string,
  datos: { nombre: string; email: string; password: string; dni: string; padreId: string },
): Promise<{ error: string } | { ok: string }> {
  try {
    const alumno = await api<Usuario>(`/cursos/${cursoId}/alumnos`, enviarJson("POST", datos));
    await cambio();
    return { ok: `${alumno.nombre} quedó anotado/a en ${alumno.curso}.` };
  } catch (error) {
    return comoError(error);
  }
}

/** Puede agregar o quitar alumnos del curso: el admin, o un profesor que da alguna materia ahí. */
export function puedeManejarAlumnos(usuario: Usuario, curso: Curso) {
  if (!puede(usuario.rol, "cursos:alumnos")) return false;
  return usuario.rol !== "profesor" || curso.docentes.some((d) => d.profesorId === usuario.id);
}

/** Anota a un alumno que ya tiene cuenta. Si estaba en otro curso, lo cambia. */
export function agregarAlumnoACurso(cursoId: string, alumnoId: string) {
  return accion(() => api(`/cursos/${cursoId}/alumnos/${alumnoId}`, { method: "PUT" }), "Alumno anotado en el curso.");
}

export function quitarAlumnoDeCurso(cursoId: string, alumnoId: string) {
  return accion(() => api(`/cursos/${cursoId}/alumnos/${alumnoId}`, { method: "DELETE" }), "Alumno quitado del curso.");
}

/* ---------- Noticias ---------- */

export type DatosNoticia = { titulo: string; categoria: string; resumen: string; contenido: string; publicada: boolean };

/**
 * Crea (sin `id`) o edita una noticia. `imagen`: una nueva para subir, `null` para quitarla
 * o `undefined` para dejar la que tenía.
 */
export async function guardarNoticia(
  id: string | null,
  datos: DatosNoticia,
  imagen: File | null | undefined,
): Promise<{ error: string } | { ok: string; noticia: NoticiaPanel }> {
  const formulario = new FormData();
  for (const [clave, valor] of Object.entries(datos)) formulario.append(clave, String(valor));
  if (imagen) formulario.append("imagen", imagen);
  if (imagen === null) formulario.append("quitarImagen", "true");
  try {
    const noticia = await api<NoticiaPanel>(id ? `/noticias/${id}` : "/noticias", {
      method: id ? "PUT" : "POST",
      body: formulario,
      espera: ESPERA_MAXIMA_ARCHIVO,
    });
    await cambio();
    return { ok: noticia.publicada ? "Noticia publicada en el sitio." : "Borrador guardado. Todavía no se ve en el sitio.", noticia };
  } catch (error) {
    return comoError(error);
  }
}

export function eliminarNoticia(id: string) {
  return accion(() => api(`/noticias/${id}`, { method: "DELETE" }), "Noticia eliminada.");
}

/* ---------- Eventos ---------- */

export type DatosEvento = { titulo: string; fecha: string; horario: string; lugar: string; categoria: string; descripcion: string };

/** Crea (sin `id`) o edita un evento. */
export async function guardarEvento(id: string | null, datos: DatosEvento): Promise<{ error: string } | { ok: string }> {
  try {
    await api(id ? `/eventos/${id}` : "/eventos", enviarJson(id ? "PUT" : "POST", datos));
    await cambio();
    return { ok: id ? "Evento actualizado." : "Evento agregado al calendario." };
  } catch (error) {
    return comoError(error);
  }
}

export function eliminarEvento(id: string) {
  return accion(() => api(`/eventos/${id}`, { method: "DELETE" }), "Evento eliminado.");
}

/* ---------- Asistencia ---------- */

/** Materias del curso en las que puede tomar asistencia: el admin, todas; el profesor, las suyas. */
export function materiasParaAsistencia(usuario: Usuario, curso: Curso) {
  if (!puede(usuario.rol, "asistencia:tomar")) return [];
  return curso.docentes.filter((d) => usuario.rol !== "profesor" || d.profesorId === usuario.id).map((d) => d.materia);
}

const consulta = (datos: Record<string, string>) => new URLSearchParams(datos).toString();

/** Lo que ya se tomó ese día (vacío si todavía no se tomó). */
export async function asistenciaDelDia(
  cursoId: string,
  materia: string,
  fecha: string,
): Promise<{ error: string } | { registros: { alumnoId: string; estado: EstadoAsistencia }[] }> {
  try {
    return await api(`/cursos/${cursoId}/asistencia?${consulta({ materia, fecha })}`);
  } catch (error) {
    return comoError(error);
  }
}

export async function resumenAsistencia(cursoId: string, materia: string): Promise<{ error: string } | ResumenAsistencia> {
  try {
    return await api(`/cursos/${cursoId}/asistencia/resumen?${consulta({ materia })}`);
  } catch (error) {
    return comoError(error);
  }
}

export async function guardarAsistencia(
  cursoId: string,
  datos: { materia: string; fecha: string; registros: { alumnoId: string; estado: EstadoAsistencia }[] },
): Promise<{ error: string } | { ok: string }> {
  try {
    await api(`/cursos/${cursoId}/asistencia`, enviarJson("PUT", datos));
    return { ok: "Asistencia guardada." };
  } catch (error) {
    return comoError(error);
  }
}

/* ---------- Asistencia de un alumno (solo lectura: el alumno y su familia) ---------- */

export async function asistenciaDeAlumno(alumnoId: string): Promise<{ error: string } | { materias: AsistenciaMateria[] }> {
  try {
    return await api(`/alumnos/${alumnoId}/asistencia`);
  } catch (error) {
    return comoError(error);
  }
}

/* ---------- Asistencia del personal (administrador) ---------- */

export async function leerAsistenciaPersonal(): Promise<{ error: string } | { fecha: string; personal: AsistenciaPersonal[] }> {
  try {
    return await api("/personal/asistencia");
  } catch (error) {
    return comoError(error);
  }
}

/** Marca a un profesor o preceptor ese día. Si ya estaba marcado, lo corrige. */
export async function marcarAsistenciaPersonal(personaId: string, fecha: string, estado: EstadoAsistencia): Promise<{ error: string } | { ok: true }> {
  try {
    await api("/personal/asistencia", enviarJson("PUT", { personaId, fecha, estado }));
    return { ok: true };
  } catch (error) {
    return comoError(error);
  }
}

/* ---------- Cuotas ---------- */

/** Tutor: las cuotas de sus hijos. Administrador: las de todos los alumnos. */
export async function leerCuotas(): Promise<{ error: string } | { config: ConfigCuotas; alumnos: CuotasAlumno[] }> {
  try {
    return await api(`/cuotas`);
  } catch (error) {
    return comoError(error);
  }
}

/** Pago simulado. En la versión final, Mercado Pago y tarjeta abren el checkout de Mercado Pago. */
export async function pagarCuota(alumnoId: string, mes: string, metodo: MetodoPagoCuota): Promise<{ error: string } | { ok: CuotasAlumno }> {
  try {
    const actualizado = await api<CuotasAlumno>("/cuotas/pagar", enviarJson("POST", { alumnoId, mes, metodo }));
    // Avisa a las otras pestañas (por ejemplo, la del administrador) para que les llegue el aviso enseguida.
    await cambio();
    return { ok: actualizado };
  } catch (error) {
    return comoError(error);
  }
}

/** Administrador: cambia el valor y el vencimiento. Se aplica a todas las cuotas sin pagar de todas las cuentas. */
export async function guardarConfigCuotas(config: ConfigCuotas): Promise<{ error: string } | { ok: ConfigCuotas }> {
  try {
    return { ok: await api<ConfigCuotas>("/cuotas/config", enviarJson("PUT", config)) };
  } catch (error) {
    return comoError(error);
  }
}

/** Administrador: guarda el WhatsApp de la familia del alumno (vacío lo borra). */
export async function guardarTelefonoCuotas(alumnoId: string, telefono: string): Promise<{ error: string } | { ok: CuotasAlumno }> {
  try {
    return { ok: await api<CuotasAlumno>(`/cuotas/alumnos/${encodeURIComponent(alumnoId)}/telefono`, enviarJson("PUT", { telefono })) };
  } catch (error) {
    return comoError(error);
  }
}

/** Administrador: deja registrado que le mandó a la familia el recordatorio de deuda por WhatsApp. */
export async function registrarRecordatorioCuotas(alumnoId: string): Promise<{ error: string } | { ok: CuotasAlumno }> {
  try {
    return { ok: await api<CuotasAlumno>(`/cuotas/alumnos/${encodeURIComponent(alumnoId)}/recordatorios`, { method: "POST" }) };
  } catch (error) {
    return comoError(error);
  }
}

export async function avisosDePago(): Promise<{ error: string } | { avisos: AvisoPagoCuota[]; noVistos: number }> {
  try {
    return await api("/cuotas/avisos");
  } catch (error) {
    return comoError(error);
  }
}

export async function marcarAvisosVistos() {
  try {
    await api("/cuotas/avisos/leidos", { method: "POST" });
    actualizar({ avisosCuotas: 0 });
    return true;
  } catch (error) {
    if (!esSesionVencida(error)) avisar(mensajeDe(error));
    return false;
  }
}

/* ---------- Amonestaciones y apercibimientos ---------- */

/** Las de todos los alumnos del curso (para el preceptor). */
export async function sancionesDelCurso(cursoId: string): Promise<{ error: string } | { sanciones: Record<string, Sanciones> }> {
  try {
    return await api(`/cursos/${cursoId}/sanciones`);
  } catch (error) {
    return comoError(error);
  }
}

/** Las de un alumno (las ve él, su familia y el preceptor). */
export async function sancionesDeAlumno(alumnoId: string): Promise<{ error: string } | Sanciones> {
  try {
    return await api<Sanciones>(`/alumnos/${alumnoId}/sanciones`);
  } catch (error) {
    return comoError(error);
  }
}

/** Deja la cantidad indicada (solo el preceptor). */
export async function cambiarSancion(alumnoId: string, tipo: TipoSancion, cantidad: number): Promise<{ error: string } | Sanciones> {
  try {
    return await api<Sanciones>(`/alumnos/${alumnoId}/sanciones`, enviarJson("PUT", { tipo, cantidad }));
  } catch (error) {
    return comoError(error);
  }
}

/* ---------- Positivos y negativos ---------- */

/** Total de positivos y negativos de cada alumno del curso en esa materia. */
export async function puntosDelCurso(
  cursoId: string,
  materia: string,
): Promise<{ error: string } | { puntos: Record<string, Record<TipoPunto, number>> }> {
  try {
    return await api(`/cursos/${cursoId}/puntos?${consulta({ materia })}`);
  } catch (error) {
    return comoError(error);
  }
}

/** Le suma un positivo o un negativo al alumno. Devuelve el id para poder deshacerlo. */
export async function sumarPunto(cursoId: string, datos: { materia: string; alumnoId: string; tipo: TipoPunto }): Promise<{ error: string } | { id: string }> {
  try {
    return await api(`/cursos/${cursoId}/puntos`, enviarJson("POST", datos));
  } catch (error) {
    return comoError(error);
  }
}

export async function quitarPunto(cursoId: string, puntoId: string): Promise<{ error: string } | { ok: true }> {
  try {
    await api(`/cursos/${cursoId}/puntos/${puntoId}`, { method: "DELETE" });
    return { ok: true };
  } catch (error) {
    return comoError(error);
  }
}

/* ---------- Biblioteca: permisos (el backend vuelve a controlar todo) ---------- */

function vencido(archivo: ArchivoBiblioteca) {
  return archivo.expiraEn !== null && new Date(archivo.expiraEn) <= new Date();
}

/** Puede abrir / mandar a imprimir el archivo. */
export function puedeVerArchivo(usuario: Usuario, archivo: ArchivoBiblioteca) {
  if (archivo.subidoPor === usuario.id) return true;
  // La bibliotecaria necesita abrir cualquier archivo para imprimir los pedidos.
  if (puede(usuario.rol, "biblioteca:pedidos") || puede(usuario.rol, "biblioteca:gestionar-archivos")) return true;
  return archivo.visibilidad === "biblioteca" && !vencido(archivo);
}

export function puedeBorrarArchivo(usuario: Usuario, archivo: ArchivoBiblioteca) {
  return archivo.subidoPor === usuario.id || puede(usuario.rol, "biblioteca:gestionar-archivos");
}

/** Con esto se retira la impresión: nombre y apellido de quien la pidió y su curso (ej. "Sofía Pérez — 3° Año A"). */
export function quienRetira(reserva: ReservaImpresion) {
  return reserva.solicitanteCurso ? `${reserva.solicitanteNombre} — ${reserva.solicitanteCurso}` : reserva.solicitanteNombre;
}

export function esDuenoReserva(usuario: Usuario, reserva: ReservaImpresion) {
  return reserva.solicitante === usuario.id;
}

/** La bibliotecaria solo ve pedidos ya pagados; cada uno ve siempre los suyos. */
export function puedeVerReserva(usuario: Usuario, reserva: ReservaImpresion) {
  return (
    esDuenoReserva(usuario, reserva) ||
    (puede(usuario.rol, "biblioteca:pedidos") && reserva.estado !== "pendiente_pago" && reserva.estado !== "cancelada")
  );
}

/* ---------- Biblioteca: archivos ---------- */

export async function subirArchivo(
  archivo: File,
  datos: { nombre: string; descripcion: string; categoria: string; destino: Visibilidad; duracion: string },
): Promise<{ error: string } | { ok: true; id: string; visibilidad: Visibilidad }> {
  const formulario = new FormData();
  formulario.append("archivo", archivo);
  for (const [clave, valor] of Object.entries(datos)) formulario.append(clave, valor);
  try {
    const creado = await api<ArchivoBiblioteca>("/biblioteca/archivos", { method: "POST", body: formulario, espera: ESPERA_MAXIMA_ARCHIVO });
    await cambio();
    return { ok: true, id: creado.id, visibilidad: creado.visibilidad };
  } catch (error) {
    return comoError(error);
  }
}

export function eliminarArchivo(id: string) {
  return accion(() => api(`/biblioteca/archivos/${id}`, { method: "DELETE" }), "Archivo eliminado.");
}

/** Abre el archivo en una pestaña nueva (o lo descarga si el navegador no lo puede mostrar). */
export async function abrirArchivo(id: string) {
  const archivo = estado.archivos.find((a) => a.id === id);
  if (!archivo) {
    avisar("El archivo ya no existe.");
    return false;
  }
  // La pestaña se abre ya, dentro del clic, para que el navegador no la bloquee.
  const pestana = window.open("", "_blank");
  let blob: Blob;
  try {
    // Se pide con el token (un link común no lo manda), y se muestra desde memoria.
    const respuesta = await pedir(`/biblioteca/archivos/${id}/contenido`, { espera: ESPERA_MAXIMA_ARCHIVO });
    blob = await respuesta.blob();
  } catch (error) {
    pestana?.close();
    if (!esSesionVencida(error)) avisar(error instanceof ErrorApi ? error.message : "No se pudo abrir el archivo. Probá de nuevo.");
    return false;
  }
  const url = URL.createObjectURL(blob);
  if (pestana) {
    pestana.location.href = url;
  } else {
    const enlace = Object.assign(document.createElement("a"), { href: url, download: archivo.nombreOriginal });
    enlace.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/* ---------- Biblioteca: reservas ---------- */

export async function reservarImpresion(
  archivoId: string,
  opciones: OpcionesImpresion & { dobleFaz: boolean; notas: string },
): Promise<{ error: string } | { ok: true; id: string }> {
  try {
    const reserva = await api<ReservaImpresion>("/biblioteca/reservas", enviarJson("POST", { archivoId, ...opciones }));
    await cambio();
    return { ok: true, id: reserva.id };
  } catch (error) {
    return comoError(error);
  }
}

/** Pago simulado. Cuando se integre Mercado Pago, acá se abre el checkout. */
export function pagarReserva(id: string, metodo: MetodoPago) {
  return accion(
    () => api(`/biblioteca/reservas/${id}/pagar`, enviarJson("POST", { metodo })),
    metodo === "efectivo"
      ? "¡Pedido confirmado! La biblioteca ya lo recibió. Pagás en efectivo al retirarlo."
      : "¡Pago confirmado! La biblioteca ya recibió tu pedido.",
  );
}

const mensajesEstado = {
  lista: "Pedido marcado como listo para retirar.",
  retirada: "Pedido entregado.",
  cancelada: "Reserva cancelada.",
};

/**
 * - Cancelar: solo quien hizo el pedido, mientras no esté pagado.
 * - Lista / retirada: solo la bibliotecaria (permiso "biblioteca:pedidos").
 */
export function cambiarEstadoReserva(id: string, nuevo: "lista" | "retirada" | "cancelada") {
  return accion(() => api(`/biblioteca/reservas/${id}/estado`, enviarJson("PATCH", { estado: nuevo })), mensajesEstado[nuevo]);
}
