-- Dev PG17, TEMP fixtures only. Native executed 21.11.2026: PASS.
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE pg_temp.at_seen_http_request_ids(request_id bigint PRIMARY KEY) ON COMMIT DROP;
INSERT INTO pg_temp.at_seen_http_request_ids VALUES (61),(62),(77),(185),(196);
CREATE TEMP SEQUENCE pg_temp.at_recovery_seq AS bigint START 1 INCREMENT 1;
SELECT pg_catalog.setval('pg_temp.at_recovery_seq'::regclass,77,true);
DO $do$
DECLARE observed_max bigint; before_value bigint; after_value bigint; fresh_id bigint; second_id bigint;
BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR to_regclass('official_v3_at_production_private.watch_requests_v1') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_DEV_ISOLATION_REQUIRED' USING ERRCODE='P7998';END IF;
 SELECT max(request_id) INTO STRICT observed_max FROM pg_temp.at_seen_http_request_ids;
 SELECT last_value INTO STRICT before_value FROM pg_temp.at_recovery_seq;
 IF before_value<>77 OR observed_max<>196 THEN RAISE EXCEPTION 'AT_BAD_PRESTATE' USING ERRCODE='P7998'; END IF;
 EXECUTE format('ALTER SEQUENCE pg_temp.at_recovery_seq RESTART WITH %s',greatest(observed_max,before_value)+1);
 SELECT nextval('pg_temp.at_recovery_seq'::regclass) INTO STRICT fresh_id;
 IF fresh_id<>197 OR EXISTS(SELECT 1 FROM pg_temp.at_seen_http_request_ids WHERE request_id=fresh_id)
 THEN RAISE EXCEPTION 'AT_FIRST_COLLISION' USING ERRCODE='P7998';END IF;
 INSERT INTO pg_temp.at_seen_http_request_ids VALUES(fresh_id);
 SELECT last_value INTO STRICT after_value FROM pg_temp.at_recovery_seq;
 EXECUTE format('ALTER SEQUENCE pg_temp.at_recovery_seq RESTART WITH %s',greatest((SELECT max(request_id) FROM pg_temp.at_seen_http_request_ids),after_value)+1);
 SELECT nextval('pg_temp.at_recovery_seq'::regclass) INTO STRICT second_id;
 IF second_id<>198 OR EXISTS(SELECT 1 FROM pg_temp.at_seen_http_request_ids WHERE request_id=second_id)
 THEN RAISE EXCEPTION 'AT_IDEMPOTENT_RESTART_NOT_MONOTONIC' USING ERRCODE='P7998';END IF;
END $do$;
SELECT 'DEV_AT_SEQUENCE_TRANSACTIONAL_RECOVERY_PASS' AS result,
 (SELECT last_value FROM pg_temp.at_recovery_seq)=198 AS nextval_moved_monotonically,
 to_regclass('official_v3_at_production_private.watch_requests_v1') IS NULL AS no_prod_schema_in_dev,
 false AS releases_research_only_rules,
 false AS writes_to_production;
ROLLBACK;
