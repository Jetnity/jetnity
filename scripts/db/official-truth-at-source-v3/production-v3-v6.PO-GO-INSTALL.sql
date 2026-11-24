-- CH->AT Official Truth source successor V3. PRODUCTION CANDIDATE, NOT APPLIED.
-- This is Stufe 1 only: private append-only candidate + AAL2 source decision.
-- No visitor flag, no renewal switch, no new facts, no active Cron, no costs.
-- Requires a separate PO-Go and verified protected BG1 V6 successor (below).
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_v3_target='production:qscbgcdmivbbnzrcyegn:AT-CH-SOURCE-V3-STUFE1';
DO $gate$
DECLARE m official_v3_method_private.heads_v1%ROWTYPE;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_v3_target',true) IS DISTINCT FROM
    'production:qscbgcdmivbbnzrcyegn:AT-CH-SOURCE-V3-STUFE1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('official_v3_at_production_private.ch_source_qualifications_v3') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_v6') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771112,33)
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_EXACT_PRODUCTION_PREDECESSOR_REQUIRED' USING ERRCODE='P7996'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 SELECT * INTO STRICT m FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF m.status<>'approved' OR m.revision<>2 OR m.epoch<>2
 OR m.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR m.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_MA1_EXACT_REV2_REQUIRED' USING ERRCODE='P7996'; END IF;
END $gate$;
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


-- A fresh complete real batch, NEVER a guessed old HTTP ID (639/658).
CREATE TEMP TABLE pg_temp.at_ch_v3_selected_batch(batch_id bigint PRIMARY KEY) ON COMMIT DROP;
INSERT INTO pg_temp.at_ch_v3_selected_batch(batch_id)
SELECT b.batch_id FROM official_v3_at_production_private.watch_batches_v1 b
WHERE b.batch_id=(SELECT max(batch_id) FROM official_v3_at_production_private.watch_batches_v1)
 AND b.started_at BETWEEN clock_timestamp()-interval '70 minutes' AND clock_timestamp()
 AND (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 r
  JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id,source_id)
  JOIN net._http_response response ON response.id=r.request_id
  JOIN (VALUES
 ('bmeia-bern-how-to-apply','b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8',172428),
 ('bmi-general-entry','ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655),
 ('bmi-visa-nationality-matrix','fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415)
  ) expected(id,sha,bytes) ON expected.id=r.source_id
  WHERE r.batch_id=b.batch_id AND o.http_status=200 AND response.status_code=200
   AND response.timed_out IS FALSE AND response.error_msg IS NULL
   AND response.content IS NOT NULL AND response.content_type~*'^text/html([; ]|$)'
   AND o.observed_at BETWEEN r.requested_at AND r.requested_at+interval '6 minutes 10 seconds'
   AND o.observed_at<=clock_timestamp()
   AND o.body_sha=expected.sha AND o.bytes=expected.bytes
   AND encode(sha256(convert_to(response.content,'UTF8')),'hex')=expected.sha
   AND octet_length(convert_to(response.content,'UTF8'))=expected.bytes
   AND (CASE WHEN r.source_id='bmeia-bern-how-to-apply' THEN o.source_status='changed'
     ELSE o.source_status='unchanged_exact' END))=3;
DO $chosen$
BEGIN
 IF (SELECT count(*) FROM pg_temp.at_ch_v3_selected_batch)<>1
 THEN RAISE EXCEPTION 'AT_V3_NO_CURRENT_COMPLETE_REAL_HTTP200_TRIPLE' USING ERRCODE='P7996'; END IF;
END $chosen$;
-- Capture the genuine 3 current HTTP200 bodies NOW, future collector triggers
-- archive new versions BEFORE pg_net's 6-hour response eviction.
INSERT INTO official_v3_at_production_private.ch_source_http_bodies_v3(
 source_id,raw_body,first_batch_id,first_request_id)
SELECT o.source_id,convert_to(response.content,'UTF8'),o.batch_id,r.request_id
FROM pg_temp.at_ch_v3_selected_batch chosen
JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id)
JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id,source_id)
JOIN net._http_response response ON response.id=r.request_id;
INSERT INTO official_v3_at_production_private.ch_source_http_receipts_v3(
 batch_id,source_id,request_id,raw_sha,raw_bytes,observed_at,state)
SELECT o.batch_id,o.source_id,r.request_id,o.body_sha,o.bytes,o.observed_at,o.source_status
FROM pg_temp.at_ch_v3_selected_batch chosen
JOIN official_v3_at_production_private.watch_observations_v1 o USING(batch_id)
JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id,source_id);
DO $triple$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_bodies_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_http_receipts_v3)<>3
 OR (SELECT sum(raw_bytes) FROM official_v3_at_production_private.ch_source_http_bodies_v3)<>762498
 THEN RAISE EXCEPTION 'AT_V3_GENUINE_HTTP_BOOTSTRAP_NOT_COMPLETE' USING ERRCODE='P7996'; END IF;
END $triple$;


