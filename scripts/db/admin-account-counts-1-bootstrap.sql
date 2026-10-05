-- Isolated bootstrap for the local admin-account-counts proof.
-- Never Production / Preview / Development. No secrets. No Management API.
--
-- Two layers are kept distinct:
--
--   METADATA-FAITHFUL FIXTURE — objects invented here so the disposable
--   cluster can host the candidate. They match Technical-Lead 2026-09-22
--   Production metadata used as fixture-design evidence:
--     PostgreSQL TimeZone UTC;
--     auth.users RLS=true, FORCE RLS=false, owner=supabase_auth_admin,
--     no policies (default deny);
--     public.profiles RLS=true, owner=postgres;
--     existing postgres role NOSUPERUSER + BYPASSRLS + SELECT on
--     auth.users;
--     authenticated/anon SELECT auth.users=false;
--     authenticated/anon/service_role USAGE jetnity_internal=false;
--     auth.users column types/nullability as verified.
--   This is not a claim that Production was copied wholesale, and it
--   does not change any live postgres attributes or remote schema.
--
--   EXTRACTED SOURCE — function bodies copied from the named current
--   migration files. Helpers are not rewritten and not weakened.
--
-- #494's auth.users fixture has only `id` and cannot prove this contract.
-- Client roles must not become members of postgres.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- METADATA-FAITHFUL FIXTURE: Data-API roles + distinct auth owner +
-- trusted database postgres (NOSUPERUSER + BYPASSRLS).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    create role postgres
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      bypassrls;
  else
    alter role postgres with nosuperuser nologin nocreatedb nocreaterole noinherit bypassrls;
  end if;
end
$$;

comment on role postgres is
  'METADATA-FAITHFUL FIXTURE: NOSUPERUSER + BYPASSRLS, matching TL 2026-09-22 Production metadata. Not a live attribute change. Client roles must not inherit this role. Broader existing authority is documented; this is not Production privilege activation.';

comment on role supabase_auth_admin is
  'METADATA-FAITHFUL FIXTURE: distinct owner of auth.users. Not a live role change.';

create schema if not exists auth;
grant usage on schema auth to supabase_auth_admin;
grant usage on schema public to postgres;
grant usage on schema auth to postgres;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- Historical Supabase default privileges so a later REVOKE has something
-- to revoke. New reporting objects are created after these defaults are
-- withdrawn.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- METADATA-FAITHFUL FIXTURE: auth.users shape from TL Production
-- METADATA ONLY 2026-09-22. Verified columns/nullability only. Extra
-- columns are not invented. email/name are intentionally absent so they
-- cannot leak. RLS-on / FORCE RLS-off / no policies / distinct owner.
-- ---------------------------------------------------------------------------
create table auth.users (
  id uuid primary key,
  created_at timestamp with time zone,
  deleted_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  is_anonymous boolean not null
);

comment on table auth.users is
  'METADATA-FAITHFUL FIXTURE matching TL-verified types and RLS: id UUID NOT NULL; created_at/deleted_at/confirmed_at timestamptz NULLABLE; is_anonymous boolean NOT NULL; RLS=true; FORCE RLS=false; owner=supabase_auth_admin; no policies (default deny). Not a full Production catalog copy and not a live mutation.';

revoke all on table auth.users from public;
revoke all on table auth.users from anon;
revoke all on table auth.users from authenticated;
revoke all on table auth.users from service_role;

alter table auth.users enable row level security;
-- FORCE RLS remains false: table owner supabase_auth_admin bypasses RLS;
-- postgres bypasses via BYPASSRLS, not ownership. No policies = default deny
-- for every non-owner / non-BYPASSRLS role, including a SELECT grantee.
alter table auth.users owner to supabase_auth_admin;

-- Trusted database owner already has SELECT on live auth.users.
-- This fixture grant is not a client grant and is not created by the candidate.
grant select on table auth.users to postgres;

