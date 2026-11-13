import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Module, Put } from "@nestjs/common";
import type { EstadoAsistencia } from "../generated/prisma/client";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { comoTexto, hoyArgentina, leerFecha } from "../compartido/fechas";
import { puede } from "../compartido/permisos";
import { PrismaService } from "../prisma/prisma.service";

/** Roles del personal al que el administrador le toma asistencia. */
const ROLES_PERSONAL = ["profesor", "preceptor"] as const;
const estados: EstadoAsistencia[] = ["presente", "tarde", "ausente"];

/** Asistencia de profesores y preceptores: solo el administrador la ve y la carga. */
@Injectable()
export class PersonalService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(yo: UsuarioSesion) {
    this.soloAdmin(yo, "Solo la administración ve la asistencia del personal.");
    const hoy = hoyArgentina();
    const personas = await this.prisma.usuario.findMany({
      where: { rol: { in: [...ROLES_PERSONAL] } },
      include: { materias: { select: { materia: true } }, asistenciaPersonal: { orderBy: { fecha: "desc" } } },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    });
    const personal = personas.map((u) => {
      const registros = u.asistenciaPersonal.map((r) => ({ fecha: comoTexto(r.fecha), estado: r.estado }));
      const cuenta = (e: EstadoAsistencia) => registros.filter((r) => r.estado === e).length;
      return {
        personaId: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        materias: [...new Set(u.materias.map((m) => m.materia))].sort((a, b) => a.localeCompare(b)),
        presente: cuenta("presente"),
        tarde: cuenta("tarde"),
        ausente: cuenta("ausente"),
        hoy: registros.find((r) => r.fecha === hoy)?.estado ?? null,
        registros,
      };
    });
    return { fecha: hoy, personal };
  }

  /** { personaId, fecha: "2026-11-13", estado } — si ya estaba marcado ese día, lo corrige. */
  async marcar(yo: UsuarioSesion, datos: { personaId?: unknown; fecha?: unknown; estado?: unknown }) {
    this.soloAdmin(yo, "Solo la administración toma asistencia del personal.");
    const fecha = leerFecha(datos.fecha);
    const personaId = typeof datos.personaId === "string" ? datos.personaId : "";
    const persona = await this.prisma.usuario.findFirst({ where: { id: personaId, rol: { in: [...ROLES_PERSONAL] } } });
    if (!persona) throw new BadRequestException("Esa persona ya no está en el personal. Actualizá la página.");
    const estado = estados.find((e) => e === datos.estado);
    if (!estado) throw new BadRequestException("Marcá presente, tarde o ausente.");
    await this.prisma.asistenciaPersonal.upsert({
      where: { personaId_fecha: { personaId, fecha } },
      update: { estado },
      create: { personaId, fecha, estado },
    });
    return { personaId, fecha: comoTexto(fecha), estado };
  }

  private soloAdmin(yo: UsuarioSesion, mensaje: string) {
    if (!puede(yo.rol, "personal:asistencia")) throw new ForbiddenException(mensaje);
  }
}

@Controller("personal/asistencia")
export class PersonalController {
  constructor(private readonly personal: PersonalService) {}

  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion) {
    return this.personal.listar(yo);
  }

  @Put()
  marcar(@UsuarioActual() yo: UsuarioSesion, @Body() datos: { personaId?: unknown; fecha?: unknown; estado?: unknown }) {
    return this.personal.marcar(yo, datos);
  }
}

@Module({
  controllers: [PersonalController],
  providers: [PersonalService],
})
export class PersonalModule {}
