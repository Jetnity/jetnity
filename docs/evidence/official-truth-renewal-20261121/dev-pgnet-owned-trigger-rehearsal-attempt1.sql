-- DEV ONLY / UNEXECUTED REVIEW CANDIDATE / FINAL ROLLBACK / NEVER PRODUCTION.
-- Client must independently select yfvbxvijcorffwxbxahl (PostgreSQL 17).
-- New private LOGGED allocator + global BEFORE INSERT trigger, using the ordinary
-- queue TRIGGER/INSERT/UPDATE privileges. No role/owner/legacy-default changes.
-- Root live readback: queue TRIGGER/INSERT/UPDATE=true; all three pg_net 0.20.4
-- request functions return INSERT ... RETURNING id and call net.wake().
-- This rehearsal uses EXPLICIT incoming IDs, so the legacy default is not run.
-- It invokes neither net.http_* nor net.wake(), and keeps all probe rows uncommitted
-- behind the queue lock. No HTTP delivery or collector/source action is authorized.
-- New-sequence nextval is used only to test row allocation, NOT as rollback proof.
-- The separate SAVEPOINT proof uses ALTER SEQUENCE RESTART with no nextval inside.
-- Outer SAVEPOINT rollback removes the entirely new sequence/schema/function/trigger.
-- After COMMIT, preserving this allocator requires a separately reviewed install,
-- all-producer role privileges, v8 tamper guard, and real pg_net transport evidence.
-- Sources inspected at tag v0.20.4:
-- https://github.com/supabase/pg_net/blob/v0.20.4/sql/pg_net.sql
-- https://github.com/supabase/pg_net/blob/v0.20.4/src/worker.c
-- https://www.postgresql.org/docs/17/sql-createtrigger.html
-- https://www.postgresql.org/docs/17/sql-dropfunction.html
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';

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
  'legacy_sequence',(SELECT to_jsonb(s) FROM net.http_request_queue_id_seq s),
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

SAVEPOINT dev_allocator_install;
CREATE SCHEMA jetnity_pgnet_allocator_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_pgnet_allocator_private FROM PUBLIC,anon,authenticated,service_role;
DO $create_owned_sequence$
DECLARE first_id bigint;
BEGIN
 SELECT first_unused INTO STRICT first_id FROM pg_temp.dev_allocator_before WHERE singleton;
 EXECUTE format('CREATE SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH %s CACHE 1 NO CYCLE',first_id);
END $create_owned_sequence$;
REVOKE ALL ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $assign$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0 THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 -- Incoming/default IDs are deliberately ignored for EVERY queue producer.
 NEW.id:=nextval('jetnity_pgnet_allocator_private.http_request_id_v1'::regclass);
 RETURN NEW;
END $assign$;
REVOKE ALL ON FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER jetnity_pgnet_request_id_v1 BEFORE INSERT ON net.http_request_queue
 FOR EACH ROW EXECUTE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1();

DO $allocator_insert_probe$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE; probe_first bigint; probe_second bigint;
 sequence_value bigint; sequence_called boolean;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
   AND c.relkind='S' AND c.relpersistence='p' AND c.relowner='postgres'::regrole
   AND s.seqtypid='bigint'::regtype AND s.seqincrement=1 AND s.seqcache=1
   AND NOT s.seqcycle AND s.seqmin=1 AND s.seqmax=9223372036854775807)
 OR (SELECT prosecdef FROM pg_proc WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure)
 OR (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure)<>'postgres'
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)<>1
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_NEW_OBJECTS_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 -- EXPLICIT id is mandatory: otherwise the existing non-transactional default
 -- nextval would run before our trigger and could not be rolled back.
 INSERT INTO net.http_request_queue(id,method,url,headers,body,timeout_milliseconds)
 VALUES(0,'GET',b.probe_url_prefix||'a','{"x-jetnity-proof":"rollback-only"}'::jsonb,NULL,1)
 RETURNING id INTO probe_first;
 INSERT INTO net.http_request_queue(id,method,url,headers,body,timeout_milliseconds)
 VALUES(b.historical_max,'GET',b.probe_url_prefix||'b','{"x-jetnity-proof":"rollback-only"}'::jsonb,NULL,1)
 RETURNING id INTO probe_second;
 SELECT last_value,is_called INTO STRICT sequence_value,sequence_called
 FROM jetnity_pgnet_allocator_private.http_request_id_v1;
 IF probe_first<>b.first_unused OR probe_second<>b.first_unused+1
 OR probe_first<=b.historical_max OR probe_first<=b.legacy_last
 OR sequence_value<>probe_second OR sequence_called IS DISTINCT FROM true
 OR (SELECT count(*) FROM net.http_request_queue)<>b.original_queue_count+2
 OR (SELECT count(*) FROM net.http_request_queue WHERE url IN(b.probe_url_prefix||'a',b.probe_url_prefix||'b'))<>2
 OR (SELECT to_jsonb(s) FROM net.http_request_queue_id_seq s) IS DISTINCT FROM b.state->'legacy_sequence'
 OR pg_temp.dev_seq_protected_state() IS DISTINCT FROM b.state->'protected'
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_INSERT_RETURNING_PROBE_FAILED' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET first_id=probe_first,
  second_id=probe_second WHERE singleton;
