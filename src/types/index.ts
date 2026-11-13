export type { Rol } from "@/lib/auth/permisos";

export type Noticia = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen?: string;
  publicada: boolean;
  fecha: string;
};

export type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar?: string;
};
