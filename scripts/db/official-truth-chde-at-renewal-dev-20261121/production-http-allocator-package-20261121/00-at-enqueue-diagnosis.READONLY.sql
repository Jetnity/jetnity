-- PREPARED ONLY. NOT EXECUTED. A separate exact Production READ Go is required.
-- Fixed connector target: qscbgcdmivbbnzrcyegn. SQL cannot authenticate the project ref.
-- Scope: only retained cron runs 23758, 23767, 23776 and their one current job.
-- Basis: V2 execution.json, observation 2026-11-21 17:43:04.695814+00.
-- One transaction / one result row / <=8192 output bytes / no retry or fallback.
-- 8s statement, 500ms lock, 12s transaction/idle bounds; <=3 error messages,
-- <=8192 UTF-8 bytes each. Overlong, missing, changed or unclassified input => STOP.
-- No raw error, DETAIL, CONTEXT, command, function body, URL or data value is returned.
-- No app/guard/HTTP/source/Owner routine, nextval/setval, DDL, DML or explicit lock.
-- Missing static relation/column or incompatible type may fail at parse/planning time:
-- every SQL/service/timeout error is STOP; preserve only a validated SQLSTATE outside SQL.
-- Never treat an error, NULL gate or absent retained run as an empty successful result.
-- A fixed signature reports a logged failure category, not a proved root-cause chain,
-- actual stored duplicate rows, sequence causation, repair permission or current health.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='12s';
SET LOCAL transaction_timeout='12s';
SET LOCAL row_security=off;