END $allocator_insert_probe$;

-- Actual transactional RESTART restoration on the new OWNED sequence.
-- Queue lock comes first; its producers acquire the queue before this sequence.
ALTER SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 INCREMENT BY 1;
UPDATE pg_temp.dev_allocator_proof SET owned_restart_before=jsonb_build_object(
 'value',(SELECT to_jsonb(s) FROM jetnity_pgnet_allocator_private.http_request_id_v1 s),
 'parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE seqrelid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass),
 'class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass)
) WHERE singleton;
SAVEPOINT dev_allocator_restart;
DO $owned_restart$
DECLARE target bigint;
BEGIN
 SELECT first_unused+17 INTO STRICT target FROM pg_temp.dev_allocator_before WHERE singleton;
 EXECUTE format('ALTER SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 RESTART WITH %s',target);
 IF (SELECT last_value FROM jetnity_pgnet_allocator_private.http_request_id_v1)<>target
 OR (SELECT is_called FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_OWNED_RESTART_DID_NOT_APPLY' USING ERRCODE='P7998'; END IF;
END $owned_restart$;
ROLLBACK TO SAVEPOINT dev_allocator_restart;
UPDATE pg_temp.dev_allocator_proof SET owned_restart_after=jsonb_build_object(
 'value',(SELECT to_jsonb(s) FROM jetnity_pgnet_allocator_private.http_request_id_v1 s),
 'parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE seqrelid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass),
 'class',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass)
) WHERE singleton;
DO $owned_restart_exact$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_temp.dev_allocator_proof WHERE singleton
   AND owned_restart_before IS DISTINCT FROM owned_restart_after) THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_OWNED_RESTART_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET owned_restart_exact=true WHERE singleton;
END $owned_restart_exact$;
RELEASE SAVEPOINT dev_allocator_restart;

-- Feasibility of ordinary owner-controlled cleanup: this function is newly
-- created/uncommitted, private, and has exactly ONE dependent object: our trigger.
-- This is not blanket permission to cascade-drop any preexisting object.
UPDATE pg_temp.dev_allocator_proof SET cleanup_before=jsonb_build_object(
 'function',(SELECT to_jsonb(p) FROM pg_proc p WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),
 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY oid) FROM pg_trigger t WHERE tgrelid='net.http_request_queue'::regclass),
 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY classid,objid,objsubid,refclassid,refobjid,refobjsubid,deptype)
   FROM pg_depend d WHERE refclassid='pg_proc'::regclass AND refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),
 'allocator',(SELECT to_jsonb(s) FROM jetnity_pgnet_allocator_private.http_request_id_v1 s)
) WHERE singleton;
SAVEPOINT dev_allocator_cleanup;
DO $cascade_dependency_gate$
DECLARE fn oid:='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure;
 trig oid;
