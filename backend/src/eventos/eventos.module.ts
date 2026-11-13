import { Module } from "@nestjs/common";
import { EventosController, EventosPublicosController } from "./eventos.controller";
import { EventosService } from "./eventos.service";

@Module({
  controllers: [EventosPublicosController, EventosController],
  providers: [EventosService],
})
export class EventosModule {}
