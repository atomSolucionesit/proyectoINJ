# Sitio y panel (Next.js), con la salida "standalone" de next.config.ts.
# NEXT_PUBLIC_API_URL se pega en el código al compilar: pasala como build arg (ej: https://api.tudominio.com).

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
# Producción: usa el backend (no el modo demo) y el login no muestra las cuentas de prueba.
# Para publicar una demo, pasá --build-arg NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO=1.
ARG NEXT_PUBLIC_MODO_DEMO=0
ARG NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO=0
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MODO_DEMO=$NEXT_PUBLIC_MODO_DEMO \
    NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO=$NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO \
    NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "Falta el build arg NEXT_PUBLIC_API_URL (la dirección pública de la API)." && exit 1)
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
