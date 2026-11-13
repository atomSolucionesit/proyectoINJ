import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Curso, PagoCuota, RecordatorioCuota, TelefonoCuota, Usuario } from "../generated/prisma/client";
import { puede } from "../compartido/permisos";
import { hoyArgentina } from "../compartido/fechas";
import { soloDigitos } from "../compartido/cuentas";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { nombreCurso } from "../cursos/nombre-curso";

/** Valor y vencimiento hasta que el administrador los cambie. */
const CONFIG_INICIAL = { monto: 45000, diaVencimiento: 10 };
/** Ciclo lectivo: de marzo a diciembre. */
const PRIMER_MES = 3;
const ULTIMO_MES = 12;

const dosCifras = (n: number) => String(n).padStart(2, "0");
const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");

/** Meses con cuota hasta el actual, del más nuevo al más viejo ("2026-11", "2026-10"…). */
function mesesConCuota() {
  const [anio, mes] = hoyArgentina().split("-").map(Number);
  const meses: string[] = [];
  for (let m = Math.min(mes, ULTIMO_MES); m >= PRIMER_MES; m--) meses.push(`${anio}-${dosCifras(m)}`);
  return meses;
}

/** Alumno con todo lo que hace falta para armar su estado de cuenta. */
const conCuenta = {
  curso: true,
  padre: { select: { nombre: true, telefono: true } },
  pagosCuotas: true,
  telefonoCuotas: true,
  recordatorios: { include: { enviadoPor: { select: { nombre: true } } }, orderBy: { enviadoEn: "desc" } },
} as const;

type AlumnoConCuenta = Usuario & {
  curso: Curso | null;
  padre: { nombre: string; telefono: string | null } | null;
  pagosCuotas: PagoCuota[];
  telefonoCuotas: TelefonoCuota | null;
  recordatorios: (RecordatorioCuota & { enviadoPor: { nombre: string } | null })[];
};

