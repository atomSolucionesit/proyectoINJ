import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ErroresFilter } from "./errores.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Todos los errores salen con un mensaje en castellano que el panel muestra tal cual.
  app.useGlobalFilters(new ErroresFilter());
  // El frontend (Next.js) corre en otro puerto y llama a esta API desde el navegador.
  app.enableCors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" });
  const puerto = Number(process.env.PORT ?? 3001);
  await app.listen(puerto);
  console.log(`API del instituto en http://localhost:${puerto}`);
}
void bootstrap();
