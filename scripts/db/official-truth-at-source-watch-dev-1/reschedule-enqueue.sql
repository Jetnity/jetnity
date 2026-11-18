-- DEV ONLY / NO FACT WRITES. The actual authority-source GET still runs
-- at most once per 50 minutes, enforced by enqueue_v1's transaction lock and
-- last-batch timestamp. Cron polls every five minutes so a delayed/failed
-- hourly tick cannot outlive the 70-minute fail-closed source-watch lease.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.at_dev_target='dev:yfvbxvijcorffwxbxahl:AT-WATCH-SCHEDULE-1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-WATCH-SCHEDULE-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT official_v3_at_private.source_current_v3()
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND database='postgres'
   AND jobname='jetnity-at-source-enqueue-dev-v1'
   AND schedule='9 * * * *'
   AND command='SELECT official_v3_at_source_watch_private.enqueue_v1()')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND database='postgres'
   AND jobname='jetnity-at-source-collect-dev-v1'
   AND schedule='*/5 * * * *'
   AND command='SELECT official_v3_at_source_watch_private.collect_v1()')<>1
 OR NOT pg_try_advisory_xact_lock(771108,3)
 THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_RESCHEDULE_WRONG_DEV_PREDECESSOR' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE TEMP TABLE at_source_watch_before(catalog jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_source_watch_before SELECT official_v3_guard_private.catalog_status_v1();
-- A scheduling attempt, NOT a fact-publishing authorization.
SELECT cron.schedule('jetnity-at-source-enqueue-dev-v1','*/5 * * * *',
 'SELECT official_v3_at_source_watch_private.enqueue_v1()');
DO $post$
BEGIN
 IF (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
   AND database='postgres' AND jobname='jetnity-at-source-enqueue-dev-v1'
   AND schedule='*/5 * * * *'
   AND command='SELECT official_v3_at_source_watch_private.enqueue_v1()')<>1
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-at-source-enqueue-dev-v1')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
   AND jobname='jetnity-at-source-collect-dev-v1'
   AND schedule='*/5 * * * *')<>1
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR official_v3_guard_private.catalog_status_v1()
    IS DISTINCT FROM (SELECT catalog FROM at_source_watch_before)
 THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_RESCHEDULE_CHANGED_PROTECTED_STATE' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
