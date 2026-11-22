-- DEV ONLY native PostgreSQL17 compilation check of exact BG1-v5 and v6 transformations,
-- namespace-mapped to a disposable fixture (no runtime changes to real Dev BG1).
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='45s';
DO $gate$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>session_user
 OR to_regnamespace('jetnity_at_prod_guard_compile_20261122') IS NOT NULL
 THEN RAISE EXCEPTION 'BG1_COMPILE_FIXTURE_CONTEXT_NOT_ISOLATED'; END IF;
END $gate$;
CREATE SCHEMA jetnity_at_prod_guard_compile_20261122;
CREATE TABLE jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.status_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_rollback_v6(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.state_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.baselines_v1(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.rolling_policy_v2(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE TABLE jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2(singleton boolean,catalog jsonb,proof_not_before timestamptz,required_generation bigint,predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text,source_id text,accepted_sha text,accepted_bytes integer,expected_watch_state text,installed_at timestamptz,component text);
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.catalog_status_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','jetnity_weather_private','official_v3_at_production_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','jetnity_bg1_alarm_kind_v2','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname IN ('profiles','saved_offers') OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype FROM pg_depend d
      WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)) d
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype FROM pg_shdepend d
      WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
        OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))) d
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
 UNION ALL SELECT 'transport:production_http_id_allocator_v4',jsonb_build_object('native',jsonb_build_object(
 'net_namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('net')),
 'pg_net_extension',(SELECT to_jsonb(e) FROM pg_extension e WHERE e.extname='pg_net'),
 'replication_parameter_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::pg_catalog.jsonb)
   FROM pg_parameter_acl a WHERE a.parname='session_replication_role'),
 'replication_role_settings',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::pg_catalog.jsonb)
   FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'replication_function_settings',(SELECT coalesce(jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'supautils_settings',jsonb_build_object(
   'privileged_role',current_setting('supautils.privileged_role',true),
   'privileged_role_allowed_configs',current_setting('supautils.privileged_role_allowed_configs',true)),
 'queue_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue')),
 'queue_attributes',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.attnum),'[]'::pg_catalog.jsonb)
   FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')),
 'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY d.adnum),'[]'::pg_catalog.jsonb)
   FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')),
 'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::pg_catalog.jsonb)
   FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue')),
 'queue_indexes',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::pg_catalog.jsonb)
   FROM pg_index i WHERE i.indrelid=to_regclass('net.http_request_queue')),
 'queue_rules',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.oid),'[]'::pg_catalog.jsonb)
   FROM pg_rewrite r WHERE r.ev_class=to_regclass('net.http_request_queue')),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p')),
 'stored_transport_consumers',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
   AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
   AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]'
     OR p.prosrc LIKE '%net.http_request_queue%'))
),'method_domain',jsonb_build_object(
 'type',(SELECT to_jsonb(t) FROM pg_type t WHERE t.oid=to_regtype('net.http_method')),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex'))
  ORDER BY c.oid),'[]'::pg_catalog.jsonb) FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')))
