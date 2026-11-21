-- REVIEW ONLY: native functional negatives after v8 POST, inside the same
-- outer ROLLBACK rehearsal. No audit call, HTTP, nextval, setval or source write.
-- Existing guard advisory lock and queue SHARE ROW EXCLUSIVE lock must be held.
CREATE TEMP TABLE dev_http_v8_negative_before ON COMMIT DROP AS
SELECT official_v3_guard_private.catalog_status_v1() AS catalog,
 (SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton) AS baseline,
 (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) AS guard_state,
 pg_temp.dev_http_v8_data() AS protected_data,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) AS own_sequence,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM net.http_request_queue_id_seq) AS managed_sequence,
 pg_catalog.current_setting('session_replication_role') AS original_context;

CREATE FUNCTION pg_temp.dev_http_v8_expect_catalog_refusal(test_name text) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $test$
DECLARE baseline_catalog jsonb; actual_catalog jsonb; message text;
BEGIN
 SELECT catalog INTO STRICT baseline_catalog FROM pg_temp.dev_http_v8_negative_before;
 actual_catalog:=official_v3_guard_private.catalog_status_v1();
 IF (actual_catalog-'transport:dev_http_id_allocator_v8') IS DISTINCT FROM
      (baseline_catalog-'transport:dev_http_id_allocator_v8')
 OR actual_catalog->'transport:dev_http_id_allocator_v8' IS NOT DISTINCT FROM
      baseline_catalog->'transport:dev_http_id_allocator_v8'
 THEN RAISE EXCEPTION 'V8_NEGATIVE_NOT_ISOLATED_TO_TRANSPORT' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'V8_NEGATIVE_CATALOG_DID_NOT_REFUSE' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  GET STACKED DIAGNOSTICS message=MESSAGE_TEXT;
  IF message IS DISTINCT FROM 'bg1 recovery protected catalog changed' THEN
   RAISE EXCEPTION 'V8_NEGATIVE_UNEXPECTED_REFUSAL_CAUSE' USING ERRCODE='P7998'; END IF;
 END;
 RETURN test_name||':native_guard_refused';
END $test$;
REVOKE ALL ON FUNCTION pg_temp.dev_http_v8_expect_catalog_refusal(text) FROM PUBLIC,anon,authenticated,service_role;

SELECT official_v3_guard_private.assert_catalog_v1();
SAVEPOINT v8_sequence_parameter_negative;
ALTER SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 INCREMENT BY 2;
SELECT pg_temp.dev_http_v8_expect_catalog_refusal('sequence_parameter');
ROLLBACK TO SAVEPOINT v8_sequence_parameter_negative;
RELEASE SAVEPOINT v8_sequence_parameter_negative;
SELECT official_v3_guard_private.assert_catalog_v1();

SAVEPOINT v8_private_acl_negative;
GRANT USAGE ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 TO PUBLIC;
SELECT pg_temp.dev_http_v8_expect_catalog_refusal('sequence_public_usage');
ROLLBACK TO SAVEPOINT v8_private_acl_negative;
RELEASE SAVEPOINT v8_private_acl_negative;
SELECT official_v3_guard_private.assert_catalog_v1();

SAVEPOINT v8_helper_body_negative;
CREATE OR REPLACE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $tamper$
BEGIN RAISE EXCEPTION 'V8_TEST_ONLY_CLOSED_HELPER' USING ERRCODE='P7998'; END $tamper$;
SELECT pg_temp.dev_http_v8_expect_catalog_refusal('helper_body');
ROLLBACK TO SAVEPOINT v8_helper_body_negative;
RELEASE SAVEPOINT v8_helper_body_negative;
SELECT official_v3_guard_private.assert_catalog_v1();

-- Root's native R1 established the narrow owned-function CASCADE authority.
-- Recheck the dependency before using it as an isolated tamper negative.
DO $cascade_scope$
BEGIN
 IF (SELECT count(*) FROM pg_depend WHERE refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
   AND refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_depend d JOIN pg_trigger t ON d.classid='pg_catalog.pg_trigger'::pg_catalog.regclass
   AND t.oid=d.objid WHERE d.refclassid='pg_catalog.pg_proc'::pg_catalog.regclass
   AND d.refobjid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
   AND t.tgrelid='net.http_request_queue'::pg_catalog.regclass AND t.tgname='jetnity_pgnet_request_id_v1'
   AND d.deptype='n')
 THEN RAISE EXCEPTION 'V8_NEGATIVE_CASCADE_SCOPE_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $cascade_scope$;
