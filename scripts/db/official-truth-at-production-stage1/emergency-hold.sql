-- OWNER ONLY. EMERGENCY FAIL-CLOSED STOP for the new Austrian
-- Production source monitor and CH->AT automated fact issuer.
-- Does not delete any source/fact/baseline, revoke all BG1, or stop unrelated
-- saved_offers, weather, Admin, CH->DE and existing Production guard jobs.
-- Run ONLY when the approved guarded Austria Production install exists.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='3s';
SET LOCAL jetnity.at_prod_emergency_target='production:qscbgcdmivbbnzrcyegn:AT-EMERGENCY-STOP-1';
DO $before$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.at_prod_emergency_target',true)
 IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:AT-EMERGENCY-STOP-1'
 OR to_regclass('official_v3_guard_private.at_source_monitor_baseline_v1') IS NULL
 OR to_regclass('official_v3_at_production_private.ch_visa_facts_v1') IS NULL
 OR to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NULL
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
    AND jobname='jetnity-official-truth-production-guard-v1')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
    AND jobname IN('jetnity-at-production-source-enqueue-v1',
      'jetnity-at-production-source-collect-v1',
      'jetnity-at-production-source-renew-v1'))<>3
 OR NOT pg_try_advisory_xact_lock(771112,199)
 THEN RAISE EXCEPTION 'AT_EMERGENCY_EXACT_PRODUCTION_STOP_REFUSED'
 USING ERRCODE='P7979'; END IF;
END $before$;
DO $disable$
BEGIN
 IF NOT cron.unschedule('jetnity-at-production-source-enqueue-v1')
 OR NOT cron.unschedule('jetnity-at-production-source-collect-v1')
 OR NOT cron.unschedule('jetnity-at-production-source-renew-v1')
 THEN RAISE EXCEPTION 'AT_EMERGENCY_SOURCE_CRON_STOP_FAILED'
 USING ERRCODE='P7979'; END IF;
END $disable$;
DO $after$
BEGIN
 IF (SELECT count(*) FROM cron.job WHERE jobname IN
   ('jetnity-at-production-source-enqueue-v1',
    'jetnity-at-production-source-collect-v1',
    'jetnity-at-production-source-renew-v1'))<>0
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
    AND jobname='jetnity-official-truth-production-guard-v1')<>1
 OR public.jetnity_source_bound_at_visa_v1('CH')->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('IN')->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.at_source_monitor_baseline_v1)<>1
 THEN RAISE EXCEPTION 'AT_EMERGENCY_FAIL_CLOSED_POSTCHECK_FAILED'
 USING ERRCODE='P7979'; END IF;
END $after$;
COMMIT;
