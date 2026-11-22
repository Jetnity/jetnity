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
