-- Separate operator step after the identical core upgrade and independent gates.
-- This file is NOT executed by build/CI or by the application. It requires the
-- actually installed Supabase pg_cron 1.6.4; no substitute schema or extension.
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $activate$
DECLARE selected bigint; actual jsonb;
  command_value constant text := 'SET statement_timeout=''30s''; SET lock_timeout=''25s''; SELECT official_v3_guard_private.audit_v1();';
BEGIN
  IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.bg1_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:BG1'
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4' AND extnamespace='pg_catalog'::regnamespace)
    OR current_setting('cron.database_name',true) IS DISTINCT FROM 'postgres'
    OR current_setting('cron.log_run',true) IS DISTINCT FROM 'on'
    OR to_regclass('cron.job') IS NULL OR to_regclass('cron.job_run_details') IS NULL THEN
    RAISE EXCEPTION 'bg1 exact Dev scheduler prerequisites required' USING ERRCODE='P7901';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,2);
  PERFORM official_v3_guard_private.assert_catalog_v1();
  SELECT jobid,to_jsonb(j) INTO selected,actual FROM cron.job j WHERE jobname='jetnity-official-truth-dev-guard-v1';
  IF FOUND THEN
    IF actual->>'schedule'<>'*/5 * * * *' OR actual->>'command'<>command_value
      OR actual->>'database'<>'postgres' OR actual->>'username'<>'postgres' OR actual->'active'<>'true'::jsonb THEN
      RAISE EXCEPTION 'bg1 existing scheduler collision' USING ERRCODE='P7901';
    END IF;
  ELSE
    selected:=cron.schedule('jetnity-official-truth-dev-guard-v1','*/5 * * * *',command_value);
  END IF;
  IF (SELECT count(*) FROM cron.job WHERE jobname='jetnity-official-truth-dev-guard-v1' AND jobid=selected
    AND schedule='*/5 * * * *' AND command=command_value AND database='postgres' AND username='postgres' AND active)<>1 THEN
    RAISE EXCEPTION 'bg1 scheduler readback refused' USING ERRCODE='P7901';
  END IF;
  -- Scheduling is not successful audit evidence and never writes a heartbeat.
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $activate$;
COMMIT;
