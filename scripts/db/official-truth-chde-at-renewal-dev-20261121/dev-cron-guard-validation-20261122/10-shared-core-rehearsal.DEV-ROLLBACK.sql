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
DO $fixture_shape$
BEGIN
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='jetnity_dev_cron_guard_probe_20261122')
   IS DISTINCT FROM 'postgres'::regrole::oid
 OR EXISTS(SELECT 1 FROM pg_namespace n,
   LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
   WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122' AND a.grantee<>n.nspowner)
 OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122')<>4
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122' AND (c.relowner<>'postgres'::regrole
    OR c.relname NOT IN('jobs_v1','jobs_v1_pkey','before_v1','before_v1_pkey')
    OR c.relkind NOT IN('r','i')))
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace,
   LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
   WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122' AND a.grantee<>c.relowner)
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='jetnity_dev_cron_guard_probe_20261122')
 OR (SELECT count(*) FROM jetnity_dev_cron_guard_probe_20261122.before_v1)<>1
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_SHAPE_OR_PRIVACY_CHANGED' USING ERRCODE='P7998'; END IF;
END $fixture_shape$;
DO $fixture_pins$
BEGIN
 IF (SELECT count(*) FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1)<>5 OR EXISTS(
  SELECT 1 FROM (VALUES (2,'2d8d36409000dc6c7ad9423d8fa033d35a0034ec0e16de5c646ecc98b8c78893'),
(4,'6319ae3dc4b50ebe3cca6e1a4514c8a7ea6a3352697681a88d0612d1f8bba4de'),
(5,'1971883b244c0fd1acad713cf8c5b8d62d649f9a121bfbbd547057aea0e23be3'),
(6,'587b3bc0187f14965a579c7d1d13b4dbfe8dc82c06836d767c4b2178c61292a0'),
(7,'c92294cf6d926896dcf845bd8a9113fada0d20636e24d3a906f85c8c3907e36f')) p(jobid,expected_sha)
  LEFT JOIN jetnity_dev_cron_guard_probe_20261122.jobs_v1 j USING(jobid)
  WHERE encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex') IS DISTINCT FROM p.expected_sha)
 THEN RAISE EXCEPTION 'DEV_CRON_FIXTURE_NOT_EXACT_OBSERVED_PRODUCTION_ROWS' USING ERRCODE='P7998'; END IF;
END $fixture_pins$;

LOCK TABLE jetnity_dev_cron_guard_probe_20261122.jobs_v1 IN ACCESS SHARE MODE NOWAIT;
-- Guard/queue locks are existing permissions; no own/legacy sequence is advanced.
DO $real_dev_barrier$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771106,1)
 THEN RAISE EXCEPTION 'DEV_CRON_EXISTING_GUARD_BUSY' USING ERRCODE='P7998'; END IF;
END $real_dev_barrier$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE NOWAIT;
CREATE TEMP TABLE pg_temp.dev_cron_existing_before ON COMMIT DROP AS SELECT
 pg_temp.dev_cron_existing_state() state,
 (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) guard_state,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) own_sequence,
 (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM net.http_request_queue_id_seq) legacy_sequence;
