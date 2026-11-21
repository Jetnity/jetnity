-- DEV yfvbxvijcorffwxbxahl ONLY. Reuse exact bytes BEFORE and AFTER a normal restart.
-- READ ONLY: no allocation, HTTP call, DDL, advisory/table lock or status write.
-- Capture the complete returned JSON and SQL SHA independently at each phase.
-- Sequences are not MVCC snapshots; natural allocation can advance during reads.
-- Only durable ID-prefix digests are preservation evidence. Queue/response rows
-- are operational and may drain/expire. Do not require them to stay identical.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
WITH
 expected(schema_name,table_name,column_name,persistence) AS (VALUES
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
 ),
 actual AS (
  SELECT n.nspname::text schema_name,c.relname::text table_name,a.attname::text column_name,c.relpersistence::text persistence
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
  WHERE c.relkind IN('r','p') AND c.relpersistence IN('p','u')
   AND n.nspname NOT IN('pg_catalog','information_schema')
   AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='pg_catalog.int8'::pg_catalog.regtype
   AND (a.attname ~ '(^|_)request_id$'
    OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
 ),
 differences AS (
  (SELECT * FROM expected EXCEPT SELECT * FROM actual)
  UNION ALL (SELECT * FROM actual EXCEPT SELECT * FROM expected)
 ),
 ids AS MATERIALIZED (
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
 ),
 ledger AS MATERIALIZED (
  SELECT e.schema_name||'.'||e.table_name||'.'||e.column_name AS path,e.persistence,
   count(i.request_id)::text AS reserved_rows,max(i.request_id) AS max_id,
   count(i.request_id) FILTER(WHERE i.request_id<1)::text AS invalid_nonpositive_ids,
   encode(sha256(convert_to(coalesce(string_agg(i.request_id::text,'|' ORDER BY i.request_id),''),'UTF8')),'hex') AS reserved_ids_sha256
  FROM expected e LEFT JOIN ids i ON i.path=e.schema_name||'.'||e.table_name||'.'||e.column_name
  GROUP BY e.schema_name,e.table_name,e.column_name,e.persistence
 ),
 own_value AS MATERIALIZED (
  SELECT last_value,is_called,log_cnt FROM jetnity_pgnet_allocator_private.http_request_id_v1
 ),
 native_value AS MATERIALIZED (
  SELECT last_value,is_called,log_cnt FROM net.http_request_queue_id_seq
 ),
 live_catalog AS MATERIALIZED (SELECT official_v3_guard_private.catalog_status_v1() AS value),
 guards AS MATERIALIZED (
  SELECT to_jsonb(s) AS state FROM official_v3_guard_private.state_v1 s WHERE singleton
 )
SELECT jsonb_build_object(
 'schema','dev-normal-restart-snapshot-v1',
 'observed_at',clock_timestamp(),'snapshot_transaction_at',transaction_timestamp(),
 'database',current_database(),'current_user',current_user,'session_user',session_user,
 'postgres_version',current_setting('server_version_num'),
 'read_only',current_setting('transaction_read_only'),
 'postmaster_started_at',pg_postmaster_start_time(),'is_recovery',pg_is_in_recovery(),
 'session_replication_role',current_setting('session_replication_role'),
 'dev_markers_present',to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
  AND to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL,
 'production_markers_absent',to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
  AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
  AND to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL,
 'id_inventory_exact',(SELECT count(*)=16 FROM actual) AND NOT EXISTS(SELECT 1 FROM differences),
 'inventory_differences',(SELECT coalesce(jsonb_agg(to_jsonb(d)),'[]'::jsonb) FROM differences d),
 'historical_high_water',(SELECT coalesce(max(request_id),0)::text FROM ids),
 'minimum_next_new_request_id',(SELECT greatest(
   coalesce((SELECT max(request_id)::numeric+1 FROM ids),1),
   o.last_value::numeric+CASE WHEN o.is_called THEN 1 ELSE 0 END)::text FROM own_value o),
 'id_ledgers',(SELECT jsonb_agg(to_jsonb(l)||jsonb_build_object('max_id',l.max_id::text) ORDER BY l.path COLLATE "C") FROM ledger l),
 'own_sequence',(SELECT jsonb_build_object('last_value',o.last_value::text,'is_called',o.is_called,'log_cnt',o.log_cnt::text,
   'oid',c.oid::text,'relfilenode',c.relfilenode::text,'owner',pg_get_userbyid(c.relowner),
   'persistence',c.relpersistence,'acl',c.relacl::text,'type',format_type(s.seqtypid,NULL),
   'increment',s.seqincrement::text,'cache',s.seqcache::text,'min',s.seqmin::text,'max',s.seqmax::text,'cycle',s.seqcycle)
  FROM own_value o CROSS JOIN pg_catalog.pg_class c JOIN pg_catalog.pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass),
 'legacy_sequence',(SELECT jsonb_build_object('last_value',n.last_value::text,'is_called',n.is_called,'log_cnt',n.log_cnt::text,
   'owner',pg_get_userbyid(c.relowner),'persistence',c.relpersistence)
  FROM native_value n CROSS JOIN pg_catalog.pg_class c WHERE c.oid='net.http_request_queue_id_seq'::pg_catalog.regclass),
 'queue_trigger',(SELECT coalesce(jsonb_agg(jsonb_build_object('oid',t.oid::text,'name',t.tgname,'enabled',t.tgenabled,
   'type',t.tgtype,'definition_sha',encode(sha256(convert_to(pg_get_triggerdef(t.oid,true),'UTF8')),'hex')) ORDER BY t.oid),'[]'::jsonb)
  FROM pg_catalog.pg_trigger t WHERE t.tgrelid='net.http_request_queue'::pg_catalog.regclass),
 'helper',(SELECT jsonb_build_object('oid',p.oid::text,'owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,
   'config',p.proconfig,'acl',p.proacl::text,'prosrc_sha',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),
   'definition_sha',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) FROM pg_catalog.pg_proc p
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),
 'v8',(SELECT jsonb_build_object('baseline_sha',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object(
   'proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
   'catalog_exact',v.catalog=(SELECT value FROM live_catalog),'sealed_catalog_sha',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
   'actual_catalog_sha',(SELECT encode(sha256(convert_to(value::text,'UTF8')),'hex') FROM live_catalog),
   'required_generation',v.required_generation::text,'proof_not_before',v.proof_not_before)
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton),
 'v7_baseline_sha',(SELECT encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object(
   'proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton),
 'publisher_definition_sha',encode(sha256(convert_to(pg_get_functiondef(
  'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'at_originals',(SELECT jsonb_agg(jsonb_build_object('source_id',o.source_id,'actual_body_sha',encode(sha256(o.original_body),'hex'),
   'stored_digest_matches',o.body_digest=encode(sha256(o.original_body),'hex'),'disposition',o.disposition,
   'importable',o.importable,'accepted_fact_count',o.accepted_fact_count) ORDER BY o.source_id COLLATE "C")
  FROM official_v3_at_private.whole_originals_v2 o),
 'facts',(SELECT jsonb_build_object('rows',count(*)::text,'history_sha',encode(sha256(convert_to(
   coalesce(string_agg(to_jsonb(f)::text,'|' ORDER BY fact_id),''),'UTF8')),'hex')) FROM official_v3_source_renewal_private.facts_v1 f),
 'owner_receipts',(SELECT jsonb_build_object('rows',count(*)::text,'history_sha',encode(sha256(convert_to(
   coalesce(string_agg(to_jsonb(o)::text,'|' ORDER BY operation_id),''),'UTF8')),'hex')) FROM official_v3_guard_private.owner_operations_v1 o),
 'cron_config_sha',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(j)::text,'|' ORDER BY jobid),''),'UTF8')),'hex') FROM cron.job j),
 'cron_jobs',(SELECT jsonb_agg(jsonb_build_object('jobid',j.jobid::text,'name',j.jobname,'schedule',j.schedule,
   'active',j.active,'username',j.username,'command_sha',encode(sha256(convert_to(j.command,'UTF8')),'hex')) ORDER BY j.jobid) FROM cron.job j),
 'bg1_public_status',public.official_v3_guard_alarm_status_v1(),
 'bg1_state',(SELECT state FROM guards),
 'recent_bg1_runs',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.started_at DESC),'[]'::jsonb)
   FROM (SELECT * FROM official_v3_guard_private.runs_v1 ORDER BY started_at DESC LIMIT 3) r),
 'recent_cron_runs',(SELECT coalesce(jsonb_agg(jsonb_build_object('runid',d.runid::text,'jobid',d.jobid::text,
   'status',d.status,'start_time',d.start_time,'end_time',d.end_time) ORDER BY d.start_time DESC),'[]'::jsonb)
   FROM (SELECT * FROM cron.job_run_details ORDER BY start_time DESC NULLS LAST LIMIT 12) d),
 'queue',(SELECT jsonb_build_object('rows',count(*)::text,'min_id',min(id)::text,'max_id',max(id)::text) FROM net.http_request_queue),
 'queue_lock_waiters',(SELECT coalesce(jsonb_agg(jsonb_build_object('pid',l.pid,'mode',l.mode,'granted',l.granted)),'[]'::jsonb)
  FROM pg_catalog.pg_locks l WHERE l.relation='net.http_request_queue'::pg_catalog.regclass AND NOT l.granted),
 'transactions_older_30s',(SELECT coalesce(jsonb_agg(jsonb_build_object('pid',a.pid,'user',a.usename,'application',a.application_name,
   'backend_type',a.backend_type,'state',a.state,'xact_start',a.xact_start,'query_start',a.query_start,
   'wait_type',a.wait_event_type,'wait_event',a.wait_event,'query_sha',encode(sha256(convert_to(coalesce(a.query,''),'UTF8')),'hex')) ORDER BY a.xact_start),'[]'::jsonb)
  FROM pg_catalog.pg_stat_activity a WHERE a.datname=current_database() AND a.pid<>pg_backend_pid()
   AND a.xact_start<clock_timestamp()-interval '30 seconds'),
 'latest_at_requests',(SELECT coalesce(jsonb_agg(jsonb_build_object('batch_id',r.batch_id::text,'source_id',r.source_id,
   'request_id',r.request_id::text,'requested_at',r.requested_at) ORDER BY r.requested_at DESC,r.source_id),'[]'::jsonb)
  FROM (SELECT * FROM official_v3_at_source_watch_private.reads_v1 ORDER BY requested_at DESC,source_id LIMIT 9) r)
) AS restart_snapshot;
ROLLBACK;
