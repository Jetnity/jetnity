-- READ ONLY. Does not install, renew, publish or set a visitor flag.
-- Copy v6_catalog_digest from this result into the release session GUC.
-- This script does not store that digest and does not access a file secret.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SELECT jsonb_build_object(
 'bg1',public.official_v3_guard_alarm_status_v1()->>'status',
 'v6_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton),
 'v7_hold',to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL,
 'v8_present',to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL,
 'owner_decision_count',(SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3),
 'publication_count',CASE WHEN to_regclass('official_v3_at_production_private.ch_visa_publication_v3') IS NULL THEN NULL
   ELSE (SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3) END,
 'legacy_cron',(SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1' AND active),
 'ch_de_cron',(SELECT count(*) FROM cron.job WHERE jobname='jetnity-ch-de-prod-import-v1'),
 'catalog_status_sha256',(SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
   WHERE p.oid=to_regprocedure('official_v3_guard_private.catalog_status_v1()')),
 'decision','STOP_UNTIL_FRESH_READBACK_AND_SEPARATE_PO_GO') AS readback;
ROLLBACK;
