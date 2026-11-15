-- Read-only original confirmation, including after an unknown apply response.
-- postgres in Dev only. Never recreate/delete/relabel an existing review.
SELECT jsonb_build_object(
 'schema',1,
 'observed_at',clock_timestamp(),
 'review',(SELECT to_jsonb(r)-'reviewed_head'||jsonb_build_object(
   'reviewed_job_id',r.reviewed_head->>'jobId','reviewed_revision',r.reviewed_head->'revision',
   'reviewed_state',r.reviewed_head->>'state') FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 r WHERE cycle_id=2),
 'original_evidence_unchanged',encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd',
 'exact_reviewed_sender',(SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex')='79a68078d5423a8646f2faf796174df8cf6680babe3595d57a0708a8e0973add'
   FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure),
 'sender',(SELECT jsonb_build_object('enabled',enabled,'status',status,'next_due_at',next_due_at,
   'transport_expires_at',transport_expires_at) FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton),
 'original_cycle',(SELECT to_jsonb(c) FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE id=2),
 'original_dispatch_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE cycle_id=2),
 'unprocessed_dispatch_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL),
 'other_blocked_count',(SELECT count(*) FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='blocked' AND id<>2),
 'selected_subject',(SELECT jsonb_build_object('job_id',current_job->>'jobId','revision',current_job->'revision',
   'state',current_job->>'state','operation_count',operation_count,'start_count',start_count,
   'open_attempt',open_attempt IS NOT NULL,'terminal_credit',terminal_credit_claim IS NOT NULL,
   'lease',current_job->'lease' IS DISTINCT FROM 'null'::jsonb)
   FROM official_v3_jobs_private.subjects_v1 WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
 'guard',public.official_v3_guard_alarm_status_v1(),
 'quota',official_v3_jobs_private.rolling_usage_v2('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513')
);
