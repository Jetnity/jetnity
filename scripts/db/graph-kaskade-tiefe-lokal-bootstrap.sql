-- Isolierter Unterbau für den Kaskaden-Nachweis der Graph-Revision.
-- Lokale PostgreSQL. Kein Supabase, keine Production, keine Geheimnisse.
-- Die Funktion ist hier noch die Fassung ohne Kaskaden-Rückkehr. Die
-- Migration 20260927230000 ersetzt sie danach.

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin nologin noinherit;
  end if;
end
$$;

create table auth.users (
  id uuid primary key
);

alter table auth.users owner to supabase_auth_admin;
grant usage on schema auth to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin, authenticated, anon;

create or replace function auth.uid()
returns uuid
language sql
stable
set search_path = pg_catalog
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
$$;

create table public.trips (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  revision integer not null default 1,
  unique (id, user_id)
);

create table public.trip_stages (
  id uuid primary key,
  trip_id uuid not null,
  user_id uuid not null,
  note text,
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade
);

create table public.trip_days (
  id uuid primary key,
  trip_id uuid not null,
  user_id uuid not null,
  note text,
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade
);

create table public.trip_items (
  id uuid primary key,
  trip_id uuid not null,
  user_id uuid not null,
  note text,
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade
);

alter table public.trips enable row level security;
alter table public.trip_stages enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;

create policy trips_eigen on public.trips
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy stages_eigen on public.trip_stages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy days_eigen on public.trip_days
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy items_eigen on public.trip_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on table
  public.trips, public.trip_stages, public.trip_days, public.trip_items
  to authenticated;

create table public.fassungs_log (
  id integer generated always as identity primary key
);

grant select on table public.fassungs_log to authenticated;

create or replace function public.merke_fassung()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.fassungs_log default values;
  return new;
end
$$;

create trigger trips_merke_fassung
  before update on public.trips
  for each row execute function public.merke_fassung();

-- Fassung vor der Korrektur: jede Kindänderung schreibt trips.revision.
create or replace function public.reise_graph_geaendert()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_setting('jetnity.graph_mutation', true) = '1' then
    return null;
  end if;

  update public.trips
     set revision = revision + 1
   where id in (select distinct trip_id from geaendert);

  return null;
end
$$;

revoke all on function public.reise_graph_geaendert() from public, anon, authenticated;

create trigger trip_stages_graph_ins
  after insert on public.trip_stages
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_stages_graph_upd
  after update on public.trip_stages
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_stages_graph_del
  after delete on public.trip_stages
  referencing old table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_days_graph_ins
  after insert on public.trip_days
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_days_graph_upd
  after update on public.trip_days
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_days_graph_del
  after delete on public.trip_days
  referencing old table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_items_graph_ins
  after insert on public.trip_items
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_items_graph_upd
  after update on public.trip_items
  referencing new table as geaendert
  for each statement execute function public.reise_graph_geaendert();
create trigger trip_items_graph_del
  after delete on public.trip_items
  referencing old table as geaendert
  for each statement execute function public.reise_graph_geaendert();

create or replace function public.probe_auth_loeschen(_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, auth, pg_temp
as $$
begin
  begin
    delete from auth.users where id = _id;
    return 'ok';
  exception when others then
    return sqlstate || ' ' || sqlerrm;
  end;
end
$$;

grant execute on function public.probe_auth_loeschen(uuid) to supabase_auth_admin;
