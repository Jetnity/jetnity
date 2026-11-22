BEGIN READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '3s';
SET LOCAL lock_timeout = '1s';
SELECT jsonb_build_object(
  'schema', 1, 'observed_at', clock_timestamp(),
  'database', current_database(), 'actor', current_user,
  'exact_inactive_job', (SELECT to_jsonb(j) = jsonb_build_object(
    'jobid', 1, 'jobname', 'sync_profile_emails_hourly', 'schedule', '@hourly',
    'command', ' select public.sync_creator_profile_core(); ', 'database', 'postgres',
    'username', 'postgres', 'nodename', 'localhost', 'nodeport', 5432, 'active', false)
    FROM cron.job j WHERE jobid = 1),
  'target_count', (SELECT count(*) FROM cron.job WHERE jobname = 'sync_profile_emails_hourly'),
  'cron_direct_update', has_table_privilege(current_user, 'cron.job', 'UPDATE'),
  'legacy_function_count', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sync_creator_profile_core'),
  'cron_count', (SELECT count(*) FROM cron.job),
  'cron_sha256', (SELECT encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)::text, 'UTF8')), 'hex') FROM cron.job j),
  'other_jobs_sha256', (SELECT encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.jobid), '[]'::jsonb)::text, 'UTF8')), 'hex')
    FROM cron.job j WHERE j.jobid <> 1)
) AS profile_cron_readback;
ROLLBACK;
