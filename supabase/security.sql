-- ============================================================
-- AYUDA CERCA — Seguridad extra (correr DESPUÉS de analytics-v4)
-- ------------------------------------------------------------
-- 1) Anti-spam de visitas: un mismo visitante anónimo no puede
--    registrar más de 20 visitas por minuto (la app legítima
--    registra como mucho 1 por ruta por minuto).
-- 2) Constraints de coordenadas en places (lat/lng en rango).
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

-- 1) Anti-spam de page_views -----------------------------------

create or replace function public.page_views_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if new.visitor is not null
     and (select count(*)
          from public.page_views
          where visitor = new.visitor
            and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate limit';
  end if;
  return new;
end;
$$;

drop trigger if exists page_views_rate_limit_trigger on public.page_views;
create trigger page_views_rate_limit_trigger
  before insert on public.page_views
  for each row execute function public.page_views_rate_limit();

-- 2) Coordenadas dentro de rango --------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'places_lat_range') then
    alter table public.places
      add constraint places_lat_range
      check (latitude is null or (latitude >= -90 and latitude <= 90));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_lng_range') then
    alter table public.places
      add constraint places_lng_range
      check (longitude is null or (longitude >= -180 and longitude <= 180));
  end if;
end $$;
