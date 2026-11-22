-- PREPARED ONLY. Separate explicit Go required; execute once on qscbgcdmivbbnzrcyegn.
-- PROD_CHDE_CYCLE12_BINDINGS_20261122; one transaction; no retry or extra read.
-- IDs below are operational correlation identifiers, never credentials.
-- No source body, token/hash credential, signing key, auth session or Owner row is returned.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='30s';
SET LOCAL row_security=off;

DO $cycle12_preflight$
DECLARE x record; n bigint;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('session_replication_role') NOT IN ('origin','local')
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 THEN RAISE EXCEPTION 'CYCLE12_STOP_WRONG_PROJECT_CONTEXT'; END IF;

 -- Inspect local table kinds and required column types BEFORE the first data read.
 FOR x IN SELECT * FROM (VALUES
  ('jetnity_prod_import_scheduler.state_v1','{"singleton":"boolean","enabled":"boolean","status":"text","remaining_starts":"integer","remaining_operations":"integer"}'::jsonb),
  ('jetnity_prod_import_scheduler.cycles_v1','{"id":"bigint","created_at":"timestamp with time zone","operation_id":"text","lease_id":"text","phase":"text","state":"text","phase_attempts":"integer","last_status":"text","finished_at":"timestamp with time zone","published":"integer"}'::jsonb),
  ('jetnity_prod_import_scheduler.dispatches_v1','{"id":"bigint","cycle_id":"bigint","phase":"text","signed_at_ms":"text","dispatched_at":"timestamp with time zone","net_request_id":"bigint","processed_at":"timestamp with time zone","http_status":"integer","outcome":"text"}'::jsonb),
  ('official_v3_jobs_private.subjects_v1','{"job_key":"text","slot_id":"integer","kind":"text","subject_text":"text","method_binding":"jsonb","current_job":"jsonb","operation_count":"integer","start_count":"integer","open_attempt":"text","terminal_credit_claim":"text"}'::jsonb),
  ('official_v3_jobs_private.queue_operations_v1','{"operation_id":"text","job_key":"text","action":"text","command_key":"text","command_text":"text","envelope_text":"text","audit_reference":"text","new_cycle_job_id":"text","authority":"jsonb","recorded_at":"timestamp with time zone"}'::jsonb),
  ('official_v3_jobs_private.execution_starts_v1','{"attempt_key":"text","job_key":"text","claim_operation_id":"text","claim_text":"text","leased_job":"jsonb","authority":"jsonb","reserved_at":"timestamp with time zone"}'::jsonb),
  ('official_v3_jobs_private.execution_results_v1','{"attempt_key":"text"}'::jsonb),
  ('official_v3_jobs_private.execution_dispositions_v1','{"attempt_key":"text"}'::jsonb),
  ('official_v3_intake_private.operations_v1','{"operation_id":"text","binding":"jsonb","created_at":"timestamp with time zone","expires_at":"timestamp with time zone","proposal_digest":"text","original_bytes":"bytea"}'::jsonb),
  ('official_v3_method_private.heads_v1','{"method_id":"text","status":"text"}'::jsonb),
  ('official_v3_result_private.heads_v1','{"singleton":"boolean","version_ref":"text","projection_ref":"text"}'::jsonb),
  ('official_v3_result_private.projections_v1','{"reference":"text","verification_ref":"text","record":"jsonb","published_at":"timestamp with time zone"}'::jsonb),
  ('official_v3_result_private.qualifications_v1','{"kind":"text","reference":"text","original_ids":"jsonb"}'::jsonb),
  ('official_v3_result_private.originals_v1','{"version_id":"text","raw_digest":"text","body_text":"text"}'::jsonb),
  ('official_v3_guard_private.owner_operations_v1','{"operation_id":"text","action":"text","expected_digest":"text","recorded_at":"timestamp with time zone","receipt":"jsonb"}'::jsonb),
  ('official_v3_guard_private.state_v1','{"singleton":"boolean","generation":"bigint","last_due":"timestamp with time zone","last_started":"timestamp with time zone","last_proof_started":"timestamp with time zone","last_finished":"timestamp with time zone","valid_until":"timestamp with time zone","incident_generation":"bigint","resumed_generation":"bigint"}'::jsonb),
  ('official_v3_guard_private.bg1_production_http_allocator_v4','{"singleton":"boolean","proof_not_before":"timestamp with time zone","required_generation":"bigint","catalog":"jsonb"}'::jsonb),
  ('official_v3_guard_private.runs_v1','{"generation":"bigint","due_at":"timestamp with time zone","started_at":"timestamp with time zone","proof_started_at":"timestamp with time zone","finished_at":"timestamp with time zone","outcome":"text"}'::jsonb),
  ('cron.job','{"jobid":"bigint","jobname":"text","active":"boolean","schedule":"text","database":"text","username":"text"}'::jsonb),
  ('cron.job_run_details','{"jobid":"bigint","runid":"bigint","status":"text","start_time":"timestamp with time zone","end_time":"timestamp with time zone"}'::jsonb)
 ) expected(relation_name,column_types) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_class c WHERE c.oid=to_regclass(x.relation_name)
    AND c.relkind='r' AND NOT c.relispartition
    AND NOT EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhparent=c.oid OR i.inhrelid=c.oid))
   OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass(x.relation_name)
    AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid NOT IN
     ('boolean'::regtype,'smallint'::regtype,'integer'::regtype,'bigint'::regtype,
      'text'::regtype,'timestamp with time zone'::regtype,'jsonb'::regtype,'uuid'::regtype,'bytea'::regtype))
   OR EXISTS(SELECT 1 FROM jsonb_each_text(x.column_types) e(column_name,type_name)
    LEFT JOIN pg_attribute a ON a.attrelid=to_regclass(x.relation_name) AND a.attname=e.column_name
     AND a.attnum>0 AND NOT a.attisdropped
    WHERE a.attrelid IS NULL OR format_type(a.atttypid,a.atttypmod) IS DISTINCT FROM e.type_name)
  THEN RAISE EXCEPTION 'CYCLE12_STOP_REQUIRED_LOCAL_TABLE_OR_COLUMN_SHAPE: %',x.relation_name; END IF;
 END LOOP;

 FOR x IN SELECT * FROM (VALUES
  ('jetnity_prod_import_scheduler.state_v1',1),
  ('jetnity_prod_import_scheduler.cycles_v1',1000),
  ('jetnity_prod_import_scheduler.dispatches_v1',10000),
  ('official_v3_jobs_private.subjects_v1',1000),
  ('official_v3_jobs_private.queue_operations_v1',10000),
  ('official_v3_jobs_private.execution_starts_v1',10000),
  ('official_v3_jobs_private.execution_results_v1',10000),
  ('official_v3_jobs_private.execution_dispositions_v1',10000),
  ('official_v3_intake_private.operations_v1',10000),
  ('official_v3_method_private.heads_v1',1000),
  ('official_v3_result_private.heads_v1',1),
  ('official_v3_result_private.projections_v1',10000),
  ('official_v3_result_private.qualifications_v1',10000),
  ('official_v3_result_private.originals_v1',10000),
  ('official_v3_guard_private.owner_operations_v1',1000),
  ('official_v3_guard_private.state_v1',1),
  ('official_v3_guard_private.bg1_production_http_allocator_v4',1)
 ) expected(relation_name,row_cap) LOOP
  IF to_regclass(x.relation_name) IS NULL
   OR NOT has_table_privilege(current_user,to_regclass(x.relation_name),'SELECT')
  THEN RAISE EXCEPTION 'CYCLE12_STOP_REQUIRED_RELATION_OR_READ_AUTHORITY: %',x.relation_name; END IF;
  EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM %s LIMIT %s) b',to_regclass(x.relation_name),x.row_cap+1) INTO n;
  IF n>x.row_cap THEN RAISE EXCEPTION 'CYCLE12_STOP_RELATION_ROW_CAP: %',x.relation_name; END IF;
 END LOOP;
 IF to_regclass('official_v3_guard_private.runs_v1') IS NULL
 OR to_regclass('cron.job') IS NULL OR to_regclass('cron.job_run_details') IS NULL
 OR NOT has_table_privilege(current_user,'official_v3_guard_private.runs_v1','SELECT')
 OR NOT has_table_privilege(current_user,'cron.job','SELECT')
 OR NOT has_table_privilege(current_user,'cron.job_run_details','SELECT')
 THEN RAISE EXCEPTION 'CYCLE12_STOP_NATURAL_PROOF_METADATA_UNAVAILABLE'; END IF;

 -- The installed BG1 catalog covers jobs/intake but does not include the
 -- scheduler namespace. Pin its row shapes before hashing/returning cycle rows.
 FOR x IN SELECT * FROM (VALUES
  ('jetnity_prod_import_scheduler.cycles_v1','id:bigint,created_at:timestamp with time zone,operation_id:text,lease_id:text,phase:text,state:text,phase_attempts:integer,last_status:text,finished_at:timestamp with time zone,published:integer'),
  ('jetnity_prod_import_scheduler.dispatches_v1','id:bigint,cycle_id:bigint,phase:text,signed_at_ms:text,dispatched_at:timestamp with time zone,net_request_id:bigint,processed_at:timestamp with time zone,http_status:integer,outcome:text'),
  ('jetnity_prod_import_scheduler.state_v1','singleton:boolean,enabled:boolean,next_due_at:timestamp with time zone,observed_at:timestamp with time zone,status:text,remaining_starts:integer,remaining_operations:integer')
 ) expected(relation_name,columns_in_order) LOOP
  IF (SELECT string_agg(a.attname||':'||format_type(a.atttypid,a.atttypmod),',' ORDER BY a.attnum)
   FROM pg_attribute a WHERE a.attrelid=to_regclass(x.relation_name) AND a.attnum>0 AND NOT a.attisdropped)
  IS DISTINCT FROM x.columns_in_order
  THEN RAISE EXCEPTION 'CYCLE12_STOP_UNKNOWN_SCHEDULER_SHAPE: %',x.relation_name; END IF;
 END LOOP;

 -- Pin the only application function invoked by this file: the installed STABLE
 -- catalog reader. All other application functions below are catalog data only.
 IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
  WHERE p.oid=to_regprocedure('official_v3_guard_private.catalog_status_v1()')
   AND l.lanname='sql' AND pg_get_userbyid(p.proowner)='postgres'
   AND p.prosecdef AND p.provolatile='s' AND p.prokind='f'
   AND p.pronargs=0 AND p.pronargdefaults=0 AND p.provariadic=0 AND NOT p.proretset
   AND pg_get_function_result(p.oid)='jsonb'
   AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')='d80009f6db49c88fb446ee7ce140abafbfe35005e07db453b83b10c068964adf'
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex')='832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540'
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex')='0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1')
 THEN RAISE EXCEPTION 'CYCLE12_STOP_CATALOG_READER_CHANGED'; END IF;
 FOR x IN SELECT * FROM (VALUES
  ('official_v3_guard_private.assert_catalog_v1()','51527fcf925bb0314187d34c38796bb376230f44e4f36ae1801624a4b9141360'),
  ('jetnity_prod_import_scheduler.tick_v1()','57b101b3551b64e95bc68e6650d642ba34829fccb84bc081b7ad606879c176fe')
 ) expected(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
   FROM pg_proc p WHERE p.oid=to_regprocedure(x.signature)) IS DISTINCT FROM x.digest
  THEN RAISE EXCEPTION 'CYCLE12_STOP_INSTALLED_DEFINITION_CHANGED: %',x.signature; END IF;
 END LOOP;
 IF (SELECT encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton)
 IS DISTINCT FROM 'c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4'
 OR (SELECT catalog FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton)
 IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 THEN RAISE EXCEPTION 'CYCLE12_STOP_BASELINE_CHANGED_REBIND_AFTER_OTHER_PACKAGE'; END IF;

 SELECT count(*) INTO n
 FROM official_v3_guard_private.state_v1 s
 JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation AND r.due_at=s.last_due
  AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
 CROSS JOIN official_v3_guard_private.bg1_production_http_allocator_v4 b
 JOIN cron.job j ON j.jobid=2 AND j.jobname='jetnity-official-truth-production-guard-v1'
  AND j.active AND j.schedule='*/5 * * * *' AND j.database='postgres' AND j.username='postgres'
 JOIN cron.job_run_details d ON d.jobid=j.jobid AND d.status='succeeded'
  AND d.start_time<=r.started_at AND r.finished_at<=d.end_time
  AND r.due_at=date_bin(interval '5 minutes',d.start_time,'2000-01-01 00:00:00+00'::timestamptz)
 WHERE s.singleton AND b.singleton AND r.outcome='complete'
  AND s.generation>=b.required_generation AND r.proof_started_at>=b.proof_not_before
  AND s.incident_generation=s.resumed_generation
  AND r.started_at<=r.proof_started_at AND r.proof_started_at<=r.finished_at
  AND s.last_finished<=s.last_started+interval '30 seconds'
  AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
  AND statement_timestamp()>=s.last_finished AND statement_timestamp()<s.valid_until;
 IF n<>1 THEN RAISE EXCEPTION 'CYCLE12_STOP_BG1_WITHOUT_ONE_CURRENT_NATURAL_FULL_PROOF'; END IF;

 IF (SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE id=12)<>1
 OR NOT EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.cycles_v1
  WHERE id=12 AND created_at='2026-11-16T07:43:00.031917+00:00'::timestamptz
   AND state='blocked' AND phase='resume' AND phase_attempts=8
   AND last_status='retry_budget_exhausted' AND published=0
   AND finished_at='2026-11-16T07:53:00.019315+00:00'::timestamptz
   AND operation_id~'^op3_[a-f0-9]{32}$' AND lease_id~'^lease3_[a-f0-9]{32}$')
 OR (SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked')<>1
 OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='active')
 OR NOT EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.state_v1
  WHERE singleton AND enabled AND status='operator_review_required')
 THEN RAISE EXCEPTION 'CYCLE12_STOP_TERMINAL_TARGET_CHANGED'; END IF;
 IF (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 WHERE cycle_id=12)<>9
 OR EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.dispatches_v1 WHERE cycle_id=12 AND
  (id NOT BETWEEN 38 AND 46 OR net_request_id IS DISTINCT FROM id OR processed_at IS NULL
   OR phase IS DISTINCT FROM CASE WHEN id=38 THEN 'start' ELSE 'resume' END
   OR http_status IS DISTINCT FROM CASE WHEN id=38 THEN 200 ELSE 503 END
   OR outcome IS DISTINCT FROM CASE WHEN id=38 THEN 'queued' WHEN id=40 THEN 'unavailable' ELSE 'unresolved' END))
 THEN RAISE EXCEPTION 'CYCLE12_STOP_DISPATCH_HISTORY_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM official_v3_result_private.projections_v1
  WHERE (record->>'expiresAt')::timestamptz>statement_timestamp())
 THEN RAISE EXCEPTION 'CYCLE12_STOP_PUBLIC_STATE_CHANGED'; END IF;

 -- Data fields are explicitly allowlisted. Unknown added columns are reported as
 -- metadata only; they cannot become authority or enter a future CAS automatically.
 SELECT count(*) INTO n FROM official_v3_jobs_private.subjects_v1 s
 WHERE s.kind='rule_research'
  AND s.current_job#>>'{method,methodId}'='jetnity-destination-primary-ch-de-visa'
  AND s.current_job#>>'{context,scope,destinationCountryCode}'='DE'
  AND s.current_job#>'{context,scope,citizenship,countryCodes}'='["CH"]'::jsonb;
 IF n<>1 THEN RAISE EXCEPTION 'CYCLE12_STOP_EXPECTED_SINGLE_CHDE_SUBJECT_MISSING_OR_AMBIGUOUS'; END IF;
 IF EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1 s
  WHERE s.kind='rule_research' AND s.current_job#>>'{method,methodId}'='jetnity-destination-primary-ch-de-visa'
   AND (octet_length(s.current_job::text)>32768 OR octet_length(s.method_binding::text)>8192
    OR octet_length(s.subject_text)>32768))
 THEN RAISE EXCEPTION 'CYCLE12_STOP_SUBJECT_SIZE_CAP'; END IF;
 IF (SELECT count(*) FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-ch-de-visa')<>1
 THEN RAISE EXCEPTION 'CYCLE12_STOP_REQUIRED_METHOD_HEAD'; END IF;
 IF (SELECT count(*) FROM official_v3_result_private.heads_v1 WHERE singleton)<>1
 OR EXISTS(SELECT 1 FROM official_v3_result_private.heads_v1 h
  JOIN official_v3_result_private.projections_v1 p ON p.reference=h.projection_ref
  JOIN official_v3_result_private.qualifications_v1 q ON q.reference=p.verification_ref
  WHERE h.singleton AND (q.kind<>'verification' OR jsonb_typeof(q.original_ids)<>'array'
   OR jsonb_array_length(q.original_ids)>8
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(q.original_ids) v WHERE jsonb_typeof(v)<>'string')))
 THEN RAISE EXCEPTION 'CYCLE12_STOP_ARCHIVE_REFERENCE_SHAPE'; END IF;