@Injectable()
export class CuotasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tutor: las cuotas de sus hijos. Administrador: las de todos los alumnos. */
  async listar(yo: UsuarioSesion) {
    if (!puede(yo.rol, "seccion:cuotas")) throw new ForbiddenException("No tenés acceso a las cuotas.");
    const config = await this.config();
    const alumnos = await this.prisma.usuario.findMany({
      where: { rol: "alumno", ...(puede(yo.rol, "cuotas:gestionar") ? {} : { padreId: yo.id }) },
      include: conCuenta,
    });
    const cuentas = alumnos
      .map((a) => this.cuentaDe(a, config))
      .sort((a, b) => (a.curso ?? "~").localeCompare(b.curso ?? "~") || a.nombre.localeCompare(b.nombre));
    return { config, alumnos: cuentas };
  }

  /** Pago simulado (en la versión final, Mercado Pago). Solo el tutor del alumno. */
  async pagar(yo: UsuarioSesion, datos: { alumnoId?: unknown; mes?: unknown; metodo?: unknown }) {
    const alumno = await this.prisma.usuario.findUnique({ where: { id: texto(datos.alumnoId) } });
    if (alumno?.rol !== "alumno" || alumno.padreId !== yo.id) throw new ForbiddenException("Solo el tutor del alumno puede pagar sus cuotas.");
    const mes = texto(datos.mes);
    if (!mesesConCuota().includes(mes)) throw new BadRequestException("Esa cuota no existe.");
    const metodo = (["mercadopago", "tarjeta"] as const).find((m) => m === datos.metodo);
    if (!metodo) throw new BadRequestException("Elegí cómo vas a pagar: Mercado Pago o tarjeta.");
    if (await this.prisma.pagoCuota.findUnique({ where: { alumnoId_mes: { alumnoId: alumno.id, mes } } })) {
      throw new BadRequestException("Esa cuota ya está pagada.");
    }
    const { monto } = await this.config();
    await this.prisma.pagoCuota.create({ data: { alumnoId: alumno.id, mes, monto, metodo, pagadoPorId: yo.id } });
    return this.cuentaDeId(alumno.id);
  }

  async guardarConfig(yo: UsuarioSesion, datos: { monto?: unknown; diaVencimiento?: unknown }) {
    this.soloAdmin(yo, "Solo el administrador puede cambiar el valor de la cuota.");
    const monto = Number(datos.monto);
    const diaVencimiento = Number(datos.diaVencimiento);
    if (!Number.isInteger(monto) || monto < 1 || monto > 10_000_000) throw new BadRequestException("Poné un valor de cuota válido (en pesos, sin centavos).");
    if (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 28) {
      throw new BadRequestException("El día de vencimiento tiene que ser del 1 al 28.");
    }
    const config = await this.prisma.configCuotas.upsert({ where: { id: 1 }, update: { monto, diaVencimiento }, create: { id: 1, monto, diaVencimiento } });
    return { monto: config.monto, diaVencimiento: config.diaVencimiento };
  }

  /** WhatsApp de la familia para los recordatorios (vacío lo borra y vuelve a usarse el del tutor). */
  async guardarTelefono(yo: UsuarioSesion, alumnoId: string, datos: { telefono?: unknown }) {
    this.soloAdmin(yo, "Solo el administrador puede cambiar el teléfono de contacto.");
    await this.buscarAlumno(alumnoId);
    const telefono = soloDigitos(datos.telefono);
    if (telefono && (telefono.length < 10 || telefono.length > 13)) {
      throw new BadRequestException("Poné el número con característica, sin 0 ni 15 (ej. 3772 41-2345).");
    }
    if (telefono) await this.prisma.telefonoCuota.upsert({ where: { alumnoId }, update: { telefono }, create: { alumnoId, telefono } });
    else await this.prisma.telefonoCuota.deleteMany({ where: { alumnoId } });
    return this.cuentaDeId(alumnoId);
  }

  /** Deja registrado el recordatorio de deuda que el administrador mandó por WhatsApp. */
  async registrarRecordatorio(yo: UsuarioSesion, alumnoId: string) {
    this.soloAdmin(yo, "Solo el administrador puede mandar recordatorios de pago.");
    await this.buscarAlumno(alumnoId);
    const cuenta = await this.cuentaDeId(alumnoId);
    if (!cuenta.telefono) throw new BadRequestException("Cargá primero el WhatsApp de la familia.");
    const vencidas = cuenta.cuotas.filter((c) => c.estado === "vencida");
    if (vencidas.length === 0) throw new BadRequestException("Este alumno no tiene cuotas vencidas.");
    await this.prisma.recordatorioCuota.create({
      data: { alumnoId, enviadoPorId: yo.id, meses: vencidas.map((c) => c.mes).join(","), monto: vencidas.reduce((t, c) => t + c.monto, 0) },
    });
    return this.cuentaDeId(alumnoId);
  }

  /** Los últimos 50 pagos (el administrador recibe un aviso por cada uno). */
  async avisos(yo: UsuarioSesion) {
    this.soloAdmin(yo, "No tenés acceso a los avisos de pago.");
    const [pagos, noVistos] = await Promise.all([
      this.prisma.pagoCuota.findMany({
        orderBy: { pagadoEn: "desc" },
        take: 50,
        include: { alumno: { include: { curso: true } }, pagadoPor: { select: { nombre: true } } },
      }),
      this.prisma.pagoCuota.count({ where: { visto: false } }),
    ]);
    const avisos = pagos.map((p) => ({
      id: p.id,
      alumnoNombre: p.alumno.nombre,
      curso: p.alumno.curso ? nombreCurso(p.alumno.curso) : null,
      tutorNombre: p.pagadoPor?.nombre ?? "—",
      mes: p.mes,
      monto: p.monto,
      metodo: p.metodo,
      pagadoEn: p.pagadoEn.toISOString(),
      visto: p.visto,
    }));
    return { avisos, noVistos };
  }

  async marcarVistos(yo: UsuarioSesion) {
    this.soloAdmin(yo, "No tenés acceso a los avisos de pago.");
    await this.prisma.pagoCuota.updateMany({ where: { visto: false }, data: { visto: true } });
  }

  /* ---------- Estado de cuenta ---------- */

  private async config() {
    const guardada = await this.prisma.configCuotas.findUnique({ where: { id: 1 } });
    return guardada ? { monto: guardada.monto, diaVencimiento: guardada.diaVencimiento } : { ...CONFIG_INICIAL };
  }

  private async cuentaDeId(alumnoId: string) {
    const alumno = await this.prisma.usuario.findUniqueOrThrow({ where: { id: alumnoId }, include: conCuenta });
    return this.cuentaDe(alumno, await this.config());
  }

  /** Cuotas del ciclo hasta hoy: las pagadas con su valor de ese momento; las demás con el valor actual. */
  private cuentaDe(alumno: AlumnoConCuenta, config: { monto: number; diaVencimiento: number }) {
    const hoy = hoyArgentina();
    const cuotas = mesesConCuota().map((mes) => {
      const pago = alumno.pagosCuotas.find((p) => p.mes === mes);
      const vencimiento = `${mes}-${dosCifras(config.diaVencimiento)}`;
      return {
        mes,
        vencimiento,
        monto: pago?.monto ?? config.monto,
        estado: pago ? ("pagada" as const) : hoy > vencimiento ? ("vencida" as const) : ("pendiente" as const),
        pagadaEn: pago?.pagadoEn.toISOString() ?? null,
        metodo: pago?.metodo ?? null,
      };
    });
    return {
      alumnoId: alumno.id,
      nombre: alumno.nombre,
      curso: alumno.curso ? nombreCurso(alumno.curso) : null,
      tutorNombre: alumno.padre?.nombre ?? null,
      // El que cargó el administrador en Cuotas; si no, el del tutor.
      telefono: alumno.telefonoCuotas?.telefono ?? alumno.padre?.telefono ?? null,
      recordatorios: alumno.recordatorios.map((r) => ({
        id: r.id,
        enviadoEn: r.enviadoEn.toISOString(),
        enviadoPorNombre: r.enviadoPor?.nombre ?? "Administración",
        meses: r.meses.split(",").filter(Boolean),
        monto: r.monto,
      })),
      cuotas,
    };
  }

  private soloAdmin(yo: UsuarioSesion, mensaje: string) {
    if (!puede(yo.rol, "cuotas:gestionar")) throw new ForbiddenException(mensaje);
  }

  private async buscarAlumno(id: string) {
    const alumno = await this.prisma.usuario.findUnique({ where: { id } });
    if (alumno?.rol !== "alumno") throw new NotFoundException("Ese alumno ya no existe. Actualizá la página.");
    return alumno;
  }
}
