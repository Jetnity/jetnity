-- PRODUCTION READ ONLY. This is an inventory, NOT an installer or release.
-- Caller must independently target ONLY Supabase Production qscbgcdmivbbnzrcyegn.
-- No RLS/role/credential/MA1 changes, new costs, merge or publication.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='6s';
SET LOCAL jetnity.target='production:qscbgcdmivbbnzrcyegn:UNIVERSAL-OT-PREFLIGHT-V1';

SELECT jsonb_build_object(
 'schema',1,
 'target','Production registry prerequisites (read only)',
 'targetProjectMustBeExternallyConfirmed','qscbgcdmivbbnzrcyegn',
 'actualDatabase',current_database(),
 'postgresMajorVersion',current_setting('server_version_num')::integer/10000,
 'guard',public.official_v3_guard_alarm_status_v1(),
 'guardCron',(SELECT count(*) FROM cron.job WHERE active
   AND username='postgres' AND database='postgres'
   AND jobname='jetnity-official-truth-production-guard-v1'),
 'prerequisites',jsonb_build_object(
   'existing_visitor_v3',to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL,
   'at_source_originals',to_regclass('official_v3_at_private.whole_originals_v2') IS NOT NULL,
   'at_visa_fact_store',to_regclass('official_v3_at_private.verified_visas_v3') IS NOT NULL,
   'at_source_watcher',to_regclass('official_v3_at_source_watch_private.pins_v1') IS NOT NULL,
   'at_source_renewal',to_regclass('official_v3_source_renewal_private.facts_v1') IS NOT NULL,
   'global_206x50_research',to_regclass('jetnity_global_research_private.cases_v1') IS NOT NULL,
   'universal_source_registry',to_regclass('jetnity_source_registry_private.sources_v1') IS NOT NULL,
   'universal_dispatcher',to_regprocedure('jetnity_source_dispatch_private.tick_v1()') IS NOT NULL,
   'country_passport_topic_view',to_regclass('jetnity_release_review_private.passport_topic_status_v1') IS NOT NULL,
   'at_legal_review',to_regclass('jetnity_legal_review_private.at_rule_readiness_v1') IS NOT NULL
 ),
 'ownerApprovalRequired',true,
 'methodApprovalRequired',true,
 'catalogSecurityReviewRequired',true,
 'backoutRequired',true,
 'unverifiedVisitorClaims','derzeit nicht verfügbar',
 'legalReleaseStatus','STOP_NO_OWNER_AAL2_NO_SOURCE_BOUND_PRODUCTION_METHOD',
 'automaticPublishAllowed',false,
 'productionDDLExecuted',false
) AS production_readiness_inventory;
ROLLBACK;
