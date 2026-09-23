-- LOCAL-ONLY postcondition check. Shared identity must be ALREADY_INSTALLED.
-- Additional safety: no client auth.users SELECT, no jetnity_internal leak.
DO $verify$
DECLARE
  klass jsonb;
  client_users_select boolean;
  internal_usage boolean;
  sentinel_alive boolean;
  unexpected_role boolean;
BEGIN
  klass := (
    /* JETNITY_IDENTITY_SUBQUERY */
  );
  IF klass ->> 'state' IS DISTINCT FROM 'ALREADY_INSTALLED' THEN
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