CREATE TEMP TABLE pg_temp.dev_cron_results(test_name text PRIMARY KEY,passed boolean NOT NULL) ON COMMIT DROP;
-- Exact shared Cron core for the correction candidate and scoped fixture tests.
-- SELECT/ACCESS SHARE only on jetnity_dev_cron_guard_probe_20261122.jobs_v1. No GRANT/REVOKE/SET ROLE/owner changes.
-- All helpers are temporary SECURITY INVOKER routines. No live guard is replaced.
-- A fixture may mechanically map ONLY the literal jetnity_dev_cron_guard_probe_20261122.jobs_v1 relation to its own
-- test relation; the pinned production copy always targets the real jetnity_dev_cron_guard_probe_20261122.jobs_v1.
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
 FROM (SELECT * FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1
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
  AND l.relation=to_regclass('jetnity_dev_cron_guard_probe_20261122.jobs_v1')
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
 IF has_table_privilege(current_user,'jetnity_dev_cron_guard_probe_20261122.jobs_v1','SELECT') IS DISTINCT FROM true
 OR NOT EXISTS(SELECT 1 FROM pg_locks l WHERE l.locktype='relation'
  AND l.database=(SELECT oid FROM pg_database WHERE datname=current_database())
  AND l.relation=to_regclass('jetnity_dev_cron_guard_probe_20261122.jobs_v1') AND l.pid=pg_backend_pid()
  AND l.mode='AccessShareLock' AND l.granted)
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_SELECT_AND_ACCESS_SHARE_REQUIRED' USING ERRCODE='P7998'; END IF;
 IF pg_temp.prod_http_cron_writers_absent() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'PROD_HTTP_CRON_WRITER_OBSERVED' USING ERRCODE='P7998'; END IF;
 WITH bounded AS MATERIALIZED (
  SELECT to_jsonb(j) AS row_value,j.tableoid::oid AS table_oid,
   j.xmin::text AS row_xmin,j.ctid::text AS row_ctid
  FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 j LIMIT 129
 ), hashed AS MATERIALIZED (
  SELECT octet_length(row_value::text) AS row_bytes,
   encode(sha256(convert_to(row_value::text,'UTF8')),'hex') AS row_sha,
   encode(sha256(convert_to(jsonb_build_object('tableoid',table_oid,
    'xmin',row_xmin,'ctid',row_ctid,'row',row_value)::text,'UTF8')),'hex') AS version_sha
  FROM bounded
 ) SELECT count(*),coalesce(max(row_bytes),0),jsonb_build_object(
  'relation_oid',to_regclass('jetnity_dev_cron_guard_probe_20261122.jobs_v1')::oid,'row_count',count(*),
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

CREATE FUNCTION pg_temp.dev_cron_fixture_catalog() RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $fixture_catalog$
 SELECT jsonb_build_object('unchanged_predecessor_fixture','fixed',
  'transport:production_http_id_allocator_v4',jsonb_build_object(
   'cron_contract',pg_temp.prod_http_cron_contract(),'allocator_fixture','fixed'))
$fixture_catalog$;

DO $positive$
DECLARE before_snapshot jsonb; captured jsonb;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 captured:=pg_temp.dev_cron_fixture_catalog();
 PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,captured);
 PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
 IF jsonb_array_length(before_snapshot->'contract') IS DISTINCT FROM 5
 THEN RAISE EXCEPTION 'DEV_CRON_POSITIVE_CONTRACT_COUNT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('unchanged_positive',true);
END $positive$;

DO $test_changed_command$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command='SELECT 0;' WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_CHANGED_COMMAND'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_CHANGED_COMMAND' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('changed_command',true);
END $test_changed_command$;

DO $test_changed_target$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET nodename='fixture.invalid' WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_CHANGED_TARGET'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_CHANGED_TARGET' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('changed_target',true);
END $test_changed_target$;

DO $test_changed_active$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET active=false WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_CHANGED_ACTIVE'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_CHANGED_ACTIVE' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('changed_active',true);
END $test_changed_active$;

DO $test_deleted_job$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  DELETE FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_DELETED_JOB'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_DELETED_JOB' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('deleted_job',true);
END $test_deleted_job$;

DO $test_new_unrelated_job$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  INSERT INTO jetnity_dev_cron_guard_probe_20261122.jobs_v1 SELECT 900,schedule,command,nodename,nodeport,database,username,active,'unrelated-fixture-job' FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_NEW_UNRELATED_JOB'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_NEW_UNRELATED_JOB' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('new_unrelated_job',true);
END $test_new_unrelated_job$;

DO $test_duplicate_relevant_name$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  INSERT INTO jetnity_dev_cron_guard_probe_20261122.jobs_v1 SELECT 901,schedule,command,nodename,nodeport,database,username,active,jobname FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,pg_temp.dev_cron_fixture_catalog());
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_DUPLICATE_RELEVANT_NAME'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_DUPLICATE_RELEVANT_NAME' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('duplicate_relevant_name',true);
END $test_duplicate_relevant_name$;

DO $test_null_command$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command=NULL WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_NULL_COMMAND'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_NULL_COMMAND' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('null_command',true);
END $test_null_command$;

