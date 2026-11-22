-- Reviewed transaction body; package.mjs supplies SERIALIZABLE, target, action and the fresh snapshot digest.
-- Exactly one existing scheduler flag changes. No DDL, direct table UPDATE or new privileges.
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SET LOCAL idle_in_transaction_session_timeout = '10s';
DO $profile_cron_transition$
DECLARE
  target text := current_setting('jetnity.profile_cron_target', true);
  action text := current_setting('jetnity.profile_cron_action', true);
  expected_digest text := current_setting('jetnity.profile_cron_before_sha256', true);
  expected_active boolean;
  next_active boolean;
  expected_job jsonb;
  before_jobs jsonb;
  after_jobs jsonb;
  intended_jobs jsonb;
  api oid := to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)');
  job_table oid := to_regclass('cron.job');
BEGIN
  IF target IS NULL OR target NOT IN (
      'local:owned:PROFILE-CRON1',
      'production:qscbgcdmivbbnzrcyegn:PROFILE-CRON1')
    OR current_database() <> 'postgres'
    OR current_user <> 'postgres' OR session_user <> 'postgres'
    OR current_setting('transaction_isolation') <> 'serializable'
    OR current_setting('transaction_read_only') <> 'off'
    OR current_setting('session_replication_role') <> 'origin' THEN
    RAISE EXCEPTION 'profile_cron: explicit verified target, postgres and SERIALIZABLE required'
      USING ERRCODE = 'P7C01';
  END IF;
  IF action IS NULL OR action NOT IN ('deactivate', 'rollback')
    OR expected_digest IS NULL OR expected_digest !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'profile_cron: exact action and fresh complete cron digest required'
      USING ERRCODE = 'P7C02';
  END IF;
  IF action = 'rollback' AND current_setting('jetnity.profile_cron_rollback_ack', true)
    IS DISTINCT FROM 'REACTIVATES_THE_MISSING_FUNCTION_JOB' THEN
    RAISE EXCEPTION 'profile_cron: rollback explicitly reactivates the still-broken legacy job'
      USING ERRCODE = 'P7C03';
  END IF;
  IF (SELECT NOT rolsuper AND rolbypassrls FROM pg_roles WHERE rolname = current_user) IS DISTINCT FROM true
    OR NOT has_table_privilege(current_user, 'cron.job', 'SELECT')
    OR has_table_privilege(current_user, 'cron.job', 'UPDATE') THEN
    RAISE EXCEPTION 'profile_cron: observed non-superuser, full-read, SELECT-only authority required'
      USING ERRCODE = 'P7C04';
  END IF;
  IF api IS NULL OR (SELECT p.proowner = 'supabase_admin'::regrole AND NOT p.prosecdef
      AND p.prorettype = 'void'::regtype AND p.prokind = 'f'
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'c') AND p.prosrc = 'cron_alter_job'
      AND p.probin = '$libdir/pg_cron'
      AND EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
          AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e'
          AND e.extname = 'pg_cron' AND e.extowner = 'supabase_admin'::regrole
          -- Upstream v1.6.4 source still declares SQL extension version 1.6.
          -- Hosted Supabase's observed package declares 1.6.4; do not fake either identity.
          AND e.extversion = CASE WHEN target = 'local:owned:PROFILE-CRON1' THEN '1.6' ELSE '1.6.4' END)
      FROM pg_proc p WHERE p.oid = api) IS DISTINCT FROM true
    OR NOT has_function_privilege(current_user, api, 'EXECUTE') THEN
    RAISE EXCEPTION 'profile_cron: exact installed provider API required'
      USING ERRCODE = 'P7C05';
  END IF;
  -- Bind the real provider relation and its sole standard cache trigger. A
  -- row-only digest cannot exclude effects of an unreviewed trigger or rule.
  IF job_table IS NULL OR (SELECT c.relowner = 'supabase_admin'::regrole
      AND c.relkind = 'r' AND c.relpersistence = 'p'
      AND c.relrowsecurity AND NOT c.relforcerowsecurity
      AND EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid
          AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e'
          AND e.extname = 'pg_cron' AND e.extowner = 'supabase_admin'::regrole)
      FROM pg_class c WHERE c.oid = job_table) IS DISTINCT FROM true
    OR EXISTS (SELECT 1 FROM pg_rewrite WHERE ev_class = job_table)
    OR (SELECT count(*) FROM pg_trigger WHERE tgrelid = job_table) <> 1
    OR (SELECT t.tgname = 'cron_job_cache_invalidate' AND t.tgtype = 60
      AND t.tgenabled = 'O' AND NOT t.tgisinternal AND t.tgnargs = 0
      AND t.tgqual IS NULL AND t.tgattr::text = '' AND octet_length(t.tgargs) = 0
      AND t.tgconstraint = 0 AND NOT t.tgdeferrable AND NOT t.tginitdeferred
      AND t.tgoldtable IS NULL AND t.tgnewtable IS NULL
      AND p.oid = to_regprocedure('cron.job_cache_invalidate()')
      AND p.proowner = 'supabase_admin'::regrole AND NOT p.prosecdef
      AND p.prokind = 'f' AND p.prorettype = 'trigger'::regtype
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'c') AND p.prosrc = 'cron_job_cache_invalidate'
      AND p.probin = '$libdir/pg_cron'
      AND EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
          AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e'
          AND e.extname = 'pg_cron' AND e.extowner = 'supabase_admin'::regrole)
      FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE t.tgrelid = job_table) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'profile_cron: provider relation, cache trigger or rule contract changed'
      USING ERRCODE = 'P7C09';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'sync_creator_profile_core') THEN
    RAISE EXCEPTION 'profile_cron: legacy function or overload exists; independent review required'
      USING ERRCODE = 'P7C06';
  END IF;
  expected_active := action = 'deactivate';
  next_active := NOT expected_active;
  expected_job := jsonb_build_object('jobid', 1, 'jobname', 'sync_profile_emails_hourly',
    'schedule', '@hourly', 'command', ' select public.sync_creator_profile_core(); ',
    'database', 'postgres', 'username', 'postgres', 'nodename', 'localhost',
    'nodeport', 5432, 'active', expected_active);
  SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)
    INTO before_jobs FROM cron.job j;
  IF encode(sha256(convert_to(before_jobs::text, 'UTF8')), 'hex') IS DISTINCT FROM expected_digest
    OR (SELECT count(*) FROM cron.job WHERE jobname = 'sync_profile_emails_hourly') <> 1
    OR (SELECT to_jsonb(j) FROM cron.job j WHERE j.jobid = 1) IS DISTINCT FROM expected_job THEN
    RAISE EXCEPTION 'profile_cron: current complete snapshot or exact job changed; stop without retry'
      USING ERRCODE = 'P7C07';
  END IF;
  SELECT jsonb_agg(CASE WHEN (j.value->>'jobid')::bigint = 1
      THEN jsonb_set(j.value, '{active}', to_jsonb(next_active), false) ELSE j.value END
      ORDER BY (j.value->>'jobid')::bigint)
    INTO intended_jobs FROM jsonb_array_elements(before_jobs) j;

  -- The genuine pg_cron C implementation checks ownership and performs this UPDATE
  -- with its extension owner; SERIALIZABLE rejects a stale concurrently changed row.
  PERFORM cron.alter_job(1::bigint, NULL::text, NULL::text, NULL::text, NULL::text, next_active);

  SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)
    INTO after_jobs FROM cron.job j;
  IF after_jobs IS DISTINCT FROM intended_jobs
    OR current_user <> 'postgres' OR session_user <> 'postgres'
    OR has_table_privilege(current_user, 'cron.job', 'UPDATE') THEN
    RAISE EXCEPTION 'profile_cron: result is not the single approved active-flag transition'
      USING ERRCODE = 'P7C08';
  END IF;
END
$profile_cron_transition$;
SELECT jsonb_build_object(
  'schema', 1, 'observed_at', clock_timestamp(),
  'action', current_setting('jetnity.profile_cron_action'),
  'active', (SELECT active FROM cron.job WHERE jobid = 1),
  'cron_count', (SELECT count(*) FROM cron.job),
  'cron_sha256', (SELECT encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)::text, 'UTF8')), 'hex') FROM cron.job j)
) AS profile_cron_receipt;