-- Immutable method-scoped proposal, not an automatic source qualification.
CREATE TABLE official_v3_at_production_private.ch_source_qualifications_v3(
 source_id text PRIMARY KEY REFERENCES official_v3_at_production_private.source_pins_v1(source_id),
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 source_role text NOT NULL CHECK(source_role IN ('destination_primary','independent_official')),
 original_sha text NOT NULL CHECK(original_sha~'^[a-f0-9]{64}$'),
 original_bytes integer NOT NULL CHECK(original_bytes BETWEEN 1 AND 1048576),
 predecessor_sha text NOT NULL CHECK(predecessor_sha~'^[a-f0-9]{64}$'),
 predecessor_bytes integer NOT NULL CHECK(predecessor_bytes BETWEEN 1 AND 1048576),
 semantic_scope text NOT NULL DEFAULT 'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'
 CHECK(semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'),
 original_batch bigint NOT NULL REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 observed_at timestamptz NOT NULL,
 proposed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 proposed_decision text NOT NULL DEFAULT 'rule_neutral_review_requested'
 CHECK(proposed_decision='rule_neutral_review_requested')
);
INSERT INTO official_v3_at_production_private.ch_source_qualifications_v3(
source_id,official_url,source_role,original_sha,original_bytes,
predecessor_sha,predecessor_bytes,original_batch,observed_at)
SELECT q.source_id,q.official_url,
 CASE WHEN q.source_id='bmeia-bern-how-to-apply' THEN 'independent_official'
      ELSE 'destination_primary' END,
 v.sha,v.bytes,q.accepted_sha,q.accepted_bytes,(SELECT batch_id FROM pg_temp.at_ch_v3_selected_batch),o.observed_at
FROM official_v3_at_production_private.ch_source_qualifications_v2 q
JOIN (VALUES
 ('bmeia-bern-how-to-apply','b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8',172428),
 ('bmi-general-entry','ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655),
 ('bmi-visa-nationality-matrix','fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415)
) v(id,sha,bytes) ON v.id=q.source_id
JOIN official_v3_at_production_private.watch_observations_v1 o
  ON o.source_id=q.source_id AND o.batch_id=(SELECT batch_id FROM pg_temp.at_ch_v3_selected_batch)
WHERE o.http_status=200 AND o.body_sha=v.sha AND o.bytes=v.bytes
  AND o.observed_at<=clock_timestamp();
DO $three$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3
     WHERE original_sha=predecessor_sha AND original_bytes=predecessor_bytes)<>2
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_CANDIDATE_MISMATCH' USING ERRCODE='P7996'; END IF;
END $three$;

-- Genuine HTTP200 bytes, stored as new immutable V3 originals. V2 is never rewritten.
CREATE TABLE official_v3_at_production_private.ch_source_originals_v3(
 source_id text PRIMARY KEY REFERENCES official_v3_at_production_private.ch_source_qualifications_v3(source_id),
 original_batch bigint NOT NULL,
 raw_body bytea NOT NULL,
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO official_v3_at_production_private.ch_source_originals_v3(source_id,original_batch,raw_body)
SELECT c.source_id,c.original_batch,body.raw_body
FROM official_v3_at_production_private.ch_source_qualifications_v3 c
JOIN official_v3_at_production_private.ch_source_http_receipts_v3 receipt
 ON receipt.source_id=c.source_id AND receipt.batch_id=c.original_batch
JOIN official_v3_at_production_private.ch_source_http_bodies_v3 body
 ON body.source_id=receipt.source_id AND body.raw_sha=receipt.raw_sha
WHERE receipt.raw_sha=c.original_sha AND receipt.raw_bytes=c.original_bytes
 AND body.raw_sha=c.original_sha AND body.raw_bytes=c.original_bytes;
DO $stored$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_originals_v3 raw
  JOIN official_v3_at_production_private.ch_source_qualifications_v3 q USING(source_id)
  WHERE raw.raw_sha<>q.original_sha OR raw.raw_bytes<>q.original_bytes
    OR raw.original_batch<>q.original_batch)
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_ORIGINAL_CAPTURE_FAILED' USING ERRCODE='P7996'; END IF;
END $stored$;

-- Owner decision is a separate immutable journal: source candidate!=approval.
CREATE TABLE official_v3_at_production_private.ch_source_owner_decisions_v3(
 operation_id text PRIMARY KEY CHECK(operation_id~'^atsrc3_[a-f0-9]{32}$'),
 decision text NOT NULL CHECK(decision='rule_neutral_ch_at_visa_only'),
 source_sha text NOT NULL CHECK(source_sha='b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'),
 source_bytes integer NOT NULL CHECK(source_bytes=172428),
 initial_batch bigint NOT NULL REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 semantic_scope text NOT NULL DEFAULT 'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'
 CHECK(semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'),
 owner_id uuid NOT NULL,
 auth_session_id uuid NOT NULL,
 method_epoch integer NOT NULL CHECK(method_epoch=2),
 decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(source_sha,decision)
);

DO $security$
DECLARE n text;
BEGIN
 FOREACH n IN ARRAY ARRAY[
  'ch_source_qualifications_v3','ch_source_originals_v3','ch_source_owner_decisions_v3'
 ] LOOP
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE official_v3_at_production_private.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('REVOKE ALL ON TABLE official_v3_at_production_private.%I FROM PUBLIC,anon,authenticated,service_role',n);
  EXECUTE format('CREATE POLICY postgres_only ON official_v3_at_production_private.%I FOR ALL TO postgres USING(true) WITH CHECK(true)',n);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',n);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',n);
 END LOOP;
END $security$;

-- Exact pre-reviewed BMEIA theme paths only; regular links, words, tables,
-- dates, JSON, inline scripts, extra/missing assets and other sources remain hard STOP.
CREATE FUNCTION official_v3_at_production_private.bmeia_theme_assets_v3(
 p_reference text,p_observed text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $assets$
DECLARE
 css_re constant text:='(<link[[:space:]]+rel="stylesheet"[[:space:]]+href=")/typo3conf/ext/theme_bmeia/Resources/Public/CSS/[A-Za-z0-9._-]+[.]css([?][0-9]{10})?(")';
 js_re constant text:='(<script[[:space:]]+src=")/typo3conf/ext/theme_bmeia/Resources/Public/JS/[A-Za-z0-9._-]+[.]js([?][0-9]{10})?(")';
 css_old int;css_new int;js_old int;js_new int;left_text text;right_text text;
BEGIN
 IF p_reference IS NULL OR p_observed IS NULL
 OR octet_length(p_reference) NOT BETWEEN 1 AND 1048576
 OR octet_length(p_observed) NOT BETWEEN 1 AND 1048576
 THEN RETURN false; END IF;
 SELECT count(*) INTO css_old FROM regexp_matches(p_reference,css_re,'g');
 SELECT count(*) INTO css_new FROM regexp_matches(p_observed,css_re,'g');
 SELECT count(*) INTO js_old FROM regexp_matches(p_reference,js_re,'g');
 SELECT count(*) INTO js_new FROM regexp_matches(p_observed,js_re,'g');
 IF css_old<>4 OR css_new<>4 OR js_old<>15 OR js_new<>15 THEN RETURN false; END IF;
 left_text:=regexp_replace(regexp_replace(p_reference,css_re,E'\\1CSS_ASSET\\3','g'),js_re,E'\\1JS_ASSET\\3','g');
 right_text:=regexp_replace(regexp_replace(p_observed,css_re,E'\\1CSS_ASSET\\3','g'),js_re,E'\\1JS_ASSET\\3','g');
 RETURN left_text=right_text;
END $assets$;

-- Never turn research evidence into a source-qualification until a PERSONAL
-- AAL2 Owner decision exists. If the latest source drifts, fail closed.
CREATE FUNCTION official_v3_at_production_private.batch_qualified_ch_v3(p_batch bigint)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $verified$
DECLARE last_batch bigint; instant timestamptz:=clock_timestamp();
BEGIN
 IF p_batch IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3)<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN false; END IF;
 SELECT max(batch_id) INTO last_batch FROM official_v3_at_production_private.watch_batches_v1;
 IF p_batch IS DISTINCT FROM last_batch THEN RETURN false; END IF;
 IF (SELECT started_at FROM official_v3_at_production_private.watch_batches_v1 WHERE batch_id=p_batch)
 NOT BETWEEN instant-interval '70 minutes' AND instant THEN RETURN false; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 WHERE batch_id=p_batch)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=p_batch)<>3 THEN RETURN false; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 w
 JOIN official_v3_at_production_private.watch_observations_v1 o USING(source_id,batch_id)
 JOIN official_v3_at_production_private.ch_source_qualifications_v3 q USING(source_id)
 JOIN official_v3_at_production_private.ch_source_originals_v3 raw USING(source_id)
 JOIN official_v3_at_production_private.ch_source_http_receipts_v3 receipt
 ON receipt.batch_id=o.batch_id AND receipt.source_id=o.source_id AND receipt.request_id=w.request_id
 JOIN official_v3_at_production_private.ch_source_http_bodies_v3 body
 ON body.source_id=receipt.source_id AND body.raw_sha=receipt.raw_sha
 WHERE w.batch_id=p_batch AND o.http_status=200
 AND o.observed_at BETWEEN w.requested_at AND w.requested_at+interval '6 minutes 10 seconds'
 AND o.observed_at<=instant
 AND o.body_sha=receipt.raw_sha AND o.bytes=receipt.raw_bytes
 AND receipt.state=o.source_status AND receipt.observed_at=o.observed_at
 AND (CASE WHEN q.source_id='bmeia-bern-how-to-apply'
    THEN official_v3_at_production_private.bmeia_theme_assets_v3(convert_from(raw.raw_body,'UTF8'),convert_from(body.raw_body,'UTF8'))
    ELSE o.body_sha=q.original_sha AND o.bytes=q.original_bytes END))<>3 THEN RETURN false; END IF;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $verified$;

