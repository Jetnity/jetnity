-- PREPARED POST-COMMIT FENCE CANDIDATE ONLY; NOT EXECUTED.
-- Fixed Production target qscbgcdmivbbnzrcyegn. Separate exact Fence authorization required.
-- Pin the ACTUALLY COMMITTED successor from an independent readback first.
-- Missing pin is an immediate pre-DDL STOP; it cannot be filled from this draft's new row.
-- Denies subsequent captured origin/local queue INSERTs; pending queued work is preserved
-- and can still be delivered. Replica/direct UPDATE/hostile DBA are outside this trigger contract.
-- assert_catalog refuses the helper delta immediately when invoked. Public alarm changes
-- only via the existing natural audit/freshness design: no fake audit, instant-alarm claim or reset.
-- Permanent recovery is a reviewed forward repair; never drop/rewind into the old allocator.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL transaction_timeout='90s';
SET LOCAL row_security=off;

DO $production_fence_installed_pins$
DECLARE expected_successor_sha text:=NULL::text;
 b jsonb; item record; actual_digest text;
BEGIN
 IF expected_successor_sha IS NULL OR expected_successor_sha !~ '^[a-f0-9]{64}$' THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_INDEPENDENT_COMMITTED_SUCCESSOR_PIN_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('transaction_isolation')<>'read committed'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()') IS NULL
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXACT_INSTALLED_TARGET_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,1) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_EXISTING_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,32) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_IMPORT_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,1) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_AT_ENQUEUE_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,2) THEN
  RAISE EXCEPTION 'PROD_FENCE_STOP_AT_RENEWAL_BUSY' USING ERRCODE='P7998'; END IF;
 SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
 INTO STRICT b FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton;
 IF encode(sha256(convert_to(b::text,'UTF8')),'hex') IS DISTINCT FROM expected_successor_sha
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_INSTALLED_SUCCESSOR_PIN_MISMATCH' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','66612df9bbc2ba0aeb016f97c5c245c76f176e13c02bd1150c5cc618c5363601'),
  ('official_v3_guard_private.assert_catalog_v1()','4d9f578d59ef1f998cf9a26385c078eaacd8dbd375629f965d8feaeb46582eb8'),
  ('official_v3_guard_private.require_open_v1()','de352dc414b5a5545cc0cb0edc245ed2312777d73b250adcdc9b93ca804ebcae'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('official_v3_at_production_private.renew_ch_v1()','572a243b45785800f67f372c0667397d448e1eea5769c74065d4709a59e3b562')
 ) expected(signature,digest) LOOP
  SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') INTO actual_digest
  FROM pg_proc WHERE oid=to_regprocedure(item.signature);
  IF actual_digest IS DISTINCT FROM item.digest
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex')
   IS DISTINCT FROM b->'catalog'->('function:'||to_regprocedure(item.signature)::oid)->>'definition'
  THEN RAISE EXCEPTION 'PROD_FENCE_STOP_GUARD_OR_PUBLISHER_PIN_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  AND p.proowner='postgres'::pg_catalog.regrole AND p.prosecdef AND p.provolatile='v'
  AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype AND p.proconfig=ARRAY['search_path=pg_catalog'] AND p.pronargs=0
  AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='5074ea591410f77e797956b6c37b7379edee30c534707779d690c0ff56d2d1e1'
  AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')=b#>>'{transport_metadata,allocator,function,definition}')
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXACT_NORMAL_HELPER_REQUIRED' USING ERRCODE='P7998'; END IF;
 
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
 IF official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM b->'catalog'
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_EXISTING_CATALOG_DRIFT_REQUIRES_SPECIFIC_REVIEW' USING ERRCODE='P7998'; END IF;
 -- Freshness may already be unavailable. This operation closes transport; it cannot open it.