DO $test_row_cap_129$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  INSERT INTO jetnity_dev_cron_guard_probe_20261122.jobs_v1 SELECT n,'* * * * *','SELECT 0;','localhost',5432,'postgres','postgres',true,'extra-'||n::text FROM generate_series(1000,1123) n;
  BEGIN
   PERFORM pg_temp.prod_http_cron_snapshot();
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_ROW_CAP_129'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_ROW_CAP_129' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('row_cap_129',true);
END $test_row_cap_129$;

DO $test_row_bytes_cap$
DECLARE before_snapshot jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command=repeat('x',65537) WHERE jobid=5;
  BEGIN
   PERFORM pg_temp.prod_http_cron_snapshot();
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_EXPECTED_NEGATIVE_ROW_BYTES_CAP'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_NEGATIVE_DID_NOT_RESTORE_ROW_BYTES_CAP' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('row_bytes_cap',true);
END $test_row_bytes_cap$;

DO $update_restore$
DECLARE before_snapshot jsonb; after_snapshot jsonb; saved_command text; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 SELECT command INTO STRICT saved_command FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 WHERE jobid=5;
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command='SELECT 0;' WHERE jobid=5;
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command=saved_command WHERE jobid=5;
  after_snapshot:=pg_temp.prod_http_cron_snapshot();
  IF after_snapshot->'configuration_sha256' IS DISTINCT FROM before_snapshot->'configuration_sha256'
  OR after_snapshot->'row_versions_sha256' IS NOT DISTINCT FROM before_snapshot->'row_versions_sha256'
  THEN RAISE EXCEPTION 'DEV_CRON_ABA_FIXTURE_NOT_ESTABLISHED'; END IF;
  BEGIN
   PERFORM pg_temp.prod_http_assert_cron_unchanged(before_snapshot);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_UPDATE_RESTORE_WAS_ACCEPTED'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_ABA_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('update_restore_rowversion_negative',true);
END $update_restore$;
DO $unrelated_before_capture$
DECLARE initial_snapshot jsonb; with_extra jsonb;
BEGIN
 initial_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN
  INSERT INTO jetnity_dev_cron_guard_probe_20261122.jobs_v1 SELECT 900,schedule,command,nodename,nodeport,database,username,active,
   'unrelated-fixture-job' FROM jetnity_dev_cron_guard_probe_20261122.jobs_v1 WHERE jobid=5;
  with_extra:=pg_temp.prod_http_cron_snapshot();
  IF (with_extra->>'row_count')::integer<>6 OR jsonb_array_length(with_extra->'contract')<>5
  THEN RAISE EXCEPTION 'DEV_CRON_EXTRA_EXISTING_JOB_FIXTURE_INVALID'; END IF;
  PERFORM pg_temp.prod_http_validate_cron_capture(with_extra,pg_temp.dev_cron_fixture_catalog());
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM initial_snapshot
 THEN RAISE EXCEPTION 'DEV_CRON_EXTRA_EXISTING_JOB_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('unrelated_existing_job_preserved',true);
