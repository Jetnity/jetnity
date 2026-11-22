-- GENERATED TARGET BODY. No BEGIN/COMMIT; NEVER execute alone.
-- Intended only after the separate exact Production-V1 installer precheck and BG1-v5 guard.
-- Existing V1 source pins, originals, facts, cron jobs and HTTP allocator remain immutable.

CREATE TABLE official_v3_at_production_private.ch_source_qualifications_v2(
 source_id text PRIMARY KEY REFERENCES official_v3_at_production_private.source_pins_v1(source_id),
 official_url text NOT NULL,
 accepted_sha text NOT NULL CHECK(accepted_sha ~ '^[a-f0-9]{64}$'),
 accepted_bytes integer NOT NULL CHECK(accepted_bytes BETWEEN 1 AND 1048576),
 expected_watch_state text NOT NULL CHECK(expected_watch_state IN ('unchanged_exact','changed')),
 semantic_scope text NOT NULL CHECK(semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'),
 owner_semantic_review text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE official_v3_at_production_private.ch_source_qualifications_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_source_qualifications_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_source_qualifications_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.ch_source_qualifications_v2
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.ch_source_qualifications_v2
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
REVOKE ALL ON official_v3_at_production_private.ch_source_qualifications_v2 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_at_production_private.ch_source_qualifications_v2
(source_id,official_url,accepted_sha,accepted_bytes,expected_watch_state,semantic_scope,owner_semantic_review)
VALUES
('bmi-visa-nationality-matrix','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415,'unchanged_exact','CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY','owner_narrow_source_decision_20261122'),
('bmi-general-entry','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655,'unchanged_exact','CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY','owner_narrow_source_decision_20261122'),
('bmeia-bern-how-to-apply','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
 '2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe',172428,'changed',
 'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY','owner_approved_rule_neutral_delta_changed_remains_changed_20261122');

-- Append-only actual raw official responses from authenticated native watch evidence.
-- The installer adds no body and no visa fact; the natural issuer admits a body
-- only after net._http_response status 200, exact SHA/size and native request link.
CREATE TABLE official_v3_at_production_private.ch_source_originals_v2(
 source_id text PRIMARY KEY REFERENCES official_v3_at_production_private.ch_source_qualifications_v2(source_id),
 batch_id bigint NOT NULL,
 stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 raw_body bytea NOT NULL CHECK(octet_length(raw_body) BETWEEN 1 AND 1048576),
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 FOREIGN KEY(batch_id,source_id) REFERENCES official_v3_at_production_private.watch_observations_v1(batch_id,source_id)
);
ALTER TABLE official_v3_at_production_private.ch_source_originals_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_source_originals_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_source_originals_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.ch_source_originals_v2
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.ch_source_originals_v2
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
REVOKE ALL ON official_v3_at_production_private.ch_source_originals_v2 FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE official_v3_at_production_private.ch_visa_facts_v2(
 version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_batch_id bigint NOT NULL UNIQUE REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
 method_id text NOT NULL DEFAULT 'jetnity-destination-primary-at-visa' CHECK(method_id='jetnity-destination-primary-at-visa'),
 method_revision integer NOT NULL DEFAULT 2 CHECK(method_revision=2),
 method_digest text NOT NULL DEFAULT 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' CHECK(method_digest='fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'),
 package_digest text NOT NULL DEFAULT '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0' CHECK(package_digest='6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'),
 method_epoch integer NOT NULL CHECK(method_epoch>1),
 citizenship_code text NOT NULL DEFAULT 'CH' CHECK(citizenship_code='CH'),
 destination_code text NOT NULL DEFAULT 'AT' CHECK(destination_code='AT'),
 requirement_type text NOT NULL DEFAULT 'visa' CHECK(requirement_type='visa'),
 document_type text NOT NULL DEFAULT 'passport' CHECK(document_type='passport'),
 route_type text NOT NULL DEFAULT 'direct_entry' CHECK(route_type='direct_entry'),
 visa_effect text NOT NULL DEFAULT 'not_required' CHECK(visa_effect='not_required'),
 visa_mode text NOT NULL DEFAULT 'visa_exempt' CHECK(visa_mode='visa_exempt'),
 source_digest text NOT NULL CHECK(source_digest ~ '^[a-f0-9]{64}$'),
 source_checked_at timestamptz NOT NULL,
 verified_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
 approved_origin text NOT NULL DEFAULT 'OWNER_MA1_REV2_AND_CH_AT_SOURCE_V2'
  CHECK(approved_origin='OWNER_MA1_REV2_AND_CH_AT_SOURCE_V2'),
 CHECK(expires_at>verified_at AND verified_at>=source_checked_at
  AND expires_at<=verified_at+interval '1 hour'
  AND expires_at<=source_checked_at+interval '70 minutes')
);
ALTER TABLE official_v3_at_production_private.ch_visa_facts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_visa_facts_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_visa_facts_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.ch_visa_facts_v2
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.ch_visa_facts_v2
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
REVOKE ALL ON official_v3_at_production_private.ch_visa_facts_v2 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE official_v3_at_production_private.ch_visa_facts_v2_version_id_seq FROM PUBLIC,anon,authenticated,service_role;

-- Inputs never grant authority: real V1 watcher, its exact SHA and time are read again.
CREATE FUNCTION official_v3_at_production_private.batch_qualified_ch_v2(p_batch bigint)
 RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $qualified$
DECLARE instant_at timestamptz:=clock_timestamp(); started timestamptz;
BEGIN
 IF p_batch IS NULL OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)>3
 THEN RETURN false; END IF;
 SELECT started_at INTO started FROM official_v3_at_production_private.watch_batches_v1 WHERE batch_id=p_batch;
 IF NOT FOUND OR started>instant_at OR started<=instant_at-interval '70 minutes' THEN RETURN false; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 WHERE batch_id=p_batch)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=p_batch)<>3
 THEN RETURN false; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 o
   JOIN official_v3_at_production_private.ch_source_qualifications_v2 q USING(source_id)
   JOIN official_v3_at_production_private.watch_requests_v1 r USING(batch_id,source_id)
   WHERE o.batch_id=p_batch AND o.http_status=200
    AND o.observed_at>r.requested_at AND o.observed_at<=r.requested_at+interval '6 minutes 10 seconds'
    AND o.observed_at<=instant_at AND r.requested_at=started
    AND o.source_status=q.expected_watch_state
    AND o.body_sha=q.accepted_sha AND o.bytes=q.accepted_bytes)<>3 THEN RETURN false; END IF;
 -- Even a single newer mismatch means immediate fail-closed, regardless of
 -- whether the still-running successor batch is complete.
 IF EXISTS(SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
    JOIN official_v3_at_production_private.ch_source_qualifications_v2 q USING(source_id)
    WHERE o.batch_id>p_batch AND
      (o.source_status IS DISTINCT FROM q.expected_watch_state
       OR o.body_sha IS DISTINCT FROM q.accepted_sha
       OR o.bytes IS DISTINCT FROM q.accepted_bytes OR o.http_status IS DISTINCT FROM 200))
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.watch_batches_v1 b
    WHERE b.batch_id>p_batch AND b.started_at<=instant_at-interval '6 minutes 10 seconds'
      AND (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 o
            WHERE o.batch_id=b.batch_id)<>3)
 THEN RETURN false; END IF;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $qualified$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.batch_qualified_ch_v2(bigint)
 FROM PUBLIC,anon,authenticated,service_role;

