-- PREPARED ONLY / NOT EXECUTED. Separate exact post-install Production READ scope.
-- Expected new definitions are checked before calling the known read-only Guard/status functions.
-- This captures a COMMITTED successor pin for a later Fence; it does not authorize a Fence.
-- One transaction, no retry. No audit/Publisher/HTTP/Owner routine, role change or counter allocation.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $postcommit_pinned_read_context$
DECLARE item record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_WRONG_INSTALLED_CONTEXT' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','a0a50ad3ecc7433d99685b1eb232b3d811d7eb6fe1cc5ea55643420aba9a72d3'),
  ('official_v3_guard_private.assert_catalog_v1()','826ba2a7ef4dd29f6aefa8c88323d22f93e181224f472422e289ef5b9756bb2f'),
  ('official_v3_guard_private.require_open_v1()','de352dc414b5a5545cc0cb0edc245ed2312777d73b250adcdc9b93ca804ebcae'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('official_v3_at_production_private.renew_ch_v1()','572a243b45785800f67f372c0667397d448e1eea5769c74065d4709a59e3b562')
 ) expected(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=to_regprocedure(item.signature)) IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_CHANGED_DEFINITION: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $postcommit_pinned_read_context$;
SELECT jsonb_build_object('result','PROD_HTTP_COMMITTED_READBACK_OBSERVED',
 'observed_at',statement_timestamp(),'postmaster_started_at',pg_postmaster_start_time(),
 'read_only',current_setting('transaction_read_only')='on',
 'successor_canonical_sha256',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'transport_metadata_sha256',v.transport_metadata_digest,
 'publisher_definition_sha256',v.publisher_function_digest,
 'required_generation',v.required_generation,'proof_not_before',v.proof_not_before,
 'own_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1),
 'own_sequence_logged',(SELECT relpersistence='p' FROM pg_class WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass),
 'helper_definition_sha256',encode(sha256(convert_to(pg_get_functiondef('jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'public_guard_status',public.official_v3_guard_alarm_status_v1(),
 'fresh_complete_state_run_count',(SELECT count(*) FROM official_v3_guard_private.state_v1 s
  JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation AND r.due_at=s.last_due
   AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
  WHERE s.singleton AND r.outcome='complete' AND s.generation>=v.required_generation
   AND r.proof_started_at>=v.proof_not_before AND s.incident_generation=s.resumed_generation
   AND s.last_finished<=s.last_started+interval '30 seconds'
   AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
   AND statement_timestamp()>=s.last_finished AND statement_timestamp()<s.valid_until),
 'natural_http_operational_proof_performed_by_this_query',false,
 'positive_source_renewal_proven',false,'fence_or_followup_permission',false) AS result
FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
ROLLBACK;
