-- DEV ONLY, exact-current guarded BG1-v9 source/reader/publisher candidate.
-- Execute in one transaction; installer footer COMMIT. No Owner method stage/approval.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='1s';
SET LOCAL idle_in_transaction_session_timeout='45s';
SELECT pg_advisory_xact_lock(771106,1);
DO $pre$
DECLARE n bigint;
BEGIN
 IF current_database()<>'postgres' OR current_user<>'postgres'
   OR current_setting('session_replication_role') NOT IN ('origin','local')
   OR to_regclass('official_v3_at_private.ch_source_qualifications_v4') IS NOT NULL
   OR to_regclass('official_v3_at_private.ch_visa_facts_v4') IS NOT NULL
   OR to_regclass('official_v3_guard_private.bg1_dev_at_ch_source_v9') IS NOT NULL
   OR to_regprocedure('public.jetnity_at_ch_visa_v4(text)') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_AT_V9_ALREADY_PRESENT_OR_WRONG_CONTEXT' USING ERRCODE='P7905'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 PERFORM official_v3_guard_private.require_open_v1();
 IF (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
     WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0
       AND body_digest=encode(sha256(original_body),'hex'))<>3
 OR (SELECT count(*) FROM official_v3_method_private.heads_v1
     WHERE method_id='jetnity-destination-primary-at-visa' AND revision=1 AND epoch=1 AND status='approved'
      AND method_digest='cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
      AND package_digest='55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe')<>1
 OR EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1
     WHERE method_id='jetnity-destination-primary-at-visa' AND revision=2)
 THEN RAISE EXCEPTION 'DEV_AT_V9_SOURCE_OR_METHOD_PARENT_CHANGED' USING ERRCODE='P7905'; END IF;
END $pre$;
CREATE TABLE official_v3_at_private.ch_source_qualifications_v4(
 source_id text PRIMARY KEY,source_url text NOT NULL,body_bytes integer NOT NULL,
 body_digest text NOT NULL CHECK(body_digest ~ '^[a-f0-9]{64}$'),
 original_body bytea NOT NULL,watch_state text NOT NULL,
 qualification_scope text NOT NULL CHECK(qualification_scope='CH_AT_VISA_PASSPORT_DIRECT'),
 edition text,source_review text NOT NULL
);
ALTER TABLE official_v3_at_private.ch_source_qualifications_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_private.ch_source_qualifications_v4 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_at_private.ch_source_qualifications_v4 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_at_private.ch_source_qualifications_v4
 (source_id,source_url,body_bytes,body_digest,original_body,watch_state,qualification_scope,edition,source_review)
SELECT e.source_id,e.source_url,e.expected_bytes,e.sha,convert_to(r.content,'UTF8'),
 e.watch_state,'CH_AT_VISA_PASSPORT_DIRECT',e.edition,e.source_review
FROM (VALUES
 ('bmi-visa-nationality-matrix','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',498415,'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',2296::bigint,'unchanged_exact','2026-11-06'::text,'exact_rechecked'),
 ('bmi-general-entry','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',91655,'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',2295::bigint,'unchanged_exact',NULL::text,'exact_rechecked'),
 ('bmeia-bern-how-to-apply','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',172428,'2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe',2294::bigint,'changed',NULL::text,'owner_semantic_rule_neutral_for_ch_direct_visa_only')
) e(source_id,source_url,expected_bytes,sha,request_id,watch_state,edition,source_review)
JOIN net._http_response r ON r.id=e.request_id AND r.status_code=200 AND r.timed_out=false AND r.error_msg IS NULL
JOIN official_v3_at_source_watch_private.reads_v1 w
 ON w.batch_id=129 AND w.source_id=e.source_id AND w.request_id=e.request_id
 AND w.state=e.watch_state AND w.observed_sha=e.sha AND w.observed_bytes=e.expected_bytes
WHERE encode(sha256(convert_to(r.content,'UTF8')),'hex')=e.sha
 AND octet_length(convert_to(r.content,'UTF8'))=e.expected_bytes;
DO $verify$
BEGIN
 IF (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_private.ch_source_qualifications_v4 WHERE
   encode(sha256(original_body),'hex')<>body_digest OR octet_length(original_body)<>body_bytes)
 THEN RAISE EXCEPTION 'DEV_AT_V9_SOURCE_QUALIFICATION_MISMATCH' USING ERRCODE='P7905'; END IF;
END $verify$;
CREATE TABLE official_v3_at_private.ch_visa_facts_v4 (
 fact_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_batch_id bigint NOT NULL UNIQUE CHECK(source_batch_id>0),
 source_digest text NOT NULL CHECK(source_digest ~ '^[a-f0-9]{64}$'),
 method_digest text NOT NULL CHECK(method_digest='fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'),
 package_digest text NOT NULL CHECK(package_digest='6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'),
 method_epoch integer NOT NULL CHECK(method_epoch>1),
 verified_at timestamptz NOT NULL,
 source_checked_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 visa_effect text NOT NULL CHECK(visa_effect='not_required'),
 CHECK(expires_at>verified_at AND verified_at>=source_checked_at)
);
ALTER TABLE official_v3_at_private.ch_visa_facts_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_private.ch_visa_facts_v4 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_at_private.ch_visa_facts_v4 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION official_v3_at_private.no_rewrite_v4() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
BEGIN RAISE EXCEPTION 'AT_SOURCE_V4_APPEND_ONLY_REQUIRED' USING ERRCODE='P7905'; END $fn$;
CREATE TRIGGER at_qualified_source_v4_append_only
 BEFORE UPDATE OR DELETE ON official_v3_at_private.ch_source_qualifications_v4
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_private.no_rewrite_v4();
CREATE TRIGGER at_visa_facts_v4_append_only
 BEFORE UPDATE OR DELETE ON official_v3_at_private.ch_visa_facts_v4
 FOR EACH ROW EXECUTE FUNCTION official_v3_at_private.no_rewrite_v4();
