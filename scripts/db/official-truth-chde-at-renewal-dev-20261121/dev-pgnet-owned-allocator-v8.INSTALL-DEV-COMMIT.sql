-- DEV ONLY: own LOGGED HTTP allocator + exact BG1 v8 successor.
-- Root assembly of separately reviewed, source-pinned fragments.
-- First execution is a complete transactional rehearsal; no HTTP or source call.
-- Scope: regular pg_net API producers in origin/local, not replica/direct UPDATE.
-- Managed table/sequence ownership, default and public API remain unchanged.
-- Production is excluded. Exact executed bytes and results live in evidence.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $guard_lock_first$ BEGIN
 IF NOT pg_try_advisory_xact_lock(771106,1) THEN
  RAISE EXCEPTION 'DEV_HTTP_V8_GUARD_BUSY' USING ERRCODE='P7998';
 END IF;
END $guard_lock_first$;


-- Read-only authority/target gate before the first temporary object.
DO $allocator_authority$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 IF NOT has_table_privilege(current_user,'net.http_request_queue','TRIGGER')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','INSERT')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','UPDATE')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','SELECT')
 OR NOT has_schema_privilege(current_user,'net','USAGE')
 OR NOT has_database_privilege(current_user,current_database(),'CREATE')
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_ORDINARY_PRIVILEGE_MISSING' USING ERRCODE='42501'; END IF;
 IF to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_NAMESPACE_ALREADY_EXISTS' USING ERRCODE='P7998'; END IF;
END $allocator_authority$;

CREATE TEMP TABLE pg_temp.dev_http_id_inventory(
 schema_name text NOT NULL,table_name text NOT NULL,column_name text NOT NULL,
 expected_persistence "char" NOT NULL,
 PRIMARY KEY(schema_name,table_name,column_name)
) ON COMMIT DROP;
INSERT INTO pg_temp.dev_http_id_inventory VALUES
 ('jetnity_dev_import_scheduler','dispatches_v1','net_request_id','p'),
 ('jetnity_dev_import_scheduler','preview_dispatches_v1','net_request_id','p'),
 ('official_v3_at_source_watch_private','reads_v1','request_id','p'),
 ('official_v3_source_renewal_private','observations_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v2','pgnet_request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v3','request_id','p'),
 ('jetnity_global_source_monitor_private','requests_v1','request_id','p'),
 ('jetnity_usagov_fallback_private','original_v1','request_id','p'),
 ('jetnity_usagov_watch_private','requests_v1','request_id','p'),
 ('jetnity_usagov_watch_private','observations_v1','request_id','p'),
 ('jetnity_source_dispatch_private','requests_v1','request_id','p'),
 ('jetnity_source_dispatch_private','observations_v1','request_id','p'),
 ('supabase_functions','hooks','request_id','p'),
 ('net','http_request_queue','id','u'),
 ('net','_http_response','id','u');

