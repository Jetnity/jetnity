-- PREPARED REVIEW CANDIDATE ONLY. NOT EXECUTED. No Production action is authorized by this file.
-- Cron correction successor: optimistic observations, exact five-row pins, no Cron DML freeze.
-- Fixed external target: qscbgcdmivbbnzrcyegn; SQL target markers alone are not project authentication.
-- PostgreSQL 17 / recorded Production pg_net 0.19.5. Four exact ID paths; hooks is absent.
-- Bindings come from the exact authorized 02 receipt and reviewed fixed primary sources.
-- Missing/mismatched pins stop before TEMP/DDL; future preflight verifies the current query-cost head.
-- Ordinary net API INSERT producers in origin/local only. No replica/direct-UPDATE/hostile-DBA guarantee.
-- No managed owner/default change, no role grants, no manual HTTP/wake, no status/reset/qualification change.
-- New source barrier, allocator, trigger and append-only BG1 successor belong to the same transaction.
-- Keep expired facts unavailable. A later natural complete BG1 proof is required; never invoke audit here.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL transaction_timeout='90s';
SET LOCAL row_security=off;

-- This is an evidence gate, not a substitute for the Owner's separate execution Go.
DO $production_pins_before_any_ddl$
DECLARE missing text[]; item record; old_catalog jsonb; expected_control_digest text;
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing FROM (VALUES
 ('native_transport_sha256','60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f'),
 ('method_domain_constraint_definition_sha256','412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de'),
 ('method_domain_constraint_catalog_sha256','63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856'),
 ('immediate_predecessor_catalog_sha256','ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'),
 ('cron_metadata_observation_sha256','f6404d0d9c1407fcc8277d6b7ba5a9f2b84128b572c32d99d329c9ac23601fe6')
 ) p(name,value) WHERE value IS NULL OR value !~ '^[a-f0-9]{64}$';
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_MISSING_INDEPENDENT_BINDINGS: %',array_to_string(missing,', ')
   USING ERRCODE='P7998'; END IF;
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('server_encoding')<>'UTF8'
 OR current_setting('transaction_isolation')<>'read committed'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR to_regclass('official_v3_guard_private.query_cost_baseline_v1') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_legal_source_guard_baseline_v4') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NOT NULL
 OR to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL
 OR to_regclass('supabase_functions.hooks') IS NOT NULL
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_net') IS DISTINCT FROM '0.19.5'
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_WRONG_OR_CHANGED_PRODUCTION_LINEAGE' USING ERRCODE='P7998'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolbypassrls AND NOT rolsuper)
 OR has_database_privilege(current_user,current_database(),'CREATE') IS DISTINCT FROM true
 OR has_schema_privilege(current_user,'net','USAGE') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','INSERT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','UPDATE') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','SELECT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'net.http_request_queue','TRIGGER') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORDINARY_AUTHORITY_MISSING' USING ERRCODE='42501'; END IF;
 IF has_table_privilege(current_user,'cron.job','SELECT') IS DISTINCT FROM true
 OR ((
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
)) IS DISTINCT FROM '[{"jobid":"6","jobname":"jetnity-at-production-source-collect-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"f16474de9c9e48b24d2ac84bc0ba3ac90d5ff401ef539ff1efa6ae94068dcf3f","full_row_sha256":"587b3bc0187f14965a579c7d1d13b4dbfe8dc82c06836d767c4b2178c61292a0"},{"jobid":"5","jobname":"jetnity-at-production-source-enqueue-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"d7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890","full_row_sha256":"1971883b244c0fd1acad713cf8c5b8d62d649f9a121bfbbd547057aea0e23be3"},{"jobid":"7","jobname":"jetnity-at-production-source-renew-v1","schedule":"2-59/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"7f97fd0c29c97f45c4f5b3458c60ce59711d2d10589a1be16656211f96141593","full_row_sha256":"c92294cf6d926896dcf845bd8a9113fada0d20636e24d3a906f85c8c3907e36f"},{"jobid":"4","jobname":"jetnity-ch-de-prod-import-v1","schedule":"* * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"87241ddeaf94b27c22676857c098492029dcbdcf8ac90ba7a5feaf2f62f43144","full_row_sha256":"6319ae3dc4b50ebe3cca6e1a4514c8a7ea6a3352697681a88d0612d1f8bba4de"},{"jobid":"2","jobname":"jetnity-official-truth-production-guard-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863","full_row_sha256":"2d8d36409000dc6c7ad9423d8fa033d35a0034ec0e16de5c646ecc98b8c78893"}]'::jsonb
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_REVIEWED_CRON_FULL_ROW_CONTRACT_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()','57b101b3551b64e95bc68e6650d642ba34829fccb84bc081b7ad606879c176fe'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','1f2b6fc5ccc1511e77737a95c71228bed710482133a95a87cdb672d80373617b'),
 ('net.http_get(text,jsonb,jsonb,integer)','7012c5582cd0ab8d38f546af6633ea3c531950fb009f07127b99f8a1640eac1a'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','ee3ec5bc54158b60b6c4e3a966a07a33dc009788fad8f6b7480ad1c45acdfe78'),
 ('net.wake()','b7f9cb7d7cd9b5259c6a29b1cae29b451b325a6f43169cee18b7ff723fad9efc'),
 ('official_v3_at_production_private.collect_v1()','3e681172f296ba3c4202dbf8108552201f613f8de345e6c339288f8680683422'),
 ('official_v3_at_production_private.enqueue_v1()','3c75e96aa6b005d2b812b3ca48d288bc92397146567abc33e72449e5ae34ef90'),
 ('official_v3_at_production_private.renew_ch_v1()','5171785c2b114a816c13c5e2dc26cc2a397c6837fccfcbda2974f706b10b5f76'),
 ('official_v3_guard_private.assert_catalog_v1()','6b71c91f8498c4001f1f81fa01ba4c440681ec6166fbb2bccaae760602c59d39'),
 ('official_v3_guard_private.audit_v1()','b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'),
 ('official_v3_guard_private.catalog_status_v1()','7831174f514c657fcae44d8125e517f810e6271cbc128642cdcbc1df27b2a402'),
 ('official_v3_guard_private.check_control_v1()','8a5b56136dc5564b4d52e6e0dcb1f119f4b229cb985296044696c7463b646669'),
 ('official_v3_guard_private.check_retirements_v1()','1f45c1bd50cab57dedbaec8b25a2329ff291897a3252e9e91e43f0c41637f718'),
 ('official_v3_guard_private.immutable_v1()','67a8778d002cb93436e0c1f6d498d27f4bc1b7cb228ad921bef0b1ab1566114d'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','0237901ef275badb4f12f6491f4f9f475177669e767001127a1de004a8d061cd'),
 ('official_v3_guard_private.require_open_v1()','9ce675e839dc71ee19ddba5f44503472e2f1caa07add90d5709df4f5164a20e5'),
 ('public.official_v3_guard_alarm_status_v1()','d60554d4a4d902b76c51f9e5b1f2f718692732bcda614f0f1783a154ba7677ec')
 ) expected(signature,digest) LOOP
  IF to_regprocedure(item.signature) IS NULL
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FUNCTION_PIN: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 
 FOR item IN SELECT * FROM (VALUES
 ('jetnity_prod_import_scheduler.tick_v1()','postgres',false,'v','text','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','429a6be355781df4575a7a3db1b0229a57a105e91bcf31bb3db68e23c51e25a5'),
 ('net.http_delete(text,jsonb,jsonb,integer,jsonb)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.http_get(text,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.http_post(text,jsonb,jsonb,jsonb,integer)','supabase_admin',false,'v','bigint','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('net.wake()','supabase_admin',false,'v','void','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b','74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'),
 ('official_v3_at_production_private.collect_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_at_production_private.enqueue_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_at_production_private.renew_ch_v1()','postgres',false,'v','integer','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.assert_catalog_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.audit_v1()','postgres',true,'v','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1'),
 ('official_v3_guard_private.catalog_status_v1()','postgres',true,'s','jsonb','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','0eddb5d2ed46f2e695f62703619d14e395be90a903b67dea2da63eb0dc8e40b1'),
 ('official_v3_guard_private.check_control_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.check_retirements_v1()','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.immutable_v1()','postgres',false,'v','trigger','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.latch_incident_v1(timestamp with time zone,text)','postgres',true,'v','void','832d3a9c7b63b399d0470999a0f869119332fb42e27ab93c9c7b65122675b540','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('official_v3_guard_private.require_open_v1()','postgres',true,'v','bigint','8d7f7dc66cd0965d575cf544d4f9a773c46bda7374851b88fe8da42ea59113f2','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1'),
 ('public.official_v3_guard_alarm_status_v1()','postgres',true,'v','jsonb','c8789f4263f3a141a57ef770b25307024c51c4718475db91baa4af8dcd6782f4','f156afc13bf2dac90d3d3f2965f5e4e3379aaa44d4dacc6ccd902462c63232e1')
 ) expected(signature,owner_name,is_definer,volatility,result_type,acl_sha,config_sha) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(item.signature)
   AND pg_get_userbyid(p.proowner)=item.owner_name AND p.prosecdef=item.is_definer
   AND p.provolatile::text=item.volatility AND pg_get_function_result(p.oid)=item.result_type
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proacl)::text,'null'),'UTF8')),'hex')=item.acl_sha
   AND encode(sha256(convert_to(coalesce(to_jsonb(p.proconfig)::text,'null'),'UTF8')),'hex')=item.config_sha)
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FUNCTION_OWNER_ACL_OR_CONFIG_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;

 -- Same first existing guard lock as audit and Owner closures; never take it late.
 IF NOT pg_try_advisory_xact_lock(771106,1) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771106,32) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_IMPORT_PRODUCER_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,1) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_AT_ENQUEUE_BUSY' USING ERRCODE='P7998'; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,2) THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_AT_RENEWAL_BUSY' USING ERRCODE='P7998'; END IF;
 -- Fixed merged query-cost catalog anchors the immediate predecessor.
 -- Its complete v3 ancestry is separately retained and verified; no live blind reseal.
 SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
 IF encode(sha256(convert_to(old_catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR old_catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_FIXED_QUERY_COST_CATALOG_ANCHOR_MISMATCH' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT signature FROM (VALUES
  ('official_v3_guard_private.check_control_v1()'),('official_v3_guard_private.check_retirements_v1()'),
  ('official_v3_guard_private.immutable_v1()')) required(signature) LOOP
  expected_control_digest:=old_catalog->('function:'||to_regprocedure(item.signature)::oid)->>'definition';
  IF expected_control_digest IS NULL OR expected_control_digest !~ '^[a-f0-9]{64}$'
  OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM expected_control_digest
  THEN RAISE EXCEPTION 'PROD_HTTP_STOP_EXISTING_PINNED_CONTROL_CHANGED: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 -- Existing functions are called only AFTER the independently anchored digest checks.
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR (SELECT count(*) FROM official_v3_guard_private.query_cost_baseline_v1)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton
  AND algorithm='jsonb_unique_narrow_dependency_distinct_v1'
  AND predecessor_catalog_digest='7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
  AND predecessor_baseline_digest='a7266c41fc77ab63b8ce2878d10890c7d5b395a3a33d8fe6c5331bf68f7e2bd0'
  AND encode(sha256(convert_to(catalog::text,'UTF8')),'hex')='ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24')
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_transient_baseline_v3)<>1
 OR (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton)
  IS DISTINCT FROM '7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton
  AND required_generation=1344 AND proof_not_before='2026-11-20T22:51:44.959438Z'::timestamptz)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_OLD_GUARD_OR_BASELINE_NOT_EXACT' USING ERRCODE='P7998'; END IF;
