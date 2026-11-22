-- PREPARED ONLY / NOT EXECUTED. Separate exact post-install Production READ scope.
-- Expected new definitions are checked before calling the known read-only Guard/status functions.
-- This captures a COMMITTED successor pin for a later Fence; it does not authorize a Fence.
-- One transaction, no retry. No audit/Publisher/HTTP/Owner routine, role change or counter allocation.
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
SELECT jsonb_build_object('result','PROD_HTTP_COMMITTED_READBACK_OBSERVED',
 'observed_at',statement_timestamp(),'postmaster_started_at',pg_postmaster_start_time(),
 'read_only',current_setting('transaction_read_only')='on',
 'successor_canonical_sha256',encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'catalog_sha256',encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 'transport_metadata_sha256',v.transport_metadata_digest,
 'cron_contract_matches_reviewed_full_rows',(v.transport_metadata->'cron_contract')='[{"jobid":"6","jobname":"jetnity-at-production-source-collect-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"f16474de9c9e48b24d2ac84bc0ba3ac90d5ff401ef539ff1efa6ae94068dcf3f","full_row_sha256":"587b3bc0187f14965a579c7d1d13b4dbfe8dc82c06836d767c4b2178c61292a0"},{"jobid":"5","jobname":"jetnity-at-production-source-enqueue-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"d7eba2069a12188b34a98099506ae3368f7c7f5ff41c8e3fe2d153ea16278890","full_row_sha256":"1971883b244c0fd1acad713cf8c5b8d62d649f9a121bfbbd547057aea0e23be3"},{"jobid":"7","jobname":"jetnity-at-production-source-renew-v1","schedule":"2-59/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"7f97fd0c29c97f45c4f5b3458c60ce59711d2d10589a1be16656211f96141593","full_row_sha256":"c92294cf6d926896dcf845bd8a9113fada0d20636e24d3a906f85c8c3907e36f"},{"jobid":"4","jobname":"jetnity-ch-de-prod-import-v1","schedule":"* * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"87241ddeaf94b27c22676857c098492029dcbdcf8ac90ba7a5feaf2f62f43144","full_row_sha256":"6319ae3dc4b50ebe3cca6e1a4514c8a7ea6a3352697681a88d0612d1f8bba4de"},{"jobid":"2","jobname":"jetnity-official-truth-production-guard-v1","schedule":"*/5 * * * *","active":true,"database":"postgres","username":"postgres","command_sha256":"8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863","full_row_sha256":"2d8d36409000dc6c7ad9423d8fa033d35a0034ec0e16de5c646ecc98b8c78893"}]'::jsonb,
 'publisher_definition_sha256',v.publisher_function_digest,
 'required_generation',v.required_generation,'proof_not_before',v.proof_not_before,
 'own_sequence',(SELECT jsonb_build_object('last_value',last_value::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1),
 'own_sequence_logged',(SELECT relpersistence='p' FROM pg_class WHERE oid='jetnity_pgnet_allocator_private.http_request_id_v1'::pg_catalog.regclass),
 'helper_definition_sha256',encode(sha256(convert_to(pg_get_functiondef('jetnity_pgnet_allocator_private.assign_request_id_v1()'::pg_catalog.regprocedure),'UTF8')),'hex'),
 'public_guard_status',public.official_v3_guard_alarm_status_v1(),
 'fresh_complete_state_run_count',(SELECT count(*) FROM official_v3_guard_private.state_v1 s
  JOIN official_v3_guard_private.runs_v1 r ON r.generation=s.generation AND r.due_at=s.last_due
   AND r.started_at=s.last_started AND r.proof_started_at=s.last_proof_started AND r.finished_at=s.last_finished
  WHERE s.singleton AND r.outcome='complete' AND s.generation>=v.required_generation
   AND r.proof_started_at>=v.proof_not_before AND s.incident_generation=s.resumed_generation
   AND s.last_finished<=s.last_started+interval '30 seconds'
   AND s.valid_until=s.last_due+interval '5 minutes 30 seconds'
   AND statement_timestamp()>=s.last_finished AND statement_timestamp()<s.valid_until),
 'natural_http_operational_proof_performed_by_this_query',false,
 'positive_source_renewal_proven',false,'fence_or_followup_permission',false) AS result
FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
ROLLBACK;
