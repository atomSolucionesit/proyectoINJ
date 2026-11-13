import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { normalizarNombre } from "../compartido/cuentas";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Al arrancar el servidor:
 * 1. Completa el nombre de ingreso (`nombreClave`) de las cuentas que no lo tienen (las creadas antes de este cambio).
 * 2. Crea o actualiza la cuenta universal del superadministrador con SUPERADMIN_NOMBRE y SUPERADMIN_PASSWORD del .env.
 *    Con ella se entra a Usuarios para crear al resto. Su contraseña vive solo en el .env: para cambiarla, se cambia ahí
 *    y se reinicia el servidor. No se puede borrar ni editar desde el panel.
 */
@Injectable()
export class SuperadminService implements OnApplicationBootstrap {
  private readonly logger = new Logger("Superadmin");

  constructor(private readonly prisma: PrismaService) {}

  /** No se espera: si la base tarda o no responde, el servidor igual abre el puerto. */
  onApplicationBootstrap() {
    void this.preparar();
  }

  private async preparar() {
    try {
      await this.completarNombresDeIngreso();
      await this.asegurarSuperadmin();
    } catch (error) {
      // Sin base de datos el servidor igual arranca: cada pedido va a responder "la base no responde".
      this.logger.error(`No se pudo preparar las cuentas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async completarNombresDeIngreso() {
    const sinClave = await this.prisma.usuario.findMany({ where: { nombreClave: null }, select: { id: true, nombre: true } });
    for (const u of sinClave) {
      const nombreClave = normalizarNombre(u.nombre);
      if (await this.prisma.usuario.findUnique({ where: { nombreClave } })) {
        this.logger.warn(`"${u.nombre}" tiene el mismo nombre que otra cuenta: no puede ingresar hasta que el administrador le cambie el nombre en Usuarios.`);
        continue;
      }
      await this.prisma.usuario.update({ where: { id: u.id }, data: { nombreClave } });
    }
  }

  private async asegurarSuperadmin() {
    const nombre = (process.env.SUPERADMIN_NOMBRE || "Superadministrador INJ").trim().replace(/\s+/g, " ");
    const password = process.env.SUPERADMIN_PASSWORD ?? "";
    const email = (process.env.SUPERADMIN_EMAIL || "superadmin@instituto.local").trim().toLowerCase();

    if (!password) {
      const mensaje = "Falta SUPERADMIN_PASSWORD en backend/.env: no se creó la cuenta del superadministrador.";
      if (process.env.NODE_ENV === "production") throw new Error(mensaje);
      this.logger.warn(mensaje);
      return;
    }
    if (process.env.NODE_ENV === "production" && password.length < 12) {
      throw new Error("En producción SUPERADMIN_PASSWORD tiene que tener al menos 12 caracteres.");
    }

    const nombreClave = normalizarNombre(nombre);
    const actual = await this.prisma.usuario.findFirst({ where: { esSuperadmin: true } });
    const ocupado = await this.prisma.usuario.findFirst({ where: { OR: [{ nombreClave }, { email }], NOT: actual ? { id: actual.id } : undefined } });
    if (ocupado) {
      this.logger.error(`Ya hay otra cuenta con el nombre "${nombre}" o el email ${email}. Cambiá SUPERADMIN_NOMBRE / SUPERADMIN_EMAIL.`);
      return;
    }

    // Solo se vuelve a calcular el hash si la contraseña del .env cambió.
    const passwordHash = actual && (await bcrypt.compare(password, actual.passwordHash)) ? actual.passwordHash : await bcrypt.hash(password, 12);
    const datos = { nombre, nombreClave, email, passwordHash, passwordCifrada: null, rol: "admin" as const, esSuperadmin: true };
    if (actual) await this.prisma.usuario.update({ where: { id: actual.id }, data: datos });
    else await this.prisma.usuario.create({ data: datos });
    this.logger.log(`Superadministrador listo: ingresa como "${nombre}" con la contraseña de SUPERADMIN_PASSWORD.`);
  }
}
