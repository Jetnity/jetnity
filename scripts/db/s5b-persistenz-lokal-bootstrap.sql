-- Isoliertes S5-B-Bootstrap. Niemals Production. Keine Secrets.
-- Minimaler Supabase-ähnlicher Unterbau, damit die S5-B-Migration
-- sauber angewendet und mit RLS/Grants geprüft werden kann.

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

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  constraint trips_id_user_id_eindeutig unique (id, user_id)
);

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid not null default auth.uid(),
  kind text not null,
  title text,
  price_amount numeric,
  price_currency text,
  provider text,
  external_ref text,
  booking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_items_reise_fk foreign key (trip_id, user_id)
    references public.trips (id, user_id) on delete cascade
);

alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

create policy trips_own_select on public.trips
  for select to authenticated using (user_id = (select auth.uid()));
create policy trips_own_insert on public.trips
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy items_own_select on public.trip_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy items_own_insert on public.trip_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy items_own_update on public.trip_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy items_own_delete on public.trip_items
  for delete to authenticated using (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_items to authenticated;
revoke all on public.trips from anon, service_role;
revoke all on public.trip_items from anon, service_role;
