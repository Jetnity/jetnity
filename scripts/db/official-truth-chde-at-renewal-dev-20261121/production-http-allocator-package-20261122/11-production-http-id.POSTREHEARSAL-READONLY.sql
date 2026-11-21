-- PREPARED ONLY / NOT EXECUTED. Separate explicitly scoped post-rehearsal READ.
-- Use only after the actual complete 10-ROLLBACK and service completion were recorded.
-- This is NOT covered by any earlier one-time V2/01/02 READ authorization.
-- Fixed Production target qscbgcdmivbbnzrcyegn; SQL does not authenticate project identity.
-- Confirms the restored optimized query-cost predecessor and every older link.
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
 OR to_regclass('official_v3_guard_private.query_cost_baseline_v1') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('net.http_request_queue'))
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_CONTEXT_OR_OBJECT_RESTORATION_FAILED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()','57b101b3551b64e95bc68e6650d642ba34829fccb84bc081b7ad606879c176fe'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','1f2b6fc5ccc1511e77737a95c71228bed710482133a95a87cdb672d80373617b'),
 ('net.http_get(text,jsonb,jsonb,integer)','7012c5582cd0ab8d38f546af6633ea3c531950fb009f07127b99f8a1640eac1a'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','ee3ec5bc54158b60b6c4e3a966a07a33dc009788fad8f6b7480ad1c45acdfe78'),
 ('net.wake()','b7f9cb7d7cd9b5259c6a29b1cae29b451b325a6f43169cee18b7ff723fad9efc'),
 ('official_v3_at_production_private.collect_v1()','3e681172f296ba3c4202dbf8108552201f613f8de345e6c339288f8680683422'),
 ('official_v3_at_production_private.enqueue_v1()','3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90'),
 ('official_v3_at_production_private.renew_ch_v1()','5171785c2b114a816c13c5e2dc26cc2a397c6837fccfcbda2974f706b10b5f76'),
 ('official_v3_guard_private.assert_catalog_v1()','6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39'),
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_guard_private.catalog_status_v1()','7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402'),
 ('official_v3_guard_private.check_control_v1()','8a5b56136dc5564b4d52e6e0dcb1f119f4b229cb985296044696c7463b646669'),
 ('official_v3_guard_private.check_retirements_v1()','1f45c1bd50cab57dedbaec8b25a2329ff291897a3252e9e91e43f0c41637f718'),
 ('official_v3_guard_private.immutable_v1()','67a8778d002cb93436e0c1f6d498d27f4bc1b7cb228ad921bef0b1ab1566114d'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','0237901ef275badb4f12f6491f4f9f475177669e767001127a1de004a8d061cd'),
 ('official_v3_guard_private.require_open_v1()','9ce675e839dc71ee19ddba5f44503472e2f1caa07add90d5709df4f5164a20e5'),
 ('public.official_v3_guard_alarm_status_v1()','d60554d4a4d902b76c51f9e5b1f2f718692732bcda614f0f1783a154ba7677ec')
 ) expected(signature,digest) LOOP
  IF to_regprocedure(item.signature) IS NULL
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_DEFINITION_NOT_EXACT: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 
 FOR item IN SELECT * FROM (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()','postgres',false,'v','text','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','429a6be355781df4575a7a3db1b0229a57a105e91bcf31bb3db68e23c51e25a5'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.http_get(text,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.wake()','supabase_admin',false,'v','void','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('official_v3_at_production_private.collect_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_at_production_private.enqueue_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_at_production_private.renew_ch_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.assert_catalog_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.audit_v1()','postgres',true,'v','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1'),
 ('official_v3_guard_private.catalog_status_v1()','postgres',true,'s','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1'),
 ('official_v3_guard_private.check_control_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.check_retirements_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.immutable_v1()','postgres',false,'v','trigger','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.require_open_v1()','postgres',true,'v','bigint','8d7f7dc66cd0965d575cf544d4f9a773c46bda7374851b88fe8da42ea59113f2','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('public.official_v3_guard_alarm_status_v1()','postgres',true,'v','jsonb','c8789f4263f3a141a57ef770b25307024c51c4718475db91baa4af8dcd6782f4','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1')
 ) expected(signature,owner_name,is_definer,volatility,result_type,acl_sha,config_sha) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(item.signature)
   AND pg_get_userbyid(p.proowner)=item.owner_name AND p.prosecdef=item.is_definer
   AND p.provolatile::text=item.volatility AND pg_get_function_result(p.oid)=item.result_type
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex')=item.acl_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex')=item.config_sha)
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FUNCTION_OWNER_ACL_OR_CONFIG_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;

 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
 IF encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM old_catalog
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3
  WHERE singleton AND required_generation=1344 AND proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz
  AND encode(sha256(convert_to(catalog::text,'UTF8')),'hex')='7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e')
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton
  AND algorithm='jsonb_unique_narrow_dependency_distinct_v1'
  AND predecessor_catalog_digest='7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
  AND predecessor_baseline_digest='a7266c41fc77ab63b8ce2878d10890c7d5b395a3a33d8fe6c5331bf68f7e2bd0')
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
 ('id','pg_catalog.int8',true),('method','net.http_method',true),('url','pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',false),('body','pg_catalog.bytea',false),('timeout_milliseconds','pg_catalog.int4',true)),
 actual AS (SELECT * FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)
