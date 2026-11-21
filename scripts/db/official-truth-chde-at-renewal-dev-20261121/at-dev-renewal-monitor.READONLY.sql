-- Unexecuted review query. READ ONLY; no HTTP request, renewal or Owner session.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
WITH latest AS (
 SELECT batch_id,requested_at FROM official_v3_at_source_watch_private.batches_v1
 ORDER BY batch_id DESC LIMIT 2
), observed AS (
 SELECT b.batch_id,b.requested_at,count(r.*) AS receipts,
  count(*) FILTER(WHERE r.state='unchanged_exact') AS unchanged_exact,
  count(*) FILTER(WHERE r.state='unchanged_asset_version_only') AS asset_only,
  count(*) FILTER(WHERE r.state='pending') AS pending,
  count(*) FILTER(WHERE r.state='changed') AS changed,
  count(*) FILTER(WHERE r.state='unavailable') AS unavailable,
  min(r.request_id) AS first_http_id,max(r.request_id) AS last_http_id,
  min(r.observed_at) AS earliest_response,max(r.observed_at) AS latest_response
 FROM latest b LEFT JOIN official_v3_at_source_watch_private.reads_v1 r USING(batch_id)
 GROUP BY b.batch_id,b.requested_at
), qualifications AS (
 SELECT count(*) AS original_count,
  count(*) FILTER(WHERE disposition='RESEARCH_ONLY' OR NOT importable OR accepted_fact_count<=0) AS unqualified,
  count(*) FILTER(WHERE body_digest=encode(sha256(original_body),'hex')) AS exact_originals
 FROM official_v3_at_private.whole_originals_v2
), facts AS (
 SELECT count(*) AS total,count(*) FILTER(WHERE expires_at>clock_timestamp()) AS unexpired,
  max(verified_at) AS latest_fact_verified_at,max(expires_at) AS last_fact_expiry,
  encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex') AS all_fact_history_digest
 FROM official_v3_source_renewal_private.facts_v1 f
)
SELECT public.official_v3_guard_alarm_status_v1()->>'status' AS bg1,
 official_v3_at_source_watch_private.status_v1() AS source_monitor,
 (SELECT jsonb_agg(to_jsonb(o) ORDER BY batch_id DESC) FROM observed o) AS latest_two_real_source_batches,
 (SELECT to_jsonb(q) FROM qualifications q) AS original_qualification,
 (SELECT to_jsonb(f) FROM facts f) AS fact_state,
 (SELECT jsonb_agg(jsonb_build_object('batch',b.source_batch_id,'outcome',b.outcome,
  'requested',b.requested_at,'sealed',b.sealed_at) ORDER BY b.source_batch_id DESC)
  FROM official_v3_source_renewal_private.batches_v1 b
  WHERE b.destination_code='AT' AND b.source_batch_id IN (SELECT batch_id FROM latest)) AS sealed_source_batches,
 false AS new_source_run_started,false AS positive_renewal_proven;
ROLLBACK;
