-- NOT EXECUTED. Readback only after separately authorized exact Production installation.
-- This file is NOT an authorization to call Owner RPCs, publish, or restart CHDE.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SELECT jsonb_build_object(
 'scope','PROD_CH_AT_VISA_V2_POSTCOMMIT_METADATA_ONLY',
 'release_status','FUTURE_READBACK_REQUIRES_SEPARATE_INSTALL_AND_READ_GO',
 'source_preflight_v1_failed_missing_originals_v2',true,
 'new_source_v4_present',to_regclass('official_v3_at_private.ch_source_qualifications_v4') IS NOT NULL,
 'new_visa_facts_v4_present',to_regclass('official_v3_at_private.ch_visa_facts_v4') IS NOT NULL,
 'new_visa_visitor_v4_present',to_regprocedure('public.jetnity_at_ch_visa_v4(text)') IS NOT NULL,
 'method_revisions_v2_count',(SELECT count(*) FROM official_v3_method_private.revisions_v1 WHERE method_id='jetnity-destination-primary-at-visa' AND revision=2),
 'observed_at_utc',clock_timestamp(),
 'version',current_setting('server_version_num'),
 'method',(SELECT jsonb_build_object('revision',revision,'epoch',epoch,'status',status,
   'digest',method_digest,'package',package_digest) FROM official_v3_method_private.heads_v1
   WHERE method_id='jetnity-destination-primary-at-visa'),
 'bg1',(SELECT jsonb_build_object('generation',generation,'incident',incident_generation,
   'resumed',resumed_generation,'last_proof',last_proof_started,'valid_until',valid_until)
   FROM official_v3_guard_private.state_v1 WHERE singleton),
 'protected_objects',(SELECT jsonb_agg(jsonb_build_object('object',n.nspname||'.'||c.relname,
   'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'rls_forced',c.relforcerowsecurity,
   'acl',c.relacl::text) ORDER BY n.nspname,c.relname)
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE (n.nspname,c.relname) IN
    (('official_v3_at_private','ch_source_qualifications_v4'),
     ('official_v3_at_private','ch_visa_facts_v4'))),
 'reviewed_functions',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname||'.'||p.proname,
   'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,
   'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
   'acl',p.proacl::text) ORDER BY n.nspname,p.proname)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE (n.nspname,p.proname) IN
    (('official_v3_at_private','source_qualified_v4'),
     ('official_v3_at_private','renew_ch_visa_v4'),
     ('public','jetnity_at_ch_visa_v4'),
     ('public','jetnity_source_bound_at_visa_v1'),
     ('official_v3_source_renewal_private','seal_at_v1'),
     ('official_v3_guard_private','assert_catalog_v1'),
     ('official_v3_guard_private','require_open_v1'))),
 'http_allocator_v4_still_present',to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NOT NULL,
 'bg1_current_proof_started',(SELECT last_proof_started FROM official_v3_guard_private.state_v1 WHERE singleton),
 'qualification_table_catalog',(SELECT jsonb_agg(jsonb_build_object('relation',n.nspname||'.'||c.relname,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) ORDER BY c.relname)
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_at_private' AND c.relname IN ('ch_source_qualifications_v4','ch_visa_facts_v4')),
 'HTTP_ID_allocator_and_CHDE_dispatches_must_match_separate_pinned_readback',true,
 'definitive_good_live_go_is_not_implied',true,
 'chde_cycle12_not_touched','MUST_VERIFY_ON_SEPARATELY_AUTHORIZED_TARGET_BINDING',
 'this_read_does_not_approve_owner_method_or_restart',true
) AS results;
ROLLBACK;
