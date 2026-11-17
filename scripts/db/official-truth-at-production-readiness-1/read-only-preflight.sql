-- Read-only Production preflight; execution CANNOT approve, install or import.
-- NO public positive result is implied by a 200/OK from this SQL query.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SELECT jsonb_build_object(
 'projectIdentity','verify_against_own_supabase_dashboard',
 'product','Official Truth Austria',
 'readOnly',true,
 'database',current_database(),
 'serverMajor',current_setting('server_version_num')::integer/10000,
 'bg1Current',public.official_v3_guard_alarm_status_v1()->>'status'='current',
 'atSourceCustodyInstalled',to_regclass('official_v3_at_private.whole_originals_v2') IS NOT NULL,
 'atPrivateFactsInstalled',to_regclass('official_v3_at_private.verified_visas_v3') IS NOT NULL,
 'atPublicRpcInstalled',to_regprocedure('public.jetnity_at_visa_v3(text)') IS NOT NULL,
 'atMethodHeadCount',(SELECT count(*) FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa'),
 'noIndependentReleaseAuthorization',true,
 'noSourceMonitorProof',true,
 'no50PassPositiveQualification',true,
 'decision','STOP_BEFORE_PRODUCTION_OWNER_RELEASE'
) AS review;
ROLLBACK;
