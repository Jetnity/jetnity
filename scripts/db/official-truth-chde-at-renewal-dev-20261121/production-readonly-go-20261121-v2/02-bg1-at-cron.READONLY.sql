-- DRAFT FOR OWNER REVIEW; NOT EXECUTED. Only after explicit Production READ Go.
-- Fixed connector target: qscbgcdmivbbnzrcyegn. SQL cannot authenticate a Supabase project ref.
-- 02: direct bounded BG1/source/cron metadata, no product function is called; <=16 KiB. No app routine, HTTP, Owner, audit, publication, lock, sequence advance or DDL.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='12s';
SET LOCAL transaction_timeout='12s';
-- Execute only after 01 reports READY_FOR_FIXED_READ_PHASES_ONLY.
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
 AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL) AS context_ok),
 expected_job(jobname,expected_command) AS (VALUES
 ('jetnity-official-truth-production-guard-v1','SET statement_timeout=''30s''; SET lock_timeout=''25s''; SELECT official_v3_guard_private.audit_v1();'),
 ('jetnity-at-production-source-enqueue-v1','SELECT official_v3_at_production_private.enqueue_v1()'),
 ('jetnity-at-production-source-collect-v1','SELECT official_v3_at_production_private.collect_v1()'),
 ('jetnity-at-production-source-renew-v1','SELECT official_v3_at_production_private.renew_ch_v1()'),
 ('jetnity-ch-de-prod-import-v1','')
), state_sample AS MATERIALIZED (
 SELECT generation,last_due,last_started,last_proof_started,last_finished,valid_until,
  incident_generation,resumed_generation,last_observed
 FROM official_v3_guard_private.state_v1 WHERE singleton LIMIT 2
), baseline_sample AS MATERIALIZED (
 SELECT required_generation,proof_not_before,
  encode(sha256(convert_to(catalog::text,'UTF8')),'hex') AS stored_catalog_sha256
 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton LIMIT 2
), run_sample AS MATERIALIZED (
 SELECT generation,due_at,started_at,proof_started_at,finished_at,outcome
 FROM official_v3_guard_private.runs_v1
 WHERE due_at>=statement_timestamp()-interval '30 minutes'
 ORDER BY due_at DESC LIMIT 7
), source_sample AS MATERIALIZED (
 SELECT source_qualified,research_only FROM official_v3_at_production_private.source_pins_v1 LIMIT 4
), original_sample AS MATERIALIZED (
 SELECT legal_source_approved,customer_rule_approved FROM official_v3_at_production_private.first_originals_v1 LIMIT 4
), fact_sample AS MATERIALIZED (
 SELECT expires_at FROM official_v3_at_production_private.ch_visa_facts_v1 LIMIT 1001
), jobs_sample AS MATERIALIZED (
 SELECT j.jobid,j.jobname,j.schedule,j.active,j.database=current_database() AS expected_database,
  j.username='postgres' AS postgres_role,
  encode(sha256(convert_to(j.command,'UTF8')),'hex') AS command_sha256,
  CASE WHEN e.expected_command<>'' THEN j.command=e.expected_command END AS fixed_command_match
 FROM cron.job j JOIN expected_job e USING(jobname) ORDER BY j.jobname,j.jobid LIMIT 6
), job_runs AS MATERIALIZED (
 SELECT j.jobname,r.runid::text,r.start_time,r.end_time,r.status,
  r.database=current_database() AS expected_database,r.username='postgres' AS postgres_role,
  encode(sha256(convert_to(r.command,'UTF8')),'hex') AS command_sha256,
  encode(sha256(convert_to(r.command,'UTF8')),'hex')=j.command_sha256 AS matches_current_job_command
 FROM jobs_sample j CROSS JOIN LATERAL (
  SELECT runid,start_time,end_time,status,database,username,command
  FROM cron.job_run_details d WHERE d.jobid=j.jobid
  AND d.start_time>=statement_timestamp()-interval '30 minutes'
  ORDER BY d.start_time DESC,d.runid DESC LIMIT 3
 ) r
), payload AS (
 SELECT CASE WHEN NOT context_ok THEN jsonb_build_object('result','STOP_CONTEXT')
 ELSE jsonb_build_object(
 'result','PROD_BOUNDED_METADATA_OBSERVATION_ONLY','observed_at',statement_timestamp(),
 'declared_target','qscbgcdmivbbnzrcyegn','project_ref_authenticated_by_sql',false,
 'bg1_state_count_at_most_2',(SELECT count(*) FROM state_sample),
 'bg1_state',(SELECT coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) FROM state_sample s),
 'v3_baseline_count_at_most_2',(SELECT count(*) FROM baseline_sample),
 'v3_baseline_metadata',(SELECT coalesce(jsonb_agg(to_jsonb(b)),'[]'::jsonb) FROM baseline_sample b),
 'recent_runs_at_most_7',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY due_at DESC),'[]'::jsonb) FROM run_sample r),
 'state_timestamp_freshness_only',(SELECT count(*)=1 AND bool_and(generation>0 AND incident_generation=resumed_generation
   AND last_finished<=statement_timestamp() AND last_observed<=statement_timestamp()
   AND statement_timestamp()<valid_until) FROM state_sample),
 'state_run_match_count',(SELECT count(*) FROM state_sample s JOIN run_sample r
   ON r.generation=s.generation AND r.due_at=s.last_due AND r.started_at=s.last_started
   AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished AND r.outcome='complete'),
 'source_count_at_most_4',(SELECT count(*) FROM source_sample),
 'source_count_complete',(SELECT count(*)<4 FROM source_sample),
 'qualified_source_count_when_complete',(SELECT CASE WHEN count(*)<4 THEN count(*) FILTER(WHERE source_qualified AND NOT research_only) END FROM source_sample),
 'research_source_count_when_complete',(SELECT CASE WHEN count(*)<4 THEN count(*) FILTER(WHERE research_only OR NOT source_qualified) END FROM source_sample),
 'original_count_at_most_4',(SELECT count(*) FROM original_sample),
 'original_count_complete',(SELECT count(*)<4 FROM original_sample),
 'legally_approved_originals_when_complete',(SELECT CASE WHEN count(*)<4 THEN count(*) FILTER(WHERE legal_source_approved) END FROM original_sample),
 'customer_approved_originals_when_complete',(SELECT CASE WHEN count(*)<4 THEN count(*) FILTER(WHERE customer_rule_approved) END FROM original_sample),
 'fact_count_at_most_1001',(SELECT count(*) FROM fact_sample),
 'fact_count_complete',(SELECT count(*)<1001 FROM fact_sample),
 'unexpired_fact_count_when_complete',(SELECT CASE WHEN count(*)<1001 THEN count(*) FILTER(WHERE expires_at>statement_timestamp()) END FROM fact_sample),
 'expected_cron_job_count',5,'observed_jobs_at_most_6',(SELECT count(*) FROM jobs_sample),
 'jobs',(SELECT coalesce(jsonb_agg(to_jsonb(j)-'jobid' ORDER BY jobname),'[]'::jsonb) FROM jobs_sample j),
 'recent_cron_runs_at_most_18',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY jobname,start_time DESC),'[]'::jsonb) FROM job_runs r),
 'full_bg1_validation_performed',false,'public_status_rpc_invoked',false,
 'source_bodies_read',false,'owner_rows_read',false,'source_qualification_changed',false,
 'positive_at_qualification_proven',false,'repair_permission',false,'publication_permission',false)
 END AS document FROM context
)
SELECT CASE WHEN octet_length(document::text)<=16384 THEN document ELSE
 jsonb_build_object('result','STOP_OUTPUT_OVER_16384_BYTES') END AS result FROM payload;
ROLLBACK;
