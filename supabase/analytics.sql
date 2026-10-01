-- ============================================================
-- AYUDA CERCA — Analytics (correr DESPUÉS de schema.sql)
-- ------------------------------------------------------------
-- Tabla de visitas + funciones de estadística.
-- Cualquiera puede REGISTRAR una visita (anónimos incluidos).
-- LEER las estadísticas: SOLO el dueño (por email, vía RLS y
-- dentro de las funciones).
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);

alter table public.page_views enable row level security;

-- Cualquiera registra una visita (la app pública, anónima)
drop policy if exists "anyone insert view" on public.page_views;
create policy "anyone insert view"
  on public.page_views for insert
  to anon
  with check (true);

drop policy if exists "auth insert view" on public.page_views;
create policy "auth insert view"
  on public.page_views for insert
  to authenticated
  with check (true);

-- Leer: SOLO el dueño del proyecto
drop policy if exists "owner read views" on public.page_views;
create policy "owner read views"
  on public.page_views for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'leoroan@gmail.com');

-- Visitas por día (en hora de Argentina), solo dueño
create or replace function public.stats_daily(days int default 14)
returns table(day date, views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'leoroan@gmail.com' then
    raise exception 'solo el dueno';
  end if;
  return query
    select (created_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
           count(*)::bigint as views
    from public.page_views
    where created_at > now() - make_interval(days => days)
    group by 1
    order by 1;
end;
$$;

-- Rutas más vistas, solo dueño
create or replace function public.stats_paths()
returns table(path text, views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'leoroan@gmail.com' then
    raise exception 'solo el dueno';
  end if;
  return query
    select p.path, count(*)::bigint as views
    from public.page_views p
    group by p.path
    order by views desc
    limit 10;
end;
$$;
