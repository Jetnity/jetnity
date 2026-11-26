-- READ ONLY post-commit shape. Not evidence of a fresh Production readback.
-- Running this file does not prove Production. The release chat must execute it
-- itself after a separately authorized commit and record the actual row.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SELECT jsonb_build_object(
 'executed_by_repository',false,
 'fresh_production_readback','OPEN_PO_GATE',
 'v8',to_regclass('official_v3_guard_private.bg1_prod_ch_at_stage3_v8') IS NOT NULL,
 'v7',to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL,
 'v8_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
   FROM official_v3_guard_private.bg1_prod_ch_at_stage3_v8 WHERE singleton),
 'publication',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_publication_v3),
 'renewal_hold',(SELECT count(*) FROM official_v3_at_production_private.ch_stage3_renewal_hold_v1),
 'legacy_cron',(SELECT command FROM cron.job WHERE jobname='jetnity-at-production-source-renew-v1'),
 'alarm',public.official_v3_guard_alarm_status_v1()->>'status') AS readback;
ROLLBACK;
