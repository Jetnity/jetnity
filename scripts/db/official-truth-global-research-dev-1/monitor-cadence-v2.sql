-- Development-only six-country source watcher cadence V2.
-- Prevents the same hourly-source / 50-minute-dedupe collision observed in AT
-- Production. Only the schedules of TWO pre-existing Dev jobs may change.
-- Source bodies, legal research, immutable history, original BG1, other cron,
-- country lists, passport rules and public visitors are untouched.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.global_cadence_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-SIX-SOURCE-CADENCE-V2';

DO $schedule$
DECLARE enqueue_id bigint; collect_id bigint;
  enqueue_schedule text; collect_schedule text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.global_cadence_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:GLOBAL-SIX-SOURCE-CADENCE-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_global_source_monitor_private') IS NULL
 OR to_regnamespace('jetnity_global_research_private') IS NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1)<>206
 OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(DISTINCT dest) FROM jetnity_global_source_monitor_private.sources_v1)<>6
 OR (SELECT count(*) FROM cron.job WHERE jobname LIKE 'jetnity-global-gov-six-%')<>2
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND database='postgres' AND active
   AND ((jobname='jetnity-global-gov-six-enqueue-dev'
     AND command='SELECT jetnity_global_source_monitor_private.enqueue_v1()')
    OR (jobname='jetnity-global-gov-six-collect-dev'
     AND command='SELECT jetnity_global_source_monitor_private.collect_v1()')))<>2
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR NOT pg_try_advisory_xact_lock(771115,406)
 THEN RAISE EXCEPTION 'GLOBAL_SIX_CADENCE_V2_EXACT_DEV_REQUIRED'
    USING ERRCODE='P7983'; END IF;

 SELECT jobid,schedule INTO STRICT enqueue_id,enqueue_schedule FROM cron.job
 WHERE jobname='jetnity-global-gov-six-enqueue-dev';
 SELECT jobid,schedule INTO STRICT collect_id,collect_schedule FROM cron.job
 WHERE jobname='jetnity-global-gov-six-collect-dev';

 IF enqueue_schedule='24 * * * *'
  AND collect_schedule='27,32,37,42,47,52,57 * * * *' THEN
   PERFORM official_v3_guard_private.assert_catalog_v1();
   -- This is a cheap SCHEDULER check. The unchanged enqueue_v1() enforces
   -- 50-minute minimum spacing before any real government HTTP requests.
   PERFORM cron.alter_job(enqueue_id,schedule=>'*/5 * * * *');
   PERFORM cron.alter_job(collect_id,schedule=>'*/5 * * * *');
 ELSIF enqueue_schedule='*/5 * * * *' AND collect_schedule='*/5 * * * *' THEN
   -- Already corrected; exact no-op.
   PERFORM official_v3_guard_private.assert_catalog_v1();
 ELSE
   RAISE EXCEPTION 'GLOBAL_SIX_CADENCE_V2_UNKNOWN_JOB_STATE'
      USING ERRCODE='P7983';
 END IF;
 IF (SELECT count(*) FROM cron.job WHERE username='postgres' AND database='postgres' AND active
   AND schedule='*/5 * * * *'
   AND ((jobname='jetnity-global-gov-six-enqueue-dev'
       AND command='SELECT jetnity_global_source_monitor_private.enqueue_v1()')
      OR (jobname='jetnity-global-gov-six-collect-dev'
       AND command='SELECT jetnity_global_source_monitor_private.collect_v1()')))<>2
 OR (SELECT count(*) FROM cron.job WHERE jobname LIKE 'jetnity-global-gov-six-%')<>2
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_SIX_CADENCE_V2_ROLLBACK'
    USING ERRCODE='P7983'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $schedule$;
COMMIT;