END $cycle12_preflight$;

WITH
cycle AS MATERIALIZED (SELECT * FROM jetnity_prod_import_scheduler.cycles_v1 WHERE id=12),
identity AS MATERIALIZED (
 SELECT c.operation_id,c.lease_id,
  'op3_'||left(encode(sha256(convert_to('jetnity.ch-de-refresh.enqueue.v1'||chr(10)||c.operation_id||chr(10)||c.lease_id,'UTF8')),'hex'),32) AS enqueue_operation_id,
  'job3_'||left(encode(sha256(convert_to('jetnity.ch-de-refresh.job.v1'||chr(10)||c.operation_id||chr(10)||c.lease_id,'UTF8')),'hex'),32) AS expected_job_id
 FROM cycle c
),
subject AS MATERIALIZED (
 SELECT s.* FROM official_v3_jobs_private.subjects_v1 s
 WHERE s.kind='rule_research'
  AND s.current_job#>>'{method,methodId}'='jetnity-destination-primary-ch-de-visa'
  AND s.current_job#>>'{context,scope,destinationCountryCode}'='DE'
  AND s.current_job#>'{context,scope,citizenship,countryCodes}'='["CH"]'::jsonb
),
claim_identities AS MATERIALIZED (
 SELECT g AS generation,
  CASE WHEN g=0 THEN i.operation_id ELSE 'op3_'||left(encode(sha256(convert_to('jetnity.ch-de-claim-continuation.operation.v1'||chr(10)||i.operation_id||chr(10)||i.lease_id||chr(10)||s.job_key||chr(10)||g::text,'UTF8')),'hex'),32) END AS claim_operation_id,
  CASE WHEN g=0 THEN i.lease_id ELSE 'lease3_'||left(encode(sha256(convert_to('jetnity.ch-de-claim-continuation.lease.v1'||chr(10)||i.operation_id||chr(10)||i.lease_id||chr(10)||s.job_key||chr(10)||g::text,'UTF8')),'hex'),32) END AS claim_lease_id
 FROM identity i CROSS JOIN subject s CROSS JOIN generate_series(0,4) g
),
starts AS MATERIALIZED (
 SELECT t.*,ci.generation,ci.claim_lease_id FROM official_v3_jobs_private.execution_starts_v1 t
 JOIN claim_identities ci ON ci.claim_operation_id=t.claim_operation_id
 JOIN subject s ON s.job_key=t.job_key
),
queue_rows AS MATERIALIZED (
 SELECT q.* FROM official_v3_jobs_private.queue_operations_v1 q JOIN subject s ON s.job_key=q.job_key
 WHERE q.operation_id IN(SELECT claim_operation_id FROM claim_identities)
  OR q.operation_id=(SELECT enqueue_operation_id FROM identity)
),
intake AS MATERIALIZED (
 SELECT o.* FROM official_v3_intake_private.operations_v1 o
 WHERE o.binding->>'jobId'=(SELECT expected_job_id FROM identity)
 ORDER BY o.created_at,o.operation_id LIMIT 9
),
result_head AS MATERIALIZED (SELECT * FROM official_v3_result_private.heads_v1 WHERE singleton),
qualification AS MATERIALIZED (
 SELECT q.* FROM result_head h
 JOIN official_v3_result_private.projections_v1 p ON p.reference=h.projection_ref
 JOIN official_v3_result_private.qualifications_v1 q ON q.reference=p.verification_ref AND q.kind='verification'
),
archive_rows AS MATERIALIZED (
 SELECT o.version_id,o.raw_digest,octet_length(convert_to(o.body_text,'UTF8')) AS bytes,
  encode(sha256(convert_to(o.body_text,'UTF8')),'hex') AS actual_body_sha256
 FROM qualification q CROSS JOIN LATERAL jsonb_array_elements_text(q.original_ids) ids(version_id)
 JOIN official_v3_result_private.originals_v1 o USING(version_id)
),
function_names(signature,required) AS (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()',true),
 ('jetnity_prod_import_scheduler.preserve_request_v1()',true),
 ('official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text)',true),
 ('official_v3_jobs_private.tx_queue_claim_v1(jsonb,jsonb,integer,integer,timestamp with time zone)',false),
 ('official_v3_jobs_private.tx_queue_mutate_v1(jsonb,jsonb,integer,integer,timestamp with time zone)',false),
 ('official_v3_jobs_private.tx_queue_cas_v1(jsonb,jsonb,integer,integer,timestamp with time zone)',false),
 ('official_v3_jobs_private.assert_history_v1(text)',true),
 ('official_v3_guard_private.owner_session_v1()',true),
 ('official_v3_guard_private.begin_jobs_v1()',false),
 ('official_v3_guard_private.seal_jobs_v1()',false),
 ('public.official_v3_guard_review_v1()',true),
 ('public.official_v3_guard_retire_v1(text,text)',true),
 ('jetnity_ot_auth.require_current_owner_session_v1()',false)
),
functions AS MATERIALIZED (
 SELECT f.signature,f.required,p.oid IS NOT NULL AS present,
  CASE WHEN p.oid IS NOT NULL THEN jsonb_build_object(
   'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
   'owner',pg_get_userbyid(p.proowner),'language',l.lanname,'security_definer',p.prosecdef,
   'volatility',p.provolatile,'parallel',p.proparallel,'strict',p.proisstrict,'leakproof',p.proleakproof,
   'result',pg_get_function_result(p.oid),'arguments',pg_get_function_identity_arguments(p.oid),
   'acl_sha256',encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex'),
   'config_sha256',encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex'),
   'postgres_execute',has_function_privilege('postgres',p.oid,'EXECUTE'),
   'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
   'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
   'service_role_execute',has_function_privilege('service_role',p.oid,'EXECUTE')) END AS metadata
 FROM function_names f LEFT JOIN pg_proc p ON p.oid=to_regprocedure(f.signature)
 LEFT JOIN pg_language l ON l.oid=p.prolang
),
relation_names(name) AS (VALUES
 ('jetnity_prod_import_scheduler.cycles_v1'),('jetnity_prod_import_scheduler.dispatches_v1'),
 ('official_v3_jobs_private.subjects_v1'),('official_v3_jobs_private.queue_operations_v1'),
 ('official_v3_jobs_private.execution_starts_v1'),('official_v3_jobs_private.execution_results_v1'),
 ('official_v3_jobs_private.execution_dispositions_v1'),('official_v3_intake_private.operations_v1'),
 ('official_v3_method_private.heads_v1'),('official_v3_guard_private.owner_operations_v1'),
 ('official_v3_guard_private.retired_attempts_v1'),('official_v3_guard_private.retired_cycle5_attempts_v1')
),
relations AS MATERIALIZED (
 SELECT r.name,c.oid IS NOT NULL AS present,
  CASE WHEN c.oid IS NOT NULL THEN jsonb_build_object('owner',pg_get_userbyid(c.relowner),
   'kind',c.relkind,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
   'postgres_select',has_table_privilege('postgres',c.oid,'SELECT'),
   'postgres_update',has_table_privilege('postgres',c.oid,'UPDATE'),
   'acl_sha256',encode(sha256(convert_to(coalesce(to_jsonb(c.relacl)::text,'null'),'UTF8')),'hex'),
   'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull) ORDER BY a.attnum)
    FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped)) END AS metadata
 FROM relation_names r LEFT JOIN pg_class c ON c.oid=to_regclass(r.name)
),
payload AS (
 SELECT jsonb_build_object(
  'schema',1,'result','PROD_CHDE_CYCLE12_BINDINGS_READONLY_OBSERVED',
  'observed_at',statement_timestamp(),'target_project','qscbgcdmivbbnzrcyegn',
  'read_only',current_setting('transaction_read_only')='on',
  'installed_successor_canonical_sha256','c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4',
  'bg1',(SELECT jsonb_build_object('generation',generation,'last_due',last_due,'last_finished',last_finished,'valid_until',valid_until,
   'incident_generation',incident_generation,'resumed_generation',resumed_generation) FROM official_v3_guard_private.state_v1 WHERE singleton),
  'cycle',(SELECT to_jsonb(c)||jsonb_build_object('row_sha256',encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex')) FROM cycle c),
  'dispatches',(SELECT jsonb_agg(jsonb_build_object('id',d.id,'phase',d.phase,'net_request_id',d.net_request_id,
   'dispatched_at',d.dispatched_at,'processed_at',d.processed_at,'http_status',d.http_status,'outcome',d.outcome,
   'row_sha256',encode(sha256(convert_to(to_jsonb(d)::text,'UTF8')),'hex')) ORDER BY d.id)
   FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=12),
  'identity',(SELECT to_jsonb(i) FROM identity i),
  'subject',(SELECT jsonb_build_object('job_key',s.job_key,'kind',s.kind,'slot_id',s.slot_id,
   'job_id',s.current_job->>'jobId','operation_id',s.current_job->>'operationId',
   'lease_id',s.current_job#>>'{lease,leaseId}','lease_expires_at',s.current_job#>>'{lease,expiresAt}',
   'state',s.current_job->>'state','attempt',s.current_job->'attempt','attempt_limit',s.current_job->'attemptLimit',
   'revision',s.current_job->'revision','open_attempt',s.open_attempt,
   'start_count',s.start_count,'operation_count',s.operation_count,'terminal_credit_claim',s.terminal_credit_claim,
   'method_id',s.current_job#>>'{method,methodId}','method_revision',s.current_job#>'{method,revision}',
   'subject_row_sha256',encode(sha256(convert_to(to_jsonb(s)::text,'UTF8')),'hex'),
   'current_job_sha256',encode(sha256(convert_to(s.current_job::text,'UTF8')),'hex'),
   'method_binding_sha256',encode(sha256(convert_to(s.method_binding::text,'UTF8')),'hex'),
   'cycle12_job_id_matches',s.current_job->>'jobId'=i.expected_job_id,
   'cycle12_enqueue_operation_matches',s.current_job->>'operationId'=i.enqueue_operation_id)
   FROM subject s CROSS JOIN identity i),
  'derived_claim_identities',(SELECT jsonb_agg(to_jsonb(ci) ORDER BY ci.generation) FROM claim_identities ci),
  'starts',coalesce((SELECT jsonb_agg(jsonb_build_object('attempt_key',t.attempt_key,'job_key',t.job_key,
   'claim_operation_id',t.claim_operation_id,'generation',t.generation,'reserved_at',t.reserved_at,
   'job_id',t.leased_job->>'jobId','job_matches_cycle12',t.leased_job->>'jobId'=i.expected_job_id,
   'lease_matches_derived_identity',t.leased_job#>>'{lease,leaseId}'=t.claim_lease_id,
   'is_current_open_attempt',t.attempt_key=s.open_attempt,
   'leased_job_equals_current',t.leased_job IS NOT DISTINCT FROM s.current_job,
   'leased_job_sha256',encode(sha256(convert_to(t.leased_job::text,'UTF8')),'hex'),
   'claim_text_sha256',encode(sha256(convert_to(t.claim_text,'UTF8')),'hex'),
   'authority_sha256',encode(sha256(convert_to(t.authority::text,'UTF8')),'hex'),
   'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 e WHERE e.attempt_key=t.attempt_key),
   'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 e WHERE e.attempt_key=t.attempt_key)) ORDER BY t.generation,t.attempt_key)
   FROM starts t CROSS JOIN subject s CROSS JOIN identity i),'[]'::jsonb),
  'queue',coalesce((SELECT jsonb_agg(jsonb_build_object('operation_id',q.operation_id,'job_key',q.job_key,
   'action',q.action,'recorded_at',q.recorded_at,'new_cycle_job_id',q.new_cycle_job_id,
   'command_key',q.command_key,'audit_reference',q.audit_reference,
   'command_sha256',encode(sha256(convert_to(q.command_text,'UTF8')),'hex'),
   'envelope_sha256',encode(sha256(convert_to(q.envelope_text,'UTF8')),'hex'),
   'authority_sha256',encode(sha256(convert_to(q.authority::text,'UTF8')),'hex')) ORDER BY q.recorded_at,q.operation_id)
   FROM queue_rows q),'[]'::jsonb),
  'intakes',coalesce((SELECT jsonb_agg(jsonb_build_object('operation_id',o.operation_id,'created_at',o.created_at,
   'expires_at',o.expires_at,'proposal_digest',o.proposal_digest,'bytes',octet_length(o.original_bytes),
   'original_sha256',encode(sha256(o.original_bytes),'hex'),
   'binding_sha256',encode(sha256(convert_to(o.binding::text,'UTF8')),'hex'),
   'binding_job_id',o.binding->>'jobId') ORDER BY o.created_at,o.operation_id) FROM intake o),'[]'::jsonb),
  'method',(SELECT jsonb_build_object('method_id',h.method_id,'status',h.status,
   'row_sha256',encode(sha256(convert_to(to_jsonb(h)::text,'UTF8')),'hex'))
   FROM official_v3_method_private.heads_v1 h WHERE method_id='jetnity-destination-primary-ch-de-visa'),
  'preserved_archive',jsonb_build_object(
   'head_row_sha256',(SELECT encode(sha256(convert_to(to_jsonb(h)::text,'UTF8')),'hex') FROM result_head h),
   'version_ref',(SELECT version_ref FROM result_head),'projection_ref',(SELECT projection_ref FROM result_head),
   'verification_ref',(SELECT reference FROM qualification),
   'qualification_row_sha256',(SELECT encode(sha256(convert_to(to_jsonb(q)::text,'UTF8')),'hex') FROM qualification q),
   'declared_original_ids',(SELECT original_ids FROM qualification),
   'originals',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.version_id) FROM archive_rows a),'[]'::jsonb),
   'all_originals_present_and_exact',(SELECT count(*) FROM qualification)=1
    AND (SELECT count(*) FROM archive_rows)=(SELECT jsonb_array_length(original_ids) FROM qualification)
    AND NOT EXISTS(SELECT 1 FROM archive_rows WHERE raw_digest IS DISTINCT FROM actual_body_sha256)),
  'prior_owner_receipt_metadata',jsonb_build_object(
   'count',(SELECT count(*) FROM official_v3_guard_private.owner_operations_v1),
   'retire_unknown_count',(SELECT count(*) FROM official_v3_guard_private.owner_operations_v1 WHERE action='retire_unknown'),
   'ordered_row_digest_sha256',(SELECT encode(sha256(convert_to(coalesce(jsonb_agg(
    encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex') ORDER BY o.operation_id),'[]'::jsonb)::text,'UTF8')),'hex')
    FROM official_v3_guard_private.owner_operations_v1 o)),
  'functions',(SELECT jsonb_agg(to_jsonb(f) ORDER BY f.signature) FROM functions f),
  'relations',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.name) FROM relations r),
  'jobs_owner_membership',coalesce((SELECT jsonb_agg(jsonb_build_object('grantor',pg_get_userbyid(m.grantor),
   'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option) ORDER BY m.grantor)
   FROM pg_auth_members m WHERE m.roleid=to_regrole('ot_v3_jobs_owner') AND m.member=to_regrole('postgres')),'[]'::jsonb),
  'read_bounds_ok',(SELECT count(*) FROM intake)<=8 AND (SELECT count(*) FROM starts)<=5 AND (SELECT count(*) FROM queue_rows)<=6,
  'required_function_metadata_present',NOT EXISTS(SELECT 1 FROM functions WHERE required AND NOT present),
  'existing_claim_authority_is_proven',false,
  'original_http503_error_body_is_proven',false,
  'production_write_is_authorized',false,'owner_action_performed',false,
  'source_run_started',false,'positive_public_fact_created',false
 ) AS body
)
SELECT CASE WHEN body->'read_bounds_ok' IS DISTINCT FROM 'true'::jsonb
 THEN jsonb_build_object('schema',1,'result','STOP_RESULT_BOUND','production_write_is_authorized',false)
 WHEN body->'required_function_metadata_present' IS DISTINCT FROM 'true'::jsonb
 THEN jsonb_build_object('schema',1,'result','STOP_REQUIRED_FUNCTION_METADATA','production_write_is_authorized',false)
 WHEN octet_length(body::text)<=262144 THEN body
 ELSE jsonb_build_object('schema',1,'result','STOP_OUTPUT_BOUND_EXCEEDED','production_write_is_authorized',false)
 END AS result FROM payload;
ROLLBACK;
