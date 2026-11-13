"use client";

import { BotonAccion, EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono, type NombreIcono } from "@/components/panel/Icono";
import { TarjetaArchivo } from "@/components/panel/biblioteca/TarjetaArchivo";
import { FilaReserva } from "@/components/panel/biblioteca/FilaReserva";
import { bibliotecaConfig } from "@/config/biblioteca";
import { puede } from "@/lib/auth/permisos";
import { useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { ArchivoBiblioteca, ReservaImpresion } from "@/lib/mvp/tipos";

const pasos: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "subir", titulo: "Subí el archivo", texto: "O elegí uno de la biblioteca." },
  { icono: "pago", titulo: "Reservá y pagá", texto: "Elegí copias y color, y pagá online." },
  { icono: "biblioteca", titulo: "Retiralo", texto: "Retiralo en la biblioteca diciendo tu nombre y curso." },
];

const vigente = (a: ArchivoBiblioteca) => a.expiraEn === null || new Date(a.expiraEn) > new Date();
const masNuevoPrimero = (a: { creadoEn: string }, b: { creadoEn: string }) => b.creadoEn.localeCompare(a.creadoEn);

/** Orden de mis pedidos: primero lo que requiere acción (pagar, retirar). */
const ordenMios: Record<ReservaImpresion["estado"], number> = { pendiente_pago: 0, lista: 1, pagada: 2, retirada: 3, cancelada: 3 };
/** Orden de la bibliotecaria: primero lo que hay que imprimir, del pago más viejo al más nuevo. */
const ordenPedidos: Record<ReservaImpresion["estado"], number> = { pagada: 0, lista: 1, retirada: 2, pendiente_pago: 3, cancelada: 3 };

export function Biblioteca() {
  const yo = useUsuario();
  const { archivos: todos, reservas } = useAlmacen();
  const publica = puede(yo.rol, "biblioteca:publicar");
  const recibePedidos = puede(yo.rol, "biblioteca:pedidos");

  const archivos = todos.filter((a) => a.visibilidad === "biblioteca" && vigente(a)).sort(masNuevoPrimero);
  const propios = todos.filter((a) => a.visibilidad === "impresion" && a.subidoPor === yo.id && vigente(a)).sort(masNuevoPrimero);

  const mias = reservas
    .filter((r) => r.solicitante === yo.id)
    .sort((a, b) => ordenMios[a.estado] - ordenMios[b.estado] || masNuevoPrimero(a, b));
  const misActivas = mias.filter((r) => r.estado !== "retirada" && r.estado !== "cancelada");
  const miHistorial = mias.filter((r) => !misActivas.includes(r));

  // La bibliotecaria solo recibe pedidos ya pagados.
  const pedidos = recibePedidos
    ? reservas
        .filter((r) => r.estado === "pagada" || r.estado === "lista" || r.estado === "retirada")
        .sort((a, b) => ordenPedidos[a.estado] - ordenPedidos[b.estado] || (a.pagadoEn ?? "").localeCompare(b.pagadoEn ?? ""))
    : [];
  const pedidosPendientes = pedidos.filter((r) => r.estado !== "retirada");
  const pedidosEntregados = pedidos.filter((r) => r.estado === "retirada");

  return (
    <>
      <EncabezadoPagina
        titulo="Biblioteca"
        descripcion={
          publica ? "Publicá material para tus cursos y reservá impresiones." : "Consultá el material y reservá impresiones para retirar."
        }
      >
        <BotonAccion titulo={publica ? "Subir archivo" : "Imprimir un archivo"} href="/panel/biblioteca/subir" icono={publica ? "subir" : "imprimir"} />
      </EncabezadoPagina>

      {/* Bibliotecaria: pedidos ya pagados para imprimir y entregar */}
      {recibePedidos && (
        <div id="pedidos" className="scroll-mt-24">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            Pedidos para imprimir
            {pedidosPendientes.length > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs text-blue-950">{pedidosPendientes.length}</span>
            )}
          </h2>
          {pedidosPendientes.length > 0 ? (
            <Tarjeta className="divide-y divide-slate-100 overflow-hidden border-amber-200 ring-1 ring-amber-100">
              {pedidosPendientes.map((reserva) => (
                <FilaReserva key={reserva.id} reserva={reserva} pedido />
              ))}
            </Tarjeta>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              No hay pedidos pagados pendientes. Los pedidos aparecen acá recién cuando se pagan.
            </p>
          )}
          <Historial titulo="Entregados" reservas={pedidosEntregados} pedido />
        </div>
      )}

      {!recibePedidos && (
        <ol className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {pasos.map((paso, i) => (
            <li key={paso.titulo} className="flex min-w-[78%] snap-start items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-amber-300">
                <Icono nombre={paso.icono} />
              </span>
              <div>
                <p className="text-sm font-bold text-blue-950">
                  {i + 1}. {paso.titulo}
                </p>
                <p className="mt-0.5 text-xs text-blue-900/70">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Mis pedidos */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Mis impresiones {misActivas.length > 0 && <span className="text-blue-800">({misActivas.length})</span>}
        </h2>
        {misActivas.length > 0 ? (
          <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
            {misActivas.map((reserva) => (
              <FilaReserva key={reserva.id} reserva={reserva} />
            ))}
          </Tarjeta>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No tenés impresiones en curso. Tocá <strong>Imprimir</strong> en un archivo para reservar una.
          </p>
        )}
        <Historial titulo="Historial" reservas={miHistorial} />
      </div>

      {/* Archivos personales para imprimir */}
      {propios.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Mis archivos para imprimir</h2>
          <p className="mb-3 mt-1 text-xs text-slate-500">
            Solo los ves vos y la biblioteca. Se borran solos a los {bibliotecaConfig.diasArchivoImpresion} días.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {propios.map((archivo) => (
              <TarjetaArchivo key={archivo.id} archivo={archivo} />
            ))}
          </div>
        </div>
      )}

      {/* Material publicado por profesores */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Material de la biblioteca ({archivos.length})</h2>
        {archivos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {archivos.map((archivo) => (
              <TarjetaArchivo key={archivo.id} archivo={archivo} />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono="biblioteca"
            titulo="Todavía no hay material publicado"
            descripcion={
              publica ? "Subí apuntes, libros o guías para que los alumnos los tengan a mano." : "Cuando los profesores publiquen material lo vas a ver acá."
            }
            accion={publica ? { titulo: "Subir archivo", href: "/panel/biblioteca/subir" } : undefined}
          />
        )}
      </div>
    </>
  );
}

function Historial({ titulo, reservas, pedido }: { titulo: string; reservas: ReservaImpresion[]; pedido?: boolean }) {
  if (reservas.length === 0) return null;
  return (
    <details className="group mt-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-500">
        <Icono nombre="flecha" className="h-4 w-4 transition-transform group-open:rotate-90" />
        {titulo} ({reservas.length})
      </summary>
      <Tarjeta className="mt-3 divide-y divide-slate-100 overflow-hidden">
        {reservas.map((reserva) => (
          <FilaReserva key={reserva.id} reserva={reserva} pedido={pedido} />
        ))}
      </Tarjeta>
    </details>
  );
}
