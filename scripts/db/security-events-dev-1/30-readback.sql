-- Read-only catalog and health readback.
-- Do not add user, IP, token, or payload rows to this statement.
-- A caller-supplied database name is not project identity.
-- The timeout is set before the readback statement. date_part is an ordinary
-- function call; pg_catalog.extract(epoch FROM ...) is not valid SQL.

BEGIN;
SET LOCAL statement_timeout = '5s';
SELECT pg_catalog.jsonb_build_object(
  'database_timezone', pg_catalog.current_setting('TimeZone'),
  'timezone_offset_seconds', pg_catalog.date_part('timezone', pg_catalog.now()),
  'cron_timezone', pg_catalog.current_setting('cron.timezone', true),
  'pg_cron', (
    SELECT extversion
      FROM pg_catalog.pg_extension
     WHERE extname = 'pg_cron'
  ),
  'control', (
    SELECT pg_catalog.jsonb_build_object(
      'state', c.state,
      'retention', c.retention::text,
      'cap', c.cap,
      'schedule', c.schedule,
      'job_name', c.job_name,
      'last_success_kind', c.last_success_kind,
      'last_success_age_seconds',
        CASE
          WHEN c.last_success_at IS NULL THEN NULL
          ELSE pg_catalog.date_part('epoch', pg_catalog.clock_timestamp() - c.last_success_at)
        END
    )
    FROM jetnity_internal.security_event_dev_control c
    WHERE c.id = 'dev_v1'
  ),
  'health', jetnity_internal.security_event_dev_health_state(),
  'quota', (
    SELECT pg_catalog.jsonb_build_object('used', q.used, 'cap', q.cap, 'enabled', q.enabled)
      FROM jetnity_internal.security_event_producer_quota q
     WHERE q.id = 'tracked_producer'
  ),
  'origin_count', (SELECT count(*) FROM jetnity_internal.security_event_producer_origin),
  'job', (
    SELECT pg_catalog.jsonb_build_object(
      'schedule', j.schedule,
      'command', j.command,
      'active', j.active,
      'database', j.database
    )
    FROM cron.job j
    WHERE j.jobname = jetnity_internal.security_event_dev_job_name()
    LIMIT 1
  ),
  'trigger_fault', jetnity_internal.security_event_dev_trigger_fault(),
  'catalog_fault', jetnity_internal.security_event_dev_catalog_fault(),
  'producer_triggers', (
    SELECT count(*)
      FROM pg_catalog.pg_trigger t
     WHERE NOT t.tgisinternal
       AND t.tgname LIKE 'security_event_dev_v1_%'
  ),
  'authenticated_event_insert', pg_catalog.has_table_privilege(
    'authenticated', 'public.security_events', 'INSERT'
  ),
  'service_role_event_insert', pg_catalog.has_table_privilege(
    'service_role', 'public.security_events', 'INSERT'
  ),
  'service_role_origin_insert', pg_catalog.has_table_privilege(
    'service_role', 'jetnity_internal.security_event_producer_origin', 'INSERT'
  )
);
COMMIT;
