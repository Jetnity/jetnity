-- DEV ONLY: fixed connector target yfvbxvijcorffwxbxahl.
-- Never run against Production. SQL itself does not authenticate a project ref.
-- No real Cron DML, no HTTP/source/publisher/Owner call, no sequence advance.
-- No GRANT, REVOKE, SET ROLE, owner/role changes, extension or restart action.
-- Only this exact fixture is writable; existing Dev v8/allocator stay installed.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog,pg_temp;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='800ms';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL transaction_timeout='30s';
DO $dev_context$
BEGIN
 IF current_database() IS DISTINCT FROM 'postgres'
 OR current_user IS DISTINCT FROM 'postgres' OR session_user IS DISTINCT FROM 'postgres'
 OR current_setting('server_version_num') IS DISTINCT FROM '170006'
 OR current_setting('session_replication_role') NOT IN('origin','local')
 OR current_setting('transaction_isolation') IS DISTINCT FROM 'read committed'
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_net') IS DISTINCT FROM '0.20.4'
 OR (SELECT extversion FROM pg_extension WHERE extname='pg_cron') IS DISTINCT FROM '1.6.4'
 OR to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NULL
 OR to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(
  'official_v3_guard_private.catalog_status_v1()')),'UTF8')),'hex')
  IS DISTINCT FROM 'a37bdaaa546ab1bcf3baac301d83de3887765ae16532f149d421a9c1dd0780c4'
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_WRONG_CONTEXT' USING ERRCODE='P7998'; END IF;
 IF has_table_privilege(current_user,'cron.job','SELECT') IS DISTINCT FROM true
 OR has_table_privilege(current_user,'cron.job','MAINTAIN') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','UPDATE') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','DELETE') IS DISTINCT FROM false
 OR has_table_privilege(current_user,'cron.job','TRUNCATE') IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_EXISTING_RIGHTS_CHANGED' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8)<>1
 OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8
  WHERE singleton AND catalog=official_v3_guard_private.catalog_status_v1())
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_EXISTING_V8_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 IF (SELECT count(*) FROM (SELECT 1 FROM pg_roles LIMIT 129) s)>128
 OR (SELECT count(*) FROM (SELECT 1 FROM pg_auth_members LIMIT 513) s)>512
 OR (SELECT count(*) FROM (SELECT 1 FROM cron.job LIMIT 129) s)>128
 OR (SELECT count(*) FROM (SELECT 1 FROM official_v3_source_renewal_private.facts_v1 LIMIT 1001) s)>1000
 OR (SELECT count(*) FROM (SELECT 1 FROM official_v3_at_private.whole_originals_v2 LIMIT 17) s)>16
 THEN RAISE EXCEPTION 'DEV_CRON_TEST_METADATA_CAP' USING ERRCODE='P7998'; END IF;
END $dev_context$;
LOCK TABLE cron.job IN ACCESS SHARE MODE NOWAIT;
DO $fixture_mutex$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771122,8101) OR NOT pg_try_advisory_xact_lock(771122,8102)
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_BUSY' USING ERRCODE='P7998'; END IF;
END $fixture_mutex$;

