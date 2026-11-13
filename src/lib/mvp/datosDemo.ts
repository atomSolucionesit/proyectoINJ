/**
 * Datos de ejemplo del modo demo (NEXT_PUBLIC_MODO_DEMO=1): el panel y el sitio funcionan sin backend.
 * Este archivo no usa nada del navegador: lo importan también los Server Components del sitio.
 */

import type { Rol } from "@/lib/auth/permisos";

export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO === "1";

/** Contraseña de todas las cuentas (las nuevas también). La administradora la ve y la puede cambiar en Usuarios. */
export const PASSWORD_DEMO = "pasodeloslibres";

/** Nombre que tenía la cuenta del administrador antes de que se ingresara con el nombre completo. */
export const NOMBRE_ADMIN_ANTERIOR = "Administración";

export const cuentasEjemplo: { id: string; nombre: string; email: string; rol: Rol; dni: string; sexo: "F" | "M"; cursoAnio?: number; padreId?: string }[] = [
  { id: "u-admin", nombre: "Claudia Morales", email: "admin@escuela.com", dni: "28.456.789", rol: "admin", sexo: "F" },
  { id: "u-profesor", nombre: "Laura Gómez", email: "profesor@demo.com", dni: "30.112.233", rol: "profesor", sexo: "F" },
  { id: "u-profesor2", nombre: "Ricardo Sosa", email: "rsosa@demo.com", dni: "27.345.120", rol: "profesor", sexo: "M" },
  { id: "u-profesor3", nombre: "Graciela Benítez", email: "gbenitez@demo.com", dni: "25.678.901", rol: "profesor", sexo: "F" },
  { id: "u-profesor4", nombre: "Martín Aguirre", email: "maguirre@demo.com", dni: "31.234.567", rol: "profesor", sexo: "M" },
  { id: "u-profesor5", nombre: "Silvia Ramírez", email: "sramirez@demo.com", dni: "29.876.543", rol: "profesor", sexo: "F" },
  { id: "u-profesor6", nombre: "Pablo Medina", email: "pmedina@demo.com", dni: "32.109.876", rol: "profesor", sexo: "M" },
  { id: "u-profesor7", nombre: "Andrea Vega", email: "avega@demo.com", dni: "33.445.566", rol: "profesor", sexo: "F" },
  { id: "u-preceptor", nombre: "Jorge Romero", email: "preceptor@demo.com", dni: "26.789.012", rol: "preceptor", sexo: "M" },
  { id: "u-biblioteca", nombre: "Marta Díaz", email: "biblioteca@demo.com", dni: "24.567.890", rol: "bibliotecaria", sexo: "F" },
  { id: "u-padre", nombre: "Carlos Pérez", email: "padre@demo.com", dni: "27.890.123", rol: "padre", sexo: "M" },
  { id: "u-alumno", nombre: "Sofía Pérez", email: "alumno@demo.com", rol: "alumno", dni: "45.123.456", cursoAnio: 3, padreId: "u-padre", sexo: "F" },
  { id: "u-alumno2", nombre: "Mateo Fernández", email: "mfernandez@demo.com", rol: "alumno", dni: "45.234.567", cursoAnio: 3, sexo: "M" },
  { id: "u-alumno3", nombre: "Valentina Ruiz", email: "vruiz@demo.com", rol: "alumno", dni: "45.345.678", cursoAnio: 3, sexo: "F" },
  { id: "u-alumno4", nombre: "Tomás Acosta", email: "tacosta@demo.com", rol: "alumno", dni: "46.111.222", cursoAnio: 1, sexo: "M" },
];

/** Materias de ejemplo: [año del curso, materia, id del profesor]. */
export const materiasEjemplo: [number, string, string][] = [
  [3, "Matemática", "u-profesor"],
  [3, "Lengua", "u-profesor2"],
  [1, "Matemática", "u-profesor"],
  [3, "Historia", "u-profesor3"],
  [1, "Historia", "u-profesor3"],
  [3, "Física", "u-profesor4"],
  [5, "Física", "u-profesor4"],
  [3, "Ecología", "u-profesor5"],
  [2, "Ecología", "u-profesor5"],
  [3, "Inglés", "u-profesor6"],
  [1, "Inglés", "u-profesor6"],
  [3, "Educación Física", "u-profesor7"],
  [2, "Educación Física", "u-profesor7"],
];