END $production_pins_before_any_ddl$;

-- GLOBAL BARRIER FIRST: covers every ordinary net queue INSERT/worker writer.
-- A new READ COMMITTED statement follows this acquisition before any MAX read.
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

CREATE TEMP TABLE pg_temp.prod_http_before(
 singleton boolean PRIMARY KEY CHECK(singleton),catalog jsonb NOT NULL,native jsonb NOT NULL,
 protected_state jsonb NOT NULL,source_history jsonb NOT NULL,owner_history jsonb NOT NULL,
 legacy_value bigint NOT NULL,legacy_called boolean NOT NULL,history_max bigint NOT NULL,
 first_id bigint NOT NULL,source_unqualified boolean NOT NULL,
 guard_function_rows jsonb NOT NULL
) ON COMMIT DROP;

DO $fresh_locked_high_water_and_snapshot$
DECLARE seq pg_sequence%ROWTYPE; last_number bigint; called boolean; hwm bigint; base bigint;
 native jsonb; source_history jsonb; owner_history jsonb; functions jsonb; unqualified boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid() AND granted
  AND locktype='relation' AND relation='net.http_request_queue'::pg_catalog.regclass
  AND mode='ShareRowExclusiveLock')
 OR pg_temp.prod_http_inventory_exact() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_GLOBAL_LOCK_OR_EXACT_INVENTORY_MISSING' USING ERRCODE='P7998'; END IF;
 IF (WITH expected(name,type_name,required_not_null) AS (VALUES
 ('id','pg_catalog.int8',true),('method','net.http_method',true),('url','pg_catalog.text',true),
 ('headers','pg_catalog.jsonb',false),('body','pg_catalog.bytea',false),('timeout_milliseconds','pg_catalog.int4',true)),
 actual AS (SELECT * FROM pg_attribute WHERE attrelid=to_regclass('net.http_request_queue') AND attnum>0)
SELECT (SELECT count(*) FROM actual)=6
 AND NOT EXISTS(SELECT 1 FROM expected e LEFT JOIN actual a ON a.attname=e.name
  WHERE a.attnum IS NULL OR a.attisdropped OR a.atttypid IS DISTINCT FROM to_regtype(e.type_name)
  OR a.attnotnull IS DISTINCT FROM e.required_not_null OR a.attgenerated IS DISTINCT FROM '' OR a.attidentity IS DISTINCT FROM '')
 AND (SELECT count(*) FROM pg_attrdef WHERE adrelid=to_regclass('net.http_request_queue'))=1
 AND EXISTS(SELECT 1 FROM pg_attrdef d JOIN actual a ON a.attnum=d.adnum
  WHERE d.adrelid=to_regclass('net.http_request_queue') AND a.attname='id'
  AND pg_get_expr(d.adbin,d.adrelid)='nextval(''net.http_request_queue_id_seq''::regclass)')
 AND (SELECT (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname='net' AND t.typname='http_method')=1
 AND EXISTS(SELECT 1 FROM pg_type t WHERE t.oid=to_regtype('net.http_method')
  AND t.oid=289454 AND t.typtype='d'
  AND t.typbasetype='pg_catalog.text'::pg_catalog.regtype AND NOT t.typnotnull
  AND t.typtypmod=-1 AND t.typndims=0 AND t.typdefault IS NULL AND t.typdefaultbin IS NULL
  AND t.typowner='supabase_admin'::pg_catalog.regrole
  AND t.typcollation=(SELECT typcollation FROM pg_type WHERE oid='pg_catalog.text'::pg_catalog.regtype))
 AND (SELECT count(*) FROM pg_constraint WHERE contypid=to_regtype('net.http_method'))=1
 AND EXISTS(SELECT 1 FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')
  AND c.contype='c' AND c.convalidated
  AND pg_get_constraintdef(c.oid,false)='CHECK (((VALUE ~~* ''get''::text) OR (VALUE ~~* ''post''::text) OR (VALUE ~~* ''delete''::text)))'
  AND encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex')='412b54e60167a01e5fe4856c3ed5cbf862b912b2f3ba01bce4a8661c5ba915de'
  AND encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex')='63ece7f25171a578daae026a9e5501f99fbbf3e9677452ab470248e13f3ad856'
 )) AS exact_queue_shape_and_legacy_default) IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_EXACT_QUEUE_SHAPE_AND_LEGACY_NEXTVAL_DEFAULT_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)
 OR EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='net.http_request_queue'::pg_catalog.regclass)
 OR EXISTS(SELECT 1 FROM pg_rewrite WHERE ev_class='net.http_request_queue'::pg_catalog.regclass)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_QUEUE_TRIGGER_CONSTRAINT_OR_RULE_UNREVIEWED' USING ERRCODE='P7998'; END IF;
 SELECT * INTO STRICT seq FROM pg_sequence WHERE seqrelid='net.http_request_queue_id_seq'::pg_catalog.regclass;
 IF seq.seqtypid<>'pg_catalog.int8'::pg_catalog.regtype OR seq.seqincrement<>1 OR seq.seqcache<>1
 OR seq.seqcycle OR seq.seqmin<>1 OR seq.seqmax<>9223372036854775807
 OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=seq.seqrelid AND relkind='S'
   AND relpersistence='u' AND relowner='supabase_admin'::pg_catalog.regrole)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_LEGACY_METADATA_CHANGED' USING ERRCODE='P7998'; END IF;
 -- This is intentionally the first mutable value/MAX read, after all barriers.
 SELECT last_value,is_called INTO STRICT last_number,called FROM net.http_request_queue_id_seq;
 SELECT greatest(coalesce((SELECT max(net_request_id) FROM jetnity_prod_import_scheduler.dispatches_v1),0),
  coalesce((SELECT max(request_id) FROM official_v3_at_production_private.watch_requests_v1),0),
  coalesce((SELECT max(id) FROM net.http_request_queue),0),
  coalesce((SELECT max(id) FROM net._http_response),0)) INTO hwm;
 base:=greatest(211::bigint,last_number,hwm);
 -- 1024 deliberately unused numbers, then first_id=base+1025. Never seed from 211 alone.
 -- The spare upper bound also covers this candidate's two IDs and restart probes.
 IF last_number<1 OR hwm<211 OR base>9223372036854775807-2048
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_INVALID_MISSING_HISTORY_OR_RANGE_EXHAUSTED' USING ERRCODE='P7998'; END IF;
 native:=pg_temp.prod_http_native_state();
 IF encode(sha256(convert_to(native::text,'UTF8')),'hex') IS DISTINCT FROM '60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f'
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_REVIEWED_NATIVE_TRANSPORT_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_production_private.first_originals_v1 LIMIT 4) limited)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE raw_body IS NULL OR octet_length(raw_body)>1048576)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_ORIGINAL_BYTES_CAP' USING ERRCODE='P7998'; END IF;
 source_history:=jsonb_build_object(
 'pins',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY x.source_id COLLATE "C"),''),'UTF8')),'hex') FROM official_v3_at_production_private.source_pins_v1 x),
 'originals',(SELECT encode(sha256(convert_to(coalesce(string_agg(((to_jsonb(x)-'raw_body')||jsonb_build_object('actual_body_sha256',encode(sha256(x.raw_body),'hex')))::text,'|' ORDER BY x.source_id COLLATE "C"),''),'UTF8')),'hex') FROM official_v3_at_production_private.first_originals_v1 x),
 'facts',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY x.version_id),''),'UTF8')),'hex') FROM official_v3_at_production_private.ch_visa_facts_v1 x),
 'pin_count',(SELECT count(*) FROM official_v3_at_production_private.source_pins_v1),
 'original_count',(SELECT count(*) FROM official_v3_at_production_private.first_originals_v1),
 'fact_count',(SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1)
);
 owner_history:=(SELECT jsonb_build_object('count',count(*),'sha256',encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text COLLATE "C"),''),'UTF8')),'hex')) FROM official_v3_guard_private.owner_operations_v1 x);
 SELECT (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)=3
 AND (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)=3
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1 WHERE source_qualified AND NOT research_only)
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1 WHERE legal_source_approved OR customer_rule_approved)
 AND NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_visa_facts_v1 WHERE expires_at>clock_timestamp())
 INTO unqualified;
 IF unqualified IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'PROD_HTTP_STOP_SOURCE_QUALIFICATION_STATE_CHANGED_REVIEW_REQUIRED' USING ERRCODE='P7998'; END IF;
 SELECT jsonb_object_agg(p.oid::text,to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody']) INTO functions
 FROM pg_proc p WHERE p.oid IN(
  'official_v3_guard_private.catalog_status_v1()'::pg_catalog.regprocedure,
  'official_v3_guard_private.assert_catalog_v1()'::pg_catalog.regprocedure,
  'official_v3_guard_private.require_open_v1()'::pg_catalog.regprocedure,
  'public.official_v3_guard_alarm_status_v1()'::pg_catalog.regprocedure,
  'official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure);
 INSERT INTO pg_temp.prod_http_before VALUES(true,official_v3_guard_private.catalog_status_v1(),
  native,pg_temp.prod_http_protected_state(),source_history,owner_history,last_number,called,hwm,base+1025,unqualified,functions);
 IF (SELECT catalog FROM pg_temp.prod_http_before WHERE singleton) IS DISTINCT FROM
  (SELECT catalog FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton)
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_OLD_CATALOG_CHANGED_WHILE_WAITING' USING ERRCODE='P7998'; END IF;
 IF (SELECT protected_state#>'{cron_snapshot,contract}' FROM pg_temp.prod_http_before WHERE singleton)
  IS DISTINCT FROM '[{"jobid":"6","jobname":"jetnity-at-production-source-collect-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"f16474de9c9e48b24d2ac84bc0ba3ac90d5ff401ef539ff1efa6ae94068dcf3f","full_row_sha256":"587b3bc0187f14965a579c7d1d13b4dbfe8dc82c06836d767c4b2178c61292a0"},{"jobid":"5","jobname":"jetnity-at-production-source-enqueue-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"d7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890","full_row_sha256":"1971883b244c0fd1acad713cf8c5b8d62d649f9a121bfbbd547057aea0e23be3"},{"jobid":"7","jobname":"jetnity-at-production-source-renew-v1","schedule":"2-59/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"7f97fd0c29c97f45c4f5b3458c60ce59711d2d10589a1be16656211f96141593","full_row_sha256":"c92294cf6d926896dcf845bd8a9113fada0d20636e24d3a906f85c8c3907e36f"},{"jobid":"4","jobname":"jetnity-ch-de-prod-import-v1","schedule":"* * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"87241ddeaf94b27c22676857c098492029dcbdcf8ac90ba7a5feaf2f62f43144","full_row_sha256":"6319ae3dc4b50ebe3cca6e1a4514c8a7ea6a3352697681a88d0612d1f8bba4de"},{"jobid":"2","jobname":"jetnity-official-truth-production-guard-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863","full_row_sha256":"2d8d36409000dc6c7ad9423d8fa033d35a0034ec0e16de5c646ecc98b8c78893"}]'::jsonb
 THEN RAISE EXCEPTION 'PROD_HTTP_STOP_CRON_CHANGED_BEFORE_FIRST_INSTALL_DDL' USING ERRCODE='P7998'; END IF;
END $fresh_locked_high_water_and_snapshot$;
SAVEPOINT production_before_install;

CREATE SCHEMA jetnity_pgnet_allocator_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_pgnet_allocator_private FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
DO $create_owned_logged_sequence$
DECLARE first_number bigint;
BEGIN
 SELECT first_id INTO STRICT first_number FROM pg_temp.prod_http_before WHERE singleton;
 EXECUTE format('CREATE SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH %s CACHE 1 NO CYCLE',first_number);
END $create_owned_logged_sequence$;
REVOKE ALL ON SEQUENCE jetnity_pgnet_allocator_private.http_request_id_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $assign$
BEGIN
 IF TG_RELID<>'net.http_request_queue'::pg_catalog.regclass OR TG_OP<>'INSERT'
 OR TG_WHEN<>'BEFORE' OR TG_LEVEL<>'ROW' OR TG_NARGS<>0
 OR TG_NAME<>'jetnity_pgnet_request_id_v1'
 OR pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
  RAISE EXCEPTION 'PROD_ALLOCATOR_EXACT_QUEUE_TRIGGER_REQUIRED' USING ERRCODE='P7998';
 END IF;
 -- Every regular queue producer receives its ID from the same private allocator.
 -- Incoming/default IDs are ignored. Legitimate nested triggers are allowed.
 NEW.id:=pg_catalog.nextval('jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass);
 RETURN NEW;
END $assign$;

REVOKE ALL ON FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER jetnity_pgnet_request_id_v1 BEFORE INSERT ON net.http_request_queue
 FOR EACH ROW EXECUTE FUNCTION jetnity_pgnet_allocator_private.assign_request_id_v1();

DO $exact_owned_allocator_and_managed_delta$
DECLARE original pg_temp.prod_http_before%ROWTYPE; native jsonb;
BEGIN
 SELECT * INTO STRICT original FROM pg_temp.prod_http_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
  AND c.relkind='S' AND c.relpersistence='p' AND c.relowner='postgres'::pg_catalog.regrole
  AND s.seqtypid='pg_catalog.int8'::pg_catalog.regtype AND s.seqincrement=1 AND s.seqcache=1
  AND s.seqmin=1 AND s.seqmax=9223372036854775807 AND NOT s.seqcycle)
 OR NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  AND p.proowner='postgres'::pg_catalog.regrole AND p.prosecdef AND p.provolatile='v'
  AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype AND p.pronargs=0
  AND p.proconfig=ARRAY['search_path=pg_catalog']
  AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='5074ea591410f77e797956b6c37b7379edee30c534707779d690c0ff56d2d1e1')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
  AND tgname='jetnity_pgnet_request_id_v1' AND tgtype=7 AND tgenabled='O'
  AND NOT tgisinternal AND tgconstraint=0 AND tgnargs=0 AND tgqual IS NULL
  AND tgfoid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure)
 THEN RAISE EXCEPTION 'PROD_HTTP_NEW_ALLOCATOR_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE oid='jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
  AND nspowner='postgres'::pg_catalog.regrole)
 OR EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
  WHERE n.oid='jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
   AND (n.nspowner<>'postgres'::pg_catalog.regrole OR a.grantee<>'postgres'::pg_catalog.regrole))
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('S',c.relowner))) a
  WHERE c.oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
   AND a.grantee<>'postgres'::pg_catalog.regrole)
 OR EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  WHERE p.oid='jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
   AND a.grantee<>'postgres'::pg_catalog.regrole)
 THEN RAISE EXCEPTION 'PROD_HTTP_PRIVATE_ALLOCATOR_ACL_NOT_OWNER_ONLY' USING ERRCODE='P7998'; END IF;
 native:=pg_temp.prod_http_native_state();
 IF (native-'queue_relation'-'queue_triggers') IS DISTINCT FROM (original.native-'queue_relation'-'queue_triggers')
 OR ((native->'queue_relation')-'relhastriggers') IS DISTINCT FROM ((original.native->'queue_relation')-'relhastriggers')
 OR native#>'{queue_relation,relhastriggers}' IS DISTINCT FROM 'true'::jsonb
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_MANAGED_TRANSPORT_DELTA' USING ERRCODE='P7998'; END IF;
END $exact_owned_allocator_and_managed_delta$;

