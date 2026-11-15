-- Apply after reviewed renewal installation and a permanent share link scoped
-- to this exact Dev alias. It preserves the existing import cron ID/history.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $activate$
DECLARE old_command constant text:='SELECT jetnity_dev_import_scheduler.tick_v1();';
  new_command constant text:='SELECT jetnity_dev_import_scheduler.run_v1();';
  selected_job bigint;
BEGIN
  IF current_user<>'postgres' OR session_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('jetnity.dev_import_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:refresh1'
    OR (SELECT count(*) FROM vault.secrets WHERE name='jetnity_dev_import_preview_share_v1')<>1
    OR to_regprocedure('jetnity_dev_import_scheduler.maintain_preview_v1()') IS NULL
    OR to_regprocedure('jetnity_dev_import_scheduler.run_v1()') IS NULL THEN
    RAISE EXCEPTION 'reviewed exact Dev renewal prerequisites required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  SELECT jobid INTO STRICT selected_job FROM cron.job WHERE jobname='jetnity-ch-de-dev-import-v1'
    AND schedule='* * * * *' AND command=old_command AND username='postgres' AND database='postgres' AND active;
  PERFORM cron.alter_job(selected_job,command:=new_command);
  IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobid=selected_job AND jobname='jetnity-ch-de-dev-import-v1'
    AND schedule='* * * * *' AND command=new_command AND username='postgres' AND database='postgres' AND active) THEN
    RAISE EXCEPTION 'Dev renewal cron readback refused';
  END IF;
END $activate$;
COMMIT;