CREATE FUNCTION pg_temp.dev_cron_existing_state() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $existing_state$
 SELECT jsonb_build_object(
 'catalog_sha256',encode(sha256(convert_to(official_v3_guard_private.catalog_status_v1()::text,'UTF8')),'hex'),
 'v8_sha256',(SELECT encode(sha256(convert_to(to_jsonb(b)::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 b WHERE singleton),
 'roles_sha256',(SELECT encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_object(
  'oid',oid,'name',rolname,'super',rolsuper,'inherit',rolinherit,'create_role',rolcreaterole,
  'create_db',rolcreatedb,'login',rolcanlogin,'replication',rolreplication,
  'bypass_rls',rolbypassrls,'limit',rolconnlimit,'valid_until',rolvaliduntil,
  'config_sha256',encode(sha256(convert_to(coalesce(rolconfig::text,''),'UTF8')),'hex')
 ) ORDER BY oid),'[]'::jsonb)::text,'UTF8')),'hex') FROM pg_roles),
 'memberships_sha256',(SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(m)
  ORDER BY m.oid),'[]'::jsonb)::text,'UTF8')),'hex') FROM pg_auth_members m),
 'explicit_acls_sha256',(WITH a AS (
  SELECT 'schema:'||oid::text key,nspacl::text value FROM pg_namespace
   WHERE nspacl IS NOT NULL AND nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'relation:'||c.oid::text,c.relacl::text FROM pg_class c
   JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE c.relacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'function:'||p.oid::text,p.proacl::text FROM pg_proc p
   JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.proacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'type:'||t.oid::text,t.typacl::text FROM pg_type t
   JOIN pg_namespace n ON n.oid=t.typnamespace
   WHERE t.typacl IS NOT NULL AND n.nspname NOT LIKE 'pg_temp_%'
  UNION ALL SELECT 'database:'||oid::text,datacl::text FROM pg_database WHERE datacl IS NOT NULL
  UNION ALL SELECT 'default:'||oid::text,to_jsonb(d)::text FROM pg_default_acl d
 ) SELECT encode(sha256(convert_to(coalesce(jsonb_object_agg(key,value),'{}'::jsonb)::text,'UTF8')),'hex') FROM a),
 'cron_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(j)::text,'|'
  ORDER BY jobid),''),'UTF8')),'hex') FROM cron.job j),
 'facts_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(to_jsonb(f)::text,'|'
  ORDER BY fact_id),''),'UTF8')),'hex') FROM official_v3_source_renewal_private.facts_v1 f),
 'originals_sha256',(SELECT encode(sha256(convert_to(coalesce(string_agg(
  ((to_jsonb(o)-'original_body')||jsonb_build_object('actual_sha',encode(sha256(original_body),'hex')))::text,
  '|' ORDER BY source_id COLLATE "C"),''),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2 o),
 'publisher_definition_sha256',encode(sha256(convert_to(pg_get_functiondef(
  'official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),'UTF8')),'hex'),
 'allocator_definition_sha256',encode(sha256(convert_to(pg_get_functiondef(
  'jetnity_pgnet_allocator_private.assign_request_id_v1()'::regprocedure),'UTF8')),'hex')
 )
$existing_state$;

-- This cleanup is safe after any earlier failed file. Existing foreign objects
-- cause STOP; no CASCADE, no broad cleanup and no unreviewed identifier input.
CREATE TEMP TABLE pg_temp.dev_cron_cleanup_state(before_state jsonb,had_fixture boolean) ON COMMIT DROP;
DO $cleanup_exact_fixture$
DECLARE state_before jsonb;
BEGIN
 IF to_regnamespace('jetnity_dev_cron_guard_probe_20261122') IS NULL THEN
  INSERT INTO pg_temp.dev_cron_cleanup_state VALUES(pg_temp.dev_cron_existing_state(),false);
  RETURN;
 END IF;
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='jetnity_dev_cron_guard_probe_20261122') IS DISTINCT FROM 'postgres'::regrole::oid
 OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122')<>4
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122' AND (c.relowner<>'postgres'::regrole
   OR c.relname NOT IN('jobs_v1','jobs_v1_pkey','before_v1','before_v1_pkey')))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122')
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_UNEXPECTED_OBJECTS_STOP' USING ERRCODE='P7998'; END IF;
 SELECT state INTO STRICT state_before FROM jetnity_dev_cron_guard_probe_20261122.before_v1 WHERE singleton;
 IF state_before IS DISTINCT FROM pg_temp.dev_cron_existing_state()
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_EXISTING_STATE_CHANGED_STOP' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_cleanup_state VALUES(state_before,true);
 DROP TABLE jetnity_dev_cron_guard_probe_20261122.jobs_v1;
 DROP TABLE jetnity_dev_cron_guard_probe_20261122.before_v1;
 DROP SCHEMA jetnity_dev_cron_guard_probe_20261122;
END $cleanup_exact_fixture$;
DO $cleanup_post$
BEGIN
 IF to_regnamespace('jetnity_dev_cron_guard_probe_20261122') IS NOT NULL
 OR pg_temp.dev_cron_existing_state() IS DISTINCT FROM (SELECT before_state FROM pg_temp.dev_cron_cleanup_state)
 THEN RAISE EXCEPTION 'DEV_CRON_CLEANUP_ABSENCE_OR_PRESERVATION_FAILED' USING ERRCODE='P7998'; END IF;
END $cleanup_post$;
DROP FUNCTION pg_temp.dev_cron_existing_state();
SELECT 'DEV_CRON_PRIVATE_FIXTURE_CLEANUP_READY_TO_COMMIT' AS result,
 (SELECT had_fixture FROM pg_temp.dev_cron_cleanup_state) AS fixture_was_present,
 true AS exact_fixture_absent_before_commit,true AS existing_state_and_rights_preserved,
 false AS production_accessed,false AS real_cron_changed,false AS http_started;
COMMIT;
-- Root must independently read actual post-commit absence; pre-commit output
-- alone is deliberately not called a durable cleanup proof.