-- Exact catalog inventory, including every durable bigint *request_id* column.
-- UUID/text request IDs are different namespaces and deliberately excluded.
CREATE FUNCTION pg_temp.dev_http_inventory_exact() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $inventory$
 WITH actual AS (
  SELECT n.nspname AS schema_name,c.relname AS table_name,a.attname AS column_name,
   c.relpersistence AS expected_persistence
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_attribute a ON a.attrelid=c.oid
  WHERE c.relkind IN('r','p') AND c.relpersistence IN('p','u')
   AND n.nspname NOT IN('pg_catalog','information_schema')
   AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='bigint'::regtype
   AND (a.attname ~ '(^|_)request_id$'
     OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
 ), differences AS (
  (SELECT * FROM actual EXCEPT SELECT * FROM pg_temp.dev_http_id_inventory)
  UNION ALL
  (SELECT * FROM pg_temp.dev_http_id_inventory EXCEPT SELECT * FROM actual)
 )
 SELECT (SELECT count(*) FROM pg_temp.dev_http_id_inventory)=16
   AND (SELECT count(*) FROM actual)=16 AND NOT EXISTS(SELECT 1 FROM differences)
$inventory$;
REVOKE ALL ON FUNCTION pg_temp.dev_http_inventory_exact() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pg_temp.dev_seq_protected_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$
 SELECT jsonb_build_object(
 'catalog',official_v3_guard_private.catalog_status_v1(),
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
REVOKE ALL ON FUNCTION pg_temp.dev_seq_protected_state() FROM PUBLIC,anon,authenticated,service_role;

DO $dev_pre$
DECLARE item record; sequence_parameters pg_sequence%ROWTYPE;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v
  WHERE singleton AND catalog=official_v3_guard_private.catalog_status_v1())
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
   WHERE oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure)
   IS DISTINCT FROM '05bf4f11d1b5b482d798afc11396c53016cd17470ce3b857cacb87323b520105'
 OR has_function_privilege('anon','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('authenticated','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 OR has_function_privilege('service_role','official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)','EXECUTE')
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PROTECTED_SOURCE_GUARD_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
  WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0
   AND body_digest=encode(sha256(original_body),'hex'))<>3
 OR EXISTS(SELECT 1 FROM official_v3_source_renewal_private.sources_v1 p
  LEFT JOIN official_v3_at_private.whole_originals_v2 o USING(source_id)
  WHERE p.destination_code='AT' AND (o.source_id IS NULL OR o.official_url IS DISTINCT FROM p.official_url
   OR o.body_digest IS DISTINCT FROM p.raw_sha OR octet_length(o.original_body) IS DISTINCT FROM p.original_bytes))
 OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1 WHERE destination_code='AT')<>3
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_ORIGINAL_SOURCE_CHANGED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_temp.dev_http_inventory_exact() THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_ID_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 -- Leaf producer locks, numeric order. All are TRY locks: any busy producer
 -- aborts this transaction without waiting for an inverted wrapper hierarchy.
 FOR item IN SELECT * FROM (VALUES
  (771106,31),(771108,2),(771108,44),(771110,2),(771110,4),(771110,6),
  (771115,61),(771115,752),(771115,768)) AS locks(k1,k2) ORDER BY k1,k2 LOOP
  IF NOT pg_try_advisory_xact_lock(item.k1,item.k2) THEN
   RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT * INTO STRICT sequence_parameters FROM pg_sequence
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 IF sequence_parameters.seqtypid<>'bigint'::regtype OR sequence_parameters.seqincrement<>1
 OR sequence_parameters.seqcache<>1 OR sequence_parameters.seqcycle
 OR sequence_parameters.seqmin<>1 OR sequence_parameters.seqmax<>9223372036854775807
 OR (SELECT relpersistence FROM pg_class WHERE oid='net.http_request_queue_id_seq'::regclass)<>'u'
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_GENERATOR_PARAMETERS_CHANGED' USING ERRCODE='P7998'; END IF;
END $dev_pre$;


-- All net.http_* and standard Database Webhook inserts acquire ROW EXCLUSIVE
-- on this relation. Obtain this global barrier BEFORE reading any high-water.
-- pg_net 0.20.4 holds its queue write lock through response insertion/COMMIT;
-- no test row can become visible to its worker while this transaction is open.
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;

CREATE FUNCTION pg_temp.dev_allocator_runtime_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $runtime$
 SELECT jsonb_build_object(
  'protected',pg_temp.dev_seq_protected_state(),
  'legacy_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called) FROM net.http_request_queue_id_seq),
  'legacy_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
    WHERE seqrelid='net.http_request_queue_id_seq'::regclass),
  'legacy_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE oid='net.http_request_queue_id_seq'::regclass),
  'queue_class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE oid='net.http_request_queue'::regclass),
  'queue_attributes',(SELECT jsonb_agg(to_jsonb(a) ORDER BY attnum) FROM pg_attribute a
    WHERE attrelid='net.http_request_queue'::regclass AND attnum>0),
  'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY adnum),'[]'::jsonb)
    FROM pg_attrdef d WHERE adrelid='net.http_request_queue'::regclass),
  'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY oid),'[]'::jsonb)
    FROM pg_constraint c WHERE conrelid='net.http_request_queue'::regclass),
  'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY oid),'[]'::jsonb)
    FROM pg_trigger t WHERE tgrelid='net.http_request_queue'::regclass),
  'queue_rows',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(q)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
    FROM net.http_request_queue q),
  'response_rows',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(r)::text,'|' ORDER BY id,ctid),''),'UTF8')),'hex')
    FROM net._http_response r)
 )
