-- Tablas de la sección Biblioteca. Se pueden ejecutar varias veces sin romper nada.

create table if not exists biblioteca_archivos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  categoria   text not null default 'otros',
  pathname    text not null unique,
  url         text not null,
  tipo        text not null,
  tamano      bigint not null,
  subido_por  text not null,
  creado_en   timestamptz not null default now()
);

create table if not exists biblioteca_reservas (
  id               uuid primary key default gen_random_uuid(),
  archivo_id       uuid references biblioteca_archivos(id) on delete set null,
  archivo_nombre   text not null,
  paginas          integer not null check (paginas > 0),
  copias           integer not null check (copias > 0),
  color            boolean not null default false,
  doble_faz        boolean not null default false,
  anillado         boolean not null default false,
  notas            text,
  total            integer not null check (total > 0),
  estado           text not null default 'pendiente_pago'
                   check (estado in ('pendiente_pago', 'pagada', 'lista', 'retirada', 'cancelada')),
  codigo_retiro    text not null unique,
  solicitante      text not null,
  mp_preference_id text,
  mp_payment_id    text,
  creado_en        timestamptz not null default now(),
  pagado_en        timestamptz
);

create index if not exists biblioteca_reservas_estado_idx on biblioteca_reservas (estado);

-- Roles: archivos personales para imprimir y vencimiento automático.
alter table biblioteca_archivos add column if not exists visibilidad text not null default 'biblioteca';
alter table biblioteca_archivos add column if not exists expira_en timestamptz;
alter table biblioteca_archivos add column if not exists subido_por_nombre text;
alter table biblioteca_reservas add column if not exists solicitante_nombre text;
create index if not exists biblioteca_archivos_expira_idx on biblioteca_archivos (expira_en) where expira_en is not null
