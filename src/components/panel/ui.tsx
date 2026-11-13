import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icono, type NombreIcono } from "./Icono";

type Accion = { titulo: string; href: string };

/** Encabezado de cada sección del panel, con acción principal opcional. */
export function EncabezadoPagina({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  accion?: Accion;
  /** Acciones personalizadas (por ejemplo, envueltas en <Permitido>). */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500 sm:text-base">{descripcion}</p>}
      </div>
      {accion && <BotonAccion {...accion} />}
      {children}
    </div>
  );
}

/** Botón azul principal de una sección (ej: "Nueva noticia"). */
export function BotonAccion({ titulo, href, icono = "agregar" }: Accion & { icono?: NombreIcono }) {
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] sm:w-auto sm:py-2.5"
    >
      <Icono nombre={icono} className="h-4 w-4" />
      {titulo}
    </Link>
  );
}

/** Tarjeta blanca base del panel. */
export function Tarjeta({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-xs", className)}>{children}</div>;
}

/** Mensaje para secciones que todavía no tienen datos. */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  accion?: Accion;
}) {
  return (
    <Tarjeta className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
        <Icono nombre={icono} className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">{titulo}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{descripcion}</p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100"
        >
          <Icono nombre="agregar" className="h-4 w-4" />
          {accion.titulo}
        </Link>
      )}
    </Tarjeta>
  );
}