SELECT (SELECT count(*) FROM actual)=6
 AND NOT EXISTS(SELECT 1 FROM expected e LEFT JOIN actual a ON a.attname=e.name
  WHERE a.attnum IS NULL OR a.attisdropped OR a.atttypid IS DISTINCT FROM to_regtype(e.type_name)
  OR a.attnotnull IS DISTINCT FROM e.required_not_null OR a.attgenerated IS DISTINCT FROM '' OR a.attidentity IS DISTINCT FROM '')
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))=1
 AND EXISTS(SELECT 1 FROM pg_attrdef d JOIN actual a ON a.attnum=d.adnum
  WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'
  AND pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)')
 AND (SELECT (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname='net' AND t.typname='http_method')=1
 AND EXISTS(SELECT 1 FROM pg_type t WHERE t.oid=to_regtype('net.http_method')
  AND t.oid=289454 AND t.typtype='d'
  AND t.typbasetype='pg_catalog.text'::pg_catalog.regtype AND NOT t.typnotnull
  AND t.typtypmod=-1 AND t.typndims=0 AND t.typdefault IS NULL AND t.typdefaultbin IS NULL
  AND t.typowner='supabase_admin'::pg_catalog.regrole
  AND t.typcollation=(SELECT typcollation FROM pg_type WHERE oid='pg_catalog.text'::pg_catalog.regtype))
 AND (SELECT count(*) FROM pg_constraint WHERE contypid=to_regtype('net.http_method'))=1
 AND EXISTS(SELECT 1 FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')
  AND c.contype='c' AND c.convalidated
  AND pg_get_constraintdef(c.oid,false)='CHECK (((VALUE ~~* ''get''::text) OR (VALUE ~~* ''post''::text) OR (VALUE ~~* ''delete''::text)))'
  AND encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex')='412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de'
  AND encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex')='63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856'
 )) AS exact_queue_shape_and_legacy_default) IS DISTINCT FROM true
 OR encode(sha256(convert_to((jsonb_build_object(
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
))::text,'UTF8')),'hex') IS DISTINCT FROM '60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f'
 THEN RAISE EXCEPTION 'PROD_HTTP_POSTREHEARSAL_OLD_CHAIN_OR_TRANSPORT_SHAPE_CHANGED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $independent_old_production_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_POSTREHEARSAL_ORIGINAL_LINEAGE_AND_OBJECT_ABSENCE_CONFIRMED',
 'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
 'restored_query_cost_catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'legacy_v3_catalog_sha256',encode(sha256(convert_to(legacy.catalog::text,'UTF8')),'hex'),
 'legacy_v3_required_generation',legacy.required_generation,'legacy_v3_proof_not_before',legacy.proof_not_before,
 'method_domain_sha256',encode(sha256(convert_to((jsonb_build_object(
 'type',(SELECT to_jsonb(t) FROM pg_type t WHERE t.oid=to_regtype('net.http_method')),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex'))
  ORDER BY c.oid),'[]'::pg_catalog.jsonb) FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')))
)::text,'UTF8')),'hex'),
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
FROM official_v3_guard_private.query_cost_baseline_v1 v
CROSS JOIN official_v3_guard_private.bg1_transient_baseline_v3 legacy WHERE v.singleton AND legacy.singleton;
ROLLBACK;
