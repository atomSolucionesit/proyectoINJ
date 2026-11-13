import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";
import type { Rol } from "../compartido/permisos";

/** Lo que viaja dentro del token y queda en `request.usuario`. */
export type UsuarioSesion = { id: string; nombre: string; rol: Rol; esSuperadmin: boolean };

export type RequestConSesion = Request & { usuario?: UsuarioSesion };

export const ES_PUBLICA = "esPublica";

/** Marca una ruta que no necesita sesión (por ejemplo, el login). */
export const Publica = () => SetMetadata(ES_PUBLICA, true);

/** Usuario con la sesión iniciada. El guard global garantiza que existe. */
export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<RequestConSesion>().usuario!,
);
