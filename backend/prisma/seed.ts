/**
 * DATOS DE DEMOSTRACIÓN. Correr con `npm run db:seed` (no en producción: ahí las cuentas las crea el superadministrador).
 * Crea los cursos de 1° a 6° Año (división A), las cuentas de prueba con sus materias y, si no hay, noticias y eventos.
 * Se ingresa con el nombre completo y la contraseña de PASSWORD_INICIAL (por defecto "pasodeloslibres").
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { PrismaClient, type Rol, type Sexo } from "../src/generated/prisma/client";
import { cifrarPassword, normalizarNombre, passwordInicial } from "../src/compartido/cuentas";

if (process.env.NODE_ENV === "production" && process.env.SEED_PERMITIR_PRODUCCION !== "1") {
  console.error("El seed carga cuentas de prueba: no se corre en producción (si de verdad querés, poné SEED_PERMITIR_PRODUCCION=1).");
  process.exit(1);
}

/** Las mismas cuentas de prueba que el modo demo del frontend (src/lib/mvp/datosDemo.ts). */
const cuentas: { clave: string; nombre: string; email: string; rol: Rol; dni: string; sexo: Sexo; curso?: number; padre?: string }[] = [
  { clave: "admin", nombre: "Claudia Morales", email: "admin@escuela.com", rol: "admin", dni: "28.456.789", sexo: "F" },
  { clave: "profesor", nombre: "Laura Gómez", email: "profesor@demo.com", rol: "profesor", dni: "30.112.233", sexo: "F" },
  { clave: "profesor2", nombre: "Ricardo Sosa", email: "rsosa@demo.com", rol: "profesor", dni: "27.345.120", sexo: "M" },
  { clave: "profesor3", nombre: "Graciela Benítez", email: "gbenitez@demo.com", rol: "profesor", dni: "25.678.901", sexo: "F" },
  { clave: "profesor4", nombre: "Martín Aguirre", email: "maguirre@demo.com", rol: "profesor", dni: "31.234.567", sexo: "M" },
  { clave: "profesor5", nombre: "Silvia Ramírez", email: "sramirez@demo.com", rol: "profesor", dni: "29.876.543", sexo: "F" },
  { clave: "profesor6", nombre: "Pablo Medina", email: "pmedina@demo.com", rol: "profesor", dni: "32.109.876", sexo: "M" },
  { clave: "profesor7", nombre: "Andrea Vega", email: "avega@demo.com", rol: "profesor", dni: "33.445.566", sexo: "F" },
  { clave: "preceptor", nombre: "Jorge Romero", email: "preceptor@demo.com", rol: "preceptor", dni: "26.789.012", sexo: "M" },
  { clave: "biblioteca", nombre: "Marta Díaz", email: "biblioteca@demo.com", rol: "bibliotecaria", dni: "24.567.890", sexo: "F" },
  { clave: "padre", nombre: "Carlos Pérez", email: "padre@demo.com", rol: "padre", dni: "27.890.123", sexo: "M" },
  { clave: "alumno", nombre: "Sofía Pérez", email: "alumno@demo.com", rol: "alumno", dni: "45.123.456", sexo: "F", curso: 3, padre: "padre" },
  { clave: "alumno2", nombre: "Mateo Fernández", email: "mfernandez@demo.com", rol: "alumno", dni: "45.234.567", sexo: "M", curso: 3 },
  { clave: "alumno3", nombre: "Valentina Ruiz", email: "vruiz@demo.com", rol: "alumno", dni: "45.345.678", sexo: "F", curso: 3 },
  { clave: "alumno4", nombre: "Tomás Acosta", email: "tacosta@demo.com", rol: "alumno", dni: "46.111.222", sexo: "M", curso: 1 },
];

/** [año del curso, materia, clave del profesor] */
const materias: [number, string, string][] = [
  [3, "Matemática", "profesor"],
  [3, "Lengua", "profesor2"],
  [1, "Matemática", "profesor"],
  [3, "Historia", "profesor3"],
  [1, "Historia", "profesor3"],
  [3, "Física", "profesor4"],
  [5, "Física", "profesor4"],
  [3, "Ecología", "profesor5"],
  [2, "Ecología", "profesor5"],
  [3, "Inglés", "profesor6"],
  [1, "Inglés", "profesor6"],
  [3, "Educación Física", "profesor7"],
  [2, "Educación Física", "profesor7"],
];

const noticias = [
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

const eventos = [
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

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });

async function main() {
  const cursos = new Map<number, string>();
  for (const anio of [1, 2, 3, 4, 5, 6]) {
    const curso = await prisma.curso.upsert({ where: { anio_division: { anio, division: "A" } }, update: {}, create: { anio, division: "A" } });
    cursos.set(anio, curso.id);
  }

  // Todas con la misma contraseña; el administrador la ve en Usuarios.
  const password = passwordInicial();
  const credenciales = { passwordHash: await bcrypt.hash(password, 10), passwordCifrada: cifrarPassword(password) };
  const ids = new Map<string, string>();
  for (const { clave, padre, curso, ...cuenta } of cuentas) {
    const datos = {
      ...cuenta,
      ...credenciales,
      nombreClave: normalizarNombre(cuenta.nombre),
      cursoId: curso ? cursos.get(curso) : null,
      padreId: padre ? ids.get(padre) : null,
    };
    const usuario = await prisma.usuario.upsert({ where: { email: cuenta.email }, update: datos, create: datos });
    ids.set(clave, usuario.id);
  }

  for (const [anio, materia, profesor] of materias) {
    const cursoId = cursos.get(anio)!;
    await prisma.docenteCurso.upsert({
      where: { cursoId_materia: { cursoId, materia } },
      update: {},
      create: { cursoId, materia, profesorId: ids.get(profesor)! },
    });
  }
  console.log(`${cuentas.length} cuentas y ${materias.length} materias de prueba listas.`);

  const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: "admin@escuela.com" } });
  if ((await prisma.noticia.count()) === 0) {
    await prisma.noticia.createMany({
      data: noticias.map((n) => ({ ...n, publicada: true, publicadaEn: new Date(`${n.publicadaEn}T12:00:00.000Z`), autorId: admin.id })),
    });
    console.log(`${noticias.length} noticias de ejemplo cargadas.`);
  }
  if ((await prisma.evento.count()) === 0) {
    await prisma.evento.createMany({ data: eventos.map((e) => ({ ...e, fecha: new Date(`${e.fecha}T00:00:00.000Z`), creadoPorId: admin.id })) });
    console.log(`${eventos.length} eventos de ejemplo cargados.`);
  }
  console.log(`Se ingresa con el nombre completo y la contraseña "${password}".`);
}

main().finally(() => prisma.$disconnect());
