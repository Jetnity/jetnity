-- DEV ONLY: fail-closed CH-DE minute import scheduler avoids collision
-- with the existing protected five-minute BG1 full guard audit and CMS writers.
-- Original import/quota/preview bodies are untouched; only short function
-- lock wait configuration + a narrow cron wrapper are changed.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='14s';
SET LOCAL lock_timeout='250ms';
SET LOCAL jetnity.lock_fix_target='dev:yfvbxvijcorffwxbxahl:IMPORT-GUARD-COLLISION-V1';
DO $pre$
DECLARE p record;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.lock_fix_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:IMPORT-GUARD-COLLISION-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regprocedure('jetnity_dev_import_scheduler.skip_overlap_v2()') IS NOT NULL
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-ch-de-dev-import-v1'
  AND schedule='* * * * *' AND command='SELECT jetnity_dev_import_scheduler.run_v1();'
  AND username='postgres' AND database='postgres')<>1
 OR (SELECT count(*) FROM cron.job WHERE active
  AND jobname='jetnity-official-truth-dev-guard-v1'
  AND schedule='*/5 * * * *')<>1
 OR (SELECT count(*) FROM cron.job_run_details d JOIN cron.job j USING(jobid)
  WHERE j.jobname='jetnity-ch-de-dev-import-v1'
    AND d.start_time>=clock_timestamp()-interval '24 hours' AND d.status<>'succeeded')<50
 OR NOT pg_try_advisory_xact_lock(771106,31)
 THEN RAISE EXCEPTION 'IMPORT_GUARD_COLLISION_PREDECESSOR_REFUSED' USING ERRCODE='P7975'; END IF;
 FOR p IN SELECT k.identity, k.expected_sha, k.expected_config
 FROM (VALUES
 ('jetnity_dev_import_scheduler.run_v1()'::text,
 'f0caaffd0fa096df54ec94a59c846ecb0c2047f34f1183bb42ef58c5d5b028be'::text,'lock_timeout=2s'::text),
 ('jetnity_dev_import_scheduler.tick_v1()',
 '76e0c391253b851f078677ca01a5dc48cce3fa86c50e415a76fafa745b6d3f79','lock_timeout=2s'),
 ('jetnity_dev_import_scheduler.maintain_preview_v1()',
 'd6867e8594ca18caee69b11ffd536b1fcd143d58efa6090e3de2680675e7009d','lock_timeout=2s')
 ) AS k(identity,expected_sha,expected_config)
 LOOP
  IF (SELECT encode(sha256(convert_to(f.prosrc,'UTF8')),'hex')=p.expected_sha
       AND p.expected_config=ANY(f.proconfig) FROM pg_proc f WHERE f.oid=p.identity::regprocedure)
     IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'IMPORT_GUARD_SCHEDULER_SOURCE_CHANGED' USING ERRCODE='P7975'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE FUNCTION jetnity_dev_import_scheduler.skip_overlap_v2() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog SET statement_timeout='15s' SET lock_timeout='150ms'
AS $wrapper$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 THEN RAISE EXCEPTION 'scheduler postgres only'; END IF;
 -- Never begin an import in the minute of a scheduled full BG1 guard proof.
 IF extract(minute FROM clock_timestamp())::integer % 5=0
 THEN RETURN 'skip_guard_slot'; END IF;
 -- The exact original 31 lock is also acquired by both legacy scheduler bodies.
 IF NOT pg_try_advisory_xact_lock(771106,31) THEN RETURN 'skip_previous_running'; END IF;
 IF EXISTS(SELECT 1 FROM pg_locks
  WHERE locktype='advisory' AND classid=771106 AND objid=1 AND granted)
 THEN RETURN 'skip_guard_active'; END IF;
 -- Source, approvals, quota and signature are rechecked by original run_v1.
 BEGIN
  RETURN jetnity_dev_import_scheduler.run_v1();
 EXCEPTION WHEN lock_not_available OR query_canceled
  THEN RETURN 'skip_guard_lock'; END;
END $wrapper$;

-- Narrowly shrink waiting on a protected guard tuple; do NOT weaken its
-- 5-minute audit, protected rights, or quota. A missed run is retried next minute.
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.skip_overlap_v2() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION jetnity_dev_import_scheduler.run_v1() SET lock_timeout='150ms';
ALTER FUNCTION jetnity_dev_import_scheduler.tick_v1() SET lock_timeout='150ms';
ALTER FUNCTION jetnity_dev_import_scheduler.maintain_preview_v1() SET lock_timeout='150ms';

DO $switch$
DECLARE jid bigint;
BEGIN
 SELECT jobid INTO STRICT jid FROM cron.job WHERE jobname='jetnity-ch-de-dev-import-v1'
 AND active AND schedule='* * * * *'
 AND command='SELECT jetnity_dev_import_scheduler.run_v1();';
 PERFORM cron.alter_job(jid,command=>'SELECT jetnity_dev_import_scheduler.skip_overlap_v2();');
 IF (SELECT count(*) FROM cron.job WHERE jobid=jid AND active
   AND command='SELECT jetnity_dev_import_scheduler.skip_overlap_v2();'
   AND schedule='* * * * *')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-official-truth-dev-guard-v1'
   AND schedule='*/5 * * * *')<>1
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR has_function_privilege('anon','jetnity_dev_import_scheduler.skip_overlap_v2()','EXECUTE')
 OR has_function_privilege('authenticated','jetnity_dev_import_scheduler.skip_overlap_v2()','EXECUTE')
 THEN RAISE EXCEPTION 'IMPORT_GUARD_COLLISION_POSTCHECK_ROLLBACK' USING ERRCODE='P7975'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $switch$;
COMMIT;
