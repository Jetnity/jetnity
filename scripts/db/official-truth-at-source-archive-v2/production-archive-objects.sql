-- Production STAGE-1 CANDIDATE ONLY, DO NOT APPLY WITHOUT RELEASE CHAT PO-GO.
-- Append-only content-addressed official source bytes, captured atomically by
-- the EXISTING source collector's observation INSERT, never 6h later by installer.
-- No new jobs, no paid HTTP fetch, no change to existing collector, no visitor flag.
CREATE TABLE official_v3_at_production_private.ch_source_http_bodies_v3(
 source_id text NOT NULL REFERENCES official_v3_at_production_private.source_pins_v1(source_id),
 raw_body bytea NOT NULL CHECK(octet_length(raw_body) BETWEEN 1 AND 1048576),
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 first_batch_id bigint NOT NULL REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 first_request_id bigint NOT NULL,
 stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(source_id,raw_sha)
);
CREATE TABLE official_v3_at_production_private.ch_source_http_receipts_v3(
 batch_id bigint NOT NULL REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 source_id text NOT NULL,
 request_id bigint NOT NULL,
 raw_sha text NOT NULL CHECK(raw_sha~'^[a-f0-9]{64}$'),
 raw_bytes integer NOT NULL CHECK(raw_bytes BETWEEN 1 AND 1048576),
 observed_at timestamptz NOT NULL,
 state text NOT NULL CHECK(state IN('unchanged_exact','unchanged_asset_version_only','changed')),
 stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(batch_id,source_id),
 UNIQUE(request_id),
 FOREIGN KEY(source_id,raw_sha)
 REFERENCES official_v3_at_production_private.ch_source_http_bodies_v3(source_id,raw_sha)
);
DO $private_acl$
DECLARE nm text;
BEGIN
 FOREACH nm IN ARRAY ARRAY['ch_source_http_bodies_v3','ch_source_http_receipts_v3'] LOOP
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I ENABLE ROW LEVEL SECURITY',nm);
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I FORCE ROW LEVEL SECURITY',nm);
  EXECUTE format('REVOKE ALL ON TABLE official_v3_at_production_private.%I FROM PUBLIC,anon,authenticated,service_role',nm);
  EXECUTE format('CREATE POLICY postgres_only ON official_v3_at_production_private.%I FOR ALL TO postgres USING(true) WITH CHECK(true)',nm);
  EXECUTE format('CREATE TRIGGER archive_immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',nm);
  EXECUTE format('CREATE TRIGGER archive_immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',nm);
 END LOOP;
END $private_acl$;

CREATE FUNCTION official_v3_at_production_private.archive_on_observation_v3()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE req record; response record; raw bytea; body_sha text; bytes integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR TG_OP<>'INSERT'
 OR NEW.source_id NOT IN('bmeia-bern-how-to-apply','bmi-general-entry','bmi-visa-nationality-matrix')
 OR NEW.source_status NOT IN('changed','unchanged_exact','unchanged_asset_version_only')
 OR NEW.http_status IS DISTINCT FROM 200
 OR NEW.observed_at IS NULL OR NEW.observed_at>clock_timestamp()
 OR NEW.body_sha IS NULL OR NEW.bytes IS NULL
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_OBSERVATION_UNTRUSTED' USING ERRCODE='P7993'; END IF;
 SELECT * INTO req FROM official_v3_at_production_private.watch_requests_v1
 WHERE source_id=NEW.source_id AND batch_id=NEW.batch_id FOR SHARE;
 IF NOT FOUND OR NEW.observed_at<req.requested_at
 OR NEW.observed_at>req.requested_at+interval '6 minutes 10 seconds'
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_PROVENANCE_REFUSED' USING ERRCODE='P7993'; END IF;
 SELECT * INTO response FROM net._http_response WHERE id=req.request_id;
 IF NOT FOUND OR response.status_code<>200 OR response.timed_out IS DISTINCT FROM FALSE
 OR response.error_msg IS NOT NULL OR response.content IS NULL
 OR response.content_type!~*'^text/html([; ]|$)'
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_HTTP_NOT_AVAILABLE' USING ERRCODE='P7993'; END IF;
 raw:=convert_to(response.content,'UTF8');
 bytes:=octet_length(raw);
 IF bytes NOT BETWEEN 1 AND 1048576 OR NEW.bytes IS DISTINCT FROM bytes
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_SIZE_MISMATCH' USING ERRCODE='P7993'; END IF;
 body_sha:=encode(sha256(raw),'hex');
 IF body_sha IS DISTINCT FROM NEW.body_sha
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_HASH_MISMATCH' USING ERRCODE='P7993'; END IF;
 PERFORM pg_advisory_xact_lock(771112,47);
 IF NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_http_bodies_v3
  WHERE source_id=NEW.source_id AND raw_sha=body_sha)
 AND (SELECT coalesce(sum(raw_bytes),0) FROM official_v3_at_production_private.ch_source_http_bodies_v3)+bytes>33554432
 THEN RAISE EXCEPTION 'AT_PROD_ARCHIVE_32MIB_LIMIT_FAIL_CLOSED' USING ERRCODE='P7993'; END IF;
 INSERT INTO official_v3_at_production_private.ch_source_http_bodies_v3(
  source_id,raw_body,first_batch_id,first_request_id)
 VALUES(NEW.source_id,raw,NEW.batch_id,req.request_id)
 ON CONFLICT(source_id,raw_sha) DO NOTHING;
 INSERT INTO official_v3_at_production_private.ch_source_http_receipts_v3(
  batch_id,source_id,request_id,raw_sha,raw_bytes,observed_at,state)
 VALUES(NEW.batch_id,NEW.source_id,req.request_id,body_sha,bytes,NEW.observed_at,NEW.source_status);
 RETURN NULL;
END $capture$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.archive_on_observation_v3()
 FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER capture_official_http_original_v3
 AFTER INSERT ON official_v3_at_production_private.watch_observations_v1
 FOR EACH ROW WHEN (NEW.http_status=200 AND NEW.body_sha IS NOT NULL AND NEW.bytes IS NOT NULL)
 EXECUTE FUNCTION official_v3_at_production_private.archive_on_observation_v3();
