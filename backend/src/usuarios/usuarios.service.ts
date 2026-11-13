import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import type { Curso, Prisma, Sexo, Usuario } from "../generated/prisma/client";
import { puede, rolesAsignables } from "../compartido/permisos";
import { cifrarPassword, descifrarPassword, formatoDni, normalizarNombre, passwordInicial, soloDigitos } from "../compartido/cuentas";
import { PrismaService } from "../prisma/prisma.service";
import type { UsuarioSesion } from "../auth/sesion";
import { ArchivosEnDisco } from "../biblioteca/archivos-en-disco";
import { nombreCurso } from "../cursos/nombre-curso";

/** Para traer el curso junto con el usuario (`include: conCurso`). */
export const conCurso = { curso: true } as const;

type UsuarioConCurso = Usuario & { curso: Curso | null };

/** Lo que se manda al frontend: nunca el hash ni la contraseña cifrada. El curso va con su nombre ("3° Año A"). */
export function publicoUsuario({ passwordHash: _h, passwordCifrada: _c, nombreClave: _n, curso, ...usuario }: UsuarioConCurso) {
  return { ...usuario, curso: curso ? nombreCurso(curso) : null };
}

/** Datos de un formulario de cuenta (todo llega sin revisar). */
export type DatosCuenta = {
  nombre?: unknown;
  email?: unknown;
  dni?: unknown;
  telefono?: unknown;
  sexo?: unknown;
  password?: unknown;
};
export type DatosNuevoUsuario = DatosCuenta & { rol?: unknown };
export type DatosNuevoAlumno = DatosCuenta & { padreId?: unknown };
export type DatosFamilia = { tutor?: unknown; hijos?: unknown };

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const comoObjeto = (valor: unknown) => (valor && typeof valor === "object" ? valor : {}) as DatosCuenta & { cursoId?: unknown };