-- The only callable Owner V3 action. Never delegated to service_role or anon.
CREATE FUNCTION public.official_v3_at_ch_source_approve_v3(
 p_operation_id text,p_bmeia_sha text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog SET lock_timeout='2s' AS $approve$
DECLARE current_head official_v3_method_private.heads_v1%ROWTYPE;
 actor uuid; jwt jsonb; session_uuid uuid; recorded_at timestamptz; previous_op text;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^atsrc3_[a-f0-9]{32}$'
 OR p_bmeia_sha IS DISTINCT FROM 'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'
 OR auth.uid() IS NULL
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_REQUEST_REFUSED' USING ERRCODE='42501'; END IF;
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 actor:=auth.uid(); jwt:=auth.jwt(); session_uuid:=(jwt->>'session_id')::uuid;
 PERFORM pg_advisory_xact_lock(771112,33);
 PERFORM official_v3_guard_private.require_open_v1();
 SELECT * INTO current_head FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR current_head.status<>'approved' OR current_head.revision<>2
 OR current_head.epoch<>2
 OR current_head.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR current_head.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_METHOD_REFUSED' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_qualifications_v3
   WHERE source_id='bmeia-bern-how-to-apply' AND original_sha=p_bmeia_sha AND original_bytes=172428)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_CUSTODY_REFUSED' USING ERRCODE='42501'; END IF;
 -- A changed source or older batch can never be approved from an expired screenshot.
 IF NOT official_v3_at_production_private.batch_qualified_owner_precheck_v3()
 THEN RAISE EXCEPTION 'AT_V3_OWNER_SOURCE_CHANGED' USING ERRCODE='42501'; END IF;
 SELECT operation_id,decided_at INTO previous_op,recorded_at
 FROM official_v3_at_production_private.ch_source_owner_decisions_v3
 WHERE source_sha=p_bmeia_sha AND decision='rule_neutral_ch_at_visa_only' FOR SHARE;
 IF FOUND THEN
  IF previous_op<>p_operation_id THEN RAISE EXCEPTION 'AT_V3_OWNER_DECISION_ALREADY_RECORDED' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('schema',3,'status','recorded','operationId',p_operation_id,
   'sourceSha',p_bmeia_sha,'recordedAt',recorded_at);
 END IF;
 INSERT INTO official_v3_at_production_private.ch_source_owner_decisions_v3(
 operation_id,decision,source_sha,source_bytes,initial_batch,owner_id,auth_session_id,method_epoch)
 VALUES(p_operation_id,'rule_neutral_ch_at_visa_only',p_bmeia_sha,172428,
 (SELECT original_batch FROM official_v3_at_production_private.ch_source_qualifications_v3 WHERE source_id='bmeia-bern-how-to-apply'),actor,session_uuid,2)
 RETURNING decided_at INTO recorded_at;
 RETURN jsonb_build_object('schema',3,'status','recorded','operationId',p_operation_id,
 'sourceSha',p_bmeia_sha,'recordedAt',recorded_at);
