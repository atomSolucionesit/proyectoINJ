import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomInt, randomUUID } from "node:crypto";
import type { ArchivoBiblioteca, EstadoReserva, Prisma, ReservaImpresion } from "../generated/prisma/client";
import { bibliotecaConfig, calcularTotal, errorTipoArchivo, tipoDeArchivo } from "../compartido/biblioteca";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { ArchivosEnDisco } from "./archivos-en-disco";
import { nombreCurso } from "../cursos/nombre-curso";

const DIA = 24 * 60 * 60 * 1000;
const enDias = (dias: number) => new Date(Date.now() + dias * DIA);
const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

const conSubidoPor = { subidoPor: { select: { nombre: true } } } satisfies Prisma.ArchivoBibliotecaInclude;
const conSolicitante = { solicitante: { select: { nombre: true, curso: true } } } satisfies Prisma.ReservaImpresionInclude;

/** Mismo formato que usa el frontend (ArchivoBiblioteca en src/lib/mvp/tipos.ts). */
function publicoArchivo({ subidoPorId, subidoPor, ...archivo }: ArchivoBiblioteca & { subidoPor: { nombre: string } }) {
  return { ...archivo, subidoPor: subidoPorId, subidoPorNombre: subidoPor.nombre };
}

/** Con el nombre y el curso de quien lo pidió: con eso se retira la impresión. */
function publicoReserva({
  solicitanteId,
  solicitante,
  ...reserva
}: ReservaImpresion & { solicitante: { nombre: string; curso: { anio: number; division: string } | null } }) {
  return {
    ...reserva,
    solicitante: solicitanteId,
    solicitanteNombre: solicitante.nombre,
    solicitanteCurso: solicitante.curso ? nombreCurso(solicitante.curso) : null,
  };
}

/** Código corto para mostrar en el mostrador, sin letras confusas (0/O, 1/I). */
function generarCodigoRetiro() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "BIB-" + Array.from({ length: 6 }, () => alfabeto[randomInt(alfabeto.length)]).join("");
}

const vencido = (archivo: ArchivoBiblioteca) => archivo.expiraEn !== null && archivo.expiraEn <= new Date();

/** Transiciones de estado permitidas. */
const transiciones: Partial<Record<EstadoReserva, EstadoReserva[]>> = {
  pendiente_pago: ["cancelada"],
  pagada: ["lista"],
  lista: ["retirada"],
};

export type DatosArchivo = { nombre?: unknown; descripcion?: unknown; categoria?: unknown; destino?: unknown; duracion?: unknown };
export type DatosReserva = {
  archivoId?: unknown;
  paginas?: unknown;
  copias?: unknown;
  color?: unknown;
  dobleFaz?: unknown;
  anillado?: unknown;
  notas?: unknown;
};