/** Emails, DNI y nombres de un mismo formulario (alta de familia), para que no se repitan entre ellos. */
type Usados = { emails: Set<string>; dnis: Set<string>; nombres: Set<string> };
const usadosVacio = (): Usados => ({ emails: new Set(), dnis: new Set(), nombres: new Set() });

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disco: ArchivosEnDisco,
  ) {}

  /**
   * - Admin y quienes ven a todos los alumnos (profesores, preceptores): todas las cuentas.
   * - El resto: su cuenta y su familia (el tutor, sus hijos; el alumno, su tutor).
   * El DNI y el teléfono los ve solo el administrador y la familia; la contraseña, solo el administrador.
   */
  async listar(yo: UsuarioSesion) {
    const propio = await this.prisma.usuario.findUniqueOrThrow({ where: { id: yo.id }, include: conCurso });
    const cuentas =
      puede(yo.rol, "alumnos:ver-todos") || puede(yo.rol, "seccion:usuarios")
        ? await this.prisma.usuario.findMany({ include: conCurso, orderBy: { nombre: "asc" } })
        : [
            propio,
            ...(await this.prisma.usuario.findMany({
              where: { OR: [{ padreId: yo.id }, ...(propio.padreId ? [{ id: propio.padreId }] : [])] },
              include: conCurso,
            })),
          ];
    return cuentas.map((u) => this.usuarioPara(yo, propio, u));
  }

  /** Profesores, preceptores, tutores (sin hijos) y bibliotecaria. Los alumnos se crean desde su curso o con su tutor. */
  async crear(yo: UsuarioSesion, datos: DatosNuevoUsuario) {
    this.soloAdmin(yo, "No tenés permiso para crear cuentas.");
    if (datos.rol === "alumno") throw new BadRequestException("Los alumnos se agregan con su tutor/a o desde su curso, en Cursos.");
    const rol = rolesAsignables.find((r) => r === datos.rol);
    if (!rol) throw new BadRequestException("Elegí un rol.");

    const cuenta = await this.validarCuenta(datos);
    return publicoUsuario(await this.prisma.usuario.create({ data: { ...cuenta, rol }, include: conCurso }));
  }

  /** Tutor/a y sus hijos/as en un solo paso: si algún dato está mal, no se crea ninguna cuenta. */
  async crearFamilia(yo: UsuarioSesion, datos: DatosFamilia) {
    this.soloAdmin(yo, "Solo el administrador puede crear cuentas.");
    const usados = usadosVacio();
    const tutor = await this.validarCuenta(comoObjeto(datos.tutor), { quien: "Tutor/a", completa: true, usados });

    const lista = Array.isArray(datos.hijos) ? datos.hijos.map(comoObjeto) : [];
    if (lista.length === 0) throw new BadRequestException("Agregá al menos un hijo o hija.");
    if (lista.length > 10) throw new BadRequestException("Se pueden agregar hasta 10 hijos por vez.");
    const hijos: Omit<Prisma.UsuarioUncheckedCreateInput, "rol">[] = [];
    for (const [i, h] of lista.entries()) {
      const quien = lista.length === 1 ? "Hijo/a" : `Hijo/a ${i + 1}`;
      const cursoId = texto(h.cursoId) || null;
      if (cursoId && !(await this.prisma.curso.findUnique({ where: { id: cursoId } }))) {
        throw new BadRequestException(`${quien}: ese curso ya no existe. Actualizá la página.`);
      }
      hijos.push({ ...(await this.validarCuenta(h, { quien, completa: true, usados })), cursoId });
    }

    return this.prisma.$transaction(async (tx) => {
      const creado = await tx.usuario.create({ data: { ...tutor, rol: "padre" }, include: conCurso });
      const creados = [];
      for (const h of hijos) creados.push(await tx.usuario.create({ data: { ...h, rol: "alumno", padreId: creado.id }, include: conCurso }));
      return { tutor: publicoUsuario(creado), hijos: creados.map(publicoUsuario) };
    });
  }

  /** El administrador corrige los datos de una cuenta. Contraseña vacía = la deja como estaba. */
  async editar(yo: UsuarioSesion, id: string, datos: DatosCuenta) {
    this.soloAdmin(yo, "Solo el administrador puede cambiar los datos de una cuenta.");
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException("Esa cuenta ya no existe. Actualizá la página.");
    if (usuario.esSuperadmin) throw new ForbiddenException("Los datos del superadministrador se cambian en el .env del servidor (SUPERADMIN_*).");

    const identidad = await this.validarIdentidad(datos, { excepto: id });
    const password = texto(datos.password);
    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: { ...identidad, ...(password ? await this.credenciales(this.validarPassword(password)) : {}) },
      include: conCurso,
    });
    const propio = await this.prisma.usuario.findUniqueOrThrow({ where: { id: yo.id } });
    return this.usuarioPara(yo, propio, actualizado);
  }

  /** Crea la cuenta del alumno ya anotado en el curso. Quién puede hacerlo lo controla CursosService. */
  async crearAlumno(cursoId: string, datos: DatosNuevoAlumno) {
    const cuenta = await this.validarCuenta(datos);
    const padreId = texto(datos.padreId) || null;
    if (padreId) {
      const padre = await this.prisma.usuario.findUnique({ where: { id: padreId } });
      if (padre?.rol !== "padre") throw new BadRequestException("El tutor/a elegido no existe.");
    }
    return publicoUsuario(await this.prisma.usuario.create({ data: { ...cuenta, rol: "alumno", cursoId, padreId }, include: conCurso }));
  }

  async eliminar(yo: UsuarioSesion, id: string) {
    this.soloAdmin(yo, "No tenés permiso para borrar cuentas.");
    if (id === yo.id) throw new BadRequestException("No podés borrar tu propia cuenta.");
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return;
    if (usuario.esSuperadmin) throw new ForbiddenException("La cuenta del superadministrador no se puede borrar.");
    if (usuario.rol === "admin" && !yo.esSuperadmin) throw new ForbiddenException("Solo el superadministrador puede borrar a otro administrador.");

    // Sus archivos, reservas y materias se borran en cascada; los hijos quedan sin vincular (padreId = null).
    const archivos = await this.prisma.archivoBiblioteca.findMany({ where: { subidoPorId: id }, select: { id: true } });
    await this.prisma.usuario.delete({ where: { id } });
    await Promise.all(archivos.map((a) => this.disco.borrar(a.id)));
  }

  /* ---------- Reglas ---------- */

  private soloAdmin(yo: UsuarioSesion, mensaje: string) {
    if (!puede(yo.rol, "seccion:usuarios")) throw new ForbiddenException(mensaje);
  }

  /** Lo que `yo` ve de la cuenta `u` (`propio` es la cuenta de `yo`, para saber quién es su familia). */
  private usuarioPara(yo: UsuarioSesion, propio: Usuario, u: UsuarioConCurso) {
    const publico = publicoUsuario(u);
    if (puede(yo.rol, "seccion:usuarios")) {
      // La contraseña del superadministrador no se muestra: está en el .env del servidor.
      return { ...publico, password: u.esSuperadmin ? undefined : (descifrarPassword(u.passwordCifrada) ?? undefined) };
    }
    const familia = u.id === yo.id || u.padreId === yo.id || u.id === propio.padreId;
    return familia ? publico : { ...publico, dni: null, telefono: null };
  }

  /** Cuenta nueva: identidad revisada y la contraseña inicial (la misma para todas, ver PASSWORD_INICIAL). */
  private async validarCuenta(datos: DatosCuenta, opciones: { quien?: string; completa?: boolean; usados?: Usados } = {}) {
    const identidad = await this.validarIdentidad(datos, opciones);
    return { ...identidad, ...(await this.credenciales(passwordInicial())) };
  }

  /**
   * Nombre completo (no se puede repetir: con él se ingresa), DNI, email y, si vienen, teléfono y sexo.
   * - `excepto`: id de la cuenta que se edita (puede quedarse con sus datos).
   * - `completa`: el alta de familia pide también teléfono y sexo.
   */
  private async validarIdentidad(
    d: DatosCuenta,
    { quien = "", excepto, completa = false, usados }: { quien?: string; excepto?: string; completa?: boolean; usados?: Usados } = {},
  ) {
    const p = quien ? `${quien}: ` : "";
    const nombre = texto(d.nombre).replace(/\s+/g, " ").slice(0, 120);
    const nombreClave = normalizarNombre(nombre);
    const digitos = soloDigitos(d.dni);
    const email = texto(d.email).toLowerCase();
    const telefono = soloDigitos(d.telefono);
    const sexo = (["F", "M"] as const).find((s) => s === d.sexo) ?? null;

    if (!nombre.includes(" ")) throw new BadRequestException(`${p}poné nombre y apellido completos (con ese nombre se ingresa al panel).`);
    if (digitos.length < 7 || digitos.length > 8) throw new BadRequestException(`${p}el DNI tiene que tener 7 u 8 números.`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) throw new BadRequestException(`${p}el email no es válido.`);
    if (telefono && (telefono.length < 10 || telefono.length > 13)) {
      throw new BadRequestException(`${p}poné el teléfono con característica, sin 0 ni 15 (ej. 3772 41-2345).`);
    }
    if (completa && !telefono) throw new BadRequestException(`${p}poné el teléfono.`);
    if (completa && !sexo) throw new BadRequestException(`${p}elegí mujer o varón.`);

    const dni = formatoDni(digitos);
    const otra = { id: excepto ? { not: excepto } : undefined };
    if (usados?.nombres.has(nombreClave) || (await this.prisma.usuario.findFirst({ where: { ...otra, nombreClave } }))) {
      throw new BadRequestException(`${p}ya hay una cuenta a nombre de ${nombre}. Agregá el segundo nombre o apellido para diferenciarla.`);
    }
    if (usados?.emails.has(email) || (await this.prisma.usuario.findFirst({ where: { ...otra, email } }))) {
      throw new BadRequestException(`${p}ya existe una cuenta con el email ${email}.`);
    }
    if (usados?.dnis.has(dni) || (await this.prisma.usuario.findFirst({ where: { ...otra, dni: { in: [dni, digitos] } } }))) {
      throw new BadRequestException(`${p}ya hay una cuenta con el DNI ${dni}.`);
    }
    usados?.nombres.add(nombreClave);
    usados?.emails.add(email);
    usados?.dnis.add(dni);
    return { nombre, nombreClave, email, dni, telefono: telefono || null, sexo: sexo as Sexo | null };
  }

  private validarPassword(password: string) {
    if (password.length < 6) throw new BadRequestException("La contraseña tiene que tener al menos 6 caracteres.");
    if (password.length > 60) throw new BadRequestException("La contraseña es demasiado larga.");
    return password;
  }

  /** Hash para ingresar y copia cifrada para que el administrador la pueda ver. */
  private async credenciales(password: string) {
    return { passwordHash: await bcrypt.hash(password, 10), passwordCifrada: cifrarPassword(password) };
  }
}
