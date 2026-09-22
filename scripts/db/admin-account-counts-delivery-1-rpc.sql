-- LOCAL / UNAPPLIED wrapper — not a migration.
--
-- public.admin_account_counts_v1()
-- Zero-argument STABLE SECURITY INVOKER wrapper over the accepted
-- jetnity_reporting.account_counts_v1() producer. This file must stay
-- outside the versioned migration discovery directory. Applying this
-- as hosted SQL is a later reserved
-- Product-Owner gate after independent review.
--
-- The wrapper does not read protected auth rows, does not add another
-- elevated-definer function, does not create a role, does not grant
-- client table access, does not alter managed-auth policy, and does not
-- grant on jetnity_internal.
-- Schema exposure stays limited to this public function. The private
-- reporting schema is not added to exposed schemas.
--
-- The two bigint counts are converted to canonical decimal TEXT for
-- transport so JSON/JavaScript cannot silently round large values.
-- Counting semantics stay entirely in the accepted producer.

create or replace function public.admin_account_counts_v1()
returns table (
  present_registered_accounts text,
  created_in_prior_30_days text,
  measured_at timestamp with time zone,
  window_start timestamp with time zone,
  definition_version text
)
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select
    pg_catalog.btrim(inner_row.present_registered_accounts::text),
    pg_catalog.btrim(inner_row.created_in_prior_30_days::text),
    inner_row.measured_at,
    inner_row.window_start,
    inner_row.definition_version
  from jetnity_reporting.account_counts_v1() as inner_row;
$$;

comment on function public.admin_account_counts_v1() is
  'LOCAL/UNAPPLIED SECURITY INVOKER wrapper over jetnity_reporting.account_counts_v1(). Transport-only canonical decimal text for the two accepted counts. Zero arguments. Deny remains the inner 42501. Not a migration and not live statistics.';

revoke all on function public.admin_account_counts_v1() from public;
revoke all on function public.admin_account_counts_v1() from anon;
revoke all on function public.admin_account_counts_v1() from service_role;
revoke all on function public.admin_account_counts_v1() from authenticated;
grant execute on function public.admin_account_counts_v1() to authenticated;