END $production_fence_installed_pins$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
-- Fixed NOWAIT ledger/history locks close producer/collector races without waiting
-- on an inverted caller hierarchy. Any busy relation stops the entire transaction.
LOCK TABLE net._http_response IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.dispatches_v1 IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.cycles_v1 IN SHARE MODE NOWAIT;
LOCK TABLE jetnity_prod_import_scheduler.state_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_requests_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_batches_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.watch_observations_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.source_pins_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.first_originals_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_at_production_private.ch_visa_facts_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_guard_private.owner_operations_v1 IN SHARE MODE NOWAIT;
LOCK TABLE official_v3_guard_private.query_cost_baseline_v1 IN SHARE MODE NOWAIT;
-- SELECT authority is sufficient; this deliberately DOES NOT block Cron DML.
LOCK TABLE cron.job IN ACCESS SHARE MODE NOWAIT;

CREATE FUNCTION pg_temp.prod_http_inventory_exact() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $inventory$
WITH actual AS (
 SELECT n.nspname::text AS schema_name,c.relname::text AS table_name,
  a.attname::text AS column_name,c.relpersistence::text AS persistence,
  c.relkind::text AS kind,c.relispartition,
  EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhrelid=c.oid OR i.inhparent=c.oid) AS inherited,
  a.atttypid='pg_catalog.int8'::pg_catalog.regtype AS exact_bigint,
  a.attgenerated='' AND a.attidentity='' AS ordinary_column
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid
 JOIN pg_type typ ON typ.oid=a.atttypid
 WHERE c.relkind IN('r','p','f','v','m') AND c.relpersistence IN('p','u')
 AND n.nspname NOT IN('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
 AND a.attnum>0 AND NOT a.attisdropped
 AND (a.atttypid='pg_catalog.int8'::pg_catalog.regtype OR typ.typbasetype='pg_catalog.int8'::pg_catalog.regtype)
 AND (a.attname ~ '(^|_)request_id$'
   OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
), expected(schema_name,table_name,column_name,persistence) AS (VALUES
 ('jetnity_prod_import_scheduler','dispatches_v1','net_request_id','p'),
 ('official_v3_at_production_private','watch_requests_v1','request_id','p'),
 ('net','http_request_queue','id','u'),('net','_http_response','id','u')),
 differences AS (
 (SELECT schema_name,table_name,column_name,persistence FROM actual EXCEPT SELECT * FROM expected)
 UNION ALL (SELECT * FROM expected EXCEPT SELECT schema_name,table_name,column_name,persistence FROM actual)
 ) SELECT (SELECT count(*) FROM actual)=4 AND NOT EXISTS(SELECT 1 FROM differences)
 AND NOT EXISTS(SELECT 1 FROM actual WHERE kind<>'r' OR relispartition OR inherited
 OR NOT exact_bigint OR NOT ordinary_column)
 AND NOT EXISTS(SELECT 1 FROM (VALUES ('jetnity_dev_import_scheduler.dispatches_v1'),('jetnity_dev_import_scheduler.preview_dispatches_v1'),('jetnity_followup_source_monitor_private.items_v1'),('jetnity_followup_source_monitor_private.items_v2'),('jetnity_followup_source_monitor_private.items_v3'),('jetnity_global_source_monitor_private.requests_v1'),('jetnity_source_dispatch_private.observations_v1'),('jetnity_source_dispatch_private.requests_v1'),('jetnity_usagov_fallback_private.original_v1'),('jetnity_usagov_watch_private.observations_v1'),('jetnity_usagov_watch_private.requests_v1'),('official_v3_at_source_watch_private.reads_v1'),('official_v3_source_renewal_private.observations_v1'),('supabase_functions.hooks')) absent(relation_name)
  WHERE to_regclass(absent.relation_name) IS NOT NULL) AS exact_inventory
$inventory$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_inventory_exact() FROM PUBLIC;
CREATE FUNCTION pg_temp.prod_http_native_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $native$
 SELECT jsonb_build_object(
 'net_namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('net')),
 'pg_net_extension',(SELECT to_jsonb(e) FROM pg_extension e WHERE e.extname='pg_net'),
 'replication_parameter_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::pg_catalog.jsonb)
   FROM pg_parameter_acl a WHERE a.parname='session_replication_role'),
 'replication_role_settings',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::pg_catalog.jsonb)
   FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'replication_function_settings',(SELECT coalesce(jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'supautils_settings',jsonb_build_object(
   'privileged_role',current_setting('supautils.privileged_role',true),
   'privileged_role_allowed_configs',current_setting('supautils.privileged_role_allowed_configs',true)),
 'queue_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue')),
 'queue_attributes',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.attnum),'[]'::pg_catalog.jsonb)
   FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')),
 'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY d.adnum),'[]'::pg_catalog.jsonb)
   FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')),
 'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::pg_catalog.jsonb)
   FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue')),
 'queue_indexes',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::pg_catalog.jsonb)
   FROM pg_index i WHERE i.indrelid=to_regclass('net.http_request_queue')),
 'queue_rules',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.oid),'[]'::pg_catalog.jsonb)
   FROM pg_rewrite r WHERE r.ev_class=to_regclass('net.http_request_queue')),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p')),
 'stored_transport_consumers',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
   AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
   AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]'
     OR p.prosrc LIKE '%net.http_request_queue%'))
)
$native$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_native_state() FROM PUBLIC;
CREATE FUNCTION pg_temp.prod_http_allocator_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $allocator$
 SELECT jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'function',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
   FROM pg_proc p WHERE p.oid=to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')),
 'global_trigger',(SELECT to_jsonb(t) FROM pg_trigger t
   WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1'),
 'dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM owned_objects)
   OR (d.refclassid,d.refobjid) IN(SELECT * FROM owned_objects)),
 'shared_dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND (d.classid,d.objid) IN(SELECT * FROM owned_objects))
)
$allocator$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_allocator_state() FROM PUBLIC;
-- Exact shared Cron core for the correction candidate and scoped fixture tests.
-- SELECT/ACCESS SHARE only on cron.job. No GRANT/REVOKE/SET ROLE/owner changes.
-- All helpers are temporary SECURITY INVOKER routines. No live guard is replaced.
-- A fixture may mechanically map ONLY the literal cron.job relation to its own
-- test relation; the pinned production copy always targets the real cron.job.
-- This detects observed writers and row/config changes; it is NOT a Cron freeze.