$runtime$;
REVOKE ALL ON FUNCTION pg_temp.dev_allocator_runtime_state() FROM PUBLIC,anon,authenticated,service_role;

CREATE TEMP TABLE pg_temp.dev_allocator_before(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 state jsonb NOT NULL,historical_max bigint NOT NULL,legacy_last bigint NOT NULL,
 first_unused bigint NOT NULL,original_queue_count bigint NOT NULL,
 probe_url_prefix text NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE pg_temp.dev_allocator_proof(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 first_id bigint,second_id bigint,
 owned_restart_before jsonb,owned_restart_after jsonb,
 cleanup_before jsonb,cleanup_after jsonb,
 owned_restart_exact boolean NOT NULL DEFAULT false,
 cascade_exact boolean NOT NULL DEFAULT false,
 complete_install_rollback_exact boolean NOT NULL DEFAULT false
) ON COMMIT DROP;
INSERT INTO pg_temp.dev_allocator_proof DEFAULT VALUES;

DO $allocator_locked_snapshot$
DECLARE item record; part_max bigint; high bigint:=0; legacy_value bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='relation' AND pid=pg_backend_pid()
  AND relation='net.http_request_queue'::regclass AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT pg_temp.dev_http_inventory_exact()
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_LOCK_OR_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)
 OR EXISTS(SELECT 1 FROM pg_rewrite WHERE ev_class='net.http_request_queue'::regclass)
 OR EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='net.http_request_queue'::regclass)
 OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='net.http_request_queue'::regclass
  AND relkind='r' AND relpersistence='u' AND NOT relrowsecurity AND NOT relispartition
  AND relowner='supabase_admin'::regrole)
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_QUEUE_SHAPE_NOT_REVIEWED' USING ERRCODE='P7998'; END IF;
 SELECT last_value INTO STRICT legacy_value FROM net.http_request_queue_id_seq;
 FOR item IN SELECT * FROM pg_temp.dev_http_id_inventory ORDER BY schema_name,table_name,column_name LOOP
  EXECUTE format('SELECT max(%I) FROM %I.%I',item.column_name,item.schema_name,item.table_name) INTO part_max;
  IF part_max IS NOT NULL AND part_max<1 THEN
   RAISE EXCEPTION 'DEV_ALLOCATOR_INVALID_HISTORY_ID' USING ERRCODE='P7998'; END IF;
  high:=greatest(high,coalesce(part_max,0));
 END LOOP;
 -- Extra headroom is for the isolated RESTART proof; no hard-coded live HWM.
 IF high<1 OR legacy_value<1 OR greatest(high,legacy_value)>9223372036854775787 THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_INVALID_OR_EXHAUSTED_RANGE' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_allocator_before
  (state,historical_max,legacy_last,first_unused,original_queue_count,probe_url_prefix)
 VALUES(pg_temp.dev_allocator_runtime_state(),high,legacy_value,greatest(high,legacy_value)+1,
  (SELECT count(*) FROM net.http_request_queue),
  'https://example.invalid/jetnity-dev-allocator-rollback/'||txid_current()::text||'/');
END $allocator_locked_snapshot$;

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
CREATE SCHEMA jetnity_pgnet_allocator_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_pgnet_allocator_private FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;
DO $create_owned_sequence$
DECLARE first_id bigint;
BEGIN
 SELECT first_unused INTO STRICT first_id FROM pg_temp.dev_allocator_before WHERE singleton;
 EXECUTE format('CREATE SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH %s CACHE 1 NO CYCLE',first_id);
