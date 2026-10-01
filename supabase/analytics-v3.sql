-- ============================================================
-- AYUDA CERCA — Analytics v3 (correr DESPUÉS de analytics-v2.sql)
-- ------------------------------------------------------------
-- stats_daily ahora acepta exclude_admin para separar las
-- visitas PÚBLICAS de las de GESTIÓN (los clics del equipo en
-- #/admin). Compatible con lo anterior (el parámetro es opcional).
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- IMPORTANTE: primero se elimina la firma VIEJA (1 parámetro,
-- la de analytics.sql). Si convive con la nueva, Postgres no puede
-- elegir entre ambas y falla con 'Could not choose the best
-- candidate function'.
drop function if exists public.stats_daily(int);

create or replace function public.stats_daily(
  days int default 14,
  exclude_admin boolean default false
)
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
      and (not exclude_admin or path not like 'admin%')
    group by 1
    order by 1;
end;
$$;
