\set ON_ERROR_STOP on
-- Isolated PostgreSQL 17 only. Exact production archive trigger and append-only
-- objects; fake HTTP payloads are SYNTHETIC test fixtures, no live customer data.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA official_v3_at_production_private;
CREATE SCHEMA net;
CREATE TABLE official_v3_at_production_private.source_pins_v1(source_id text PRIMARY KEY);
CREATE TABLE official_v3_at_production_private.watch_batches_v1(batch_id bigint PRIMARY KEY);
CREATE TABLE official_v3_at_production_private.watch_requests_v1(
 batch_id bigint,source_id text,request_id bigint,requested_at timestamptz,
 PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.watch_observations_v1(
 batch_id bigint,source_id text,observed_at timestamptz,source_status text,
 bytes integer,body_sha text,http_status integer,
 PRIMARY KEY(batch_id,source_id));
CREATE TABLE net._http_response(
 id bigint PRIMARY KEY,status_code integer,timed_out boolean,error_msg text,
 content_type text,content text);
CREATE FUNCTION official_v3_at_production_private.deny_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql AS $deny$
 BEGIN RAISE EXCEPTION 'immutable evidence' USING ERRCODE='P7994'; END $deny$;
\ir production-archive-objects.sql
INSERT INTO official_v3_at_production_private.source_pins_v1(source_id)
 VALUES('bmeia-bern-how-to-apply'),('bmi-general-entry'),('bmi-visa-nationality-matrix');
INSERT INTO official_v3_at_production_private.watch_batches_v1 VALUES(658);
INSERT INTO official_v3_at_production_private.watch_requests_v1 VALUES
 (658,'bmeia-bern-how-to-apply',1407,clock_timestamp()-interval '2 minutes'),
 (658,'bmi-general-entry',1408,clock_timestamp()-interval '2 minutes'),
 (658,'bmi-visa-nationality-matrix',1409,clock_timestamp()-interval '2 minutes');
INSERT INTO net._http_response VALUES
 (1407,200,false,NULL,'text/html','<html>official BMEIA test document</html>'),
 (1408,200,false,NULL,'text/html','<html>official BMI general test document</html>'),
 (1409,200,false,NULL,'text/html','<html>official BMI visa test document</html>');
INSERT INTO official_v3_at_production_private.watch_observations_v1
 (batch_id,source_id,observed_at,source_status,bytes,body_sha,http_status)
SELECT r.batch_id,r.source_id,clock_timestamp(),
 CASE WHEN r.source_id='bmeia-bern-how-to-apply' THEN 'changed' ELSE 'unchanged_exact' END,
 octet_length(convert_to(h.content,'UTF8')),
 encode(sha256(convert_to(h.content,'UTF8')),'hex'),200
FROM official_v3_at_production_private.watch_requests_v1 r
JOIN net._http_response h ON h.id=r.request_id;
DO $first$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_bodies_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_receipts_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_receipts_v3 WHERE state='changed')<>1
 OR has_table_privilege('anon','official_v3_at_production_private.ch_source_http_bodies_v3','SELECT')
 OR has_table_privilege('service_role','official_v3_at_production_private.ch_source_http_receipts_v3','SELECT')
 THEN RAISE EXCEPTION 'AT_ARCHIVE_NATIVE_REAL_COLLECT_PROOF_FAILED' USING ERRCODE='P7996'; END IF;
 BEGIN
  UPDATE official_v3_at_production_private.ch_source_http_bodies_v3 SET first_request_id=0;
  RAISE EXCEPTION 'AT_ARCHIVE_NATIVE_MUTATION_ACCEPTED' USING ERRCODE='P7996';
 EXCEPTION WHEN SQLSTATE 'P7994' THEN NULL;
 END;
END $first$;
-- Forged observer digest must be rejected even with HTTP200 data present.
INSERT INTO official_v3_at_production_private.watch_requests_v1
 VALUES(659,'bmi-general-entry',1410,clock_timestamp()-interval '2 minutes');
INSERT INTO official_v3_at_production_private.watch_batches_v1 VALUES(659);
INSERT INTO net._http_response VALUES
 (1410,200,false,NULL,'text/html','<html>another document</html>');
DO $forged$
BEGIN
 BEGIN
  INSERT INTO official_v3_at_production_private.watch_observations_v1
  VALUES(659,'bmi-general-entry',clock_timestamp(),'unchanged_exact',29,repeat('a',64),200);
  RAISE EXCEPTION 'AT_ARCHIVE_NATIVE_FAKE_SHA_ALLOWED' USING ERRCODE='P7996';
 EXCEPTION WHEN SQLSTATE 'P7993' THEN NULL;
 END;
END $forged$;
-- Simulate pg_net 6-hour TTL: delete ONLY disposable synthetic fixture rows.
DELETE FROM net._http_response;
DO $ttl$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_bodies_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_receipts_v3)<>3
 OR (SELECT count(*) FROM net._http_response)<>0
 THEN RAISE EXCEPTION 'AT_ARCHIVE_NATIVE_TTL_RETENTION_FAIL' USING ERRCODE='P7996'; END IF;
END $ttl$;
SELECT 'AT_CH_SOURCE_ARCHIVE_PG17_APPEND_ONLY_TTL_NEGATIVE_PASS' AS evidence;
ROLLBACK;
DO $cleanup$
BEGIN
 IF to_regclass('official_v3_at_production_private.ch_source_http_bodies_v3') IS NOT NULL
 OR to_regclass('official_v3_at_production_private.ch_source_http_receipts_v3') IS NOT NULL
 OR to_regprocedure('official_v3_at_production_private.archive_on_observation_v3()') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_ARCHIVE_NATIVE_TX_ROLLBACK_LEAK' USING ERRCODE='P7996'; END IF;
END $cleanup$;
SELECT 'AT_CH_SOURCE_ARCHIVE_PG17_ROLLBACK_PASS' AS evidence;
