-- LOCAL-ONLY postcondition check for the accepted account-count package.
-- Raises on failure. Does not drop dependent objects. Never hosted SQL.
DO $verify$
DECLARE
  klass jsonb;
  state text;
  client_users_select boolean;
  internal_usage boolean;
  sentinel_alive boolean;
  unexpected_role boolean;
BEGIN
  klass := (
    -- inline the same classification query
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
            and p.provolatile = 's'
            and p.pronargs = 0
            and has_function_privilege('authenticated', p.oid, 'EXECUTE')
            and not has_function_privilege('anon', p.oid, 'EXECUTE')
            and not has_function_privilege('service_role', p.oid, 'EXECUTE')
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'jetnity_reporting'
            and p.proname = 'account_counts_v1' and p.pronargs = 0
        ) as producer_ok,
        (
          select
            pg_get_userbyid(p.proowner) not in ('anon', 'authenticated', 'service_role')
            and p.prosecdef is false
            and p.provolatile = 's'
            and p.pronargs = 0
            and has_function_privilege('authenticated', p.oid, 'EXECUTE')
            and not has_function_privilege('anon', p.oid, 'EXECUTE')
            and not has_function_privilege('service_role', p.oid, 'EXECUTE')
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
        ) as wrapper_ok
    ) inv
  );
  state := klass ->> 'state';
  IF state IS DISTINCT FROM 'ALREADY_INSTALLED' THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: verify expected ALREADY_INSTALLED, got %', klass
      USING ERRCODE = 'XX000';
  END IF;

  SELECT has_table_privilege('authenticated', 'auth.users', 'SELECT')
      OR has_table_privilege('anon', 'auth.users', 'SELECT')
      OR has_table_privilege('service_role', 'auth.users', 'SELECT')
    INTO client_users_select;
  IF coalesce(client_users_select, false) THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: client SELECT on auth.users is present'
      USING ERRCODE = '42501';
  END IF;

  SELECT has_schema_privilege('authenticated', 'jetnity_internal', 'USAGE')
      OR has_schema_privilege('anon', 'jetnity_internal', 'USAGE')
      OR has_schema_privilege('service_role', 'jetnity_internal', 'USAGE')
    INTO internal_usage;
  IF coalesce(internal_usage, false) THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: jetnity_internal USAGE leaked'
      USING ERRCODE = '42501';
  END IF;

  SELECT exists(select 1 from pg_roles where rolname = 'jetnity_reporting_owner')
    INTO unexpected_role;
  IF unexpected_role THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: unexpected privilege role'
      USING ERRCODE = 'XX000';
  END IF;

  SELECT exists(
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'jetnity_rollout_sentinel'
  )
    INTO sentinel_alive;
  IF NOT coalesce(sentinel_alive, false) THEN
    RAISE EXCEPTION 'jetnity.rollout-prep.v1: unrelated sentinel missing'
      USING ERRCODE = 'XX000';
  END IF;
END
$verify$;