END $unrelated_before_capture$;
CREATE TEMP TABLE pg_temp.dev_cron_sealed_fixture(singleton boolean PRIMARY KEY,catalog jsonb) ON COMMIT DROP;
DO $single_capture$
DECLARE before_snapshot jsonb; captured jsonb; late_catalog jsonb; rejected boolean:=false;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 captured:=pg_temp.dev_cron_fixture_catalog();
 PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,captured);
 BEGIN
  UPDATE jetnity_dev_cron_guard_probe_20261122.jobs_v1 SET command='SELECT 0;' WHERE jobid=5;
  late_catalog:=pg_temp.dev_cron_fixture_catalog();
  IF late_catalog IS NOT DISTINCT FROM captured
  THEN RAISE EXCEPTION 'DEV_CRON_LATE_DRIFT_FIXTURE_INVALID'; END IF;
  -- Exactly the validated variable is stored; there is no second live capture.
  INSERT INTO pg_temp.dev_cron_sealed_fixture VALUES(true,captured);
  IF (SELECT catalog FROM pg_temp.dev_cron_sealed_fixture WHERE singleton) IS DISTINCT FROM captured
  OR (SELECT catalog FROM pg_temp.dev_cron_sealed_fixture WHERE singleton) IS NOT DISTINCT FROM late_catalog
  THEN RAISE EXCEPTION 'DEV_CRON_UNVALIDATED_LATE_CATALOG_WAS_STORED'; END IF;
  BEGIN
   PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,late_catalog);
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_LATE_CAPTURE_WAS_ACCEPTED'; END IF;
  RAISE EXCEPTION 'DEV_CRON_ROLLBACK_EXPECTED' USING ERRCODE='P7997';
 EXCEPTION WHEN SQLSTATE 'P7997' THEN NULL;
 END;
 IF NOT rejected OR pg_temp.prod_http_cron_snapshot() IS DISTINCT FROM before_snapshot
 OR EXISTS(SELECT 1 FROM pg_temp.dev_cron_sealed_fixture)
 THEN RAISE EXCEPTION 'DEV_CRON_SINGLE_CAPTURE_ROLLBACK_NOT_EXACT' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('late_drift_never_adopted_by_sealed_fixture',true);
END $single_capture$;
DO $null_capture$
DECLARE before_snapshot jsonb; rejected_count integer:=0; malformed jsonb;
BEGIN
 before_snapshot:=pg_temp.prod_http_cron_snapshot();
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(NULL,pg_temp.dev_cron_fixture_catalog());
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,NULL);
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(before_snapshot,'{}'::jsonb);
 EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 FOR malformed IN SELECT v FROM (VALUES
  ('{"contract":{}}'::jsonb),('{"contract":"scalar"}'::jsonb),
  ('{"contract":null}'::jsonb),('{"contract":[]}'::jsonb)) shape(v)
 LOOP
  BEGIN PERFORM pg_temp.prod_http_validate_cron_capture(malformed,pg_temp.dev_cron_fixture_catalog());
  EXCEPTION WHEN SQLSTATE 'P7998' THEN rejected_count:=rejected_count+1; END;
 END LOOP;
 IF rejected_count<>7 THEN RAISE EXCEPTION 'DEV_CRON_NULL_OR_MALFORMED_CAPTURE_ACCEPTED' USING ERRCODE='P7998'; END IF;
 INSERT INTO pg_temp.dev_cron_results VALUES('null_missing_and_malformed_capture_fail_closed',true);
END $null_capture$;
DO $final_preservation$
DECLARE b pg_temp.dev_cron_existing_before%ROWTYPE;
BEGIN
 SELECT * INTO STRICT b FROM pg_temp.dev_cron_existing_before;
 IF pg_temp.dev_cron_existing_state() IS DISTINCT FROM b.state
 OR (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton) IS DISTINCT FROM b.guard_state
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM jetnity_pgnet_allocator_private.http_request_id_v1) IS DISTINCT FROM b.own_sequence
 OR (SELECT jsonb_build_object('last_value',last_value::text,'log_cnt',log_cnt::text,'is_called',is_called)
  FROM net.http_request_queue_id_seq) IS DISTINCT FROM b.legacy_sequence
 OR (SELECT count(*) FROM pg_temp.dev_cron_results)<>14
 OR EXISTS(SELECT 1 FROM pg_temp.dev_cron_results WHERE passed IS DISTINCT FROM true)
 THEN RAISE EXCEPTION 'DEV_CRON_REHEARSAL_PRESERVATION_OR_TEST_COUNT_FAILED' USING ERRCODE='P7998'; END IF;
END $final_preservation$;
SELECT 'DEV_CRON_SHARED_CORE_REHEARSAL_ROLLBACK_PASS' AS result,
 (SELECT jsonb_agg(test_name ORDER BY test_name) FROM pg_temp.dev_cron_results) AS passed_tests,
 14 AS passed_count,true AS live_v8_roles_acls_facts_originals_and_counters_preserved,
 false AS production_installer_executed,false AS real_cron_changed,false AS http_started,
 false AS physical_cron_freeze_proven,false AS entire_concurrent_history_observed;
ROLLBACK;
