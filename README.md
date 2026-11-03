# Página escolar

Sitio web institucional con panel de control y gestión, hecho con Next.js (App Router), TypeScript y Tailwind CSS.

## Comenzar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir http://localhost:3000 (sitio) y http://localhost:3000/panel (panel de control).

## Estructura

```
src/
├── app/
│   ├── (sitio)/            # PÁGINA PRINCIPAL (pública) — el grupo no aparece en la URL
│   │   ├── layout.tsx      # Header + Footer del sitio
│   │   ├── page.tsx        # /
│   │   ├── institucional/  # /institucional
│   │   ├── niveles/        # /niveles
│   │   ├── noticias/       # /noticias y /noticias/[slug]
│   │   ├── eventos/        # /eventos
│   │   ├── admisiones/     # /admisiones
│   │   └── contacto/       # /contacto
│   ├── (auth)/
│   │   └── login/          # /login
│   ├── panel/              # PANEL DE CONTROL (privado) — /panel/...
│   │   ├── layout.tsx      # Sidebar + header del panel
│   │   ├── page.tsx        # /panel (resumen)
│   │   ├── noticias/       # listado, nueva, [id] (editar)
│   │   ├── eventos/
│   │   ├── alumnos/
│   │   ├── docentes/
│   │   ├── cursos/
│   │   ├── mensajes/
│   │   ├── usuarios/
│   │   └── configuracion/
│   ├── layout.tsx          # Layout raíz (html/body, fuentes, metadata)
│   └── not-found.tsx
├── components/
│   ├── ui/                 # Componentes genéricos compartidos (Button, ...)
│   ├── sitio/              # Componentes exclusivos de la página principal
│   └── panel/              # Componentes exclusivos del panel de control
├── actions/
│   ├── sitio/              # Server Actions públicas (ej. formulario de contacto)
│   └── panel/              # Server Actions del panel (CRUD, login)
├── config/                 # Datos del sitio y menús de navegación
├── hooks/                  # Hooks de React reutilizables
├── lib/
│   ├── auth/               # Sesión y autenticación
│   ├── db/                 # Conexión / cliente de base de datos
│   └── utils.ts
├── types/                  # Tipos TypeScript compartidos
└── proxy.ts                # Protege /panel: redirige a /login sin sesión
public/images/{sitio,panel}
```

## Convenciones

- Todo lo público va en `app/(sitio)` y `components/sitio`.
- Todo lo de gestión va en `app/panel` y `components/panel`.
- Lo compartido por ambos va en `components/ui`, `lib`, `types` y `config`.
- `proxy.ts` hace solo un chequeo optimista de la cookie; la autorización real debe verificarse en el servidor (Server Components / Server Actions).