END $create_owned_sequence$;
REVOKE ALL ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;

CREATE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 -- Incoming/default IDs are deliberately ignored for EVERY queue producer.
 NEW.id:=pg_catalog.nextval('jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass);
 RETURN NEW;
END $assign$;
REVOKE ALL ON FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_functions_admin,supabase_read_only_user;
CREATE TRIGGER jetnity_pgnet_request_id_v1 BEFORE INSERT ON net.http_request_queue
 FOR EACH ROW EXECUTE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1();

-- REVIEW CANDIDATE ONLY: companion POST after reviewed allocator DDL, same TX.
DO $v8_transport_gate$
DECLARE prior pg_temp.dev_http_v8_before%ROWTYPE; current_native jsonb;
 item record; relation_owner oid; acl_value aclitem[]; allowed_roles text[]:=ARRAY[]::text[];
BEGIN
 SELECT * INTO STRICT prior FROM pg_temp.dev_http_v8_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND relation='net.http_request_queue'::regclass AND mode='ShareRowExclusiveLock')
 OR NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
   AND c.relkind='S' AND c.relpersistence='p' AND c.relowner='postgres'::regrole
   AND s.seqtypid='bigint'::regtype AND s.seqincrement=1 AND s.seqcache=1
   AND s.seqmin=1 AND s.seqmax=9223372036854775807 AND NOT s.seqcycle)
 OR NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
   AND p.proowner='postgres'::regrole AND p.prosecdef=true AND p.provolatile='v'
   AND p.prorettype='trigger'::regtype AND p.pronargs=0 AND p.proconfig=ARRAY['search_path=pg_catalog']
   AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid='net.http_request_queue'::regclass
   AND t.tgname='jetnity_pgnet_request_id_v1' AND t.tgtype=7 AND t.tgenabled='O'
   AND NOT t.tgisinternal AND t.tgconstraint=0 AND t.tgnargs=0 AND t.tgqual IS NULL
   AND t.tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_GLOBAL_ALLOCATOR_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 current_native:=jsonb_build_object(
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
);
 -- CREATE TRIGGER legitimately changes only relhastriggers plus the one new trigger.
 IF (current_native-'queue_triggers'-'queue_relation') IS DISTINCT FROM
      (prior.original_native-'queue_triggers'-'queue_relation')
 OR ((current_native->'queue_relation')-'relhastriggers') IS DISTINCT FROM
      ((prior.original_native->'queue_relation')-'relhastriggers')
 OR current_native#>'{queue_relation,relhastriggers}' IS DISTINCT FROM 'true'::jsonb
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_MANAGED_TRANSPORT_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT n.nspowner,n.nspacl INTO STRICT relation_owner,acl_value FROM pg_namespace n
 WHERE n.oid='jetnity_pgnet_allocator_private'::regnamespace;
 IF relation_owner<>'postgres'::regrole THEN
  RAISE EXCEPTION 'DEV_HTTP_V8_ALLOCATOR_SCHEMA_OWNER' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM aclexplode(coalesce(acl_value,acldefault('n',relation_owner))) LOOP
  IF item.grantee<>'postgres'::regrole AND
   (item.grantee=0 OR pg_get_userbyid(item.grantee)::text<>ALL(allowed_roles)
    OR item.privilege_type<>'USAGE' OR item.is_grantable OR item.grantor<>'postgres'::regrole)
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_SCHEMA_GRANT_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT c.relowner,c.relacl INTO STRICT relation_owner,acl_value FROM pg_class c
 WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass;
 FOR item IN SELECT * FROM aclexplode(coalesce(acl_value,acldefault('S',relation_owner))) LOOP
  IF item.grantee<>'postgres'::regrole AND
   (item.grantee=0 OR pg_get_userbyid(item.grantee)::text<>ALL(allowed_roles)
    OR item.privilege_type<>'USAGE' OR item.is_grantable OR item.grantor<>'postgres'::regrole)
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_SEQUENCE_GRANT_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 FOR item IN SELECT unnest(allowed_roles) role_name LOOP
  IF has_schema_privilege(item.role_name,'jetnity_pgnet_allocator_private','USAGE') IS DISTINCT FROM true
   OR has_sequence_privilege(item.role_name,'jetnity_pgnet_allocator_private.http_request_id_v1','USAGE') IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_APPROVED_USAGE_GRANT_MISSING' USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
  AND a.grantee<>'postgres'::regrole)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_TRIGGER_FUNCTION_NOT_PRIVATE' USING ERRCODE='P7998'; END IF;
