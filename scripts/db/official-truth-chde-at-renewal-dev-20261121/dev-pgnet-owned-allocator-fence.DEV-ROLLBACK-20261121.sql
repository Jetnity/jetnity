-- DEV ONLY / UNEXECUTED POST-INSTALL FENCE REVIEW CANDIDATE.
-- Select Dev yfvbxvijcorffwxbxahl independently; never select Production.
-- Requires an actually installed, sealed v8 and the exact approved allocator.
-- Replace ALL THREE SHA placeholders only from its independent post-COMMIT
-- readback. Missing placeholders cause an exception before any object creation.
-- Expected normal helper prosrc at draft time: 16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa.
-- Baseline SHA expression: sha256((to_jsonb(v8_row) || jsonb_build_object(
-- 'proof_not_before',extract(epoch FROM v8_row.proof_not_before)))::text UTF8).
-- This changes ONLY the existing own helper's body to deny future origin/local
-- queue INSERTs. O triggers do not cover replica sessions or direct UPDATEs.
-- Existing queued requests may still be delivered after this lock is released.
-- No HTTP/wake, sequence allocation/reset, trigger removal, source modification,
-- baseline reseal, latch reset, fake audit, membership or managed-owner change.
-- Catalog assertion must refuse immediately; the public alarm retains its
-- normal periodic-audit semantics. Do not claim immediate public-unavailable.
-- First use the separate complete ROLLBACK rehearsal, then review a COMMIT.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';

DO $fence_target_and_pins$
DECLARE
 expected_baseline_sha text:='0d70655bb01ab4e1516149886e1abaeff913012ebbd17b6d643848e48ed3ab87';
 expected_helper_definition_sha text:='0b0ca64659d9884e01b66e781b54f49a6f17357352afcd3ad6eb30e44571a48c';
 expected_helper_prosrc_sha text:='16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa';
 v jsonb; lock_item record; signature text;
BEGIN
 IF expected_baseline_sha !~ '^[a-f0-9]{64}$'
 OR expected_helper_definition_sha !~ '^[a-f0-9]{64}$'
 OR expected_helper_prosrc_sha !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'DEV_FENCE_FINAL_INSTALL_PINS_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed' OR auth.uid() IS NOT NULL
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NULL
 THEN RAISE EXCEPTION 'DEV_FENCE_EXACT_INSTALLED_DEV_TARGET_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF NOT has_table_privilege(current_user,'net.http_request_queue','INSERT')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','UPDATE')
 OR NOT has_table_privilege(current_user,'net.http_request_queue','SELECT')
 THEN RAISE EXCEPTION 'DEV_FENCE_ORDINARY_QUEUE_AUTHORITY_MISSING' USING ERRCODE='42501'; END IF;
 -- Same existing maintenance order: guard, producer advisory locks, queue.
 IF NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'DEV_FENCE_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 FOR lock_item IN SELECT * FROM (VALUES
  (771106,31),(771108,2),(771108,44),(771110,2),(771110,4),
  (771110,6),(771115,61),(771115,752),(771115,768)) locks(first_key,second_key) LOOP
  IF NOT pg_try_advisory_xact_lock(lock_item.first_key,lock_item.second_key)
  THEN RAISE EXCEPTION 'DEV_FENCE_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 END LOOP;
 SELECT to_jsonb(b)||jsonb_build_object('proof_not_before',extract(epoch FROM b.proof_not_before))
 INTO STRICT v FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 b WHERE singleton;
 IF encode(sha256(convert_to(v::text,'UTF8')),'hex') IS DISTINCT FROM expected_baseline_sha
 THEN RAISE EXCEPTION 'DEV_FENCE_V8_BASELINE_PIN_MISMATCH' USING ERRCODE='P7998'; END IF;
 -- Do not trust a replaced checker merely because it returns a matching value.
 FOREACH signature IN ARRAY ARRAY[
  'official_v3_guard_private.catalog_status_v1()',
  'official_v3_guard_private.assert_catalog_v1()'] LOOP
  IF encode(sha256(convert_to(pg_get_functiondef(signature::pg_catalog.regprocedure),'UTF8')),'hex')
   IS DISTINCT FROM v->'catalog'->('function:'||signature::pg_catalog.regprocedure::oid)->>'definition'
  THEN RAISE EXCEPTION 'DEV_FENCE_GUARD_DEFINITION_CHANGED' USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
   AND p.proowner='postgres'::pg_catalog.regrole AND p.prosecdef
   AND p.provolatile='v' AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype
   AND p.pronargs=0 AND p.proconfig=ARRAY['search_path=pg_catalog']
   AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=expected_helper_prosrc_sha
   AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=expected_helper_definition_sha)
 OR v#>>'{transport_metadata,allocator,function,definition}' IS DISTINCT FROM expected_helper_definition_sha
 THEN RAISE EXCEPTION 'DEV_FENCE_CURRENT_HELPER_PIN_MISMATCH' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM v->'catalog'
 THEN RAISE EXCEPTION 'DEV_FENCE_CURRENT_V8_CATALOG_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 -- A fresh-proof-pending or stale alarm is allowed: this is a stop, not an open.
