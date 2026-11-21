-- DRAFT FOR OWNER REVIEW; NOT EXECUTED. Only after explicit Production READ Go.
-- Fixed connector target: qscbgcdmivbbnzrcyegn. SQL cannot authenticate a Supabase project ref.
-- 04/05: single fixed optional ID maximum for jetnity_followup_source_monitor_private.items_v1.request_id; <=1 KiB. No app routine, HTTP, Owner, audit, publication, lock, sequence advance or DDL.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='3s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='12s';
SET LOCAL transaction_timeout='5s';
-- Execute this complete unchanged file only when 01 confirms this exact ID path,
-- ordinary non-inherited table, bigint column and expected persistence.
-- If absent, mark ABSENT (not zero); if unknown/new, STOP, do not generate SQL.
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
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL) AND EXISTS(
 SELECT 1 FROM pg_namespace n JOIN pg_class c ON c.relnamespace=n.oid
 JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE n.nspname='jetnity_followup_source_monitor_private' AND c.relname='items_v1' AND a.attname='request_id'
 AND c.relkind='r' AND NOT c.relispartition
 AND NOT EXISTS(SELECT 1 FROM pg_inherits h WHERE h.inhrelid=c.oid OR h.inhparent=c.oid)
 AND c.relpersistence='p'
 AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='pg_catalog.int8'::regtype
 AND has_table_privilege(current_user,c.oid,'SELECT')) AS context_ok)
SELECT CASE WHEN context_ok THEN (
 SELECT jsonb_build_object('result','PROD_FIXED_OPTIONAL_ID_OBSERVATION_ONLY',
  'observed_at',statement_timestamp(),'declared_target','qscbgcdmivbbnzrcyegn',
  'path','jetnity_followup_source_monitor_private.items_v1.request_id',
  'observed_max_id',pg_catalog.max(request_id::bigint)::text,
  'globally_locked_snapshot',false,'repair_permission',false)
 FROM jetnity_followup_source_monitor_private.items_v1
 ) ELSE jsonb_build_object('result','STOP_CONTEXT_OR_FIXED_SHAPE') END AS result FROM context;
ROLLBACK;
