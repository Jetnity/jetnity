-- REVIEW CANDIDATE ONLY. No BEGIN/COMMIT: integrate inside one Dev transaction.
-- Run PRE before any allocator schema/role/DDL mutation. It takes the existing
-- guard advisory lock and the global queue lock. First assembled run ROLLBACK.
DO $v8_pre$
DECLARE p record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_EXACT_TARGET_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR (SELECT catalog=official_v3_guard_private.catalog_status_v1()
   FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton) IS DISTINCT FROM true
 OR official_v3_guard_private.catalog_status_v1() ? 'transport:dev_http_id_allocator_v8'
 OR has_table_privilege(current_user,'net.http_request_queue','TRIGGER') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','INSERT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','UPDATE') IS DISTINCT FROM true
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
 OR to_regprocedure('net.http_delete(text,jsonb,jsonb,integer,jsonb)') IS NULL
 OR to_regprocedure('net.wake()') IS NULL
 OR current_setting('supautils.privileged_role_allowed_configs',true) IS NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_BASELINE_OR_TRANSPORT_AUTHORITY_REFUSED' USING ERRCODE='P7998'; END IF;
 FOR p IN SELECT * FROM (VALUES
 ('official_v3_guard_private.assert_catalog_v1()','ffc008c124735d470dd3f519c943ab75bf7eb576db668d5e32896498e75e3c9b'),
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_guard_private.catalog_status_v1()','605a8527181f7535118258d80f9e2057027fcea06d4ddb4847345f57d58ae86d'),
 ('official_v3_guard_private.check_control_v1()','f1d8fdf3e64e88b2fd31dc72afff7ad035c2865056db97cebde1dc0e0d981f24'),
 ('official_v3_guard_private.require_open_v1()','aab99e12b314a1208bd445eecbfc0cf71b505d6bef2e4d8e8eaefee4092d59c8'),
 ('public.official_v3_guard_alarm_status_v1()','2e227035389b9ac8504446d367878ec4140c341bd8e39dbfd6f192de03c63a15')
 ) expected(signature,definition_sha) LOOP
  IF (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid=p.signature::regprocedure) IS DISTINCT FROM 'postgres'
  OR encode(sha256(convert_to(pg_get_functiondef(p.signature::regprocedure),'UTF8')),'hex') IS DISTINCT FROM p.definition_sha
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_LIVE_GUARD_PIN_CHANGED' USING ERRCODE='P7998'; END IF;
 END LOOP;
END $v8_pre$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
CREATE FUNCTION pg_temp.dev_http_v8_data() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$
 SELECT jsonb_build_object(
 'v7',(SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton),
 'publisher_body_sha',(SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
   WHERE p.oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),
 'publisher_definition_sha',encode(sha256(convert_to(pg_get_functiondef(
   'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),'UTF8')),'hex'),
 'originals',(SELECT encode(sha256(convert_to(string_agg(((to_jsonb(o)-'original_body')||
   jsonb_build_object('actual_sha',encode(sha256(o.original_body),'hex')))::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_private.whole_originals_v2 o),
 'facts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.facts_v1 f),
 'original_visas',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(v)::text,'|' ORDER BY rule_version),''),'UTF8')),'hex')
   FROM official_v3_at_private.verified_visas_v3 v),
 'source_pins',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_source_watch_private.pins_v1 p),
 'renewal_sources',(SELECT encode(sha256(convert_to(string_agg(to_jsonb(p)::text,'|' ORDER BY destination_code,source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.sources_v1 p),
 'at_request_identity',(SELECT encode(sha256(convert_to(coalesce(string_agg(
   jsonb_build_array(batch_id,source_id,request_id,requested_at)::text,'|' ORDER BY batch_id,source_id COLLATE "C"),''),'UTF8')),'hex')
   FROM official_v3_at_source_watch_private.reads_v1),
 'renewal_batches',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(b)::text,'|' ORDER BY destination_code,source_batch_id),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.batches_v1 b),
 'renewal_observations',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(o)::text,'|' ORDER BY destination_code,source_batch_id,source_id COLLATE "C"),''),'UTF8')),'hex')
   FROM official_v3_source_renewal_private.observations_v1 o),
 'owner_receipts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(o)::text,'|' ORDER BY operation_id),''),'UTF8')),'hex')
   FROM official_v3_guard_private.owner_operations_v1 o),
 'cron_config',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(j)::text,'|' ORDER BY jobid),''),'UTF8')),'hex') FROM cron.job j)
 )
$state$;
REVOKE ALL ON FUNCTION pg_temp.dev_http_v8_data() FROM PUBLIC,anon,authenticated,service_role;

CREATE TEMP TABLE dev_http_v8_before(
 singleton boolean PRIMARY KEY CHECK(singleton),catalog jsonb NOT NULL,
 protected_data jsonb NOT NULL,guard_state jsonb NOT NULL,original_native jsonb NOT NULL,
 fact_sequence regclass NOT NULL,fact_sequence_state jsonb NOT NULL
) ON COMMIT DROP;
DO $v8_snapshot$
DECLARE f regclass; fs jsonb;
BEGIN
 f:=pg_get_serial_sequence('official_v3_source_renewal_private.facts_v1','fact_id')::regclass;
 IF f IS NULL THEN RAISE EXCEPTION 'DEV_HTTP_V8_FACT_SEQUENCE_MISSING' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',f) INTO STRICT fs;
 INSERT INTO pg_temp.dev_http_v8_before
 SELECT true,official_v3_guard_private.catalog_status_v1(),pg_temp.dev_http_v8_data(),
  (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton),
  jsonb_build_object(
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
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p'))
),f,fs;
 IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>0
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_PREEXISTING_QUEUE_TRIGGER_UNREVIEWED' USING ERRCODE='P7998'; END IF;
END $v8_snapshot$;
-- Insert independently reviewed allocator CREATE SCHEMA/SEQUENCE/FUNCTION/TRIGGER
-- and narrowly approved object USAGE grants HERE. No HTTP/new source/fact call.
-- Do not call the OLD v7 catalog assertion after those grants and before POST.
