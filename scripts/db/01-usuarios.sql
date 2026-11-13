-- Cuentas del panel. El administrador principal no está acá: se define en .env.local.

create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null unique,
  password_hash text not null,
  rol           text not null check (rol in ('profesor', 'alumno', 'padre', 'bibliotecaria')),
  dni           text,
  curso         text,
  -- Para alumnos: el padre/madre que puede ver su ficha.
  padre_id      uuid references usuarios(id) on delete set null,
  creado_en     timestamptz not null default now()
);

create index if not exists usuarios_rol_idx on usuarios (rol);
create index if not exists usuarios_padre_idx on usuarios (padre_id);