CREATE FUNCTION pg_temp.prod_http_cron_contract() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $cron_contract$
SELECT (
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'jobid',j.jobid::text,'jobname',j.jobname,'schedule',j.schedule,
  'active',j.active,'database',j.database,'username',j.username,
  'command_sha256',encode(sha256(convert_to(j.command,'UTF8')),'hex'),
  'full_row_sha256',encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex')
 ) ORDER BY j.jobname COLLATE "C",j.jobid),'[]'::jsonb)
 FROM (SELECT * FROM cron.job
  WHERE jobname IN('jetnity-at-production-source-collect-v1',
   'jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-renew-v1',
   'jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1')
  ORDER BY jobname COLLATE "C",jobid LIMIT 6) j
)
$cron_contract$;

CREATE FUNCTION pg_temp.prod_http_cron_writers_absent() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $cron_writers$
SELECT NOT EXISTS(
 SELECT 1 FROM pg_locks l
 WHERE l.locktype='relation'
  AND l.database=(SELECT oid FROM pg_database WHERE datname=current_database())
  AND l.relation=to_regclass('cron.job')
  AND l.pid IS DISTINCT FROM pg_backend_pid()
  AND l.mode IN('RowExclusiveLock','ShareUpdateExclusiveLock',
   'ShareRowExclusiveLock','ExclusiveLock','AccessExclusiveLock')
 -- Both granted and pending writers count. A prepared transaction has no PID
 -- and is deliberately not excluded. Locks in another database do not count.
 LIMIT 1)
$cron_writers$;

