import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { ES_PUBLICA, type RequestConSesion } from "./sesion";

/**
 * Todas las rutas piden sesión salvo las marcadas con @Publica().
 * Se busca el usuario en la base en cada pedido: si se borró la cuenta o le cambiaron el rol,
 * el cambio se aplica enseguida aunque el token siga vigente.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [ctx.getHandler(), ctx.getClass()])) return true;

    const request = ctx.switchToHttp().getRequest<RequestConSesion>();
    const [tipo, token] = request.headers.authorization?.split(" ") ?? [];
    if (tipo !== "Bearer" || !token) throw new UnauthorizedException("Iniciá sesión.");

    let id: string;
    try {
      ({ sub: id } = await this.jwt.verifyAsync<{ sub: string }>(token));
    } catch {
      throw new UnauthorizedException("Tu sesión terminó. Volvé a iniciar sesión.");
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true, nombre: true, rol: true, esSuperadmin: true } });
    if (!usuario) throw new UnauthorizedException("Tu sesión terminó. Volvé a iniciar sesión.");
    request.usuario = usuario;
    return true;
  }
}
