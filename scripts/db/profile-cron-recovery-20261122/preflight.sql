BEGIN READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '3s';
SET LOCAL lock_timeout = '1s';
SELECT jsonb_build_object(
  'schema', 1, 'observed_at', clock_timestamp(),
  'database', current_database(), 'actor', current_user, 'session_actor', session_user,
  'actor_is_superuser', (SELECT rolsuper FROM pg_roles WHERE rolname = current_user),
  'actor_bypasses_rls', (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user),
  'session_replication_role', current_setting('session_replication_role'),
  'cron_select', has_table_privilege(current_user, 'cron.job', 'SELECT'),
  'cron_direct_update', has_table_privilege(current_user, 'cron.job', 'UPDATE'),
  'cron_relation', (SELECT jsonb_build_object('owner', pg_get_userbyid(c.relowner),
    'kind', c.relkind, 'persistence', c.relpersistence, 'rls', c.relrowsecurity,
    'force_rls', c.relforcerowsecurity, 'extension_member', EXISTS (
      SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid
        AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e'
        AND e.extname = 'pg_cron' AND e.extowner = 'supabase_admin'::regrole))
    FROM pg_class c WHERE c.oid = 'cron.job'::regclass),
  'cron_triggers', (SELECT jsonb_agg(jsonb_build_object('name', t.tgname,
    'type', t.tgtype, 'enabled', t.tgenabled, 'internal', t.tgisinternal,
    'arguments', t.tgnargs, 'has_condition', t.tgqual IS NOT NULL,
    'definition', pg_get_triggerdef(t.oid), 'function', p.oid::regprocedure::text,
    'function_owner', pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef,
    'language', l.lanname, 'symbol', p.prosrc, 'library', p.probin,
    'extension_member', EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
        AND d.refclassid = 'pg_extension'::regclass AND d.deptype = 'e'
        AND e.extname = 'pg_cron' AND e.extowner = 'supabase_admin'::regrole)) ORDER BY t.tgname)
    FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_language l ON l.oid = p.prolang WHERE t.tgrelid = 'cron.job'::regclass),
  'cron_rule_count', (SELECT count(*) FROM pg_rewrite WHERE ev_class = 'cron.job'::regclass),
  'extension_version', (SELECT extversion FROM pg_extension WHERE extname = 'pg_cron'),
  'api', (SELECT jsonb_build_object('owner', pg_get_userbyid(p.proowner),
    'security_definer', p.prosecdef, 'language', l.lanname, 'symbol', p.prosrc, 'library', p.probin,
    'execute', has_function_privilege(current_user, p.oid, 'EXECUTE'))
    FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
    WHERE p.oid = to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)')),
  'legacy_function_count', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sync_creator_profile_core'),
  'target_count', (SELECT count(*) FROM cron.job WHERE jobname = 'sync_profile_emails_hourly'),
  'target', (SELECT to_jsonb(j) FROM cron.job j WHERE j.jobid = 1),
  'cron_count', (SELECT count(*) FROM cron.job),
  'cron_sha256', (SELECT encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)::text, 'UTF8')), 'hex') FROM cron.job j),
  'other_jobs_sha256', (SELECT encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)::text, 'UTF8')), 'hex')
    FROM cron.job j WHERE j.jobid <> 1)
) AS profile_cron_preflight;
ROLLBACK;
