-- Authorized Dev-only Cron permission/lineage observation; no role or privilege change.
-- Fixed connector target yfvbxvijcorffwxbxahl; not a Production execution file.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='8s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='15s';
SET LOCAL transaction_timeout='20s';
SET LOCAL row_security=off;
LOCK TABLE cron.job IN ACCESS SHARE MODE NOWAIT;
SELECT jsonb_build_object(
 'result','DEV_CRON_ACCESS_SHARE_OBSERVED',
 'observed_at',statement_timestamp(),
 'current_user',current_user,'session_user',session_user,
 'server_version_num',current_setting('server_version_num'),
 'pg_net_version',(SELECT extversion FROM pg_extension WHERE extname='pg_net'),
 'pg_cron_version',(SELECT extversion FROM pg_extension WHERE extname='pg_cron'),
 'read_only',current_setting('transaction_read_only'),
 'cron_owner',(SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='cron.job'::regclass),
 'cron_select',has_table_privilege(current_user,'cron.job','SELECT'),
 'cron_maintain',has_table_privilege(current_user,'cron.job','MAINTAIN'),
 'cron_update',has_table_privilege(current_user,'cron.job','UPDATE'),
 'cron_delete',has_table_privilege(current_user,'cron.job','DELETE'),
 'cron_truncate',has_table_privilege(current_user,'cron.job','TRUNCATE'),
 'access_share_held',EXISTS(SELECT 1 FROM pg_locks WHERE pid=pg_backend_pid()
   AND locktype='relation' AND relation='cron.job'::regclass AND mode='AccessShareLock' AND granted),
 'cron_count_at_most_129',(SELECT count(*) FROM (SELECT 1 FROM cron.job LIMIT 129) c),
 'cron_catalog_sha256',(SELECT encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex') FROM pg_class c WHERE oid='cron.job'::regclass),
 'dev_allocator_present',to_regnamespace('jetnity_pgnet_allocator_private') IS NOT NULL,
 'dev_v8_present',to_regclass('official_v3_guard_private.bg1_dev_http_id_allocator_v8') IS NOT NULL,
 'prod_v3_present',to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NOT NULL,
 'dev_catalog_definition_sha256',CASE WHEN to_regprocedure('official_v3_guard_private.catalog_status_v1()') IS NOT NULL
   THEN encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('official_v3_guard_private.catalog_status_v1()')),'UTF8')),'hex') END
) AS result;
ROLLBACK;

