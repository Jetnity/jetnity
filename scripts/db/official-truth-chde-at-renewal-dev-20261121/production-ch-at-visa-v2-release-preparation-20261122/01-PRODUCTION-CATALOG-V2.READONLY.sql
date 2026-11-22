-- PREPARED ONLY. NEW OWNER GO REQUIRED before any Production execution.
-- Schema-safe successor to 00: never reference absent official_v3_at_private.whole_originals_v2.
-- No installation, method operation, cron trigger, HTTP request or Production mutation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
WITH
 scope_namespaces AS (
   SELECT oid,nspname FROM pg_catalog.pg_namespace
   WHERE nspname IN ('official_v3_at_private','official_v3_at_production_private',
      'official_v3_at_source_watch_private','official_v3_source_renewal_private',
      'official_v3_method_private','official_v3_method_api','official_v3_guard_private',
      'jetnity_ot_auth','jetnity_prod_import_scheduler')
 ),
 relevant_relations AS (
   SELECT n.nspname,c.relname,c.oid,c.relkind,
     pg_catalog.pg_get_userbyid(c.relowner) AS owner,
     c.relacl::text AS acl,c.relrowsecurity AS rls,
     c.relforcerowsecurity AS force_rls
   FROM pg_catalog.pg_class c
   JOIN scope_namespaces n ON n.oid=c.relnamespace
   WHERE c.relkind IN ('r','p','v','m','S')
 ),
 target_functions AS (
  SELECT n.nspname,p.proname,p.oid,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef AS definer,p.proacl::text AS acl,
    pg_catalog.pg_get_functiondef(p.oid) AS definition
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE (n.nspname,p.proname) IN (
    ('official_v3_guard_private','catalog_status_v1'),
    ('official_v3_guard_private','assert_catalog_v1'),
    ('official_v3_guard_private','require_open_v1'),
    ('official_v3_guard_private','audit_v1'),
    ('official_v3_guard_private','bg1_production_http_allocator_v4'),
    ('official_v3_source_renewal_private','seal_at_v1'),
    ('official_v3_source_renewal_private','renew_approved_batch_v1'),
    ('official_v3_at_source_watch_private','collect_v1'),
    ('official_v3_at_source_watch_private','enqueue_v1'),
    ('official_v3_at_source_watch_private','status_v1'),
    ('official_v3_method_api','stage_draft_v1'),
    ('official_v3_method_api','approve_v1'),
    ('public','jetnity_source_bound_at_visa_v1'),
    ('public','jetnity_at_visa_v3'),
    ('public','jetnity_at_ch_visa_v4'),
    ('public','official_v3_guard_alarm_status_v1')
  )
 )
SELECT pg_catalog.jsonb_build_object(
 'scope','PROD_CH_AT_VISA_V2_CATALOG_V2_READONLY_ONLY',
 'timestamp_utc',pg_catalog.clock_timestamp(),
 'server_version_num',pg_catalog.current_setting('server_version_num'),
 'database_name',pg_catalog.current_database(),
 'connection_role',pg_catalog.current_user,
 'expected_prod_project','qscbgcdmivbbnzrcyegn',
 'no_ddl_or_dml',true,
 'originals_v2_exists',pg_catalog.to_regclass('official_v3_at_private.whole_originals_v2') IS NOT NULL,
 'originals_other_existing_relations',(
   SELECT pg_catalog.jsonb_agg(relname ORDER BY relname)
   FROM relevant_relations
   WHERE nspname='official_v3_at_private' AND relname ILIKE '%original%'
 ),
 'bg1_v4_locator',pg_catalog.to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4')::text,
 'at_existing_schema_inventory',(
   SELECT pg_catalog.coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
     'name',r.nspname||'.'||r.relname,'kind',r.relkind,'owner',r.owner,'acl',r.acl,
     'rls',r.rls,'force_rls',r.force_rls,
     'columns',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
        'notnull',a.attnotnull) ORDER BY a.attnum)
        FROM pg_catalog.pg_attribute a WHERE a.attrelid=r.oid AND a.attnum>0 AND NOT a.attisdropped)
     ) ORDER BY r.nspname,r.relname),'[]'::jsonb)
   FROM relevant_relations r
 ),
 'function_definitions_and_hashes',(
   SELECT pg_catalog.coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
     'name',f.nspname||'.'||f.proname,'arguments',f.arguments,
     'owner',f.owner,'definer',f.definer,'acl',f.acl,
     'sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.definition,'UTF8')),'hex'),
     'definition',f.definition) ORDER BY f.nspname,f.proname,f.arguments),'[]'::jsonb)
   FROM target_functions f
 ),
 'postgres_job_owner_membership',(
   SELECT pg_catalog.coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
     'grantor',pg_catalog.pg_get_userbyid(m.grantor),
     'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)),'[]'::jsonb)
   FROM pg_catalog.pg_auth_members m
   JOIN pg_catalog.pg_roles r ON r.oid=m.roleid
   JOIN pg_catalog.pg_roles mem ON mem.oid=m.member
   WHERE r.rolname='ot_v3_jobs_owner' AND mem.rolname='postgres'
 ),
 'next_action','OFFLINE_REBIND_ONLY; NO_INSTALL_GO'
) AS catalog;
ROLLBACK;
