-- Isoliertes Bootstrap für den lokalen Mutation-Derived-Producer-Nachweis.
-- Niemals Production / Preview / Development. Keine Secrets. Kein Management-API.
--
-- Minimaler Supabase-ähnlicher Unterbau plus der bereits geltende Jetnity-
-- Grant/RLS-Vertrag für blocked_ips / security_events. Der zukünftige
-- Producer steht in der Companion-Datei
-- `security-events-producer-contract-lokal-contract.sql`.
--
-- Aktuell nachgeprüfte Plattformsemantik (21. September 2026):
-- - Data API = Grants UND RLS; fehlender Grant ist 42501 vor jeder Policy.
--   https://supabase.com/docs/guides/api/securing-your-api
-- - SECURITY DEFINER braucht festen/leeren search_path und qualifizierte Namen.
--   https://supabase.com/docs/guides/database/postgres/row-level-security
--   https://supabase.com/docs/guides/database/functions
-- - Neue public-Objekte werden ab 2026 nicht mehr automatisch an die Data API
--   gegeben; explizite GRANT bleiben Pflicht.
--   https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
--
-- Dieses Bootstrap bildet zuerst die historische Supabase-Voreinstellung nach
-- (volle Default-Rechte), damit ein späteres REVOKE etwas zu entziehen hat,
-- und wendet danach den Jetnity-Paarungsstand an: Grant nur dort, wo eine
-- Policy dieselbe Operation erlaubt.

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
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema if not exists auth;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- Historische Supabase-Default-Privilegien: jede neue public-Tabelle wäre
-- über die Data API erreichbar. Der Nachweis muss diese Voreinstellung
-- nachbilden, sonst misst ein REVOKE sich selbst.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

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

grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Kontrolltabelle: entsteht unter den Default-Privilegien und behält sie.
-- Solange ein Schreibversuch hier gelingt und auf security_events scheitert,
-- misst der Lauf den Grant-Unterschied und nicht ein leeres REVOKE.
create table public.acl_kontrolle (
  id uuid primary key default gen_random_uuid(),
  notiz text
);

comment on table public.acl_kontrolle is
  'Nur für den lokalen Nachweis: belegt, dass die nachgebildeten Supabase-Default-Privilegien wirksam sind.';

-- Minimale Rollenquelle. Kein Produkt-Schattenmodell; nur so viel, dass
-- moderator vs operator unterscheidbar ist.
create table public.creator_profiles (
  user_id uuid primary key,
  role text not null default 'user',
  status text not null default 'active'
);

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

alter table public.creator_profiles
  add constraint creator_profiles_role_check
  check (public.rollenrang(role) is not null);

alter table public.creator_profiles
  add constraint creator_profiles_status_check
  check (status in ('active', 'pending', 'disabled', 'banned'));

create or replace function public.aktuelle_rolle()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.creator_profiles p
  where p.user_id = (select auth.uid())
  limit 1
$$;

create or replace function public.hat_rolle_mindestens(minimum text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),
           false)
$$;

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

create or replace function public.darf_betrieb_lesen()
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

create or replace function public.darf_betrieb_eingreifen()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select public.hat_rolle_mindestens('operator')
     and public.aktuelles_admin_aal2()
$$;

-- Break-Glass bleibt eine UI-Grant-Art ohne DB-Recht. Ein JWT-Claim
-- `break_glass` darf diese Funktionen nicht wahr machen.
comment on function public.darf_betrieb_eingreifen() is
  'Fähigkeit betrieb-eingreifen: mindestens operator UND aktuelles AAL2. Break-Glass ersetzt das nicht.';

create table public.blocked_ips (
  ip text primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  ip text,
  user_id uuid,
  extra jsonb,
  created_at timestamptz not null default now(),
  metadata jsonb
);

alter table public.creator_profiles enable row level security;
alter table public.blocked_ips enable row level security;
alter table public.security_events enable row level security;

create policy blocked_ips_lesen on public.blocked_ips
  for select to authenticated using (public.darf_betrieb_lesen());
create policy blocked_ips_eingriff_anlegen on public.blocked_ips
  for insert to authenticated with check (public.darf_betrieb_eingreifen());
create policy blocked_ips_eingriff_aendern on public.blocked_ips
  for update to authenticated
  using (public.darf_betrieb_eingreifen())
  with check (public.darf_betrieb_eingreifen());
create policy blocked_ips_eingriff_loeschen on public.blocked_ips
  for delete to authenticated using (public.darf_betrieb_eingreifen());
create policy "blocked_ips service all" on public.blocked_ips
  to service_role using (true) with check (true);

create policy security_events_lesen on public.security_events
  for select to authenticated using (public.darf_betrieb_lesen());
create policy "security_events service all" on public.security_events
  to service_role using (true) with check (true);

-- Paarungsregel: Grant nur dort, wo eine Policy dieselbe Operation erlaubt.
revoke all on table public.blocked_ips from anon, authenticated;
revoke all on table public.security_events from anon, authenticated;
revoke all on table public.creator_profiles from anon, authenticated;

grant select, insert, update, delete on table public.blocked_ips to authenticated;
grant select on table public.security_events to authenticated;

grant all on table public.blocked_ips to service_role;
grant all on table public.security_events to service_role;

revoke all on function public.rollenrang(text) from public, anon;
revoke all on function public.aktuelle_rolle() from public, anon;
revoke all on function public.hat_rolle_mindestens(text) from public, anon;
revoke all on function public.aktuelles_admin_aal2() from public, anon;
revoke all on function public.darf_betrieb_lesen() from public, anon;
revoke all on function public.darf_betrieb_eingreifen() from public, anon;

grant execute on function public.rollenrang(text) to authenticated, service_role;
grant execute on function public.aktuelle_rolle() to authenticated, service_role;
grant execute on function public.hat_rolle_mindestens(text) to authenticated, service_role;
grant execute on function public.aktuelles_admin_aal2() to authenticated, service_role;
grant execute on function public.darf_betrieb_lesen() to authenticated, service_role;
grant execute on function public.darf_betrieb_eingreifen() to authenticated, service_role;

-- Ab hier brauchen neue Objekte explizite Grants. Das trifft den
-- 2026-04-28-Changelog: keine automatische Data-API-Exposition.
alter default privileges in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema public
  revoke all on functions from public, anon, authenticated, service_role;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated, service_role;