WITH
expected_runs(runid,expected_start,expected_end) AS (VALUES
 (23758::bigint,'2026-11-21 17:30:00.061561+00'::timestamptz,'2026-11-21 17:30:00.110757+00'::timestamptz),
 (23767::bigint,'2026-11-21 17:35:00.243776+00'::timestamptz,'2026-11-21 17:35:00.315101+00'::timestamptz),
 (23776::bigint,'2026-11-21 17:40:00.227902+00'::timestamptz,'2026-11-21 17:40:00.308490+00'::timestamptz)
), expected_columns(table_name,column_name,type_oid) AS (VALUES
 ('job','jobid','pg_catalog.int8'::pg_catalog.regtype::oid),
 ('job','jobname','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job','schedule','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job','active','pg_catalog.bool'::pg_catalog.regtype::oid),
 ('job','database','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job','username','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job','command','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job_run_details','jobid','pg_catalog.int8'::pg_catalog.regtype::oid),
 ('job_run_details','runid','pg_catalog.int8'::pg_catalog.regtype::oid),
 ('job_run_details','start_time','pg_catalog.timestamptz'::pg_catalog.regtype::oid),
 ('job_run_details','end_time','pg_catalog.timestamptz'::pg_catalog.regtype::oid),
 ('job_run_details','status','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job_run_details','database','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job_run_details','username','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job_run_details','command','pg_catalog.text'::pg_catalog.regtype::oid),
 ('job_run_details','return_message','pg_catalog.text'::pg_catalog.regtype::oid)
), context AS MATERIALIZED (
 SELECT coalesce(current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
  AND current_setting('server_version_num')::integer/10000=17
  AND current_setting('server_encoding')='UTF8'
  AND current_setting('transaction_read_only')='on'
  AND current_setting('transaction_isolation')='repeatable read'
  AND current_setting('session_replication_role') IN ('origin','local')
  AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls)
  AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
  AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
  AND to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL
  AND to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
  AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL,false) AS context_ok
), column_contract AS MATERIALIZED (
 SELECT e.table_name,e.column_name,coalesce(c.relkind='r' AND c.relpersistence='p'
  AND NOT c.relispartition AND owner_role.rolname='supabase_admin'
  AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid=e.type_oid AND a.attgenerated=''
  AND has_schema_privilege(current_user,n.oid,'USAGE')
  AND has_table_privilege(current_user,c.oid,'SELECT'),false) AS exact_readable_column
 FROM expected_columns e
 LEFT JOIN pg_namespace n ON n.nspname='cron'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
 LEFT JOIN pg_roles owner_role ON owner_role.oid=c.relowner
 LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname=e.column_name
), function_pin AS MATERIALIZED (
 SELECT count(*)=1 AND coalesce(bool_and(p.prokind='f' AND p.pronargs=0
  AND p.prorettype='pg_catalog.int4'::pg_catalog.regtype AND p.provolatile='v'
  AND NOT p.prosecdef AND owner_role.rolname='postgres' AND l.lanname='plpgsql'
  AND CASE WHEN octet_length(p.prosrc)<=8192 THEN
   encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=
   '3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90'
   ELSE false END),false) AS exact_v2_enqueue_definition
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 JOIN pg_roles owner_role ON owner_role.oid=p.proowner
 JOIN pg_language l ON l.oid=p.prolang
 WHERE n.nspname='official_v3_at_production_private' AND p.proname='enqueue_v1' AND p.pronargs=0
), preflight AS MATERIALIZED (
 SELECT context_ok,
  (SELECT count(*)=16 AND coalesce(bool_and(exact_readable_column),false) FROM column_contract) AS columns_ok,
  exact_v2_enqueue_definition AS function_pin_ok
 FROM context CROSS JOIN function_pin
), jobs_sample AS MATERIALIZED (
 SELECT j.jobid,
  coalesce(j.active AND j.schedule='*/5 * * * *' AND j.database='postgres' AND j.username='postgres'
   AND j.command='SELECT official_v3_at_production_private.enqueue_v1()'
   AND encode(sha256(convert_to(j.command,'UTF8')),'hex')=
    'd7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890',false) AS exact_job
 FROM ONLY cron.job j CROSS JOIN preflight p
 WHERE p.context_ok AND p.columns_ok AND p.function_pin_ok
  AND j.jobname='jetnity-at-production-source-enqueue-v1'
 ORDER BY j.jobid LIMIT 2
), job_gate AS MATERIALIZED (
 SELECT count(*)=1 AND coalesce(bool_and(exact_job),false) AS exact_one_job FROM jobs_sample
), retained_runs AS MATERIALIZED (
 -- The V2 output intentionally omitted numeric jobid. Resolve exactly one job now,
 -- then bind all historical rows to that same jobid; never infer it from a name alone.
 SELECT e.runid AS expected_runid,e.expected_start,e.expected_end,r.runid,r.jobid,
  coalesce(r.start_time=e.expected_start AND r.end_time=e.expected_end
   AND r.start_time>='2026-11-21 17:30:00+00'::timestamptz
   AND r.end_time<'2026-11-21 17:41:00+00'::timestamptz
   AND r.status='failed' AND r.database='postgres' AND r.username='postgres'
   AND r.command='SELECT official_v3_at_production_private.enqueue_v1()'
   AND encode(sha256(convert_to(r.command,'UTF8')),'hex')=
    'd7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890'
   AND r.jobid=j.jobid,false) AS exact_v2_binding
 FROM expected_runs e CROSS JOIN jobs_sample j CROSS JOIN job_gate g
 CROSS JOIN LATERAL (
  SELECT d.runid,d.jobid,d.start_time,d.end_time,d.status,d.database,d.username,d.command
  FROM ONLY cron.job_run_details d WHERE d.runid=e.runid
  ORDER BY d.start_time,d.end_time LIMIT 2
 ) r WHERE g.exact_one_job
), binding_gate AS MATERIALIZED (
 SELECT count(*)=3 AND count(DISTINCT expected_runid)=3 AND count(DISTINCT jobid)=1
  AND coalesce(bool_and(exact_v2_binding),false) AS all_three_exact
 FROM retained_runs
), messages AS MATERIALIZED (
 -- Read return_message only for already-bound exact historical rows in this same snapshot.
 -- Native pg_cron stores text, not a structured SQLSTATE field. Do not invent one.
 SELECT r.runid,r.expected_start,r.expected_end,octet_length(d.return_message) AS message_bytes,
  CASE WHEN octet_length(d.return_message) BETWEEN 1 AND 8192 THEN d.return_message END AS bounded_message
 FROM retained_runs r CROSS JOIN binding_gate b
 JOIN ONLY cron.job_run_details d ON d.runid=r.runid AND d.jobid=r.jobid
 WHERE b.all_three_exact ORDER BY r.runid LIMIT 4
), normalized AS MATERIALIZED (
 SELECT runid,expected_start,expected_end,message_bytes,
  CASE WHEN bounded_message IS NOT NULL THEN
   encode(sha256(convert_to(bounded_message,'UTF8')),'hex') END AS message_sha256,
  regexp_replace(split_part(replace(bounded_message,E'\r\n',E'\n'),E'\n',1),
   '^(ERROR|FATAL):[[:space:]]*','') AS primary_error,
  coalesce(position('PL/pgSQL function official_v3_at_production_private.enqueue_v1()' IN bounded_message)>0,false)
   AS qualified_enqueue_context_reported
 FROM messages
), classified AS MATERIALIZED (
 SELECT runid,expected_start,expected_end,message_bytes,message_sha256,qualified_enqueue_context_reported,
  CASE
   WHEN primary_error='duplicate key value violates unique constraint "watch_requests_v1_request_id_key"'
    THEN 'UNIQUE_VIOLATION_AT_REQUEST_ID'
   WHEN primary_error='duplicate key value violates unique constraint "watch_requests_v1_pkey"'
    THEN 'UNIQUE_VIOLATION_AT_BATCH_SOURCE'
   WHEN primary_error='duplicate key value violates unique constraint "watch_batches_v1_pkey"'
    THEN 'UNIQUE_VIOLATION_AT_BATCH_ID'
   WHEN primary_error~'^duplicate key value violates unique constraint "[^"\r\n]+"$'
    THEN 'UNIQUE_VIOLATION_OTHER_UNDISCLOSED_CONSTRAINT'
   WHEN primary_error~'^permission denied for (schema|table|sequence|function) .+$'
    THEN 'INSUFFICIENT_PRIVILEGE_UNDISCLOSED_OBJECT'
   WHEN primary_error='canceling statement due to statement timeout' THEN 'STATEMENT_TIMEOUT'
   WHEN primary_error='canceling statement due to lock timeout' THEN 'LOCK_TIMEOUT'
   WHEN primary_error='deadlock detected' THEN 'DEADLOCK_DETECTED'
   WHEN primary_error='current transaction is aborted, commands ignored until end of transaction block'
    THEN 'IN_FAILED_SQL_TRANSACTION'
   WHEN primary_error='AT_PRODUCTION_INCOMPLETE_SOURCE_REQUEST' THEN 'AT_INCOMPLETE_SOURCE_REQUEST'
   WHEN primary_error='bg1 integrity unavailable' THEN 'BG1_INTEGRITY_UNAVAILABLE'
   WHEN primary_error='bg1 recovery fresh full proof required' THEN 'BG1_FRESH_FULL_PROOF_REQUIRED'
   WHEN primary_error='bg1 recovery protected catalog changed' THEN 'BG1_PROTECTED_CATALOG_CHANGED'
   WHEN primary_error='production rolling protected catalog changed' THEN 'BG1_PRODUCTION_PROTECTED_CATALOG_CHANGED'
   ELSE 'UNKNOWN_OR_REDACTED'
  END AS fixed_signature
 FROM normalized
), safe_findings AS MATERIALIZED (
 SELECT runid::text AS runid,expected_start,expected_end,message_bytes,message_sha256,
  fixed_signature,qualified_enqueue_context_reported,
  -- These are standard/reference code mappings for the fixed signature, NOT codes
  -- supplied by cron.job_run_details. The original SQLSTATE remains unobserved.
  CASE
   WHEN fixed_signature LIKE 'UNIQUE_VIOLATION_%' THEN '23505'
   WHEN fixed_signature='INSUFFICIENT_PRIVILEGE_UNDISCLOSED_OBJECT' THEN '42501'
   WHEN fixed_signature='STATEMENT_TIMEOUT' THEN '57014'
   WHEN fixed_signature='LOCK_TIMEOUT' THEN '55P03'
   WHEN fixed_signature='DEADLOCK_DETECTED' THEN '40P01'
   WHEN fixed_signature='IN_FAILED_SQL_TRANSACTION' THEN '25P02'
   WHEN fixed_signature='AT_INCOMPLETE_SOURCE_REQUEST' THEN 'P7979'
   WHEN fixed_signature='BG1_PRODUCTION_PROTECTED_CATALOG_CHANGED' THEN 'P7905'
   ELSE NULL
  END AS sqlstate_reference_from_signature_not_observed,
  fixed_signature='UNIQUE_VIOLATION_AT_REQUEST_ID' AS at_request_id_unique_violation_reported,
  false AS raw_error_returned,false AS observed_sqlstate_available
 FROM classified
), outcome AS MATERIALIZED (
 SELECT CASE
  WHEN NOT p.context_ok THEN 'STOP_CONTEXT'
  WHEN NOT p.columns_ok THEN 'STOP_REQUIRED_CATALOG_SHAPE_OR_READ_PRIVILEGE'
  WHEN NOT p.function_pin_ok THEN 'STOP_V2_ENQUEUE_DEFINITION_CHANGED_OR_MISSING'
  WHEN (SELECT count(*) FROM jobs_sample)<>1 THEN 'STOP_EXPECTED_JOB_MISSING_OR_NOT_UNIQUE'
  WHEN NOT g.exact_one_job THEN 'STOP_JOB_BINDING_CHANGED'
  WHEN (SELECT count(DISTINCT expected_runid) FROM retained_runs)<>3 THEN 'STOP_RETAINED_RUN_MISSING'
  WHEN NOT b.all_three_exact THEN 'STOP_HISTORICAL_RUN_BINDING_CHANGED_OR_NOT_UNIQUE'
  WHEN (SELECT count(*) FROM messages)<>3 THEN 'STOP_ERROR_MESSAGE_ROW_COUNT'
  WHEN EXISTS(SELECT 1 FROM messages WHERE message_bytes IS NULL OR message_bytes NOT BETWEEN 1 AND 8192)
   THEN 'STOP_ERROR_MESSAGE_MISSING_OR_OVER_CAP'
  WHEN EXISTS(SELECT 1 FROM classified WHERE fixed_signature='UNKNOWN_OR_REDACTED')
   THEN 'STOP_UNCLASSIFIED_ERROR_SIGNATURE'
  ELSE 'PROD_THREE_HISTORICAL_CRON_FAILURE_SIGNATURES_OBSERVED'
 END AS result,p.context_ok,p.columns_ok,p.function_pin_ok,g.exact_one_job,b.all_three_exact
 FROM preflight p CROSS JOIN job_gate g CROSS JOIN binding_gate b
), payload AS (
 SELECT jsonb_build_object(
  'result',o.result,'package','PROD_AT_ENQUEUE_DIAGNOSIS_20261121',
  'declared_target','qscbgcdmivbbnzrcyegn','project_ref_authenticated_by_sql',false,
  'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
  'basis','official-truth-production-readonly-v2-20261121/execution.json',
  'basis_observed_at','2026-11-21T17:43:04.695814+00:00',
  'expected_runids',jsonb_build_array('23758','23767','23776'),
  'required_column_count',16,'required_context_exact',o.context_ok,
  'required_columns_exact',o.columns_ok,'v2_enqueue_definition_exact',o.function_pin_ok,
  'expected_current_job_exact_and_unique',o.exact_one_job,
  'retained_run_rows_at_most_6',(SELECT count(*) FROM retained_runs),
  'retained_exact_run_binding',o.all_three_exact,
  'missing_expected_runids',(SELECT coalesce(jsonb_agg(e.runid::text ORDER BY e.runid),'[]'::jsonb)
   FROM expected_runs e WHERE NOT EXISTS(SELECT 1 FROM retained_runs r WHERE r.expected_runid=e.runid)),
  'safe_error_findings_at_most_3',CASE WHEN o.all_three_exact AND (SELECT count(*) FROM messages)=3
   THEN (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY runid),'[]'::jsonb) FROM safe_findings s)
   ELSE '[]'::jsonb END,
  'error_message_byte_cap_each',8192,'result_byte_cap',8192,
  'raw_error_or_context_returned',false,'original_sqlstate_observed',false,
  'historical_function_definition_proven',false,'current_bg1_or_public_status_checked',false,
  'actual_stored_duplicate_rows_proven',false,'sequence_causation_proven',false,
  'product_routine_invoked',false,'http_or_source_action',false,
  'source_qualification_changed',false,'positive_at_qualification_proven',false,
  'owner_or_role_action',false,'production_mutation',false,
  'repair_permission',false,'followup_query_permission',false) AS document
 FROM outcome o
)
SELECT CASE WHEN octet_length(document::text)<=8192 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_8192_BYTES','repair_permission',false,
 'followup_query_permission',false) END AS result FROM payload;
ROLLBACK;
