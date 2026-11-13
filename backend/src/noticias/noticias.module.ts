import { Module } from "@nestjs/common";
import { ImagenesNoticias } from "./imagenes-noticias";
import { NoticiasController, NoticiasPublicasController } from "./noticias.controller";
import { NoticiasService } from "./noticias.service";

@Module({
  controllers: [NoticiasPublicasController, NoticiasController],
  providers: [NoticiasService, ImagenesNoticias],
})
export class NoticiasModule {}
