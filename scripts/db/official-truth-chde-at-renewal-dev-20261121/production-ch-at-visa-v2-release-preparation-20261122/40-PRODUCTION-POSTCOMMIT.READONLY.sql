-- PREPARED ONLY. Separate Owner-Go required for read-only Production verification.
-- After a separately authorized bounded Production V1 install and naturally fresh BG1 run.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='14s';
SET LOCAL lock_timeout='500ms';
SELECT jsonb_build_object(
 'scope','PROD_CH_AT_V2_V1_NATIVE_METADATA_READBACK',
 'observed_at_utc',clock_timestamp(),
 'current_database',current_database(),
 'postgres_major',current_setting('server_version_num')::integer/10000,
 'BG1',(SELECT jsonb_build_object('generation',generation,'incident',incident_generation,'resumed',resumed_generation,'started',last_proof_started,'valid_until',valid_until) FROM official_v3_guard_private.state_v1 WHERE singleton),
 'v5_baseline',(SELECT jsonb_build_object('required_generation',required_generation,
     'proof_cutoff',proof_not_before,'catalog_exact',catalog IS NOT DISTINCT FROM official_v3_guard_private.catalog_status_v1(),
     'qualified_source_digest',qualified_source_digest,'predecessor_catalog_digest',predecessor_catalog_digest,
     'predecessor_baseline_digest',predecessor_baseline_digest) FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 WHERE singleton),
 'v4_http_allocator_parent',(SELECT jsonb_build_object('exists',count(*)=1,'transport_sha_matches',
     bool_and(transport_metadata_digest=encode(sha256(convert_to(transport_metadata::text,'UTF8')),'hex')))
     FROM official_v3_guard_private.bg1_production_http_allocator_v4),
 'v2_sources',(SELECT jsonb_agg(jsonb_build_object('id',source_id,'official_url',official_url,'sha',accepted_sha,
      'bytes',accepted_bytes,'watch_state',expected_watch_state) ORDER BY source_id)
      FROM official_v3_at_production_private.ch_source_qualifications_v2),
 'v2_originals',(SELECT jsonb_build_object('count',count(*),'all_match',coalesce(bool_and(o.raw_sha=q.accepted_sha
       AND o.raw_bytes=q.accepted_bytes),true)) FROM official_v3_at_production_private.ch_source_originals_v2 o
       JOIN official_v3_at_production_private.ch_source_qualifications_v2 q USING(source_id)),
 'v2_facts',(SELECT jsonb_build_object('total',count(*),'unexpired',
      count(*) FILTER(WHERE expires_at>clock_timestamp()),'latest_batch',max(source_batch_id))
      FROM official_v3_at_production_private.ch_visa_facts_v2),
 'legacy_v1',(SELECT jsonb_build_object('originals',(SELECT count(*) FROM official_v3_at_production_private.first_originals_v1),
       'source_pins',(SELECT count(*) FROM official_v3_at_production_private.source_pins_v1),
       'historic_facts',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1))),
 'method',(SELECT jsonb_build_object('revision',revision,'epoch',epoch,'status',status,'digest',method_digest,'package_digest',package_digest)
      FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-at-visa'),
 'source_jobs',(SELECT jsonb_agg(jsonb_build_object('name',jobname,'active',active,'schedule',schedule,
      'command_sha',encode(sha256(convert_to(command,'UTF8')),'hex')) ORDER BY jobname)
      FROM cron.job WHERE jobname IN('jetnity-at-production-source-enqueue-v1',
        'jetnity-at-production-source-collect-v1','jetnity-at-production-source-renew-v1',
        'jetnity-at-production-source-qualified-renew-v2')),
 'protected_functions',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname||'.'||p.proname,
      'definer',p.prosecdef,'owner',pg_get_userbyid(p.proowner),'sha256',encode(sha256(convert_to(
         pg_get_functiondef(p.oid),'UTF8')),'hex'),'acl',p.proacl::text) ORDER BY n.nspname,p.proname)
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE (n.nspname,p.proname) IN
       (('official_v3_guard_private','assert_catalog_v1'),('official_v3_guard_private','require_open_v1'),
        ('official_v3_guard_private','catalog_status_v1'),
        ('official_v3_at_production_private','batch_qualified_ch_v2'),
        ('official_v3_at_production_private','renew_ch_v2'),
        ('official_v3_at_production_private','read_ch_v2'),
        ('public','jetnity_source_bound_at_visa_v1'))),
 'no_method_approval_from_install',true,
 'no_CHDE_or_HTTP_ID_rewrite_allowed',true,
 'actual_anonymous_visitor_readback_requires_separate_50_file',true
) AS verification;
ROLLBACK;