-- A new immutable Production-v3 successor; none of the old baseline rows are rewritten.
CREATE TABLE official_v3_guard_private.bg1_production_http_allocator_v4(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 publisher_function_digest text NOT NULL CHECK(publisher_function_digest~'^[a-f0-9]{64}$'),
 transport_metadata jsonb NOT NULL CHECK(jsonb_typeof(transport_metadata)='object'),
 transport_metadata_digest text NOT NULL CHECK(transport_metadata_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 catalog jsonb NOT NULL CHECK(jsonb_typeof(catalog)='object')
);
ALTER TABLE official_v3_guard_private.bg1_production_http_allocator_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_production_http_allocator_v4 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_production_http_allocator_v4 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_production_http_allocator_v4
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_production_http_allocator_v4
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_production_http_allocator_v4 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','jetnity_weather_private','official_v3_at_production_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','jetnity_bg1_alarm_kind_v2','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname IN ('profiles','saved_offers') OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype FROM pg_depend d
      WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)) d
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype FROM pg_shdepend d
      WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
        OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))) d
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
 UNION ALL SELECT 'transport:production_http_id_allocator_v4',jsonb_build_object('native',jsonb_build_object(
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
),'method_domain',jsonb_build_object(
 'type',(SELECT to_jsonb(t) FROM pg_type t WHERE t.oid=to_regtype('net.http_method')),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex'))
  ORDER BY c.oid),'[]'::pg_catalog.jsonb) FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')))
