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

SET LOCAL application_name='jetnity-dev-cron-fixture-reader-20261122';
DO $reader_mutex$
BEGIN
 IF NOT pg_try_advisory_xact_lock(771122,8102)
 THEN RAISE EXCEPTION 'DEV_CRON_READER_ALREADY_RUNNING' USING ERRCODE='P7998'; END IF;
END $reader_mutex$;
LOCK TABLE jetnity_dev_cron_guard_probe_20261122.jobs_v1 IN ACCESS SHARE MODE NOWAIT;
DO $concurrent_refusal$
DECLARE deadline timestamptz:=clock_timestamp()+interval '10 seconds';
 rejected boolean:=false;
BEGIN
 LOOP
  EXIT WHEN pg_temp.prod_http_cron_writers_absent() IS DISTINCT FROM true
   AND EXISTS(SELECT 1 FROM pg_locks w WHERE w.locktype='relation'
    AND w.database=(SELECT oid FROM pg_database WHERE datname=current_database())
    AND w.relation='jetnity_dev_cron_guard_probe_20261122.jobs_v1'::regclass AND w.mode='RowExclusiveLock' AND w.granted
    AND w.pid IS DISTINCT FROM pg_backend_pid()
    AND EXISTS(SELECT 1 FROM pg_locks m WHERE m.locktype='advisory' AND m.pid=w.pid
     AND m.database=w.database AND m.classid=771122 AND m.objid=8101 AND m.objsubid=2 AND m.granted));
  IF clock_timestamp()>=deadline
  THEN RAISE EXCEPTION 'DEV_CRON_CONCURRENT_WRITER_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
  PERFORM pg_sleep(0.025);
 END LOOP;
 BEGIN
  PERFORM pg_temp.prod_http_cron_snapshot();
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM IS DISTINCT FROM 'PROD_HTTP_CRON_WRITER_OBSERVED' THEN RAISE; END IF;
  rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'DEV_CRON_CONCURRENT_WRITER_ACCEPTED' USING ERRCODE='P7998'; END IF;
 -- Transactional acknowledgement is acquired only after actual native refusal.
 IF NOT pg_try_advisory_xact_lock(771122,8103)
 THEN RAISE EXCEPTION 'DEV_CRON_READER_ACK_ALREADY_HELD' USING ERRCODE='P7998'; END IF;
 deadline:=clock_timestamp()+interval '10 seconds';
 LOOP
  EXIT WHEN pg_temp.prod_http_cron_writers_absent() IS TRUE;
  IF clock_timestamp()>=deadline
  THEN RAISE EXCEPTION 'DEV_CRON_WRITER_ROLLBACK_NOT_OBSERVED' USING ERRCODE='P7998'; END IF;
  PERFORM pg_sleep(0.025);
 END LOOP;
 IF jsonb_array_length(pg_temp.prod_http_cron_snapshot()->'contract') IS DISTINCT FROM 5
 THEN RAISE EXCEPTION 'DEV_CRON_POSTWRITER_POSITIVE_FAILED' USING ERRCODE='P7998'; END IF;
END $concurrent_refusal$;
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

SELECT 'DEV_CRON_CONCURRENT_WRITER_REFUSAL_AND_RECOVERY_PASS' AS result,
 true AS access_share_and_writer_were_concurrent,true AS exact_core_refused_other_pid_writer,
 true AS writer_rollback_observed,true AS fixture_original_rows_restored,
 false AS real_cron_changed,false AS http_started,false AS physical_cron_freeze_proven;
ROLLBACK;
