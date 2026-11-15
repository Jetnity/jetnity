-- Stop future dispatch only. Already admitted requests can still settle.
-- Normal Owner revocation is the separate authority stop; preserve every ledger.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $stop$
DECLARE scheduled_job_id bigint; existing_jobs integer;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.prod_import_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:refresh1'
    OR current_setting('server_version_num')::integer/10000<>17 THEN
    RAISE EXCEPTION 'exact Production scheduler stop context required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,32);
  PERFORM 1 FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'scheduler state unavailable'; END IF;
  SELECT count(*),min(scheduled.jobid) INTO existing_jobs,scheduled_job_id
    FROM cron.job AS scheduled WHERE scheduled.jobname='jetnity-ch-de-prod-import-v1';
  IF existing_jobs>1 THEN RAISE EXCEPTION 'ambiguous scheduler stop refused'; END IF;
  IF existing_jobs=1 THEN
    IF NOT EXISTS(SELECT 1 FROM cron.job AS scheduled WHERE scheduled.jobid=scheduled_job_id
      AND scheduled.jobname='jetnity-ch-de-prod-import-v1' AND scheduled.schedule='* * * * *'
      AND scheduled.command='SELECT jetnity_prod_import_scheduler.tick_v1();'
      AND scheduled.username='postgres' AND scheduled.database='postgres') THEN
      RAISE EXCEPTION 'foreign scheduler stop refused';
    END IF;
    PERFORM cron.alter_job(scheduled_job_id,active:=false);
    IF NOT EXISTS(SELECT 1 FROM cron.job AS scheduled WHERE scheduled.jobid=scheduled_job_id AND NOT scheduled.active) THEN
      RAISE EXCEPTION 'scheduler stop readback refused';
    END IF;
  END IF;
  UPDATE jetnity_prod_import_scheduler.state_v1 SET enabled=false,status='disabled' WHERE singleton;
END $stop$;
COMMIT;
