-- READ ONLY. Never run a successor installer or a fact renewal from this check.
-- Release must independently bind the Production project and confirm a fresh natural BG1 full proof.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SELECT jsonb_build_object(
 'bg1',public.official_v3_guard_alarm_status_v1()->>'status',
 'v6_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton),
 'v7_hold',to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL,
 'owner_decision_count',(SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3),
 'latest_v2_fact',(SELECT version_id FROM official_v3_at_production_private.ch_visa_facts_v2 ORDER BY version_id DESC LIMIT 1),
 'legacy_cron',(SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1' AND active),
 'functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,
   'sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid::regprocedure::text)
  FROM pg_proc p WHERE p.oid IN (to_regprocedure('official_v3_at_production_private.renew_ch_v1()'),
    to_regprocedure('official_v3_at_production_private.renew_ch_v2()'),to_regprocedure('official_v3_at_production_private.read_ch_v2(text)'),
    to_regprocedure('official_v3_at_production_private.batch_qualified_ch_v3(bigint)'),
    to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)'),
    to_regprocedure('official_v3_guard_private.catalog_status_v1()'),to_regprocedure('official_v3_guard_private.assert_catalog_v1()'),
    to_regprocedure('official_v3_guard_private.require_open_v1()'),to_regprocedure('public.official_v3_guard_alarm_status_v1()'))),
 'decision','STOP_UNTIL_EXACT_SUCCESSOR_AND_SEPARATE_PO_GO') AS readback;
ROLLBACK;
