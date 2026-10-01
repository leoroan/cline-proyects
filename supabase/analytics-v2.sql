-- ============================================================
-- AYUDA CERCA — Analytics v2 (correr DESPUÉS de analytics.sql)
-- ------------------------------------------------------------
-- Enriquece page_views con:
--   device  → 'celular' | 'tablet' | 'pc/tv'  (sin user-agent)
--   visitor → id anónimo por navegador (sin datos personales)
-- Nuevas funciones para el dueño: visitantes únicos por día,
-- vistas por dispositivo y por franja horaria (hora Argentina).
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.page_views add column if not exists device text;
alter table public.page_views add column if not exists visitor text;

create index if not exists page_views_visitor_idx on public.page_views (visitor);

-- Visitantes ÚNICOS por día (distinct visitor), solo dueño
create or replace function public.stats_visitors(days int default 14)
returns table(day date, visitors bigint)
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
           count(distinct visitor)::bigint as visitors
    from public.page_views
    where created_at > now() - make_interval(days => days)
      and visitor is not null
    group by 1
    order by 1;
end;
$$;

-- Vistas por tipo de dispositivo, solo dueño
create or replace function public.stats_devices()
returns table(device text, views bigint)
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
    select coalesce(nullif(p.device, ''), 'desconocido') as device,
           count(*)::bigint as views
    from public.page_views p
    group by 1
    order by views desc;
end;
$$;

-- Vistas por franja horaria (hora de Argentina), solo dueño
create or replace function public.stats_hours()
returns table(hour int, views bigint)
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
    select extract(hour from (created_at at time zone 'America/Argentina/Buenos_Aires'))::int as hour,
           count(*)::bigint as views
    from public.page_views
    group by 1
    order by 1;
end;
$$;
