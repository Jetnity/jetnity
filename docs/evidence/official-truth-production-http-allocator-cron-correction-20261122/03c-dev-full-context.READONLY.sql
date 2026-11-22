-- Dev-only safe read before continuing an interrupted fixture setup.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='500ms';
SET LOCAL transaction_timeout='15s';
WITH live AS MATERIALIZED (SELECT official_v3_guard_private.catalog_status_v1() AS catalog)
SELECT jsonb_build_object('result','DEV_CRON_FULL_CONTEXT_READ',
'observed_at',statement_timestamp(),
'v8_exact',(SELECT count(*)=1 AND bool_and(b.catalog=live.catalog)
 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 b CROSS JOIN live),
'v8_catalog_sha256',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM live),
'fixture_absent',to_regnamespace('jetnity_dev_cron_guard_probe_20261122') IS NULL,
'production_source_pins_absent',to_regclass('official_v3_at_production_private.source_pins_v1') IS NULL,
'roles_count',(SELECT count(*) FROM (SELECT 1 FROM pg_roles LIMIT 129) s),
'memberships_count',(SELECT count(*) FROM (SELECT 1 FROM pg_auth_members LIMIT 513) s),
'cron_count',(SELECT count(*) FROM (SELECT 1 FROM cron.job LIMIT 129) s),
'facts_count',(SELECT count(*) FROM (SELECT 1 FROM official_v3_source_renewal_private.facts_v1 LIMIT 1001) s),
'originals_count',(SELECT count(*) FROM (SELECT 1 FROM official_v3_at_private.whole_originals_v2 LIMIT 17) s),
'other_active_test_prefix_sessions',(SELECT count(*) FROM pg_stat_activity
 WHERE datname=current_database() AND pid<>pg_backend_pid() AND state<>'idle'
 AND (query LIKE '-- DEV ONLY: fixed connector target yfvbxvijcorffwxbxahl.%'
 OR application_name LIKE 'jetnity-dev-cron-fixture-%'))
) AS result;
ROLLBACK;