END $v8_transport_gate$;

CREATE TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 transport_metadata jsonb NOT NULL CHECK(jsonb_typeof(transport_metadata)='object'),
 transport_metadata_digest text NOT NULL CHECK(transport_metadata_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 catalog jsonb NOT NULL CHECK(jsonb_typeof(catalog)='object')
);
ALTER TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_http_id_allocator_v8 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_http_id_allocator_v8 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_http_id_allocator_v8
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_http_id_allocator_v8
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_http_id_allocator_v8 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','official_v3_at_private','official_v3_at_source_watch_private','official_v3_source_renewal_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','jetnity_at_visa_v3','jetnity_source_bound_at_visa_v1','jetnity_bg1_alarm_kind_v2'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
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
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'transport:dev_http_id_allocator_v8',jsonb_build_object('native',jsonb_build_object(
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
), 'allocator',jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
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
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE transport_v8 official_v3_guard_private.bg1_dev_http_id_allocator_v8%ROWTYPE;
 restore_v7 official_v3_guard_private.bg1_dev_grantor_restore_v7%ROWTYPE;
 cycle5_v6 official_v3_guard_private.bg1_dev_cycle5_baseline_v6%ROWTYPE;
 maintenance_v5 official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 renewal official_v3_guard_private.source_renewal_baseline_v1%ROWTYPE;
  at_baseline official_v3_guard_private.at_hrs2_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
  attempt2 official_v3_guard_private.cycle4_attempt2_baseline_v1%ROWTYPE;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT transport_v8 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton;
  SELECT * INTO STRICT restore_v7 FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton;
  SELECT * INTO STRICT cycle5_v6 FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton;
  SELECT * INTO STRICT maintenance_v5 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
  SELECT * INTO STRICT acl_v4 FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 SELECT * INTO STRICT renewal FROM official_v3_guard_private.source_renewal_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_baseline FROM official_v3_guard_private.at_hrs2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT attempt2 FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT cycle4 FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT refresh FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT customer FROM official_v3_guard_private.customer_information_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR successor.bg1_provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950' OR successor.status_provider_digest<>'71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR gap_baseline.recovery2_provider_digest<>'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'
    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')
    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR customer.predecessor_provider_digest<>'7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a'
    OR customer.definitions_digest<>'6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f'
    OR customer.history_definition_digest<>'061e62165021fe13959b72bfb3135114d5c77b5119f32eb7233e1290d586d692'
    OR customer.history_guard_definition_digest<>'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
    OR customer.atomic_claim_definition_digest<>'75f43cdf119fe9bd862dd5bdcbbd6d53da974b09a6162ad999f23ab62fd3af8a'
    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR refresh.predecessor_provider_digest<>'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
    OR refresh.original_evidence_digest<>'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
    OR refresh.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(customer.catalog::text,'UTF8')),'hex')
    OR refresh.predecessor_customer_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.predecessor_provider_digest<>'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'
    OR cycle4.original_evidence_digest<>'5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
    OR cycle4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(refresh.catalog::text,'UTF8')),'hex')
    OR cycle4.predecessor_refresh_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(refresh)||jsonb_build_object('proof_not_before',extract(epoch FROM refresh.proof_not_before)))::text,'UTF8')),'hex')
    OR attempt2.predecessor_provider_digest<>'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
    OR attempt2.original_evidence_digest<>'7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle4.catalog::text,'UTF8')),'hex')
    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.predecessor_provider_digest<>'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'
    OR admin.definition_digest<>'872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR at_baseline.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.source_chain IS DISTINCT FROM (SELECT encode(sha256(convert_to(string_agg(source_id||':'||encode(sha256(original_body),'hex'),'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2)
    OR renewal.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(at_baseline.catalog::text,'UTF8')),'hex')
    OR renewal.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(at_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM at_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(renewal.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(renewal)||jsonb_build_object('proof_not_before',extract(epoch FROM renewal.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=renewal.required_generation
 OR bg1_v3.proof_not_before<=renewal.proof_not_before
 OR acl_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR acl_v4.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR acl_v4.approved_dependency_key IS DISTINCT FROM 'shared:5:1255:91879:0:1260:16485:a'
 OR NOT (acl_v4.catalog ? 'shared:5:1255:91879:0:1260:16485:a') OR (bg1_v3.catalog ? 'shared:5:1255:91879:0:1260:16485:a')
 OR acl_v4.weather_function_digest IS DISTINCT FROM
   encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex')
 OR acl_v4.weather_function_digest<>'9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
 OR acl_v4.weather_acl_text IS DISTINCT FROM
   (SELECT proacl::text FROM pg_proc WHERE oid='public.reisewetter_reservieren_v1()'::regprocedure)
 OR acl_v4.weather_acl_text<>'{postgres=X/postgres,authenticated=X/postgres}'
 OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
 OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
 OR acl_v4.required_generation<=bg1_v3.required_generation
 OR acl_v4.proof_not_before<=bg1_v3.proof_not_before
 OR maintenance_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(acl_v4.catalog::text,'UTF8')),'hex')
 OR maintenance_v5.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(acl_v4)||jsonb_build_object('proof_not_before',extract(epoch FROM acl_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR maintenance_v5.required_generation<=acl_v4.required_generation
 OR maintenance_v5.proof_not_before<=acl_v4.proof_not_before
 OR cycle5_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(maintenance_v5.catalog::text,'UTF8')),'hex')
 OR cycle5_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(maintenance_v5)||jsonb_build_object('proof_not_before',extract(epoch FROM maintenance_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR cycle5_v6.attempt_key<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR cycle5_v6.prior_retirement_count<>6
 OR cycle5_v6.required_generation<=maintenance_v5.required_generation
 OR cycle5_v6.proof_not_before<=maintenance_v5.proof_not_before
 OR maintenance_v5.catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton)

 OR restore_v7.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle5_v6.catalog::text,'UTF8')),'hex')
 OR restore_v7.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle5_v6)||
  jsonb_build_object('proof_not_before',extract(epoch FROM cycle5_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR restore_v7.removed_duplicate_membership_key IS DISTINCT FROM 'membership:92604'
 OR NOT (cycle5_v6.catalog ? 'membership:92604') OR restore_v7.catalog ? 'membership:92604'
 OR (SELECT count(*) FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole
    AND grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
 OR restore_v7.required_generation<=cycle5_v6.required_generation
 OR restore_v7.proof_not_before<=cycle5_v6.proof_not_before
 OR transport_v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(restore_v7.catalog::text,'UTF8')),'hex')
 OR transport_v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(restore_v7)||
   jsonb_build_object('proof_not_before',extract(epoch FROM restore_v7.proof_not_before)))::text,'UTF8')),'hex')
 OR transport_v8.required_generation<=restore_v7.required_generation
 OR transport_v8.proof_not_before<=restore_v7.proof_not_before
 OR transport_v8.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.transport_metadata::text,'UTF8')),'hex')
 OR transport_v8.transport_metadata IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8'
 OR transport_v8.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$;


