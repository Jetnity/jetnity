-- Fresh operational READ ONLY authorized by the current owner request; no installation/retry/source/Owner action.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
DO $postcommit_pinned_read_context$
DECLARE item record;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_WRONG_INSTALLED_CONTEXT' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','66612df9bbc2ba0aeb016f97c5c245c76f176e13c02bd1150c5cc618c5363601'),
  ('official_v3_guard_private.assert_catalog_v1()','4d9f578d59ef1f998cf9a26385c078eaacd8dbd375629f965d8feaeb46582eb8'),
  ('official_v3_guard_private.require_open_v1()','de352dc414b5a5545cc0cb0edc245ed2312777d73b250adcdc9b93ca804ebcae'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('official_v3_at_production_private.renew_ch_v1()','572a243b45785800f67f372c0667397d448e1eea5769c74065d4709a59e3b562')
 ) expected(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=to_regprocedure(item.signature)) IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_READBACK_CHANGED_DEFINITION: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 
 -- Check the unchanged calling/authority contract BEFORE the first guard invocation.
 -- Full expected pg_get_functiondef SHA is derived by changing only the body of
 -- native predecessor bytes whose complete SHA matches actual 02. This also binds
 -- STRICT, PARALLEL, LEAKPROOF, set-return and every rendered header attribute.
 -- ACL/config/owner metadata are checked separately; no unknown live header is adopted.
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.catalog_status_v1()','sql','postgres',true,'s','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1','d80009f6db49c88fb446ee7ce140abafbfe35005e07db453b83b10c068964adf'),
 ('official_v3_guard_private.assert_catalog_v1()','plpgsql','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','51527fcf925bb0314187d34c38796bb376230f44e4f36ae1801624a4b9141360'),
 ('official_v3_guard_private.require_open_v1()','plpgsql','postgres',true,'v','bigint','8d7f7dc66cd0965d575cf544d4f9a773c46bda7374851b88fe8da42ea59113f2','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','a83142cfd6e51926305171d60f41042792d249d7a4a92ddb7966c485c4dc526b'),
 ('public.official_v3_guard_alarm_status_v1()','plpgsql','postgres',true,'v','jsonb','c8789f4263f3a141a57ef770b25307024c51c4718475db91baa4af8dcd6782f4','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','484b9519d6fa2129c9fbaa916732fb93423368c4bedafcf448534f53b942239b'),
 ('official_v3_at_production_private.renew_ch_v1()','plpgsql','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1','9d0857cdf2a8942af52409043eac78929d288e46400d17e70834e7a2455bbc9e')
 ) expected(signature,language_name,owner_name,is_definer,volatility,result_type,acl_sha,config_sha,native_definition_sha) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
   WHERE p.oid=to_regprocedure(item.signature) AND l.lanname=item.language_name
   AND pg_get_userbyid(p.proowner)=item.owner_name AND p.prosecdef=item.is_definer
   AND p.provolatile::text=item.volatility AND pg_get_function_result(p.oid)=item.result_type
   AND p.prokind='f' AND p.pronargs=0 AND p.pronargdefaults=0 AND p.provariadic=0 AND NOT p.proretset
   AND p.proargdefaults IS NULL AND p.proargnames IS NULL AND p.proallargtypes IS NULL AND p.proargmodes IS NULL
   AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=item.native_definition_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex')=item.acl_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex')=item.config_sha)
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_NEW_FUNCTION_HEADER_OR_AUTHORITY_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;

 PERFORM official_v3_guard_private.assert_catalog_v1();
END $postcommit_pinned_read_context$;

