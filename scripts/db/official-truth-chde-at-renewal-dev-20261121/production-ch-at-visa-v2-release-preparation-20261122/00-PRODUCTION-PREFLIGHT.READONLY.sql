-- NOT EXECUTED. PRODUCTION READ ONLY ONLY AFTER A DISTINCT OWNER GO.
-- Bound intention: Supabase Production qscbgcdmivbbnzrcyegn, CH passport / AT direct visa.
-- Never run this via a Dev/Production write channel.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SELECT jsonb_build_object(
 'scope','PROD_CH_AT_VISA_V2_PREFLIGHT_ONLY_NO_MUTATION',
 'target_project_declared','qscbgcdmivbbnzrcyegn',
 'observed_at_utc',clock_timestamp(),
 'database_name',current_database(),
 'actor',current_user,
 'postgres_version',current_setting('server_version_num'),
 'http_allocator_v4_present',to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NOT NULL,
 'http_allocator_v4_function_present',to_regprocedure('official_v3_guard_private.bg1_production_http_allocator_v4()') IS NOT NULL,
 'dev_only_bg1_v12_must_be_absent',to_regclass('official_v3_guard_private.bg1_dev_at_ch_autorenew_v12') IS NULL,
 'new_qualified_at_sources_present',to_regclass('official_v3_at_private.ch_source_qualifications_v4') IS NOT NULL,
 'new_at_visa_facts_present',to_regclass('official_v3_at_private.ch_visa_facts_v4') IS NOT NULL,
 'method',(SELECT jsonb_build_object('revision',revision,'epoch',epoch,'status',status,
       'method_sha',method_digest,'package_sha',package_digest)
       FROM official_v3_method_private.heads_v1
       WHERE method_id='jetnity-destination-primary-at-visa'),
 'method_revision2_staged',(SELECT count(*) FROM official_v3_method_private.revisions_v1
       WHERE method_id='jetnity-destination-primary-at-visa' AND revision=2),
 'research_originals',(SELECT jsonb_agg(jsonb_build_object('id',source_id,'sha',body_digest,
       'bytes',body_bytes,'disposition',disposition,'importable',importable,
       'checksum_matches',body_digest=encode(sha256(original_body),'hex'))
       ORDER BY source_id) FROM official_v3_at_private.whole_originals_v2),
 'production_bg1',(SELECT jsonb_build_object('generation',generation,
       'incident',incident_generation,'resumed',resumed_generation,
       'valid_until',valid_until)
       FROM official_v3_guard_private.state_v1 WHERE singleton),
 'production_chde_cycle12_assessment','MUST_BE_SEPARATELY_BOUND_READ_ONLY_NO_CLOSURE_IN_THIS_PACKAGE',
 'preflight_does_not_approve_installation',true
) AS results;
ROLLBACK;
