-- LOCAL-ONLY object removal for objects this package installed.
-- Identity/signature/owner/ACL must match. No CASCADE. No role drop.
-- Refuse drift, unexpected extras, or unexpected dependents.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';
SELECT pg_advisory_xact_lock(hashtext('jetnity.admin-account-counts.v1'));

DO $rollback$
DECLARE
  klass jsonb;
  producer_oid oid;
  wrapper_oid oid;
  unexpected_deps int;
BEGIN
  klass := (
    select jsonb_build_object(
      'state',
      case
        when not coalesce(inv.schema_exists, false)
         and not coalesce(inv.producer_exists, false)
         and not coalesce(inv.wrapper_exists, false)
          then 'FRESH'
        when coalesce(inv.schema_exists, false)
         and coalesce(inv.producer_ok, false)
         and coalesce(inv.wrapper_ok, false)
         and coalesce(inv.extra_object_count, 0) = 0
          then 'ALREADY_INSTALLED'
        else 'INCOMPATIBLE'
      end,
      'inventory', to_jsonb(inv)
    )
    from (
      select
        exists(select 1 from pg_namespace where nspname = 'jetnity_reporting') as schema_exists,
        exists(
          select 1 from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1' and p.pronargs = 0
        ) as producer_exists,
        exists(
          select 1 from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
        ) as wrapper_exists,
        (
          select count(*)::int
          from (
            select p.oid
            from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'jetnity_reporting'
              and not (p.proname = 'account_counts_v1' and p.pronargs = 0)
            union all
            select c.oid
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'jetnity_reporting'
              and c.relkind in ('r', 'v', 'm', 'S', 'p')
          ) extra
        ) as extra_object_count,
        (
          select
            pg_get_userbyid(p.proowner) = 'postgres'
            and p.prosecdef is true
            and p.pronargs = 0
            and has_function_privilege('authenticated', p.oid, 'EXECUTE')
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1' and p.pronargs = 0
        ) as producer_ok,
        (
          select
            pg_get_userbyid(p.proowner) not in ('anon', 'authenticated', 'service_role')
            and p.prosecdef is false
            and p.pronargs = 0
            and has_function_privilege('authenticated', p.oid, 'EXECUTE')
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
        ) as wrapper_ok
    ) inv
  );

  IF klass ->> 'state' = 'FRESH' THEN
    RAISE NOTICE 'jetnity.rollout-prep.v1: rollback no-op, nothing installed';
    RETURN;
  END IF;

  IF klass ->> 'state' IS DISTINCT FROM 'ALREADY_INSTALLED' THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: rollback refused, package identity drifted: %', klass
      USING ERRCODE = 'XX000';
  END IF;

  SELECT p.oid
    INTO producer_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'jetnity_reporting'
    AND p.proname = 'account_counts_v1'
    AND p.pronargs = 0;

  SELECT p.oid
    INTO wrapper_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'admin_account_counts_v1'
    AND p.pronargs = 0;

  SELECT count(*)::int
    INTO unexpected_deps
  FROM pg_depend d
  WHERE d.deptype = 'n'
    AND d.refobjid IN (producer_oid, wrapper_oid)
    AND d.objid IS DISTINCT FROM wrapper_oid
    AND d.objid IS DISTINCT FROM producer_oid;

  IF coalesce(unexpected_deps, 0) > 0 THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: rollback refused, unexpected dependents=%', unexpected_deps
      USING ERRCODE = 'XX000';
  END IF;

  -- Explicit two-function drop, then empty-schema drop. No CASCADE.
  DROP FUNCTION public.admin_account_counts_v1();
  DROP FUNCTION jetnity_reporting.account_counts_v1();
  DROP SCHEMA jetnity_reporting;
END
$rollback$;
