-- Run only after the complete reviewed code/SQL gates and branch-scoped secret.
-- The encrypted Vault secret is provisioned separately; never put it in Git.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $activate$
DECLARE scheduled_job_id bigint; expiry_text text:=current_setting('jetnity.dev_import_preview_expires',true);
  preview_expiry timestamptz;
  command_value constant text:='SELECT jetnity_dev_import_scheduler.tick_v1();';
BEGIN
  IF expiry_text IS NULL OR expiry_text !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'verified alias-scoped preview use horizon required';
  END IF;
  preview_expiry:=to_timestamp(expiry_text::bigint);
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.dev_import_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:refresh1'
    OR current_setting('server_version_num')::integer/10000<>17
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4')
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net' AND extversion='0.20.4')
    OR (SELECT count(*) FROM vault.secrets WHERE name='jetnity_dev_import_cron_v1')<>1
    OR (SELECT count(*) FROM vault.secrets WHERE name='jetnity_dev_import_preview_cookie_v1')<>1
    OR to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NULL
    OR preview_expiry<=clock_timestamp()+interval '1 hour'
    OR preview_expiry>clock_timestamp()+interval '7 days' THEN
    RAISE EXCEPTION 'exact Dev scheduler prerequisites required';
  END IF;
  IF (official_v3_guard_private.ch_de_quota_v2()->>'model') IS DISTINCT FROM 'rolling_24h_v2'
    OR (official_v3_guard_private.ch_de_quota_v2()->'clock_ok') IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'current rolling Dev quota required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='jetnity-ch-de-dev-import-v1') THEN
    RAISE EXCEPTION 'existing import schedule requires readback, not replacement';
  END IF;
  scheduled_job_id:=cron.schedule('jetnity-ch-de-dev-import-v1','* * * * *',command_value);
  IF (SELECT count(*) FROM cron.job AS scheduled WHERE scheduled.jobid=scheduled_job_id AND scheduled.jobname='jetnity-ch-de-dev-import-v1'
    AND scheduled.schedule='* * * * *' AND scheduled.command=command_value
    AND scheduled.username='postgres' AND scheduled.database='postgres' AND scheduled.active)<>1 THEN
    RAISE EXCEPTION 'import schedule readback refused';
  END IF;
  UPDATE jetnity_dev_import_scheduler.state_v1 SET enabled=true,status='armed',next_due_at=clock_timestamp(),
    transport_expires_at=preview_expiry WHERE singleton;
END $activate$;
COMMIT;
