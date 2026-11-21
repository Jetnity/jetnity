-- Ownership precheck added after the separate actual attempt, time-bounded
-- 2026-11-21 13:48:55..13:50:24 UTC (exact execution timestamp unavailable).
-- It failed with SQLSTATE 42501 at the first ALTER SEQUENCE, without an effective
-- sequence change. Original bytes: *.ATTEMPTED-20261121T1349Z.sql (approximate label).
-- This revised candidate is UNEXECUTED; no hosted rollback PASS or repair exists.
-- DEV ONLY / UNEXECUTED COMMIT CANDIDATE / NEVER PRODUCTION.
-- Run only after independent successful REAL DEV rehearsal of identical core.
-- This file PERSISTS the sequence correction. It is not the rollback rehearsal.
-- Target must be independently selected as yfvbxvijcorffwxbxahl by the client.
-- Live inventory reviewed 2026-11-21 13:42:18 UTC: 14 durable bigint HTTP-ID
-- columns plus net queue/response. Sequence was UNLOGGED, last=20, called=true;
-- greatest archived reservation=1800. These observations are NOT frozen repair
-- values: every value is re-read after the global sequence lock.
-- No HTTP request, nextval, setval, source/fact/cron/role mutation or login.
-- No UNLOGGED->LOGGED conversion. All pre-commit failures abort the transaction.
-- After COMMIT never decrement/reuse request IDs as a rollback.
-- Root must perform an independent post-COMMIT Dev/BG1 readback.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';

-- Read-only authority gate: must succeed before any temporary object or sequence DDL.
DO $owner_authority_precheck$
DECLARE sequence_owner oid; sequence_owner_name name;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 -- Metadata ACL grants (including sequence USAGE/UPDATE) do not authorize ALTER.
 -- PostgreSQL requires ownership or already inherited privileges of its owner.
 -- Merely being granted ot_v3_jobs_owner by supabase_admin is not membership
 -- in supabase_admin. Never repair this failed gate by changing roles or ACLs.
 SELECT c.relowner,pg_get_userbyid(c.relowner) INTO STRICT sequence_owner,sequence_owner_name
 FROM pg_class c WHERE c.oid='net.http_request_queue_id_seq'::regclass AND c.relkind='S';
 IF pg_has_role(current_user,sequence_owner,'USAGE') IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_OWNER_AUTHORITY_UNAVAILABLE'
   USING ERRCODE='42501',
    DETAIL=format('Current role %I lacks inherited owner authority for net.http_request_queue_id_seq, owned by %I.',
      current_user,sequence_owner_name),
    HINT='Stop. This candidate authorizes no SET ROLE, membership/ACL/owner change or new SECURITY DEFINER path.';
 END IF;
END $owner_authority_precheck$;

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

-- The global sequence barrier MUST precede any last_value/high-water read.
ALTER SEQUENCE net.http_request_queue_id_seq INCREMENT BY 1;

CREATE TEMP TABLE pg_temp.dev_http_sequence_before(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 original_value bigint NOT NULL,original_called boolean NOT NULL,
 original_parameters jsonb NOT NULL,original_class jsonb NOT NULL,
 protected_state jsonb NOT NULL,historical_max bigint NOT NULL,
 next_unused bigint NOT NULL,inventory_count integer NOT NULL
) ON COMMIT DROP;
DO $locked_snapshot$
DECLARE item record; part_max bigint; high bigint:=0; seq_value bigint; seq_called boolean;
 params jsonb; class_state jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='relation' AND pid=pg_backend_pid()
  AND relation='net.http_request_queue_id_seq'::regclass AND mode='ShareRowExclusiveLock' AND granted)
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_LOCK_OR_INVENTORY_MISSING' USING ERRCODE='P7998'; END IF;
 SELECT to_jsonb(s) INTO STRICT params FROM pg_sequence s
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 IF params->>'seqtypid' IS DISTINCT FROM ('bigint'::regtype::oid)::text
 OR (params->>'seqincrement')::bigint<>1 OR (params->>'seqcache')::bigint<>1
 OR (params->>'seqcycle')::boolean OR (params->>'seqmin')::bigint<>1
 OR (params->>'seqmax')::bigint<>9223372036854775807
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PARAMETERS_CHANGED_WHILE_LOCKING' USING ERRCODE='P7998'; END IF;
 SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'] INTO STRICT class_state
 FROM pg_class c WHERE oid='net.http_request_queue_id_seq'::regclass;
 IF class_state->>'relpersistence'<>'u' THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_LOGGING_MODE_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT last_value,is_called INTO STRICT seq_value,seq_called FROM net.http_request_queue_id_seq;
 FOR item IN SELECT * FROM pg_temp.dev_http_id_inventory ORDER BY schema_name,table_name,column_name LOOP
  EXECUTE format('SELECT max(%I) FROM %I.%I',item.column_name,item.schema_name,item.table_name) INTO part_max;
  IF part_max IS NOT NULL AND part_max<1 THEN
   RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_INVALID_HISTORY_ID' USING ERRCODE='P7998'; END IF;
  high:=greatest(high,coalesce(part_max,0));
 END LOOP;
 IF seq_value<1 OR high<1 OR greatest(high,seq_value)>=9223372036854775807 THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_INVALID_OR_EXHAUSTED_RANGE' USING ERRCODE='P7998'; END IF;
 IF NOT (seq_value<high OR seq_value=high AND NOT seq_called) THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_NO_REPAIR_NEEDED' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_http_sequence_before
  (original_value,original_called,original_parameters,original_class,protected_state,historical_max,next_unused,inventory_count)
 VALUES(seq_value,seq_called,params,class_state,pg_temp.dev_seq_protected_state(),high,greatest(high,seq_value)+1,16);
