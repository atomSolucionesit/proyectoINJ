import { Body, Controller, Get, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { minutosDeSesion, normalizarNombre } from "../compartido/cuentas";
import { PrismaService } from "../prisma/prisma.service";
import { conCurso, publicoUsuario } from "../usuarios/usuarios.service";
import { Publica, UsuarioActual, type UsuarioSesion } from "./sesion";

/** Hash de relleno: se compara igual aunque la cuenta no exista, para no revelar qué nombres están registrados. */
const HASH_FALSO = "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Se ingresa con el nombre completo (sin importar mayúsculas ni tildes) y la contraseña. La sesión dura SESION_MINUTOS (60). */
  @Publica()
  @Post("login")
  @HttpCode(200)
  async login(@Body() body: { nombre?: unknown; password?: unknown }) {
    const nombreClave = typeof body.nombre === "string" ? normalizarNombre(body.nombre) : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    const usuario = nombreClave ? await this.prisma.usuario.findUnique({ where: { nombreClave }, include: conCurso }) : null;
    const ok = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_FALSO);
    if (!usuario || !ok) {
      throw new UnauthorizedException("El nombre completo o la contraseña no son correctos. Si no te acordás, pedísela a la administración.");
    }

    const token = await this.jwt.signAsync({ sub: usuario.id });
    const expiraEn = new Date(Date.now() + minutosDeSesion() * 60_000).toISOString();
    return { token, expiraEn, usuario: publicoUsuario(usuario) };
  }

  @Get("yo")
  async yo(@UsuarioActual() yo: UsuarioSesion) {
    return publicoUsuario(await this.prisma.usuario.findUniqueOrThrow({ where: { id: yo.id }, include: conCurso }));
  }
}
