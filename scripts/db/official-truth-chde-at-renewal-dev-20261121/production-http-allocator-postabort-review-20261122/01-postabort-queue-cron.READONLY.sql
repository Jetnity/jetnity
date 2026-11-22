-- PREPARED ONLY. One separately authorized Production READ, never an automatic retry of failed 10.
-- Fixed external target qscbgcdmivbbnzrcyegn; SQL cannot authenticate a project reference.
-- At most one call/transaction within five minutes; one JSON result <=262144 bytes; no retry/follow-up.
-- No app/guard/publisher/audit/Owner function calls, DDL, role/grant change, explicit LOCK TABLE,
-- nextval/setval, HTTP, source/fact/Owner rows or queue content output.
-- Queue rows are read only for <=10001-row count and the two exact failed-10 probe URL predicates.
-- Missing required relations/SELECT rights are STOP (including native SQL errors); optional allocator
-- objects are inspected through catalogs only, never FROM an optional relation.
-- Compares archived 02 metadata and five V2 Cron configurations, NOT a nonexistent pre-10 rowsnapshot.
-- Natural queues/responses/cron runs/counters may advance. No full rollback or current BG1/AT PASS.
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
,false) AS ok
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
 i.exact_inventory,g.ok AS bounded_metadata_read
 FROM context c CROSS JOIN cap b CROSS JOIN metadata_caps m CROSS JOIN inventory i
 CROSS JOIN safe_metadata g
), expected_bindings(signature,owner_name,is_definer,volatility,result_type,acl_sha,config_sha,definition_sha,body_sha) AS (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()','postgres',false,'v','text','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','429a6be355781df4575a7a3db1b0229a57a105e91bcf31bb3db68e23c51e25a5','57b101b3551b64e95bc68e6650d642ba34829fccb84bc081b7ad606879c176fe','ebc518fc18e8c5057941c1d65890171b510fa67138dc85023ac1d95195f6bb3a'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','1f2b6fc5ccc1511e77737a95c71228bed710482133a95a87cdb672d80373617b','7c4bd9c47e2d30bf80cf93bf71b1f5236c28de2e9f31b72aac047554ded974ae'),
 ('net.http_get(text,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','7012c5582cd0ab8d38f546af6633ea3c531950fb009f07127b99f8a1640eac1a','fac801ed417ff4ecda0f86a0bef9874d4b749fa34cc9000153aa4546b2cc8bac'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','ee3ec5bc54158b60b6c4e3a966a07a33dc009788fad8f6b7480ad1c45acdfe78','b7cde4add3ffb30c3a667d6038d223bbb03bac6cd5d181dab62f48c79c34f362'),
 ('net.wake()','supabase_admin',false,'v','void','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','b7f9cb7d7cd9b5259c6a29b1cae29b451b325a6f43169cee18b7ff723fad9efc','51391bf0ab33e8272bcfca0d61b5ab242391822f331fe51ac5930b58da8e5b25'),
 ('official_v3_at_production_private.collect_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','3e681172f296ba3c4202dbf8108552201f613f8de345e6c339288f8680683422','920f4b870a072d854c86b351439c9ce5f5ac6dd1ea7be5ed9d3f19fad9c4c8b2'),
 ('official_v3_at_production_private.enqueue_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90','e2e01f262b3d1f13b13fc6b7f77d0e6c6f79072005626cfebdcc38bc58d16de0'),
 ('official_v3_at_production_private.renew_ch_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','5171785c2b114a816c13c5e2dc26cc2a397c6837fccfcbda2974f706b10b5f76','f6acadd6730b206ee52053b8642f60ed883b19cdd920827cd9dd429bd6d5fb2f'),
 ('official_v3_guard_private.assert_catalog_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39','b1fbba658075d34cd3afcc7bebe34071ead11209156eeb3d5c8da19b52703403'),
 ('official_v3_guard_private.audit_v1()','postgres',true,'v','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff','303aa0c7c60b74e36b445dca0508e0c4f5f1c84a379832d8905ab8f501b8c5ae'),
 ('official_v3_guard_private.catalog_status_v1()','postgres',true,'s','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1','7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402','4f0a9a4fa1f81bb24e7900499f37cd7a72518342d2b54c5d79d025605e5de3b3'),
 ('official_v3_guard_private.check_control_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','8a5b56136dc5564b4d52e6e0dcb1f119f4b229cb985296044696c7463b646669','8a37a92bd1293a467665da5831d717e7675650af9a2f5ef60e1cf57899a99eb4'),
 ('official_v3_guard_private.check_retirements_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','1f45c1bd50cab57dedbaec8b25a2329ff291897a3252e9e91e43f0c41637f718','439bb69a36625c4611ae3bfb761266c4367e74ce32cf9765c6eaf37d8537466d'),
 ('official_v3_guard_private.immutable_v1()','postgres',false,'v','trigger','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','67a8778d002cb93436e0c1f6d498d27f4bc1b7cb228ad921bef0b1ab1566114d','912ce0a3cee4ab57ee76be8425053f5f42963db5a2943a76f0d49d70059f963b'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','0237901ef275badb4f12f6491f4f9f475177669e767001127a1de004a8d061cd','052cde985dfdb70561eaf8c5e10f33bafee4ee4cb9ed39f82dbc90a2e27c06b4'),
 ('official_v3_guard_private.require_open_v1()','postgres',true,'v','bigint','8d7f7dc66cd0965d575cf544d4f9a773c46bda7374851b88fe8da42ea59113f2','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','9ce675e839dc71ee19ddba5f44503472e2f1caa07add90d5709df4f5164a20e5','d86badf708baa17eccb6771d87c072e054e84f9b06b5497395cd6dc39ad5a5af'),
 ('public.official_v3_guard_alarm_status_v1()','postgres',true,'v','jsonb','c8789f4263f3a141a57ef770b25307024c51c4718475db91baa4af8dcd6782f4','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','d60554d4a4d902b76c51f9e5b1f2f718692732bcda614f0f1783a154ba7677ec','ac7a2addd6e51cb33d5308cfc7f4e2fd3dcd869057d36a84a63d6ed5ed4a34c3')
), function_comparison AS MATERIALIZED (
 SELECT e.signature,f.signature IS NOT NULL AS present,
 coalesce(f.owner=e.owner_name AND f.prosecdef=e.is_definer AND f.provolatile::text=e.volatility
  AND f.result_type=e.result_type AND f.acl_sha256=e.acl_sha AND f.config_sha256=e.config_sha
  AND f.definition_sha256=e.definition_sha AND f.body_sha256=e.body_sha,false) AS exact_archived_match,
 f.definition_sha256,f.body_sha256
 FROM expected_bindings e LEFT JOIN functions f USING(signature)
), expected_cron(jobname,schedule,command_sha256) AS (VALUES
 ('jetnity-at-production-source-collect-v1','*/5 * * * *','f16474de9c9e48b24d2ac84bc0ba3ac90d5ff401ef539ff1efa6ae94068dcf3f'),
 ('jetnity-at-production-source-enqueue-v1','*/5 * * * *','d7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890'),
 ('jetnity-at-production-source-renew-v1','2-59/5 * * * *','7f97fd0c29c97f45c4f5b3458c60ce59711d2d10589a1be16656211f96141593'),
 ('jetnity-ch-de-prod-import-v1','* * * * *','87241ddeaf94b27c22676857c098492029dcbdcf8ac90ba7a5feaf2f62f43144'),
 ('jetnity-official-truth-production-guard-v1','*/5 * * * *','8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863')
), cron_privileges AS MATERIALIZED (
 SELECT to_regclass('cron.job') IS NOT NULL AS relation_present,
 coalesce(has_table_privilege(current_user,to_regclass('cron.job')::oid,'SELECT'),false) AS can_select,
 coalesce(has_table_privilege(current_user,to_regclass('cron.job')::oid,'MAINTAIN'),false) AS can_maintain,
 coalesce(has_table_privilege(current_user,to_regclass('cron.job')::oid,'UPDATE'),false) AS can_update,
 coalesce(has_table_privilege(current_user,to_regclass('cron.job')::oid,'DELETE'),false) AS can_delete,
 coalesce(has_table_privilege(current_user,to_regclass('cron.job')::oid,'TRUNCATE'),false) AS can_truncate
), cron_sample AS MATERIALIZED (
 -- Job ID, node target and full-row hash are NEW observations, never claimed as an old equality pin.
 SELECT j.jobname,j.jobid,
 CASE WHEN octet_length(to_jsonb(j)::text)<=16384 THEN j.schedule END AS schedule,
 j.active,j.database='postgres' AS expected_database,j.username='postgres' AS postgres_role,
 octet_length(to_jsonb(j)::text)<=16384 AS row_within_cap,
 octet_length(j.command)<=4096 AS command_within_cap,
 CASE WHEN octet_length(j.command)<=4096 THEN encode(sha256(convert_to(j.command,'UTF8')),'hex') END AS command_sha256,
 CASE WHEN octet_length(to_jsonb(j)::text)<=16384 THEN encode(sha256(convert_to(j.nodename,'UTF8')),'hex') END AS nodename_sha256,
 coalesce(j.nodename IN('localhost','127.0.0.1','::1'),false) AS is_localhost,
 j.nodeport,j.nodeport=current_setting('port')::integer AS nodeport_matches_server,
 CASE WHEN octet_length(to_jsonb(j)::text)<=16384 THEN encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex') END AS cron_row_sha256
 FROM cron.job j CROSS JOIN safe_metadata g
 WHERE g.ok AND j.jobname IN(SELECT jobname FROM expected_cron)
 ORDER BY j.jobname,j.jobid LIMIT 6
), cron_comparison AS MATERIALIZED (
 SELECT e.jobname,count(j.jobname) AS observed_count,
 coalesce(count(j.jobname)=1 AND bool_and(j.schedule=e.schedule AND j.active AND j.expected_database
   AND j.postgres_role AND j.row_within_cap AND j.command_within_cap AND j.command_sha256=e.command_sha256),false) AS archived_configuration_match
 FROM expected_cron e LEFT JOIN cron_sample j USING(jobname) GROUP BY e.jobname
), queue_sample AS MATERIALIZED (
 SELECT q.url IN('https://example.invalid/production-id-rollback-proof-1',
  'https://example.invalid/production-id-rollback-proof-2') AS fixed_probe_url
 FROM net.http_request_queue q CROSS JOIN safe_metadata g WHERE g.ok LIMIT 10001
), queue_counts AS MATERIALIZED (
 SELECT count(*) AS row_count_at_most_10001,count(*)<10001 AS count_complete,
 count(*) FILTER(WHERE fixed_probe_url) AS fixed_probe_url_rows FROM queue_sample
), optimized_sample AS MATERIALIZED (
 SELECT b.* FROM official_v3_guard_private.query_cost_baseline_v1 b LIMIT 2
), legacy_sample AS MATERIALIZED (
 SELECT b.* FROM official_v3_guard_private.bg1_transient_baseline_v3 b LIMIT 2
), baseline_bounds AS MATERIALIZED (
 SELECT (SELECT count(*) FROM optimized_sample)=1 AND (SELECT count(*) FROM legacy_sample)=1
 AND NOT EXISTS(SELECT 1 FROM optimized_sample WHERE NOT singleton OR octet_length(to_jsonb(optimized_sample)::text)>16777216)
 AND NOT EXISTS(SELECT 1 FROM legacy_sample WHERE NOT singleton OR octet_length(to_jsonb(legacy_sample)::text)>16777216) AS ok
), baseline_comparison AS MATERIALIZED (
 SELECT CASE WHEN g.ok AND z.ok THEN (SELECT coalesce(
  o.algorithm='jsonb_unique_narrow_dependency_distinct_v1'
  AND o.predecessor_catalog_digest='7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
  AND o.predecessor_baseline_digest='a7266c41fc77ab63b8ce2878d10890c7d5b395a3a33d8fe6c5331bf68f7e2bd0'
  AND encode(sha256(convert_to(o.catalog::text,'UTF8')),'hex')='ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
  AND encode(sha256(convert_to(l.catalog::text,'UTF8')),'hex')=o.predecessor_catalog_digest
  AND encode(sha256(convert_to((to_jsonb(l)||jsonb_build_object('proof_not_before',extract(epoch FROM l.proof_not_before)))::text,'UTF8')),'hex')=o.predecessor_baseline_digest
  AND l.required_generation=1344 AND l.proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz,false)
  FROM optimized_sample o CROSS JOIN legacy_sample l) ELSE false END AS archived_v3_to_query_cost_match,
 CASE WHEN g.ok AND z.ok THEN (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM optimized_sample) END AS query_cost_catalog_sha256,
 CASE WHEN g.ok AND z.ok THEN (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM legacy_sample) END AS v3_catalog_sha256,
 z.ok AS within_bounds
 FROM safe_metadata g CROSS JOIN baseline_bounds z
), static_assessment AS MATERIALIZED (
 SELECT v.context_ok,v.original_caps_ok,v.metadata_caps_ok,v.exact_inventory,v.bounded_metadata_read,
 encode(sha256(convert_to((v.value->'native_transport')::text,'UTF8')),'hex') AS native_transport_sha256,
 coalesce(encode(sha256(convert_to((v.value->'native_transport')::text,'UTF8')),'hex')='60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f',false) AS native_transport_matches_02,
 to_regnamespace('jetnity_pgnet_allocator_private') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 AND NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='jetnity_pgnet_request_id_v1') AS fixed_persistent_allocator_objects_absent,
 NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('net.http_request_queue')) AS queue_has_no_triggers,
 (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)=6
 AND NOT EXISTS(SELECT 1 FROM column_details WHERE NOT present OR NOT ordinary_live_column
  OR NOT upstream_type_matches OR NOT upstream_not_null_matches OR NOT expected_default_matches) AS queue_columns_match_02,
 coalesce((SELECT oid=289454 AND typtype='d' AND typbasetype='pg_catalog.text'::regtype AND NOT typnotnull FROM method_domain),false)
 AND (SELECT count(*) FROM pg_constraint WHERE contypid IN(SELECT oid FROM method_domain))=1
 AND coalesce((SELECT value->'constraints'->0->>'kind'='c'
  AND value->'constraints'->0->'validated'='true'::jsonb
  AND value->'constraints'->0->>'definition_sha256'='412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de'
  AND value->'constraints'->0->>'catalog_sha256'='63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856' FROM domain_details),false) AS observed_domain_fields_match_02,
 (SELECT count(*)=17 AND bool_and(exact_archived_match) FROM function_comparison) AS archived_functions_match,
 (SELECT count(*) FROM cron_sample)=5 AND NOT EXISTS(SELECT 1 FROM cron_comparison WHERE NOT archived_configuration_match) AS five_archived_cron_configurations_match
 FROM values_if_bounded v
), result_document AS (
 SELECT jsonb_build_object(
 'package','PROD_HTTP_ALLOCATOR_POSTABORT_REVIEW_20261122','declared_target','qscbgcdmivbbnzrcyegn',
 'project_ref_authenticated_by_sql',false,'observed_at',statement_timestamp(),
 'result',CASE WHEN NOT a.context_ok THEN 'STOP_CONTEXT'
  WHEN NOT a.original_caps_ok OR NOT a.metadata_caps_ok OR NOT b.within_bounds THEN 'STOP_METADATA_CAP_OR_REQUIRED_OBJECT'
  WHEN NOT a.bounded_metadata_read OR NOT a.exact_inventory THEN 'STOP_INCOMPLETE_METADATA_OR_ID_INVENTORY'
  WHEN NOT a.fixed_persistent_allocator_objects_absent THEN 'STOP_ALLOCATOR_OBJECTS_PRESENT'
  WHEN NOT q.count_complete THEN 'STOP_QUEUE_SAMPLE_INCOMPLETE'
  WHEN q.fixed_probe_url_rows<>0 THEN 'STOP_FIXED_PROBE_URL_PRESENT'
  WHEN NOT coalesce(a.native_transport_matches_02 AND a.queue_has_no_triggers AND a.queue_columns_match_02
   AND a.observed_domain_fields_match_02 AND a.archived_functions_match AND a.five_archived_cron_configurations_match
   AND b.archived_v3_to_query_cost_match AND cp.can_select,false) THEN 'STOP_ARCHIVAL_METADATA_MISMATCH'
  ELSE 'POSTABORT_ARCHIVAL_METADATA_MATCH_OBSERVED_NO_REHEARSAL_PASS' END,
 'assessment',to_jsonb(a),'baseline_comparison',to_jsonb(b),'cron_privileges',to_jsonb(cp),
 'cron_share_lock_privilege_present',cp.can_maintain OR cp.can_update OR cp.can_delete OR cp.can_truncate,
 'queue_counts',to_jsonb(q),'queue_select',coalesce(has_table_privilege(current_user,to_regclass('net.http_request_queue')::oid,'SELECT'),false),
 'queue_columns',(SELECT jsonb_agg(to_jsonb(c) ORDER BY name) FROM column_details c),
 'method_domain_observed',(SELECT value FROM domain_details),
 'function_comparisons',(SELECT jsonb_agg(to_jsonb(f) ORDER BY signature) FROM function_comparison f),
 'cron_configurations',(SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY jobname),'[]'::jsonb) FROM cron_sample j),
 'cron_comparisons',(SELECT jsonb_agg(to_jsonb(c) ORDER BY jobname) FROM cron_comparison c),
 'cron_target_and_full_row_hash_are_new_observations',true,
 'cron_target_or_jobid_compared_to_prior_snapshot',false,
 'cron_reference_observed_at','2026-11-21T17:43:04.695814Z',
 'transport_reference_observed_at','2026-11-21T23:06:49.362212Z',
 'read_only',current_setting('transaction_read_only')='on','strong_lock_requested',false,
 'raw_queue_url_headers_body_or_commands_returned',false,'current_bg1_status_checked',false,
 'complete_live_guard_catalog_recomputed',false,'all_historical_chain_edges_revalidated',false,
 'pre_failure_rowsnapshot_available',false,'all_cron_jobs_compared',false,
 'dynamic_queue_cron_runs_response_or_sequence_equality_claimed',false,
 'complete_failed_rehearsal_rollback_proven',false,'negative_publisher_result_proven',false,
 'new_http_or_positive_renewal_proven',false,'repair_or_installation_permission',false,
 'retry_or_followup_query_permission',false) AS document
 FROM static_assessment a CROSS JOIN baseline_comparison b CROSS JOIN queue_counts q CROSS JOIN cron_privileges cp
)
SELECT CASE WHEN octet_length(document::text)<=262144 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_262144_BYTES','repair_or_installation_permission',false,
 'retry_or_followup_query_permission',false) END AS result FROM result_document;
ROLLBACK;
