-- LOCAL / UNAPPLIED candidate — not a migration.
--
-- Metric: jetnity.admin-account-counts.v1
-- Privilege: narrow SECURITY DEFINER aggregate over protected auth.users.
-- This file must stay outside supabase/migrations/. Migration runners
-- discover that directory; applying this as Production SQL is a later
-- reserved Product-Owner gate after independent review.
--
-- SECURITY DEFINER is required because authenticated callers must not
-- receive SELECT on auth.users, yet the only truthful registration
-- measure is an aggregate of those rows. The function returns two
-- counts, one database clock and the fixed window — never row
-- identities. Authorization is evaluated before the aggregate:
--   1. auth.uid() is present;
--   2. that caller exists in auth.users, is not soft-deleted and is
--      not anonymous;
--   3. public.darf_konten_verwalten() (extracted current contract:
--      hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2()).
-- Deny raises SQLSTATE 42501. It never returns a success row of zeros.
--
-- Objects are fully qualified. search_path is pinned to pg_catalog.
-- No dynamic SQL. PUBLIC / anon / service_role execution is revoked.
-- authenticated receives only USAGE on this new schema and EXECUTE on
-- this function. No grant is made on jetnity_internal. No SELECT on
-- auth.users is granted to client roles.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jetnity_reporting_owner') then
    create role jetnity_reporting_owner
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit;
  end if;
end
$$;

grant usage on schema auth to jetnity_reporting_owner;
grant select on table auth.users to jetnity_reporting_owner;
grant execute on function auth.uid() to jetnity_reporting_owner;
grant execute on function auth.jwt() to jetnity_reporting_owner;
grant execute on function public.rollenrang(text) to jetnity_reporting_owner;
grant execute on function public.aktuelle_rolle() to jetnity_reporting_owner;
grant execute on function public.hat_rolle_mindestens(text) to jetnity_reporting_owner;
grant execute on function public.aktuelles_admin_aal2() to jetnity_reporting_owner;
grant execute on function public.darf_konten_verwalten() to jetnity_reporting_owner;

create schema if not exists jetnity_reporting authorization jetnity_reporting_owner;

revoke all on schema jetnity_reporting from public;
revoke all on schema jetnity_reporting from anon;
revoke all on schema jetnity_reporting from authenticated;
revoke all on schema jetnity_reporting from service_role;
grant usage on schema jetnity_reporting to authenticated;

alter default privileges for role jetnity_reporting_owner in schema jetnity_reporting
  revoke execute on functions from public;
alter default privileges for role jetnity_reporting_owner in schema jetnity_reporting
  revoke execute on functions from anon;
alter default privileges for role jetnity_reporting_owner in schema jetnity_reporting
  revoke execute on functions from authenticated;
alter default privileges for role jetnity_reporting_owner in schema jetnity_reporting
  revoke execute on functions from service_role;

create or replace function jetnity_reporting.account_counts_v1()
returns table (
  present_registered_accounts bigint,
  created_in_prior_30_days bigint,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  _uid uuid;
  _caller_present boolean;
  _measured_at timestamp with time zone;
  _window_start timestamp with time zone;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  select exists (
    select 1
      from auth.users as u
     where u.id = _uid
       and u.deleted_at is null
       and u.is_anonymous is false
  )
    into _caller_present;

  if not coalesce(_caller_present, false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  if not coalesce(public.darf_konten_verwalten(), false) then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- One transaction-stable database clock. UTC interpretation of timestamptz
  -- is independent of the session TimeZone. Half-open [window_start, measured_at).
  _measured_at := pg_catalog.now();
  _window_start := _measured_at - interval '30 days';

  return query
  select
    count(*)::bigint,
    count(*) filter (
      where u.created_at is not null
        and u.created_at >= _window_start
        and u.created_at < _measured_at
    )::bigint,
    _measured_at,
    _window_start,
    'jetnity.admin-account-counts.v1'::text
  from auth.users as u
  where u.deleted_at is null
    and u.is_anonymous is false;
end
$$;

alter function jetnity_reporting.account_counts_v1() owner to jetnity_reporting_owner;

comment on schema jetnity_reporting is
  'LOCAL/UNAPPLIED reporting schema. Not exposed as a Data API RPC. No grant on jetnity_internal.';

comment on function jetnity_reporting.account_counts_v1() is
  'jetnity.admin-account-counts.v1: present non-anonymous auth accounts and the subset created in a fixed rolling 30-day half-open window. SECURITY DEFINER only to aggregate auth.users without granting client SELECT. Deny is 42501, never a zero success row. created_at NULL counts in present and not in the window. Future timestamps do not count in the prior 30 days. No profile join. Test/internal/unconfirmed rows are included when present. Caller must exist, not be anonymous or soft-deleted, and pass public.darf_konten_verwalten(). Authorized present_count is at least 1 because that caller is themselves a present account.';

revoke all on function jetnity_reporting.account_counts_v1() from public;
revoke all on function jetnity_reporting.account_counts_v1() from anon;
revoke all on function jetnity_reporting.account_counts_v1() from service_role;
revoke all on function jetnity_reporting.account_counts_v1() from authenticated;
grant execute on function jetnity_reporting.account_counts_v1() to authenticated;
