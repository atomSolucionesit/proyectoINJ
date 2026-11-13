import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Evento } from "../generated/prisma/client";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";

export type DatosEvento = { titulo?: unknown; fecha?: unknown; horario?: unknown; lugar?: unknown; categoria?: unknown; descripcion?: unknown };

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const comoTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** Fecha de hoy en Argentina ("2026-11-10"), sin importar la zona horaria del servidor. */
const hoyEnArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

/** La fecha viaja como "2026-11-14" (sin hora) para que no se corra un día por la zona horaria. */
const publicoEvento = ({ creadoPorId: _, creadoEn: __, ...evento }: Evento) => ({ ...evento, fecha: comoTexto(evento.fecha) });

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sitio público: desde hoy en adelante, el más cercano primero. */
  async proximos() {
    const eventos = await this.prisma.evento.findMany({
      where: { fecha: { gte: new Date(`${hoyEnArgentina()}T00:00:00.000Z`) } },
      orderBy: [{ fecha: "asc" }, { horario: "asc" }],
    });
    return eventos.map(publicoEvento);
  }

  /** Panel: todos (también los que ya pasaron). */
  async listar() {
    const eventos = await this.prisma.evento.findMany({ orderBy: [{ fecha: "asc" }, { horario: "asc" }] });
    return eventos.map(publicoEvento);
  }

  async crear(yo: UsuarioSesion, datos: DatosEvento) {
    this.controlar(yo);
    const evento = await this.prisma.evento.create({ data: { ...this.validar(datos), creadoPorId: yo.id } });
    return publicoEvento(evento);
  }

  async editar(yo: UsuarioSesion, id: string, datos: DatosEvento) {
    this.controlar(yo);
    const campos = this.validar(datos);
    await this.buscar(id);
    return publicoEvento(await this.prisma.evento.update({ where: { id }, data: campos }));
  }

  async eliminar(yo: UsuarioSesion, id: string) {
    this.controlar(yo);
    await this.buscar(id);
    await this.prisma.evento.delete({ where: { id } });
  }

  private controlar(yo: UsuarioSesion) {
    if (!puede(yo.rol, "eventos:editar")) throw new ForbiddenException("No tenés permiso para cargar eventos.");
  }

  private async buscar(id: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException("Ese evento ya no existe. Actualizá la página.");
    return evento;
  }

  private validar(datos: DatosEvento) {
    const titulo = texto(datos.titulo);
    const fecha = texto(datos.fecha);
    const horario = texto(datos.horario);
    const lugar = texto(datos.lugar);
    const categoria = texto(datos.categoria);
    const descripcion = texto(datos.descripcion);
    if (titulo.length < 3) throw new BadRequestException("Escribí el nombre del evento.");
    if (titulo.length > 160) throw new BadRequestException("El nombre puede tener hasta 160 caracteres.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new BadRequestException("Elegí la fecha del evento.");
    if (horario.length > 40) throw new BadRequestException("El horario puede tener hasta 40 caracteres (ej: 19:30 hs).");
    if (lugar.length > 160) throw new BadRequestException("El lugar puede tener hasta 160 caracteres.");
    if (!categoria) throw new BadRequestException("Elegí una categoría.");
    if (categoria.length > 40) throw new BadRequestException("La categoría puede tener hasta 40 caracteres.");
    if (descripcion.length > 2000) throw new BadRequestException("La descripción puede tener hasta 2000 caracteres.");
    return {
      titulo,
      fecha: new Date(`${fecha}T00:00:00.000Z`),
      horario: horario || null,
      lugar: lugar || null,
      categoria,
      descripcion: descripcion || null,
    };
  }
}