DO $operational_read_bound_installation$
DECLARE item record; n bigint;
BEGIN
 IF (SELECT encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
 FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton)
 IS DISTINCT FROM 'c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4'
 THEN RAISE EXCEPTION 'OPERATIONAL_READ_INSTALLATION_BINDING_CHANGED'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_at_production_private.enqueue_v1()','3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90'),
 ('official_v3_at_production_private.collect_v1()','3e681172f296ba3c4202dbf8108552201f613f8de345e6c339288f8680683422'),
 ('jetnity_prod_import_scheduler.tick_v1()','57b101b3551b64e95bc68e6650d642ba34829fccb84bc081b7ad606879c176fe')
 ) x(signature,digest) LOOP
  IF (SELECT encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')
    FROM pg_proc p WHERE p.oid=to_regprocedure(item.signature)) IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'OPERATIONAL_READ_DEFINITION_CHANGED: %',item.signature; END IF;
 END LOOP;
 FOR item IN SELECT * FROM (VALUES
 ('official_v3_at_production_private.watch_batches_v1',10000),
 ('official_v3_at_production_private.watch_requests_v1',10000),
 ('official_v3_at_production_private.watch_observations_v1',10000),
 ('official_v3_at_production_private.source_pins_v1',3),
 ('official_v3_at_production_private.first_originals_v1',3),
 ('official_v3_at_production_private.ch_visa_facts_v1',1000),
 ('jetnity_prod_import_scheduler.cycles_v1',1000),
 ('jetnity_prod_import_scheduler.dispatches_v1',10000)
 ) x(relation_name,row_cap) LOOP
  IF to_regclass(item.relation_name) IS NULL THEN RAISE EXCEPTION 'OPERATIONAL_READ_REQUIRED_OBJECT_MISSING: %',item.relation_name; END IF;
  EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM %s LIMIT %s) bounded',to_regclass(item.relation_name),item.row_cap+1) INTO n;
  IF n>item.row_cap THEN RAISE EXCEPTION 'OPERATIONAL_READ_ROW_CAP: %',item.relation_name; END IF;
 END LOOP;
 IF NOT has_table_privilege(current_user,'cron.job_run_details','SELECT')
 THEN RAISE EXCEPTION 'OPERATIONAL_READ_CRON_HISTORY_UNAVAILABLE'; END IF;
