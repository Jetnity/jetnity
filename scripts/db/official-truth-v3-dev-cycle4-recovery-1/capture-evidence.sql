-- Root-only SELECT snapshot after the normal Cycle4 terminal dispatch drained.
-- No Vault, token, token hash, actor identity, HTTP header, audit or sender call.
WITH subject AS (
  SELECT s.* FROM official_v3_jobs_private.subjects_v1 s
  WHERE s.job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
    AND s.current_job->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e'
), started AS (
  SELECT t.* FROM official_v3_jobs_private.execution_starts_v1 t
  JOIN subject s ON s.open_attempt=t.attempt_key
), intake AS (
  SELECT i.* FROM official_v3_intake_private.operations_v1 i
  WHERE i.binding->>'jobId'='job3_c70d23ff344cdf2998818ecf5243d15e'
), head AS (
  SELECT h.* FROM official_v3_result_private.heads_v1 h WHERE singleton
)
SELECT jsonb_build_object(
  'schema',1,'project','yfvbxvijcorffwxbxahl','observed_at',clock_timestamp(),
  'subject',(SELECT to_jsonb(s) FROM subject s),
  'start',(SELECT to_jsonb(t)-'token_hash' FROM started t),
  'claim',(SELECT to_jsonb(q) FROM official_v3_jobs_private.queue_operations_v1 q
    JOIN started t ON q.operation_id=t.claim_operation_id),
  'intake',(SELECT (to_jsonb(i)-ARRAY['lease_token','original_bytes'])
    ||jsonb_build_object('bytes',octet_length(i.original_bytes)) FROM intake i),
  'reservations',COALESCE((SELECT jsonb_agg(to_jsonb(r)-'lease_token' ORDER BY r.generation)
    FROM official_v3_intake_private.reservations_v1 r JOIN intake i USING(operation_id)),'[]'::jsonb),
  'completions',COALESCE((SELECT jsonb_agg(to_jsonb(c)-'lease_token' ORDER BY c.generation)
    FROM official_v3_intake_private.completions_v1 c JOIN intake i USING(operation_id)),'[]'::jsonb),
  'executionResults',COALESCE((SELECT jsonb_agg(to_jsonb(r))
    FROM official_v3_jobs_private.execution_results_v1 r JOIN started t USING(attempt_key)),'[]'::jsonb),
  'executionDispositions',COALESCE((SELECT jsonb_agg(to_jsonb(d))
    FROM official_v3_jobs_private.execution_dispositions_v1 d JOIN started t USING(attempt_key)),'[]'::jsonb),
  'hrsHead',(SELECT to_jsonb(h) FROM head h),
  'qualifications',COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'reference',q.reference,'decisionRef',q.decision_ref,'originalIds',q.original_ids,
    'historyPointer',q.record#>'{history,pointer}') ORDER BY q.reference)
    FROM official_v3_result_private.qualifications_v1 q,head h
    WHERE q.kind='verification' AND q.record#>>'{history,pointer,versionRef}'=h.version_ref),'[]'::jsonb),
  'counts',jsonb_build_object(
    'queue',(SELECT count(*) FROM official_v3_jobs_private.queue_operations_v1),
    'starts',(SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1),
    'results',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1),
    'dispositions',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1),
    'originals',(SELECT count(*) FROM official_v3_result_private.originals_v1),
    'qualifications',(SELECT count(*) FROM official_v3_result_private.qualifications_v1),
    'versions',(SELECT count(*) FROM official_v3_result_private.versions_v1),
    'publications',(SELECT count(*) FROM official_v3_result_private.operations_v1 WHERE operation_kind='publication'),
    'firstRetirements',(SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1),
    'laterRetirements',(SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1),
    'refreshRetirements',(SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)),
  'previousRetirements',jsonb_build_object(
    'first',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_guard_private.retired_attempts_v1 r),
    'later',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_number) FROM official_v3_guard_private.retired_later_attempts_v1 r),
    'refresh',(SELECT jsonb_agg(to_jsonb(r) ORDER BY attempt_key) FROM official_v3_guard_private.retired_refresh_attempts_v1 r)),
  'ownerOperations',(SELECT jsonb_agg(to_jsonb(o)-'actor_id' ORDER BY recorded_at,operation_id)
    FROM official_v3_guard_private.owner_operations_v1 o),
  'sender',(SELECT to_jsonb(s) FROM jetnity_dev_import_scheduler.state_v1 s WHERE singleton),
  'cron',(SELECT to_jsonb(j) FROM cron.job j WHERE jobid=5),
  'cycle',(SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=4),
  'dispatches',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE cycle_id=4),
  'cycle2Review',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 r WHERE cycle_id=2),
  'cycle3Review',(SELECT to_jsonb(r) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 r WHERE cycle_id=3),
  'guard',(SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton),
  'unprocessedDispatches',(SELECT count(*) FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL),
  'unprocessedPreviewDispatches',(SELECT count(*) FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL)
);
