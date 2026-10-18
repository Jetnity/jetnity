-- R76 Trip Ownership Native RLS 1 — test-only Bootstrap.
--
-- Läuft ausschliesslich als Superuser des eigenen Wegwerf-Clusters aus
-- startLocalProofCluster(), je Datenbank einmal, VOR der unveränderten
-- Original-Migration supabase/migrations/20260817120000_reiseschema.sql.
-- Niemals gegen Supabase, Development oder Production.
--
-- Bildet nur nach, was die Migration und der Nachweis voraussetzen:
--
--   · Rollen wie bei Supabase/PostgREST: `authenticator` meldet sich an und
--     wechselt je Anfrage per `set local role` in `anon` oder `authenticated`.
--     Keine dieser Rollen ist Superuser oder hat BYPASSRLS.
--   · `postgres` als Eigentümerin der Migration (bei Supabase führt `postgres`
--     die Migrationen aus). Hier ohne Login, ohne Superuser, ohne BYPASSRLS.
--   · `service_role` nur, weil die Migration ihr ein EXECUTE-Recht gibt.
--     Abweichung von Supabase: hier NOBYPASSRLS und niemandem gewährt.
--   · `auth.users` nur mit `id`, Ziel des Fremdschlüssels `trips.user_id`.
--   · `auth.uid()` wörtlich wie bei Supabase aus den JWT-Claims der Sitzung.
--   · Der Default-Privilegien-Vorzustand direkt vor der Migration:
--     20260815060111_baseline.sql gibt `postgres`-Tabellen in `public` von
--     sich aus Rechte an anon, authenticated und service_role;
--     20260817100300_rechte.sql entzieht sie anon und authenticated wieder.
--     Beides wird hier in dieser Reihenfolge nachgebildet, damit `trips` und
--     `trip_stages` genau die Rechte bekommen, die die Migration selbst vergibt.

-- Rollen sind clusterweit, deshalb idempotent.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    create role postgres nologin nosuperuser nobypassrls noinherit nocreatedb nocreaterole;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin nosuperuser nobypassrls noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin nosuperuser nobypassrls noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin nosuperuser nobypassrls noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login nosuperuser nobypassrls noinherit nocreatedb nocreaterole;
  end if;
  if not pg_has_role('authenticator', 'anon', 'MEMBER') then
    grant anon to authenticator;
  end if;
  if not pg_has_role('authenticator', 'authenticated', 'MEMBER') then
    grant authenticated to authenticator;
  end if;
end
$$;

create schema auth;
grant usage on schema auth to postgres, anon, authenticated, service_role;

create table auth.users (
  id uuid primary key
);
grant references on table auth.users to postgres;

create function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage, create on schema public to postgres;

-- 20260815060111_baseline.sql
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;

-- 20260817100300_rechte.sql
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
