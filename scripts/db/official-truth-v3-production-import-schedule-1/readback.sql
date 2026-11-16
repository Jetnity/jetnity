-- Operator SELECTs only. No audit/tick/HTTP, secret values, request bodies or headers.
SELECT jsonb_build_object(
  'observedAt',clock_timestamp(),
  'operator',current_user,
  'database',current_database(),
  'providers',(SELECT jsonb_object_agg(extname,extversion) FROM pg_extension
    WHERE extname IN ('pg_cron','pg_net','supabase_vault','pgcrypto')),
  'signingKeyNames',(SELECT jsonb_object_agg(name,n) FROM (
    SELECT name,count(*) AS n FROM vault.secrets WHERE name='jetnity_prod_import_cron_v1' GROUP BY name) named),
  'state',(SELECT to_jsonb(s) FROM jetnity_prod_import_scheduler.state_v1 s WHERE singleton),
  'cron',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',j.jobid,'name',j.jobname,'schedule',j.schedule,
    'command',j.command,'database',j.database,'user',j.username,'active',j.active) ORDER BY j.jobname),'[]'::jsonb)
    FROM cron.job j WHERE j.jobname IN ('jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1','sync_profile_emails_hourly')),
  'guard',public.official_v3_guard_alarm_status_v1(),
  'import',public.jetnity_production_import_status_v1(),
  'quota',official_v3_guard_private.ch_de_quota_v2()
) AS production_import_status;

SELECT jsonb_build_object(
  'cycles',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.id),'[]'::jsonb) FROM (
    SELECT id,created_at,phase,state,phase_attempts,last_status,finished_at,published
    FROM jetnity_prod_import_scheduler.cycles_v1 ORDER BY id DESC LIMIT 10) c),
  'dispatches',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',d.id,'cycle',d.cycle_id,'phase',d.phase,
    'sentAt',d.dispatched_at,'processedAt',d.processed_at,'httpStatus',d.http_status,'outcome',d.outcome,
    'signatureVerified',d.outcome IN ('queued','published','complete','exhausted','busy','not_approved',
      'unavailable','access_required','request_refused','unresolved')) ORDER BY d.id),'[]'::jsonb)
    FROM (SELECT id,cycle_id,phase,dispatched_at,processed_at,http_status,outcome
      FROM jetnity_prod_import_scheduler.dispatches_v1 ORDER BY id DESC LIMIT 32) d)
) AS production_import_history;
