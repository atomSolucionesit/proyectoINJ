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

/** Menú lateral del panel de control. */
export const navegacionPanel: ItemNavegacion[] = [
  { titulo: "Resumen", href: "/panel" },
  { titulo: "Noticias", href: "/panel/noticias" },
  { titulo: "Eventos", href: "/panel/eventos" },
  { titulo: "Alumnos", href: "/panel/alumnos" },
  { titulo: "Docentes", href: "/panel/docentes" },
  { titulo: "Cursos", href: "/panel/cursos" },
  { titulo: "Mensajes", href: "/panel/mensajes" },
  { titulo: "Usuarios", href: "/panel/usuarios" },
  { titulo: "Configuración", href: "/panel/configuracion" },
];
