# API del instituto (NestJS + Prisma + MySQL).
# Al arrancar aplica las migraciones pendientes y después levanta la API en el puerto 3001.

FROM node:24-alpine AS build
# Prisma (migraciones) necesita OpenSSL.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# `prisma generate` lee prisma.config.ts, que pide DATABASE_URL; para generar el cliente no se conecta, alcanza con una de mentira.
RUN DATABASE_URL="mysql://build:build@localhost:3306/build" npm run build

FROM node:24-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    UPLOAD_DIR=/app/uploads
# Se dejan las dependencias de desarrollo: hacen falta el CLI de Prisma (migraciones) y tsx (seed).
COPY --from=build /app/package.json /app/package-lock.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated ./src/generated
# Los archivos subidos (biblioteca e imágenes de noticias) van acá: montá un volumen en /app/uploads.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
