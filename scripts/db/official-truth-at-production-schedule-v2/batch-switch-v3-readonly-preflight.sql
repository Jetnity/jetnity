-- Read-only Production prerequisite report. No installation, unlock or rights.
-- Run only against the intended Production ref with read-only SQL.
WITH expected(signature, sha256) AS (
 VALUES
 ('official_v3_at_production_private.renew_ch_v1()','55a272d3431274266b1d5c8ad7b4b21ac213d19028932ff42dde944304d45d1b'),
 ('official_v3_guard_private.assert_catalog_v1()','93ae67b5c1b058d9df26be24b467bab7a25aea514f3d1b24517f666299b20f30'),
 ('official_v3_guard_private.require_open_v1()','2636f28c99b1d87012f73223089afb3b9f189c985c07ef49acafb5ba65cf315a'),
 ('public.jetnity_source_bound_at_visa_v1(text)','9c23e456059e9606ecaa6fd6d5abc8e81464af4ab15c33720c17435e67a5da91'),
 ('public.official_v3_guard_alarm_status_v1()','0e33a6adae5aa4e0dd102c669930f28745f5dbd0ee8e62ad355aa4c0581da14c')
), exact_functions AS (
 SELECT count(*) FILTER (WHERE to_regprocedure(signature) IS NOT NULL AND
 encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(signature)),'UTF8')),'hex')=sha256) AS matches
 FROM expected
), cron_state AS (
 SELECT count(*) AS correct_jobs
 FROM cron.job
 WHERE active AND username='postgres' AND database='postgres'
 AND ((jobname='jetnity-at-production-source-enqueue-v1' AND schedule='*/5 * * * *'
   AND command='SELECT official_v3_at_production_private.enqueue_v1()')
 OR (jobname='jetnity-at-production-source-collect-v1' AND schedule='*/5 * * * *'
   AND command='SELECT official_v3_at_production_private.collect_v1()')
 OR (jobname='jetnity-at-production-source-renew-v1' AND schedule='2-59/5 * * * *'
   AND command='SELECT official_v3_at_production_private.renew_ch_v1()'))
)
SELECT (SELECT matches=5 FROM exact_functions)
 AND (SELECT correct_jobs=3 FROM cron_state)
 AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
 AND to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 AND (SELECT count(*) FROM official_v3_guard_private.at_source_monitor_baseline_v1)=1
 AND (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)=3
 AND (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)=3
 AND current_setting('server_version_num')::integer/10000=17
 AS exact_production_predecessor_ready;