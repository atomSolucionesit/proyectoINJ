import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { minutosDeSesion } from "../compartido/cuentas";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { SuperadminService } from "./superadmin.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("Falta JWT_SECRET en backend/.env (mirá .env.example).");
        if (process.env.NODE_ENV === "production" && secret.length < 32) {
          throw new Error("En producción JWT_SECRET tiene que ser una clave al azar de al menos 32 caracteres.");
        }
        // El token vence solo: pasado ese tiempo el guard lo rechaza y hay que volver a ingresar.
        return { secret, signOptions: { expiresIn: `${minutosDeSesion()}m` } };
      },
    }),
  ],
  controllers: [AuthController],
  // Guard global: todo pide sesión salvo lo marcado con @Publica().
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }, SuperadminService],
})
export class AuthModule {}