END $fence_target_and_pins$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;

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
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='bigint'::pg_catalog.regtype
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

CREATE FUNCTION pg_temp.dev_allocator_fence_protected_data() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$
 SELECT jsonb_build_object(
 'catalog',official_v3_guard_private.catalog_status_v1(),
 'v7',(SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton),
 'publisher_body_sha',(SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
   WHERE p.oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::pg_catalog.regprocedure),
 'publisher_definition_sha',encode(sha256(convert_to(pg_get_functiondef(
   'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::pg_catalog.regprocedure),'UTF8')),'hex'),
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
REVOKE ALL ON FUNCTION pg_temp.dev_allocator_fence_protected_data() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pg_temp.dev_allocator_fence_state() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $state$
DECLARE item record; ledger jsonb; ledgers jsonb:='{}'::jsonb;
BEGIN
 IF NOT pg_temp.dev_http_inventory_exact() THEN
  RAISE EXCEPTION 'DEV_FENCE_HTTP_ID_INVENTORY_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM pg_temp.dev_http_id_inventory ORDER BY schema_name,table_name,column_name LOOP
  EXECUTE format('SELECT jsonb_build_object(''row_count'',count(*)::text,''rows_sha'',encode(sha256(convert_to(coalesce(string_agg(to_jsonb(t)::text,''|'' ORDER BY to_jsonb(t)::text COLLATE "C"),''''),''UTF8'')),''hex'')) FROM %I.%I t',
   item.schema_name,item.table_name) INTO STRICT ledger;
  ledgers:=ledgers||jsonb_build_object(item.schema_name||'.'||item.table_name||'.'||item.column_name,ledger);
 END LOOP;
 RETURN jsonb_build_object(
  'protected_data',pg_temp.dev_allocator_fence_protected_data()-'catalog',
  'v8',(SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton),
  'guard_state',(SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton),
  'http_id_ledgers',ledgers,
  'legacy_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
    FROM net.http_request_queue_id_seq),
  'own_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
    FROM jetnity_pgnet_allocator_private.http_request_id_v1),
  'catalog',official_v3_guard_private.catalog_status_v1(),
  'helper',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])||jsonb_build_object(
    'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)
 );
END $state$;
REVOKE ALL ON FUNCTION pg_temp.dev_allocator_fence_state() FROM PUBLIC,anon,authenticated,service_role;
CREATE TEMP TABLE pg_temp.dev_allocator_fence_before(
 singleton boolean PRIMARY KEY CHECK(singleton),state jsonb NOT NULL
) ON COMMIT DROP;
DO $fence_locked_snapshot$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
   AND relation='net.http_request_queue'::pg_catalog.regclass AND mode='ShareRowExclusiveLock')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
   AND tgname='jetnity_pgnet_request_id_v1' AND tgtype=7 AND tgenabled='O'
   AND NOT tgisinternal AND tgconstraint=0 AND tgnargs=0 AND tgqual IS NULL
   AND tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)
 OR NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
   WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
    AND c.relowner='postgres'::pg_catalog.regrole AND c.relkind='S' AND c.relpersistence='p'
    AND s.seqtypid='pg_catalog.int8'::pg_catalog.regtype AND s.seqincrement=1 AND s.seqcache=1
    AND s.seqmin=1 AND s.seqmax=9223372036854775807 AND NOT s.seqcycle)
 THEN RAISE EXCEPTION 'DEV_FENCE_LOCK_OR_BINDING_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 INSERT INTO pg_temp.dev_allocator_fence_before VALUES(true,pg_temp.dev_allocator_fence_state());
END $fence_locked_snapshot$;
SAVEPOINT dev_http_id_fence;
CREATE OR REPLACE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $fence$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'DEV_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 RAISE EXCEPTION 'DEV_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED' USING ERRCODE='P7998';
END $fence$;

DO $fence_native_negative_and_preservation$
DECLARE before_state jsonb; after_state jsonb; old_catalog jsonb; new_catalog jsonb;
 helper_key text; message text; denied boolean:=false; catalog_denied boolean:=false;
BEGIN
 SELECT state INTO STRICT before_state FROM pg_temp.dev_allocator_fence_before WHERE singleton;
 IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
  WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)
  IS DISTINCT FROM '6fd36743aaa471eaaade0eda4e3484df11842a027ee53175d5f26118fbae47c9'
 THEN RAISE EXCEPTION 'DEV_FENCE_NEW_BODY_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 -- Explicit ID skips the legacy nontransactional nextval default. The exact
 -- fence raises before allocation; no net.http_* or wake call is performed.
 BEGIN
  INSERT INTO net.http_request_queue(id,method,url,headers,body,timeout_milliseconds)
  VALUES(0,'GET','https://example.invalid/jetnity-dev-fence-rollback-only','{}'::jsonb,NULL,1);
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  GET STACKED DIAGNOSTICS message=MESSAGE_TEXT;
  IF message IS DISTINCT FROM 'DEV_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED'
  THEN RAISE EXCEPTION 'DEV_FENCE_INSERT_REFUSED_FOR_WRONG_REASON' USING ERRCODE='P7998'; END IF;
  denied:=true;
 END;
 IF NOT denied THEN
  RAISE EXCEPTION 'DEV_FENCE_NEW_QUEUE_INSERT_WAS_ALLOWED' USING ERRCODE='P7998'; END IF;
 after_state:=pg_temp.dev_allocator_fence_state();
 IF (after_state-ARRAY['catalog','helper']) IS DISTINCT FROM (before_state-ARRAY['catalog','helper'])
 OR ((after_state->'helper')-'definition') IS DISTINCT FROM ((before_state->'helper')-'definition')
 THEN RAISE EXCEPTION 'DEV_FENCE_STATE_HISTORY_OR_HELPER_AUTHORITY_CHANGED' USING ERRCODE='P7998'; END IF;
 old_catalog:=before_state->'catalog'; new_catalog:=after_state->'catalog';
 IF old_catalog#>'{transport:dev_http_id_allocator_v8,allocator,function}' IS NULL
 OR new_catalog#>'{transport:dev_http_id_allocator_v8,allocator,function}' IS NULL
 THEN RAISE EXCEPTION 'DEV_FENCE_V8_TRANSPORT_PATH_MISSING' USING ERRCODE='P7998'; END IF;
 old_catalog:=jsonb_set(old_catalog,'{transport:dev_http_id_allocator_v8,allocator,function}',
  (old_catalog#>'{transport:dev_http_id_allocator_v8,allocator,function}')-'definition',false);
 new_catalog:=jsonb_set(new_catalog,'{transport:dev_http_id_allocator_v8,allocator,function}',
  (new_catalog#>'{transport:dev_http_id_allocator_v8,allocator,function}')-'definition',false);
 helper_key:='function:'||'jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure::oid;
 IF old_catalog ? helper_key THEN
  old_catalog:=jsonb_set(old_catalog,ARRAY[helper_key],(old_catalog->helper_key)-'definition',false);
  new_catalog:=jsonb_set(new_catalog,ARRAY[helper_key],(new_catalog->helper_key)-'definition',false);
 END IF;
 IF new_catalog IS DISTINCT FROM old_catalog THEN
  RAISE EXCEPTION 'DEV_FENCE_UNEXPECTED_CATALOG_DELTA' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  GET STACKED DIAGNOSTICS message=MESSAGE_TEXT;
  IF message IS DISTINCT FROM 'bg1 recovery protected catalog changed'
  THEN RAISE EXCEPTION 'DEV_FENCE_CATALOG_REFUSED_FOR_WRONG_REASON' USING ERRCODE='P7998'; END IF;
  catalog_denied:=true;
 END;
 IF NOT catalog_denied THEN
  RAISE EXCEPTION 'DEV_FENCE_CATALOG_DID_NOT_REFUSE' USING ERRCODE='P7998'; END IF;
 -- Neither require_open nor a stale/current public alarm is treated as the
 -- immediate catalog proof. Natural audit/readback is a subsequent operation.
END $fence_native_negative_and_preservation$;

ROLLBACK TO SAVEPOINT dev_http_id_fence;
DO $fence_rehearsal_restore$
BEGIN
 IF pg_temp.dev_allocator_fence_state() IS DISTINCT FROM
   (SELECT state FROM pg_temp.dev_allocator_fence_before WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_FENCE_SAVEPOINT_RESTORE_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $fence_rehearsal_restore$;
RELEASE SAVEPOINT dev_http_id_fence;
SELECT 'DEV_HTTP_ID_FENCE_REHEARSAL_DENIAL_AND_FULL_RESTORE_PASS' AS result,
 true AS actual_explicit_id_insert_denied,true AS actual_v8_catalog_refusal,
 true AS original_helper_catalog_baseline_latch_sequences_history_restored,
 false AS nextval_or_setval_executed,false AS http_or_wake_called,
 false AS persistent_fence,false AS public_alarm_unavailable_proven,false AS production_accessed;
ROLLBACK;
