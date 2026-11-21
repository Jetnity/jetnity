-- Dev-only authority probe after the Owner explicitly authorized Dev rights changes.
-- It tests only ownership transfer of the one named managed sequence to postgres.
-- No superuser grant, role membership, ACL grant, nextval/setval, HTTP or COMMIT.
-- A successful transfer is immediately rolled back; an error aborts the transaction.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='12s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='20s';
DO $dev_target$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR auth.uid() IS NOT NULL
 OR current_setting('server_version_num')::integer/10000<>17
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_OWNER_PROBE_WRONG_TARGET' USING ERRCODE='P7998'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status' IS DISTINCT FROM 'current'
 OR NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
  WHERE c.oid='net.http_request_queue_id_seq'::regclass
   AND c.relkind='S' AND c.relpersistence='u' AND r.rolname='supabase_admin' AND r.rolsuper)
 THEN RAISE EXCEPTION 'DEV_OWNER_PROBE_BASELINE_CHANGED' USING ERRCODE='P7998'; END IF;
END $dev_target$;
ALTER SEQUENCE net.http_request_queue_id_seq OWNER TO postgres;
SELECT 'DEV_SEQUENCE_OWNER_TRANSFER_ALLOWED_BUT_ROLLED_BACK' AS result,
 pg_get_userbyid(relowner) AS temporary_owner,false AS committed
FROM pg_class WHERE oid='net.http_request_queue_id_seq'::regclass;
ROLLBACK;
