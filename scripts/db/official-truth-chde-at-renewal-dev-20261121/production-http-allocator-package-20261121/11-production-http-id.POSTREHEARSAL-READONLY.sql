-- PREPARED ONLY / NOT EXECUTED. Separate explicitly scoped post-rehearsal READ.
-- Use only after the actual complete 10-ROLLBACK and service completion were recorded.
-- This is NOT covered by the earlier one-time V2 Go or automatically by 01's READ Go.
-- Fixed Production target qscbgcdmivbbnzrcyegn; SQL does not authenticate project identity.
-- Confirms restored V2 definitions/chain and no allocator/trigger/successor installation.
-- No HTTP, Publisher, audit, Owner routine, DDL, data write, role or counter allocation.
-- Natural work may advance rows/counters between transactions. The exact original
-- row/counter restoration belongs to 10's locked before/after proof; this read does
-- not invent a new frozen history expectation or retroactively authorize installation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $independent_old_production_restoration$
DECLARE item record; old_catalog jsonb;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('transaction_isolation')<>'repeatable read'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('net.http_request_queue'))
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_CONTEXT_OR_OBJECT_RESTORATION_FAILED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','1f2b6fc5ccc1511e77737a95c71228bed710482133a95a87cdb672d80373617b'),
 ('net.http_get(text,jsonb,jsonb,integer)','7012c5582cd0ab8d38f546af6633ea3c531950fb009f07127b99f8a1640eac1a'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','ee3ec5bc54158b60b6c4e3a966a07a33dc009788fad8f6b7480ad1c45acdfe78'),
 ('official_v3_at_production_private.collect_v1()','3e681172f296ba3c4202dbf8108552201f613f8de345e6c339288f8680683422'),
 ('official_v3_at_production_private.enqueue_v1()','3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90'),
 ('official_v3_at_production_private.renew_ch_v1()','5171785c2b114a816c13c5e2dc26cc2a397c6837fccfcbda2974f706b10b5f76'),
 ('official_v3_guard_private.assert_catalog_v1()','392ea8733d60115b7e2c0135e21c76116f9f4d066988dda860e5129d427553fa'),
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_guard_private.catalog_status_v1()','037ca263eeeed28c4c6402f7fca4a751db56f73ff8ada7e71656576f27b22f3f'),
 ('official_v3_guard_private.require_open_v1()','9ce675e839dc71ee19ddba5f44503472e2f1caa07add90d5709df4f5164a20e5'),
 ('public.official_v3_guard_alarm_status_v1()','d60554d4a4d902b76c51f9e5b1f2f718692732bcda614f0f1783a154ba7677ec')
 ) expected(signature,digest) LOOP
  IF to_regprocedure(item.signature) IS NULL
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_DEFINITION_NOT_EXACT: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 IF encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM old_catalog
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3
  WHERE singleton AND required_generation=1344 AND proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz)
 OR (WITH actual AS (
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
  WHERE to_regclass(absent.relation_name) IS NOT NULL) AS exact_inventory) IS DISTINCT FROM true
 OR (WITH expected(name,type_name,required_not_null) AS (VALUES
 ('id','pg_catalog.int8',true),('method','pg_catalog.text',true),('url','pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',true),('body','pg_catalog.bytea',false),('timeout_milliseconds','pg_catalog.int4',true)),
 actual AS (SELECT * FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)
SELECT (SELECT count(*) FROM actual)=6
 AND NOT EXISTS(SELECT 1 FROM expected e LEFT JOIN actual a ON a.attname=e.name
  WHERE a.attnum IS NULL OR a.attisdropped OR a.atttypid<>to_regtype(e.type_name)
  OR a.attnotnull IS DISTINCT FROM e.required_not_null OR a.attgenerated<>'' OR a.attidentity<>'')
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))=1
 AND EXISTS(SELECT 1 FROM pg_attrdef d JOIN actual a ON a.attnum=d.adnum
  WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'
  AND pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)')
 AS exact_queue_shape_and_legacy_default) IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_CHAIN_OR_TRANSPORT_SHAPE_CHANGED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $independent_old_production_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_POSTREHEARSAL_ORIGINAL_LINEAGE_AND_OBJECT_ABSENCE_CONFIRMED',
 'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
 'old_catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'old_required_generation',v.required_generation,'old_proof_not_before',v.proof_not_before,
 'own_allocator_namespace_absent',to_regnamespace('jetnity_pgnet_allocator_private') IS NULL,
 'new_successor_absent',to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL,
 'queue_trigger_count',(SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass),
 'legacy_sequence_now',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called) FROM net.http_request_queue_id_seq),
 'native_transport_sha256',encode(sha256(convert_to((jsonb_build_object(
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
))::text,'UTF8')),'hex'),
 'public_guard_status',public.official_v3_guard_alarm_status_v1(),
 'natural_progress_between_transactions_allowed',true,
 'locked_history_restoration_proof_must_be_read_from_actual_10_result',true,
 'http_or_publisher_or_owner_action',false,'installation_permission',false) AS result
FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
ROLLBACK;
