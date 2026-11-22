-- DEV ONLY: independent post-cleanup verification; fixed target yfvbxvijcorffwxbxahl.
-- Plain bounded reads only. No real Cron DML, HTTP, sources, Publisher or Owner call.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='15s';
SET LOCAL transaction_timeout='20s';
WITH captured AS MATERIALIZED (
 SELECT official_v3_guard_private.catalog_status_v1() AS catalog
), checks AS MATERIALIZED (
 SELECT
 current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
  AND current_setting('server_version_num')='170006'
  AND current_setting('transaction_read_only')='on'
  AND current_setting('transaction_isolation')='repeatable read'
  AND to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL
  AND to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NOT NULL
  AND encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(
   'official_v3_guard_private.catalog_status_v1()')),'UTF8')),'hex')
   ='a37bdaaa546ab1bcf3baac301d83de3887765ae16532f149d421a9c1dd0780c4'
  AS exact_dev_context,
 to_regnamespace('jetnity_dev_cron_guard_probe_20261122') IS NULL
  AND to_regclass('jetnity_dev_cron_guard_probe_20261122.jobs_v1') IS NULL
  AND to_regclass('jetnity_dev_cron_guard_probe_20261122.before_v1') IS NULL AS fixture_absent,
 (SELECT count(*) FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8)=1
  AND EXISTS(SELECT 1 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 b,captured c
   WHERE b.singleton AND b.catalog=c.catalog) AS existing_v8_exact,
 has_table_privilege(current_user,'cron.job','SELECT') IS TRUE
  AND has_table_privilege(current_user,'cron.job','MAINTAIN') IS FALSE
  AND has_table_privilege(current_user,'cron.job','UPDATE') IS FALSE
  AND has_table_privilege(current_user,'cron.job','DELETE') IS FALSE
  AND has_table_privilege(current_user,'cron.job','TRUNCATE') IS FALSE AS cron_rights_unchanged,
 (SELECT count(*) FROM (
  SELECT 1 FROM pg_stat_activity a WHERE a.datname=current_database()
   AND a.pid<>pg_backend_pid() AND a.state IS DISTINCT FROM 'idle'
   AND (a.application_name IN('jetnity-dev-cron-fixture-writer-20261122',
    'jetnity-dev-cron-fixture-reader-20261122')
    OR left(a.query,length('-- DEV ONLY: fixed connector target yfvbxvijcorffwxbxahl.'))
     ='-- DEV ONLY: fixed connector target yfvbxvijcorffwxbxahl.') LIMIT 129
 ) active) AS active_test_sessions,
 (SELECT count(*) FROM (
  SELECT 1 FROM pg_locks l WHERE l.locktype='advisory'
   AND l.database=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND l.classid=771122 AND l.objid IN(8101,8102,8103) AND l.objsubid=2
   AND l.pid IS DISTINCT FROM pg_backend_pid() LIMIT 129
 ) held) AS remaining_test_locks,
 (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM captured) AS catalog_sha256
)
SELECT CASE WHEN exact_dev_context IS TRUE AND fixture_absent IS TRUE
 AND existing_v8_exact IS TRUE AND cron_rights_unchanged IS TRUE
 AND active_test_sessions=0 AND remaining_test_locks=0
 THEN 'DEV_CRON_POSTCLEANUP_INDEPENDENT_READONLY_PASS'
 ELSE 'DEV_CRON_POSTCLEANUP_STOP' END AS result,
 clock_timestamp() AS observed_at_utc,exact_dev_context,fixture_absent,existing_v8_exact,
 cron_rights_unchanged,active_test_sessions,remaining_test_locks,catalog_sha256,
 true AS read_only,false AS production_accessed,false AS http_started
FROM checks;
ROLLBACK;