-- Natural scheduler job is installed separately in the same transaction.
-- It cannot approve a method or synthesize an owner receipt.
CREATE FUNCTION official_v3_at_production_private.renew_ch_v2()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $renew$
DECLARE b bigint; now_at timestamptz; checked timestamptz; h official_v3_method_private.heads_v1%ROWTYPE;
 total integer; inserted integer:=0; digest text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_rollback_v6') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771112,22)
 THEN RETURN 0; END IF;
 PERFORM official_v3_guard_private.require_open_v1();
 SELECT * INTO h FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.status<>'approved' OR h.revision<>2 OR h.epoch<=1
 OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RETURN 0; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT batch_id INTO b FROM official_v3_at_production_private.watch_batches_v1 x
 WHERE (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 o
        WHERE o.batch_id=x.batch_id)=3
 ORDER BY batch_id DESC LIMIT 1;
 IF b IS NULL OR NOT official_v3_at_production_private.batch_qualified_ch_v2(b) THEN RETURN 0; END IF;
 now_at:=clock_timestamp();
 SELECT min(o.observed_at) INTO checked FROM official_v3_at_production_private.watch_observations_v1 o
 WHERE o.batch_id=b;
 IF checked IS NULL OR checked>now_at OR checked<=now_at-interval '70 minutes' THEN RETURN 0; END IF;
 -- Retain exact original bytes only from V1-approved genuine HTTP 200 requests.
 INSERT INTO official_v3_at_production_private.ch_source_originals_v2(source_id,batch_id,raw_body)
 SELECT q.source_id,b,convert_to(netresp.content,'UTF8')
 FROM official_v3_at_production_private.ch_source_qualifications_v2 q
 JOIN official_v3_at_production_private.watch_requests_v1 req ON req.source_id=q.source_id AND req.batch_id=b
 JOIN official_v3_at_production_private.watch_observations_v1 obs ON obs.batch_id=req.batch_id AND obs.source_id=req.source_id
 JOIN net._http_response netresp ON netresp.id=req.request_id
 WHERE netresp.status_code=200 AND netresp.timed_out IS FALSE AND netresp.error_msg IS NULL
  AND encode(sha256(convert_to(netresp.content,'UTF8')),'hex')=q.accepted_sha
  AND octet_length(convert_to(netresp.content,'UTF8'))=q.accepted_bytes
  AND obs.body_sha=q.accepted_sha AND obs.bytes=q.accepted_bytes
 ON CONFLICT(source_id) DO NOTHING;
 IF (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.ch_source_originals_v2 orig
     JOIN official_v3_at_production_private.ch_source_qualifications_v2 q USING(source_id)
     WHERE orig.raw_sha<>q.accepted_sha OR orig.raw_bytes<>q.accepted_bytes)
 THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=b;
 IF digest IS NULL THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v2(
 source_batch_id,method_epoch,source_digest,source_checked_at,verified_at,expires_at)
 VALUES(b,h.epoch,digest,checked,now_at,LEAST(checked+interval '70 minutes',now_at+interval '1 hour'))
 ON CONFLICT(source_batch_id) DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 RETURN inserted;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $renew$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.renew_ch_v2()
 FROM PUBLIC,anon,authenticated,service_role;

