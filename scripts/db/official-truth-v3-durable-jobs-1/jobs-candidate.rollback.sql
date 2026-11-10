-- M04 empty companion-only rollback. Never purge history or protected objects.
BEGIN;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL statement_timeout='30000';
SET LOCAL lock_timeout='5000';
LOCK TABLE official_v3_jobs_private.slots_v1,official_v3_jobs_private.subjects_v1,
 official_v3_jobs_private.queue_operations_v1,official_v3_jobs_private.execution_starts_v1,
 official_v3_jobs_private.execution_results_v1,official_v3_jobs_private.execution_dispositions_v1,
 official_v3_jobs_private.catalog_binding_v1 IN ACCESS EXCLUSIVE MODE;
SELECT official_v3_jobs_private.assert_catalog_v1();
DO $empty_companion$
BEGIN
 IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1)
  OR EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1)
  OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1)
  OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1)
  OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1)
  OR EXISTS(SELECT 1 FROM official_v3_jobs_private.slots_v1 WHERE job_key IS NOT NULL)
  OR (SELECT count(*) FROM official_v3_jobs_private.slots_v1)<>1024 THEN
  RAISE EXCEPTION 'm04 nonempty history rollback refused' USING ERRCODE='P7606'; END IF;
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='ot_v3_jobs_caller'::regrole OR member='ot_v3_jobs_caller'::regrole) THEN
  RAISE EXCEPTION 'm04 caller membership rollback refused' USING ERRCODE='P7607'; END IF;
END $empty_companion$;
DROP FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_prepare_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_start_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_execution_read_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_confirm_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.tx_queue_read_v1(jsonb,jsonb,integer,integer,timestamptz) RESTRICT;
DROP FUNCTION official_v3_jobs_private.assert_catalog_v1() RESTRICT;
DROP FUNCTION official_v3_jobs_private.assert_history_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.consume_s1_v1(jsonb,jsonb,jsonb,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.transition_v1(jsonb,jsonb,jsonb) RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TRIGGER guard_row_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TRIGGER guard_truncate_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.slots_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.subjects_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP POLICY owner_v1 ON official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.catalog_binding_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_dispositions_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_results_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.execution_starts_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.queue_operations_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.subjects_v1 RESTRICT;
DROP TABLE official_v3_jobs_private.slots_v1 RESTRICT;
DROP FUNCTION official_v3_jobs_private.immutable_v1() RESTRICT;
DROP FUNCTION official_v3_jobs_private.ma1_require_v1(text,integer,text,text,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.s1_shape_v1(jsonb,text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.s1_read_v1(jsonb,text,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.reference_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.command_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.job_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.subject_v1(text,jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.context_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.expression_v1(jsonb,boolean,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.predicate_v1(jsonb) RESTRICT;
DROP FUNCTION official_v3_jobs_private.timestamp_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.civil_date_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.wire_v1(text) RESTRICT;
DROP FUNCTION official_v3_jobs_private.canonical_v1(jsonb,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.nodes_v1(jsonb,integer,integer,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.unique_json_v1(json,integer) RESTRICT;
DROP FUNCTION official_v3_jobs_private.exact_keys_v1(jsonb,text[]) RESTRICT;
DROP SCHEMA official_v3_jobs_api RESTRICT;
DROP SCHEMA official_v3_jobs_private RESTRICT;
DROP ROLE ot_v3_jobs_caller;
COMMIT;