-- Append-only successor. No INSERT/UPDATE to state, incidents, runs, owner
-- operations, old baselines or receipts, and no audit/resume/control call here.
INSERT INTO official_v3_guard_private.bg1_dev_http_id_allocator_v8
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,transport_metadata,
  transport_metadata_digest,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 meta.value,encode(sha256(convert_to(meta.value::text,'UTF8')),'hex'),
 greatest(v.required_generation+1,s.generation+1),
 greatest(v.proof_not_before+interval '1 microsecond',clock_timestamp()),
 official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v
CROSS JOIN official_v3_guard_private.state_v1 s
CROSS JOIN LATERAL (SELECT official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8' value) meta
WHERE v.singleton AND s.singleton;

DO $v8_post$
DECLARE before_row pg_temp.dev_http_v8_before%ROWTYPE; live_catalog jsonb; fstate jsonb; item record;
BEGIN
 SELECT * INTO STRICT before_row FROM pg_temp.dev_http_v8_before WHERE singleton;
 live_catalog:=official_v3_guard_private.catalog_status_v1();
 IF pg_temp.dev_http_v8_data() IS DISTINCT FROM before_row.protected_data
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM before_row.guard_state
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_ORIGINAL_DATA_OR_LATCH_CHANGED' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',before_row.fact_sequence)
 INTO STRICT fstate;
 IF fstate IS DISTINCT FROM before_row.fact_sequence_state
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_FACT_SEQUENCE_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.assert_catalog_v1()','d7560a9ab569830ecfc473b901ccd044dab052a93543fa491d75278e623d387b'),
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_guard_private.catalog_status_v1()','a37bdaaa546ab1bcf3baac301d83de3887765ae16532f149d421a9c1dd0780c4'),
 ('official_v3_guard_private.check_control_v1()','f1d8fdf3e64e88b2fd31dc72afff7ad035c2865056db97cebde1dc0e0d981f24'),
 ('official_v3_guard_private.require_open_v1()','15f9ac75fb870c8b13e7a3b7c7994343f4a7772f8cab0905a104c08211b9eaf7'),
 ('public.official_v3_guard_alarm_status_v1()','556248971a3765340ae1b273fc542addb409ad50f78b9d94baae9bd38d3dc884')
 ) p(signature,definition_sha) LOOP
  IF encode(sha256(convert_to(pg_get_functiondef(item.signature::regprocedure),'UTF8')),'hex') IS DISTINCT FROM item.definition_sha
  THEN RAISE EXCEPTION 'DEV_HTTP_V8_INSTALLED_GUARD_BODY_MISMATCH' USING ERRCODE='P7998'; END IF;
 END LOOP;
 -- Every old catalog key survives exactly; only the four reviewed definitions
 -- may change. Their entire pg_proc row outside definition remains identical.
 IF EXISTS(SELECT 1 FROM jsonb_each(before_row.catalog) prior
  LEFT JOIN jsonb_each(live_catalog) actual ON actual.key=prior.key
  WHERE CASE WHEN prior.key IN (
   'function:'||'official_v3_guard_private.catalog_status_v1()'::regprocedure::oid,
   'function:'||'official_v3_guard_private.assert_catalog_v1()'::regprocedure::oid,
   'function:'||'official_v3_guard_private.require_open_v1()'::regprocedure::oid,
   'function:'||'public.official_v3_guard_alarm_status_v1()'::regprocedure::oid)
   THEN prior.value-'definition' IS DISTINCT FROM actual.value-'definition'
   ELSE prior.value IS DISTINCT FROM actual.value END)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_UNEXPECTED_OLD_CATALOG_DELTA' USING ERRCODE='P7998'; END IF;
 -- New entries are restricted to the exact new baseline and transport objects.
 IF EXISTS(
  WITH base AS (SELECT c.oid,c.reltoastrelid FROM pg_class c
    WHERE c.oid='official_v3_guard_private.bg1_dev_http_id_allocator_v8'::regclass),
  relations AS (SELECT oid FROM base UNION SELECT reltoastrelid FROM base WHERE reltoastrelid<>0
    UNION SELECT indexrelid FROM pg_index WHERE indrelid IN(SELECT oid FROM base UNION SELECT reltoastrelid FROM base)),
  relation_types AS (SELECT oid,typarray FROM pg_type WHERE typrelid IN(SELECT oid FROM relations)),
  objects AS (
   SELECT 'pg_class'::regclass::oid classid,oid objid FROM relations
   UNION SELECT 'pg_type'::regclass,oid FROM relation_types
   UNION SELECT 'pg_type'::regclass,typarray FROM relation_types WHERE typarray<>0
   UNION SELECT 'pg_constraint'::regclass,oid FROM pg_constraint WHERE conrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_trigger'::regclass,oid FROM pg_trigger WHERE tgrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_policy'::regclass,oid FROM pg_policy WHERE polrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_attrdef'::regclass,oid FROM pg_attrdef WHERE adrelid IN(SELECT oid FROM base)
   UNION SELECT 'pg_namespace'::regclass,'jetnity_pgnet_allocator_private'::regnamespace
   UNION SELECT 'pg_class'::regclass,'jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
   UNION SELECT 'pg_proc'::regclass,'jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure
   UNION SELECT 'pg_trigger'::regclass,oid FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass
     AND tgname='jetnity_pgnet_request_id_v1'
  ), additions AS (SELECT actual.* FROM jsonb_each(live_catalog) actual
    WHERE NOT before_row.catalog ? actual.key)
  SELECT 1 FROM additions a WHERE NOT CASE
   WHEN a.key='transport:dev_http_id_allocator_v8' THEN true
   WHEN split_part(a.key,':',1) IN('relation','type','constraint','trigger','policy','default','index')
     THEN EXISTS(SELECT 1 FROM objects o WHERE o.objid=split_part(a.key,':',2)::oid)
   WHEN split_part(a.key,':',1)='attribute'
     THEN split_part(a.key,':',2)::oid IN(SELECT oid FROM relations)
   WHEN split_part(a.key,':',1) IN('dependency','shared')
     THEN EXISTS(SELECT 1 FROM objects o
       WHERE o.classid=(a.value->>'classid')::oid AND o.objid=(a.value->>'objid')::oid
       OR split_part(a.key,':',1)='dependency' AND o.classid=(a.value->>'refclassid')::oid AND o.objid=(a.value->>'refobjid')::oid)
   ELSE false END
 ) THEN RAISE EXCEPTION 'DEV_HTTP_V8_UNEXPECTED_NEW_CATALOG_ENTRY' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v
   CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton
   AND v.required_generation>s.generation AND v.proof_not_before>s.last_proof_started
   AND v.catalog=live_catalog)
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_FRESH_PROOF_NOT_ENFORCED' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'DEV_HTTP_V8_OPEN_BEFORE_NEW_FULL_PROOF' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $v8_post$;
SELECT 'DEV_HTTP_ID_ALLOCATOR_V8_SEALED_FRESH_FULL_PROOF_REQUIRED' AS result,
 false AS positive_renewal_proven,false AS production_permission,false AS committed;
-- Outer caller must ROLLBACK for rehearsal. Separate reviewed COMMIT installer
-- must require fresh natural complete audit+cron binding before claiming current.

DO $install_allocator_unused$
DECLARE expected bigint;
BEGIN
 SELECT first_unused INTO STRICT expected FROM pg_temp.dev_allocator_before WHERE singleton;
 IF (SELECT last_value FROM jetnity_pgnet_allocator_private.http_request_id_v1)<>expected
 OR (SELECT is_called FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM false
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
     FROM net.http_request_queue_id_seq) IS DISTINCT FROM
   (SELECT state->'legacy_sequence' FROM pg_temp.dev_allocator_before WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_HTTP_V8_INSTALL_CONSUMED_OR_CHANGED_SEQUENCE' USING ERRCODE='P7998'; END IF;
END $install_allocator_unused$;
SELECT 'DEV_HTTP_ID_ALLOCATOR_V8_INSTALL_READY_FOR_COMMIT' AS result,
 (SELECT first_unused::text FROM pg_temp.dev_allocator_before WHERE singleton) AS allocator_seed,
 false AS new_http_request_started,false AS new_visa_fact,
 false AS fresh_fullproof_observed,false AS production_accessed;
COMMIT;
