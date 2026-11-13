import { Module } from "@nestjs/common";
import { AsistenciaController } from "./asistencia.controller";
import { AsistenciaService } from "./asistencia.service";
import { PuntosController, PuntosService } from "./puntos";

@Module({
  controllers: [AsistenciaController, PuntosController],
  providers: [AsistenciaService, PuntosService],
})
export class AsistenciaModule {}