REVOKE ALL ON FUNCTION official_v3_at_private.no_rewrite_v4() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION official_v3_at_private.source_qualified_v4() RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE latest record; now_at timestamptz:=clock_timestamp();
BEGIN
 IF (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
     WHERE disposition='RESEARCH_ONLY' AND importable=false AND accepted_fact_count=0)<>3
 OR EXISTS(SELECT 1 FROM official_v3_at_private.ch_source_qualifications_v4 c
     WHERE c.qualification_scope<>'CH_AT_VISA_PASSPORT_DIRECT'
       OR (c.source_id='bmeia-bern-how-to-apply' AND
          (c.watch_state<>'changed' OR c.source_review<>'owner_semantic_rule_neutral_for_ch_direct_visa_only'))
       OR (c.source_id<>'bmeia-bern-how-to-apply' AND c.watch_state<>'unchanged_exact'))
 THEN RETURN false; END IF;
 SELECT * INTO latest FROM official_v3_at_source_watch_private.batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 IF NOT FOUND OR latest.requested_at>now_at OR latest.requested_at<=now_at-interval '70 minutes'
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 WHERE batch_id=latest.batch_id)<>3
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 r
     JOIN official_v3_at_private.ch_source_qualifications_v4 c USING(source_id)
     WHERE r.batch_id=latest.batch_id AND r.state=c.watch_state
       AND r.observed_sha=c.body_digest AND r.observed_bytes=c.body_bytes
       AND r.observed_at>=r.requested_at AND r.observed_at<=now_at
       AND r.observed_at<=r.requested_at+interval '5 minutes 10 seconds')<>3
 OR NOT EXISTS(SELECT 1 FROM official_v3_source_renewal_private.batches_v1 b
     WHERE b.destination_code='AT' AND b.source_batch_id=latest.batch_id
       AND b.source_count=3 AND b.outcome='changed')
 OR (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1 o
     JOIN official_v3_at_private.ch_source_qualifications_v4 c USING(source_id)
     WHERE o.destination_code='AT' AND o.source_batch_id=latest.batch_id
       AND o.observed_sha=c.body_digest AND o.observed_bytes=c.body_bytes
       AND ((c.watch_state='changed' AND o.result='changed') OR
            (c.watch_state='unchanged_exact' AND o.result='unchanged_exact')))<>3
 THEN RETURN false; END IF;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $fn$;
REVOKE ALL ON FUNCTION official_v3_at_private.source_qualified_v4() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION official_v3_at_private.renew_ch_visa_v4(p_batch bigint) RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE; checked timestamptz; now_at timestamptz; source_sha text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT official_v3_at_private.source_qualified_v4()
 OR p_batch IS DISTINCT FROM (SELECT max(batch_id) FROM official_v3_at_source_watch_private.batches_v1)
 THEN RETURN 0; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>2 OR h.status<>'approved'
   OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
   OR h.epoch<=1 THEN RETURN 0; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
 'jetnity-destination-primary-at-visa',2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT min(observed_at) INTO checked FROM official_v3_at_source_watch_private.reads_v1
 WHERE batch_id=p_batch;
 now_at:=clock_timestamp();
 IF checked IS NULL OR checked>now_at OR checked<=now_at-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO source_sha FROM official_v3_at_private.ch_source_qualifications_v4;
 INSERT INTO official_v3_at_private.ch_visa_facts_v4(
 source_batch_id,source_digest,method_digest,package_digest,method_epoch,verified_at,
 source_checked_at,expires_at,visa_effect)
 VALUES(p_batch,source_sha,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch,now_at,checked,
   least(checked+interval '70 minutes',now_at+interval '1 hour'),'not_required')
 ON CONFLICT(source_batch_id) DO NOTHING;
 RETURN CASE WHEN FOUND THEN 1 ELSE 0 END;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $fn$;
