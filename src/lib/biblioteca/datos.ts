import "server-only";
import { randomBytes } from "node:crypto";
import { consultar } from "@/lib/db";

/**
 * - `biblioteca`: queda publicado para todos (lo suben profesores), permanente o hasta `expira_en`.
 * - `impresion`: archivo personal solo para mandar a imprimir; lo ve quien lo subió y la bibliotecaria.
 */
export type Visibilidad = "biblioteca" | "impresion";

export type ArchivoBiblioteca = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  visibilidad: Visibilidad;
  pathname: string;
  url: string;
  tipo: string;
  tamano: number;
  subido_por: string;
  subido_por_nombre: string | null;
  expira_en: Date | string | null;
  creado_en: Date | string;
};

export type EstadoReserva = "pendiente_pago" | "pagada" | "lista" | "retirada" | "cancelada";

export type ReservaImpresion = {
  id: string;
  archivo_id: string | null;
  archivo_nombre: string;
  paginas: number;
  copias: number;
  color: boolean;
  doble_faz: boolean;
  anillado: boolean;
  notas: string | null;
  total: number;
  estado: EstadoReserva;
  codigo_retiro: string;
  solicitante: string;
  solicitante_nombre: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  creado_en: Date | string;
  pagado_en: Date | string | null;
};

// `tamano` es bigint en Postgres y llega como string.
const columnasArchivo = `id, nombre, descripcion, categoria, visibilidad, pathname, url, tipo, tamano::float8 as tamano,
  subido_por, subido_por_nombre, expira_en, creado_en`;
const vigente = "(expira_en is null or expira_en > now())";

/* ---------- Archivos ---------- */

/** Archivos publicados en la biblioteca que todavía no vencieron. */
export function listarArchivosBiblioteca() {
  return consultar<ArchivoBiblioteca>(
    `select ${columnasArchivo} from biblioteca_archivos where visibilidad = 'biblioteca' and ${vigente} order by creado_en desc`,
  );
}

/** Archivos personales "para imprimir" de un usuario. */
export function listarArchivosParaImprimir(usuarioId: string) {
  return consultar<ArchivoBiblioteca>(
    `select ${columnasArchivo} from biblioteca_archivos
     where visibilidad = 'impresion' and subido_por = $1 and ${vigente} order by creado_en desc`,
    [usuarioId],
  );
}

export async function obtenerArchivo(id: string) {
  if (!esUuid(id)) return null;
  const [archivo] = await consultar<ArchivoBiblioteca>(`select ${columnasArchivo} from biblioteca_archivos where id = $1`, [id]);
  return archivo ?? null;
}

export async function crearArchivo(
  datos: Omit<ArchivoBiblioteca, "id" | "creado_en" | "expira_en"> & { diasDeVida: number | null },
) {
  const [archivo] = await consultar<{ id: string }>(
    `insert into biblioteca_archivos
       (nombre, descripcion, categoria, visibilidad, pathname, url, tipo, tamano, subido_por, subido_por_nombre, expira_en)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, case when $11::int is null then null else now() + make_interval(days => $11::int) end)
     returning id`,
    [
      datos.nombre,
      datos.descripcion,
      datos.categoria,
      datos.visibilidad,
      datos.pathname,
      datos.url,
      datos.tipo,
      datos.tamano,
      datos.subido_por,
      datos.subido_por_nombre,
      datos.diasDeVida,
    ],
  );
  return archivo.id;
}

export async function borrarArchivo(id: string) {
  await consultar(`delete from biblioteca_archivos where id = $1`, [id]);
}

/** Archivos vencidos que se pueden borrar: no tienen un pedido pagado esperando ser impreso o retirado. */
export function listarArchivosVencidos() {
  return consultar<Pick<ArchivoBiblioteca, "id" | "pathname">>(
    `select a.id, a.pathname from biblioteca_archivos a
     where a.expira_en is not null and a.expira_en <= now()
       and not exists (select 1 from biblioteca_reservas r where r.archivo_id = a.id and r.estado in ('pagada', 'lista'))
     limit 500`,
  );
}

/* ---------- Reservas ---------- */

/** Pedidos de un usuario (todos los estados). */
export function listarReservasDe(usuarioId: string) {
  return consultar<ReservaImpresion>(
    `select * from biblioteca_reservas where solicitante = $1
     order by case estado when 'pendiente_pago' then 0 when 'lista' then 1 when 'pagada' then 2 else 3 end, creado_en desc
     limit 100`,
    [usuarioId],
  );
}

/** Pedidos que recibe la bibliotecaria: solo los que ya se pagaron. */
export function listarPedidosPagados() {
  return consultar<ReservaImpresion>(
    `select * from biblioteca_reservas where estado in ('pagada', 'lista', 'retirada')
     order by case estado when 'pagada' then 0 when 'lista' then 1 else 2 end, pagado_en asc
     limit 200`,
  );
}

export async function obtenerReserva(id: string) {
  if (!esUuid(id)) return null;
  const [reserva] = await consultar<ReservaImpresion>(`select * from biblioteca_reservas where id = $1`, [id]);
  return reserva ?? null;
}

export async function crearReserva(
  datos: Pick<
    ReservaImpresion,
    | "archivo_id"
    | "archivo_nombre"
    | "paginas"
    | "copias"
    | "color"
    | "doble_faz"
    | "anillado"
    | "notas"
    | "total"
    | "solicitante"
    | "solicitante_nombre"
  >,
) {
  const [reserva] = await consultar<{ id: string }>(
    `insert into biblioteca_reservas
       (archivo_id, archivo_nombre, paginas, copias, color, doble_faz, anillado, notas, total, solicitante, solicitante_nombre, codigo_retiro)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
    [
      datos.archivo_id,
      datos.archivo_nombre,
      datos.paginas,
      datos.copias,
      datos.color,
      datos.doble_faz,
      datos.anillado,
      datos.notas,
      datos.total,
      datos.solicitante,
      datos.solicitante_nombre,
      generarCodigoRetiro(),
    ],
  );
  return reserva.id;
}

export async function guardarPreferencia(id: string, preferenceId: string) {
  await consultar(`update biblioteca_reservas set mp_preference_id = $2 where id = $1`, [id, preferenceId]);
}

/** Marca la reserva como pagada. Solo cambia si seguía pendiente, así que es seguro llamarlo varias veces. */
export async function marcarPagada(id: string, paymentId: string) {
  await consultar(
    `update biblioteca_reservas set estado = 'pagada', mp_payment_id = $2, pagado_en = now()
     where id = $1 and estado = 'pendiente_pago'`,
    [id, paymentId],
  );
}

/** Transiciones de estado permitidas desde el panel. */
const transiciones: Partial<Record<EstadoReserva, EstadoReserva[]>> = {
  pendiente_pago: ["cancelada"],
  pagada: ["lista"],
  lista: ["retirada"],
};

export async function cambiarEstado(id: string, nuevo: EstadoReserva) {
  const desde = Object.entries(transiciones)
    .filter(([, hacia]) => hacia.includes(nuevo))
    .map(([estado]) => estado);
  await consultar(`update biblioteca_reservas set estado = $2 where id = $1 and estado = any($3)`, [id, nuevo, desde]);
}

/* ---------- Utilidades ---------- */

function esUuid(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

/** Código corto para mostrar en el mostrador, sin letras confusas (0/O, 1/I). */
function generarCodigoRetiro() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "BIB-" + Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}
