import type { Rol } from "@/lib/auth/permisos";

/** Mujer o varón: define si se muestra "madre"/"padre" o "hija"/"hijo". */
export type Sexo = "F" | "M";

/** Datos que pide el alta de un tutor y de cada hijo/a. */
export type DatosPersona = {
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  password: string;
  sexo: Sexo | "";
};

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  dni: string | null;
  /** Solo dígitos, con característica (ej. "3772412345"). */
  telefono?: string | null;
  sexo?: Sexo | null;
  /** Contraseña para ingresar. Solo le llega al administrador (la ve en Usuarios). */
  password?: string;
  /** La cuenta universal del superadministrador (sus datos están en el .env del backend: no se edita ni se borra). */
  esSuperadmin?: boolean;
  /** Para alumnos: el curso donde está anotado. */
  cursoId: string | null;
  /** Nombre del curso, ej. "3° Año A". */
  curso: string | null;
  /** Para alumnos: el padre/madre que puede ver su ficha. */
  padreId: string | null;
  creadoEn: string;
};

/** Profesor que da una materia en un curso. */
export type DocenteCurso = {
  id: string;
  cursoId: string;
  profesorId: string;
  profesorNombre: string;
  materia: string;
};

/** Curso de secundaria (1° a 6° Año) con su división. */
export type Curso = {
  id: string;
  anio: number;
  division: string;
  /** Ej. "3° Año A". */
  nombre: string;
  docentes: DocenteCurso[];
  creadoEn: string;
};

export type EstadoAsistencia = "presente" | "tarde" | "ausente";

/** Positivo o negativo que el profesor le pone a un alumno en su materia. */
export type TipoPunto = "positivo" | "negativo";

export type TipoSancion = "amonestaciones" | "apercibimientos";

/** Amonestaciones y apercibimientos de un alumno (los pone el preceptor). */
export type Sanciones = Record<TipoSancion, number>;

/** Asistencia y positivos/negativos de un alumno en una materia (lo que ven el alumno y su familia). */
export type AsistenciaMateria = {
  materia: string;
  presente: number;
  tarde: number;
  ausente: number;
  positivos: number;
  negativos: number;
  /** Día por día, del más nuevo al más viejo. */
  registros: { fecha: string; estado: EstadoAsistencia }[];
};

/** Totales de asistencia de una materia: los días tomados y, por alumno, cuántas veces quedó en cada estado. */
export type ResumenAsistencia = {
  dias: string[];
  alumnos: Record<string, Record<EstadoAsistencia, number>>;
};

/** Noticia del sitio. Las que no están publicadas solo las ve quien edita, en el panel. */
export type Noticia = {
  id: string;
  /** Dirección pública: /noticias/<slug>. */
  slug: string;
  titulo: string;
  categoria: string;
  resumen: string;
  /** Texto con párrafos separados por una línea en blanco. */
  contenido: string;
  /** "/images/…" (imagen del sitio) o el nombre de la imagen subida. Ver `urlImagen`. */
  imagen: string | null;
  publicadaEn: string | null;
  autorNombre: string | null;
};

/** Lo que ve el panel además: si está publicada y las fechas. */
export type NoticiaPanel = Noticia & { publicada: boolean; creadoEn: string; actualizadoEn: string };

/** Acto o actividad del calendario. `fecha` es solo el día: "2026-11-14". */
export type Evento = {
  id: string;
  titulo: string;
  fecha: string;
  horario: string | null;
  lugar: string | null;
  categoria: string;
  descripcion: string | null;
};

/**
 * - `biblioteca`: queda publicado para todos (lo suben profesores), permanente o hasta `expiraEn`.
 * - `impresion`: archivo personal solo para mandar a imprimir; lo ve quien lo subió y la bibliotecaria.
 */
export type Visibilidad = "biblioteca" | "impresion";

