# Deploy en Dokploy

Todo el sistema (MySQL + API + sitio y panel) se levanta con `docker-compose.dokploy.yml`.

## 1. DNS

Apuntá dos dominios (registro A) a la IP del servidor de Dokploy:

- Sitio y panel: por ejemplo `institutoninojesus.com.ar`
- API: por ejemplo `api.institutoninojesus.com.ar`

## 2. Crear el servicio

1. En Dokploy: **Create Service → Compose**.
2. **Provider:** GitHub → repo `atomSolucionesit/proyectoINJ`, rama `main`.
3. **Compose Path:** `./docker-compose.dokploy.yml`

## 3. Variables (pestaña Environment)

```env
# Base de datos: solo letras y números (van dentro de la URL de conexión).
MYSQL_PASSWORD=
MYSQL_ROOT_PASSWORD=

# Dominios con https://
FRONTEND_URL=https://institutoninojesus.com.ar
API_URL=https://api.institutoninojesus.com.ar

# Claves al azar de 32+ caracteres, distintas entre sí (ver abajo cómo generarlas).
JWT_SECRET=
PASSWORD_KEY=

# Contraseña de las cuentas nuevas.
PASSWORD_INICIAL=

# Cuenta universal para entrar la primera vez y crear al resto (12+ caracteres).
SUPERADMIN_NOMBRE=Superadministrador INJ
SUPERADMIN_PASSWORD=

# Opcionales
SESION_MINUTOS=60
# 1 = el login muestra los accesos rápidos de prueba (solo para una demo).
MOSTRAR_CUENTAS_DEMO=0
```

Para generar claves al azar (en cualquier PC con Node):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 4. Dominios (pestaña Domains)

| Servicio | Host | Puerto | HTTPS |
| --- | --- | --- | --- |
| `frontend` | `institutoninojesus.com.ar` | 3000 | Let's Encrypt |
| `backend` | `api.institutoninojesus.com.ar` | 3001 | Let's Encrypt |

## 5. Deploy

Tocá **Deploy**. El backend espera a que MySQL esté listo, aplica las migraciones y crea el superadministrador.
Entrá a `https://institutoninojesus.com.ar/login` con `SUPERADMIN_NOMBRE` y `SUPERADMIN_PASSWORD`, y creá las cuentas en **Usuarios**.

## Datos de prueba (solo para una demo)

Para cargar las 15 cuentas de prueba, abrí la terminal del servicio `backend` en Dokploy y corré:

```bash
SEED_PERMITIR_PRODUCCION=1 npx prisma db seed
```

Además poné `MOSTRAR_CUENTAS_DEMO=1` y volvé a hacer deploy para que el login muestre los accesos rápidos. **No lo hagas en producción real.**

## Cosas a tener en cuenta

- `API_URL` y `MOSTRAR_CUENTAS_DEMO` se pegan en el sitio al compilar: si los cambiás, hay que volver a hacer **Deploy**.
- Los datos quedan en los volúmenes `mysql-datos` (base) y `uploads` (archivos de la biblioteca e imágenes de noticias). Configurá los backups de Dokploy para los dos.
- Para cambiar la contraseña del superadministrador: cambiá `SUPERADMIN_PASSWORD` y reiniciá el servicio `backend`.
- El código del login anterior (`src/actions`, `src/app/api`, etc.) queda fuera de la imagen por `.dockerignore`: el panel no lo usa y rompería el build.
