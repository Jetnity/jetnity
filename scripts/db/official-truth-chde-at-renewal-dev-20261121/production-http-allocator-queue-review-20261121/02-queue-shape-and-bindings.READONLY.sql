-- PREPARED ONLY; NOT EXECUTED. This separate diagnostic needs a NEW exact Production READ Go.
-- Fixed connector target qscbgcdmivbbnzrcyegn; SQL markers do not authenticate a project ref.
-- Proposed authority: at most ONE read in a five-minute window; no retry or follow-up permission.
-- Catalog structure/counts/booleans/hashes only. No queue/source/fact rows or sequence values.
-- No application/guard calls, HTTP, DDL, repair, native binary assertion or writer approval.
-- Historical 01 predicate and upstream v0.19.5 column expectations are reported separately.
-- net.http_method is a DOMAIN over text, NOT an enum. Constraint hashes require manual review.
-- Native transport JSON is unchanged from 01; its hash is review evidence even when shape differs.
-- Missing objects, unsafe bounds, SQL/service error or output >1 MiB means STOP.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;

WITH expected_functions(signature) AS (VALUES
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)'),
 ('net.http_get(text,jsonb,jsonb,integer)'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)'),
 ('official_v3_at_production_private.collect_v1()'),
 ('official_v3_at_production_private.enqueue_v1()'),
 ('official_v3_at_production_private.renew_ch_v1()'),
 ('official_v3_guard_private.assert_catalog_v1()'),
 ('official_v3_guard_private.audit_v1()'),
 ('official_v3_guard_private.catalog_status_v1()'),
 ('official_v3_guard_private.require_open_v1()'),
 ('public.official_v3_guard_alarm_status_v1()'),
 ('official_v3_guard_private.check_control_v1()'),
 ('official_v3_guard_private.check_retirements_v1()'),
 ('official_v3_guard_private.immutable_v1()'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)'),
 ('jetnity_prod_import_scheduler.tick_v1()'),
 ('net.wake()')), context AS MATERIALIZED (
 SELECT coalesce(current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
 AND current_setting('server_version_num')::integer/10000=17
 AND current_setting('server_encoding')='UTF8'
 AND current_setting('transaction_read_only')='on'
 AND current_setting('transaction_isolation')='repeatable read'
 AND current_setting('session_replication_role') IN('origin','local')
 AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls)
 AND to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
 AND to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 AND to_regnamespace('jetnity_pgnet_allocator_private') IS NULL,false) AS ok
), cap AS MATERIALIZED (
 SELECT (SELECT count(*) FROM pg_proc WHERE pronamespace=to_regnamespace('net') AND prokind IN('f','p'))<=64
 AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
  AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
  AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]' OR p.prosrc LIKE '%net.http_request_queue%'))<=64
 AND (SELECT count(*) FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%'))<=64
 AND (SELECT count(*) FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%'))<=64
 AND (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue'))<=32
 AND NOT EXISTS(SELECT 1 FROM expected_functions e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
  WHERE p.oid IS NULL OR p.prokind NOT IN('f','p') OR octet_length(p.prosrc)>65536) AS ok
), required_relations(name,kind) AS (VALUES
 ('net.http_request_queue','r'),('net._http_response','r'),('net.http_request_queue_id_seq','S'),
 ('official_v3_at_production_private.watch_requests_v1','r'),
 ('jetnity_prod_import_scheduler.dispatches_v1','r'),
 ('official_v3_guard_private.bg1_transient_baseline_v3','r'),
 ('official_v3_guard_private.at_batch_switch_baseline_v2','r'),
 ('official_v3_at_production_private.source_pins_v1','r')
), relation_presence AS MATERIALIZED (
 SELECT e.name,e.kind AS expected_kind,c.oid,c.relkind::text AS actual_kind,
 c.oid IS NOT NULL AS present,coalesce(c.relkind::text=e.kind,false) AS kind_matches
 FROM required_relations e LEFT JOIN pg_class c ON c.oid=to_regclass(e.name)
), method_domain AS MATERIALIZED (
 SELECT t.* FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname='net' AND t.typname='http_method'
), metadata_function_ids AS MATERIALIZED (
 SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.oid IN(SELECT to_regprocedure(signature) FROM expected_functions)
 OR (n.nspname='net' AND p.prokind IN('f','p'))
 OR EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')
 OR (p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
  AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
  AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]' OR p.prosrc LIKE '%net.http_request_queue%'))
), metadata_caps AS MATERIALIZED (
 SELECT
 (SELECT count(*) FROM metadata_function_ids)<=209
 AND NOT EXISTS(SELECT 1 FROM pg_proc p JOIN metadata_function_ids f ON f.oid=p.oid
  WHERE octet_length(p.prosrc)>65536 OR octet_length(coalesce(p.probin,''))>65536
   OR octet_length((to_jsonb(p)-ARRAY['prosrc','probin'])::text)>131072)
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))<=32
 AND (SELECT count(*) FROM pg_constraint WHERE conrelid=to_regclass('net.http_request_queue'))<=64
 AND (SELECT count(*) FROM pg_index WHERE indrelid=to_regclass('net.http_request_queue'))<=32
 AND (SELECT count(*) FROM pg_rewrite WHERE ev_class=to_regclass('net.http_request_queue'))<=32
 AND (SELECT count(*) FROM pg_trigger WHERE tgrelid=to_regclass('net.http_request_queue'))<=32
 AND (SELECT count(*) FROM method_domain)<=1
 AND (SELECT count(*) FROM pg_constraint WHERE contypid IN(SELECT oid FROM method_domain))<=16
 AND (SELECT count(*) FROM pg_parameter_acl WHERE parname='session_replication_role')<=1
 AND octet_length(coalesce(current_setting('supautils.privileged_role',true),''))<=16384
 AND octet_length(coalesce(current_setting('supautils.privileged_role_allowed_configs',true),''))<=16384
 AND NOT EXISTS(SELECT 1 FROM (
  SELECT to_jsonb(a)::text AS catalog_row FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')
  UNION ALL SELECT to_jsonb(d)::text FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')
  UNION ALL SELECT to_jsonb(c)::text FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue') OR c.contypid IN(SELECT oid FROM method_domain)
  UNION ALL SELECT to_jsonb(i)::text FROM pg_index i WHERE i.indrelid=to_regclass('net.http_request_queue')
  UNION ALL SELECT to_jsonb(r)::text FROM pg_rewrite r WHERE r.ev_class=to_regclass('net.http_request_queue')
  UNION ALL SELECT to_jsonb(t)::text FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')
  UNION ALL SELECT to_jsonb(t)::text FROM method_domain t
  UNION ALL SELECT to_jsonb(c)::text FROM pg_class c WHERE c.oid IN(to_regclass('net.http_request_queue'),to_regclass('net.http_request_queue_id_seq'))
  UNION ALL SELECT to_jsonb(s)::text FROM pg_sequence s WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')
  UNION ALL SELECT to_jsonb(n)::text FROM pg_namespace n WHERE n.nspname='net'
  UNION ALL SELECT to_jsonb(e)::text FROM pg_extension e WHERE e.extname='pg_net'
  UNION ALL SELECT to_jsonb(a)::text FROM pg_parameter_acl a WHERE a.parname='session_replication_role'
  UNION ALL SELECT to_jsonb(s)::text FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')
 ) bounded_rows WHERE octet_length(catalog_row)>65536) AS ok
), inventory AS MATERIALIZED (
 WITH actual AS (
 SELECT n.nspname::text AS schema_name,c.relname::text AS table_name,
  a.attname::text AS column_name,c.relpersistence::text AS persistence,
  c.relkind::text AS kind,c.relispartition,
  EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid) AS inherited,
  a.atttypid='pg_catalog.int8'::pg_catalog.regtype AS exact_bigint,
  a.attgenerated='' AND a.attidentity='' AS ordinary_column
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid
 JOIN pg_type typ ON typ.oid=a.atttypid
 WHERE c.relkind IN('r','p','f','v','m') AND c.relpersistence IN('p','u')
 AND n.nspname NOT IN('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
 AND a.attnum>0 AND NOT a.attisdropped
 AND (a.atttypid='pg_catalog.int8'::pg_catalog.regtype OR typ.typbasetype='pg_catalog.int8'::pg_catalog.regtype)
 AND (a.attname ~ '(^|_)request_id$'
   OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
), expected(schema_name,table_name,column_name,persistence) AS (VALUES
 ('jetnity_prod_import_scheduler','dispatches_v1','net_request_id','p'),
 ('official_v3_at_production_private','watch_requests_v1','request_id','p'),
 ('net','http_request_queue','id','u'),('net','_http_response','id','u')),
 differences AS (
 (SELECT schema_name,table_name,column_name,persistence FROM actual EXCEPT SELECT * FROM expected)
 UNION ALL (SELECT * FROM expected EXCEPT SELECT schema_name,table_name,column_name,persistence FROM actual)
 ) SELECT (SELECT count(*) FROM actual)=4 AND NOT EXISTS(SELECT 1 FROM differences)
 AND NOT EXISTS(SELECT 1 FROM actual WHERE kind<>'r' OR relispartition OR inherited
 OR NOT exact_bigint OR NOT ordinary_column)
 AND NOT EXISTS(SELECT 1 FROM (VALUES ('jetnity_dev_import_scheduler.dispatches_v1'),('jetnity_dev_import_scheduler.preview_dispatches_v1'),('jetnity_followup_source_monitor_private.items_v1'),('jetnity_followup_source_monitor_private.items_v2'),('jetnity_followup_source_monitor_private.items_v3'),('jetnity_global_source_monitor_private.requests_v1'),('jetnity_source_dispatch_private.observations_v1'),('jetnity_source_dispatch_private.requests_v1'),('jetnity_usagov_fallback_private.original_v1'),('jetnity_usagov_watch_private.observations_v1'),('jetnity_usagov_watch_private.requests_v1'),('official_v3_at_source_watch_private.reads_v1'),('official_v3_source_renewal_private.observations_v1'),('supabase_functions.hooks')) absent(relation_name)
  WHERE to_regclass(absent.relation_name) IS NOT NULL) AS exact_inventory
), safe_metadata AS MATERIALIZED (
 SELECT coalesce(c.ok AND b.ok AND m.ok AND i.exact_inventory
  AND NOT EXISTS(SELECT 1 FROM relation_presence WHERE NOT present OR NOT kind_matches)
  AND EXISTS(SELECT 1 FROM pg_sequence WHERE seqrelid=to_regclass('net.http_request_queue_id_seq'))
  AND EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net'),false) AS ok
 FROM context c CROSS JOIN cap b CROSS JOIN metadata_caps m CROSS JOIN inventory i
), functions AS MATERIALIZED (
 SELECT e.signature,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.provolatile,
 encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex') AS config_sha256,
 encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex') AS acl_sha256,
 pg_get_function_result(p.oid) AS result_type,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') AS definition_sha256,
 encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') AS body_sha256
 FROM expected_functions e JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)
 CROSS JOIN safe_metadata g WHERE g.ok
), queue_shape AS MATERIALIZED (
 WITH expected(name,type_name,required_not_null) AS (VALUES
 ('id','pg_catalog.int8',true),('method','pg_catalog.text',true),('url','pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',true),('body','pg_catalog.bytea',false),('timeout_milliseconds','pg_catalog.int4',true)),
 actual AS (SELECT * FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)
SELECT CASE WHEN (SELECT ok FROM safe_metadata) THEN
 ((SELECT count(*) FROM actual)=6
 AND NOT EXISTS(SELECT 1 FROM expected e LEFT JOIN actual a ON a.attname=e.name
  WHERE a.attnum IS NULL OR a.attisdropped OR a.atttypid<>to_regtype(e.type_name)
  OR a.attnotnull IS DISTINCT FROM e.required_not_null OR a.attgenerated<>'' OR a.attidentity<>'')
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))=1
 AND EXISTS(SELECT 1 FROM pg_attrdef d JOIN actual a ON a.attnum=d.adnum
  WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'
  AND pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)')
) ELSE NULL END AS exact_queue_shape_and_legacy_default
), expected_columns(name,legacy_type,legacy_not_null,upstream_type,upstream_not_null) AS (VALUES
 ('id','pg_catalog.int8',true,'pg_catalog.int8',true),
 ('method','pg_catalog.text',true,'net.http_method',true),
 ('url','pg_catalog.text',true,'pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',true,'pg_catalog.jsonb',false),
 ('body','pg_catalog.bytea',false,'pg_catalog.bytea',false),
 ('timeout_milliseconds','pg_catalog.int4',true,'pg_catalog.int4',true)
), default_details AS MATERIALIZED (
 SELECT d.adnum,count(*) AS default_count,
 min(CASE WHEN g.ok THEN encode(sha256(convert_to(pg_get_expr(d.adbin,d.adrelid),'UTF8')),'hex') END) AS expression_sha256,
 bool_and(CASE WHEN g.ok THEN pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)' ELSE false END) AS is_expected_legacy_id_default
 FROM pg_attrdef d CROSS JOIN safe_metadata g
 WHERE d.adrelid=to_regclass('net.http_request_queue') GROUP BY d.adnum
), column_details AS MATERIALIZED (
 SELECT e.name,e.legacy_type,e.legacy_not_null,e.upstream_type,e.upstream_not_null,
 a.attnum IS NOT NULL AS present,a.attnum,a.atttypid AS actual_type_oid,
 CASE WHEN a.attnum IS NOT NULL THEN format_type(a.atttypid,a.atttypmod) END AS actual_type,
 a.attnotnull AS actual_not_null,a.attisdropped AS dropped,a.attidentity::text AS identity_kind,a.attgenerated::text AS generated_kind,
 coalesce(a.atttypid=to_regtype(e.legacy_type),false) AS legacy_type_matches,
 coalesce(a.attnotnull=e.legacy_not_null,false) AS legacy_not_null_matches,
 coalesce(a.atttypid=CASE WHEN e.name='method' THEN (SELECT oid FROM method_domain)
  ELSE to_regtype(e.upstream_type) END,false) AS upstream_type_matches,
 coalesce(a.attnotnull=e.upstream_not_null,false) AS upstream_not_null_matches,
 coalesce(NOT a.attisdropped AND a.attidentity='' AND a.attgenerated='',false) AS ordinary_live_column,
 coalesce(d.default_count,0) AS default_count,
 CASE WHEN d.default_count=1 THEN d.expression_sha256 END AS default_expression_sha256,
 CASE WHEN e.name='id' THEN coalesce(d.default_count=1 AND d.is_expected_legacy_id_default,false)
  ELSE a.attnum IS NOT NULL AND coalesce(d.default_count,0)=0 END AS expected_default_matches
 FROM expected_columns e LEFT JOIN pg_attribute a ON a.attrelid=to_regclass('net.http_request_queue') AND a.attnum>0 AND a.attname=e.name
 LEFT JOIN default_details d ON d.adnum=a.attnum
), domain_details AS MATERIALIZED (
 SELECT jsonb_build_object(
  'present',EXISTS(SELECT 1 FROM method_domain),'oid',(SELECT oid FROM method_domain),
  'type_kind',(SELECT typtype::text FROM method_domain),
  'is_domain_over_text',coalesce((SELECT typtype='d' AND typbasetype='pg_catalog.text'::regtype FROM method_domain),false),
  'domain_not_null',(SELECT typnotnull FROM method_domain),
  'upstream_domain_not_null_matches',coalesce((SELECT NOT typnotnull FROM method_domain),false),
  'base_type_oid',(SELECT typbasetype FROM method_domain),
  'constraint_count',(SELECT count(*) FROM pg_constraint WHERE contypid IN(SELECT oid FROM method_domain)),
  'check_constraint_count',(SELECT count(*) FROM pg_constraint WHERE contypid IN(SELECT oid FROM method_domain) AND contype='c'),
  'constraints',CASE WHEN g.ok THEN (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'kind',c.contype::text,'validated',c.convalidated,
    'catalog_sha256',encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex'),
    'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex')) ORDER BY c.oid),'[]'::jsonb)
    FROM pg_constraint c WHERE c.contypid IN(SELECT oid FROM method_domain)) ELSE NULL END,
  'expected_native_constraint_hash_supplied',false,'constraint_semantics_verified',false) AS value
 FROM safe_metadata g
), values_if_bounded AS MATERIALIZED (
 SELECT CASE WHEN g.ok THEN
 jsonb_build_object('native_transport',jsonb_build_object(
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
))
 END AS value,c.ok AS context_ok,b.ok AS original_caps_ok,m.ok AS metadata_caps_ok,
 i.exact_inventory,q.exact_queue_shape_and_legacy_default,g.ok AS bounded_metadata_read
 FROM context c CROSS JOIN cap b CROSS JOIN metadata_caps m CROSS JOIN inventory i
 CROSS JOIN queue_shape q CROSS JOIN safe_metadata g
), result_document AS (
 SELECT jsonb_build_object(
 'package','PROD_HTTP_ALLOCATOR_QUEUE_REVIEW_20261121','declared_target','qscbgcdmivbbnzrcyegn',
 'project_ref_authenticated_by_sql',false,'observed_at',statement_timestamp(),
 'result',CASE
  WHEN EXISTS(SELECT 1 FROM relation_presence WHERE NOT present) THEN 'STOP_MISSING_REQUIRED_RELATION'
  WHEN NOT context_ok THEN 'STOP_CONTEXT'
  WHEN NOT original_caps_ok OR NOT metadata_caps_ok THEN 'STOP_MISSING_OR_OVER_CAP'
  WHEN EXISTS(SELECT 1 FROM relation_presence WHERE NOT kind_matches) THEN 'STOP_REQUIRED_RELATION_KIND'
  WHEN NOT exact_inventory THEN 'STOP_ID_INVENTORY_CHANGED'
  WHEN NOT bounded_metadata_read OR value IS NULL THEN 'STOP_NULL_OR_INCOMPLETE_BINDINGS'
  ELSE 'QUEUE_SHAPE_AND_BINDINGS_OBSERVED_REVIEW_REQUIRED_NO_WRITE_PERMISSION' END,
 'context_ok',context_ok,'original_caps_ok',original_caps_ok,'metadata_caps_ok',metadata_caps_ok,
 'exact_four_id_paths',exact_inventory,'bounded_metadata_read',bounded_metadata_read,
 'relations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY name) FROM relation_presence r),
 'historical_01_exact_queue_shape_and_legacy_default',exact_queue_shape_and_legacy_default,
 'upstream_0195_column_type_nullability_and_default_match',
  bounded_metadata_read AND (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)=6
  AND NOT EXISTS(SELECT 1 FROM column_details WHERE NOT present OR NOT ordinary_live_column OR NOT upstream_type_matches OR NOT upstream_not_null_matches OR NOT expected_default_matches)
  AND coalesce((SELECT typtype='d' AND typbasetype='pg_catalog.text'::regtype AND NOT typnotnull FROM method_domain),false),
 'upstream_domain_constraint_semantics_verified',false,
 'queue_columns',(SELECT jsonb_agg(to_jsonb(d) ORDER BY name) FROM column_details d),
 'queue_physical_user_column_count',(SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0),
 'queue_active_user_column_count',(SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0 AND NOT attisdropped),
 'queue_dropped_user_column_count',(SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0 AND attisdropped),
 'queue_default_count',(SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue')),
 'queue_user_slots',CASE WHEN bounded_metadata_read THEN (SELECT coalesce(jsonb_agg(jsonb_build_object(
  'attnum',a.attnum,'expected_name',CASE WHEN a.attname IN(SELECT name FROM expected_columns) THEN a.attname::text END,
  'name_sha256',encode(sha256(convert_to(a.attname::text,'UTF8')),'hex'),
  'type_oid',a.atttypid,'not_null',a.attnotnull,'dropped',a.attisdropped,
  'identity_kind',a.attidentity::text,'generated_kind',a.attgenerated::text) ORDER BY a.attnum),'[]'::jsonb)
  FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue') AND a.attnum>0) ELSE NULL END,
 'method_domain',(SELECT value FROM domain_details),
 'legacy_id_default_sha256',(SELECT default_expression_sha256 FROM column_details WHERE name='id'),
 'functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY signature),'[]'::jsonb) FROM functions f),
 'native_transport_sha256',encode(sha256(convert_to((value->'native_transport')::text,'UTF8')),'hex'),
 'native_transport_expression_unchanged_from_01',true,'native_transport_raw_values_returned',false,
 'transport_safe_shape',jsonb_build_object(
  'extension_version',value#>>'{native_transport,pg_net_extension,extversion}',
  'queue_owner',(SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid=to_regclass('net.http_request_queue')),
  'queue_attribute_count',jsonb_array_length(value#>'{native_transport,queue_attributes}'),
  'queue_default_count',jsonb_array_length(value#>'{native_transport,queue_defaults}'),
  'queue_constraint_count',jsonb_array_length(value#>'{native_transport,queue_constraints}'),
  'queue_index_count',jsonb_array_length(value#>'{native_transport,queue_indexes}'),
  'queue_rule_count',jsonb_array_length(value#>'{native_transport,queue_rules}'),
  'queue_trigger_count',jsonb_array_length(value#>'{native_transport,queue_triggers}'),
  'net_function_count',jsonb_array_length(value#>'{native_transport,net_functions}'),
  'stored_transport_consumer_count',jsonb_array_length(value#>'{native_transport,stored_transport_consumers}'),
  'supautils_privileged_role_is_expected',coalesce(current_setting('supautils.privileged_role',true)='supabase_privileged_role',false),
  'supautils_allows_replica_parameter',coalesce(position('session_replication_role' IN current_setting('supautils.privileged_role_allowed_configs',true))>0,false)),
  'transport_function_fingerprints',(SELECT coalesce(jsonb_agg(jsonb_build_object(
    'signature',p.oid::pg_catalog.regprocedure::text,'owner',pg_get_userbyid(p.proowner),
    'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
    'body_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY p.oid),'[]'::jsonb)
   FROM pg_proc p WHERE p.oid IN(SELECT (v->>'oid')::oid FROM jsonb_array_elements(value#>'{native_transport,net_functions}') v
    UNION SELECT (v->>'oid')::oid FROM jsonb_array_elements(value#>'{native_transport,stored_transport_consumers}') v)),
 'hooks_absent',to_regclass('supabase_functions.hooks') IS NULL,
 'queue_insert',coalesce(has_table_privilege(current_user,to_regclass('net.http_request_queue')::oid,'INSERT'),false),
 'queue_update',coalesce(has_table_privilege(current_user,to_regclass('net.http_request_queue')::oid,'UPDATE'),false),
 'queue_trigger',coalesce(has_table_privilege(current_user,to_regclass('net.http_request_queue')::oid,'TRIGGER'),false),
 'server_version_num',current_setting('server_version_num'),'read_only',current_setting('transaction_read_only')='on',
 'raw_history_or_source_body_returned',false,'product_routine_invoked',false,'sequence_value_read',false,
 'worker_binary_or_runtime_contract_verified',false,'source_qualification_or_renewal_granted',false,
 'repair_permission',false,'writer_permission',false,'followup_query_permission',false) AS document
 FROM values_if_bounded
)
SELECT CASE WHEN octet_length(document::text)<=1048576 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_1048576_BYTES','repair_permission',false,
 'writer_permission',false,'followup_query_permission',false) END AS result FROM result_document;
ROLLBACK;
