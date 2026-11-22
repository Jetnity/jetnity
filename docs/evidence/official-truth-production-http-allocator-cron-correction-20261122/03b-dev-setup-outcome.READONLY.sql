-- Dev-only reconciliation after interrupted setup response; metadata only.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL transaction_timeout='15s';
SELECT jsonb_build_object(
'result','DEV_CRON_SETUP_OUTCOME_CATALOG_OBSERVATION',
'observed_at',statement_timestamp(),'current_user',current_user,
'fixture_namespace_oid',to_regnamespace('jetnity_dev_cron_guard_probe_20261122')::oid,
'fixture_relations',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'kind',c.relkind,'owner',pg_get_userbyid(c.relowner)) ORDER BY c.relname),'[]'::jsonb)
 FROM pg_class c WHERE c.relnamespace=to_regnamespace('jetnity_dev_cron_guard_probe_20261122')),
'fixture_functions',(SELECT count(*) FROM pg_proc WHERE pronamespace=to_regnamespace('jetnity_dev_cron_guard_probe_20261122')),
'dev_v8_present',to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL,
'dev_allocator_present',to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1') IS NOT NULL,
'catalog_definition_sha256',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('official_v3_guard_private.catalog_status_v1()')),'UTF8')),'hex'),
'cron_select',has_table_privilege(current_user,'cron.job','SELECT'),
'cron_maintain',has_table_privilege(current_user,'cron.job','MAINTAIN'),
'cron_update',has_table_privilege(current_user,'cron.job','UPDATE'),
'cron_delete',has_table_privilege(current_user,'cron.job','DELETE'),
'cron_truncate',has_table_privilege(current_user,'cron.job','TRUNCATE'),
'other_active_matching_test_sessions',(SELECT count(*) FROM pg_stat_activity
 WHERE datname=current_database() AND pid<>pg_backend_pid() AND state NOT IN('idle')
 AND (query LIKE '%DEV_CRON_TEST_WRONG_CONTEXT%' OR application_name LIKE 'jetnity-dev-cron-fixture-%'))
) AS result;
ROLLBACK;

