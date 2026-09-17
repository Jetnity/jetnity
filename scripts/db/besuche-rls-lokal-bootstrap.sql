-- Isoliertes Bootstrap für den lokalen Besuchs-RLS-Nachweis.
-- Niemals Production. Keine Secrets. Kein Supabase-Management-API-Write.
--
-- Minimaler Supabase-ähnlicher Unterbau: die Rollen, die PostgREST benutzt,
-- `auth.users` als Eigentümertabelle, `auth.uid()` aus den JWT-Claims und der
-- Trigger, den jede Jetnity-Tabelle für `updated_at` verwendet.
--
-- `public.places` und `public.trips` stehen hier nur als Nachbarn: der Test
-- muss zeigen können, dass der Besuchsweg sie nicht schreibt.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit;
  end if;
end
$$;

create schema if not exists auth;

create table auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
set search_path = pg_catalog
as $$
  select (nullif(
    nullif(current_setting('request.jwt.claims', true), ''),
    ''
  )::jsonb ->> 'sub')::uuid;
$$;

create or replace function public.setze_aktualisiert_am()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.places (
  id text primary key,
  name text not null,
  typ text not null,
  country_code text,
  lat double precision,
  lon double precision
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'draft',
  updated_at timestamptz not null default now(),
  constraint trips_id_user_id_eindeutig unique (id, user_id)
);

alter table public.trips enable row level security;

create policy trips_own_select on public.trips
  for select to authenticated using (user_id = (select auth.uid()));
create policy trips_own_update on public.trips
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated, service_role;
grant select on public.places to anon, authenticated;
grant select, update on public.trips to authenticated;
revoke all on public.trips from anon;