,'cron_contract',(
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
),'allocator',jsonb_build_object(
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
))
)
SELECT jsonb_object_agg_unique(key,value) FROM entries
$function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE allocator_v4 official_v3_guard_private.bg1_production_http_allocator_v4%ROWTYPE;
 optimized official_v3_guard_private.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT allocator_v4 FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM official_v3_guard_private.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM official_v3_guard_private.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (official_v3_guard_private.catalog_status_v1()->'transport:production_http_id_allocator_v4')
 OR allocator_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_at_production_private.renew_ch_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE latest record; h official_v3_method_private.heads_v1%ROWTYPE;
 previous record; as_of timestamptz; seen timestamptz; digest text; official_count integer;
 expires timestamptz;
BEGIN

 -- Production HTTP allocator prerequisite: real legal/customer source evidence.
 -- A transport repair never qualifies a source or turns research into a fact.
 IF session_user<>'postgres' OR current_user<>session_user THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1
   WHERE source_qualified IS DISTINCT FROM true OR research_only IS DISTINCT FROM false)
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.first_originals_v1
   WHERE legal_source_approved IS DISTINCT FROM true OR customer_rule_approved IS DISTINCT FROM true)
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1 p
   JOIN official_v3_at_production_private.first_originals_v1 o USING(source_id)
   WHERE o.raw_sha=p.original_sha AND o.raw_bytes=p.original_bytes
    AND encode(sha256(o.raw_body),'hex')=p.original_sha)<>3
 THEN RETURN 0; END IF;
 IF session_user<>'postgres' OR current_user<>session_user
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RETURN 0; END IF;
 SELECT * INTO latest FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1 FOR SHARE;
 as_of:=clock_timestamp();
 IF NOT FOUND OR latest.started_at>as_of
   OR latest.started_at<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT count(*),min(observed_at) INTO official_count,seen
 FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only');
 IF official_count<>3 OR seen IS NULL OR seen<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
    AND jobname IN ('jetnity-at-production-source-enqueue-v1',
                    'jetnity-at-production-source-collect-v1',
                    'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN 0; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM official_v3_at_production_private.first_originals_v1 o
   JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
   WHERE o.source_id='bmi-visa-nationality-matrix'
     AND p.original_sha='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND o.raw_sha=p.original_sha AND o.raw_bytes=498415
     AND position('(Stand: 6.11.2026)' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('EU-Freiz&uuml;gigkeit' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('Schweiz' IN convert_from(o.raw_body,'UTF8'))>0)
 THEN RETURN 0; END IF;
 IF EXISTS(
  SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 r
  JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
  WHERE r.batch_id=latest.batch_id
   AND ((r.source_status='unchanged_exact'
     AND (r.body_sha IS DISTINCT FROM p.original_sha OR r.bytes<>p.original_bytes))
   OR (r.source_status='unchanged_asset_version_only'
     AND (r.source_id<>'bmeia-bern-how-to-apply'
       OR p.normalization<>'bmeia-theme-assets-v1'
       OR p.canonical_sha IS DISTINCT FROM
       'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
       OR r.bytes<>p.original_bytes))))
 THEN RETURN 0; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>1 OR h.method_digest<>
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 OR h.package_digest<>
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 OR h.epoch<1
 THEN RETURN 0; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 SELECT * INTO previous FROM official_v3_at_production_private.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1 FOR SHARE;
 -- Once any official source is actually changed, do NOT auto-renew a
 -- later reverted source under the old method. Owner requalification required.
 IF FOUND AND EXISTS(
   SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
   WHERE o.batch_id>previous.source_batch_id AND o.batch_id<=latest.batch_id
     AND o.source_status='changed'
 ) THEN RETURN 0; END IF;
 IF FOUND AND (previous.source_batch_id=latest.batch_id
   OR previous.source_checked_at>=seen) THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(
   source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id;
 IF digest IS NULL THEN RETURN 0; END IF;
 as_of:=clock_timestamp();
 expires:=least(as_of+interval '1 hour',seen+interval '70 minutes',
   '2027-11-16T00:00:00Z'::timestamptz);
 IF expires<=as_of OR as_of>=seen+interval '70 minutes'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v1(
  source_batch_id,predecessor_version_id,method_epoch,method_id,
  method_revision,method_digest,package_digest,source_digest,
  verified_at,source_checked_at,expires_at)
 VALUES(latest.batch_id,previous.version_id,h.epoch,
 'jetnity-destination-primary-at-visa',1,
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
 digest,as_of,seen,expires)
 ON CONFLICT DO NOTHING;
 IF FOUND THEN
   PERFORM official_v3_guard_private.assert_catalog_v1();
   RETURN 1;
 END IF;
 RETURN 0;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $function$;

-- Baseline data is inserted only after a SINGLE captured catalog has passed the
-- exact predecessor-delta and observed Cron-contract checks in the following DO.

DO $exact_successor_postcheck$
DECLARE original pg_temp.prod_http_before%ROWTYPE; live_catalog jsonb; item record; function_rows jsonb;
 captured_transport jsonb;
BEGIN
 SELECT * INTO STRICT original FROM pg_temp.prod_http_before WHERE singleton;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass
  AND relkind='r' AND relpersistence='p' AND relowner='postgres'::pg_catalog.regrole
  AND relrowsecurity AND relforcerowsecurity)
 OR EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
  WHERE c.oid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass AND a.grantee<>'postgres'::pg_catalog.regrole)
 OR (SELECT count(*) FROM pg_policy WHERE polrelid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_policy WHERE polrelid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass
  AND polname='postgres_only' AND polcmd='*' AND polpermissive
  AND polroles=ARRAY['postgres'::pg_catalog.regrole::oid]
  AND pg_get_expr(polqual,polrelid)='true' AND pg_get_expr(polwithcheck,polrelid)='true')
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass)<>2
 OR (SELECT count(*) FROM pg_trigger WHERE tgrelid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass
  AND tgenabled='O' AND NOT tgisinternal AND tgconstraint=0 AND tgnargs=0 AND tgqual IS NULL
  AND tgfoid='official_v3_guard_private.immutable_v1()'::pg_catalog.regprocedure
  AND ((tgname='immutable_rows' AND tgtype=27) OR (tgname='immutable_truncate' AND tgtype=34)))<>2
 THEN RAISE EXCEPTION 'PROD_HTTP_NEW_BASELINE_OWNER_ACL_RLS_IMMUTABILITY_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_protected_state() IS DISTINCT FROM original.protected_state
 THEN RAISE EXCEPTION 'PROD_HTTP_PREDECESSOR_DATA_COUNTER_OR_CRON_CHANGED' USING ERRCODE='P7998'; END IF;
 SELECT jsonb_object_agg(p.oid::text,to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody']) INTO function_rows
 FROM pg_proc p WHERE p.oid::text IN(SELECT jsonb_object_keys(original.guard_function_rows));
 IF function_rows IS DISTINCT FROM original.guard_function_rows THEN
  RAISE EXCEPTION 'PROD_HTTP_OLD_FUNCTION_OWNER_ACL_CONFIG_CHANGED' USING ERRCODE='P7998'; END IF;
 FOR item IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','66612df9bbc2ba0aeb016f97c5c245c76f176e13c02bd1150c5cc618c5363601'),
  ('official_v3_guard_private.assert_catalog_v1()','4d9f578d59ef1f998cf9a26385c078eaacd8dbd375629f965d8feaeb46582eb8'),
  ('official_v3_guard_private.require_open_v1()','de352dc414b5a5545cc0cb0edc245ed2312777d73b250adcdc9b93ca804ebcae'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('official_v3_at_production_private.renew_ch_v1()','572a243b45785800f67f372c0667397d448e1eea5769c74065d4709a59e3b562')
 ) expected(signature,digest) LOOP
  IF encode(sha256(convert_to((SELECT prosrc FROM pg_proc WHERE oid=to_regprocedure(item.signature)),'UTF8')),'hex') IS DISTINCT FROM item.digest
  THEN RAISE EXCEPTION 'PROD_HTTP_NEW_FUNCTION_SOURCE_MISMATCH: %',item.signature USING ERRCODE='P7998'; END IF;
 END LOOP;
 IF encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.audit_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
  IS DISTINCT FROM 'b6f56232b998dea7868bf9767f8e9012282a43512a1e5fd622c9824e62fd2fff'
 OR encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.check_control_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
  IS DISTINCT FROM original.catalog->('function:'||'official_v3_guard_private.check_control_v1()'::pg_catalog.regprocedure::oid)->>'definition'
 THEN RAISE EXCEPTION 'PROD_HTTP_AUDIT_OR_CONTROL_CHANGED' USING ERRCODE='P7998'; END IF;
 -- SINGLE_CAPTURE_BEGIN: no later catalog_status result is used for insertion.
 live_catalog:=official_v3_guard_private.catalog_status_v1();
 
 -- Preserve every old catalog key and every old function attribute except the
 -- five reviewed definitions. This is not a whole-current-catalog blind reseal.
 IF EXISTS(SELECT 1 FROM jsonb_each(original.catalog) old
  LEFT JOIN jsonb_each(live_catalog) actual ON actual.key=old.key
  WHERE CASE WHEN old.key IN (
   'function:'||'official_v3_guard_private.catalog_status_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_guard_private.assert_catalog_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_guard_private.require_open_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'public.official_v3_guard_alarm_status_v1()'::pg_catalog.regprocedure::oid,
   'function:'||'official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure::oid)
  THEN (old.value-'definition') IS DISTINCT FROM (actual.value-'definition')
  ELSE old.value IS DISTINCT FROM actual.value END)
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_PREDECESSOR_CATALOG_DELTA' USING ERRCODE='P7998'; END IF;
 IF EXISTS(
 WITH base AS (SELECT oid,reltoastrelid FROM pg_class WHERE oid='official_v3_guard_private.bg1_production_http_allocator_v4'::pg_catalog.regclass),
 relations AS (SELECT oid FROM base UNION SELECT reltoastrelid FROM base WHERE reltoastrelid<>0
  UNION SELECT indexrelid FROM pg_index WHERE indrelid IN(SELECT oid FROM base UNION SELECT reltoastrelid FROM base)),
 relation_types AS (SELECT oid,typarray FROM pg_type WHERE typrelid IN(SELECT oid FROM relations)),
 objects AS (
  SELECT 'pg_class'::pg_catalog.regclass::oid AS classid,oid AS objid FROM relations
  UNION SELECT 'pg_type'::pg_catalog.regclass,oid FROM relation_types
  UNION SELECT 'pg_type'::pg_catalog.regclass,typarray FROM relation_types WHERE typarray<>0
  UNION SELECT 'pg_constraint'::pg_catalog.regclass,oid FROM pg_constraint WHERE conrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_trigger'::pg_catalog.regclass,oid FROM pg_trigger WHERE tgrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_policy'::pg_catalog.regclass,oid FROM pg_policy WHERE polrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_attrdef'::pg_catalog.regclass,oid FROM pg_attrdef WHERE adrelid IN(SELECT oid FROM base)
  UNION SELECT 'pg_namespace'::pg_catalog.regclass,'jetnity_pgnet_allocator_private'::pg_catalog.regnamespace
  UNION SELECT 'pg_class'::pg_catalog.regclass,'jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass
  UNION SELECT 'pg_proc'::pg_catalog.regclass,'jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure
  UNION SELECT 'pg_trigger'::pg_catalog.regclass,oid FROM pg_trigger WHERE tgrelid='net.http_request_queue'::pg_catalog.regclass
   AND tgname='jetnity_pgnet_request_id_v1'
 ), additions AS (SELECT a.* FROM jsonb_each(live_catalog) a WHERE NOT (original.catalog ? a.key))
 SELECT 1 FROM additions a WHERE NOT CASE
  WHEN a.key='transport:production_http_id_allocator_v4' THEN true
  WHEN split_part(a.key,':',1) IN('relation','index') THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_class'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='type' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_type'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='constraint' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_constraint'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='trigger' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_trigger'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='policy' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_policy'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='default' THEN EXISTS(SELECT 1 FROM objects o
   WHERE o.classid='pg_attrdef'::pg_catalog.regclass AND o.objid=split_part(a.key,':',2)::oid)
  WHEN split_part(a.key,':',1)='attribute' THEN split_part(a.key,':',2)::oid IN(SELECT oid FROM relations)
  WHEN split_part(a.key,':',1) IN('dependency','shared') THEN EXISTS(SELECT 1 FROM objects o
   WHERE (o.classid=(a.value->>'classid')::oid AND o.objid=(a.value->>'objid')::oid)
   OR (split_part(a.key,':',1)='dependency' AND o.classid=(a.value->>'refclassid')::oid AND o.objid=(a.value->>'refobjid')::oid))
  ELSE false END)
 THEN RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_ADDITIVE_CATALOG_OBJECT' USING ERRCODE='P7998'; END IF;

 PERFORM pg_temp.prod_http_validate_cron_capture(original.protected_state->'cron_snapshot',live_catalog);
 captured_transport:=live_catalog->'transport:production_http_id_allocator_v4';
 IF captured_transport IS NULL OR jsonb_typeof(captured_transport) IS DISTINCT FROM 'object'
 THEN RAISE EXCEPTION 'PROD_HTTP_CAPTURED_TRANSPORT_MISSING' USING ERRCODE='P7998'; END IF;
 INSERT INTO official_v3_guard_private.bg1_production_http_allocator_v4(
  singleton,predecessor_catalog_digest,predecessor_baseline_digest,publisher_function_digest,
  transport_metadata,transport_metadata_digest,required_generation,proof_not_before,catalog)
 SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
  encode(sha256(convert_to(to_jsonb(v)::text,'UTF8')),'hex'),
  encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
  captured_transport,encode(sha256(convert_to(captured_transport::text,'UTF8')),'hex'),
  greatest(s.generation,legacy.required_generation)+1,clock_timestamp(),live_catalog
 FROM official_v3_guard_private.query_cost_baseline_v1 v
 CROSS JOIN official_v3_guard_private.bg1_transient_baseline_v3 legacy
 CROSS JOIN official_v3_guard_private.state_v1 s
 WHERE v.singleton AND legacy.singleton AND s.singleton;
 -- SINGLE_CAPTURE_END: subsequent reads can only reject drift, never reseal it.
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.check_control_v1();
 PERFORM official_v3_guard_private.check_retirements_v1();
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_production_http_allocator_v4)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_production_http_allocator_v4 v CROSS JOIN official_v3_guard_private.state_v1 s
  WHERE v.singleton AND s.singleton AND v.required_generation>s.generation
  AND v.proof_not_before>s.last_proof_started AND v.catalog=live_catalog)
 OR public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'unavailable'
 THEN RAISE EXCEPTION 'PROD_HTTP_FRESH_NATURAL_FULL_PROOF_NOT_ENFORCED' USING ERRCODE='P7998'; END IF;
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'PROD_HTTP_OPEN_BEFORE_NEW_FULL_PROOF' USING ERRCODE='P7998';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN
  IF SQLERRM<>'bg1 recovery fresh full proof required' THEN RAISE; END IF;
 END;
 IF NOT original.source_unqualified OR official_v3_at_production_private.renew_ch_v1() IS DISTINCT FROM 0
 OR pg_temp.prod_http_protected_state() IS DISTINCT FROM original.protected_state
 THEN RAISE EXCEPTION 'PROD_HTTP_UNQUALIFIED_SOURCE_PUBLISHER_NOT_CLOSED' USING ERRCODE='P7998'; END IF;
 -- The new qualifier barrier is the exact first operational block in the pinned body.
 -- No source/fact/Owner/state write, audit call or accepted positive renewal occurred.
