-- Prepared Production action. Execute only after the separate Production approval.
-- Re-enabling the exact stopped job preserves all original requests and budgets.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $activate$
DECLARE
  scheduled_job_id bigint;
  existing_jobs integer;
  quota jsonb;
  command_value constant text:='SELECT jetnity_prod_import_scheduler.tick_v1();';
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.prod_import_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:refresh1'
    OR current_setting('server_version_num')::integer/10000<>17
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4')
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net' AND extversion='0.19.5')
    OR (SELECT count(*) FROM vault.secrets WHERE name='jetnity_prod_import_cron_v1')<>1
    OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='jetnity_prod_import_cron_v1'
      AND length(decrypted_secret) BETWEEN 32 AND 256 AND decrypted_secret ~ '^[A-Za-z0-9_-]+$')
    OR to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NULL
    OR to_regprocedure('public.jetnity_production_import_status_v1()') IS NULL
    OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
    OR to_regprocedure('net.check_worker_is_up()') IS NULL
    OR current_setting('pg_net.database_name',true) IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'exact Production scheduler prerequisites required';
  END IF;
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'current rolling Production quota required';
  END IF;
  PERFORM net.check_worker_is_up();
  PERFORM pg_advisory_xact_lock(771106,32);
  PERFORM 1 FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked') THEN
    RAISE EXCEPTION 'scheduler state requires original-request review';
  END IF;
  SELECT count(*),min(scheduled.jobid) INTO existing_jobs,scheduled_job_id
    FROM cron.job AS scheduled WHERE scheduled.jobname='jetnity-ch-de-prod-import-v1';
  IF existing_jobs>1 OR (existing_jobs=0 AND EXISTS(
    SELECT 1 FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton AND enabled)) THEN
    RAISE EXCEPTION 'existing import schedule requires readback, not replacement';
  END IF;
  IF existing_jobs=0 THEN
    scheduled_job_id:=cron.schedule('jetnity-ch-de-prod-import-v1','* * * * *',command_value);
  ELSE
    IF NOT EXISTS(SELECT 1 FROM cron.job AS scheduled WHERE scheduled.jobid=scheduled_job_id
      AND scheduled.jobname='jetnity-ch-de-prod-import-v1' AND scheduled.schedule='* * * * *'
      AND scheduled.command=command_value AND scheduled.username='postgres' AND scheduled.database='postgres') THEN
      RAISE EXCEPTION 'existing import schedule identity refused';
    END IF;
    PERFORM cron.alter_job(scheduled_job_id,active:=true);
  END IF;
  IF (SELECT count(*) FROM cron.job AS scheduled WHERE scheduled.jobid=scheduled_job_id
    AND scheduled.jobname='jetnity-ch-de-prod-import-v1' AND scheduled.schedule='* * * * *'
    AND scheduled.command=command_value AND scheduled.username='postgres' AND scheduled.database='postgres' AND scheduled.active)<>1 THEN
    RAISE EXCEPTION 'import schedule readback refused';
  END IF;
  -- next_due_at, original IDs, attempts and all history remain unchanged.
  UPDATE jetnity_prod_import_scheduler.state_v1 SET enabled=true,status='armed' WHERE singleton AND NOT enabled;
END $activate$;
COMMIT;
