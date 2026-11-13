/**
 * Servidor simulado del modo demo (NEXT_PUBLIC_MODO_DEMO=1).
 * Responde las mismas rutas que el backend, con las mismas reglas de permisos,
 * pero guarda todo en el navegador (localStorage). `almacen.ts` lo usa en lugar de `fetch`.
 * Los cambios se ven en todas las pestañas de este navegador, no en otras PCs.
 */

import { bibliotecaConfig, calcularTotal, tipoDeArchivo } from "@/config/biblioteca";
import { puede, rolesAsignables } from "@/lib/auth/permisos";
import { cuentasEjemplo, eventosEjemplo, materiasEjemplo, NOMBRE_ADMIN_ANTERIOR, noticiasEjemplo, PASSWORD_DEMO } from "./datosDemo";
import type {
  ArchivoBiblioteca,
  EstadoAsistencia,
  EstadoReserva,
  Evento,
  ReservaImpresion,
  Sanciones,
  AsistenciaPersonal,
  AvisoPagoCuota,
  ConfigCuotas,
  Cuota,
  CuotasAlumno,
  MetodoPagoCuota,
  RecordatorioCuota,
  TipoPunto,
  Usuario,
  Visibilidad,
} from "./tipos";

/* ---------- Base de datos en el navegador ---------- */

type UsuarioDb = Omit<Usuario, "curso" | "password"> & { password: string };
type CursoDb = { id: string; anio: number; division: string; creadoEn: string };
type DocenteDb = { id: string; cursoId: string; profesorId: string; materia: string };
type AsistenciaDb = { cursoId: string; materia: string; fecha: string; alumnoId: string; estado: EstadoAsistencia };
type PuntoDb = { id: string; cursoId: string; materia: string; alumnoId: string; tipo: TipoPunto; puestoPorId: string; creadoEn: string };
type NoticiaDb = {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  resumen: string;
  contenido: string;
  imagen: string | null;
  publicada: boolean;
  publicadaEn: string | null;
  autorId: string | null;
  creadoEn: string;
  actualizadoEn: string;
};
type ArchivoDb = Omit<ArchivoBiblioteca, "subidoPorNombre">;
type ReservaDb = Omit<ReservaImpresion, "solicitanteNombre" | "solicitanteCurso">;

type Db = {
  usuarios: UsuarioDb[];
  cursos: CursoDb[];
  docentes: DocenteDb[];
  asistencias: AsistenciaDb[];
  /** Positivos y negativos de cada alumno en una materia. */
  puntos: PuntoDb[];
  noticias: NoticiaDb[];
  eventos: Evento[];
  archivos: ArchivoDb[];
  reservas: ReservaDb[];
  /** Ya se cargó el historial de asistencia y positivos/negativos de ejemplo. */
  ejemplosAsistencia?: boolean;
  /** Amonestaciones y apercibimientos de cada alumno (los carga el preceptor). */
  sanciones?: Record<string, Sanciones>;
  /** Valor y vencimiento de la cuota (lo cambia el administrador). */
  cuotasConfig?: ConfigCuotas;
  /** Cuotas pagadas por los tutores. */
  pagosCuotas?: PagoCuotaDb[];
  /** WhatsApp de la familia de cada alumno (id del alumno → solo dígitos). */
  telefonosCuotas?: Record<string, string>;
  /** Recordatorios de deuda enviados por WhatsApp. */
  recordatoriosCuotas?: RecordatorioCuotaDb[];
  /** Ya se agregaron los profesores de ejemplo nuevos (con sus materias). */
  ejemplosDocentes?: boolean;
  /** Asistencia de profesores y preceptores (la ve y la carga el administrador). */
  asistenciaPersonal?: AsistenciaPersonalDb[];
  /** Ya se puso la contraseña única ("pasodeloslibres") a todas las cuentas que existían. */
  passwordUnica?: boolean;
};

type AsistenciaPersonalDb = { personaId: string; fecha: string; estado: EstadoAsistencia };

/** Roles del personal al que el administrador le toma asistencia. */
const ROLES_PERSONAL = ["profesor", "preceptor"] as const;

/** Los últimos `n` días hábiles antes de hoy ("2026-11-11", "2026-11-10"…). */
function ultimosDiasHabiles(n: number) {
  const dias: string[] = [];
  for (const d = new Date(); dias.length < n; ) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias.push(`${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`);
  }
  return dias;
}

/** Agrega las cuentas y materias de ejemplo que falten (por ejemplo, los profesores nuevos), sin tocar lo demás. */
function completarEjemplosDocentes(db: Db) {
  db.ejemplosDocentes = true;
  for (const c of cuentasEjemplo) {
    if (db.usuarios.some((u) => u.id === c.id || u.email === c.email)) continue;
    db.usuarios.push({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      rol: c.rol,
      dni: c.dni,
      sexo: c.sexo,
      cursoId: c.cursoAnio ? `c-${c.cursoAnio}A` : null,
      padreId: c.padreId ?? null,
      creadoEn: ahora(),
      password: PASSWORD_DEMO,
    });
  }
  for (const [anio, materia, profesorId] of materiasEjemplo) {
    const cursoId = `c-${anio}A`;
    if (!db.cursos.some((c) => c.id === cursoId) || !db.usuarios.some((u) => u.id === profesorId)) continue;
    if (db.docentes.some((d) => d.cursoId === cursoId && d.materia.toLowerCase() === materia.toLowerCase())) continue;
    db.docentes.push({ id: nuevoId(), cursoId, profesorId, materia });
  }
}

/** Asistencia de ejemplo del personal: las últimas 10 jornadas, con alguna tardanza y falta. */
function asistenciaPersonalEjemplo(db: Db): AsistenciaPersonalDb[] {
  const dias = ultimosDiasHabiles(10);
  const registros: AsistenciaPersonalDb[] = [];
  const personal = db.usuarios.filter((u) => (ROLES_PERSONAL as readonly string[]).includes(u.rol));
  personal.forEach((persona, p) => {
    dias.forEach((fecha, i) => {
      // Un patrón distinto para cada persona, para que no den todos igual.
      const n = (i + p * 3) % 11;
      const estado: EstadoAsistencia = n === 4 ? "ausente" : n === 7 || n === 9 ? "tarde" : "presente";
      registros.push({ personaId: persona.id, fecha, estado });
    });
  });
  return registros;
}

type PagoCuotaDb = {
  id: string;
  alumnoId: string;
  /** "2026-11" */
  mes: string;
  /** Lo que valía la cuota cuando se pagó (si después cambia el valor, esta no cambia). */
  monto: number;
  metodo: MetodoPagoCuota;
  pagadoPorId: string;
  pagadoEn: string;
  /** El administrador ya vio el aviso de este pago. */
  visto: boolean;
};

type RecordatorioCuotaDb = Omit<RecordatorioCuota, "enviadoPorNombre"> & { alumnoId: string; enviadoPorId: string };

const CONFIG_CUOTAS_INICIAL: ConfigCuotas = { monto: 45000, diaVencimiento: 10 };
/** Ciclo lectivo: de marzo a diciembre. */
const PRIMER_MES_CUOTA = 3;
const ULTIMO_MES_CUOTA = 12;

