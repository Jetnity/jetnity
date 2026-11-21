-- Owner GO preflight for CH->DE / AT ONLY; this file is READ ONLY and can never repair Production.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
WITH state AS (
 SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked') blocked_cycles,
 (SELECT status FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton) scheduler_status,
 (SELECT max(phase_attempts) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked') max_block_attempts,
 (SELECT count(*) FROM official_v3_jobs_private.subjects_v1 WHERE current_job->>'state'='leased'
 AND (current_job#>>'{lease,expiresAt}')::timestamptz<clock_timestamp()) expired_leases,
 (SELECT next_check_at FROM official_v3_result_private.monitor_schedule_v1 WHERE singleton) monitor_due,
 (SELECT count(*) FROM official_v3_result_private.projections_v1 WHERE (record->>'expiresAt')::timestamptz>clock_timestamp()) fresh_projections,
 (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1 WHERE source_qualified AND NOT research_only) qualified_sources,
 (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1) total_sources,
 (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1) visa_facts,
 (SELECT max(request_id) FROM official_v3_at_production_private.watch_requests_v1) highest_immutable_request_id,
 (SELECT max(net_request_id) FROM jetnity_prod_import_scheduler.dispatches_v1) highest_import_request_id,
 (SELECT max(id) FROM net._http_response) highest_recent_http_response_id,
 (SELECT max(id) FROM net.http_request_queue) highest_pending_http_id,
 (SELECT last_value FROM net.http_request_queue_id_seq) current_pgnet_last_value
)
SELECT current_setting('server_version_num')::int/10000=17 pg17,
 bg1,blocked_cycles,scheduler_status,max_block_attempts,expired_leases,
 monitor_due<clock_timestamp() AS monitor_overdue,fresh_projections,
 qualified_sources,total_sources,visa_facts,
 greatest(coalesce(highest_immutable_request_id,0),coalesce(highest_import_request_id,0),
          coalesce(highest_recent_http_response_id,0),coalesce(highest_pending_http_id,0)) AS max_immutable_or_pending_http_id,
 current_pgnet_last_value,
 current_pgnet_last_value<greatest(coalesce(highest_immutable_request_id,0),coalesce(highest_import_request_id,0),
          coalesce(highest_recent_http_response_id,0),coalesce(highest_pending_http_id,0)) AS pgnet_sequence_behind_history,
 CASE WHEN bg1<>'current' THEN 'STOP_BG1'
 WHEN blocked_cycles>0 THEN 'STOP_CHDE_OWNER_SCHEDULER_REVIEW'
 WHEN expired_leases>0 THEN 'STOP_EXPIRED_RESEARCH_ATTEMPT_RECLAIM'
 WHEN fresh_projections=0 THEN 'STOP_NO_FRESH_PUBLIC_PROJECTION'
 ELSE 'RECHECK_FULL_PROJECTION_LEGAL_PROOF' END AS chde_gate,
 CASE WHEN qualified_sources<>total_sources THEN 'STOP_AT_RESEARCH_ONLY_CANNOT_AUTO_PUBLISH'
 WHEN current_pgnet_last_value<greatest(coalesce(highest_immutable_request_id,0),coalesce(highest_import_request_id,0),
          coalesce(highest_recent_http_response_id,0),coalesce(highest_pending_http_id,0)) THEN 'STOP_AT_PGNET_SEQUENCE_BEHIND_HISTORY'
 ELSE 'RECHECK_AT_DOCUMENT_MA1_HRS2_LEGAL' END AS at_gate,
 false AS grants_publication,false AS modifies_production
FROM state;
ROLLBACK;