END $locked_snapshot$;

SAVEPOINT dev_http_sequence_restart;
-- BEGIN SHARED REPAIR CORE: identical in the separately reviewed COMMIT variant.
DO $repair$
DECLARE before_row pg_temp.dev_http_sequence_before%ROWTYPE; after_value bigint; after_called boolean;
 after_params jsonb; after_class jsonb;
BEGIN
 SELECT * INTO STRICT before_row FROM pg_temp.dev_http_sequence_before WHERE singleton;
 IF NOT pg_temp.dev_http_inventory_exact()
 OR (SELECT last_value FROM net.http_request_queue_id_seq) IS DISTINCT FROM before_row.original_value
 OR (SELECT is_called FROM net.http_request_queue_id_seq) IS DISTINCT FROM before_row.original_called
 OR pg_temp.dev_seq_protected_state() IS DISTINCT FROM before_row.protected_state
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PRE_REPAIR_STATE_CHANGED' USING ERRCODE='P7998'; END IF;
 EXECUTE format('ALTER SEQUENCE net.http_request_queue_id_seq RESTART WITH %s',before_row.next_unused);
 SELECT last_value,is_called INTO STRICT after_value,after_called FROM net.http_request_queue_id_seq;
 SELECT to_jsonb(s) INTO STRICT after_params FROM pg_sequence s
  WHERE seqrelid='net.http_request_queue_id_seq'::regclass;
 SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid'] INTO STRICT after_class
  FROM pg_class c WHERE oid='net.http_request_queue_id_seq'::regclass;
 IF after_value<>before_row.next_unused OR after_called IS DISTINCT FROM false
 OR after_value<=before_row.original_value OR after_value<=before_row.historical_max
 OR after_params IS DISTINCT FROM before_row.original_parameters
 OR (after_class-'relfilenode') IS DISTINCT FROM (before_row.original_class-'relfilenode')
 OR pg_temp.dev_seq_protected_state() IS DISTINCT FROM before_row.protected_state
 OR NOT pg_temp.dev_http_inventory_exact()
 THEN RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_REPAIR_POSTCHECK_FAILED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current' THEN
  RAISE EXCEPTION 'DEV_HTTP_SEQUENCE_PROOF_EXPIRED' USING ERRCODE='P7998'; END IF;
END $repair$;
-- END SHARED REPAIR CORE.

-- COMMIT-ONLY ENDING: intentionally different from the rollback rehearsal.
-- This SELECT is a pre-commit postcheck, not a claim that COMMIT already succeeded.
RELEASE SAVEPOINT dev_http_sequence_restart;
SELECT 'DEV_PGNET_SEQUENCE_POSTCHECK_READY_TO_COMMIT' AS result,
 original_value AS actual_before_last_value,original_called AS actual_before_is_called,
 historical_max AS actual_reserved_high_water,next_unused AS reviewed_first_unused_id,
 inventory_count AS exact_id_columns,
 true AS catalog_v7_publisher_sources_facts_cron_unchanged,
 false AS http_request_started,false AS positive_fact,
 false AS logging_mode_changed,false AS production_write
FROM pg_temp.dev_http_sequence_before WHERE singleton;
COMMIT;