END $operational_read_bound_installation$;
WITH
p AS MATERIALIZED (
 SELECT statement_timestamp() AS observed_at,proof_not_before AS cutoff,required_generation
 FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton
),
bgstate AS MATERIALIZED (SELECT s.* FROM official_v3_guard_private.state_v1 s WHERE singleton),
cron_rows AS MATERIALIZED (
 SELECT x.jobid,c.runid,c.start_time,c.end_time,c.status,left(c.return_message,200) AS return_message,
 encode(sha256(convert_to(c.command,'UTF8')),'hex') AS command_sha256,c.database,c.username
 FROM (VALUES (2::bigint),(4::bigint),(5::bigint),(6::bigint),(7::bigint)) x(jobid)
 CROSS JOIN LATERAL (SELECT * FROM cron.job_run_details j WHERE j.jobid=x.jobid ORDER BY j.runid DESC LIMIT 3) c
),
fresh_proof AS MATERIALIZED (
 SELECT r.*
 FROM bgstate s JOIN official_v3_guard_private.runs_v1 r
  ON r.generation=s.generation AND r.due_at=s.last_due AND r.started_at=s.last_started
  AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished CROSS JOIN p
 WHERE r.outcome='complete' AND s.generation>=p.required_generation
  AND r.proof_started_at>=p.cutoff AND s.incident_generation=s.resumed_generation
  AND s.last_finished<=s.last_started+interval '30 seconds'
  AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
  AND p.observed_at>=s.last_finished AND p.observed_at<s.valid_until
),
recent_bg_runs AS MATERIALIZED (
 SELECT r.* FROM official_v3_guard_private.runs_v1 r ORDER BY r.due_at DESC LIMIT 4
),
latest_at_batches AS MATERIALIZED (
 SELECT batch_id,started_at FROM official_v3_at_production_private.watch_batches_v1 ORDER BY batch_id DESC LIMIT 3
),
at_raw AS MATERIALIZED (
 SELECT b.batch_id,b.started_at,r.source_id,r.request_id,r.requested_at,
 o.observed_at AS collected_at,o.source_status,o.bytes AS collector_bytes,o.body_sha AS collector_body_sha,o.http_status AS collector_http_status,
 n.created AS response_created,n.status_code AS response_http_status,n.timed_out,
 left(n.error_msg,200) AS response_error,n.content_type,octet_length(convert_to(n.content,'UTF8')) AS response_bytes,
 CASE WHEN octet_length(convert_to(n.content,'UTF8')) BETWEEN 1 AND 1048576
 THEN encode(sha256(convert_to(n.content,'UTF8')),'hex') END AS response_body_sha,
 CASE WHEN octet_length(convert_to(n.content,'UTF8')) BETWEEN 1 AND 1048576
 THEN position('radware bot manager captcha' IN lower(n.content))>0
   OR position('access denied' IN lower(n.content))>0 OR position('accesso negato' IN lower(n.content))>0 END AS blocked_page_detected,
 (SELECT count(*) FROM net._http_response nx WHERE nx.id=r.request_id) AS matching_response_rows,
 b.started_at>=p.cutoff AS batch_after_installation,
 r.requested_at>=p.cutoff AS request_after_installation,
 r.request_id>=1236 AS at_or_above_new_floor
 FROM latest_at_batches b CROSS JOIN p
 LEFT JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id)
 LEFT JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id,source_id)
 LEFT JOIN LATERAL (SELECT id,created,status_code,timed_out,error_msg,content_type,content
  FROM net._http_response nr WHERE nr.id=r.request_id ORDER BY created DESC LIMIT 1) n ON true
),
at_rows AS MATERIALIZED (
 SELECT a.*,
 coalesce(a.request_after_installation AND a.at_or_above_new_floor
  AND a.response_http_status=200 AND a.timed_out IS FALSE AND a.response_error IS NULL
  AND a.content_type~*'^text/html([; ]|$)' AND a.response_bytes BETWEEN 1 AND 1048576
  AND a.blocked_page_detected IS FALSE AND a.matching_response_rows=1
  AND a.source_status IN('unchanged_exact','unchanged_asset_version_only','changed')
  AND a.collector_http_status=200 AND a.collector_bytes=a.response_bytes AND a.collector_body_sha=a.response_body_sha
  AND a.requested_at<=a.response_created AND a.response_created<=a.collected_at
  AND a.collected_at<=p.observed_at,false) AS postinstall_http_and_collector_ok
 FROM at_raw a CROSS JOIN p
),
at_batch_summaries AS (
 SELECT batch_id,min(started_at) AS started_at,bool_and(batch_after_installation) AS after_installation,
 count(request_id) AS requests,count(DISTINCT source_id) AS distinct_sources,count(collected_at) AS observations,
 count(*) FILTER(WHERE postinstall_http_and_collector_ok) AS verified_transport_collector,
 count(*) FILTER(WHERE source_status='changed') AS changed,
 count(*) FILTER(WHERE source_status='unavailable') AS unavailable
 FROM at_rows GROUP BY batch_id
),
logical_requests AS MATERIALIZED (
 SELECT 'AT'::text AS producer,r.request_id AS id,r.requested_at AS requested_at
 FROM official_v3_at_production_private.watch_requests_v1 r CROSS JOIN p
 WHERE r.request_id>=1236 OR r.requested_at>=p.cutoff
 UNION ALL
 SELECT 'CH_DE',d.net_request_id,d.dispatched_at
 FROM jetnity_prod_import_scheduler.dispatches_v1 d CROSS JOIN p
 WHERE d.net_request_id>=1236 OR d.dispatched_at>=p.cutoff
),
id_collisions AS MATERIALIZED (SELECT id,count(*) AS occurrences FROM logical_requests GROUP BY id HAVING count(*)>1),
cycles AS MATERIALIZED (
 SELECT id,created_at,phase,state,phase_attempts,last_status,finished_at,published
 FROM jetnity_prod_import_scheduler.cycles_v1 ORDER BY id DESC LIMIT 5
),
cycle_details AS (
 SELECT c.*,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=c.id) AS dispatch_count,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=c.id AND d.processed_at IS NULL) AS pending_dispatches,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=c.id AND d.phase='start' AND d.http_status=200 AND d.outcome='queued') AS queued_starts,
 (SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=c.id AND d.phase='resume' AND d.http_status=503 AND d.outcome IN('unresolved','unavailable')) AS failed_resumes,
 (c.state='published' AND c.published>0 AND c.finished_at IS NOT NULL AND c.last_status='published'
  AND EXISTS(SELECT 1 FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id=c.id
   AND d.phase='resume' AND d.processed_at IS NOT NULL AND d.http_status=200 AND d.outcome='published')) AS correlated_published_finish
 FROM cycles c
),
dispatches AS MATERIALIZED (
 SELECT d.id,d.cycle_id,d.phase,d.dispatched_at,d.net_request_id,d.processed_at,d.http_status,d.outcome
 FROM jetnity_prod_import_scheduler.dispatches_v1 d WHERE d.cycle_id IN(SELECT id FROM cycles)
 ORDER BY d.id DESC LIMIT 32
),
dispatch_details AS (
 SELECT d.*,r.created AS retained_response_created,r.status_code AS retained_response_http_status,
 r.timed_out AS retained_response_timed_out,left(r.error_msg,200) AS retained_response_error
 FROM dispatches d LEFT JOIN LATERAL (SELECT created,status_code,timed_out,error_msg FROM net._http_response n
 WHERE n.id=d.net_request_id ORDER BY n.created DESC LIMIT 1) r ON true
),
payload AS (
SELECT jsonb_build_object(
 'result','PROD_HTTP_OPERATIONAL_FRESH_READBACK',
 'observed_at',p.observed_at,'read_only',current_setting('transaction_read_only')='on','postmaster_started_at',pg_postmaster_start_time(),
 'installed_successor_sha256','c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4',
 'proof_not_before',p.cutoff,'required_generation',p.required_generation,
 'bg1',jsonb_build_object(
  'status',public.official_v3_guard_alarm_status_v1(),
  'state',(SELECT to_jsonb(s) FROM bgstate s),
  'fresh_complete_state_run_count',(SELECT count(*) FROM fresh_proof),
  'fresh_complete_proof',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.generation) FROM fresh_proof r),
  'natural_cron_correlations',(SELECT count(*) FROM fresh_proof r JOIN cron_rows c ON c.jobid=2
   AND c.status='succeeded' AND c.database='postgres' AND c.username='postgres'
   AND c.command_sha256='8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863'
   AND c.start_time<=r.started_at AND c.end_time>=r.finished_at),
  'recent_runs',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.due_at DESC) FROM recent_bg_runs r),
  'recent_incidents',(SELECT jsonb_agg(to_jsonb(i) ORDER BY i.generation DESC) FROM
   (SELECT generation,due_at,reason,baseline_generation,detected_at FROM official_v3_guard_private.incidents_v1 ORDER BY generation DESC LIMIT 3) i)
 ),
 'allocator',jsonb_build_object(
  'own_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called) FROM jetnity_pgnet_allocator_private.http_request_id_v1),
  'own_sequence_logged',(SELECT relpersistence='p' FROM pg_class WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::regclass),
  'logical_request_count',(SELECT count(*) FROM logical_requests),
  'logical_distinct_ids',(SELECT count(DISTINCT id) FROM logical_requests),
  'logical_min_id',(SELECT min(id)::text FROM logical_requests),
  'logical_max_id',(SELECT max(id)::text FROM logical_requests),
  'new_requests_below_1236',(SELECT count(*) FROM logical_requests r WHERE r.requested_at>=p.cutoff AND r.id<1236),
  'logical_collision_groups',(SELECT count(*) FROM id_collisions),
  'collision_examples',(SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT id::text,occurrences FROM id_collisions ORDER BY id LIMIT 10) x),
  'producer_counts',(SELECT jsonb_agg(to_jsonb(x) ORDER BY producer) FROM
   (SELECT producer,count(*) AS requests,min(id)::text AS min_id,max(id)::text AS max_id FROM logical_requests GROUP BY producer) x),
  'retained_response_ids',(SELECT jsonb_build_object('rows',count(*),'distinct_ids',count(DISTINCT id),'min_id',min(id)::text,'max_id',max(id)::text)
   FROM net._http_response WHERE id>=1236),
  'queued_ids',(SELECT jsonb_build_object('rows',count(*),'distinct_ids',count(DISTINCT id),'min_id',min(id)::text,'max_id',max(id)::text)
   FROM net.http_request_queue WHERE id>=1236)
 ),
 'at',jsonb_build_object(
  'latest_batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY batch_id DESC) FROM at_batch_summaries b),
  'request_response_collector_rows',(SELECT jsonb_agg(to_jsonb(a) ORDER BY batch_id DESC,source_id) FROM at_rows a),
  'original_qualification',(SELECT jsonb_agg(jsonb_build_object('source_id',s.source_id,'research_only',s.research_only,'source_qualified',s.source_qualified,
    'original_present',o.source_id IS NOT NULL,'original_batch_id',o.batch_id,'original_stored_at',o.stored_at,'original_raw_sha',o.raw_sha,'original_raw_bytes',o.raw_bytes,
    'original_content_hash_valid',CASE WHEN o.raw_body IS NOT NULL AND octet_length(o.raw_body)<=1048576 THEN encode(sha256(o.raw_body),'hex')=o.raw_sha END,
    'legal_source_approved',o.legal_source_approved,'customer_rule_approved',o.customer_rule_approved) ORDER BY s.source_id)
   FROM official_v3_at_production_private.source_pins_v1 s LEFT JOIN official_v3_at_production_private.first_originals_v1 o USING(source_id)),
  'facts',(SELECT jsonb_build_object('total',count(*),'new_since_installation',count(*) FILTER(WHERE verified_at>=p.cutoff),
    'unexpired_now',count(*) FILTER(WHERE expires_at>p.observed_at AND verified_at<=p.observed_at),'last_verified_at',max(verified_at),'last_expires_at',max(expires_at))
   FROM official_v3_at_production_private.ch_visa_facts_v1),
  'next_batch_earliest',(SELECT max(started_at)+interval '50 minutes' FROM official_v3_at_production_private.watch_batches_v1),
  'display','derzeit nicht verfügbar'
 ),
 'ch_de',jsonb_build_object(
  'scheduler',(SELECT to_jsonb(s) FROM jetnity_prod_import_scheduler.state_v1 s WHERE singleton),
  'latest_cycles',(SELECT jsonb_agg(to_jsonb(c) ORDER BY id DESC) FROM cycle_details c),
  'latest_dispatches',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id DESC) FROM dispatch_details d),
  'blocked_cycles',(SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='blocked'),
  'active_cycles',(SELECT count(*) FROM jetnity_prod_import_scheduler.cycles_v1 WHERE state='active'),
  'dispatches_since_installation',(SELECT count(*) FROM jetnity_prod_import_scheduler.dispatches_v1 WHERE dispatched_at>=p.cutoff),
  'successful_new_finishes',(SELECT count(*) FROM cycle_details c WHERE c.correlated_published_finish AND c.finished_at>=p.cutoff),
  'current_public_projections',(SELECT count(*) FROM official_v3_result_private.projections_v1 v WHERE (v.record->>'expiresAt')::timestamptz>p.observed_at),
  'new_projections_since_installation',(SELECT count(*) FROM official_v3_result_private.projections_v1 WHERE published_at>=p.cutoff),
  'new_versions_since_installation',(SELECT count(*) FROM official_v3_result_private.versions_v1 WHERE committed_at>=p.cutoff),
  'new_execution_results_since_installation',(SELECT count(*) FROM official_v3_jobs_private.execution_results_v1 WHERE prepared_at>=p.cutoff),
  'new_dispositions_since_installation',(SELECT count(*) FROM official_v3_jobs_private.execution_dispositions_v1 WHERE settled_at>=p.cutoff),
  'new_outbox_since_installation',(SELECT count(*) FROM official_v3_result_private.outbox_v1 WHERE recorded_at>=p.cutoff),
  'expired_research_leases',(SELECT count(*) FROM official_v3_jobs_private.subjects_v1 j WHERE j.current_job->>'state'='leased' AND (j.current_job#>>'{lease,expiresAt}')::timestamptz<p.observed_at),
  'method_status',(SELECT status FROM official_v3_method_private.heads_v1 WHERE method_id='jetnity-destination-primary-ch-de-visa'),
  'monitor_due',(SELECT next_check_at FROM official_v3_result_private.monitor_schedule_v1 WHERE singleton)
 ),
 'cron_latest_runs',(SELECT jsonb_agg(to_jsonb(c) ORDER BY jobid,runid DESC) FROM cron_rows c),
 'http_source_publisher_owner_actions_performed',false,
 'production_change',false
) AS result FROM p
)
SELECT CASE WHEN octet_length(result::text)>65536 THEN jsonb_build_object('result','STOP_OUTPUT_LIMIT','bytes',octet_length(result::text))
 ELSE result END AS result FROM payload;
ROLLBACK;
