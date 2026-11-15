-- Separate operator action after approved installation, before Owner/import.
-- Schedule plus first REAL full audit commit atomically. No fabricated proof.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='25s';
DO $production_guard_activate$
DECLARE scheduled_job_id bigint; audit_reply jsonb;
  command_value constant text:='SET statement_timeout=''30s''; SET lock_timeout=''25s''; SELECT official_v3_guard_private.audit_v1();';
BEGIN
  IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:BG1'
    OR current_setting('server_version_num')::integer/10000<>17
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4' AND extnamespace='pg_catalog'::regnamespace)
    OR current_setting('cron.database_name',true) IS DISTINCT FROM 'postgres'
    OR current_setting('cron.log_run',true) IS DISTINCT FROM 'on'
    OR to_regclass('cron.job') IS NULL OR to_regclass('cron.job_run_details') IS NULL THEN
    RAISE EXCEPTION 'production exact background scheduler prerequisites required' USING ERRCODE='P7921'; END IF;
  PERFORM pg_advisory_xact_lock(771106,2);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  SELECT j.jobid INTO scheduled_job_id FROM cron.job j WHERE j.jobname='jetnity-official-truth-production-guard-v1';
  IF FOUND THEN
    IF NOT EXISTS(SELECT 1 FROM cron.job j WHERE j.jobid=scheduled_job_id
      AND j.schedule='*/5 * * * *' AND j.command=command_value AND j.database='postgres' AND j.username='postgres' AND j.active) THEN
      RAISE EXCEPTION 'production existing background schedule collision' USING ERRCODE='P7921'; END IF;
  ELSE
    scheduled_job_id:=cron.schedule('jetnity-official-truth-production-guard-v1','*/5 * * * *',command_value);
  END IF;
  IF (SELECT count(*) FROM cron.job j WHERE j.jobid=scheduled_job_id AND j.jobname='jetnity-official-truth-production-guard-v1'
    AND j.schedule='*/5 * * * *' AND j.command=command_value AND j.database='postgres' AND j.username='postgres' AND j.active)<>1 THEN
    RAISE EXCEPTION 'production background schedule readback refused' USING ERRCODE='P7921'; END IF;
  audit_reply:=official_v3_guard_private.audit_v1();
  IF audit_reply IS DISTINCT FROM jsonb_build_object('schema',1,'status','current')
    OR public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN
    RAISE EXCEPTION 'production first complete background proof required' USING ERRCODE='P7921'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_guard_activate$;
COMMIT;