export const noticiasEjemplo = [
  {
    slug: "admisiones-2026",
    titulo: "Apertura del Período de Inscripciones Ciclo Lectivo 2026",
    publicadaEn: "2026-11-03",
    categoria: "Institucional",
    imagen: "/images/hero-edificio.jpg",
    resumen:
      "Informamos a la comunidad de Paso de los Libres y zonas aledañas que se encuentra formalmente abierto el período de postulación de vacantes para los niveles Inicial, Primario y Secundario.",
    contenido:
      "Informamos a la comunidad de Paso de los Libres y zonas aledañas que se encuentra formalmente abierto el período de postulación de vacantes para los niveles Inicial, Primario y Secundario.\n\nLas familias interesadas pueden acercarse a secretaría o completar el formulario de la sección Admisiones para recibir información sobre requisitos, entrevistas y aranceles.",
  },
  {
    slug: "feria-ciencias-robotica",
    titulo: "Destacada Participación en la Feria de Ciencias y Tecnología",
    publicadaEn: "2026-10-28",
    categoria: "Académico",
    imagen: "/images/hero-ciencia.jpg",
    resumen:
      "Nuestros estudiantes presentaron proyectos innovadores de robótica, energías renovables y cuidado del medio ambiente, recibiendo menciones especiales del jurado zonal.",
    contenido:
      "Nuestros estudiantes presentaron proyectos innovadores de robótica, energías renovables y cuidado del medio ambiente, recibiendo menciones especiales del jurado zonal.\n\nFelicitamos a los alumnos y a los docentes que acompañaron cada proyecto durante el año.",
  },
  {
    slug: "jornada-deportiva-familiar",
    titulo: "Gran Jornada Recreativa y Deportiva con las Familias",
    publicadaEn: "2026-10-19",
    categoria: "Comunidad",
    imagen: "/images/hero-deportes.jpg",
    resumen:
      "Con una masiva concurrencia en nuestro predio deportivo, compartimos un sábado de competencias amistosas, mateada, juegos cooperativos y entrega de distinciones al compañerismo.",
    contenido:
      "Con una masiva concurrencia en nuestro predio deportivo, compartimos un sábado de competencias amistosas, mateada, juegos cooperativos y entrega de distinciones al compañerismo.\n\nGracias a todas las familias que se sumaron.",
  },
  {
    slug: "nuevos-espacios-lectura",
    titulo: "Renovación y Ampliación de la Biblioteca y Sala Digital",
    publicadaEn: "2026-10-12",
    categoria: "Infraestructura",
    imagen: "/images/hero-1.jpg",
    resumen:
      "Se incorporaron nuevos títulos bibliográficos, computadoras conectadas y sectores de estudio grupal para enriquecer la experiencia de aprendizaje de todos los cursos.",
    contenido:
      "Se incorporaron nuevos títulos bibliográficos, computadoras conectadas y sectores de estudio grupal para enriquecer la experiencia de aprendizaje de todos los cursos.",
  },
  {
    slug: "talleres-arte-musica",
    titulo: "Muestra de Arte y Concierto del Ensamble Musical Escolar",
    publicadaEn: "2026-10-04",
    categoria: "Cultura",
    imagen: "/images/hero-aula.jpg",
    resumen:
      "Alumnos de Nivel Primario y Secundario deleitaron al público con interpretaciones de música instrumental y una galería de obras visuales creadas en clase.",
    contenido:
      "Alumnos de Nivel Primario y Secundario deleitaron al público con interpretaciones de música instrumental y una galería de obras visuales creadas en clase.",
  },
];

export const eventosEjemplo = [
  {
    titulo: "Feria Anual de Ciencias, Robótica y Arte",
    fecha: "2026-11-14",
    lugar: "Polideportivo y Salón de Usos Múltiples",
    horario: "09:00 a 16:00 hs",
    categoria: "Académico",
    descripcion:
      "Muestra multidisciplinaria donde los alumnos de Primaria y Secundaria exponen proyectos de investigación, robótica y expresiones plásticas.",
  },
  {
    titulo: "Torneo Intercolegial de Vóley y Básquet",
    fecha: "2026-11-21",
    lugar: "Campo de Deportes del Instituto",
    horario: "14:30 hs",
    categoria: "Deportes",
    descripcion:
      "Jornada deportiva que convoca a instituciones educativas de la zona para promover la sana competencia, el compañerismo y la actividad física.",
  },
  {
    titulo: "Acto de Egresados y Colación de Grado",
    fecha: "2026-12-05",
    lugar: "Patio Central Institucional",
    horario: "19:30 hs",
    categoria: "Institucional",
    descripcion: "Ceremonia oficial de entrega de diplomas y reconocimientos a las promociones de Nivel Inicial, Primario y Secundario.",
  },
  {
    titulo: "Misa de Acción de Gracias y Pesebre Viviente",
    fecha: "2026-12-12",
    lugar: "Parroquia y Comunidad Educativa",
    horario: "18:00 hs",
    categoria: "Pastoral",
    descripcion:
      "Encuentro de la comunidad escolar y las familias para dar gracias por el ciclo compartido y celebrar el advenimiento de la Navidad.",
  },
];

/** Noticias de ejemplo como las devuelve la API pública (para el sitio en modo demo). */
export const noticiasPublicasEjemplo = noticiasEjemplo.map((n, i) => ({
  ...n,
  id: `n-${i + 1}`,
  publicadaEn: `${n.publicadaEn}T12:00:00.000Z`,
  autorNombre: "Administración",
}));

export const eventosPublicosEjemplo = eventosEjemplo.map((e, i) => ({ ...e, id: `e-${i + 1}` }));

/* ---------- Notas del mes ---------- */

export const materiasNotas = ["Lengua", "Matemática", "Ecología", "Física"] as const;
export type MateriaNotas = (typeof materiasNotas)[number];

/** Las tres notas de cada materia, en este orden. */
export const tiposNota = ["Conceptuales", "Actitudinales", "Procedimentales"] as const;

/** Notas de ejemplo por alumno (id): [conceptuales, actitudinales, procedimentales], de 1 a 10. */
export const notasEjemplo: Record<string, Record<MateriaNotas, [number, number, number]>> = {
  "u-alumno": { Lengua: [8, 9, 7], Matemática: [7, 8, 6], Ecología: [9, 10, 9], Física: [6, 7, 5] },
  "u-alumno2": { Lengua: [6, 7, 6], Matemática: [9, 8, 9], Ecología: [7, 8, 7], Física: [8, 7, 8] },
  "u-alumno3": { Lengua: [10, 9, 10], Matemática: [8, 9, 8], Ecología: [8, 8, 9], Física: [7, 9, 8] },
  "u-alumno4": { Lengua: [5, 7, 6], Matemática: [6, 6, 7], Ecología: [7, 8, 8], Física: [6, 7, 6] },
};
