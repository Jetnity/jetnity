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
--      hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2());
--   4. that same caller has a persisted public.profiles row whose
--      status is exactly active. banned / disabled / pending / NULL /
--      missing / unrecognized status denies. This is a feature-local
--      caller prerequisite, not a filter on the counted population.
-- Deny raises SQLSTATE 42501. It never returns a success row of zeros.
--
-- Trusted execution owner is the existing database role `postgres`,
-- represented in the local fixture as NOSUPERUSER + BYPASSRLS with
-- SELECT on auth.users. That matches the Technical-Lead 2026-09-22
-- Production metadata used as fixture evidence. This file does not
-- create a new BYPASSRLS / global privilege role, does not grant
-- auth.users to clients, and does not alter managed auth.users
-- policies. `postgres` already has broader authority than this
-- function; a later Production port still needs a fresh
-- metadata/ownership/ACL review and a reserved Product-Owner gate.
--
-- Objects are fully qualified. search_path is pinned to pg_catalog.
-- TimeZone is pinned to UTC. The window is a fixed 720-hour
-- (30×24) half-open interval, not session-DST calendar days.
-- No dynamic SQL. PUBLIC / anon / service_role execution is revoked.
-- authenticated receives only USAGE on this new schema and EXECUTE on
-- this function. No grant is made on jetnity_internal. No SELECT on
-- auth.users is granted to client roles.

create schema if not exists jetnity_reporting;

revoke all on schema jetnity_reporting from public;
revoke all on schema jetnity_reporting from anon;
revoke all on schema jetnity_reporting from authenticated;
revoke all on schema jetnity_reporting from service_role;
grant usage on schema jetnity_reporting to authenticated;

alter default privileges in schema jetnity_reporting
  revoke execute on functions from public;
alter default privileges in schema jetnity_reporting
  revoke execute on functions from anon;
alter default privileges in schema jetnity_reporting
  revoke execute on functions from authenticated;
alter default privileges in schema jetnity_reporting
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
set timezone = 'UTC'
as $$
declare
  _uid uuid;
  _caller_present boolean;
  _caller_status text;
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

  -- Feature-local caller-status prerequisite. Fully qualified because
  -- search_path is pinned to pg_catalog. A missing row leaves
  -- _caller_status NULL. Only exactly active may continue. This does
  -- not join the metric population.
  select p.status
    into _caller_status
    from public.profiles as p
   where p.user_id = _uid;

  if _caller_status is distinct from 'active' then
    raise exception 'jetnity.admin-account-counts.v1: not authorized'
      using errcode = '42501';
  end if;

  -- One transaction-stable database clock. Fixed 30×24 hours, not
  -- session-DST calendar days. Half-open [window_start, measured_at).
  _measured_at := pg_catalog.now();
  _window_start := _measured_at - interval '720 hours';

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

alter function jetnity_reporting.account_counts_v1() owner to postgres;

comment on schema jetnity_reporting is
  'LOCAL/UNAPPLIED reporting schema. Not exposed as a Data API RPC. No grant on jetnity_internal. Owned functions execute as the trusted postgres role (fixture: NOSUPERUSER+BYPASSRLS).';

comment on function jetnity_reporting.account_counts_v1() is
  'jetnity.admin-account-counts.v1: present non-anonymous auth accounts and the subset created in a fixed 720-hour half-open window. SECURITY DEFINER owned by postgres so RLS-protected auth.users can be aggregated without client SELECT or a new BYPASSRLS role. Deny is 42501, never a zero success row. created_at NULL counts in present and not in the window. Future timestamps do not count in the prior 720 hours. Metric population has no profile join; banned/internal/unconfirmed rows remain counted when the auth account belongs to the accepted population. Caller must exist, not be anonymous or soft-deleted, pass public.darf_konten_verwalten(), and have a persisted public.profiles.status of exactly active. Authorized present_count is at least 1 because that caller is themselves a present account.';

revoke all on function jetnity_reporting.account_counts_v1() from public;
revoke all on function jetnity_reporting.account_counts_v1() from anon;
revoke all on function jetnity_reporting.account_counts_v1() from service_role;
revoke all on function jetnity_reporting.account_counts_v1() from authenticated;
grant execute on function jetnity_reporting.account_counts_v1() to authenticated;