@Injectable()
export class BibliotecaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BibliotecaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly disco: ArchivosEnDisco,
  ) {}

  /* ---------- Permisos ---------- */

  /** Puede abrir / mandar a imprimir el archivo. */
  private puedeVerArchivo(yo: UsuarioSesion, archivo: ArchivoBiblioteca) {
    if (archivo.subidoPorId === yo.id) return true;
    // La bibliotecaria necesita abrir cualquier archivo para imprimir los pedidos.
    if (puede(yo.rol, "biblioteca:pedidos") || puede(yo.rol, "biblioteca:gestionar-archivos")) return true;
    return archivo.visibilidad === "biblioteca" && !vencido(archivo);
  }

  private async archivoVisible(yo: UsuarioSesion, id: string) {
    const archivo = id ? await this.prisma.archivoBiblioteca.findUnique({ where: { id } }) : null;
    if (!archivo || !this.puedeVerArchivo(yo, archivo)) throw new NotFoundException("El archivo ya no existe.");
    return archivo;
  }

  /* ---------- Archivos ---------- */

  async listarArchivos(yo: UsuarioSesion) {
    const veTodo = puede(yo.rol, "biblioteca:pedidos") || puede(yo.rol, "biblioteca:gestionar-archivos");
    const archivos = await this.prisma.archivoBiblioteca.findMany({
      where: veTodo
        ? undefined
        : { OR: [{ subidoPorId: yo.id }, { visibilidad: "biblioteca", OR: [{ expiraEn: null }, { expiraEn: { gt: new Date() } }] }] },
      include: conSubidoPor,
      orderBy: { creadoEn: "desc" },
    });
    return archivos.map(publicoArchivo);
  }

  async subirArchivo(yo: UsuarioSesion, archivo: Express.Multer.File | undefined, datos: DatosArchivo) {
    if (!archivo) throw new BadRequestException("Elegí un archivo.");
    if (archivo.size === 0) throw new BadRequestException("El archivo está vacío.");
    const nombre = texto(datos.nombre).slice(0, 200);
    if (!nombre) throw new BadRequestException("Poné un nombre para el archivo.");
    // multer entrega el nombre en latin1; se pasa a UTF-8 para no romper tildes y eñes.
    const nombreOriginal = Buffer.from(archivo.originalname, "latin1").toString("utf8").slice(0, 255);
    const tipo = tipoDeArchivo(nombreOriginal, archivo.mimetype);
    if (!tipo) throw new BadRequestException(errorTipoArchivo(nombreOriginal));

    // Alumnos, padres y bibliotecaria solo pueden subir para imprimir: nunca queda publicado.
    const publica = datos.destino === "biblioteca" && puede(yo.rol, "biblioteca:publicar");
    let expiraEn: Date | null = enDias(bibliotecaConfig.diasArchivoImpresion);
    if (publica) {
      const opcion = bibliotecaConfig.duraciones.find((d) => String(d.dias ?? "") === texto(datos.duracion));
      if (!opcion) throw new BadRequestException("Elegí por cuánto tiempo queda publicado.");
      expiraEn = opcion.dias === null ? null : enDias(opcion.dias);
    }

    const id = randomUUID();
    await this.disco.guardar(id, archivo.buffer);
    try {
      const creado = await this.prisma.archivoBiblioteca.create({
        data: {
          id,
          nombre,
          descripcion: publica ? texto(datos.descripcion).slice(0, 1000) || null : null,
          categoria: bibliotecaConfig.categorias.some((c) => c.id === datos.categoria) ? String(datos.categoria) : "otros",
          visibilidad: publica ? "biblioteca" : "impresion",
          nombreOriginal,
          tipo,
          tamano: archivo.size,
          subidoPorId: yo.id,
          expiraEn,
        },
        include: conSubidoPor,
      });
      return publicoArchivo(creado);
    } catch (error) {
      await this.disco.borrar(id);
      throw error;
    }
  }

  async contenidoArchivo(yo: UsuarioSesion, id: string) {
    const archivo = await this.archivoVisible(yo, id);
    return { archivo, contenido: this.disco.leer(archivo.id) };
  }

  async eliminarArchivo(yo: UsuarioSesion, id: string) {
    const archivo = await this.prisma.archivoBiblioteca.findUnique({ where: { id } });
    if (!archivo) throw new NotFoundException("El archivo ya no existe.");
    if (archivo.subidoPorId !== yo.id && !puede(yo.rol, "biblioteca:gestionar-archivos")) {
      throw new ForbiddenException("No podés borrar este archivo.");
    }
    await this.prisma.archivoBiblioteca.delete({ where: { id } });
    await this.disco.borrar(id);
  }

  /** Borra los archivos vencidos que no tengan un pedido pagado esperando ser impreso o retirado. Corre cada hora. */
  @Cron(CronExpression.EVERY_HOUR)
  async borrarVencidos() {
    const vencidos = await this.prisma.archivoBiblioteca.findMany({
      where: { expiraEn: { lte: new Date() }, reservas: { none: { estado: { in: ["pagada", "lista"] } } } },
      select: { id: true },
    });
    for (const { id } of vencidos) {
      await this.prisma.archivoBiblioteca.delete({ where: { id } });
      await this.disco.borrar(id);
    }
    if (vencidos.length > 0) this.logger.log(`Se borraron ${vencidos.length} archivos vencidos.`);
  }

  /** También al arrancar, sin esperar: si MySQL tarda en responder, el servidor igual levanta. */
  onApplicationBootstrap() {
    this.borrarVencidos().catch((error: unknown) => this.logger.error("No se pudieron borrar los archivos vencidos", error));
  }

  /* ---------- Reservas ---------- */

  /** Cada uno ve los suyos; la bibliotecaria además ve los pedidos ya pagados (nunca los sin pagar). */
  async listarReservas(yo: UsuarioSesion) {
    const reservas = await this.prisma.reservaImpresion.findMany({
      where: puede(yo.rol, "biblioteca:pedidos")
        ? { OR: [{ solicitanteId: yo.id }, { estado: { in: ["pagada", "lista", "retirada"] } }] }
        : { solicitanteId: yo.id },
      include: conSolicitante,
      orderBy: { creadoEn: "desc" },
    });
    return reservas.map(publicoReserva);
  }

  async reservar(yo: UsuarioSesion, datos: DatosReserva) {
    const archivo = await this.archivoVisible(yo, texto(datos.archivoId));
    const paginas = Number(datos.paginas);
    const copias = Number(datos.copias);
    if (!Number.isInteger(paginas) || paginas < 1 || paginas > 2000) throw new BadRequestException("Indicá cuántas carillas tiene (entre 1 y 2000).");
    if (!Number.isInteger(copias) || copias < 1 || copias > 100) throw new BadRequestException("Indicá la cantidad de copias (entre 1 y 100).");
    // Color y anillado ya no se ofrecen: siempre blanco y negro, sin anillar.
    const opciones = { paginas, copias, color: false, anillado: false };

    const reserva = await this.prisma.reservaImpresion.create({
      data: {
        archivoId: archivo.id,
        archivoNombre: archivo.nombre,
        ...opciones,
        dobleFaz: datos.dobleFaz === true,
        notas: texto(datos.notas).slice(0, 500) || null,
        // El total siempre se calcula acá: no se confía en el que muestra el navegador.
        total: calcularTotal(opciones),
        codigoRetiro: generarCodigoRetiro(),
        solicitanteId: yo.id,
      },
      include: conSolicitante,
    });
    return publicoReserva(reserva);
  }

  /**
   * Efectivo: se paga al retirar en la biblioteca. Mercado Pago: pago simulado
   * (cuando se integre, esto lo hace el webhook al acreditarse el pago).
   */
  async pagar(yo: UsuarioSesion, id: string, metodo: unknown) {
    const reserva = await this.prisma.reservaImpresion.findUnique({ where: { id } });
    if (!reserva || reserva.solicitanteId !== yo.id) throw new NotFoundException("Esa reserva ya no existe.");
    if (reserva.estado !== "pendiente_pago") throw new BadRequestException("Esta reserva ya no se puede pagar.");
    const metodoPago = (["efectivo", "mercadopago"] as const).find((m) => m === metodo);
    if (!metodoPago) throw new BadRequestException("Elegí cómo vas a pagar: efectivo o Mercado Pago.");
    const pagada = await this.prisma.reservaImpresion.update({
      where: { id },
      data: { estado: "pagada", pagoId: `${metodoPago}-${randomUUID()}`, pagadoEn: new Date(), metodoPago },
      include: conSolicitante,
    });
    return publicoReserva(pagada);
  }

  /**
   * - Cancelar: solo quien hizo el pedido, mientras no esté pagado.
   * - Lista / retirada: solo la bibliotecaria (permiso "biblioteca:pedidos").
   */
  async cambiarEstado(yo: UsuarioSesion, id: string, nuevo: unknown) {
    const reserva = await this.prisma.reservaImpresion.findUnique({ where: { id } });
    const visible =
      reserva && (reserva.solicitanteId === yo.id || (puede(yo.rol, "biblioteca:pedidos") && reserva.estado !== "pendiente_pago"));
    if (!reserva || !visible) throw new NotFoundException("Reserva no encontrada.");

    const destino = transiciones[reserva.estado]?.find((e) => e === nuevo);
    if (!destino) throw new BadRequestException("Ese cambio de estado no está permitido.");
    const autorizado = destino === "cancelada" ? reserva.solicitanteId === yo.id : puede(yo.rol, "biblioteca:pedidos");
    if (!autorizado) throw new ForbiddenException("No podés hacer ese cambio.");

    const actualizada = await this.prisma.reservaImpresion.update({ where: { id }, data: { estado: destino }, include: conSolicitante });
    return publicoReserva(actualizada);
  }
}
