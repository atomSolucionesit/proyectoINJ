import { Module } from "@nestjs/common";
import { BibliotecaModule } from "../biblioteca/biblioteca.module";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosService } from "./usuarios.service";

@Module({
  imports: [BibliotecaModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
