import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AlumnosModule } from "./alumnos/alumnos";
import { AsistenciaModule } from "./asistencia/asistencia.module";
import { AuthModule } from "./auth/auth.module";
import { BibliotecaModule } from "./biblioteca/biblioteca.module";
import { CuotasModule } from "./cuotas/cuotas.module";
import { CursosModule } from "./cursos/cursos.module";
import { EventosModule } from "./eventos/eventos.module";
import { NoticiasModule } from "./noticias/noticias.module";
import { PersonalModule } from "./personal/personal";
import { PrismaModule } from "./prisma/prisma.module";
import { UsuariosModule } from "./usuarios/usuarios.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    CursosModule,
    AsistenciaModule,
    AlumnosModule,
    PersonalModule,
    CuotasModule,
    BibliotecaModule,
    NoticiasModule,
    EventosModule,
  ],
})
export class AppModule {}