END $approve$;
REVOKE ALL ON FUNCTION public.official_v3_at_ch_source_approve_v3(text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_approve_v3(text,text) TO authenticated;

-- Confirm precisely the same operation under a NEW live AAL2 Owner request.
CREATE FUNCTION public.official_v3_at_ch_source_confirm_v3(
 p_operation_id text,p_bmeia_sha text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog SET lock_timeout='2s' AS $confirm$
DECLARE recorded timestamptz;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id!~'^atsrc3_[a-f0-9]{32}$'
 OR p_bmeia_sha IS DISTINCT FROM 'b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8'
 THEN RAISE EXCEPTION 'AT_V3_SOURCE_CONFIRM_REFUSED' USING ERRCODE='42501'; END IF;
 PERFORM jetnity_ot_auth.require_current_owner_session_v1();
 SELECT d.decided_at INTO recorded
 FROM official_v3_at_production_private.ch_source_owner_decisions_v3 d
 WHERE d.operation_id=p_operation_id AND d.source_sha=p_bmeia_sha
   AND d.owner_id=auth.uid();
 IF NOT FOUND THEN RETURN jsonb_build_object('schema',3,'status','absent','operationId',p_operation_id); END IF;
 RETURN jsonb_build_object('schema',3,'status','confirmed','operationId',p_operation_id,
   'sourceSha',p_bmeia_sha,'recordedAt',recorded);
END $confirm$;
REVOKE ALL ON FUNCTION public.official_v3_at_ch_source_confirm_v3(text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.official_v3_at_ch_source_confirm_v3(text,text) TO authenticated;

-- Owner precheck deliberately ignores only exact approved BMEIA theme-asset
-- replacements against archived V2 (which already contains the new ID-Austria URL).
CREATE FUNCTION official_v3_at_production_private.batch_qualified_owner_precheck_v3()
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $pre$
DECLARE b bigint;
BEGIN
 IF to_regclass('official_v3_guard_private.bg1_prod_ch_at_source_rollback_v7') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 THEN RETURN false; END IF;
 SELECT max(batch_id) INTO b FROM official_v3_at_production_private.watch_batches_v1;
 IF b IS NULL OR (SELECT started_at FROM official_v3_at_production_private.watch_batches_v1 WHERE batch_id=b)
 NOT BETWEEN clock_timestamp()-interval '70 minutes' AND clock_timestamp() THEN RETURN false; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 WHERE batch_id=b)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=b)<>3 THEN RETURN false; END IF;
 RETURN (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 o
  JOIN official_v3_at_production_private.watch_requests_v1 w USING(source_id,batch_id)
  JOIN official_v3_at_production_private.ch_source_qualifications_v3 q USING(source_id)
  JOIN official_v3_at_production_private.ch_source_originals_v3 raw USING(source_id)
  JOIN official_v3_at_production_private.ch_source_http_receipts_v3 receipt
    ON receipt.batch_id=o.batch_id AND receipt.source_id=o.source_id AND receipt.request_id=w.request_id
  JOIN official_v3_at_production_private.ch_source_http_bodies_v3 body
    ON body.source_id=receipt.source_id AND body.raw_sha=receipt.raw_sha
  WHERE o.batch_id=b AND o.http_status=200
    AND o.observed_at BETWEEN w.requested_at AND w.requested_at+interval '6 minutes 10 seconds'
    AND o.body_sha=receipt.raw_sha AND o.bytes=receipt.raw_bytes
    AND receipt.state=o.source_status AND receipt.observed_at=o.observed_at
    AND (CASE WHEN q.source_id='bmeia-bern-how-to-apply'
     THEN official_v3_at_production_private.bmeia_theme_assets_v3(convert_from(raw.raw_body,'UTF8'),convert_from(body.raw_body,'UTF8'))
     ELSE o.body_sha=q.original_sha AND o.bytes=q.original_bytes END))=3;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $pre$;

-- The BG1 V6 provider/catalog successor MUST be included before COMMIT.
-- A standalone execution of this file is intentionally incomplete and MUST
-- NOT be used as the Production installer. See guarded bundle + rollback.
-- NO COMMIT: assembler supplies V6 exact guards and final COMMIT/ROLLBACK.

-- PRODUCTION-only guarded BG1 V6 successor, appended AFTER Stufe1 V3 DDL.
-- NOT applied. Dev tests must use synthetic equivalent, NEVER this production file
-- against Dev (separate baseline lineage). Exact old function-body pins below.
DO $exact_predecessor$
DECLARE x record;
BEGIN
 FOR x IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','cf649f5a465e48b201d6a2ccbd845df0ff2212c0f7ca665e6c9ff5d245b7306d'),
  ('official_v3_guard_private.assert_catalog_v1()','9acc356f215f3f374302a1a5f233446609c003bd47fc3ba7b29a6e38da65d3c1'),
  ('official_v3_guard_private.require_open_v1()','15657c6cf1768d62e3a2f25c5f8c200253004af5356b020ed057cee9a371f331'),
  ('public.official_v3_guard_alarm_status_v1()','74c42a03ffa33e850383eaa995af8f935e6686aa4f445719faa3313971fc488f'),
  ('jetnity_ot_auth.require_current_owner_session_v1()','ba3667edd483f0a0abcf53f70f4dc71906f0ffdbc192ee569232c78dd359635b')
 ) v(signature,body_sha) LOOP
 IF to_regprocedure(x.signature) IS NULL OR
 (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
  WHERE p.oid=to_regprocedure(x.signature)) IS DISTINCT FROM x.body_sha
 THEN RAISE EXCEPTION 'AT_SOURCE_V3_PROD_PREDECESSOR_FUNCTION_DRIFT' USING ERRCODE='P7996'; END IF;
 END LOOP;
 IF (SELECT encode(sha256(convert_to(q.catalog::text,'UTF8')),'hex')
     FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 q WHERE singleton)
 IS DISTINCT FROM '58ef6e75f946ac6cc5a49322263b8056838bd0b137844c8b321a2d95c8078aca'
 THEN RAISE EXCEPTION 'AT_SOURCE_V3_PROD_V5_PREDECESSOR_DRIFT' USING ERRCODE='P7996'; END IF;