CREATE FUNCTION pg_temp.prod_http_cron_snapshot() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $cron_snapshot$
DECLARE observed jsonb; observed_count bigint; largest_row_bytes integer;
BEGIN
 IF has_table_privilege(current_user,'cron.job','SELECT') IS DISTINCT FROM true
 OR NOT EXISTS(SELECT 1 FROM pg_locks l WHERE l.locktype='relation'
  AND l.database=(SELECT oid FROM pg_database WHERE datname=current_database())
  AND l.relation=to_regclass('cron.job') AND l.pid=pg_backend_pid()
  AND l.mode='AccessShareLock' AND l.granted)
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_SELECT_AND_ACCESS_SHARE_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_cron_writers_absent() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_WRITER_OBSERVED' USING ERRCODE='P7998'; END IF;
 WITH bounded AS MATERIALIZED (
  SELECT to_jsonb(j) AS row_value,j.tableoid::oid AS table_oid,
   j.xmin::text AS row_xmin,j.ctid::text AS row_ctid
  FROM cron.job j LIMIT 129
 ), hashed AS MATERIALIZED (
  SELECT octet_length(row_value::text) AS row_bytes,
   encode(sha256(convert_to(row_value::text,'UTF8')),'hex') AS row_sha,
   encode(sha256(convert_to(jsonb_build_object('tableoid',table_oid,
    'xmin',row_xmin,'ctid',row_ctid,'row',row_value)::text,'UTF8')),'hex') AS version_sha
  FROM bounded
 ) SELECT count(*),coalesce(max(row_bytes),0),jsonb_build_object(
  'relation_oid',to_regclass('cron.job')::oid,'row_count',count(*),
  'configuration_sha256',encode(sha256(convert_to(coalesce(string_agg(row_sha,'|' ORDER BY row_sha COLLATE "C"),''),'UTF8')),'hex'),
  'row_versions_sha256',encode(sha256(convert_to(coalesce(string_agg(version_sha,'|' ORDER BY version_sha COLLATE "C"),''),'UTF8')),'hex'),
  'contract',pg_temp.prod_http_cron_contract())
 INTO STRICT observed_count,largest_row_bytes,observed FROM hashed;
 IF observed_count>128 OR largest_row_bytes>65536
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_SNAPSHOT_CAP_EXCEEDED' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_cron_writers_absent() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_WRITER_OBSERVED' USING ERRCODE='P7998'; END IF;
 RETURN observed;
END $cron_snapshot$;

