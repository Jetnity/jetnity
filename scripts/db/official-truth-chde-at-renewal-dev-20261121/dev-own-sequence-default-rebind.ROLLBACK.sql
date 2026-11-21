-- Dev-only test of the user's own-sequence/default proposal; final ROLLBACK.
-- No request functions, HTTP wakeup, nextval, setval, role changes or COMMIT.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='2s';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $dev$
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres' OR session_user<>'postgres'
 OR auth.uid() IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_grantor_restore_v7') IS NULL
 OR to_regclass('official_v3_at_production_private.source_pins_v1') IS NOT NULL
 OR to_regclass('jetnity_prod_import_scheduler.dispatches_v1') IS NOT NULL
 OR to_regnamespace('jetnity_dev_http_id_default_probe_20261121') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_DEFAULT_PROBE_WRONG_TARGET_OR_ALREADY_EXISTS'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
END $dev$;
LOCK TABLE net.http_request_queue IN SHARE ROW EXCLUSIVE MODE;
CREATE SCHEMA jetnity_dev_http_id_default_probe_20261121 AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_dev_http_id_default_probe_20261121 FROM PUBLIC;
CREATE SEQUENCE jetnity_dev_http_id_default_probe_20261121.request_id_seq
 AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;
CREATE TEMP TABLE pg_temp.default_probe_result(
 highest bigint,next_unused bigint,original_own_relfilenode oid,
 legacy_value bigint,legacy_called boolean,original_default text,
 owned_sequence_rollback_exact boolean DEFAULT false,
 default_changed boolean DEFAULT false,default_error_state text,default_error text
) ON COMMIT DROP;
DO $snapshot$
DECLARE item record; part bigint; high bigint:=0; n integer:=0; old_value bigint; old_called boolean;
BEGIN
 FOR item IN
  SELECT n.nspname AS schema_name,c.relname AS table_name,a.attname AS column_name
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
  WHERE c.relkind IN('r','p') AND c.relpersistence IN('p','u')
   AND n.nspname NOT IN('pg_catalog','information_schema')
   AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
   AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='bigint'::regtype
   AND (a.attname ~ '(^|_)request_id$'
    OR n.nspname='net' AND c.relname IN('http_request_queue','_http_response') AND a.attname='id')
 LOOP
  EXECUTE format('SELECT max(%I) FROM %I.%I',item.column_name,item.schema_name,item.table_name) INTO part;
  high:=greatest(high,coalesce(part,0));n:=n+1;
 END LOOP;
 SELECT last_value,is_called INTO old_value,old_called FROM net.http_request_queue_id_seq;
 IF n<>16 OR high<1 OR greatest(high,old_value)>=9223372036854775807 THEN
  RAISE EXCEPTION 'DEV_DEFAULT_PROBE_INVENTORY_OR_RANGE_CHANGED'; END IF;
 IF (SELECT relpersistence<>'p' OR relowner<>(SELECT oid FROM pg_roles WHERE rolname='postgres')
  FROM pg_class WHERE oid='jetnity_dev_http_id_default_probe_20261121.request_id_seq'::regclass) THEN
  RAISE EXCEPTION 'DEV_DEFAULT_PROBE_NOT_OWNED_LOGGED_SEQUENCE'; END IF;
 INSERT INTO pg_temp.default_probe_result(highest,next_unused,original_own_relfilenode,legacy_value,legacy_called,original_default)
 SELECT high,greatest(high,old_value)+1,
  (SELECT relfilenode FROM pg_class WHERE oid='jetnity_dev_http_id_default_probe_20261121.request_id_seq'::regclass),
  old_value,old_called,
  (SELECT pg_get_expr(d.adbin,d.adrelid) FROM pg_attrdef d JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
   WHERE d.adrelid='net.http_request_queue'::regclass AND a.attname='id');
END $snapshot$;
SAVEPOINT own_sequence_restart;
DO $restart$
DECLARE target bigint;
BEGIN
 SELECT next_unused INTO STRICT target FROM pg_temp.default_probe_result;
 EXECUTE format('ALTER SEQUENCE jetnity_dev_http_id_default_probe_20261121.request_id_seq RESTART WITH %s',target);
 IF (SELECT last_value<>target OR is_called FROM jetnity_dev_http_id_default_probe_20261121.request_id_seq) THEN
  RAISE EXCEPTION 'DEV_DEFAULT_PROBE_OWNED_RESTART_FAILED'; END IF;
END $restart$;
ROLLBACK TO SAVEPOINT own_sequence_restart;
DO $restore$
BEGIN
 IF (SELECT last_value<>1 OR is_called FROM jetnity_dev_http_id_default_probe_20261121.request_id_seq)
 OR (SELECT relfilenode FROM pg_class WHERE oid='jetnity_dev_http_id_default_probe_20261121.request_id_seq'::regclass)
  IS DISTINCT FROM (SELECT original_own_relfilenode FROM pg_temp.default_probe_result)
 THEN RAISE EXCEPTION 'DEV_DEFAULT_PROBE_OWNED_RESTART_ROLLBACK_FAILED'; END IF;
 UPDATE pg_temp.default_probe_result SET owned_sequence_rollback_exact=true;
END $restore$;
DO $default_switch$
DECLARE target bigint; errstate text; errmessage text;
BEGIN
 SELECT next_unused INTO STRICT target FROM pg_temp.default_probe_result;
 EXECUTE format('ALTER SEQUENCE jetnity_dev_http_id_default_probe_20261121.request_id_seq RESTART WITH %s',target);
 BEGIN
  ALTER TABLE net.http_request_queue ALTER COLUMN id
   SET DEFAULT nextval('jetnity_dev_http_id_default_probe_20261121.request_id_seq'::regclass);
  UPDATE pg_temp.default_probe_result SET default_changed=true;
 EXCEPTION WHEN insufficient_privilege THEN
  GET STACKED DIAGNOSTICS errstate=RETURNED_SQLSTATE,errmessage=MESSAGE_TEXT;
  UPDATE pg_temp.default_probe_result SET default_error_state=errstate,default_error=errmessage;
 END;
 IF (SELECT last_value FROM net.http_request_queue_id_seq) IS DISTINCT FROM (SELECT legacy_value FROM pg_temp.default_probe_result)
 OR (SELECT is_called FROM net.http_request_queue_id_seq) IS DISTINCT FROM (SELECT legacy_called FROM pg_temp.default_probe_result)
 THEN RAISE EXCEPTION 'DEV_DEFAULT_PROBE_LEGACY_SEQUENCE_CHANGED'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
END $default_switch$;
SELECT 'DEV_OWNED_LOGGED_SEQUENCE_AND_DEFAULT_REBIND_ROLLBACK_PROBE' AS result,
 highest::text AS actual_history_max,next_unused::text AS own_sequence_requested_start,
 owned_sequence_rollback_exact,default_changed,default_error_state,default_error,
 true AS legacy_sequence_unchanged,false AS committed,false AS http_started
FROM pg_temp.default_probe_result;
ROLLBACK;
