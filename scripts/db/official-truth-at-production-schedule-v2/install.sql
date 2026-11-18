-- Production-only, idempotent operational successor after #1227.
-- Corrects hourly enqueue's 50-minute-dedupe phase collision without
-- changing the 50-minute dedupe, authority-source bytes, MA1, BG1, public
-- visitor, existing facts, jobs, privileges or other countries.
-- Owner-approved live operational hotfix was applied 2026-11-18.
-- Replaying it on that already-corrected Production must be an exact no-op.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_schedule_v2_target='production:qscbgcdmivbbnzrcyegn:AT-SCHEDULE-GAP-V2';

DO $schedule$
DECLARE enqueue_id bigint; renew_id bigint;
  enqueue_schedule text; renewal_schedule text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR current_database()<>'postgres'
  OR current_setting('server_version_num')::integer/10000<>17
  OR current_setting('jetnity.at_schedule_v2_target',true)
    IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:AT-SCHEDULE-GAP-V2'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR to_regclass('official_v3_guard_private.at_source_monitor_baseline_v1') IS NULL
  OR to_regclass('official_v3_at_production_private.watch_batches_v1') IS NULL
  OR to_regclass('official_v3_at_production_private.ch_visa_facts_v1') IS NULL
  OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
  OR (SELECT count(*) FROM cron.job WHERE jobname LIKE 'jetnity-at-production-source-%')<>3
  OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND database='postgres' AND active
      AND ((jobname='jetnity-at-production-source-enqueue-v1'
        AND command='SELECT official_v3_at_production_private.enqueue_v1()')
      OR (jobname='jetnity-at-production-source-collect-v1'
        AND schedule='*/5 * * * *'
        AND command='SELECT official_v3_at_production_private.collect_v1()')
      OR (jobname='jetnity-at-production-source-renew-v1'
        AND command='SELECT official_v3_at_production_private.renew_ch_v1()')))<>3
  OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname='jetnity-official-truth-production-guard-v1')<>1
  OR (SELECT count(*) FROM official_v3_guard_private.saved_offers_baseline_v1)<>1
  OR (SELECT count(*) FROM official_v3_guard_private.weather_quota_baseline_v1)<>1
  OR NOT pg_try_advisory_xact_lock(771112,102)
 THEN RAISE EXCEPTION 'AT_SCHEDULE_V2_PROD_EXACT_PREDECESSOR_REQUIRED'
    USING ERRCODE='P7984'; END IF;

 SELECT jobid,schedule INTO STRICT enqueue_id,enqueue_schedule FROM cron.job
  WHERE jobname='jetnity-at-production-source-enqueue-v1';
 SELECT jobid,schedule INTO STRICT renew_id,renewal_schedule FROM cron.job
  WHERE jobname='jetnity-at-production-source-renew-v1';

 -- Never partially repair a hand-modified, unknown or half-migrated scheduler.
 IF (enqueue_schedule='9 * * * *' AND renewal_schedule='17-59/5 * * * *') THEN
   PERFORM official_v3_guard_private.assert_catalog_v1();
   -- Every 5 minutes CHECK. The original private enqueue_v1 still issues
   -- genuine HTTP requests only when the last batch is >= 50 minutes old.
   PERFORM cron.alter_job(enqueue_id,schedule=>'*/5 * * * *');
   -- Offset the renewal 2 minutes after 5-minute source collection.
   -- The old 17-59/5 hour-boundary gap must never recur.
   PERFORM cron.alter_job(renew_id,schedule=>'2-59/5 * * * *');
 ELSIF (enqueue_schedule='*/5 * * * *' AND renewal_schedule='2-59/5 * * * *') THEN
   -- Already repaired: leave both original Cron job IDs/commands intact.
   PERFORM official_v3_guard_private.assert_catalog_v1();
 ELSE
   RAISE EXCEPTION 'AT_SCHEDULE_V2_UNEXPECTED_CRON_CONFIGURATION'
     USING ERRCODE='P7984';
 END IF;

 IF (SELECT count(*) FROM cron.job WHERE username='postgres' AND database='postgres' AND active
    AND ((jobname='jetnity-at-production-source-enqueue-v1'
      AND schedule='*/5 * * * *'
      AND command='SELECT official_v3_at_production_private.enqueue_v1()')
    OR (jobname='jetnity-at-production-source-collect-v1'
      AND schedule='*/5 * * * *'
      AND command='SELECT official_v3_at_production_private.collect_v1()')
    OR (jobname='jetnity-at-production-source-renew-v1'
      AND schedule='2-59/5 * * * *'
      AND command='SELECT official_v3_at_production_private.renew_ch_v1()')))<>3
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR (SELECT count(*) FROM official_v3_guard_private.at_source_monitor_baseline_v1)<>1
  OR (SELECT count(*) FROM cron.job WHERE active
    AND jobname='jetnity-official-truth-production-guard-v1')<>1
 THEN RAISE EXCEPTION 'AT_SCHEDULE_V2_POSTCHECK_ROLLBACK'
   USING ERRCODE='P7984'; END IF;

 PERFORM official_v3_guard_private.assert_catalog_v1();
END $schedule$;
COMMIT;