END $exact_predecessor$;

-- New V6 baseline is append-only and uses immutable V5 as its predecessor.
CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_v6(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 source_digest text NOT NULL CHECK(source_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_source_v6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_prod_ch_at_source_v6 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE official_v3_guard_private.bg1_prod_ch_at_source_v6
 FROM PUBLIC,anon,authenticated,service_role;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_prod_ch_at_source_v6
 FOR ALL TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON
 official_v3_guard_private.bg1_prod_ch_at_source_v6 FOR EACH ROW
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON
 official_v3_guard_private.bg1_prod_ch_at_source_v6 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_guard_private.immutable_v1();

-- Re-compute the full catalogue, including the two new public Owner RPCs.
CREATE OR REPLACE FUNCTION official_v3_guard_private.catalog_status_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
 SET jit TO 'off'
AS $function$
WITH namespaces AS (
  SELECT oid FROM pg_namespace WHERE nspname IN ('jetnity_ot_auth','official_v3_method_private','official_v3_method_api',
    'official_v3_intake_private','official_v3_intake_api','official_v3_jobs_private','official_v3_jobs_api',
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','jetnity_weather_private','official_v3_at_production_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','jetnity_bg1_alarm_kind_v2','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1','official_v3_at_ch_source_approve_v3','official_v3_at_ch_source_confirm_v3'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname IN ('profiles','saved_offers') OR n.nspname='auth' AND c.relname IN ('users','sessions'))
), classes AS (
  SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables WHERE reltoastrelid<>0
  UNION SELECT i.indexrelid FROM pg_index i WHERE i.indrelid IN (SELECT oid FROM tables UNION SELECT reltoastrelid FROM tables)
), types AS (
  SELECT t.oid FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM namespaces)
    OR t.typrelid IN (SELECT oid FROM classes)
), objects AS (
  SELECT 'pg_namespace'::regclass::oid AS classid,oid AS objid FROM namespaces
  UNION SELECT 'pg_proc'::regclass,oid FROM procs
  UNION SELECT 'pg_class'::regclass,oid FROM classes
  UNION SELECT 'pg_type'::regclass,oid FROM types
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION SELECT 'pg_attrdef'::regclass,a.oid FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
), protected_roles AS (
  SELECT oid FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','authenticator','service_role','supabase_auth_admin',
    'supabase_read_only_user','ot_v3_result_owner','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier',
    'ot_v3_jobs_owner','ot_v3_jobs_caller','ot_v3_intake_owner','ot_v3_intake_caller','ot_v3_method_reader')
  UNION SELECT m.member FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    WHERE r.rolname IN ('ot_v3_jobs_caller','ot_v3_intake_caller','ot_v3_method_reader')
), entries(key,value) AS (
  SELECT 'namespace:'||n.oid,to_jsonb(n) FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'function:'||p.oid,(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
    ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
    FROM pg_proc p WHERE p.oid IN (SELECT oid FROM procs)
  UNION ALL SELECT 'relation:'||c.oid,to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
    FROM pg_class c WHERE c.oid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'attribute:'||a.attrelid||':'||a.attnum,to_jsonb(a) FROM pg_attribute a WHERE a.attrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'type:'||t.oid,to_jsonb(t) FROM pg_type t WHERE t.oid IN (SELECT oid FROM types)
  UNION ALL SELECT 'constraint:'||c.oid,to_jsonb(c) FROM pg_constraint c WHERE c.conrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'trigger:'||t.oid,to_jsonb(t) FROM pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'policy:'||p.oid,to_jsonb(p) FROM pg_policy p WHERE p.polrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'default:'||a.oid,to_jsonb(a) FROM pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM tables)
  UNION ALL SELECT 'index:'||i.indexrelid,to_jsonb(i) FROM pg_index i WHERE i.indexrelid IN (SELECT oid FROM classes)
  UNION ALL SELECT 'rewrite:'||r.oid,to_jsonb(r) FROM pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM classes)
  UNION ALL SELECT 'inheritance:'||i.inhrelid||':'||i.inhparent,to_jsonb(i) FROM pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM classes) OR i.inhparent IN (SELECT oid FROM classes)
  UNION ALL SELECT 'role:'||r.oid,to_jsonb(r)-'rolpassword' FROM pg_roles r WHERE r.oid IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'membership:'||m.oid,to_jsonb(m) FROM pg_auth_members m
    WHERE m.roleid IN (SELECT oid FROM protected_roles) OR m.member IN (SELECT oid FROM protected_roles) OR m.grantor IN (SELECT oid FROM protected_roles)
  UNION ALL SELECT 'setting:'||s.setdatabase||':'||s.setrole,to_jsonb(s) FROM pg_db_role_setting s
    WHERE s.setrole IN (SELECT oid FROM protected_roles) OR s.setdatabase=(SELECT oid FROM pg_database WHERE datname=current_database())
  UNION ALL SELECT 'default_acl:'||a.oid,to_jsonb(a) FROM pg_default_acl a
    WHERE a.defaclrole IN (SELECT oid FROM protected_roles) OR a.defaclnamespace IN (SELECT oid FROM namespaces)
  UNION ALL SELECT 'database',to_jsonb(d)-ARRAY['datfrozenxid','datminmxid'] FROM pg_database d WHERE d.datname=current_database()
  UNION ALL SELECT 'dependency:'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.refobjsubid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype FROM pg_depend d
      WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
        OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)) d
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM (SELECT DISTINCT d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype FROM pg_shdepend d
      WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
        AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
        OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))) d
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
 UNION ALL SELECT 'transport:production_http_id_allocator_v4',jsonb_build_object('native',jsonb_build_object(
 'net_namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('net')),
 'pg_net_extension',(SELECT to_jsonb(e) FROM pg_extension e WHERE e.extname='pg_net'),
 'replication_parameter_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.oid),'[]'::pg_catalog.jsonb)
   FROM pg_parameter_acl a WHERE a.parname='session_replication_role'),
 'replication_role_settings',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.setdatabase,s.setrole),'[]'::pg_catalog.jsonb)
   FROM pg_db_role_setting s WHERE EXISTS(SELECT 1 FROM unnest(s.setconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'replication_function_settings',(SELECT coalesce(jsonb_agg(to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'] ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'session_replication_role=%')),
 'supautils_settings',jsonb_build_object(
   'privileged_role',current_setting('supautils.privileged_role',true),
   'privileged_role_allowed_configs',current_setting('supautils.privileged_role_allowed_configs',true)),
 'queue_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue')),
 'queue_attributes',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.attnum),'[]'::pg_catalog.jsonb)
   FROM pg_attribute a WHERE a.attrelid=to_regclass('net.http_request_queue')),
 'queue_defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('expression',pg_get_expr(d.adbin,d.adrelid)) ORDER BY d.adnum),'[]'::pg_catalog.jsonb)
   FROM pg_attrdef d WHERE d.adrelid=to_regclass('net.http_request_queue')),
 'queue_constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.oid),'[]'::pg_catalog.jsonb)
   FROM pg_constraint c WHERE c.conrelid=to_regclass('net.http_request_queue')),
 'queue_indexes',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.indexrelid),'[]'::pg_catalog.jsonb)
   FROM pg_index i WHERE i.indrelid=to_regclass('net.http_request_queue')),
 'queue_rules',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.oid),'[]'::pg_catalog.jsonb)
   FROM pg_rewrite r WHERE r.ev_class=to_regclass('net.http_request_queue')),
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p')),
 'stored_transport_consumers',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE p.prokind IN('f','p') AND n.nspname NOT IN('pg_catalog','information_schema','net','official_v3_guard_private','jetnity_pgnet_allocator_private')
   AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast%'
   AND (p.prosrc ~ 'net[.]http_(get|post|delete)[[:space:]]*[(]'
     OR p.prosrc LIKE '%net.http_request_queue%'))
),'method_domain',jsonb_build_object(
 'type',(SELECT to_jsonb(t) FROM pg_type t WHERE t.oid=to_regtype('net.http_method')),
 'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object(
  'definition_sha256',encode(sha256(convert_to(pg_get_constraintdef(c.oid,false),'UTF8')),'hex'))
  ORDER BY c.oid),'[]'::pg_catalog.jsonb) FROM pg_constraint c WHERE c.contypid=to_regtype('net.http_method')))
