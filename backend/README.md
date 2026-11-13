# Backend del Instituto Niño Jesús

API en **NestJS** con **Prisma** y **MySQL**. La usa el panel (Next.js) para todo: cuentas, cursos, asistencia, cuotas, amonestaciones, biblioteca, noticias y eventos.

## Primera vez

1. **Tener MySQL andando.** Cualquiera de estas:
   - Con Docker: `docker compose up -d` (usa `docker-compose.yml`, ya coincide con `.env.example`).
   - Con MySQL instalado (MySQL Installer, XAMPP, etc.): creá una base `instituto` y un usuario con permisos, y poné esos datos en `DATABASE_URL`.
2. **Variables:** copiá `.env.example` a `.env` y completá `DATABASE_URL`, `JWT_SECRET`, `PASSWORD_KEY` y `SUPERADMIN_PASSWORD`.
3. **Instalar y crear las tablas:**
   ```bash
   npm install
   npm run db:migrate     # crea las tablas en MySQL y genera el cliente de Prisma
   npm run db:seed        # SOLO PARA LA DEMO: cuentas de prueba (contraseña: pasodeloslibres)
   ```
4. **Levantar la API:** `npm run start:dev` → queda en `http://localhost:3001`.

El frontend usa el backend cuando `NEXT_PUBLIC_MODO_DEMO=0` en `../.env.local` (con `1` funciona sin backend, con datos en el navegador). La dirección de la API va en `NEXT_PUBLIC_API_URL`.

## Ingreso y sesiones

- Se ingresa con el **nombre completo** (sin importar mayúsculas ni tildes) y la **contraseña**. El nombre no se puede repetir entre cuentas.
- El login devuelve un **JWT** firmado con `JWT_SECRET` que **vence a los 60 minutos** (`SESION_MINUTOS`). Todas las rutas lo piden (salvo el login y las públicas); vencido o adulterado, responde 401 y el panel vuelve al login.
- Las cuentas nuevas reciben la contraseña de `PASSWORD_INICIAL` (por defecto `pasodeloslibres`). El administrador la ve en Usuarios: se guarda el hash (para ingresar) y una copia cifrada con `PASSWORD_KEY` (para mostrarla).
- **Superadministrador:** al arrancar, el servidor crea (o actualiza) la cuenta universal con `SUPERADMIN_NOMBRE` y `SUPERADMIN_PASSWORD`. Con ella se entra a Usuarios para crear al resto. No se puede borrar ni editar desde el panel: para cambiar su contraseña, se cambia en el `.env` y se reinicia el servidor. En producción `SUPERADMIN_PASSWORD` es obligatoria (12 caracteres o más).

## Pasar a producción

1. En `backend/.env`: `NODE_ENV=production`, `JWT_SECRET` y `PASSWORD_KEY` al azar (32+ caracteres), `SUPERADMIN_PASSWORD` fuerte, y `PASSWORD_INICIAL` distinta de la de la demo.
2. **No** corras `npm run db:seed` (carga cuentas de prueba; en producción se niega a correr).
3. Frontend: el `Dockerfile` ya compila con `NEXT_PUBLIC_MODO_DEMO=0` y `NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO=0`, así que el login no muestra las cuentas de prueba.
4. Entrá con el superadministrador y creá las cuentas reales desde Usuarios.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | API en modo desarrollo (se reinicia sola al guardar) |
| `npm run build` / `npm start` | Compilar y correr en producción |
| `npm run db:migrate` | Después de cambiar `prisma/schema.prisma`: crea la migración y la aplica |
| `npm run db:deploy` | En producción: aplica las migraciones pendientes |
| `npm run db:seed` | Demo: cursos de 1° a 6° Año, las 15 cuentas de prueba con sus materias y, si no hay, noticias y eventos |
| `npm run db:studio` | Abre Prisma Studio para ver y editar la base en el navegador |

## Estructura

- `prisma/schema.prisma` — tablas: `usuarios`, `cursos`, `docentes_curso`, `asistencias`, `puntos`, `sanciones`, `asistencia_personal`, `config_cuotas`, `pagos_cuotas`, `telefonos_cuotas`, `recordatorios_cuotas`, `noticias`, `eventos`, `archivos_biblioteca`, `reservas_impresion`.
- `src/auth` — login (nombre + contraseña), JWT de 60 minutos y la cuenta del superadministrador.
- `src/usuarios` — cuentas: listar, crear, alta de tutor con sus hijos, editar y borrar.
- `src/cursos` — cursos de 1° a 6° Año, profesor por materia y alumnos de cada curso.
- `src/asistencia` — asistencia por curso, materia y día, y positivos/negativos.
- `src/alumnos` — amonestaciones y apercibimientos, y la asistencia de cada alumno (lo que ven él y su familia).
- `src/personal` — asistencia de profesores y preceptores (la toma el administrador).
- `src/cuotas` — cuotas mensuales, pagos, avisos de pago y recordatorios por WhatsApp.
- `src/noticias` — noticias del sitio (borrador / publicada) con su imagen, guardada en `UPLOAD_DIR/noticias`.
- `src/eventos` — calendario de actos y actividades.
- `src/biblioteca` — archivos (se guardan en `UPLOAD_DIR`) y reservas de impresión. Cada hora borra los archivos vencidos.
- `src/compartido` — permisos, precios, fechas y utilidades de cuentas. `permisos.ts` y `biblioteca.ts` son copia de `src/lib/auth/permisos.ts` y `src/config/biblioteca.ts` del frontend: si cambiás uno, cambiá el otro.