-- Only existing public RPC is used by the website; this private reader
-- cannot be called directly by anon, authenticated or service_role.
CREATE FUNCTION official_v3_at_production_private.read_ch_v2(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $reader$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 f official_v3_at_production_private.ch_visa_facts_v2%ROWTYPE;
 h official_v3_method_private.heads_v1%ROWTYPE; now_at timestamptz:=clock_timestamp();
 digest text; links jsonb;
BEGIN
 IF p_citizenship IS DISTINCT FROM 'CH'
 OR to_regclass('official_v3_guard_private.bg1_prod_ch_at_rollback_v6') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN none; END IF;
 PERFORM official_v3_guard_private.require_open_v1();
 SELECT * INTO f FROM official_v3_at_production_private.ch_visa_facts_v2 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR f.source_checked_at>now_at OR f.verified_at>now_at
 OR now_at>=f.expires_at OR now_at>=f.source_checked_at+interval '70 minutes'
 OR f.method_revision<>2 OR f.method_epoch<=1 OR f.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR f.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 OR NOT official_v3_at_production_private.batch_qualified_ch_v2(f.source_batch_id)
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_source_originals_v2)<>3
 THEN RETURN none; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.epoch<>f.method_epoch OR h.status<>'approved'
 OR h.revision<>2 OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RETURN none; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1('jetnity-destination-primary-at-visa',
 2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=f.source_batch_id;
 IF digest IS DISTINCT FROM f.source_digest THEN RETURN none; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
    WHEN 'bmi-general-entry' THEN 1 WHEN 'bmi-visa-nationality-matrix' THEN 2 ELSE 3 END)
 INTO links FROM official_v3_at_production_private.ch_source_qualifications_v2;
 IF jsonb_array_length(links)<>3 THEN RETURN none; END IF;
 RETURN jsonb_build_object('status','accepted','citizenshipCountryCode','CH',
 'destinationCountryCode','AT','documentType','passport','visaEffect','not_required',
 'visaMode','visa_exempt','ruleVersion',f.version_id,
 'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'sourceUrls',links);
EXCEPTION WHEN OTHERS THEN RETURN none;
END $reader$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.read_ch_v2(text)
 FROM PUBLIC,anon,authenticated,service_role;

-- Reuse the existing externally allowed public RPC and preserve its ACL and
-- exact return schema. No direct privilege on private source/reader tables.
CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $public_v2$
BEGIN
 IF p_citizenship_country_code IS DISTINCT FROM 'CH' THEN
  RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 END IF;
 RETURN official_v3_at_production_private.read_ch_v2(p_citizenship_country_code);
EXCEPTION WHEN OTHERS THEN
 RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
END $public_v2$;
-- CREATE OR REPLACE preserves existing public RPC grants. Do not grant private rights.
