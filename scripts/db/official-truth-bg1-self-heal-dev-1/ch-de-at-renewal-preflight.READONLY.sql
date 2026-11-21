-- Independent Production CH→DE and AT renewal diagnosis, only SELECTs.
-- No database mutation or token/owner state. Run unchanged, no CLI parameters.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
WITH
 request_ids AS (
  SELECT coalesce(max(request_id),0)::bigint AS max_persisted_id,
   count(*)::bigint AS persisted_count
  FROM official_v3_at_production_private.watch_requests_v1
 ),
 net_sequence AS (
  SELECT last_value::bigint AS last_allocated
  FROM pg_sequences WHERE schemaname='net' AND sequencename='http_request_queue_id_seq'
 ),
 batches AS (
  SELECT max(started_at) AS most_recent_start
  FROM official_v3_at_production_private.watch_batches_v1
 ),
 observations AS (
  SELECT max(observed_at) AS most_recent_observation
  FROM official_v3_at_production_private.watch_observations_v1
 ),
 ch_de_cycle AS (
  SELECT state,last_status,phase_attempts,created_at,finished_at
  FROM jetnity_prod_import_scheduler.cycles_v1
  ORDER BY created_at DESC LIMIT 1
 ),
 st AS (
  SELECT enabled,status,next_due_at,remaining_starts,remaining_operations
  FROM jetnity_prod_import_scheduler.state_v1 WHERE singleton
 ),
 projection AS (
  SELECT count(*) FILTER (WHERE (p.record->>'expiresAt')::timestamptz > clock_timestamp())::integer
     AS unexpired
  FROM official_v3_result_private.projections_v1 p
 )
SELECT
 current_setting('server_version_num')::integer/10000=17 AS pg17,
 (SELECT status FROM st) AS ch_de_scheduler_status,
 (SELECT next_due_at < clock_timestamp() FROM st) AS ch_de_due_is_past,
 (SELECT state FROM ch_de_cycle) AS ch_de_latest_cycle_state,
 (SELECT last_status FROM ch_de_cycle) AS ch_de_latest_cycle_outcome,
 (SELECT phase_attempts FROM ch_de_cycle) AS ch_de_phase_attempts,
 (SELECT unexpired FROM projection) AS ch_de_unexpired_projection_count,
 (SELECT last_allocated FROM net_sequence) AS net_sequence_last_allocated,
 (SELECT max_persisted_id FROM request_ids) AS at_max_persisted_request_id,
 (SELECT persisted_count FROM request_ids) AS at_persisted_requests_count,
 (SELECT last_allocated<max_persisted_id FROM net_sequence CROSS JOIN request_ids) AS at_request_id_collision_risk,
 (SELECT greatest(last_allocated,max_persisted_id)+1 FROM net_sequence CROSS JOIN request_ids) AS id_lower_bound_only_not_a_repair,
 (SELECT to_char(most_recent_start AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS') FROM batches) AS latest_at_request_utc,
 (SELECT to_char(most_recent_observation AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS') FROM observations) AS latest_at_observation_utc,
 public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
 FALSE AS authorizes_sequence_repair,
 FALSE AS authorizes_import_restart,
 FALSE AS authorizes_visa_publication;
ROLLBACK;
