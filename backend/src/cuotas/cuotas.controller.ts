import { Body, Controller, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { UsuarioActual, type UsuarioSesion } from "../auth/sesion";
import { CuotasService } from "./cuotas.service";

/** Cuotas: el tutor ve y paga las de sus hijos; el administrador ve todas, recibe los avisos y cambia el valor. */
@Controller("cuotas")
export class CuotasController {
  constructor(private readonly cuotas: CuotasService) {}

  @Get()
  listar(@UsuarioActual() yo: UsuarioSesion) {
    return this.cuotas.listar(yo);
  }

  /** { alumnoId, mes: "2026-11", metodo: "mercadopago" | "tarjeta" } */
  @Post("pagar")
  pagar(@UsuarioActual() yo: UsuarioSesion, @Body() datos: { alumnoId?: unknown; mes?: unknown; metodo?: unknown }) {
    return this.cuotas.pagar(yo, datos);
  }

  @Put("config")
  guardarConfig(@UsuarioActual() yo: UsuarioSesion, @Body() datos: { monto?: unknown; diaVencimiento?: unknown }) {
    return this.cuotas.guardarConfig(yo, datos);
  }

  @Put("alumnos/:id/telefono")
  guardarTelefono(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string, @Body() datos: { telefono?: unknown }) {
    return this.cuotas.guardarTelefono(yo, id, datos);
  }

  @Post("alumnos/:id/recordatorios")
  registrarRecordatorio(@UsuarioActual() yo: UsuarioSesion, @Param("id") id: string) {
    return this.cuotas.registrarRecordatorio(yo, id);
  }

  @Get("avisos")
  avisos(@UsuarioActual() yo: UsuarioSesion) {
    return this.cuotas.avisos(yo);
  }

  @Post("avisos/leidos")
  @HttpCode(204)
  async marcarVistos(@UsuarioActual() yo: UsuarioSesion) {
    await this.cuotas.marcarVistos(yo);
  }
}
