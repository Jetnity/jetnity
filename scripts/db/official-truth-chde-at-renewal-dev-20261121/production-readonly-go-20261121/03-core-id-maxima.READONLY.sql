-- DRAFT FOR OWNER REVIEW; NOT EXECUTED. Only after explicit Production READ Go.
-- Fixed connector target: qscbgcdmivbbnzrcyegn. SQL cannot authenticate a Supabase project ref.
-- 03: five fixed Production/core ID maxima and existing sequence state; no nextval, no lock; <=4 KiB. No app routine, HTTP, Owner, audit, publication, lock, sequence advance or DDL.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='12s';
SET LOCAL transaction_timeout='12s';
-- Execute only after 01 READY and 02 has no context/output/cap ambiguity.
-- These are observation maxima, not a globally locked repair boundary.
WITH context AS (SELECT (current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
 AND current_setting('server_version_num')::integer/10000=17
 AND current_setting('transaction_read_only')='on'
 AND current_setting('transaction_isolation')='repeatable read'
 AND current_setting('session_replication_role') IN('origin','local')
 AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls)
 AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL) AS context_ok), payload AS (
 SELECT CASE WHEN NOT context_ok THEN jsonb_build_object('result','STOP_CONTEXT') ELSE (
 WITH maxima AS (
 SELECT 'official_v3_at_production_private.watch_requests_v1.request_id' AS id_path,pg_catalog.max(request_id::bigint) AS observed_max FROM official_v3_at_production_private.watch_requests_v1
 UNION ALL
 SELECT 'jetnity_prod_import_scheduler.dispatches_v1.net_request_id' AS id_path,pg_catalog.max(net_request_id::bigint) AS observed_max FROM jetnity_prod_import_scheduler.dispatches_v1
 UNION ALL
 SELECT 'supabase_functions.hooks.request_id' AS id_path,pg_catalog.max(request_id::bigint) AS observed_max FROM supabase_functions.hooks
 UNION ALL
 SELECT 'net.http_request_queue.id' AS id_path,pg_catalog.max(id::bigint) AS observed_max FROM net.http_request_queue
 UNION ALL
 SELECT 'net._http_response.id' AS id_path,pg_catalog.max(id::bigint) AS observed_max FROM net._http_response
 ), seq AS (SELECT last_value::text AS last_value,is_called FROM net.http_request_queue_id_seq)
 SELECT jsonb_build_object('result','PROD_CORE_ID_OBSERVATION_ONLY','observed_at',statement_timestamp(),
  'declared_target','qscbgcdmivbbnzrcyegn','project_ref_authenticated_by_sql',false,
  'path_maxima',(SELECT jsonb_agg(jsonb_build_object('path',id_path,'max_id',observed_max::text) ORDER BY id_path) FROM maxima),
  'five_path_observed_max',(SELECT max(observed_max)::text FROM maxima),
  'legacy_sequence',(SELECT to_jsonb(s) FROM seq s),
  'complete_global_inventory_maximum',false,'globally_locked_snapshot',false,
  'sequence_is_mvcc_snapshot',false,'safe_next_id_computed',false,'repair_permission',false)
 ) END AS document FROM context
)
SELECT CASE WHEN octet_length(document::text)<=4096 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_4096_BYTES') END AS result FROM payload;
ROLLBACK;