END $exact_successor_postcheck$;

-- No probe ID is consumed by this COMMIT candidate. The first ordinary queue INSERT
-- after COMMIT gets first_id. Old defaults may still consume old IDs, then the trigger
-- replaces them; never reset that managed counter to conceal gaps.
DO $installation_no_probe_and_range_postcheck$
DECLARE first_number bigint; current_number bigint; called boolean;
BEGIN
 SELECT first_id INTO STRICT first_number FROM pg_temp.prod_http_before WHERE singleton;
 SELECT last_value,is_called INTO STRICT current_number,called FROM jetnity_pgnet_allocator_private.http_request_id_v1;
 IF current_number<>first_number OR called IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'PROD_HTTP_UNEXPECTED_ALLOCATION_BEFORE_COMMIT' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_protected_state() IS DISTINCT FROM (SELECT protected_state FROM pg_temp.prod_http_before WHERE singleton)
 THEN RAISE EXCEPTION 'PROD_HTTP_ORIGINAL_STATE_CHANGED_BEFORE_COMMIT' USING ERRCODE='P7998'; END IF;
END $installation_no_probe_and_range_postcheck$;
SELECT jsonb_build_object('result','PROD_HTTP_INSTALL_CHECKS_COMPLETE_COMMIT_STILL_MUST_SUCCEED',
 'fresh_locked_hwm',b.history_max::text,'legacy_value',b.legacy_value::text,'first_id',b.first_id::text,
 'unused_safety_gap',1024,
 'successor_canonical_sha256',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'required_generation',v.required_generation,'proof_not_before',v.proof_not_before,
 'helper_definition_sha256',encode(sha256(convert_to(pg_get_functiondef('jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'source_qualification_changed',false,'positive_facts_added',false,'http_or_wake_called',false,
 'natural_fresh_complete_bg1_proof_required',true,'postcommit_readback_required',true) AS result
FROM pg_temp.prod_http_before b CROSS JOIN official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE b.singleton AND v.singleton;
RELEASE SAVEPOINT production_before_install;
DO $last_optimistic_cron_check_before_install_commit$
BEGIN
 PERFORM pg_temp.prod_http_assert_cron_unchanged(
  (SELECT protected_state->'cron_snapshot' FROM pg_temp.prod_http_before WHERE singleton));
END $last_optimistic_cron_check_before_install_commit$;
COMMIT;
-- A result row before COMMIT is not proof that COMMIT succeeded. Preserve both actual
-- execution completion and separate native readback. Do not reopen/reset any status.
-- After COMMIT: never drop the trigger/schema or rewind either counter as rollback.
-- Use the separately approved 30/40 Fence files to stop new captured queue INSERTs.
