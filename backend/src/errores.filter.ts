import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { Prisma } from "./generated/prisma/client";
import { bibliotecaConfig } from "./compartido/biblioteca";

const MB = 1024 * 1024;

/** Mensajes en castellano para los errores que arma Nest o multer en inglés. */
const mensajesPorEstado: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "Los datos enviados no son válidos.",
  [HttpStatus.UNAUTHORIZED]: "Iniciá sesión.",
  [HttpStatus.FORBIDDEN]: "No tenés permiso para hacer esto.",
  [HttpStatus.NOT_FOUND]: "No se encontró lo que buscabas.",
  [HttpStatus.PAYLOAD_TOO_LARGE]: `El archivo supera el máximo de ${bibliotecaConfig.tamanoMaximo / MB} MB.`,
};

/** Mensajes que arman Nest, multer o Express por su cuenta (en inglés). Los nuestros ya vienen en castellano. */
const mensajesEnIngles =
  /JSON|Unexpected|Expected|field|Multipart|Malformed|Boundary|too large|Too many|^Cannot |^(Bad Request|Unauthorized|Forbidden|Not Found|Internal server error)$/i;

const esMensajePropio = (mensaje: unknown): mensaje is string => typeof mensaje === "string" && !mensajesEnIngles.test(mensaje);

/** Errores de Prisma que significan "no hay conexión con MySQL". */
function esFallaDeConexion(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code.startsWith("P1")) return true;
  const detalle = JSON.stringify(error.meta?.driverAdapterError ?? "");
  return /pool|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connect/i.test(detalle);
}

/**
 * Todas las respuestas de error salen igual: `{ statusCode, message }`, con un mensaje en castellano
 * que el panel puede mostrar tal cual. Los errores inesperados se registran en la consola del servidor
 * y al usuario le llega un mensaje genérico (nunca detalles internos).
 */
@Catch()
export class ErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger("Errores");

  catch(error: unknown, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const { statusCode, message } = this.traducir(error);
    if (respuesta.headersSent) return;
    respuesta.status(statusCode).json({ statusCode, message });
  }

  private traducir(error: unknown): { statusCode: number; message: string } {
    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const cuerpo = error.getResponse();
      const mensaje = typeof cuerpo === "string" ? cuerpo : (cuerpo as { message?: unknown }).message;
      if (esMensajePropio(mensaje)) return { statusCode, message: mensaje };
      if (statusCode === HttpStatus.NOT_FOUND) return { statusCode, message: "Esa dirección de la API no existe." };
      return { statusCode, message: mensajesPorEstado[statusCode] ?? "No se pudo completar el pedido." };
    }

    if (esFallaDeConexion(error)) {
      this.logger.error("No hay conexión con MySQL. ¿Está prendida la base y bien configurado DATABASE_URL?");
      return { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: "La base de datos no responde. Probá de nuevo en unos minutos." };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: dato repetido (ej. email). P2025: el registro ya no existe (lo borró otra persona).
      if (error.code === "P2002") return { statusCode: HttpStatus.CONFLICT, message: "Ya existe un registro con esos datos." };
      if (error.code === "P2025") return { statusCode: HttpStatus.NOT_FOUND, message: "Eso ya no existe. Actualizá la página." };
    }

    this.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Hubo un problema en el servidor. Probá de nuevo." };
  }
}
