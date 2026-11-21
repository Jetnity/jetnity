-- Exact CH->DE terminal cycle review. Always read-only; never a start or Owner approval.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
WITH old AS (
 SELECT * FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked' ORDER BY id DESC LIMIT 1
), stats AS (
 SELECT (SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked') blocked_count,
 (SELECT status FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton) scheduler_status,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=old.id) total_dispatches,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=old.id
  AND d.phase='start' AND d.http_status=200 AND d.outcome='queued') queued_starts,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=old.id
  AND d.phase='resume' AND d.http_status=503 AND d.outcome IN ('unresolved','unavailable')) failed_resumes,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=old.id
  AND d.processed_at IS NULL) unprocessed_http,
 (SELECT count(*) FROM official_v3_result_private.projections_v1 p WHERE p.published_at>=old.created_at) new_projections,
 (SELECT count(*) FROM official_v3_result_private.versions_v1 v WHERE v.committed_at>=old.created_at) new_versions,
 (SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 e WHERE e.prepared_at>=old.created_at) new_execution_results,
 (SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 e WHERE e.settled_at>=old.created_at) new_dispositions,
 (SELECT count(*) FROM official_v3_result_private.outbox_v1 o WHERE o.recorded_at>=old.created_at) new_escalations,
 (SELECT count(*) FROM official_v3_jobs_private.subjects_v1 j WHERE j.current_job->>'state'='leased'
 AND (j.current_job#>>'{lease,expiresAt}')::timestamptz<clock_timestamp()) expired_research_leases,
 (SELECT count(*) FROM official_v3_result_private.projections_v1 p WHERE (p.record->>'expiresAt')::timestamptz>clock_timestamp()) current_public_projections,
 (SELECT next_check_at FROM official_v3_result_private.monitor_schedule_v1 WHERE singleton) monitor_due,
 (SELECT status FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-ch-de-visa') current_method_status
 FROM old
)
SELECT current_setting('server_version_num')::int/10000=17 AS pg17,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
 old.phase,old.phase_attempts,old.last_status,stats.*,
 CASE WHEN stats.blocked_count<>1 THEN 'STOP_MULTIPLE_OR_MISSING_TERMINAL_CYCLES'
 WHEN old.phase<>'resume' OR old.phase_attempts<>8 OR old.last_status<>'retry_budget_exhausted'
  OR stats.queued_starts<>1 OR stats.failed_resumes<>8 OR stats.total_dispatches<>9 OR stats.unprocessed_http<>0
  THEN 'STOP_TERMINAL_TRANSPORT_HISTORY_UNVERIFIED'
 WHEN stats.new_projections<>0 OR stats.new_versions<>0 OR stats.new_execution_results<>0
   OR stats.new_dispositions<>0 OR stats.new_escalations<>0 THEN 'STOP_UNKNOWN_POST_CYCLE_WRITES'
 WHEN stats.current_method_status<>'approved' OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  THEN 'STOP_BG1_OR_METHOD_NOT_CURRENT'
 WHEN stats.scheduler_status<>'operator_review_required' OR stats.current_public_projections<>0
  THEN 'STOP_UNEXPECTED_SCHEDULER_OR_PUBLIC_STATE'
 ELSE 'EXACT_IMMUTABLE_HISTORY_REVIEWABLE_ONLY__NOT_RELEASE_AUTHORITY' END AS reviewer_verdict,
 false AS owner_session_authenticated, false AS source_rule_reapproved,
 false AS new_scheduler_cycle_authorized, false AS production_write
FROM old,stats;
ROLLBACK;