BEGIN
 SELECT oid INTO STRICT trig FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass
  AND tgname='jetnity_pgnet_request_id_v1' AND tgfoid=fn AND NOT tgisinternal;
 IF (SELECT proowner FROM pg_proc WHERE oid=fn)<>'postgres'::regrole
 OR (SELECT count(*) FROM pg_depend WHERE refclassid='pg_proc'::regclass AND refobjid=fn)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_depend WHERE refclassid='pg_proc'::regclass AND refobjid=fn
  AND classid='pg_trigger'::regclass AND objid=trig AND deptype='n')
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_CASCADE_SCOPE_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $cascade_dependency_gate$;
DROP FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() CASCADE;
DO $cascade_removed_only_own$
BEGIN
 IF to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NOT NULL
 OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass)
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR pg_temp.dev_seq_protected_state() IS DISTINCT FROM
   (SELECT state->'protected' FROM pg_temp.dev_allocator_before WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_CASCADE_UNEXPECTED_EFFECT' USING ERRCODE='P7998'; END IF;
END $cascade_removed_only_own$;
ROLLBACK TO SAVEPOINT dev_allocator_cleanup;
UPDATE pg_temp.dev_allocator_proof SET cleanup_after=jsonb_build_object(
 'function',(SELECT to_jsonb(p) FROM pg_proc p WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),
 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY oid) FROM pg_trigger t WHERE tgrelid='net.http_request_queue'::regclass),
 'dependencies',(SELECT jsonb_agg(to_jsonb(d) ORDER BY classid,objid,objsubid,refclassid,refobjid,refobjsubid,deptype)
   FROM pg_depend d WHERE refclassid='pg_proc'::regclass AND refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),
 'allocator',(SELECT to_jsonb(s) FROM jetnity_pgnet_allocator_private.http_request_id_v1 s)
) WHERE singleton;
DO $cascade_restored$
BEGIN
 IF EXISTS(SELECT 1 FROM pg_temp.dev_allocator_proof WHERE singleton
   AND cleanup_before IS DISTINCT FROM cleanup_after)
 OR to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NULL
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::regclass
  AND tgname='jetnity_pgnet_request_id_v1'
  AND tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure)<>1
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_CASCADE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET cascade_exact=true WHERE singleton;
END $cascade_restored$;
RELEASE SAVEPOINT dev_allocator_cleanup;

-- Every proof stage must complete before undoing the installation. Changes
-- to the proof row below are themselves transactional and are intentionally
-- rolled back. The final result reports the exact IDs established by these
-- assertions, not an alleged nextval reversal or a surviving progress flag.
DO $all_inner_probes_completed$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_temp.dev_allocator_proof p CROSS JOIN pg_temp.dev_allocator_before b
  WHERE p.singleton AND b.singleton AND p.owned_restart_exact AND p.cascade_exact
   AND p.first_id=b.first_unused AND p.second_id=b.first_unused+1) THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_INNER_PROBE_MISSING' USING ERRCODE='P7998'; END IF;
END $all_inner_probes_completed$;
ROLLBACK TO SAVEPOINT dev_allocator_install;

DO $complete_rollback_exact$
DECLARE b pg_temp.dev_allocator_before%ROWTYPE;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_allocator_before WHERE singleton;
 IF to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR pg_temp.dev_allocator_runtime_state() IS DISTINCT FROM b.state
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_ALLOCATOR_COMPLETE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current' THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_BG1_NOT_CURRENT_AFTER_ROLLBACK' USING ERRCODE='P7998'; END IF;
 UPDATE pg_temp.dev_allocator_proof SET complete_install_rollback_exact=true WHERE singleton;
END $complete_rollback_exact$;
SELECT 'DEV_PGNET_OWNED_ALLOCATOR_TRIGGER_INSTALL_ROLLBACK_PASS' AS result,
 b.historical_max AS actual_reserved_high_water,b.legacy_last AS unchanged_legacy_value,
 b.first_unused AS validated_first_insert_id,b.first_unused+1 AS validated_second_insert_id,
 true AS owned_sequence_restart_savepoint_exact,true AS own_function_cascade_scope_and_rollback_exact,
 p.complete_install_rollback_exact,
 true AS original_legacy_sequence_queue_response_catalog_v7_sources_facts_restored,
 true AS new_allocator_and_trigger_removed,
 false AS old_sequence_restart_tested,
 false AS network_transport_tested,false AS public_http_function_execution_tested,
 false AS native_multisession_concurrency_tested,false AS v8_tamper_guard_installed,
 false AS persistent_install,false AS http_request_sent,false AS production_write
FROM pg_temp.dev_allocator_before b CROSS JOIN pg_temp.dev_allocator_proof p
WHERE b.singleton AND p.singleton;
ROLLBACK;
