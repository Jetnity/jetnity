-- DEV ONLY yfvbxvijcorffwxbxahl. No owner impersonation or mutation.
-- Independent readback of the user-reported 2026-11-21 13:17 Europe/Zurich retirement.
-- The confirmation RPC is a read: it creates no second durable receipt.
-- A historical UI confirmation cannot be inferred from these tables alone.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
DO $readback$
BEGIN
  IF current_database()<>'postgres'
     OR current_setting('server_version_num')::int/10000<>17
     OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
     OR to_regclass('official_v3_guard_private.bg1_dev_cycle5_baseline_v6') IS NULL
     OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
  THEN RAISE EXCEPTION 'DEV_ONLY_READBACK_PRECONDITION_REFUSED'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  PERFORM official_v3_guard_private.cycle5_check_retired_v1();
END $readback$;
WITH retirement AS (
 SELECT r.*, o.action, o.expected_digest, o.recorded_at, o.receipt,
        s.open_attempt, s.start_count, s.operation_count,
        t.reserved_at, t.leased_job,
        i.original_bytes, i.proposal_digest,
        q.original_ids
 FROM official_v3_guard_private.retired_cycle5_attempts_v1 r
 JOIN official_v3_guard_private.owner_operations_v1 o ON o.operation_id=r.owner_operation_id
 JOIN official_v3_jobs_private.subjects_v1 s ON s.job_key=r.job_key
 JOIN official_v3_jobs_private.execution_starts_v1 t ON t.attempt_key=r.attempt_key
 JOIN official_v3_intake_private.operations_v1 i ON i.operation_id=r.intake_operation_id
 JOIN official_v3_result_private.qualifications_v1 q
   ON q.reference=r.before_state#>>'{result,verificationRef}' AND q.kind='verification'
), metrics AS (
 SELECT current_timestamp AS observed_at,
   (SELECT count(*) FROM retirement) AS cycle5_retirement_count,
   (SELECT max(retired_at) FROM retirement) AS cycle5_retired_at,
   (SELECT count(*) FROM official_v3_guard_private.retired_attempts_v1)
     +(SELECT count(*) FROM official_v3_guard_private.retired_later_attempts_v1)
     +(SELECT count(*) FROM official_v3_guard_private.retired_refresh_attempts_v1)
     +(SELECT count(*) FROM official_v3_guard_private.retired_cycle4_attempts_v1)
     +(SELECT count(*) FROM official_v3_guard_private.retired_cycle4_attempt2_v1)
     AS prior_retirement_count,
   (SELECT count(*) FROM official_v3_guard_private.owner_operations_v1 WHERE action='retire_unknown')
     AS retirement_owner_receipt_count,
   (SELECT bool_and(action='retire_unknown' AND recorded_at=retired_at
     AND expected_digest=encode(sha256(convert_to(before_state::text,'UTF8')),'hex')
     AND receipt->>'status'='recorded' AND receipt->>'result'='unknown_retired') FROM retirement)
     AS cycle5_owner_receipt_exact,
   (SELECT bool_and(open_attempt IS NULL AND start_count=15 AND operation_count=53) FROM retirement)
     AS closed_job_and_15_53_history_unchanged,
   (SELECT bool_and(octet_length(original_bytes)=1425
     AND encode(sha256(original_bytes),'hex')=proposal_digest) FROM retirement)
     AS cycle5_original_intake_bytes_exact,
   (SELECT count(*) FROM retirement r CROSS JOIN LATERAL jsonb_array_elements_text(r.original_ids) ids(version_id)
     JOIN official_v3_result_private.originals_v1 o USING(version_id)) AS archived_original_count,
   (SELECT bool_and(o.raw_digest=encode(sha256(convert_to(o.body_text,'UTF8')),'hex'))
     FROM retirement r CROSS JOIN LATERAL jsonb_array_elements_text(r.original_ids) ids(version_id)
     JOIN official_v3_result_private.originals_v1 o USING(version_id)) AS archived_original_bytes_exact,
   (SELECT count(*) FROM official_v3_jobs_private.execution_starts_v1 e, retirement r
     WHERE e.job_key=r.job_key AND e.reserved_at>r.reserved_at) AS later_source_starts,
   (SELECT count(*) FROM official_v3_result_private.versions_v1 v, retirement r
     WHERE v.committed_at>r.reserved_at) AS later_accepted_versions,
   (SELECT count(*) FROM official_v3_result_private.projections_v1 p, retirement r
     WHERE p.published_at>r.reserved_at) AS later_public_projections,
   (SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 e, retirement r
     WHERE e.attempt_key=r.attempt_key) AS retired_attempt_results,
   (SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 e, retirement r
     WHERE e.attempt_key=r.attempt_key) AS retired_attempt_dispositions,
   (SELECT count(*) FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole
     AND member='postgres'::regrole) AS jobs_membership_count,
   (SELECT bool_and(grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
     FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole)
     AS jobs_membership_original,
   (SELECT catalog=official_v3_guard_private.catalog_status_v1()
     FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton) AS v7_catalog_exact,
   public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
   (SELECT generation FROM official_v3_guard_private.state_v1 WHERE singleton) AS bg1_generation,
   (SELECT incident_generation FROM official_v3_guard_private.state_v1 WHERE singleton) AS incident_generation,
   (SELECT resumed_generation FROM official_v3_guard_private.state_v1 WHERE singleton) AS resumed_generation,
   (SELECT last_due FROM official_v3_guard_private.state_v1 WHERE singleton) AS latest_bg1_due_at,
   (SELECT count(*) FROM official_v3_guard_private.runs_v1 r
     JOIN official_v3_guard_private.state_v1 s ON s.singleton
       AND r.generation=s.generation AND r.due_at=s.last_due
       AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started
       AND r.finished_at=s.last_finished
     CROSS JOIN official_v3_guard_private.bg1_dev_grantor_restore_v7 b
     JOIN cron.job j ON j.jobname='jetnity-official-truth-dev-guard-v1'
       AND j.active AND j.schedule='*/5 * * * *'
       AND j.username='postgres' AND j.database=current_database()
     JOIN cron.job_run_details d ON d.jobid=j.jobid AND d.status='succeeded'
       AND d.start_time<=r.started_at AND r.started_at<=r.proof_started_at
       AND r.proof_started_at<=r.finished_at AND r.finished_at<=d.end_time
       AND r.due_at=date_bin(interval '5 minutes',d.start_time,
         '2000-01-01 00:00:00+00'::timestamptz)
     WHERE b.singleton AND r.outcome='complete' AND r.generation>=b.required_generation
       AND r.started_at>b.proof_not_before) AS natural_post_v7_complete_proofs
)
SELECT *, CASE WHEN cycle5_retirement_count=1 AND prior_retirement_count=6
 AND retirement_owner_receipt_count=7 AND cycle5_owner_receipt_exact
 AND closed_job_and_15_53_history_unchanged AND cycle5_original_intake_bytes_exact
 AND archived_original_count=2 AND archived_original_bytes_exact
 AND later_source_starts=0 AND later_accepted_versions=0 AND later_public_projections=0
 AND retired_attempt_results=0 AND retired_attempt_dispositions=0
 AND jobs_membership_count=1 AND jobs_membership_original AND v7_catalog_exact
 AND bg1='current' AND incident_generation=resumed_generation AND natural_post_v7_complete_proofs>0
 THEN 'DEV_CYCLE5_RETIREMENT_AND_ARCHIVE_INDEPENDENT_READBACK_PASS'
 ELSE 'STOP_DEV_READBACK_INCOMPLETE_OR_CHANGED' END AS verdict,
 false AS historical_ui_confirmation_proven_from_database,
 false AS owner_session_used, false AS new_source_run_started, false AS production_write
FROM metrics;
ROLLBACK;
