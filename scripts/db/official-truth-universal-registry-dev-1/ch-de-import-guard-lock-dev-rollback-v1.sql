-- DEV ONLY — operator-controlled explicit rollback. Restore only original named import schedule/lock-wait values.
-- Do not change background guard, methods, published rules, private histories.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='14s';
SET LOCAL lock_timeout='250ms';
SET LOCAL jetnity.restore_target='dev:yfvbxvijcorffwxbxahl:IMPORT-GUARD-RESTORE-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.restore_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:IMPORT-GUARD-RESTORE-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regprocedure('jetnity_dev_import_scheduler.skip_overlap_v2()') IS NULL
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-ch-de-dev-import-v1'
   AND command='SELECT jetnity_dev_import_scheduler.skip_overlap_v2();'
   AND schedule='* * * * *' AND username='postgres')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-official-truth-dev-guard-v1'
   AND schedule='*/5 * * * *')<>1
 OR NOT pg_try_advisory_xact_lock(771106,31)
 THEN RAISE EXCEPTION 'DEV_LOCK_RESTORE_PREDECESSOR_REQUIRED' USING ERRCODE='P7977'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
DO $switch$
DECLARE jid bigint;
BEGIN
 SELECT jobid INTO STRICT jid FROM cron.job WHERE jobname='jetnity-ch-de-dev-import-v1' AND active
  AND command='SELECT jetnity_dev_import_scheduler.skip_overlap_v2();';
 PERFORM cron.alter_job(jid,command=>'SELECT jetnity_dev_import_scheduler.run_v1();');
END $switch$;
ALTER FUNCTION jetnity_dev_import_scheduler.run_v1() SET lock_timeout='2s';
ALTER FUNCTION jetnity_dev_import_scheduler.tick_v1() SET lock_timeout='2s';
ALTER FUNCTION jetnity_dev_import_scheduler.maintain_preview_v1() SET lock_timeout='2s';
DROP FUNCTION jetnity_dev_import_scheduler.skip_overlap_v2();
DO $post$
BEGIN
 IF (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-ch-de-dev-import-v1'
  AND command='SELECT jetnity_dev_import_scheduler.run_v1();' AND schedule='* * * * *')<>1
 OR to_regprocedure('jetnity_dev_import_scheduler.skip_overlap_v2()') IS NOT NULL
 OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.run_v1()'::regprocedure
  AND 'lock_timeout=2s'=ANY(proconfig))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'DEV_LOCK_RESTORE_POSTCHECK_ROLLBACK' USING ERRCODE='P7977'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
