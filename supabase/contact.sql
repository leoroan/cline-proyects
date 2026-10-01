-- ============================================================
-- AYUDA CERCA — Formulario de contacto (sin exponer el email)
-- ------------------------------------------------------------
-- Cualquiera puede ESCRIBIR un mensaje (anónimos incluidos).
-- Leer / marcar leído / borrar: SOLO el dueño (por email, RLS).
-- Anti-spam: honeypot (campo trampa) + rate limit por visitante.
-- Dashboard → SQL Editor → New query → pegar TODO → Run.
-- ============================================================

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  message    text not null check (length(message) >= 10 and length(message) <= 2000),
  contact    text,                  -- opcional: cómo responder (mail/teléfono)
  visitor    text,                  -- id anónimo (para rate limit)
  website    text,                  -- honeypot: los bots lo llenan, la gente no
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Cualquiera escribe
drop policy if exists "anyone insert message" on public.contact_messages;
create policy "anyone insert message"
  on public.contact_messages for insert
  to anon
  with check (true);

drop policy if exists "auth insert message" on public.contact_messages;
create policy "auth insert message"
  on public.contact_messages for insert
  to authenticated
  with check (true);

-- Leer / actualizar / borrar: SOLO el dueño
drop policy if exists "owner read messages" on public.contact_messages;
create policy "owner read messages"
  on public.contact_messages for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'leoroan@gmail.com');

drop policy if exists "owner update messages" on public.contact_messages;
create policy "owner update messages"
  on public.contact_messages for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'leoroan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'leoroan@gmail.com');

drop policy if exists "owner delete messages" on public.contact_messages;
create policy "owner delete messages"
  on public.contact_messages for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'leoroan@gmail.com');

-- Anti-spam 1: honeypot (si el campo trampa viene lleno, se rechaza)
create or replace function public.contact_honeypot()
returns trigger
language plpgsql
as $$
begin
  if new.website is not null and new.website <> '' then
    raise exception 'spam';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_honeypot_trigger on public.contact_messages;
create trigger contact_honeypot_trigger
  before insert on public.contact_messages
  for each row execute function public.contact_honeypot();

-- Anti-spam 2: máximo 3 mensajes por visitante por día
create or replace function public.contact_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if new.visitor is not null
     and (select count(*)
          from public.contact_messages
          where visitor = new.visitor
            and created_at > now() - interval '1 day') >= 3 then
    raise exception 'rate limit';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_rate_limit_trigger on public.contact_messages;
create trigger contact_rate_limit_trigger
  before insert on public.contact_messages
  for each row execute function public.contact_rate_limit();