const dosCifras = (n: number) => String(n).padStart(2, "0");
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`;
};

/** Meses con cuota hasta el actual, del más nuevo al más viejo ("2026-11", "2026-10"…). */
function mesesConCuota() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const hasta = Math.min(hoy.getMonth() + 1, ULTIMO_MES_CUOTA);
  const meses: string[] = [];
  for (let m = hasta; m >= PRIMER_MES_CUOTA; m--) meses.push(`${anio}-${dosCifras(m)}`);
  return meses;
}

/** Pagos de ejemplo: cada alumno tiene pagas las cuotas hasta cierto mes. */
function pagosEjemplo(db: Db): PagoCuotaDb[] {
  const hastaMes: Record<string, number> = { "u-alumno": 10, "u-alumno2": 9, "u-alumno3": 12, "u-alumno4": 10 };
  const pagos: PagoCuotaDb[] = [];
  const meses = mesesConCuota();
  for (const [alumnoId, hasta] of Object.entries(hastaMes)) {
    const alumno = db.usuarios.find((u) => u.id === alumnoId);
    if (!alumno) continue;
    for (const mes of meses) {
      const numero = Number(mes.slice(5));
      if (numero > hasta) continue;
      const esElUltimo = numero === Math.min(hasta, Number(meses[0]?.slice(5)));
      pagos.push({
        id: nuevoId(),
        alumnoId,
        mes,
        monto: CONFIG_CUOTAS_INICIAL.monto,
        metodo: numero % 2 ? "mercadopago" : "tarjeta",
        pagadoPorId: alumno.padreId ?? "u-padre",
        pagadoEn: `${mes}-0${(numero % 7) + 1}T14:30:00.000Z`,
        // El pago más reciente de Valentina queda sin ver, para que se vea cómo llega el aviso.
        visto: !(alumnoId === "u-alumno3" && esElUltimo),
      });
    }
  }
  return pagos;
}

/** Sanciones de ejemplo (se cargan una sola vez). */
const sancionesEjemplo: Record<string, Sanciones> = {
  "u-alumno": { amonestaciones: 0, apercibimientos: 1 },
  "u-alumno2": { amonestaciones: 1, apercibimientos: 2 },
};

const CLAVE_DB = "inj-demo-db-v1";
const CLAVE_CONTENIDO = "inj-demo-archivo-";
/** Contenidos más grandes no entran en localStorage: quedan solo en memoria hasta recargar la página. */
const MAXIMO_GUARDADO = 2 * 1024 * 1024;
const contenidosEnMemoria = new Map<string, Blob>();

const ahora = () => new Date().toISOString();
const nuevoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function datosIniciales(): Db {
  const creadoEn = "2026-03-01T12:00:00.000Z";
  const cursos: CursoDb[] = [1, 2, 3, 4, 5, 6].map((anio) => ({ id: `c-${anio}A`, anio, division: "A", creadoEn }));
  const usuarios: UsuarioDb[] = cuentasEjemplo.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    rol: c.rol,
    dni: c.dni,
    sexo: c.sexo,
    cursoId: c.cursoAnio ? `c-${c.cursoAnio}A` : null,
    padreId: c.padreId ?? null,
    creadoEn,
    password: PASSWORD_DEMO,
  }));
  const docentes: DocenteDb[] = materiasEjemplo.map(([anio, materia, profesorId], i) => ({ id: `d-${i + 1}`, cursoId: `c-${anio}A`, profesorId, materia }));
  const noticias: NoticiaDb[] = noticiasEjemplo.map((n, i) => {
    const fecha = `${n.publicadaEn}T12:00:00.000Z`;
    return { ...n, id: `n-${i + 1}`, publicada: true, publicadaEn: fecha, autorId: "u-admin", creadoEn: fecha, actualizadoEn: fecha };
  });
  const eventos: Evento[] = eventosEjemplo.map((e, i) => ({ ...e, id: `e-${i + 1}` }));
  const archivos: ArchivoDb[] = [
    {
      id: "a-1",
      nombre: "Guía de ejercicios — Funciones lineales",
      descripcion: "Práctico para 3° Año. Archivo de ejemplo del modo demo.",
      categoria: "guias",
      visibilidad: "biblioteca",
      nombreOriginal: "guia-funciones.txt",
      tipo: "text/plain",
      tamano: 120,
      subidoPor: "u-profesor",
      expiraEn: null,
      creadoEn,
    },
  ];
  const db: Db = {
    usuarios,
    cursos,
    docentes,
    asistencias: [],
    puntos: [],
    noticias,
    eventos,
    archivos,
    reservas: [],
    sanciones: { ...sancionesEjemplo },
    cuotasConfig: { ...CONFIG_CUOTAS_INICIAL },
    ejemplosDocentes: true,
  };
  db.pagosCuotas = pagosEjemplo(db);
  db.asistenciaPersonal = asistenciaPersonalEjemplo(db);
  cargarEjemplosAsistencia(db);
  return db;
}

/**
 * Historial de ejemplo para 3° Año A: las últimas 10 clases (días hábiles antes de hoy) de Matemática y Lengua,
 * y algunos positivos y negativos. Solo agrega lo que falta: no pisa lo que ya se cargó desde el panel.
 */
function cargarEjemplosAsistencia(db: Db) {
  if (db.ejemplosAsistencia) return;
  db.ejemplosAsistencia = true;
  const dias: string[] = [];
  for (const d = new Date(); dias.length < 10; ) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias.push(`${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`);
  }
  // Cada alumno tiene su patrón: índice de las clases donde llegó tarde (T) o faltó (A).
  const patrones: Record<string, { tarde: number[]; ausente: number[] }> = {
    "u-alumno": { tarde: [3], ausente: [6] },
    "u-alumno2": { tarde: [1, 7], ausente: [2, 8] },
    "u-alumno3": { tarde: [], ausente: [] },
  };
  for (const materia of ["Matemática", "Lengua"]) {
    dias.forEach((fecha, i) => {
      for (const [alumnoId, p] of Object.entries(patrones)) {
        if (!db.usuarios.some((u) => u.id === alumnoId && u.cursoId === "c-3A")) continue;
        if (db.asistencias.some((a) => a.cursoId === "c-3A" && a.materia === materia && a.fecha === fecha && a.alumnoId === alumnoId)) continue;
        const desfase = materia === "Lengua" ? 1 : 0;
        const estado: EstadoAsistencia = p.ausente.includes(i + desfase) ? "ausente" : p.tarde.includes(i + desfase) ? "tarde" : "presente";
        db.asistencias.push({ cursoId: "c-3A", materia, fecha, alumnoId, estado });
      }
    });
  }
  const puntos: [string, string, TipoPunto, number, string][] = [
    ["u-alumno", "Matemática", "positivo", 3, "u-profesor"],
    ["u-alumno", "Matemática", "negativo", 1, "u-profesor"],
    ["u-alumno", "Lengua", "positivo", 2, "u-profesor2"],
    ["u-alumno2", "Matemática", "negativo", 2, "u-profesor"],
    ["u-alumno2", "Lengua", "positivo", 1, "u-profesor2"],
    ["u-alumno3", "Matemática", "positivo", 4, "u-profesor"],
    ["u-alumno3", "Lengua", "positivo", 3, "u-profesor2"],
  ];
  for (const [alumnoId, materia, tipo, cantidad, puestoPorId] of puntos) {
    if (!db.usuarios.some((u) => u.id === alumnoId && u.cursoId === "c-3A")) continue;
    for (let i = 0; i < cantidad; i++) {
      db.puntos.push({ id: nuevoId(), cursoId: "c-3A", materia, alumnoId, tipo, puestoPorId, creadoEn: `${dias[i % dias.length]}T15:00:00.000Z` });
    }
  }
}

/**
 * Toda cuenta necesita contraseña (se ingresa con nombre completo y contraseña) y un DNI propio.
 * Una sola vez, todas las cuentas que existían pasan a la contraseña única; las que no tengan, también.
 * Sin DNI: el de ejemplo o uno provisorio que no se repite. El administrador ve todo en Usuarios. Devuelve si cambió algo.
 */
function completarIdentidades(db: Db) {
  let cambio = false;
  if (!db.passwordUnica) {
    for (const u of db.usuarios) u.password = PASSWORD_DEMO;
    db.passwordUnica = true;
    cambio = true;
  }
  const usados = new Set(db.usuarios.map((u) => soloDigitos(u.dni)).filter(Boolean));
  let provisorio = 90_000_001;
  for (const u of db.usuarios) {
    const ejemplo = cuentasEjemplo.find((c) => c.id === u.id);
    if (u.id === "u-admin" && u.nombre === NOMBRE_ADMIN_ANTERIOR && ejemplo) {
      u.nombre = ejemplo.nombre;
      cambio = true;
    }
    if (ejemplo && !u.sexo) {
      u.sexo = ejemplo.sexo;
      cambio = true;
    }
    if (!u.password) {
      u.password = PASSWORD_DEMO;
      cambio = true;
    }
    if (soloDigitos(u.dni)) continue;
    let dni = ejemplo && !usados.has(soloDigitos(ejemplo.dni)) ? soloDigitos(ejemplo.dni) : "";
    while (!dni || usados.has(dni)) dni = String(provisorio++);
    usados.add(dni);
    u.dni = formatoDni(dni);
    cambio = true;
  }
  return cambio;
}

function leerDb(): Db {
  try {
    const guardado = localStorage.getItem(CLAVE_DB);
    if (guardado) {
      const db = JSON.parse(guardado) as Db;
      // Datos guardados antes de que existieran los positivos y negativos o el historial de ejemplo.
      db.puntos ??= [];
      if (!db.ejemplosAsistencia || !db.sanciones || !db.cuotasConfig || !db.pagosCuotas || !db.ejemplosDocentes || !db.asistenciaPersonal) {
        if (!db.ejemplosDocentes) completarEjemplosDocentes(db);
        db.asistenciaPersonal ??= asistenciaPersonalEjemplo(db);
        cargarEjemplosAsistencia(db);
        db.sanciones ??= { ...sancionesEjemplo };
        db.cuotasConfig ??= { ...CONFIG_CUOTAS_INICIAL };
        db.pagosCuotas ??= pagosEjemplo(db);
        guardarDb(db);
      }
      if (completarIdentidades(db)) guardarDb(db);
      return db;
    }
  } catch {
    // Sin localStorage (modo privado, etc.): se arranca con los datos de ejemplo.
  }
  const db = datosIniciales();
  guardarDb(db);
  return db;
}

function guardarDb(db: Db) {
  try {
    localStorage.setItem(CLAVE_DB, JSON.stringify(db));
  } catch {
    // Si no entra, los cambios duran hasta recargar la página.
  }
}

/** Vuelve a los datos de ejemplo (borra todo lo que se cargó en el modo demo). */
export function reiniciarDemo() {
  try {
    for (const clave of Object.keys(localStorage)) if (clave.startsWith(CLAVE_CONTENIDO) || clave === CLAVE_DB) localStorage.removeItem(clave);
  } catch {
    // nada
  }
  contenidosEnMemoria.clear();
}

/* ---------- Respuestas ---------- */

class Falla extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (datos: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(datos), { status, headers: { "Content-Type": "application/json" } });

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

type Cuerpo = Record<string, unknown>;

function leerCuerpo(body: RequestInit["body"]): Cuerpo {
  if (typeof body === "string") return JSON.parse(body) as Cuerpo;
  if (body instanceof FormData) return Object.fromEntries(body.entries());
  return {};
}

/* ---------- Formato de salida (igual que el backend) ---------- */

const nombreCurso = (c: Pick<CursoDb, "anio" | "division">) => `${c.anio}° Año ${c.division}`;

/** Datos de la cuenta sin la contraseña. */
function publicoUsuario(db: Db, { password: _, ...u }: UsuarioDb): Usuario {
  const curso = u.cursoId ? db.cursos.find((c) => c.id === u.cursoId) : undefined;
  return { ...u, curso: curso ? nombreCurso(curso) : null };
}

/**
 * Lo que ve `yo` de otra cuenta.
 * - El administrador: todo, también la contraseña (para dársela a quien se la olvide).
 * - La propia persona y su familia: DNI y teléfono.
 * - El resto: sin DNI ni teléfono.
 */
function usuarioPara(db: Db, yo: UsuarioDb, u: UsuarioDb): Usuario {
  const publico = publicoUsuario(db, u);
  if (puede(yo.rol, "seccion:usuarios")) return { ...publico, password: u.password };
  const familia = u.id === yo.id || u.padreId === yo.id || u.id === yo.padreId;
  return familia ? publico : { ...publico, dni: null, telefono: null };
}

const nombreDe = (db: Db, id: string | null) => db.usuarios.find((u) => u.id === id)?.nombre ?? null;

function publicoCurso(db: Db, c: CursoDb) {
  const docentes = db.docentes
    .filter((d) => d.cursoId === c.id)
    .sort((a, b) => a.materia.localeCompare(b.materia))
    .map((d) => ({ ...d, profesorNombre: nombreDe(db, d.profesorId) ?? "" }));
  return { ...c, nombre: nombreCurso(c), docentes };
}

const publicoNoticia = (db: Db, { autorId, ...n }: NoticiaDb) => ({ ...n, autorNombre: nombreDe(db, autorId) });
const publicoArchivo = (db: Db, a: ArchivoDb): ArchivoBiblioteca => ({ ...a, subidoPorNombre: nombreDe(db, a.subidoPor) ?? "" });
function publicoReserva(db: Db, r: ReservaDb): ReservaImpresion {
  const solicitante = db.usuarios.find((u) => u.id === r.solicitante);
  const curso = solicitante?.cursoId ? db.cursos.find((c) => c.id === solicitante.cursoId) : undefined;
  return { ...r, solicitanteNombre: solicitante?.nombre ?? "", solicitanteCurso: curso ? nombreCurso(curso) : null };
}

/* ---------- Reglas ---------- */

function exigir(condicion: unknown, status: number, mensaje: string): asserts condicion {
  if (!condicion) throw new Falla(status, mensaje);
}

function permiso(yo: UsuarioDb, p: Parameters<typeof puede>[1], mensaje = "No tenés permiso para hacer esto.") {
  exigir(puede(yo.rol, p), 403, mensaje);
}

function buscarCurso(db: Db, id: string) {
  const curso = db.cursos.find((c) => c.id === id);
  exigir(curso, 404, "Ese curso ya no existe. Actualizá la página.");
  return curso;
}

const soloDigitos = (valor: unknown) => (typeof valor === "string" ? valor.replace(/\D/g, "") : "");

/** Para comparar nombres al ingresar: sin mayúsculas, tildes ni espacios de más. */
const normalizarNombre = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Nombre completo (con eso y la contraseña se ingresa: no se puede repetir), DNI, email y, si vienen, teléfono y sexo.
 * `excepto` es el id de la cuenta que se está editando (puede quedarse con sus propios datos).
 */
function validarIdentidad(db: Db, d: Cuerpo, quien = "", excepto?: string) {
  const prefijo = quien ? `${quien}: ` : "";
  const nombre = texto(d.nombre).replace(/\s+/g, " ").slice(0, 120);
  const dni = soloDigitos(d.dni);
  const email = texto(d.email).toLowerCase();
  const telefono = soloDigitos(d.telefono);
  exigir(nombre.includes(" "), 400, `${prefijo}poné nombre y apellido completos (con ese nombre se ingresa al panel).`);
  exigir(
    !db.usuarios.some((u) => u.id !== excepto && normalizarNombre(u.nombre) === normalizarNombre(nombre)),
    400,
    `${prefijo}ya hay una cuenta a nombre de ${nombre}. Agregá el segundo nombre o apellido para diferenciarla (con el nombre completo se ingresa).`,
  );
  exigir(dni.length >= 7 && dni.length <= 8, 400, `${prefijo}el DNI tiene que tener 7 u 8 números.`);
  exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, `${prefijo}el email no es válido.`);
  exigir(!telefono || (telefono.length >= 10 && telefono.length <= 13), 400, `${prefijo}poné el teléfono con característica, sin 0 ni 15 (ej. 3772 41-2345).`);
  const otras = db.usuarios.filter((u) => u.id !== excepto);
  exigir(!otras.some((u) => u.email === email), 400, `${prefijo}ya existe una cuenta con el email ${email}.`);
  exigir(!otras.some((u) => soloDigitos(u.dni) === dni), 400, `${prefijo}ya hay una cuenta con el DNI ${formatoDni(dni)}.`);
  const sexo = (["F", "M"] as const).find((s) => s === d.sexo) ?? null;
  return { nombre, email, dni: formatoDni(dni), telefono: telefono || null, sexo };
}

/** Contraseña nueva que puso el administrador al editar una cuenta; vacía (`null`) deja la que tenía. */
function validarPassword(d: Cuerpo, quien = "") {
  const password = typeof d.password === "string" ? d.password.trim() : "";
  if (!password) return null;
  exigir(password.length >= 6, 400, `${quien ? `${quien}: ` : ""}la contraseña tiene que tener al menos 6 caracteres.`);
  exigir(password.length <= 60, 400, `${quien ? `${quien}: ` : ""}la contraseña es demasiado larga.`);
  return password;
}

function validarCuenta(db: Db, datos: Cuerpo) {
  return { id: nuevoId(), ...validarIdentidad(db, datos), password: PASSWORD_DEMO, creadoEn: ahora() };
}

/**
 * Datos de una persona del alta de familia (tutor o hijo/a): todos obligatorios.
 * `usados` junta los emails y DNI del mismo formulario, para que no se repitan entre ellos.
 */
function validarPersona(db: Db, datos: unknown, quien: string, usados: { emails: Set<string>; dnis: Set<string> }) {
  const d = (datos && typeof datos === "object" ? datos : {}) as Cuerpo;
  const persona = validarIdentidad(db, d, quien);
  exigir(persona.telefono, 400, `${quien}: poné el teléfono.`);
  exigir(persona.sexo, 400, `${quien}: elegí mujer o varón.`);
  exigir(!usados.emails.has(persona.email), 400, `${quien}: el email ${persona.email} ya lo usa otra persona del formulario.`);
  exigir(!usados.dnis.has(persona.dni), 400, `${quien}: el DNI ${persona.dni} ya lo usa otra persona del formulario.`);
  usados.emails.add(persona.email);
  usados.dnis.add(persona.dni);
  // Todas las cuentas nuevas tienen la misma contraseña.
  return { id: nuevoId(), ...persona, password: PASSWORD_DEMO, creadoEn: ahora() };
}

/** "45123456" → "45.123.456" */
const formatoDni = (dni: string) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function controlarAlumnos(db: Db, yo: UsuarioDb, cursoId: string) {
  permiso(yo, "cursos:alumnos", "No tenés permiso para modificar los alumnos de un curso.");
  const curso = buscarCurso(db, cursoId);
  if (yo.rol === "profesor") {
    exigir(
      db.docentes.some((d) => d.cursoId === cursoId && d.profesorId === yo.id),
      403,
      "Solo podés agregar o quitar alumnos en los cursos donde das alguna materia.",
    );
  }
  return curso;
}

function controlarAsistencia(db: Db, yo: UsuarioDb, cursoId: string, materia: unknown) {
  permiso(yo, "asistencia:tomar", "No tenés permiso para tomar asistencia.");
  buscarCurso(db, cursoId);
  const asignacion = db.docentes.find((d) => d.cursoId === cursoId && d.materia.toLowerCase() === texto(materia).toLowerCase());
  exigir(asignacion, 400, "Elegí una materia del curso.");
  exigir(
    yo.rol !== "profesor" || asignacion.profesorId === yo.id,
    403,
    `Solo podés tomar asistencia en tus materias. ${asignacion.materia} la da otro profesor.`,
  );
  return asignacion.materia;
}

function leerFecha(valor: unknown) {
  const fecha = texto(valor);
  exigir(/^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha)), 400, "La fecha no es válida.");
  exigir(
    new Date(`${fecha}T00:00:00.000Z`).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
    400,
    "No se puede tomar asistencia de un día que todavía no llegó.",
  );
  return fecha;
}

function armarSlug(titulo: string) {
  return (
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100)
      .replace(/-+$/, "") || "noticia"
  );
}

function slugLibre(db: Db, base: string) {
  const usados = new Set(db.noticias.map((n) => n.slug));
  let slug = base;
  for (let i = 2; usados.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

const enDias = (dias: number) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
const vencido = (a: ArchivoDb) => a.expiraEn !== null && new Date(a.expiraEn) <= new Date();

function archivoVisible(db: Db, yo: UsuarioDb, id: string) {
  const archivo = db.archivos.find((a) => a.id === id);
  const veTodo = puede(yo.rol, "biblioteca:pedidos") || puede(yo.rol, "biblioteca:gestionar-archivos");
  exigir(archivo && (veTodo || archivo.subidoPor === yo.id || (archivo.visibilidad === "biblioteca" && !vencido(archivo))), 404, "Ese archivo ya no existe.");
  return archivo;
}

function generarCodigoRetiro() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "BIB-" + Array.from({ length: 6 }, () => alfabeto[Math.floor(Math.random() * alfabeto.length)]).join("");
}

const comoDataUrl = (archivo: Blob) =>
  new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(archivo);
  });

async function guardarContenido(id: string, archivo: Blob) {
  contenidosEnMemoria.set(id, archivo);
  if (archivo.size > MAXIMO_GUARDADO) return;
  try {
    localStorage.setItem(CLAVE_CONTENIDO + id, await comoDataUrl(archivo));
  } catch {
    // No entra: queda solo en memoria.
  }
}

async function leerContenido(id: string): Promise<Blob | null> {
  const enMemoria = contenidosEnMemoria.get(id);
  if (enMemoria) return enMemoria;
  if (id === "a-1") return new Blob(["Guía de ejercicios de funciones lineales (archivo de ejemplo del modo demo).\n"], { type: "text/plain" });
  try {
    const dataUrl = localStorage.getItem(CLAVE_CONTENIDO + id);
    return dataUrl ? await (await fetch(dataUrl)).blob() : null;
  } catch {
    return null;
  }
}

function borrarContenido(id: string) {
  contenidosEnMemoria.delete(id);
  try {
    localStorage.removeItem(CLAVE_CONTENIDO + id);
  } catch {
    // nada
  }
}

function borrarUsuario(db: Db, id: string) {
  for (const a of db.archivos.filter((a) => a.subidoPor === id)) borrarContenido(a.id);
  db.archivos = db.archivos.filter((a) => a.subidoPor !== id);
  db.reservas = db.reservas.filter((r) => r.solicitante !== id);
  db.docentes = db.docentes.filter((d) => d.profesorId !== id);
  db.asistencias = db.asistencias.filter((a) => a.alumnoId !== id);
  db.puntos = db.puntos.filter((p) => p.alumnoId !== id);
  if (db.sanciones) delete db.sanciones[id];
  if (db.pagosCuotas) db.pagosCuotas = db.pagosCuotas.filter((p) => p.alumnoId !== id);
  if (db.telefonosCuotas) delete db.telefonosCuotas[id];
  if (db.recordatoriosCuotas) db.recordatoriosCuotas = db.recordatoriosCuotas.filter((r) => r.alumnoId !== id);
  if (db.asistenciaPersonal) db.asistenciaPersonal = db.asistenciaPersonal.filter((a) => a.personaId !== id);
  for (const u of db.usuarios) if (u.padreId === id) u.padreId = null;
  for (const n of db.noticias) if (n.autorId === id) n.autorId = null;
  db.usuarios = db.usuarios.filter((u) => u.id !== id);
}

/** Cuotas de un alumno: pagadas con su valor de ese momento; las demás con el valor actual. */
function cuotasDeAlumno(db: Db, alumno: UsuarioDb): CuotasAlumno {
  const config = db.cuotasConfig ?? CONFIG_CUOTAS_INICIAL;
  const hoy = hoyLocal();
  const curso = alumno.cursoId ? db.cursos.find((c) => c.id === alumno.cursoId) : undefined;
  const cuotas: Cuota[] = mesesConCuota().map((mes) => {
    const pago = db.pagosCuotas?.find((p) => p.alumnoId === alumno.id && p.mes === mes);
    const vencimiento = `${mes}-${dosCifras(config.diaVencimiento)}`;
    return {
      mes,
      vencimiento,
      monto: pago?.monto ?? config.monto,
      estado: pago ? "pagada" : hoy > vencimiento ? "vencida" : "pendiente",
      pagadaEn: pago?.pagadoEn ?? null,
      metodo: pago?.metodo ?? null,
    };
  });
  return {
    alumnoId: alumno.id,
    nombre: alumno.nombre,
    curso: curso ? nombreCurso(curso) : null,
    tutorNombre: nombreDe(db, alumno.padreId),
    // El que cargó el administrador en Cuotas; si no, el del tutor que se cargó al crear su cuenta.
    telefono: db.telefonosCuotas?.[alumno.id] ?? db.usuarios.find((u) => u.id === alumno.padreId)?.telefono ?? null,
    recordatorios: (db.recordatoriosCuotas ?? [])
      .filter((r) => r.alumnoId === alumno.id)
      .sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn))
      .map((r) => ({
        id: r.id,
        enviadoEn: r.enviadoEn,
        enviadoPorNombre: nombreDe(db, r.enviadoPorId) ?? "Administración",
        meses: r.meses,
        monto: r.monto,
      })),
    cuotas,
  };
}

/* ---------- Rutas ---------- */

type Pedido = { metodo: string; partes: string[]; query: URLSearchParams; cuerpo: Cuerpo; yo: UsuarioDb | null; db: Db };

/** Partes fijas de las rutas; todo lo demás es un id. */
const palabras = new Set(
  "auth login yo usuarios familia cursos docentes alumnos asistencia resumen puntos sanciones cuotas config avisos leidos telefono recordatorios personal noticias eventos biblioteca archivos reservas pagar estado".split(" "),
);

async function atender({ metodo, partes, query, cuerpo, yo: sesion, db }: Pedido): Promise<Response> {
  const [id, subId] = partes.filter((p) => !palabras.has(p));
  const ruta = `${metodo} /${partes.map((p) => (palabras.has(p) ? p : ":id")).join("/")}`;

  if (ruta === "POST /auth/login") {
    const nombre = normalizarNombre(texto(cuerpo.nombre));
    const password = typeof cuerpo.password === "string" ? cuerpo.password.trim() : "";
    exigir(nombre && password, 400, "Poné tu nombre completo y tu contraseña.");
    const usuario = db.usuarios.find((u) => normalizarNombre(u.nombre) === nombre && u.password === password);
    exigir(usuario, 400, "El nombre completo o la contraseña no son correctos. Si no te acordás, pedísela a la administración.");
    // Igual que el backend: la sesión dura 60 minutos.
    const expira = Date.now() + MINUTOS_SESION * 60_000;
    return json({ token: `demo:${usuario.id}:${expira}`, expiraEn: new Date(expira).toISOString(), usuario: publicoUsuario(db, usuario) });
  }

  exigir(sesion, 401, "Tu sesión terminó. Volvé a iniciar sesión.");
  const yo = sesion;

  switch (ruta) {
    /* --- Sesión y usuarios --- */
    case "GET /auth/yo":
      return json(publicoUsuario(db, yo));

    case "GET /usuarios": {
      if (puede(yo.rol, "alumnos:ver-todos") || puede(yo.rol, "seccion:usuarios")) {
        return json([...db.usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((u) => usuarioPara(db, yo, u)));
      }
      const relacionados = db.usuarios.filter((u) => u.padreId === yo.id || u.id === yo.padreId);
      return json([yo, ...relacionados].map((u) => usuarioPara(db, yo, u)));
    }

    case "PUT /usuarios/:id": {
      permiso(yo, "seccion:usuarios", "Solo el administrador puede cambiar los datos de una cuenta.");
      const usuario = db.usuarios.find((u) => u.id === id);
      exigir(usuario, 404, "Esa cuenta ya no existe. Actualizá la página.");
      const password = validarPassword(cuerpo);
      Object.assign(usuario, validarIdentidad(db, cuerpo, "", usuario.id), password ? { password } : {});
      return json(usuarioPara(db, yo, usuario));
    }

    case "POST /usuarios": {
      permiso(yo, "seccion:usuarios", "No tenés permiso para crear cuentas.");
      exigir(cuerpo.rol !== "alumno", 400, "Los alumnos se agregan desde su curso, en la sección Cursos.");
      const rol = rolesAsignables.find((r) => r === cuerpo.rol);
      exigir(rol, 400, "Elegí un rol.");
      const nuevo: UsuarioDb = { ...validarCuenta(db, cuerpo), rol, cursoId: null, padreId: null };
      db.usuarios.push(nuevo);
      return json(publicoUsuario(db, nuevo), 201);
    }

    case "POST /usuarios/familia": {
      permiso(yo, "seccion:usuarios", "Solo el administrador puede crear cuentas.");
      const usados = { emails: new Set<string>(), dnis: new Set<string>() };
      const tutor: UsuarioDb = { ...validarPersona(db, cuerpo.tutor, "Tutor/a", usados), rol: "padre", cursoId: null, padreId: null };
      const lista = Array.isArray(cuerpo.hijos) ? cuerpo.hijos : [];
      exigir(lista.length >= 1, 400, "Agregá al menos un hijo o hija.");
      exigir(lista.length <= 10, 400, "Se pueden agregar hasta 10 hijos por vez.");
      const hijos: UsuarioDb[] = lista.map((h, i) => {
        const quien = lista.length === 1 ? "Hijo/a" : `Hijo/a ${i + 1}`;
        const cursoId = texto((h as Cuerpo | null)?.cursoId) || null;
        exigir(!cursoId || db.cursos.some((c) => c.id === cursoId), 400, `${quien}: ese curso ya no existe. Actualizá la página.`);
        return { ...validarPersona(db, h, quien, usados), rol: "alumno", cursoId, padreId: tutor.id };
      });
      // Se guarda todo junto: si algún dato está mal, no se crea ninguna cuenta.
      db.usuarios.push(tutor, ...hijos);
      return json({ tutor: publicoUsuario(db, tutor), hijos: hijos.map((h) => publicoUsuario(db, h)) }, 201);
    }

    case "DELETE /usuarios/:id": {
      permiso(yo, "seccion:usuarios", "No tenés permiso para borrar cuentas.");
      exigir(id !== yo.id, 400, "No podés borrar tu propia cuenta.");
      const usuario = db.usuarios.find((u) => u.id === id);
      if (usuario) {
        exigir(usuario.rol !== "admin", 403, "La cuenta del administrador no se puede borrar.");
        borrarUsuario(db, id);
      }
      return json(null, 204);
    }

    /* --- Cursos --- */
    case "GET /cursos": {
      const visibles = db.cursos.filter((c) => {
        if (yo.rol === "profesor") return db.docentes.some((d) => d.cursoId === c.id && d.profesorId === yo.id);
        if (puede(yo.rol, "seccion:cursos")) return true;
        return db.usuarios.some((u) => u.cursoId === c.id && (u.id === yo.id || u.padreId === yo.id));
      });
      visibles.sort((a, b) => a.anio - b.anio || a.division.localeCompare(b.division));
      return json(visibles.map((c) => publicoCurso(db, c)));
    }

    case "POST /cursos": {
      permiso(yo, "cursos:gestionar", "No tenés permiso para crear cursos.");
      const anio = Number(cuerpo.anio);
      const division = texto(cuerpo.division).toUpperCase().slice(0, 10);
      exigir(Number.isInteger(anio) && anio >= 1 && anio <= 6, 400, "Elegí un año de 1° a 6°.");
      exigir(division, 400, "Poné la división.");
      exigir(!db.cursos.some((c) => c.anio === anio && c.division === division), 400, `El curso ${nombreCurso({ anio, division })} ya existe.`);
      const curso: CursoDb = { id: nuevoId(), anio, division, creadoEn: ahora() };
      db.cursos.push(curso);
      return json(publicoCurso(db, curso), 201);
    }

    case "DELETE /cursos/:id": {
      permiso(yo, "cursos:gestionar", "No tenés permiso para borrar cursos.");
      db.cursos = db.cursos.filter((c) => c.id !== id);
      db.docentes = db.docentes.filter((d) => d.cursoId !== id);
      db.asistencias = db.asistencias.filter((a) => a.cursoId !== id);
      db.puntos = db.puntos.filter((p) => p.cursoId !== id);
      for (const u of db.usuarios) if (u.cursoId === id) u.cursoId = null;
      return json(null, 204);
    }

    case "POST /cursos/:id/docentes": {
      permiso(yo, "cursos:gestionar", "No tenés permiso para asignar profesores.");
      const curso = buscarCurso(db, id);
      const materia = texto(cuerpo.materia).slice(0, 80);
      exigir(materia, 400, "Poné la materia.");
      const profesor = db.usuarios.find((u) => u.id === cuerpo.profesorId);
      exigir(profesor?.rol === "profesor", 400, "Elegí un profesor.");
      const existente = db.docentes.find((d) => d.cursoId === id && d.materia.toLowerCase() === materia.toLowerCase());
      exigir(
        !existente,
        400,
        `${materia} en ${nombreCurso(curso)} ya la da ${nombreDe(db, existente?.profesorId ?? null)}. Quitala primero para cambiar de profesor.`,
      );
      db.docentes.push({ id: nuevoId(), cursoId: id, profesorId: profesor.id, materia });
      return json(publicoCurso(db, curso), 201);
    }

    case "DELETE /cursos/:id/docentes/:id": {
      permiso(yo, "cursos:gestionar", "No tenés permiso para quitar materias.");
      db.docentes = db.docentes.filter((d) => !(d.id === subId && d.cursoId === id));
      return json(null, 204);
    }

    case "POST /cursos/:id/alumnos": {
      controlarAlumnos(db, yo, id);
      const padreId = texto(cuerpo.padreId) || null;
      if (padreId) exigir(db.usuarios.find((u) => u.id === padreId)?.rol === "padre", 400, "El padre/madre elegido no existe.");
      const alumno: UsuarioDb = { ...validarCuenta(db, cuerpo), rol: "alumno", cursoId: id, padreId };
      db.usuarios.push(alumno);
      return json(publicoUsuario(db, alumno), 201);
    }

    case "PUT /cursos/:id/alumnos/:id": {
      controlarAlumnos(db, yo, id);
      const alumno = db.usuarios.find((u) => u.id === subId && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe.");
      alumno.cursoId = id;
      return json(publicoUsuario(db, alumno));
    }

    case "DELETE /cursos/:id/alumnos/:id": {
      controlarAlumnos(db, yo, id);
      const alumno = db.usuarios.find((u) => u.id === subId && u.cursoId === id);
      if (alumno) alumno.cursoId = null;
      return json(null, 204);
    }

    /* --- Asistencia --- */
    case "GET /cursos/:id/asistencia": {
      const materia = controlarAsistencia(db, yo, id, query.get("materia"));
      const fecha = leerFecha(query.get("fecha"));
      const registros = db.asistencias
        .filter((a) => a.cursoId === id && a.materia === materia && a.fecha === fecha)
        .map(({ alumnoId, estado }) => ({ alumnoId, estado }));
      return json({ registros });
    }

    case "GET /cursos/:id/asistencia/resumen": {
      const materia = controlarAsistencia(db, yo, id, query.get("materia"));
      const delCurso = db.asistencias.filter((a) => a.cursoId === id && a.materia === materia);
      const alumnos: Record<string, Record<EstadoAsistencia, number>> = {};
      for (const { alumnoId, estado } of delCurso) {
        alumnos[alumnoId] ??= { presente: 0, tarde: 0, ausente: 0 };
        alumnos[alumnoId][estado]++;
      }
      const dias = [...new Set(delCurso.map((a) => a.fecha))].sort().reverse();
      return json({ dias, alumnos });
    }

    case "PUT /cursos/:id/asistencia": {
      const materia = controlarAsistencia(db, yo, id, cuerpo.materia);
      const fecha = leerFecha(cuerpo.fecha);
      const registros = Array.isArray(cuerpo.registros) ? (cuerpo.registros as { alumnoId?: unknown; estado?: unknown }[]) : [];
      exigir(registros.length > 0, 400, "No hay alumnos para guardar.");
      const delCurso = new Set(db.usuarios.filter((u) => u.cursoId === id && u.rol === "alumno").map((u) => u.id));
      const estados: EstadoAsistencia[] = ["presente", "tarde", "ausente"];
      const limpios = registros.map((r) => {
        const alumnoId = texto(r?.alumnoId);
        const estado = estados.find((e) => e === r?.estado);
        exigir(delCurso.has(alumnoId), 400, "Hay un alumno que ya no está en este curso. Actualizá la página.");
        exigir(estado, 400, "Marcá a cada alumno como presente, tarde o ausente.");
        return { alumnoId, estado };
      });
      db.asistencias = db.asistencias.filter(
        (a) => !(a.cursoId === id && a.materia === materia && a.fecha === fecha && limpios.some((l) => l.alumnoId === a.alumnoId)),
      );
      db.asistencias.push(...limpios.map((l) => ({ ...l, cursoId: id, materia, fecha })));
      return json({ guardados: limpios.length });
    }

    /* --- Positivos y negativos --- */
    /* --- Asistencia del personal (profesores y preceptores): solo el administrador --- */
    case "GET /personal/asistencia": {
      permiso(yo, "personal:asistencia", "Solo la administración ve la asistencia del personal.");
      const hoy = hoyLocal();
      const registros = db.asistenciaPersonal ?? [];
      const personal: AsistenciaPersonal[] = db.usuarios
        .filter((u) => (ROLES_PERSONAL as readonly string[]).includes(u.rol))
        .sort((a, b) => a.rol.localeCompare(b.rol) || a.nombre.localeCompare(b.nombre))
        .map((u) => {
          const propios = registros
            .filter((r) => r.personaId === u.id)
            .map(({ fecha, estado }) => ({ fecha, estado }))
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
          const cuenta = (e: EstadoAsistencia) => propios.filter((r) => r.estado === e).length;
          return {
            personaId: u.id,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            materias: [...new Set(db.docentes.filter((d) => d.profesorId === u.id).map((d) => d.materia))].sort((a, b) => a.localeCompare(b)),
            presente: cuenta("presente"),
            tarde: cuenta("tarde"),
            ausente: cuenta("ausente"),
            hoy: propios.find((r) => r.fecha === hoy)?.estado ?? null,
            registros: propios,
          };
        });
      return json({ fecha: hoy, personal });
    }

    case "PUT /personal/asistencia": {
      permiso(yo, "personal:asistencia", "Solo la administración toma asistencia del personal.");
      const fecha = leerFecha(cuerpo.fecha);
      const personaId = texto(cuerpo.personaId);
      exigir(
        db.usuarios.some((u) => u.id === personaId && (ROLES_PERSONAL as readonly string[]).includes(u.rol)),
        400,
        "Esa persona ya no está en el personal. Actualizá la página.",
      );
      const estado = (["presente", "tarde", "ausente"] as const).find((e) => e === cuerpo.estado);
      exigir(estado, 400, "Marcá presente, tarde o ausente.");
      db.asistenciaPersonal = (db.asistenciaPersonal ?? []).filter((a) => !(a.personaId === personaId && a.fecha === fecha));
      db.asistenciaPersonal.push({ personaId, fecha, estado });
      return json({ personaId, fecha, estado });
    }

    /* --- Cuotas: el tutor ve y paga las de sus hijos; el administrador ve todas, recibe los avisos y cambia el valor --- */
    case "GET /cuotas": {
      permiso(yo, "seccion:cuotas", "No tenés acceso a las cuotas.");
      const alumnos = db.usuarios
        .filter((u) => u.rol === "alumno" && (puede(yo.rol, "cuotas:gestionar") || u.padreId === yo.id))
        .map((u) => cuotasDeAlumno(db, u))
        .sort((a, b) => (a.curso ?? "~").localeCompare(b.curso ?? "~") || a.nombre.localeCompare(b.nombre));
      return json({ config: db.cuotasConfig, alumnos });
    }

    case "POST /cuotas/pagar": {
      const alumno = db.usuarios.find((u) => u.id === texto(cuerpo.alumnoId) && u.rol === "alumno");
      exigir(alumno && alumno.padreId === yo.id, 403, "Solo el tutor del alumno puede pagar sus cuotas.");
      const mes = texto(cuerpo.mes);
      exigir(mesesConCuota().includes(mes), 400, "Esa cuota no existe.");
      exigir(!db.pagosCuotas?.some((p) => p.alumnoId === alumno.id && p.mes === mes), 400, "Esa cuota ya está pagada.");
      const metodo = (["mercadopago", "tarjeta"] as const).find((m) => m === cuerpo.metodo);
      exigir(metodo, 400, "Elegí cómo vas a pagar: Mercado Pago o tarjeta.");
      db.pagosCuotas ??= [];
      db.pagosCuotas.push({
        id: nuevoId(),
        alumnoId: alumno.id,
        mes,
        monto: (db.cuotasConfig ?? CONFIG_CUOTAS_INICIAL).monto,
        metodo,
        pagadoPorId: yo.id,
        pagadoEn: ahora(),
        visto: false,
      });
      return json(cuotasDeAlumno(db, alumno), 201);
    }

    case "PUT /cuotas/config": {
      permiso(yo, "cuotas:gestionar", "Solo el administrador puede cambiar el valor de la cuota.");
      const monto = Number(cuerpo.monto);
      const diaVencimiento = Number(cuerpo.diaVencimiento);
      exigir(Number.isInteger(monto) && monto >= 1 && monto <= 10_000_000, 400, "Poné un valor de cuota válido (en pesos, sin centavos).");
      exigir(Number.isInteger(diaVencimiento) && diaVencimiento >= 1 && diaVencimiento <= 28, 400, "El día de vencimiento tiene que ser del 1 al 28.");
      db.cuotasConfig = { monto, diaVencimiento };
      return json(db.cuotasConfig);
    }

    case "PUT /cuotas/alumnos/:id/telefono": {
      permiso(yo, "cuotas:gestionar", "Solo el administrador puede cambiar el teléfono de contacto.");
      const alumno = db.usuarios.find((u) => u.id === id && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe. Actualizá la página.");
      const telefono = texto(cuerpo.telefono).replace(/\D/g, "");
      exigir(!telefono || (telefono.length >= 10 && telefono.length <= 13), 400, "Poné el número con característica, sin 0 ni 15 (ej. 3772 41-2345).");
      db.telefonosCuotas ??= {};
      if (telefono) db.telefonosCuotas[alumno.id] = telefono;
      else delete db.telefonosCuotas[alumno.id];
      return json(cuotasDeAlumno(db, alumno));
    }

    case "POST /cuotas/alumnos/:id/recordatorios": {
      permiso(yo, "cuotas:gestionar", "Solo el administrador puede mandar recordatorios de pago.");
      const alumno = db.usuarios.find((u) => u.id === id && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe. Actualizá la página.");
      exigir(db.telefonosCuotas?.[alumno.id], 400, "Cargá primero el WhatsApp de la familia.");
      const vencidas = cuotasDeAlumno(db, alumno).cuotas.filter((c) => c.estado === "vencida");
      exigir(vencidas.length > 0, 400, "Este alumno no tiene cuotas vencidas.");
      db.recordatoriosCuotas ??= [];
      db.recordatoriosCuotas.push({
        id: nuevoId(),
        alumnoId: alumno.id,
        enviadoPorId: yo.id,
        enviadoEn: ahora(),
        meses: vencidas.map((c) => c.mes),
        monto: vencidas.reduce((t, c) => t + c.monto, 0),
      });
      return json(cuotasDeAlumno(db, alumno), 201);
    }

    case "GET /cuotas/avisos": {
      permiso(yo, "cuotas:gestionar", "No tenés acceso a los avisos de pago.");
      const avisos: AvisoPagoCuota[] = [...(db.pagosCuotas ?? [])]
        .sort((a, b) => b.pagadoEn.localeCompare(a.pagadoEn))
        .slice(0, 50)
        .map((p) => {
          const alumno = db.usuarios.find((u) => u.id === p.alumnoId);
          const curso = alumno?.cursoId ? db.cursos.find((c) => c.id === alumno.cursoId) : undefined;
          return {
            id: p.id,
            alumnoNombre: alumno?.nombre ?? "Alumno borrado",
            curso: curso ? nombreCurso(curso) : null,
            tutorNombre: nombreDe(db, p.pagadoPorId) ?? "—",
            mes: p.mes,
            monto: p.monto,
            metodo: p.metodo,
            pagadoEn: p.pagadoEn,
            visto: p.visto,
          };
        });
      return json({ avisos, noVistos: (db.pagosCuotas ?? []).filter((p) => !p.visto).length });
    }

    case "POST /cuotas/avisos/leidos": {
      permiso(yo, "cuotas:gestionar", "No tenés acceso a los avisos de pago.");
      for (const p of db.pagosCuotas ?? []) p.visto = true;
      return json(null, 204);
    }

    /* --- Amonestaciones y apercibimientos (solo el preceptor las cambia) --- */
    case "GET /cursos/:id/sanciones": {
      permiso(yo, "sanciones:editar", "No tenés permiso para ver las amonestaciones del curso.");
      buscarCurso(db, id);
      const sanciones: Record<string, Sanciones> = {};
      for (const u of db.usuarios) {
        if (u.rol === "alumno" && u.cursoId === id) sanciones[u.id] = db.sanciones?.[u.id] ?? { amonestaciones: 0, apercibimientos: 0 };
      }
      return json({ sanciones });
    }

    case "GET /alumnos/:id/sanciones": {
      const alumno = db.usuarios.find((u) => u.id === id && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe.");
      exigir(
        alumno.id === yo.id || alumno.padreId === yo.id || puede(yo.rol, "alumnos:ver-todos") || puede(yo.rol, "sanciones:editar"),
        403,
        "No podés ver las amonestaciones de este alumno.",
      );
      return json(db.sanciones?.[id] ?? { amonestaciones: 0, apercibimientos: 0 });
    }

    case "PUT /alumnos/:id/sanciones": {
      permiso(yo, "sanciones:editar", "Solo el preceptor puede cambiar amonestaciones y apercibimientos.");
      const alumno = db.usuarios.find((u) => u.id === id && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe. Actualizá la página.");
      const tipo = (["amonestaciones", "apercibimientos"] as const).find((t) => t === cuerpo.tipo);
      exigir(tipo, 400, "Elegí amonestaciones o apercibimientos.");
      const cantidad = Number(cuerpo.cantidad);
      exigir(Number.isInteger(cantidad) && cantidad >= 0 && cantidad <= 99, 400, "La cantidad tiene que ser de 0 a 99.");
      db.sanciones ??= {};
      const actual = db.sanciones[id] ?? { amonestaciones: 0, apercibimientos: 0 };
      db.sanciones[id] = { ...actual, [tipo]: cantidad };
      return json(db.sanciones[id]);
    }

    /* --- Asistencia y positivos/negativos de un alumno (solo lectura) --- */
    case "GET /alumnos/:id/asistencia": {
      const alumno = db.usuarios.find((u) => u.id === id && u.rol === "alumno");
      exigir(alumno, 404, "Ese alumno ya no existe.");
      exigir(
        alumno.id === yo.id || alumno.padreId === yo.id || puede(yo.rol, "alumnos:ver-todos"),
        403,
        "No podés ver la asistencia de este alumno.",
      );
      // Las materias de su curso, más las que tengan registros de antes (si cambió de curso).
      const nombres = new Set(db.docentes.filter((d) => d.cursoId === alumno.cursoId).map((d) => d.materia));
      const asistencias = db.asistencias.filter((a) => a.alumnoId === alumno.id);
      const puntos = db.puntos.filter((p) => p.alumnoId === alumno.id);
      for (const r of [...asistencias, ...puntos]) nombres.add(r.materia);
      const materias = [...nombres]
        .sort((a, b) => a.localeCompare(b))
        .map((materia) => {
          const registros = asistencias
            .filter((a) => a.materia === materia)
            .map(({ fecha, estado }) => ({ fecha, estado }))
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
          const cuenta = (estado: EstadoAsistencia) => registros.filter((r) => r.estado === estado).length;
          const delaMateria = puntos.filter((p) => p.materia === materia);
          return {
            materia,
            presente: cuenta("presente"),
            tarde: cuenta("tarde"),
            ausente: cuenta("ausente"),
            positivos: delaMateria.filter((p) => p.tipo === "positivo").length,
            negativos: delaMateria.filter((p) => p.tipo === "negativo").length,
            registros,
          };
        });
      return json({ materias });
    }

    case "GET /cursos/:id/puntos": {
      const materia = controlarAsistencia(db, yo, id, query.get("materia"));
      const puntos: Record<string, Record<TipoPunto, number>> = {};
      for (const p of db.puntos) {
        if (p.cursoId !== id || p.materia !== materia) continue;
        puntos[p.alumnoId] ??= { positivo: 0, negativo: 0 };
        puntos[p.alumnoId][p.tipo]++;
      }
      return json({ puntos });
    }

    case "POST /cursos/:id/puntos": {
      const materia = controlarAsistencia(db, yo, id, cuerpo.materia);
      const tipo = (["positivo", "negativo"] as const).find((t) => t === cuerpo.tipo);
      exigir(tipo, 400, "Elegí positivo o negativo.");
      const alumnoId = texto(cuerpo.alumnoId);
      exigir(
        db.usuarios.some((u) => u.id === alumnoId && u.rol === "alumno" && u.cursoId === id),
        400,
        "Ese alumno ya no está en este curso. Actualizá la página.",
      );
      const punto: PuntoDb = { id: nuevoId(), cursoId: id, materia, alumnoId, tipo, puestoPorId: yo.id, creadoEn: ahora() };
      db.puntos.push(punto);
      return json({ id: punto.id }, 201);
    }

    case "DELETE /cursos/:id/puntos/:id": {
      const punto = db.puntos.find((p) => p.id === subId && p.cursoId === id);
      if (punto) {
        controlarAsistencia(db, yo, id, punto.materia);
        db.puntos = db.puntos.filter((p) => p.id !== subId);
      }
      return json(null, 204);
    }

    /* --- Noticias --- */
    case "GET /noticias": {
      const visibles = puede(yo.rol, "noticias:editar") ? db.noticias : db.noticias.filter((n) => n.publicada);
      return json([...visibles].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).map((n) => publicoNoticia(db, n)));
    }

    case "POST /noticias":
    case "PUT /noticias/:id": {
      permiso(yo, "noticias:editar", "No tenés permiso para editar noticias.");
      const campos = {
        titulo: texto(cuerpo.titulo).slice(0, 160),
        categoria: texto(cuerpo.categoria).slice(0, 40),
        resumen: texto(cuerpo.resumen).slice(0, 400),
        contenido: texto(cuerpo.contenido),
        publicada: cuerpo.publicada === "true" || cuerpo.publicada === true,
      };
      exigir(campos.titulo, 400, "Poné el título.");
      exigir(campos.categoria, 400, "Elegí una categoría.");
      exigir(campos.resumen, 400, "Escribí el resumen.");
      exigir(campos.contenido, 400, "Escribí el contenido.");
      let imagen: string | null | undefined;
      if (cuerpo.imagen instanceof Blob && cuerpo.imagen.size > 0) {
        exigir(cuerpo.imagen.type.startsWith("image/"), 400, "La imagen tiene que ser JPG, PNG o WEBP.");
        exigir(cuerpo.imagen.size <= 1.5 * 1024 * 1024, 413, "En el modo demo la imagen puede pesar hasta 1,5 MB.");
        imagen = await comoDataUrl(cuerpo.imagen);
      } else if (cuerpo.quitarImagen === "true") {
        imagen = null;
      }
      if (metodo === "POST") {
        const fecha = ahora();
        const noticia: NoticiaDb = {
          ...campos,
          id: nuevoId(),
          slug: slugLibre(db, armarSlug(campos.titulo)),
          imagen: imagen ?? null,
          publicadaEn: campos.publicada ? fecha : null,
          autorId: yo.id,
          creadoEn: fecha,
          actualizadoEn: fecha,
        };
        db.noticias.push(noticia);
        return json(publicoNoticia(db, noticia), 201);
      }
      const noticia = db.noticias.find((n) => n.id === id);
      exigir(noticia, 404, "Esa noticia ya no existe. Actualizá la página.");
      Object.assign(noticia, campos, {
        imagen: imagen === undefined ? noticia.imagen : imagen,
        publicadaEn: campos.publicada ? (noticia.publicadaEn ?? ahora()) : noticia.publicadaEn,
        actualizadoEn: ahora(),
      });
      return json(publicoNoticia(db, noticia));
    }

    case "DELETE /noticias/:id":
      permiso(yo, "noticias:editar", "No tenés permiso para borrar noticias.");
      db.noticias = db.noticias.filter((n) => n.id !== id);
      return json(null, 204);

    /* --- Eventos --- */
    case "GET /eventos":
      return json([...db.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha)));

    case "POST /eventos":
    case "PUT /eventos/:id": {
      permiso(yo, "eventos:editar", "No tenés permiso para editar eventos.");
      const datos = {
        titulo: texto(cuerpo.titulo).slice(0, 160),
        fecha: texto(cuerpo.fecha),
        horario: texto(cuerpo.horario).slice(0, 40) || null,
        lugar: texto(cuerpo.lugar).slice(0, 160) || null,
        categoria: texto(cuerpo.categoria).slice(0, 40),
        descripcion: texto(cuerpo.descripcion) || null,
      };
      exigir(datos.titulo, 400, "Poné el título.");
      exigir(/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha), 400, "Elegí la fecha.");
      exigir(datos.categoria, 400, "Elegí una categoría.");
      if (metodo === "POST") {
        const evento = { ...datos, id: nuevoId() };
        db.eventos.push(evento);
        return json(evento, 201);
      }
      const evento = db.eventos.find((e) => e.id === id);
      exigir(evento, 404, "Ese evento ya no existe. Actualizá la página.");
      Object.assign(evento, datos);
      return json(evento);
    }

    case "DELETE /eventos/:id":
      permiso(yo, "eventos:editar", "No tenés permiso para borrar eventos.");
      db.eventos = db.eventos.filter((e) => e.id !== id);
      return json(null, 204);
  }

  if (partes[0] === "biblioteca") return atenderBiblioteca(ruta, cuerpo, yo, db, id);
  throw new Falla(404, "Eso ya no existe. Actualizá la página.");
}

async function atenderBiblioteca(ruta: string, cuerpo: Cuerpo, yo: UsuarioDb, db: Db, id: string): Promise<Response> {
  switch (ruta) {
    case "GET /biblioteca/archivos": {
      const veTodo = puede(yo.rol, "biblioteca:pedidos") || puede(yo.rol, "biblioteca:gestionar-archivos");
      const visibles = db.archivos.filter((a) => veTodo || a.subidoPor === yo.id || (a.visibilidad === "biblioteca" && !vencido(a)));
      return json([...visibles].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).map((a) => publicoArchivo(db, a)));
    }

    case "POST /biblioteca/archivos": {
      const archivo = cuerpo.archivo;
      exigir(archivo instanceof File, 400, "Elegí un archivo.");
      exigir(archivo.size > 0, 400, "El archivo está vacío.");
      exigir(archivo.size <= bibliotecaConfig.tamanoMaximo, 413, "El archivo es demasiado grande.");
      const tipo = tipoDeArchivo(archivo.name, archivo.type);
      exigir(tipo, 400, "Ese tipo de archivo no se puede subir.");
      let visibilidad: Visibilidad = "impresion";
      let expiraEn: string | null = enDias(bibliotecaConfig.diasArchivoImpresion);
      if (texto(cuerpo.destino) === "biblioteca") {
        permiso(yo, "biblioteca:publicar", "No tenés permiso para publicar en la biblioteca.");
        const opcion = bibliotecaConfig.duraciones.find((d) => String(d.dias ?? "") === texto(cuerpo.duracion));
        exigir(opcion, 400, "Elegí cuánto tiempo queda publicado.");
        visibilidad = "biblioteca";
        expiraEn = opcion.dias === null ? null : enDias(opcion.dias);
      }
      const nuevo: ArchivoDb = {
        id: nuevoId(),
        nombre: (texto(cuerpo.nombre) || archivo.name).slice(0, 200),
        descripcion: texto(cuerpo.descripcion) || null,
        categoria: texto(cuerpo.categoria) || "otros",
        visibilidad,
        nombreOriginal: archivo.name,
        tipo,
        tamano: archivo.size,
        subidoPor: yo.id,
        expiraEn,
        creadoEn: ahora(),
      };
      await guardarContenido(nuevo.id, archivo);
      db.archivos.push(nuevo);
      return json(publicoArchivo(db, nuevo), 201);
    }

    case "DELETE /biblioteca/archivos/:id": {
      const archivo = db.archivos.find((a) => a.id === id);
      if (archivo) {
        exigir(archivo.subidoPor === yo.id || puede(yo.rol, "biblioteca:gestionar-archivos"), 403, "Solo podés borrar tus archivos.");
        db.archivos = db.archivos.filter((a) => a.id !== id);
        for (const r of db.reservas) if (r.archivoId === id) r.archivoId = null;
        borrarContenido(id);
      }
      return json(null, 204);
    }

    case "GET /biblioteca/reservas": {
      const visibles = db.reservas.filter(
        (r) => r.solicitante === yo.id || (puede(yo.rol, "biblioteca:pedidos") && ["pagada", "lista", "retirada"].includes(r.estado)),
      );
      return json([...visibles].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).map((r) => publicoReserva(db, r)));
    }

    case "POST /biblioteca/reservas": {
      const archivo = archivoVisible(db, yo, texto(cuerpo.archivoId));
      const paginas = Number(cuerpo.paginas);
      const copias = Number(cuerpo.copias);
      exigir(Number.isInteger(paginas) && paginas >= 1 && paginas <= 2000, 400, "Revisá la cantidad de páginas.");
      exigir(Number.isInteger(copias) && copias >= 1 && copias <= 100, 400, "Revisá la cantidad de copias.");
      // Color y anillado ya no se ofrecen: siempre blanco y negro, sin anillar.
      const opciones = { paginas, copias, color: false, anillado: false };
      const reserva: ReservaDb = {
        id: nuevoId(),
        archivoId: archivo.id,
        archivoNombre: archivo.nombre,
        ...opciones,
        dobleFaz: cuerpo.dobleFaz === true,
        notas: texto(cuerpo.notas).slice(0, 500) || null,
        total: calcularTotal(opciones),
        estado: "pendiente_pago",
        codigoRetiro: generarCodigoRetiro(),
        solicitante: yo.id,
        pagoId: null,
        creadoEn: ahora(),
        pagadoEn: null,
      };
      db.reservas.push(reserva);
      return json(publicoReserva(db, reserva), 201);
    }

    case "POST /biblioteca/reservas/:id/pagar": {
      const reserva = db.reservas.find((r) => r.id === id && r.solicitante === yo.id);
      exigir(reserva, 404, "Esa reserva ya no existe.");
      exigir(reserva.estado === "pendiente_pago", 400, "Esta reserva ya no se puede pagar.");
      const metodoPago = (["efectivo", "mercadopago"] as const).find((m) => m === cuerpo.metodo);
      exigir(metodoPago, 400, "Elegí cómo vas a pagar: efectivo o Mercado Pago.");
      Object.assign(reserva, { estado: "pagada", pagadoEn: ahora(), pagoId: `${metodoPago}-${nuevoId()}`, metodoPago });
      return json(publicoReserva(db, reserva));
    }

    case "PATCH /biblioteca/reservas/:id/estado": {
      const reserva = db.reservas.find((r) => r.id === id);
      exigir(reserva, 404, "Esa reserva ya no existe.");
      const nuevo = cuerpo.estado as EstadoReserva;
      const pasos: Partial<Record<EstadoReserva, { desde: EstadoReserva; puede: boolean }>> = {
        cancelada: { desde: "pendiente_pago", puede: reserva.solicitante === yo.id },
        lista: { desde: "pagada", puede: puede(yo.rol, "biblioteca:pedidos") },
        retirada: { desde: "lista", puede: puede(yo.rol, "biblioteca:pedidos") },
      };
      const paso = pasos[nuevo];
      exigir(paso, 400, "Estado no válido.");
      exigir(paso.puede, 403, "No tenés permiso para hacer esto.");
      exigir(reserva.estado === paso.desde, 400, "La reserva cambió de estado. Actualizá la página.");
      reserva.estado = nuevo;
      return json(publicoReserva(db, reserva));
    }
  }
  throw new Falla(404, "Eso ya no existe. Actualizá la página.");
}

/** Contenido de un archivo (para abrirlo o imprimirlo). */
async function contenidoArchivo(db: Db, yo: UsuarioDb, id: string) {
  const archivo = archivoVisible(db, yo, id);
  const blob = await leerContenido(id);
  exigir(blob, 404, "El contenido de este archivo se perdió al recargar la página (en el modo demo los archivos grandes no se guardan).");
  return new Response(blob, { status: 200, headers: { "Content-Type": archivo.tipo } });
}

/** Minutos que dura una sesión (como SESION_MINUTOS del backend). */
const MINUTOS_SESION = 60;

/** Token del modo demo: "demo:<id>:<vence en ms>". Vencido (o sin vencimiento, de antes) = sin sesión → 401. */
function usuarioDelToken(db: Db, token: string | null) {
  const [prefijo, id, vence] = token?.split(":") ?? [];
  if (prefijo !== "demo" || !id || !(Number(vence) > Date.now())) return null;
  return db.usuarios.find((u) => u.id === id) ?? null;
}

/** Punto de entrada: hace de `fetch(API + ruta)` para el modo demo. */
export async function responderDemo(ruta: string, init: RequestInit, token: string | null): Promise<Response> {
  // Una pequeña espera para que la interfaz se comporte como con un servidor real.
  await new Promise((r) => setTimeout(r, 80));
  const url = new URL(ruta, "http://demo.local");
  const partes = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const metodo = (init.method ?? "GET").toUpperCase();
  const db = leerDb();
  const yo = usuarioDelToken(db, token);
  try {
    if (metodo === "GET" && partes[0] === "biblioteca" && partes[1] === "archivos" && partes[3] === "contenido") {
      exigir(yo, 401, "Tu sesión terminó. Volvé a iniciar sesión.");
      return await contenidoArchivo(db, yo, partes[2]);
    }
    const respuesta = await atender({ metodo, partes, query: url.searchParams, cuerpo: leerCuerpo(init.body), yo, db });
    if (metodo !== "GET") guardarDb(db);
    return respuesta;
  } catch (error) {
    if (error instanceof Falla) return json({ message: error.message }, error.status);
    console.error(error);
    return json({ message: "El servidor tuvo un problema. Probá de nuevo." }, 500);
  }
}
