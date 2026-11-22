-- Current owner-authorized operational after-read, metadata only.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='500ms';
SET LOCAL idle_in_transaction_session_timeout='20s';
SET LOCAL transaction_timeout='20s';
DO $context$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('transaction_read_only')<>'on'
 OR current_setting('server_version_num')::integer/10000<>17
 OR to_regclass('official_v3_guard_private.bg1_production_http_allocator_v4') IS NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NOT NULL
 THEN RAISE EXCEPTION 'OPERATIONAL_READ_WRONG_PRODUCTION_CONTEXT'; END IF;
END $context$;
WITH names(name) AS (VALUES
 ('official_v3_guard_private.state_v1'),('official_v3_guard_private.runs_v1'),
 ('official_v3_guard_private.incidents_v1'),('cron.job_run_details')),
relations AS (
 SELECT n.name,to_regclass(n.name) relation_oid FROM names n
), columns AS (
 SELECT r.name,r.relation_oid,
 CASE WHEN r.relation_oid IS NOT NULL THEN has_table_privilege(current_user,r.relation_oid,'SELECT') ELSE false END AS select_allowed,
 (SELECT jsonb_agg(jsonb_build_object('column',a.attname,'type',format_type(a.atttypid,a.atttypmod)) ORDER BY a.attnum)
 FROM pg_attribute a WHERE a.attrelid=r.relation_oid AND a.attnum>0 AND NOT a.attisdropped) columns
 FROM relations r
), functions AS (
 SELECT x.signature,to_regprocedure(x.signature) function_oid,
 (SELECT encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') FROM pg_proc p
 WHERE p.oid=to_regprocedure(x.signature)) definition_sha256
 FROM (VALUES ('public.official_v3_guard_alarm_status_v1()'),('official_v3_guard_private.catalog_status_v1()'),
 ('official_v3_guard_private.audit_v1()'),('official_v3_at_production_private.enqueue_v1()'),
 ('official_v3_at_production_private.collect_v1()'),('jetnity_prod_import_scheduler.tick_v1()')) x(signature)
)
SELECT jsonb_build_object('result','PROD_OPERATIONAL_READ_METADATA',
 'observed_at',statement_timestamp(),'read_only',current_setting('transaction_read_only')='on',
 'database',current_database(),'role',current_user,
 'installed_successor_sha256',(SELECT encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex')
 FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE singleton),
 'relations',(SELECT jsonb_agg(to_jsonb(c) ORDER BY c.name) FROM columns c),
 'functions',(SELECT jsonb_agg(to_jsonb(f) ORDER BY f.signature) FROM functions f)
) AS result;
ROLLBACK;
