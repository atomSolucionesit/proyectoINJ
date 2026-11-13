import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

/** Una sola conexión (pool) a MySQL para toda la app. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL en backend/.env (mirá .env.example).");
    super({ adapter: new PrismaMariaDb(url) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
