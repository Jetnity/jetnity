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
 v.sha,v.bytes,q.accepted_sha,q.accepted_bytes,639,o.observed_at
FROM official_v3_at_production_private.ch_source_qualifications_v2 q
JOIN (VALUES
 ('bmeia-bern-how-to-apply','b8ae6ea71f8ca44556ec30be7921de9c18c26211da1a6175d9b5c0bda85aabc8',172428),
 ('bmi-general-entry','ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655),
 ('bmi-visa-nationality-matrix','fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415)
) v(id,sha,bytes) ON v.id=q.source_id
JOIN official_v3_at_production_private.watch_observations_v1 o
  ON o.source_id=q.source_id AND o.batch_id=639
WHERE o.http_status=200 AND o.body_sha=v.sha AND o.bytes=v.bytes
  AND o.observed_at>='2026-11-23T19:45:00Z'::timestamptz
  AND o.observed_at<='2026-11-23T19:46:00Z'::timestamptz;
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
SELECT c.source_id,c.original_batch,convert_to(response.content,'UTF8')
FROM official_v3_at_production_private.ch_source_qualifications_v3 c
JOIN official_v3_at_production_private.watch_requests_v1 w
  ON w.source_id=c.source_id AND w.batch_id=c.original_batch
JOIN net._http_response response ON response.id=w.request_id
WHERE response.status_code=200 AND response.timed_out IS FALSE AND response.error_msg IS NULL
 AND encode(sha256(convert_to(response.content,'UTF8')),'hex')=c.original_sha
 AND octet_length(convert_to(response.content,'UTF8'))=c.original_bytes;
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
 initial_batch bigint NOT NULL DEFAULT 639 CHECK(initial_batch=639),
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
 JOIN net._http_response r ON r.id=w.request_id
 WHERE w.batch_id=p_batch AND o.http_status=200 AND r.status_code=200
 AND r.timed_out IS FALSE AND r.error_msg IS NULL
 AND o.observed_at BETWEEN w.requested_at AND w.requested_at+interval '6 minutes 10 seconds'
 AND o.observed_at<=instant AND r.content IS NOT NULL
 AND o.body_sha=encode(sha256(convert_to(r.content,'UTF8')),'hex')
 AND o.bytes=octet_length(convert_to(r.content,'UTF8'))
 AND (CASE WHEN q.source_id='bmeia-bern-how-to-apply'
    THEN official_v3_at_production_private.bmeia_theme_assets_v3(convert_from(raw.raw_body,'UTF8'),r.content)
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
 operation_id,decision,source_sha,source_bytes,owner_id,auth_session_id,method_epoch)
 VALUES(p_operation_id,'rule_neutral_ch_at_visa_only',p_bmeia_sha,172428,actor,session_uuid,2)
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
  JOIN net._http_response r ON r.id=w.request_id
  WHERE o.batch_id=b AND o.http_status=200 AND r.status_code=200
    AND r.timed_out IS FALSE AND r.error_msg IS NULL
    AND o.observed_at BETWEEN w.requested_at AND w.requested_at+interval '6 minutes 10 seconds'
    AND r.content IS NOT NULL AND o.body_sha=encode(sha256(convert_to(r.content,'UTF8')),'hex')
    AND o.bytes=octet_length(convert_to(r.content,'UTF8'))
    AND (CASE WHEN q.source_id='bmeia-bern-how-to-apply'
     THEN official_v3_at_production_private.bmeia_theme_assets_v3(convert_from(raw.raw_body,'UTF8'),r.content)
     ELSE o.body_sha=q.original_sha AND o.bytes=q.original_bytes END))=3;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $pre$;

-- The BG1 V6 provider/catalog successor MUST be included before COMMIT.
-- A standalone execution of this file is intentionally incomplete and MUST
-- NOT be used as the Production installer. See guarded bundle + rollback.
-- NO COMMIT: assembler supplies V6 exact guards and final COMMIT/ROLLBACK.
