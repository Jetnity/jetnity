-- DEV ONLY. Independent readback after committed own allocator / BG1 v8.
-- Pure READ ONLY; no enqueue, collector, publisher, audit or Owner call.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
WITH v8 AS (
 SELECT * FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton
), state AS (
 SELECT * FROM official_v3_guard_private.state_v1 WHERE singleton
), natural_proof AS (
 SELECT r.generation::text,r.due_at,r.started_at,r.proof_started_at,r.finished_at,
  d.runid::text AS cron_run_id,d.start_time AS cron_started,d.end_time AS cron_finished
 FROM official_v3_guard_private.runs_v1 r
 JOIN state s ON r.generation=s.generation AND r.due_at=s.last_due
  AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started
  AND r.finished_at=s.last_finished
 CROSS JOIN v8 b
 JOIN cron.job j ON j.jobname='jetnity-official-truth-dev-guard-v1'
  AND j.active AND j.schedule='*/5 * * * *'
  AND j.username='postgres' AND j.database=current_database()
  AND j.command='SET statement_timeout=''30s''; SET lock_timeout=''25s''; SELECT official_v3_guard_private.audit_v1();'
 JOIN cron.job_run_details d ON d.jobid=j.jobid AND d.status='succeeded'
  AND d.command=j.command AND d.username='postgres' AND d.database=current_database()
  -- runs.started_at is statement_timestamp(), which may precede cron's
  -- recording timestamp; proof_started_at is the actual clock after the lock.
  -- Bind the entire real proof interval, with no arbitrary time tolerance.
  AND d.start_time<=r.proof_started_at AND r.started_at<=r.proof_started_at
  AND r.proof_started_at<=r.finished_at AND r.finished_at<=d.end_time
  AND r.due_at=date_bin(interval '5 minutes',d.start_time,'2000-01-01 00:00:00+00'::timestamptz)
 WHERE r.outcome='complete' AND r.generation>=b.required_generation
  AND r.proof_started_at>b.proof_not_before
), actual_sources AS (
 SELECT r.batch_id::text,r.source_id,r.request_id::text,r.requested_at,r.observed_at,r.state,
  r.observed_bytes,r.observed_sha,
  http.status_code AS actual_http_status,http.created AS actual_http_created,
  (http.status_code=200 AND http.timed_out IS NOT TRUE AND http.error_msg IS NULL
   AND http.content IS NOT NULL AND http.content_type~* '^text/html([; ]|$)'
   AND http.created>=r.requested_at AND http.created<=r.observed_at
   AND r.observed_at<=r.requested_at+interval '5 minutes 10 seconds'
   AND octet_length(convert_to(http.content,'UTF8'))=r.observed_bytes
   AND encode(sha256(convert_to(http.content,'UTF8')),'hex')=r.observed_sha
   AND r.request_id>=seq.seqstart
   AND EXISTS(SELECT 1 FROM cron.job j JOIN cron.job_run_details d ON d.jobid=j.jobid
    WHERE j.jobname='jetnity-at-source-enqueue-dev-v1' AND j.active AND j.schedule='*/5 * * * *'
     AND j.command='SELECT official_v3_at_source_watch_private.enqueue_v1()'
     AND d.command=j.command AND j.username='postgres' AND d.username='postgres'
     AND j.database=current_database() AND d.database=current_database()
     AND d.status='succeeded' AND d.start_time<=r.requested_at AND r.requested_at<=d.end_time)
   AND EXISTS(SELECT 1 FROM cron.job j JOIN cron.job_run_details d ON d.jobid=j.jobid
    WHERE j.jobname='jetnity-at-source-collect-dev-v1' AND j.active AND j.schedule='*/5 * * * *'
     AND j.command='SELECT official_v3_at_source_watch_private.collect_v1()'
     AND d.command=j.command AND j.username='postgres' AND d.username='postgres'
     AND j.database=current_database() AND d.database=current_database()
     AND d.status='succeeded' AND d.start_time<=r.observed_at AND r.observed_at<=d.end_time)) AS exact_response_watch_binding,
  -- collect_v1 updates the source-watch receipt only. Sealing the separate
  -- renewal journal is a distinct action, which this readback never invokes.
  coalesce(o.request_id=r.request_id AND o.requested_at=r.requested_at
   AND o.observed_at=r.observed_at AND o.observed_sha=r.observed_sha
   AND o.observed_bytes=r.observed_bytes AND o.result=r.state,false) AS renewal_journal_binding
 FROM official_v3_at_source_watch_private.reads_v1 r
 CROSS JOIN v8 b
 JOIN pg_sequence seq ON seq.seqrelid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass
 LEFT JOIN official_v3_source_renewal_private.observations_v1 o
  ON o.destination_code='AT' AND o.source_batch_id=r.batch_id AND o.source_id=r.source_id
 LEFT JOIN LATERAL (
  SELECT id,status_code,timed_out,error_msg,content_type,content,created
  FROM net._http_response WHERE id=r.request_id ORDER BY created DESC LIMIT 1
 ) http ON true
 WHERE r.requested_at>b.proof_not_before
), metrics AS (
 SELECT clock_timestamp() AS observed_at,current_user AS database_role,
  public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
  (SELECT catalog=official_v3_guard_private.catalog_status_v1() FROM v8) AS v8_catalog_exact,
  (SELECT jsonb_build_object('required_generation',required_generation::text,'proof_not_before',proof_not_before,
    'baseline_sha',encode(sha256(convert_to((to_jsonb(b)||jsonb_build_object('proof_not_before',extract(epoch FROM proof_not_before)))::text,'UTF8')),'hex'))
    FROM v8 b) AS sealed_v8,
  (SELECT jsonb_build_object('generation',generation::text,'last_due',last_due,'last_started',last_started,
    'last_proof_started',last_proof_started,'last_finished',last_finished,'valid_until',valid_until,
    'incident_generation',incident_generation::text,'resumed_generation',resumed_generation::text)
    FROM state) AS guard_state,
  (SELECT coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) FROM natural_proof p) AS actual_natural_v8_proofs,
  (SELECT count(*) FROM natural_proof) AS natural_v8_proof_count,
  (SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called)
    FROM jetnity_pgnet_allocator_private.http_request_id_v1) AS own_sequence,
  (SELECT jsonb_build_object('owner',pg_get_userbyid(c.relowner),'persistence',c.relpersistence,
    'start',s.seqstart::text,'increment',s.seqincrement::text,'cache',s.seqcache::text,'cycle',s.seqcycle,'acl',c.relacl::text)
    FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
    WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass) AS own_sequence_parameters,
  (SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called)
    FROM net.http_request_queue_id_seq) AS legacy_sequence,
  (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
    WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure) AS helper_body_sha,
  (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
    WHERE oid='official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure) AS publisher_body_sha,
  (SELECT count(*) FROM official_v3_source_renewal_private.facts_v1) AS historical_fact_count,
  (SELECT count(*) FROM official_v3_source_renewal_private.facts_v1 WHERE expires_at>clock_timestamp()) AS fresh_fact_count,
  (SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex')
    FROM official_v3_source_renewal_private.facts_v1 f) AS fact_history_sha,
  (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
    WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0
     AND body_digest=encode(sha256(original_body),'hex')) AS exact_research_originals,
  (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY requested_at,batch_id,source_id),'[]'::jsonb)
    FROM actual_sources a) AS actual_post_install_at_sources,
  (SELECT count(*) FROM actual_sources WHERE exact_response_watch_binding) AS exact_post_install_at_response_bindings,
  (SELECT count(*) FROM actual_sources WHERE renewal_journal_binding) AS separate_post_install_renewal_journal_bindings,
  (SELECT count(DISTINCT request_id) FROM actual_sources) AS distinct_post_install_at_request_ids,
  (SELECT count(*) FROM actual_sources) AS post_install_at_request_count
)
SELECT *,CASE WHEN bg1='current' AND v8_catalog_exact AND natural_v8_proof_count=1
 AND helper_body_sha='16151e29d3859b8574afcc934c2fa4cc6709c82280697e34474b41f711801afa'
 AND publisher_body_sha='05bf4f11d1b5b482d798afc11396c53016cd17470ce3b857cacb87323b520105'
 AND historical_fact_count=71 AND fresh_fact_count=0 AND exact_research_originals=3
 AND fact_history_sha='fefe812a3062bd05a84d08cc4d4ae71334cdee35f84df4c8f5eab3fca8bf2b38'
 THEN 'DEV_V8_CURRENT_AND_HISTORY_INDEPENDENT_READBACK_PASS'
 ELSE 'WAIT_OR_STOP_DEV_V8_READBACK_INCOMPLETE' END AS guard_verdict,
 (exact_post_install_at_response_bindings>=3
  AND post_install_at_request_count=distinct_post_install_at_request_ids
  AND exact_post_install_at_response_bindings=post_install_at_request_count) AS actual_post_install_at_transport_verified,
 false AS positive_at_renewal_proven,false AS induced_crash_tested,false AS production_accessed
FROM metrics;
ROLLBACK;
