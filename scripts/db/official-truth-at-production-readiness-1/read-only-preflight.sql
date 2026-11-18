-- Read-only Production preflight for the Owner-gated Austria visa release.
-- This SQL is NOT an installer or release decision. The caller MUST verify the
-- exact Supabase production project independently using provider metadata;
-- SQL cannot securely infer a Supabase project_ref from current_database().
-- Output is intentionally small, constant-shape and contains no source bodies.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SELECT jsonb_build_object(
 'schema',2,
 'product','Official Truth Austria',
 'expectedProjectRef','qscbgcdmivbbnzrcyegn',
 'externalProjectIdentityRequired',true,
 'readOnly',true,
 'pg17',current_setting('server_version_num')::integer/10000=17,
 'bg1Current',public.official_v3_guard_alarm_status_v1()->>'status'='current',
 'productionGuardCronActive',(SELECT count(*) FROM cron.job WHERE
   jobname='jetnity-official-truth-production-guard-v1' AND active)=1,
 'atSourceCustodyInstalled',to_regclass('official_v3_at_private.whole_originals_v2') IS NOT NULL,
 'atPrivateFactsInstalled',to_regclass('official_v3_at_private.verified_visas_v3') IS NOT NULL,
 'atSourceWatchInstalled',to_regnamespace('official_v3_at_source_watch_private') IS NOT NULL,
 'atSourceRenewalInstalled',to_regnamespace('official_v3_source_renewal_private') IS NOT NULL,
 'atLegacyRpcInstalled',to_regprocedure('public.jetnity_at_visa_v3(text)') IS NOT NULL,
 'atBoundVisitorRpcInstalled',to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL,
 'atMethodHeadCount',(SELECT count(*) FROM official_v3_method_private.heads_v1
   WHERE method_id='jetnity-destination-primary-at-visa'),
 'devOwnerReceiptCannotBeReused',true,
 'productionOwnerAal2ApprovalRequired',true,
 'productionVisitorFlagUntouched',true,
 'uncertifiedPassportsStayUnavailable',true,
 'decision','STOP_BEFORE_PRODUCTION_OWNER_RELEASE'
) AS review;
ROLLBACK;