-- Session JWT helpers (same contract as #494 bootstrap).
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

create or replace function auth.jwt()
returns jsonb
language sql
stable
set search_path = pg_catalog
as $$
  select coalesce(
    nullif(nullif(current_setting('request.jwt.claims', true), ''), ''),
    '{}'
  )::jsonb;
$$;

grant execute on function auth.uid() to anon, authenticated, service_role, postgres;
grant execute on function auth.jwt() to anon, authenticated, service_role, postgres;

-- Control table: created under default privileges so the harness can prove
-- those defaults are live while auth.users SELECT remains denied.
create table public.acl_kontrolle (
  id uuid primary key default gen_random_uuid(),
  notiz text
);

-- ---------------------------------------------------------------------------
-- METADATA-FAITHFUL FIXTURE: minimal public.profiles role source.
-- aktuelle_rolle() reads profiles.role by auth.uid() and does not itself
-- establish an active/non-deleted caller (TL metadata).
-- RLS=true, owner=postgres.
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key,
  role text not null,
  status text not null default 'active'
);

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'creator', 'moderator', 'operator', 'admin', 'owner'));

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'pending', 'disabled', 'banned'));

comment on table public.profiles is
  'METADATA-FAITHFUL FIXTURE: only user_id/role/status, enough for extracted aktuelle_rolle(). RLS=true, owner=postgres. Not used to count target accounts.';

alter table public.profiles enable row level security;
alter table public.profiles owner to postgres;

-- ---------------------------------------------------------------------------
-- EXTRACTED SOURCE: public.rollenrang
-- from supabase/migrations/20260817100000_rollenmodell.sql
-- ---------------------------------------------------------------------------
create or replace function public.rollenrang(rolle text)
returns integer
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select case rolle
           when 'user'      then 0
           when 'creator'   then 10
           when 'moderator' then 20
           when 'operator'  then 30
           when 'admin'     then 40
           when 'owner'     then 50
         end
$$;

-- ---------------------------------------------------------------------------
-- EXTRACTED SOURCE: public.aktuelle_rolle
-- body from supabase/migrations/20260817120300_generisches_profil.sql
-- (looks up public.profiles.role by auth.uid(); SECURITY DEFINER;
-- does not establish active/non-deleted caller).
-- ---------------------------------------------------------------------------
create or replace function public.aktuelle_rolle()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- EXTRACTED SOURCE: public.hat_rolle_mindestens
-- from supabase/migrations/20260817100000_rollenmodell.sql
-- ---------------------------------------------------------------------------
create or replace function public.hat_rolle_mindestens(minimum text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),
           false)
$$;

-- ---------------------------------------------------------------------------
-- EXTRACTED SOURCE: public.aktuelles_admin_aal2
-- from supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql
-- ---------------------------------------------------------------------------
create or replace function public.aktuelles_admin_aal2()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
$$;

-- ---------------------------------------------------------------------------
-- EXTRACTED SOURCE: public.darf_konten_verwalten
-- from supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql
-- ---------------------------------------------------------------------------
create or replace function public.darf_konten_verwalten()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('moderator')
     and public.aktuelles_admin_aal2()
$$;

revoke all on function public.rollenrang(text) from public, anon;
revoke all on function public.aktuelle_rolle() from public, anon;
revoke all on function public.hat_rolle_mindestens(text) from public, anon;
revoke all on function public.aktuelles_admin_aal2() from public, anon;
revoke all on function public.darf_konten_verwalten() from public, anon;

grant execute on function public.rollenrang(text) to authenticated, service_role, postgres;
grant execute on function public.aktuelle_rolle() to authenticated, service_role, postgres;
grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role, postgres;
grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role, postgres;
grant execute on function public.darf_konten_verwalten() to authenticated, service_role, postgres;

-- New objects need explicit grants (2026 Data API default).
alter default privileges in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema public
  revoke all on functions from public, anon, authenticated, service_role;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- FIXTURE SUBSTITUTE: locked jetnity_internal canary.
-- The candidate must not grant USAGE/SELECT/EXECUTE here.
-- ---------------------------------------------------------------------------
create schema if not exists jetnity_internal;
revoke all on schema jetnity_internal from public;
revoke all on schema jetnity_internal from anon;
revoke all on schema jetnity_internal from authenticated;
revoke all on schema jetnity_internal from service_role;

comment on schema jetnity_internal is
  'FIXTURE SUBSTITUTE canary. Locked. Candidate must not grant client usage.';
