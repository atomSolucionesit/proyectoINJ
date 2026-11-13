import { Module } from "@nestjs/common";
import { ArchivosEnDisco } from "./archivos-en-disco";
import { BibliotecaController } from "./biblioteca.controller";
import { BibliotecaService } from "./biblioteca.service";

@Module({
  controllers: [BibliotecaController],
  providers: [BibliotecaService, ArchivosEnDisco],
  exports: [ArchivosEnDisco],
})
export class BibliotecaModule {}