SAVEPOINT v8_missing_global_trigger_negative;
DROP FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() CASCADE;
SELECT pg_temp.dev_http_v8_expect_catalog_refusal('missing_global_trigger_and_helper');
ROLLBACK TO SAVEPOINT v8_missing_global_trigger_negative;
RELEASE SAVEPOINT v8_missing_global_trigger_negative;
SELECT official_v3_guard_private.assert_catalog_v1();

DO $immutable_baseline_negative$
BEGIN
 BEGIN
  UPDATE official_v3_guard_private.bg1_dev_http_id_allocator_v8
   SET required_generation=required_generation+1 WHERE singleton;
  RAISE EXCEPTION 'V8_BASELINE_UPDATE_WAS_ALLOWED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL;
 END;
 BEGIN
  DELETE FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton;
  RAISE EXCEPTION 'V8_BASELINE_DELETE_WAS_ALLOWED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL;
 END;
 BEGIN
  TRUNCATE official_v3_guard_private.bg1_dev_http_id_allocator_v8;
  RAISE EXCEPTION 'V8_BASELINE_TRUNCATE_WAS_ALLOWED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL;
 END;
END $immutable_baseline_negative$;

-- This is the ordinary postgres SET admitted by the live Supautils policy.
-- No write, trigger invocation, queue entry or source call occurs in replica.
SAVEPOINT v8_replica_context_negative;
SET LOCAL session_replication_role=replica;
DO $replica_negative$
DECLARE message text;
BEGIN
 IF pg_catalog.current_setting('session_replication_role') IS DISTINCT FROM 'replica'
 THEN RAISE EXCEPTION 'V8_REPLICA_TEST_CONTEXT_NOT_REACHED' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'V8_REPLICA_ASSERT_WAS_ALLOWED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  GET STACKED DIAGNOSTICS message=MESSAGE_TEXT;
  IF message IS DISTINCT FROM 'bg1 transport session context unavailable'
  THEN RAISE EXCEPTION 'V8_REPLICA_ASSERT_WRONG_CAUSE' USING ERRCODE='P7998'; END IF;
 END;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'V8_REPLICA_REQUIRE_OPEN_WAS_ALLOWED' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN
  GET STACKED DIAGNOSTICS message=MESSAGE_TEXT;
  IF message IS DISTINCT FROM 'bg1 transport session context unavailable'
  THEN RAISE EXCEPTION 'V8_REPLICA_REQUIRE_OPEN_WRONG_CAUSE' USING ERRCODE='P7998'; END IF;
 END;
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'V8_REPLICA_PUBLIC_STATUS_NOT_CLOSED' USING ERRCODE='P7998'; END IF;
END $replica_negative$;
ROLLBACK TO SAVEPOINT v8_replica_context_negative;
RELEASE SAVEPOINT v8_replica_context_negative;
SELECT official_v3_guard_private.assert_catalog_v1();

DO $negative_restore$
DECLARE b pg_temp.dev_http_v8_negative_before%ROWTYPE;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_http_v8_negative_before;
 IF official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM b.catalog
 OR (SELECT to_jsonb(v) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton) IS DISTINCT FROM b.baseline
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM b.guard_state
 OR pg_temp.dev_http_v8_data() IS DISTINCT FROM b.protected_data
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
   FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM b.own_sequence
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
   FROM net.http_request_queue_id_seq) IS DISTINCT FROM b.managed_sequence
 OR pg_catalog.current_setting('session_replication_role') IS DISTINCT FROM b.original_context
 THEN RAISE EXCEPTION 'V8_NEGATIVE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
END $negative_restore$;
SELECT 'DEV_HTTP_V8_NATIVE_NEGATIVES_AND_SAVEPOINT_RESTORE_PASS' AS result,
 false AS actual_http_sent,false AS positive_renewal_proven,false AS production_permission;
-- The assembling caller must still roll back the whole installation and verify
-- the original v7/functions/roles/receipts/data/managed transport independently.
