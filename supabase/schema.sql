-- ============================================================
-- AYUDA CERCA — Schema Supabase
-- ------------------------------------------------------------
-- Cómo cargarlo:
--   Dashboard → SQL Editor → New query → pegar TODO → Run
-- Es idempotente: se puede correr más de una vez sin romper.
-- ============================================================


-- ============================================================
-- 1) LUGARES
-- ============================================================

create table if not exists public.places (
  id           text primary key,            -- slug estable: 'comedor-san-jose'
  name         text not null check (length(name) >= 3),
  address      text not null,
  latitude     double precision,            -- opcional (sin coords se usa address)
  longitude    double precision,
  services     text[] not null default '{}',-- ids del catálogo: lunch, shelter…
  schedule     jsonb not null default '{}'::jsonb,
  availability text,                        -- "Entran 20 personas…"
  phone        text,
  notes        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at automático en cada UPDATE
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_touch on public.places;
create trigger places_touch
  before update on public.places
  for each row execute function public.touch_updated_at();


-- ============================================================
-- 2) SECCIONES PERSONALIZADAS (catálogo dinámico)
--    Las fijas (desayuno…dormir) viven en el código;
--    acá van las creadas desde gestión (DUCHAS, VIANDAS…).
-- ============================================================

create table if not exists public.custom_services (
  id         text primary key,
  label      text not null,
  icon       text not null default '📌',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists custom_services_touch on public.custom_services;
create trigger custom_services_touch
  before update on public.custom_services
  for each row execute function public.touch_updated_at();


-- ============================================================
-- 3) PERFILES DE GESTIÓN (van de la mano de auth.users)
--    role: 'admin' (gestiona usuarios) | 'editor' (gestiona lugares)
-- ============================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- Al crearse un usuario en Auth, se crea su perfil automáticamente.
-- El PRIMER usuario del proyecto queda ADMIN; los demás, editor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case when (select count(*) from public.profiles) = 0
         then 'admin' else 'editor' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 4) VERSIÓN DE DATOS (para el caché del frontend)
--    La app pregunta solo esto; si no cambió, no baja nada.
-- ============================================================

create or replace function public.data_version()
returns timestamptz
language sql
stable
as $$
  select greatest(
    coalesce((select max(updated_at) from public.places), '-infinity'::timestamptz),
    coalesce((select max(updated_at) from public.custom_services), '-infinity'::timestamptz)
  );
$$;

-- ============================================================
-- 5) SEGURIDAD — Row Level Security
--    La publishable key es pública; ESTO es lo que protege.
-- ============================================================

alter table public.places enable row level security;
alter table public.custom_services enable row level security;
alter table public.profiles enable row level security;

-- Lugares: cualquiera lee SOLO los activos (la app pública)
drop policy if exists "public read active places" on public.places;
create policy "public read active places"
  on public.places for select
  to anon
  using (active = true);

-- Gestión (logueados): leen todo, activos y en pausa
drop policy if exists "auth read all places" on public.places;
create policy "auth read all places"
  on public.places for select
  to authenticated
  using (true);

-- Gestión: escribir (cualquier colaborador logueado)
drop policy if exists "auth insert places" on public.places;
create policy "auth insert places"
  on public.places for insert
  to authenticated
  with check (true);

drop policy if exists "auth update places" on public.places;
create policy "auth update places"
  on public.places for update
  to authenticated
  using (true) with check (true);

drop policy if exists "auth delete places" on public.places;
create policy "auth delete places"
  on public.places for delete
  to authenticated
  using (true);

-- Secciones: lectura pública (son el catálogo visible)
drop policy if exists "public read services" on public.custom_services;
create policy "public read services"
  on public.custom_services for select
  to anon
  using (true);

-- Secciones: escribir solo logueados
drop policy if exists "auth insert services" on public.custom_services;
create policy "auth insert services"
  on public.custom_services for insert
  to authenticated
  with check (true);

drop policy if exists "auth delete services" on public.custom_services;
create policy "auth delete services"
  on public.custom_services for delete
  to authenticated
  using (true);

-- Perfiles: cada quien lee el suyo (para saber su rol y nombre)
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