,'cron_contract',(
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'jobid',j.jobid::text,'jobname',j.jobname,'schedule',j.schedule,
  'active',j.active,'database',j.database,'username',j.username,
  'command_sha256',encode(sha256(convert_to(j.command,'UTF8')),'hex'),
  'full_row_sha256',encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex')
 ) ORDER BY j.jobname COLLATE "C",j.jobid),'[]'::jsonb)
 FROM (SELECT * FROM cron.job
  WHERE jobname IN('jetnity-at-production-source-collect-v1',
   'jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-renew-v1',
   'jetnity-at-production-source-qualified-renew-v2',
   'jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1')
  ORDER BY jobname COLLATE "C",jobid LIMIT 6) j
),'allocator',jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'function',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
   FROM pg_proc p WHERE p.oid=to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')),
 'global_trigger',(SELECT to_jsonb(t) FROM pg_trigger t
   WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1'),
 'dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM owned_objects)
   OR (d.refclassid,d.refobjid) IN(SELECT * FROM owned_objects)),
 'shared_dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND (d.classid,d.objid) IN(SELECT * FROM owned_objects))
))
)
SELECT jsonb_object_agg_unique(key,value) FROM entries
$function$
;
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ch_at_v5 jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4%ROWTYPE;
 optimized jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_prod_guard_compile_20261122.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT ch_at_v5 FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_prod_guard_compile_20261122.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_prod_guard_compile_20261122.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('jetnity_at_prod_guard_compile_20261122.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)<>3
 OR ch_at_v5.catalog IS DISTINCT FROM jetnity_at_prod_guard_compile_20261122.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.assert_v5()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ch_at_v5 jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4%ROWTYPE;
 optimized jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_prod_guard_compile_20261122.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT ch_at_v5 FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_prod_guard_compile_20261122.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_prod_guard_compile_20261122.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('jetnity_at_prod_guard_compile_20261122.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)<>3
 OR ch_at_v5.catalog IS DISTINCT FROM jetnity_at_prod_guard_compile_20261122.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.require_v5()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_prod_guard_compile_20261122.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM jetnity_at_prod_guard_compile_20261122.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_prod_guard_compile_20261122.status_baseline_v1 b CROSS JOIN jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_prod_guard_compile_20261122.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.assert_v6()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ch_at_v6 jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_rollback_v6%ROWTYPE;
 ch_at_v5 jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4%ROWTYPE;
 optimized jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_prod_guard_compile_20261122.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT ch_at_v6 FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_rollback_v6 WHERE singleton;
  SELECT * INTO STRICT ch_at_v5 FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM jetnity_at_prod_guard_compile_20261122.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_prod_guard_compile_20261122.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_prod_guard_compile_20261122.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_prod_guard_compile_20261122.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('jetnity_at_prod_guard_compile_20261122.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM jetnity_at_prod_guard_compile_20261122.ch_source_qualifications_v2)<>3
 OR ch_at_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(ch_at_v5.catalog::text,'UTF8')),'hex')
 OR ch_at_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(ch_at_v5)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM ch_at_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v6.required_generation<=ch_at_v5.required_generation
 OR ch_at_v6.proof_not_before<=ch_at_v5.proof_not_before
 OR ch_at_v6.catalog IS DISTINCT FROM jetnity_at_prod_guard_compile_20261122.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;
CREATE OR REPLACE FUNCTION jetnity_at_prod_guard_compile_20261122.require_v6()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_prod_guard_compile_20261122.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM jetnity_at_prod_guard_compile_20261122.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_prod_guard_compile_20261122.status_baseline_v1 b CROSS JOIN jetnity_at_prod_guard_compile_20261122.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_prod_guard_compile_20261122.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_prod_guard_compile_20261122.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_prod_guard_compile_20261122.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_prod_guard_compile_20261122.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM jetnity_at_prod_guard_compile_20261122.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_prod_guard_compile_20261122.bg1_prod_ch_at_rollback_v6 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_prod_guard_compile_20261122.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;
SELECT jsonb_build_object(
 'verdict','DEV_PG17_PROD_V1_BG1_V5_AND_V6_FUNCTION_SYNTAX_COMPILED',
 'functions_compiled',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='jetnity_at_prod_guard_compile_20261122'),
 'main_catalog_v5_procedure',to_regprocedure('jetnity_at_prod_guard_compile_20261122.catalog_status_v1()') IS NOT NULL,
 'v5_assert_procedure',to_regprocedure('jetnity_at_prod_guard_compile_20261122.assert_v5()') IS NOT NULL,
 'v5_require_procedure',to_regprocedure('jetnity_at_prod_guard_compile_20261122.require_v5()') IS NOT NULL,
 'v6_assert_procedure',to_regprocedure('jetnity_at_prod_guard_compile_20261122.assert_v6()') IS NOT NULL,
 'v6_require_procedure',to_regprocedure('jetnity_at_prod_guard_compile_20261122.require_v6()') IS NOT NULL,
 'exact_prod_BG1_runtime_executed',false,
 'native_schema_rewrite_only',true,
 'production_writes',false,'transaction_end','ROLLBACK') AS result;
ROLLBACK;