CREATE FUNCTION pg_temp.prod_http_assert_cron_unchanged(expected jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $cron_unchanged$
BEGIN
 IF expected IS NULL OR jsonb_typeof(expected) IS DISTINCT FROM 'object'
 OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM expected
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_CONFIGURATION_OR_ROW_VERSION_CHANGED' USING ERRCODE='P7998'; END IF;
END $cron_unchanged$;

CREATE FUNCTION pg_temp.prod_http_validate_cron_capture(expected_snapshot jsonb,captured_catalog jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $cron_capture$
BEGIN
 IF expected_snapshot IS NULL OR captured_catalog IS NULL
 OR jsonb_typeof(expected_snapshot->'contract') IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'PROD_HTTP_CAPTURED_CRON_CONTRACT_NOT_THE_REVIEWED_PREDECESSOR' USING ERRCODE='P7998'; END IF;
 IF jsonb_array_length(expected_snapshot->'contract')<>5
 OR captured_catalog#>ARRAY['transport:production_http_id_allocator_v4','cron_contract']
  IS DISTINCT FROM expected_snapshot->'contract'
 THEN RAISE EXCEPTION 'PROD_HTTP_CAPTURED_CRON_CONTRACT_NOT_THE_REVIEWED_PREDECESSOR' USING ERRCODE='P7998'; END IF;
 PERFORM pg_temp.prod_http_assert_cron_unchanged(expected_snapshot);
END $cron_capture$;


-- Hash complete row multisets, not only ID prefixes or counts. No raw row leaves SQL.
-- Identifiers below are a literal allowlist, never data-supplied SQL or an arbitrary relation sweep.
CREATE FUNCTION pg_temp.prod_http_protected_state() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $protected$
DECLARE item record; n bigint; digest text; result jsonb:='{}'::jsonb;
 f regclass; state_value jsonb;
BEGIN
 IF (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_production_private.first_originals_v1 LIMIT 4) limited)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE raw_body IS NULL OR octet_length(raw_body)>1048576)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORIGINAL_BYTES_CAP' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.baselines_v1',3),
  ('official_v3_guard_private.status_baseline_v1',1),
  ('official_v3_guard_private.rolling_quota_baseline_v1',1),
  ('official_v3_guard_private.admin_runtime_baseline_v1',1),
  ('official_v3_guard_private.saved_offers_baseline_v1',1),
  ('official_v3_guard_private.weather_quota_baseline_v1',1),
  ('official_v3_guard_private.at_source_monitor_baseline_v1',1),
  ('official_v3_guard_private.at_batch_switch_baseline_v2',1),
  ('official_v3_guard_private.bg1_transient_baseline_v3',1),
  ('official_v3_guard_private.query_cost_baseline_v1',1),
  ('official_v3_guard_private.owner_operations_v1',2048),
  ('official_v3_guard_private.state_v1',1),
  ('official_v3_guard_private.incidents_v1',2048),
  ('official_v3_guard_private.runs_v1',20000),
  ('official_v3_at_production_private.source_pins_v1',3),
  ('official_v3_at_production_private.first_originals_v1',3),
  ('official_v3_at_production_private.ch_visa_facts_v1',1000),
  ('official_v3_at_production_private.watch_requests_v1',10000),
  ('official_v3_at_production_private.watch_batches_v1',10000),
  ('official_v3_at_production_private.watch_observations_v1',10000),
  ('jetnity_prod_import_scheduler.dispatches_v1',10000),
  ('jetnity_prod_import_scheduler.cycles_v1',1000),
  ('jetnity_prod_import_scheduler.state_v1',1),
  ('net.http_request_queue',10000),
  ('net._http_response',10000),
  ('cron.job',128)
 ) fixed(relation_name,row_cap) LOOP
  IF to_regclass(item.relation_name) IS NULL THEN
   RAISE EXCEPTION 'PROD_HTTP_STOP_PROTECTED_RELATION_MISSING: %',item.relation_name USING ERRCODE='P7998'; END IF;
  EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM %s LIMIT %s) bounded',
   to_regclass(item.relation_name),item.row_cap+1) INTO n;
  IF n>item.row_cap THEN
   RAISE EXCEPTION 'PROD_HTTP_STOP_PROTECTED_HISTORY_CAP: %',item.relation_name USING ERRCODE='P7998'; END IF;
  EXECUTE format('SELECT encode(sha256(convert_to(coalesce(string_agg(row_sha,''|'' ORDER BY row_sha COLLATE "C"),''''),''UTF8'')),''hex'') FROM (SELECT encode(sha256(convert_to(to_jsonb(x)::text,''UTF8'')),''hex'') row_sha FROM %s x) rows',
   to_regclass(item.relation_name)) INTO digest;
  result:=result||jsonb_build_object(item.relation_name,jsonb_build_object('count',n,'sha256',digest));
 END LOOP;
 f:=pg_get_serial_sequence('official_v3_at_production_private.ch_visa_facts_v1','version_id')::pg_catalog.regclass;
 IF f IS NULL THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FACT_SEQUENCE_MISSING' USING ERRCODE='P7998'; END IF;
 EXECUTE format('SELECT jsonb_build_object(''last_value'',last_value::text,''log_cnt'',log_cnt::text,''is_called'',is_called) FROM %s',f)
 INTO STRICT state_value;
 RETURN result||jsonb_build_object('cron_snapshot',pg_temp.prod_http_cron_snapshot(),
  'method_domain',jsonb_build_object(
 'type',(SELECT to_jsonb(t) FROM pg_type t WHERE t.oid=to_regtype('net.http_method')),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex'))
  ORDER BY c.oid),'[]'::pg_catalog.jsonb) FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')))
,'fact_sequence',jsonb_build_object('oid',f::oid,'state',state_value,
  'parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE seqrelid=f)),
  'legacy_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called) FROM net.http_request_queue_id_seq));
END $protected$;
REVOKE ALL ON FUNCTION pg_temp.prod_http_protected_state() FROM PUBLIC;


CREATE TEMP TABLE pg_temp.prod_http_fence_before ON COMMIT DROP AS SELECT
 pg_temp.prod_http_native_state() AS native,
 pg_temp.prod_http_allocator_state() AS allocator,
 pg_temp.prod_http_protected_state() AS protected_state,
 official_v3_guard_private.catalog_status_v1() AS catalog,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) AS own_sequence,
 (SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
  FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton) AS successor;
DO $production_fence_lock_and_scope$
BEGIN
 IF pg_temp.prod_http_inventory_exact() IS DISTINCT FROM true
 OR NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND relation='net.http_request_queue'::pg_catalog.regclass AND mode='ShareRowExclusiveLock')
 OR (SELECT count(*) FROM pg_temp.prod_http_fence_before)<>1
 THEN RAISE EXCEPTION 'PROD_FENCE_STOP_GLOBAL_LOCK_OR_SCOPE_CHANGED' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_fence_lock_and_scope$;
SAVEPOINT production_before_fence;
CREATE OR REPLACE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'PROD_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 RAISE EXCEPTION 'PROD_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED' USING ERRCODE='P7998';
END $assign$;

DO $production_fence_real_insert_denial$
DECLARE actual jsonb; original jsonb;
BEGIN
 BEGIN
  INSERT INTO net.http_request_queue(id,method,url,headers,timeout_milliseconds)
  VALUES(0,'GET','https://example.invalid/production-fence-rollback-proof','{}'::jsonb,1000);
  RAISE EXCEPTION 'PROD_FENCE_QUEUE_INSERT_WAS_NOT_DENIED' USING ERRCODE='P7999';
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM<>'PROD_HTTP_ID_ALLOCATOR_FENCED_FORWARD_REPAIR_REQUIRED' THEN RAISE; END IF;
 END;
 -- Explicit ID avoided the legacy nextval default; deny occurs before own nextval.
 actual:=pg_temp.prod_http_allocator_state();
 SELECT allocator INTO STRICT original FROM pg_temp.prod_http_fence_before;
 IF (actual-'function') IS DISTINCT FROM (original-'function')
 OR ((actual->'function')-'definition') IS DISTINCT FROM ((original->'function')-'definition')
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
   WHERE oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)<>'007862ae47509d8408f4a2b1665e8fa7bbf2e3e4baa36e7c71f2c8a8025f96a6'
 OR pg_temp.prod_http_native_state() IS DISTINCT FROM (SELECT native FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_fence_before)
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
   FROM jetnity_pgnet_allocator_private.http_request_id_v1)
  IS DISTINCT FROM (SELECT own_sequence FROM pg_temp.prod_http_fence_before)
 OR (SELECT to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before))
   FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton)
  IS DISTINCT FROM (SELECT successor FROM pg_temp.prod_http_fence_before)
 THEN RAISE EXCEPTION 'PROD_FENCE_CHANGED_MORE_THAN_OWN_HELPER_DEFINITION' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.assert_catalog_v1();
  RAISE EXCEPTION 'PROD_FENCE_CATALOG_DID_NOT_REFUSE' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7905' THEN
  IF SQLERRM<>'production rolling protected catalog changed' THEN RAISE; END IF;
 END;
 -- No call to audit, latch/resume reset, source qualification or positive Publisher.
END $production_fence_real_insert_denial$;

ROLLBACK TO SAVEPOINT production_before_fence;
DO $production_fence_complete_restoration$
BEGIN
 IF pg_temp.prod_http_native_state() IS DISTINCT FROM (SELECT native FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_allocator_state() IS DISTINCT FROM (SELECT allocator FROM pg_temp.prod_http_fence_before)
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_fence_before)
 OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT catalog FROM pg_temp.prod_http_fence_before)
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM (SELECT own_sequence FROM pg_temp.prod_http_fence_before)
 THEN RAISE EXCEPTION 'PROD_FENCE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $production_fence_complete_restoration$;
SELECT jsonb_build_object('result','PROD_HTTP_FENCE_REAL_DENIAL_AND_ROLLBACK_PASS',
 'fence_active',false,'http_or_wake_called',false,'sequence_consumed_or_rewound',false,
 'original_committed_lineage_preserved',true,'commit_permission',false) AS result;
ROLLBACK;
