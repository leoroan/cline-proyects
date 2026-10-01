-- ============================================================
-- AYUDA CERCA — Analytics v4 (correr DESPUÉS de analytics-v3.sql)
-- ------------------------------------------------------------
-- Clasificación por ACTOR, no por ruta:
--   'publico' (sin sesión) · 'dueno' (owner) · 'equipo' (colaborador)
-- Así las visitas del equipo cuentan como gestión aunque usen la
-- app pública, y el público real queda limpio.
-- Las filas viejas quedan como 'publico' (histórico).
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

alter table public.page_views
  add column if not exists actor text not null default 'publico';

create index if not exists page_views_actor_idx on public.page_views (actor);

-- stats_daily cambia de forma (3 columnas): hay que dropear las
-- firmas viejas primero (v1 y v3).
drop function if exists public.stats_daily(int);
drop function if exists public.stats_daily(int, boolean);

create or replace function public.stats_daily(days int default 14)
returns table(day date, publicas bigint, dueno bigint, equipo bigint)
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
           count(*) filter (where actor = 'publico')::bigint as publicas,
           count(*) filter (where actor = 'dueno')::bigint as dueno,
           count(*) filter (where actor = 'equipo')::bigint as equipo
    from public.page_views
    where created_at > now() - make_interval(days => days)
    group by 1
    order by 1;
end;
$$;