REVOKE ALL ON FUNCTION official_v3_at_private.renew_ch_visa_v4(bigint) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.jetnity_at_ch_visa_v4(p_citizenship_country_code text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE unavailable jsonb:=jsonb_build_object('status','unavailable','message','derzeit nicht verfügbar');
h official_v3_method_private.heads_v1%ROWTYPE; f record; links jsonb; source_sha text; now_at timestamptz:=clock_timestamp();
BEGIN
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT official_v3_at_private.source_qualified_v4() THEN RETURN unavailable; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa';
 IF NOT FOUND OR h.status<>'approved' OR h.revision<>2 OR h.epoch<=1
 OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0' THEN RETURN unavailable; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
 'jetnity-destination-primary-at-visa',2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT * INTO f FROM official_v3_at_private.ch_visa_facts_v4 ORDER BY fact_id DESC LIMIT 1;
 IF NOT FOUND OR f.method_epoch<>h.epoch OR f.verified_at>now_at OR f.source_checked_at>now_at
 OR now_at>=f.expires_at OR now_at>=f.source_checked_at+interval '70 minutes'
 OR f.source_batch_id IS DISTINCT FROM (SELECT max(batch_id) FROM official_v3_at_source_watch_private.batches_v1)
 OR f.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR f.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 OR f.visa_effect<>'not_required' THEN RETURN unavailable; END IF;
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO source_sha FROM official_v3_at_private.ch_source_qualifications_v4;
 IF f.source_digest IS DISTINCT FROM source_sha THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(source_url ORDER BY CASE source_id WHEN 'bmi-general-entry' THEN 1
 WHEN 'bmi-visa-nationality-matrix' THEN 2 ELSE 3 END)
 INTO links FROM official_v3_at_private.ch_source_qualifications_v4;
 RETURN jsonb_build_object('status','accepted','citizenshipCountryCode','CH',
 'destinationCountryCode','AT','documentType','passport','visaEffect','not_required',
 'visaMode','visa_free','ruleVersion',f.fact_id,
 'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'sourceUrls',links);
EXCEPTION WHEN OTHERS THEN RETURN unavailable;
END $fn$;
REVOKE ALL ON FUNCTION public.jetnity_at_ch_visa_v4(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.jetnity_at_ch_visa_v4(text) TO anon,authenticated;
-- Existing API/cron integration: preserve all old branches and fail-closed behavior.
CREATE OR REPLACE FUNCTION official_v3_source_renewal_private.renew_approved_batch_v1(p_destination_code text, p_source_batch_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE b record; s record; preceding record; initial record;
 method official_v3_method_private.heads_v1%ROWTYPE; stamp timestamptz;
 newest timestamptz; signed_sources text; inserted integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
  OR p_destination_code !~ '^[A-Z]{2}$' OR p_source_batch_id IS NULL
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 IF p_destination_code='AT' THEN RETURN official_v3_at_private.renew_ch_visa_v4(p_source_batch_id); END IF;
 SELECT * INTO b FROM official_v3_source_renewal_private.batches_v1
  WHERE destination_code=p_destination_code AND source_batch_id=p_source_batch_id FOR SHARE;
 stamp:=clock_timestamp();
 IF NOT FOUND OR b.outcome<>'unchanged' OR b.source_count<1
  OR b.requested_at>stamp OR b.requested_at<=stamp-interval '70 minutes'
  OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1 WHERE destination_code=p_destination_code)<>b.source_count
  OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1
      WHERE destination_code=p_destination_code AND role='destination_primary')<>1
  OR (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1
      WHERE destination_code=p_destination_code AND source_batch_id=p_source_batch_id
       AND result IN ('unchanged_exact','unchanged_asset_version_only'))<>b.source_count
 THEN RETURN 0; END IF;
 -- Separately verified legal source-to-rule constraint. Bytes/monitoring are
 -- NOT an approval. The three archived originals are currently RESEARCH_ONLY:
 -- no new live visa fact is permitted even after BG1 recovers.
 IF p_destination_code='AT' AND (
   (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1
     WHERE destination_code='AT') IS DISTINCT FROM
     (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)
   OR EXISTS (
     SELECT 1 FROM official_v3_source_renewal_private.sources_v1 pinned
     LEFT JOIN official_v3_at_private.whole_originals_v2 orig USING(source_id)
     WHERE pinned.destination_code='AT' AND (
       orig.source_id IS NULL OR orig.disposition='RESEARCH_ONLY'
       OR NOT orig.importable OR orig.accepted_fact_count<=0
       OR orig.body_digest IS DISTINCT FROM pinned.raw_sha
       OR orig.body_digest IS DISTINCT FROM encode(sha256(orig.original_body),'hex')
     )
   )
 ) THEN RETURN 0; END IF;
 -- Independently check recorded pinned source identity, one-by-one; BMEIA
 -- theme asset canonicalization is restricted to its already reviewed URL.
 IF EXISTS(
  SELECT 1 FROM official_v3_source_renewal_private.observations_v1 o
  JOIN official_v3_source_renewal_private.sources_v1 p
   USING(destination_code,source_id)
  WHERE o.destination_code=p_destination_code AND o.source_batch_id=p_source_batch_id
   AND (o.observed_at IS NULL OR o.observed_at>stamp OR o.observed_at<o.requested_at
    OR o.observed_at>o.requested_at+interval '5 minutes 10 seconds'
    OR (o.result='unchanged_exact' AND
      (o.observed_sha IS DISTINCT FROM p.raw_sha OR o.observed_bytes IS DISTINCT FROM p.original_bytes))
    OR (o.result='unchanged_asset_version_only' AND
      (p.destination_code<>'AT' OR p.source_id<>'bmeia-bern-how-to-apply'
       OR p.normalization<>'bmeia-theme-assets-v1'
       OR p.canonical_sha IS DISTINCT FROM 'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
       OR o.observed_bytes IS DISTINCT FROM p.original_bytes))))
 THEN RETURN 0; END IF;
 SELECT min(observed_at) INTO newest
 FROM official_v3_source_renewal_private.observations_v1
 WHERE destination_code=p_destination_code AND source_batch_id=p_source_batch_id;
 IF newest IS NULL OR newest<=stamp-interval '70 minutes' OR newest>stamp
 THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(
  string_agg(source_id||':'||reference_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM official_v3_source_renewal_private.observations_v1
 WHERE destination_code=p_destination_code AND source_batch_id=p_source_batch_id;
 IF signed_sources IS NULL THEN RETURN 0; END IF;
 FOR s IN SELECT * FROM official_v3_source_renewal_private.subjects_v1
    WHERE destination_code=p_destination_code ORDER BY subject_id LOOP
  IF s.source_count<>b.source_count OR (s.legal_valid_until IS NOT NULL AND s.legal_valid_until<=stamp)
   OR s.method_active_until<=stamp
   OR s.first_approved_at>stamp OR s.method_epoch<1
   OR NOT EXISTS(SELECT 1 FROM official_v3_source_renewal_private.passport_priority_v1
       WHERE code=s.citizenship_code)
  THEN CONTINUE; END IF;
  SELECT * INTO method FROM official_v3_method_private.heads_v1
   WHERE method_id=s.method_id FOR SHARE;
  IF NOT FOUND OR method.revision<>s.method_revision OR method.epoch<>s.method_epoch
   OR method.method_digest<>s.method_digest OR method.package_digest<>s.package_digest
  THEN CONTINUE; END IF;
  PERFORM official_v3_method_private.require_current_locked_v1(
    s.method_id,s.method_revision,s.method_digest,s.package_digest,s.method_epoch);
  SELECT * INTO preceding FROM official_v3_source_renewal_private.facts_v1
    WHERE subject_id=s.subject_id ORDER BY fact_id DESC LIMIT 1 FOR SHARE;
  IF FOUND AND (preceding.verified_at>=newest OR preceding.source_batch_id=p_source_batch_id)
  THEN CONTINUE; END IF;
  IF NOT FOUND THEN
   -- The first approved pilot is CH/AT from the existing real Owner method.
   -- Further passports require their own genuine initial MA1/I1/HRS receipt,
   -- NOT an inferred visa exemption from a BMI matrix or RESEARCH_ONLY row.
   IF s.destination_code<>'AT' OR s.citizenship_code<>'CH' OR
     s.requirement_type<>'visa' OR s.approved_origin !~ '^verified_visas_v3:CH:[0-9]+$'
   THEN CONTINUE; END IF;
   SELECT * INTO initial FROM official_v3_at_private.verified_visas_v3 v
    WHERE 'verified_visas_v3:CH:'||v.rule_version=s.approved_origin;
   IF NOT FOUND OR initial.method_epoch<>s.method_epoch
    OR initial.method_digest<>s.method_digest OR initial.package_digest<>s.package_digest
    OR initial.visa_effect<>'not_required' OR initial.visa_mode<>'visa_exempt'
    OR initial.verified_at>=newest OR initial.expires_at<=initial.verified_at
    OR initial.chain_digest IS DISTINCT FROM (
      SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
      FROM official_v3_at_private.whole_originals_v2)
   THEN CONTINUE; END IF;
  END IF;
  stamp:=clock_timestamp();
  IF stamp>=newest+interval '70 minutes'
   OR (s.legal_valid_until IS NOT NULL AND stamp>=s.legal_valid_until)
   OR stamp>=s.method_active_until
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  THEN RETURN inserted; END IF;
  INSERT INTO official_v3_source_renewal_private.facts_v1(
   subject_id,destination_code,source_batch_id,predecessor_fact_id,
   verified_at,source_checked_at,expires_at,method_epoch,approval_origin,source_digest)
  VALUES(s.subject_id,p_destination_code,p_source_batch_id,preceding.fact_id,
   stamp,newest,least(stamp+interval '1 hour',coalesce(s.legal_valid_until,'infinity'::timestamptz),
   s.method_active_until,newest+interval '24 hours'),s.method_epoch,s.approved_origin,signed_sources)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN inserted:=inserted+1; END IF;
 END LOOP;
 RETURN inserted;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $function$;

CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE subject record; fact record; b record; h official_v3_method_private.heads_v1%ROWTYPE;
 latest_source record; instant timestamptz; source_links jsonb;
 unavailable jsonb:=jsonb_build_object('status','unavailable','message','derzeit nicht verfügbar');
BEGIN
 IF p_citizenship_country_code='CH' THEN
   DECLARE newer jsonb;
   BEGIN
     newer:=public.jetnity_at_ch_visa_v4(p_citizenship_country_code);
     IF newer->>'status'='accepted' THEN RETURN newer; END IF;
   EXCEPTION WHEN OTHERS THEN NULL;
   END;
 END IF;
 IF p_citizenship_country_code<>'CH'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  -- A public PostgREST session is authenticator/anon, NOT a postgres
  -- session. The private status_v1 intentionally refuses such sessions;
  -- this SECURITY DEFINER reader instead checks the identical private
  -- immutable source/watch conditions directly, with no extra role grants.
  OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname IN ('jetnity-at-source-enqueue-dev-v1',
                     'jetnity-at-source-collect-dev-v1'))<>2
  OR NOT EXISTS(
    SELECT 1 FROM official_v3_at_source_watch_private.batches_v1 w
    WHERE w.batch_id=(SELECT max(batch_id) FROM official_v3_at_source_watch_private.batches_v1)
      AND w.requested_at<=clock_timestamp()
      AND w.requested_at>clock_timestamp()-interval '70 minutes'
      AND (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 r
           WHERE r.batch_id=w.batch_id) = 3
      AND (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1 r
           WHERE r.batch_id=w.batch_id AND r.state IN
            ('unchanged_exact','unchanged_asset_version_only')
             AND r.observed_at>=r.requested_at AND r.observed_at<=clock_timestamp()
             AND r.observed_at<=r.requested_at+interval '5 minutes 10 seconds')=3
  )
 THEN RETURN unavailable; END IF;
 SELECT * INTO latest_source FROM official_v3_at_source_watch_private.batches_v1
  ORDER BY batch_id DESC LIMIT 1;
 SELECT * INTO b FROM official_v3_source_renewal_private.batches_v1
   WHERE destination_code='AT' AND source_batch_id=latest_source.batch_id;
 IF NOT FOUND OR b.outcome<>'unchanged' OR b.source_count<>3
   OR (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1 r
      WHERE r.destination_code='AT' AND r.source_batch_id=b.source_batch_id
       AND r.result IN ('unchanged_exact','unchanged_asset_version_only'))<>3
 THEN RETURN unavailable; END IF;
 SELECT * INTO subject FROM official_v3_source_renewal_private.subjects_v1
   WHERE destination_code='AT' AND citizenship_code=p_citizenship_country_code
    AND requirement_type='visa' AND document_type='passport' AND route_type='direct_entry';
 IF NOT FOUND THEN RETURN unavailable; END IF;
 SELECT * INTO fact FROM official_v3_source_renewal_private.facts_v1
   WHERE subject_id=subject.subject_id ORDER BY fact_id DESC LIMIT 1;
 instant:=clock_timestamp();
 IF NOT FOUND OR fact.destination_code<>'AT' OR fact.source_batch_id<>b.source_batch_id
  OR fact.method_epoch<>subject.method_epoch
  OR fact.verified_at>instant OR fact.source_checked_at>instant
  OR instant>=fact.expires_at OR instant>=fact.source_checked_at+interval '70 minutes'
  OR (subject.legal_valid_until IS NOT NULL AND instant>=subject.legal_valid_until)
  OR instant>=subject.method_active_until
  OR fact.source_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(
    string_agg(source_id||':'||reference_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM official_v3_source_renewal_private.observations_v1
    WHERE destination_code='AT' AND source_batch_id=b.source_batch_id)
 THEN RETURN unavailable; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
   WHERE method_id=subject.method_id FOR SHARE;
 IF NOT FOUND OR h.epoch<>subject.method_epoch THEN RETURN unavailable; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
   subject.method_id,subject.method_revision,subject.method_digest,subject.package_digest,h.epoch);
 -- Full catalog proof stays on the 5-minute BG1 worker and source/fact writes;
 -- public read checks only the fresh sealed BG1 status + short immutable lease.
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
   WHEN 'bmi-general-entry' THEN 1
   WHEN 'bmi-visa-nationality-matrix' THEN 2
   WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM official_v3_source_renewal_private.sources_v1
 WHERE destination_code='AT';
 IF jsonb_array_length(source_links)<>3 THEN RETURN unavailable; END IF;
 RETURN jsonb_build_object('status','accepted','citizenshipCountryCode',p_citizenship_country_code,
  'destinationCountryCode','AT','documentType','passport','visaEffect',subject.result,
  'visaMode',subject.visa_mode,'ruleVersion',fact.fact_id,
  'sourceCheckedAt',to_char(fact.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'verifiedAt',to_char(fact.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'expiresAt',to_char(fact.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'sourceUrls',source_links);
EXCEPTION WHEN OTHERS THEN RETURN unavailable;
END $function$;

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
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','official_v3_at_private','official_v3_at_source_watch_private','official_v3_source_renewal_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','jetnity_at_visa_v3','jetnity_source_bound_at_visa_v1','jetnity_at_ch_visa_v4','jetnity_bg1_alarm_kind_v2'))
), tables AS (
  SELECT c.oid,c.reltoastrelid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p') AND (c.relnamespace IN (SELECT oid FROM namespaces)
    OR n.nspname='public' AND c.relname='profiles' OR n.nspname='auth' AND c.relname IN ('users','sessions'))
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
    FROM pg_depend d WHERE (d.classid,d.objid) IN (SELECT classid,objid FROM objects)
      OR (d.refclassid,d.refobjid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'shared:'||d.dbid||':'||d.classid||':'||d.objid||':'||d.objsubid||':'||d.refclassid||':'||d.refobjid||':'||d.deptype::text,to_jsonb(d)
    FROM pg_shdepend d WHERE (d.dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
      AND (d.classid,d.objid) IN (SELECT classid,objid FROM objects))
      OR (d.refclassid='pg_authid'::regclass AND d.refobjid IN (SELECT oid FROM protected_roles WHERE oid<>'postgres'::regrole))
  UNION ALL SELECT 'description:'||d.classoid||':'||d.objoid||':'||d.objsubid,to_jsonb(d)
    FROM pg_description d WHERE (d.classoid,d.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'label:'||s.classoid||':'||s.objoid||':'||s.objsubid||':'||s.provider,to_jsonb(s)
    FROM pg_seclabel s WHERE (s.classoid,s.objoid) IN (SELECT classid,objid FROM objects)
  UNION ALL SELECT 'transport:dev_http_id_allocator_v8',jsonb_build_object('native',jsonb_build_object(
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
 'queue_triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.oid),'[]'::pg_catalog.jsonb)
   FROM pg_trigger t WHERE t.tgrelid=to_regclass('net.http_request_queue')),
 'managed_sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('net.http_request_queue_id_seq')),
 'managed_sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('net.http_request_queue_id_seq')),
 'net_functions',(SELECT coalesce(jsonb_agg((to_jsonb(p)-ARRAY['prosrc','probin','prosqlbody'])
   ||jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) ORDER BY p.oid),'[]'::pg_catalog.jsonb)
   FROM pg_proc p WHERE p.pronamespace=to_regnamespace('net') AND p.prokind IN('f','p'))
), 'allocator',jsonb_build_object(
 'namespace',(SELECT to_jsonb(n) FROM pg_namespace n WHERE n.oid=to_regnamespace('jetnity_pgnet_allocator_private')),
 'sequence_relation',(SELECT to_jsonb(c)-ARRAY['relpages','reltuples','relallvisible','relfrozenxid','relminmxid']
   FROM pg_class c WHERE c.oid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
 'sequence_parameters',(SELECT to_jsonb(s) FROM pg_sequence s
   WHERE s.seqrelid=to_regclass('jetnity_pgnet_allocator_private.http_request_id_v1')),
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
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$function$;

CREATE TABLE official_v3_guard_private.bg1_dev_at_ch_source_v9(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 sources_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_dev_at_ch_source_v9 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_at_ch_source_v9 FORCE ROW LEVEL SECURITY;
REVOKE ALL ON official_v3_guard_private.bg1_dev_at_ch_source_v9 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_dev_at_ch_source_v9(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 sources_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 (SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest||':'||
   encode(sha256(original_body),'hex')||':'||body_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_private.ch_source_qualifications_v4),
 s.generation+1,clock_timestamp(),'{}'::jsonb
FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v
CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_source_v9 official_v3_guard_private.bg1_dev_at_ch_source_v9%ROWTYPE;
 transport_v8 official_v3_guard_private.bg1_dev_http_id_allocator_v8%ROWTYPE;
 restore_v7 official_v3_guard_private.bg1_dev_grantor_restore_v7%ROWTYPE;
 cycle5_v6 official_v3_guard_private.bg1_dev_cycle5_baseline_v6%ROWTYPE;
 maintenance_v5 official_v3_guard_private.bg1_dev_maintenance_baseline_v5%ROWTYPE;
 acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
 bg1_v3 official_v3_guard_private.bg1_transient_baseline_v3%ROWTYPE;
 renewal official_v3_guard_private.source_renewal_baseline_v1%ROWTYPE;
  at_baseline official_v3_guard_private.at_hrs2_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  successor official_v3_guard_private.recovery_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE; old_baselines jsonb;
  gap_baseline official_v3_guard_private.gap_recovery_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE;
  customer official_v3_guard_private.customer_information_baseline_v1%ROWTYPE;
  refresh official_v3_guard_private.refresh_retirement_baseline_v1%ROWTYPE;
  cycle4 official_v3_guard_private.cycle4_recovery_baseline_v1%ROWTYPE;
  attempt2 official_v3_guard_private.cycle4_attempt2_baseline_v1%ROWTYPE;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT at_source_v9 FROM official_v3_guard_private.bg1_dev_at_ch_source_v9 WHERE singleton;
  SELECT * INTO STRICT transport_v8 FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 WHERE singleton;
  SELECT * INTO STRICT restore_v7 FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 WHERE singleton;
  SELECT * INTO STRICT cycle5_v6 FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 WHERE singleton;
  SELECT * INTO STRICT maintenance_v5 FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton;
  SELECT * INTO STRICT acl_v4 FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 SELECT * INTO STRICT renewal FROM official_v3_guard_private.source_renewal_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_baseline FROM official_v3_guard_private.at_hrs2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT attempt2 FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT cycle4 FROM official_v3_guard_private.cycle4_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT refresh FROM official_v3_guard_private.refresh_retirement_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT customer FROM official_v3_guard_private.customer_information_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT gap_baseline FROM official_v3_guard_private.gap_recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT successor FROM official_v3_guard_private.recovery_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM official_v3_guard_private.status_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM official_v3_guard_private.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950'
    OR successor.bg1_provider_digest<>'a3a0be9c4eb1e2c61be428d0b825ee8a3b6780f3f8d154c0ccc2b1317181f950' OR successor.status_provider_digest<>'71e2f9f080b8af0b7100d49b70520f8c34dffdc1bc84f3912b20aff413adf97c'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM official_v3_guard_private.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR successor.predecessor_baselines_digest IS DISTINCT FROM predecessor.predecessor_baselines_digest
    OR successor.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR successor.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR gap_baseline.recovery2_provider_digest<>'b7cc8c0d061bef261a0d9ab3824672b7759502ab0d26c68139e5cfcf6525eaf7'
    OR gap_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(successor.catalog::text,'UTF8')),'hex')
    OR gap_baseline.predecessor_recovery_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(successor)||jsonb_build_object('proof_not_before',extract(epoch FROM successor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(gap_baseline.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_gap_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(gap_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM gap_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at)) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR customer.predecessor_provider_digest<>'7324c5e87d18de2a692e7e61123a44565ca440ecc9f8e9afddf379ede2aac32a'
    OR customer.definitions_digest<>'6c5d64c50389caf424d99b204e7f0f08ba64c0f669e7b9e3f8cccead2deb992f'
    OR customer.history_definition_digest<>'061e62165021fe13959b72bfb3135114d5c77b5119f32eb7233e1290d586d692'
    OR customer.history_guard_definition_digest<>'f4a6ee4ade45524bd8ce12e389b9958568c6e2bcda1c103d22233e1e3d32987b'
    OR customer.atomic_claim_definition_digest<>'75f43cdf119fe9bd862dd5bdcbbd6d53da974b09a6162ad999f23ab62fd3af8a'
    OR customer.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(rolling.catalog::text,'UTF8')),'hex')
    OR customer.predecessor_rolling_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(rolling)||jsonb_build_object('proof_not_before',extract(epoch FROM rolling.proof_not_before)))::text,'UTF8')),'hex')
    OR refresh.predecessor_provider_digest<>'cd886ead66b92ec48ee9c5c5a214f310bc6e6645e1fc15f88a78650fcb95b37f'
    OR refresh.original_evidence_digest<>'be111b7f3b024a7b967e80ceeb9b844ea5a63d67042218f4cc10e23329de7ea0'
    OR refresh.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(customer.catalog::text,'UTF8')),'hex')
    OR refresh.predecessor_customer_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(customer)||jsonb_build_object('proof_not_before',extract(epoch FROM customer.proof_not_before)))::text,'UTF8')),'hex')
    OR cycle4.predecessor_provider_digest<>'e71c729360c0e36e7d3a00504b8f013d716ef33c76ae35c9e8fbb484d01c67fe'
    OR cycle4.original_evidence_digest<>'5829475017f545d3ba1573de7d94593754bfc280262b9c7dd44a04d66cad3f14'
    OR cycle4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(refresh.catalog::text,'UTF8')),'hex')
    OR cycle4.predecessor_refresh_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(refresh)||jsonb_build_object('proof_not_before',extract(epoch FROM refresh.proof_not_before)))::text,'UTF8')),'hex')
    OR attempt2.predecessor_provider_digest<>'e12dc341cc01de2a459826e8b1c6a3a9b4dd48b40dd8cd1c765660007b7694f3'
    OR attempt2.original_evidence_digest<>'7debd26332c22a3b675280fb5401fd3116f80c0ba9b633c76a4883ab4a48d113'
    OR attempt2.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle4.catalog::text,'UTF8')),'hex')
    OR attempt2.predecessor_cycle4_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle4)||jsonb_build_object('proof_not_before',extract(epoch FROM cycle4.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.predecessor_provider_digest<>'9da5d3dee7a4c3a45fea976b27fc2996e5b5d912741407c6be9954baefa1e106'
    OR admin.definition_digest<>'872bec621ba99e88c62b61cc2c5ab54725593bf424f18dae2c5442897d7f228b'
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex')
    OR at_baseline.predecessor_admin_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex')
    OR at_baseline.source_chain IS DISTINCT FROM (SELECT encode(sha256(convert_to(string_agg(source_id||':'||encode(sha256(original_body),'hex'),'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex') FROM official_v3_at_private.whole_originals_v2)
    OR renewal.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(at_baseline.catalog::text,'UTF8')),'hex')
    OR renewal.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(at_baseline)||jsonb_build_object('proof_not_before',extract(epoch FROM at_baseline.proof_not_before)))::text,'UTF8')),'hex')
    OR bg1_v3.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(renewal.catalog::text,'UTF8')),'hex')
 OR bg1_v3.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(renewal)||jsonb_build_object('proof_not_before',extract(epoch FROM renewal.proof_not_before)))::text,'UTF8')),'hex')
 OR bg1_v3.required_generation<=renewal.required_generation
 OR bg1_v3.proof_not_before<=renewal.proof_not_before
 OR acl_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex')
 OR acl_v4.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(bg1_v3)||jsonb_build_object('proof_not_before',extract(epoch FROM bg1_v3.proof_not_before)))::text,'UTF8')),'hex')
 OR acl_v4.approved_dependency_key IS DISTINCT FROM 'shared:5:1255:91879:0:1260:16485:a'
 OR NOT (acl_v4.catalog ? 'shared:5:1255:91879:0:1260:16485:a') OR (bg1_v3.catalog ? 'shared:5:1255:91879:0:1260:16485:a')
 OR acl_v4.weather_function_digest IS DISTINCT FROM
   encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex')
 OR acl_v4.weather_function_digest<>'9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
 OR acl_v4.weather_acl_text IS DISTINCT FROM
   (SELECT proacl::text FROM pg_proc WHERE oid='public.reisewetter_reservieren_v1()'::regprocedure)
 OR acl_v4.weather_acl_text<>'{postgres=X/postgres,authenticated=X/postgres}'
 OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
 OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
 OR acl_v4.required_generation<=bg1_v3.required_generation
 OR acl_v4.proof_not_before<=bg1_v3.proof_not_before
 OR maintenance_v5.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(acl_v4.catalog::text,'UTF8')),'hex')
 OR maintenance_v5.predecessor_baseline_digest IS DISTINCT FROM
   encode(sha256(convert_to((to_jsonb(acl_v4)||jsonb_build_object('proof_not_before',extract(epoch FROM acl_v4.proof_not_before)))::text,'UTF8')),'hex')
 OR maintenance_v5.required_generation<=acl_v4.required_generation
 OR maintenance_v5.proof_not_before<=acl_v4.proof_not_before
 OR cycle5_v6.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(maintenance_v5.catalog::text,'UTF8')),'hex')
 OR cycle5_v6.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(maintenance_v5)||jsonb_build_object('proof_not_before',extract(epoch FROM maintenance_v5.proof_not_before)))::text,'UTF8')),'hex')
 OR cycle5_v6.attempt_key<>'execution-attempt:v3:c932f0e7f8a196714a21d8785185efdd0a43b7d81021b5b7bf5200e19f65d153' OR cycle5_v6.prior_retirement_count<>6
 OR cycle5_v6.required_generation<=maintenance_v5.required_generation
 OR cycle5_v6.proof_not_before<=maintenance_v5.proof_not_before
 OR maintenance_v5.catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 WHERE singleton)

 OR restore_v7.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(cycle5_v6.catalog::text,'UTF8')),'hex')
 OR restore_v7.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(cycle5_v6)||
  jsonb_build_object('proof_not_before',extract(epoch FROM cycle5_v6.proof_not_before)))::text,'UTF8')),'hex')
 OR restore_v7.removed_duplicate_membership_key IS DISTINCT FROM 'membership:92604'
 OR NOT (cycle5_v6.catalog ? 'membership:92604') OR restore_v7.catalog ? 'membership:92604'
 OR (SELECT count(*) FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole
    AND grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
 OR restore_v7.required_generation<=cycle5_v6.required_generation
 OR restore_v7.proof_not_before<=cycle5_v6.proof_not_before
 OR transport_v8.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(restore_v7.catalog::text,'UTF8')),'hex')
 OR transport_v8.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(restore_v7)||
   jsonb_build_object('proof_not_before',extract(epoch FROM restore_v7.proof_not_before)))::text,'UTF8')),'hex')
 OR transport_v8.required_generation<=restore_v7.required_generation
 OR transport_v8.proof_not_before<=restore_v7.proof_not_before
 OR transport_v8.transport_metadata_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.transport_metadata::text,'UTF8')),'hex')
 OR transport_v8.transport_metadata IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()->'transport:dev_http_id_allocator_v8'
 OR at_source_v9.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(transport_v8.catalog::text,'UTF8')),'hex')
 OR at_source_v9.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(transport_v8)||
   jsonb_build_object('proof_not_before',extract(epoch FROM transport_v8.proof_not_before)))::text,'UTF8')),'hex')
 OR at_source_v9.required_generation<=transport_v8.required_generation
 OR at_source_v9.proof_not_before<=transport_v8.proof_not_before
 OR (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR at_source_v9.sources_digest IS DISTINCT FROM (
   SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_digest||':'||
     encode(sha256(original_body),'hex')||':'||body_bytes::text,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
   FROM official_v3_at_private.ch_source_qualifications_v4)
 OR at_source_v9.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

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
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_maintenance_baseline_v5 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_cycle5_baseline_v6 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_grantor_restore_v7 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
   INTO STRICT required_proof,earliest_proof
  FROM official_v3_guard_private.bg1_dev_http_id_allocator_v8 v WHERE singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM official_v3_guard_private.bg1_dev_at_ch_source_v9 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

UPDATE official_v3_guard_private.bg1_dev_at_ch_source_v9
 SET catalog=official_v3_guard_private.catalog_status_v1() WHERE singleton;
SELECT official_v3_guard_private.assert_catalog_v1();
DO $check$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.bg1_dev_at_ch_source_v9)<>1
 OR (SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4)<>3
 OR (SELECT count(*) FROM official_v3_at_private.ch_visa_facts_v4)<>0
 OR (SELECT count(*) FROM official_v3_method_private.revisions_v1
     WHERE method_id='jetnity-destination-primary-at-visa' AND revision=2)<>0
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
     WHERE disposition='RESEARCH_ONLY' AND NOT importable AND accepted_fact_count=0)<>3
 OR public.jetnity_at_ch_visa_v4('CH')->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('CH')->>'status'<>'unavailable'
 OR public.jetnity_at_ch_visa_v4('IN')->>'status'<>'unavailable'
 OR official_v3_at_private.renew_ch_visa_v4(129)<>0
 THEN RAISE EXCEPTION 'DEV_AT_V9_PRE_OWNER_NEGATIVE_GATE_FAILED' USING ERRCODE='P7905'; END IF;
END $check$;
SELECT jsonb_build_object('verdict','DEV_AT_CH_SOURCE_METHOD_BG1_PUBLISHER_VISITOR_V9_PRECOMMIT_PASS',
 'qualified_sources',(SELECT count(*) FROM official_v3_at_private.ch_source_qualifications_v4),
 'new_facts',(SELECT count(*) FROM official_v3_at_private.ch_visa_facts_v4),
 'method_revision2_staged',false,'method_revision2_approved',false,
 'new_bg1_baseline_present',true,'bg1_after_install_requires_new_natural_proof',true,
 'publisher_renew_without_owner_result',0,
 'visitor_ch',public.jetnity_source_bound_at_visa_v1('CH')->>'status',
 'visitor_in',public.jetnity_at_ch_visa_v4('IN')->>'status',
 'protected_catalog_valid',true,'old_originals_preserved',true,
 'transaction_end','COMMIT_EXPECTED_VERIFY_SEPARATELY') AS result;
COMMIT;