export type ArchivoBiblioteca = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  visibilidad: Visibilidad;
  /** Nombre original del archivo (para la extensión al descargar). */
  nombreOriginal: string;
  tipo: string;
  tamano: number;
  subidoPor: string;
  subidoPorNombre: string;
  expiraEn: string | null;
  creadoEn: string;
};

export type MetodoPago = "efectivo" | "mercadopago";

/* ---------- Asistencia del personal ---------- */

/** Presentes, tardanzas y faltas de un profesor o preceptor (lo ve y lo carga el administrador). */
export type AsistenciaPersonal = {
  personaId: string;
  nombre: string;
  email: string;
  rol: Rol;
  /** Para profesores: las materias que da. */
  materias: string[];
  presente: number;
  tarde: number;
  ausente: number;
  /** Lo marcado hoy, o `null` si todavía no se marcó. */
  hoy: EstadoAsistencia | null;
  /** Día por día, del más nuevo al más viejo. */
  registros: { fecha: string; estado: EstadoAsistencia }[];
};

/* ---------- Cuotas ---------- */

export type EstadoCuota = "pagada" | "pendiente" | "vencida";

/** Las cuotas se pagan por Mercado Pago o con cualquier tarjeta (en la versión final, las dos por el checkout de Mercado Pago). */
export type MetodoPagoCuota = "mercadopago" | "tarjeta";

/** Valor de la cuota y día del mes en que vence. Lo cambia el administrador y se aplica a todas las cuotas sin pagar. */
export type ConfigCuotas = { monto: number; diaVencimiento: number };

export type Cuota = {
  /** "2026-11" */
  mes: string;
  /** "2026-11-10" */
  vencimiento: string;
  monto: number;
  estado: EstadoCuota;
  pagadaEn: string | null;
  metodo: MetodoPagoCuota | null;
};

export type CuotasAlumno = {
  alumnoId: string;
  nombre: string;
  curso: string | null;
  tutorNombre: string | null;
  /** WhatsApp de la familia para los recordatorios de pago, solo dígitos (ej. "3772412345"). Lo carga el administrador. */
  telefono: string | null;
  /** Recordatorios de pago enviados por WhatsApp, del más nuevo al más viejo. */
  recordatorios: RecordatorioCuota[];
  /** Del mes más nuevo al más viejo. */
  cuotas: Cuota[];
};

/** Recordatorio de deuda que el administrador le mandó a la familia por WhatsApp. */
export type RecordatorioCuota = {
  id: string;
  enviadoEn: string;
  enviadoPorNombre: string;
  /** Meses vencidos que se reclamaron ("2026-09", "2026-10"…). */
  meses: string[];
  monto: number;
};

/** Aviso que le llega al administrador cuando un tutor paga una cuota. */
export type AvisoPagoCuota = {
  id: string;
  alumnoNombre: string;
  curso: string | null;
  tutorNombre: string;
  mes: string;
  monto: number;
  metodo: MetodoPagoCuota;
  pagadoEn: string;
  visto: boolean;
};

export type EstadoReserva = "pendiente_pago" | "pagada" | "lista" | "retirada" | "cancelada";

export type ReservaImpresion = {
  id: string;
  archivoId: string | null;
  archivoNombre: string;
  paginas: number;
  copias: number;
  color: boolean;
  dobleFaz: boolean;
  anillado: boolean;
  notas: string | null;
  total: number;
  estado: EstadoReserva;
  codigoRetiro: string;
  solicitante: string;
  solicitanteNombre: string;
  /** Curso de quien lo pidió (ej. "3° Año A"); `null` si no es alumno. Con nombre y curso se retira la impresión. */
  solicitanteCurso?: string | null;
  /** Cómo se pagó (se elige antes de pagar). En efectivo se paga al retirar en la biblioteca. */
  metodoPago?: MetodoPago | null;
  pagoId: string | null;
  creadoEn: string;
  pagadoEn: string | null;
};
