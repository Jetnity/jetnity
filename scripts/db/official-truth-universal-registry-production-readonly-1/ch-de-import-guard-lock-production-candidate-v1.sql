-- PRODUCTION OWNER APPROVAL REQUIRED. UNAPPLIED candidate, no auto rollout.
-- Exact prerequisite readback, one named scheduler only, no other Production DDL.
-- Execute only AFTER #1254 normal merge, BG1 native rollback proof and explicit
-- separate Production owner approval; do not copy Dev history/credentials.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='14s';
SET LOCAL lock_timeout='250ms';
SET LOCAL jetnity.prod_lock_fix_target='production:qscbgcdmivbbnzrcyegn:IMPORT-GUARD-COLLISION-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.prod_lock_fix_target',true)
  IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:IMPORT-GUARD-COLLISION-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regprocedure('jetnity_prod_import_scheduler.skip_overlap_v2()') IS NOT NULL
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex')
     FROM pg_proc WHERE oid='jetnity_prod_import_scheduler.tick_v1()'::regprocedure)
    IS DISTINCT FROM 'ebc518fc18e8c5057941c1d65890171b510fa67138dc85023ac1d95195f6bb3a'
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-ch-de-prod-import-v1'
  AND schedule='* * * * *' AND command='SELECT jetnity_prod_import_scheduler.tick_v1();'
  AND username='postgres' AND database='postgres')<>1
 OR (SELECT count(*) FROM cron.job WHERE active
  AND jobname='jetnity-official-truth-production-guard-v1'
  AND schedule='*/5 * * * *')<>1
 OR NOT pg_try_advisory_xact_lock(771106,32)
 THEN RAISE EXCEPTION 'PROD_LOCK_FIX_PREDECESSOR_REFUSED' USING ERRCODE='P7976'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE FUNCTION jetnity_prod_import_scheduler.skip_overlap_v2() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog SET statement_timeout='12s' SET lock_timeout='150ms'
AS $wrapper$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 THEN RAISE EXCEPTION 'Production postgres only'; END IF;
 IF extract(minute FROM clock_timestamp())::integer % 5=0
 THEN RETURN 'skip_guard_slot'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,32)
 THEN RETURN 'skip_previous_running'; END IF;
 IF EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory'
   AND classid=771106 AND objid=1 AND granted)
 THEN RETURN 'skip_guard_active'; END IF;
 BEGIN RETURN jetnity_prod_import_scheduler.tick_v1();
 EXCEPTION WHEN lock_not_available OR query_canceled
 THEN RETURN 'skip_guard_lock'; END;
END $wrapper$;
REVOKE ALL ON FUNCTION jetnity_prod_import_scheduler.skip_overlap_v2() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION jetnity_prod_import_scheduler.tick_v1() SET lock_timeout='150ms';

DO $post$
DECLARE jid bigint;
BEGIN
 SELECT jobid INTO STRICT jid FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1'
  AND active AND command='SELECT jetnity_prod_import_scheduler.tick_v1();'
  AND schedule='* * * * *';
 PERFORM cron.alter_job(jid,command=>'SELECT jetnity_prod_import_scheduler.skip_overlap_v2();');
 IF (SELECT count(*) FROM cron.job WHERE jobid=jid AND active
   AND command='SELECT jetnity_prod_import_scheduler.skip_overlap_v2();')<>1
 OR (SELECT count(*) FROM cron.job WHERE active
   AND jobname='jetnity-official-truth-production-guard-v1'
   AND schedule='*/5 * * * *')<>1
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR has_function_privilege('anon','jetnity_prod_import_scheduler.skip_overlap_v2()','EXECUTE')
 OR has_function_privilege('authenticated','jetnity_prod_import_scheduler.skip_overlap_v2()','EXECUTE')
 THEN RAISE EXCEPTION 'PROD_LOCK_FIX_POSTCHECK_ROLLBACK' USING ERRCODE='P7976'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
