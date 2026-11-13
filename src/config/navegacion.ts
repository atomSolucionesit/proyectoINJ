import type { NombreIcono } from "@/components/panel/Icono";
import { puede, type Permiso, type Rol } from "@/lib/auth/permisos";

export type ItemNavegacion = {
  titulo: string;
  href: string;
};

/** Menú de la página principal (pública). */
export const navegacionSitio: ItemNavegacion[] = [
  { titulo: "Inicio", href: "/" },
  { titulo: "Institucional", href: "/institucional" },
  { titulo: "Niveles", href: "/niveles" },
  { titulo: "Noticias", href: "/noticias" },
  { titulo: "Eventos", href: "/eventos" },
  { titulo: "Admisiones", href: "/admisiones" },
  { titulo: "Contacto", href: "/contacto" },
];

export type ItemNavegacionPanel = ItemNavegacion & {
  icono: NombreIcono;
  descripcion: string;
  /** Aparece en la barra inferior del celular (máximo 4). */
  principal?: boolean;
  /** Si se indica, solo lo ven los roles con este permiso. */
  permiso?: Permiso;
};

/** Menú del panel de control. */
export const navegacionPanel: ItemNavegacionPanel[] = [
  { titulo: "Resumen", href: "/panel", icono: "inicio", descripcion: "Vista general de la gestión.", principal: true },
  { titulo: "Noticias", href: "/panel/noticias", icono: "noticias", descripcion: "Publicá y editá las noticias del sitio.", principal: true, permiso: "noticias:editar" },
  { titulo: "Eventos", href: "/panel/eventos", icono: "eventos", descripcion: "Calendario de actos y actividades.", principal: true },
  { titulo: "Notas del mes", href: "/panel/notas", icono: "notas", descripcion: "Calificaciones del mes por materia.", permiso: "seccion:notas" },
  { titulo: "Asistencias", href: "/panel/asistencias", icono: "asistencia", descripcion: "Asistencia y positivos/negativos por materia.", permiso: "seccion:asistencias" },
  { titulo: "Amonestaciones", href: "/panel/amonestaciones", icono: "sancion", descripcion: "Amonestaciones y apercibimientos por curso.", permiso: "sanciones:editar" },
  { titulo: "Cuotas", href: "/panel/cuotas", icono: "pago", descripcion: "Cuotas mensuales: estado y pagos.", permiso: "seccion:cuotas" },
  { titulo: "Biblioteca", href: "/panel/biblioteca", icono: "biblioteca", descripcion: "Archivos e impresiones para retirar.", permiso: "seccion:biblioteca" },
  { titulo: "Alumnos", href: "/panel/alumnos", icono: "alumnos", descripcion: "Legajos y datos de los alumnos.", permiso: "seccion:alumnos" },
  { titulo: "Docentes", href: "/panel/docentes", icono: "docentes", descripcion: "Plantel docente, materias y asistencia.", permiso: "seccion:docentes" },
  { titulo: "Cursos", href: "/panel/cursos", icono: "cursos", descripcion: "Cursos, divisiones y niveles.", permiso: "seccion:cursos" },
  { titulo: "Usuarios", href: "/panel/usuarios", icono: "usuarios", descripcion: "Accesos al panel y sus roles.", permiso: "seccion:usuarios" },
  { titulo: "Configuración", href: "/panel/configuracion", icono: "configuracion", descripcion: "Datos generales del sitio.", permiso: "seccion:configuracion" },
];

/** Ítems del panel que puede ver un rol. */
export function navegacionParaRol(rol: Rol) {
  return navegacionPanel.filter((item) => !item.permiso || puede(rol, item.permiso));
}
