-- LOCAL-ONLY object removal for objects this package installed.
-- Uses the shared identity contract. No cascading drops. No role drop.
-- Removable states: ALREADY_INSTALLED or REVOKED_EXACT. Every other drift is refused.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';
SELECT pg_advisory_xact_lock(hashtext('jetnity.admin-account-counts.v1'));

DO $rollback$
DECLARE
  klass jsonb;
  state text;
BEGIN
  klass := (
    /* JETNITY_IDENTITY_SUBQUERY */
  );
  state := klass ->> 'state';

  IF state = 'FRESH' THEN
    RAISE NOTICE 'jetnity.rollout-prep.v1: rollback no-op, nothing installed';
    RETURN;
  END IF;

  IF state not in ('ALREADY_INSTALLED', 'REVOKED_EXACT') THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: rollback refused, package identity drifted: %', klass
      USING ERRCODE = 'XX000';
  END IF;

  IF coalesce((klass -> 'inventory' ->> 'unexpected_deps')::int, 0) > 0
     OR coalesce((klass -> 'inventory' ->> 'extra_object_count')::int, 0) > 0 THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: rollback refused, unexpected dependents or extras: %', klass
      USING ERRCODE = 'XX000';
  END IF;

  -- Explicit two-function drop, then empty-schema drop. Dependent leftovers refuse.
  DROP FUNCTION public.admin_account_counts_v1();
  DROP FUNCTION jetnity_reporting.account_counts_v1();
  DROP SCHEMA jetnity_reporting;
END
$rollback$;