,'cron_contract',(
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'jobid',j.jobid::text,'jobname',j.jobname,'schedule',j.schedule,
  'active',j.active,'database',j.database,'username',j.username,
  'command_sha256',encode(sha256(convert_to(j.command,'UTF8')),'hex'),
  'full_row_sha256',encode(sha256(convert_to(to_jsonb(j)::text,'UTF8')),'hex')
 ) ORDER BY j.jobname COLLATE "C",j.jobid),'[]'::jsonb)
 FROM (SELECT * FROM cron.job
  WHERE jobname IN('jetnity-at-production-source-collect-v1',
   'jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-renew-v1',
   'jetnity-at-production-source-qualified-renew-v2',
   'jetnity-ch-de-prod-import-v1','jetnity-official-truth-production-guard-v1')
  ORDER BY jobname COLLATE "C",jobid LIMIT 6) j
),'allocator',jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'function',(SELECT (to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
   FROM pg_proc p WHERE p.oid=to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')),
 'global_trigger',(SELECT to_jsonb(t) FROM pg_trigger t
   WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1'),
 'dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.refobjsubid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_depend d WHERE (d.classid,d.objid) IN(SELECT * FROM owned_objects)
   OR (d.refclassid,d.refobjid) IN(SELECT * FROM owned_objects)),
 'shared_dependencies',(WITH owned_objects(classid,objid) AS (
   VALUES ('pg_namespace'::pg_catalog.regclass::pg_catalog.oid,to_regnamespace('jetnity_pgnet_allocator_private')::pg_catalog.oid),
    ('pg_class'::pg_catalog.regclass::pg_catalog.oid,to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')::pg_catalog.oid),
    ('pg_proc'::pg_catalog.regclass::pg_catalog.oid,to_regprocedure('jetnity_pgnet_allocator_private.assign_request_id_v1()')::pg_catalog.oid)
   UNION SELECT 'pg_trigger'::pg_catalog.regclass::pg_catalog.oid,t.oid FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('net.http_request_queue') AND t.tgname='jetnity_pgnet_request_id_v1')
  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.dbid,d.classid,d.objid,d.objsubid,d.refclassid,d.refobjid,d.deptype),'[]'::pg_catalog.jsonb)
  FROM pg_shdepend d WHERE d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
   AND (d.classid,d.objid) IN(SELECT * FROM owned_objects))
))
)
SELECT jsonb_object_agg_unique(key,value) FROM entries
$function$
;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_source_v6 official_v3_guard_private.bg1_prod_ch_at_source_v6%ROWTYPE;
 ch_at_v5 official_v3_guard_private.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 official_v3_guard_private.bg1_production_http_allocator_v4%ROWTYPE;
 optimized official_v3_guard_private.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT at_source_v6 FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton;
  SELECT * INTO STRICT ch_at_v5 FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM official_v3_guard_private.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM official_v3_guard_private.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM official_v3_guard_private.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM official_v3_guard_private.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM official_v3_guard_private.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR admin.predecessor_provider_digest<>'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a'
    OR admin.definition_digest<>'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR offers.migration_blob IS DISTINCT FROM '667766f5455ff2460f4eb56f04c7a62c84ca9e05'
    OR offers.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR offers.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR weather.candidate_sha256 IS DISTINCT FROM '9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae'
    OR weather.predecessor_sha256 IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(offers)||jsonb_build_object('proof_not_before',extract(epoch FROM offers.proof_not_before)))::text,'UTF8')),'hex')
    OR at_prod.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(weather.catalog::text,'UTF8')),'hex')
    OR at_prod.predecessor_weather_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(weather)||jsonb_build_object('proof_not_before',extract(epoch FROM weather.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.predecessor_catalog_digest IS DISTINCT FROM
      encode(sha256(convert_to(at_prod.catalog::text,'UTF8')),'hex')
    OR switch_v2.predecessor_baseline_digest IS DISTINCT FROM
      encode(sha256(convert_to((to_jsonb(at_prod)||jsonb_build_object(
        'proof_not_before',extract(epoch FROM at_prod.proof_not_before)))::text,'UTF8')),'hex')
    OR switch_v2.required_generation<=at_prod.required_generation
    OR switch_v2.proof_not_before<at_prod.proof_not_before
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(switch_v2.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(switch_v2)||jsonb_build_object('proof_not_before',extract(epoch FROM switch_v2.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=switch_v2.required_generation OR bg1_v3.proof_not_before<=switch_v2.proof_not_before
 OR optimized.algorithm IS DISTINCT FROM 'jsonb_unique_narrow_dependency_distinct_v1'
 OR optimized.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR optimized.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(bg1_v3)
   ||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')<>'7b9418dfeec3bb21d0c23f8689c8e19c2151a1a4d11901c727980373e30eab9e'
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')<>'ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24'
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
 OR allocator_v4.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.transport_metadata::text,'UTF8')),'hex')
 OR allocator_v4.transport_metadata IS DISTINCT FROM (allocator_v4.catalog->'transport:production_http_id_allocator_v4')
 OR ch_at_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(allocator_v4.catalog::text,'UTF8')),'hex')
 OR ch_at_v5.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(allocator_v4)
       ||jsonb_build_object('proof_not_before',extract(epoch FROM allocator_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR ch_at_v5.required_generation<=allocator_v4.required_generation
 OR ch_at_v5.proof_not_before<=allocator_v4.proof_not_before
 OR ch_at_v5.qualified_source_digest IS DISTINCT FROM (
    SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
      expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM official_v3_at_production_private.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR at_source_v6.predecessor_catalog_digest IS DISTINCT FROM
   encode(sha256(convert_to(ch_at_v5.catalog::text,'UTF8')),'hex')
 OR at_source_v6.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(ch_at_v5)||
       jsonb_build_object('proof_not_before',extract(epoch FROM ch_at_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR at_source_v6.source_digest IS DISTINCT FROM
    (SELECT encode(sha256(convert_to(string_agg(source_id||':'||original_sha||':'||
       original_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
     FROM official_v3_at_production_private.ch_source_qualifications_v3)
 OR at_source_v6.required_generation<=ch_at_v5.required_generation
 OR at_source_v6.proof_not_before<=ch_at_v5.proof_not_before
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v3)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v3)<>3
 OR at_source_v6.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;
CREATE OR REPLACE FUNCTION official_v3_guard_private.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
CREATE OR REPLACE FUNCTION public.official_v3_guard_alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state official_v3_guard_private.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN RETURN unavailable_value; END IF;
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 v WHERE v.singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$
;
INSERT INTO official_v3_guard_private.bg1_prod_ch_at_source_v6(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 source_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v5.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v5)||
  jsonb_build_object('proof_not_before',extract(epoch FROM v5.proof_not_before)))::text,'UTF8')),'hex'),
 (SELECT encode(sha256(convert_to(string_agg(source_id||':'||original_sha||':'||
   original_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
  FROM official_v3_at_production_private.ch_source_qualifications_v3),
 s.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_prod_ch_at_qualified_v5 v5
CROSS JOIN official_v3_guard_private.state_v1 s
WHERE v5.singleton AND s.singleton;

DO $check_v6$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_prod_ch_at_source_v6)<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_owner_decisions_v3)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 THEN RAISE EXCEPTION 'AT_SOURCE_V3_V6_PROTECTED_INSTALL_INCOMPLETE' USING ERRCODE='P7996'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 -- A new natural BG1 five-minute checker is required after the commit.
 BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RAISE EXCEPTION 'AT_SOURCE_V3_V6_PREMATURE_GUARD_OPEN' USING ERRCODE='P7996';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $check_v6$;

COMMIT;
