-- READ ONLY / DEV yfvbxvijcorffwxbxahl / natural after-restart evidence.
-- Three values are pinned to the actual 2026-11-21T15:57:15.851678Z BEFORE snapshot.
-- This performs no HTTP, source dispatch, sequence allocation or manual audit.
-- Before max=1826/called means minimum_next=1827 only if the actual snapshot agrees.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
WITH before_values AS MATERIALIZED (
 SELECT '2026-11-21 13:01:42.863753+00'::timestamptz AS postmaster_started_at,
  '1826'::bigint AS historical_high_water,
  '1827'::bigint AS minimum_next_request_id
), expected(schema_name,table_name,column_name,persistence) AS (VALUES
 ('jetnity_dev_import_scheduler','dispatches_v1','net_request_id','p'),
 ('jetnity_dev_import_scheduler','preview_dispatches_v1','net_request_id','p'),
 ('official_v3_at_source_watch_private','reads_v1','request_id','p'),
 ('official_v3_source_renewal_private','observations_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v1','request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v2','pgnet_request_id','p'),
 ('jetnity_followup_source_monitor_private','items_v3','request_id','p'),
 ('jetnity_global_source_monitor_private','requests_v1','request_id','p'),
 ('jetnity_usagov_fallback_private','original_v1','request_id','p'),
 ('jetnity_usagov_watch_private','requests_v1','request_id','p'),
 ('jetnity_usagov_watch_private','observations_v1','request_id','p'),
 ('jetnity_source_dispatch_private','requests_v1','request_id','p'),
 ('jetnity_source_dispatch_private','observations_v1','request_id','p'),
 ('supabase_functions','hooks','request_id','p'),
 ('net','http_request_queue','id','u'),
 ('net','_http_response','id','u')
), ids AS MATERIALIZED (
 SELECT 'jetnity_dev_import_scheduler.dispatches_v1.net_request_id'::text AS path,net_request_id AS request_id FROM jetnity_dev_import_scheduler.dispatches_v1
 UNION ALL
 SELECT 'jetnity_dev_import_scheduler.preview_dispatches_v1.net_request_id'::text AS path,net_request_id AS request_id FROM jetnity_dev_import_scheduler.preview_dispatches_v1
 UNION ALL
 SELECT 'official_v3_at_source_watch_private.reads_v1.request_id'::text AS path,request_id AS request_id FROM official_v3_at_source_watch_private.reads_v1
 UNION ALL
 SELECT 'official_v3_source_renewal_private.observations_v1.request_id'::text AS path,request_id AS request_id FROM official_v3_source_renewal_private.observations_v1
 UNION ALL
 SELECT 'jetnity_followup_source_monitor_private.items_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_followup_source_monitor_private.items_v1
 UNION ALL
 SELECT 'jetnity_followup_source_monitor_private.items_v2.pgnet_request_id'::text AS path,pgnet_request_id AS request_id FROM jetnity_followup_source_monitor_private.items_v2
 UNION ALL
 SELECT 'jetnity_followup_source_monitor_private.items_v3.request_id'::text AS path,request_id AS request_id FROM jetnity_followup_source_monitor_private.items_v3
 UNION ALL
 SELECT 'jetnity_global_source_monitor_private.requests_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_global_source_monitor_private.requests_v1
 UNION ALL
 SELECT 'jetnity_usagov_fallback_private.original_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_usagov_fallback_private.original_v1
 UNION ALL
 SELECT 'jetnity_usagov_watch_private.requests_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_usagov_watch_private.requests_v1
 UNION ALL
 SELECT 'jetnity_usagov_watch_private.observations_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_usagov_watch_private.observations_v1
 UNION ALL
 SELECT 'jetnity_source_dispatch_private.requests_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_source_dispatch_private.requests_v1
 UNION ALL
 SELECT 'jetnity_source_dispatch_private.observations_v1.request_id'::text AS path,request_id AS request_id FROM jetnity_source_dispatch_private.observations_v1
 UNION ALL
 SELECT 'supabase_functions.hooks.request_id'::text AS path,request_id AS request_id FROM supabase_functions.hooks
 UNION ALL
 SELECT 'net.http_request_queue.id'::text AS path,id AS request_id FROM net.http_request_queue
 UNION ALL
 SELECT 'net._http_response.id'::text AS path,id AS request_id FROM net._http_response
), preserved_prefix AS MATERIALIZED (
 SELECT e.schema_name||'.'||e.table_name||'.'||e.column_name AS path,
  count(i.request_id)::text AS reserved_rows,
  encode(sha256(convert_to(coalesce(string_agg(i.request_id::text,'|' ORDER BY i.request_id),''),'UTF8')),'hex') AS reserved_ids_sha256
 FROM expected e CROSS JOIN before_values b LEFT JOIN ids i
  ON i.path=e.schema_name||'.'||e.table_name||'.'||e.column_name AND i.request_id<=b.historical_high_water
 WHERE e.persistence='p'
 GROUP BY e.schema_name,e.table_name,e.column_name
), after_at AS MATERIALIZED (
 SELECT r.* FROM official_v3_at_source_watch_private.reads_v1 r CROSS JOIN before_values b
 WHERE r.requested_at>=pg_postmaster_start_time()
  AND r.request_id>=b.minimum_next_request_id
 ORDER BY r.requested_at,r.source_id LIMIT 30
), after_full_proof AS MATERIALIZED (
 SELECT r.* FROM official_v3_guard_private.runs_v1 r
 JOIN official_v3_guard_private.state_v1 s ON s.singleton AND r.generation=s.generation
  AND r.due_at=s.last_due AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
 WHERE r.outcome='complete' AND r.proof_started_at>=pg_postmaster_start_time()
)
SELECT jsonb_build_object(
 'schema','dev-normal-restart-natural-proof-v1','observed_at',clock_timestamp(),
 'postmaster_started_at',pg_postmaster_start_time(),
 'restart_observed',(SELECT pg_postmaster_start_time()>b.postmaster_started_at FROM before_values b),
 'before_values',(SELECT to_jsonb(b)||jsonb_build_object('historical_high_water',b.historical_high_water::text,
  'minimum_next_request_id',b.minimum_next_request_id::text) FROM before_values b),
 'old_durable_reserved_id_prefixes',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.path COLLATE "C") FROM preserved_prefix p),
 'new_observed_id_paths',(SELECT coalesce(jsonb_agg(to_jsonb(n)||jsonb_build_object('min_id',n.min_id::text,'max_id',n.max_id::text)
  ORDER BY n.path),'[]'::jsonb) FROM (SELECT i.path,count(*)::text AS rows,min(i.request_id) AS min_id,max(i.request_id) AS max_id
   FROM ids i CROSS JOIN before_values b WHERE i.request_id>=b.minimum_next_request_id GROUP BY i.path) n),
 'after_start_at_requests',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'batch_id',r.batch_id::text,'source_id',r.source_id,'request_id',r.request_id::text,'requested_at',r.requested_at,
   'response_count_for_id',(SELECT count(*) FROM net._http_response n WHERE n.id=r.request_id),
   'responses_not_before_request',(SELECT coalesce(jsonb_agg(jsonb_build_object('created',n.created,'status_code',n.status_code,
    'timed_out',n.timed_out,'no_error',n.error_msg IS NULL,
    'pgnet_content_utf8_sha256',encode(sha256(convert_to(n.content,'UTF8')),'hex')) ORDER BY n.created),'[]'::jsonb)
    FROM net._http_response n WHERE n.id=r.request_id AND n.created>=r.requested_at),
   'queued_now',(SELECT count(*) FROM net.http_request_queue q WHERE q.id=r.request_id)
  ) ORDER BY r.requested_at,r.source_id),'[]'::jsonb) FROM after_at r),
 'actual_at_http_responses_after_restart',(SELECT count(*) FROM after_at r JOIN net._http_response n
  ON n.id=r.request_id AND n.created>=r.requested_at
  WHERE n.status_code IS NOT NULL AND NOT coalesce(n.timed_out,false) AND n.error_msg IS NULL),
 'actual_new_http_responses_after_restart',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'request_id',n.id::text,'created',n.created,'status_code',n.status_code,'timed_out',n.timed_out,
   'no_error',n.error_msg IS NULL,'content_type',n.content_type,
   'body_bytes',octet_length(convert_to(n.content,'UTF8')),
   'body_sha',encode(sha256(convert_to(n.content,'UTF8')),'hex'),
   'response_rows_for_id',(SELECT count(*) FROM net._http_response h WHERE h.id=n.id),
   'durable_id_paths',(SELECT coalesce(jsonb_agg(DISTINCT i.path ORDER BY i.path),'[]'::jsonb)
     FROM ids i JOIN expected e ON i.path=e.schema_name||'.'||e.table_name||'.'||e.column_name
     WHERE i.request_id=n.id AND e.persistence='p')) ORDER BY n.created,n.id),'[]'::jsonb)
   FROM (SELECT h.* FROM net._http_response h CROSS JOIN before_values b
     WHERE h.id>=b.minimum_next_request_id AND h.created>=pg_postmaster_start_time()
     ORDER BY h.created,h.id LIMIT 20)n),
 'bg1_public_status',public.official_v3_guard_alarm_status_v1(),
 'bg1_current_complete_started_after_restart',EXISTS(SELECT 1 FROM after_full_proof),
 'bg1_matching_current_complete_runs',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM after_full_proof r),
 'cron_runs_covering_current_complete_proof',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'runid',d.runid::text,'jobid',d.jobid::text,'job_name',j.jobname,'schedule',j.schedule,'status',d.status,
   'start_time',d.start_time,'end_time',d.end_time,
   'command_sha',encode(sha256(convert_to(j.command,'UTF8')),'hex')) ORDER BY d.runid),'[]'::jsonb)
  FROM cron.job_run_details d JOIN cron.job j ON j.jobid=d.jobid
  WHERE d.status='succeeded' AND d.start_time>=pg_postmaster_start_time()
   AND j.jobname='jetnity-official-truth-dev-guard-v1' AND j.active AND j.schedule='*/5 * * * *'
   AND j.username='postgres' AND d.username='postgres'
   AND j.database=current_database() AND d.database=current_database()
   AND j.command='SET statement_timeout=''30s''; SET lock_timeout=''25s''; SELECT official_v3_guard_private.audit_v1();'
   AND d.command=j.command
   AND EXISTS(SELECT 1 FROM after_full_proof r WHERE d.start_time<=r.proof_started_at
    AND r.started_at<=r.proof_started_at AND r.proof_started_at<=r.finished_at AND r.finished_at<=d.end_time
    AND r.due_at=date_bin(interval '5 minutes',d.start_time,'2000-01-01 00:00:00+00'::timestamptz))),
 'v8_catalog_exact',(SELECT v.catalog=official_v3_guard_private.catalog_status_v1()
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton),
 'this_query_proves_positive_renewal',false,'this_query_proves_crash_or_failover',false
) AS natural_restart_proof;
ROLLBACK;