## API

| Método | Ruta | Quién |
| --- | --- | --- |
| POST | `/auth/login` | Cualquiera: `{ nombre, password }` → `{ token, expiraEn, usuario }` |
| GET | `/auth/yo` | Con sesión |
| GET | `/usuarios` | Admin, profesores y preceptores: todos. El resto: su cuenta y su familia. La contraseña solo le llega al admin |
| POST | `/usuarios` | Admin (profesores, preceptores, tutores, bibliotecaria) |
| POST | `/usuarios/familia` | Admin: tutor/a con sus hijos/as en un paso |
| PUT, DELETE | `/usuarios/:id` | Admin (el superadministrador no se edita ni se borra) |
| GET | `/cursos` | Admin y preceptores: todos. Profesores: donde dan alguna materia. Alumnos: el suyo. Tutores: los de sus hijos |
| POST, DELETE | `/cursos`, `/cursos/:id` | Admin |
| POST, DELETE | `/cursos/:id/docentes`, `/cursos/:id/docentes/:asignacionId` | Admin (profesor por materia) |
| POST | `/cursos/:id/alumnos` | Admin, preceptor, o un profesor que da materia en ese curso (crea la cuenta del alumno) |
| PUT, DELETE | `/cursos/:id/alumnos/:alumnoId` | Ídem (anotar / quitar alumno) |
| GET, PUT | `/cursos/:id/asistencia?materia=&fecha=` | Admin, preceptor o el profesor de esa materia |
| GET | `/cursos/:id/asistencia/resumen?materia=` | Ídem (totales por alumno) |
| GET, POST, DELETE | `/cursos/:id/puntos`, `/cursos/:id/puntos/:puntoId` | Ídem (positivos y negativos) |
| GET | `/cursos/:id/sanciones` | Preceptor |
| GET | `/alumnos/:id/sanciones` | El alumno, su tutor, el personal y el preceptor |
| PUT | `/alumnos/:id/sanciones` | Preceptor |
| GET | `/alumnos/:id/asistencia` | El alumno, su tutor y el personal |
| GET, PUT | `/personal/asistencia` | Admin |
| GET | `/cuotas` | Tutor: las de sus hijos. Admin: todas |
| POST | `/cuotas/pagar` | El tutor del alumno (pago simulado) |
| PUT | `/cuotas/config`, `/cuotas/alumnos/:id/telefono` | Admin |
| POST | `/cuotas/alumnos/:id/recordatorios` | Admin (registra el aviso de deuda por WhatsApp) |
| GET, POST | `/cuotas/avisos`, `/cuotas/avisos/leidos` | Admin |
| GET | `/publico/noticias?limite=`, `/publico/noticias/:slug` | Cualquiera, sin sesión (solo las publicadas) |
| GET | `/publico/imagenes/:archivo` | Cualquiera, sin sesión (imágenes de las noticias) |
| GET | `/publico/eventos` | Cualquiera, sin sesión (de hoy en adelante) |
| GET | `/noticias` | Con sesión. El admin ve también los borradores |
| POST, PUT, DELETE | `/noticias`, `/noticias/:id` | Admin (multipart, con la imagen en el campo `imagen`) |
| GET | `/eventos` | Con sesión (todos, también los pasados) |
| POST, PUT, DELETE | `/eventos`, `/eventos/:id` | Admin, profesores y preceptores |
| GET, POST | `/biblioteca/archivos` | Con sesión (solo profesores y admin publican; el resto sube para imprimir) |
| GET | `/biblioteca/archivos/:id/contenido` | Quien puede ver el archivo |
| DELETE | `/biblioteca/archivos/:id` | Quien lo subió, admin y profesores |
| GET, POST | `/biblioteca/reservas` | Cada uno ve las suyas; la bibliotecaria además las pagadas |
| POST | `/biblioteca/reservas/:id/pagar` | Quien hizo la reserva: `{ metodo: "efectivo" \| "mercadopago" }` |
| PATCH | `/biblioteca/reservas/:id/estado` | Cancelar: quien la hizo. Lista/retirada: bibliotecaria |
