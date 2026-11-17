-- DEV ONLY. Shared source-bound factual refresh infrastructure, initially armed for
-- the ONE existing truly approved CH/AT visa fact. The other 49 AT passports
-- and other destinations stay unapproved/unavailable until individually
-- qualified primary evidence and real MA1 Owner/AAL2 authorization.
-- Source observations, decisions, and facts are append-only; no research
-- data is promoted. CH->DE, original HRS1, existing BG1 and auth untouched.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.renewal_target='dev:yfvbxvijcorffwxbxahl:SOURCE-RENEWAL-1';

DO $before$
DECLARE h official_v3_method_private.heads_v1%ROWTYPE;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.renewal_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:SOURCE-RENEWAL-1'
 OR to_regnamespace('official_v3_source_renewal_private') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT official_v3_at_private.source_current_v3()
 OR official_v3_at_source_watch_private.status_v1()->>'status'<>'PINNED_UNCHANGED_NOT_APPROVED'
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_private.verified_visas_v3 WHERE citizenship_country_code='CH'
    AND visa_effect='not_required' AND visa_mode='visa_exempt')<1
 OR NOT pg_try_advisory_xact_lock(771108,44)
 THEN RAISE EXCEPTION 'SOURCE_RENEWAL_EXACT_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7991'; END IF;
 SELECT * INTO STRICT h FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $before$;
CREATE TEMP TABLE renewal_previous_catalog(catalog jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO renewal_previous_catalog SELECT official_v3_guard_private.catalog_status_v1();

CREATE SCHEMA official_v3_source_renewal_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_source_renewal_private FROM PUBLIC,anon,authenticated,service_role;

-- Exact rank for the existing user-supplied 50 passports. Cannot silently use
-- array-position defaults or expand Kosovo/territories without a code review.
CREATE TABLE official_v3_source_renewal_private.passport_priority_v1(
 rank integer PRIMARY KEY CHECK(rank BETWEEN 1 AND 50),
 code text UNIQUE NOT NULL CHECK(code ~ '^[A-Z]{2}$'));
INSERT INTO official_v3_source_renewal_private.passport_priority_v1(rank,code)
 SELECT ordinal::integer, code FROM unnest(string_to_array(
 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL',' ')
 ) WITH ORDINALITY AS c(code,ordinal);
-- Source policy is an immutable code-owned authority registry, not an imported
-- research URL; other destinations require their own separate reviewed pins.
CREATE TABLE official_v3_source_renewal_private.sources_v1(
 destination_code text NOT NULL CHECK(destination_code ~ '^[A-Z]{2}$'),
 source_id text NOT NULL,
 role text NOT NULL CHECK(role IN ('destination_primary','supporting_official','independent_official')),
 authority_country_code text NOT NULL CHECK(authority_country_code ~ '^[A-Z]{2}$'),
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 raw_sha text NOT NULL CHECK(raw_sha ~ '^[a-f0-9]{64}$'),
 original_bytes integer NOT NULL CHECK(original_bytes BETWEEN 1 AND 1048576),
 canonical_sha text CHECK(canonical_sha IS NULL OR canonical_sha ~ '^[a-f0-9]{64}$'),
 normalization text NOT NULL CHECK(normalization IN ('none','bmeia-theme-assets-v1')),
 PRIMARY KEY(destination_code,source_id),
 UNIQUE(destination_code,official_url),
 CHECK((role<>'destination_primary') OR (destination_code=authority_country_code)),
 CHECK(normalization='none' OR
  (destination_code='AT' AND source_id='bmeia-bern-how-to-apply' AND normalization='bmeia-theme-assets-v1'))
);
INSERT INTO official_v3_source_renewal_private.sources_v1
 (destination_code,source_id,role,authority_country_code,official_url,raw_sha,original_bytes,canonical_sha,normalization)
SELECT 'AT',p.source_id,
 CASE WHEN p.source_id='bmi-visa-nationality-matrix' THEN 'destination_primary'
  WHEN p.source_id='bmeia-bern-how-to-apply' THEN 'independent_official'
  ELSE 'supporting_official' END,
 'AT',p.url,p.raw_sha,p.expected_bytes,p.canonical_sha,
 CASE WHEN p.source_id='bmeia-bern-how-to-apply' THEN 'bmeia-theme-assets-v1' ELSE 'none' END
FROM official_v3_at_source_watch_private.pins_v1 p
ORDER BY p.source_id;

CREATE TABLE official_v3_source_renewal_private.subjects_v1(
 subject_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 destination_code text NOT NULL CHECK(destination_code ~ '^[A-Z]{2}$'),
 citizenship_code text NOT NULL REFERENCES official_v3_source_renewal_private.passport_priority_v1(code),
 requirement_type text NOT NULL,
 document_type text NOT NULL,
 route_type text NOT NULL,
 conditions_digest text NOT NULL CHECK(conditions_digest ~ '^[a-f0-9]{64}$'),
 result text NOT NULL CHECK(result='not_required'), -- first approved slice only
 visa_mode text NOT NULL CHECK(visa_mode='visa_exempt'),
 method_id text NOT NULL, method_revision integer NOT NULL CHECK(method_revision>0),
 method_digest text NOT NULL CHECK(method_digest ~ '^[a-f0-9]{64}$'),
 package_digest text NOT NULL CHECK(package_digest ~ '^[a-f0-9]{64}$'),
 method_epoch integer NOT NULL CHECK(method_epoch>0),
 legal_valid_until timestamptz NOT NULL,
 approved_origin text NOT NULL, first_approved_at timestamptz NOT NULL,
 source_count integer NOT NULL CHECK(source_count BETWEEN 1 AND 8),
 UNIQUE(destination_code,citizenship_code,requirement_type,document_type,route_type,conditions_digest),
 CHECK(requirement_type='visa' AND document_type='passport' AND route_type='direct_entry')
);
-- One genuinely approved prior rule; never mint approval for the other 49.
INSERT INTO official_v3_source_renewal_private.subjects_v1(
 destination_code,citizenship_code,requirement_type,document_type,route_type,conditions_digest,
 result,visa_mode,method_id,method_revision,method_digest,package_digest,method_epoch,
 legal_valid_until,approved_origin,first_approved_at,source_count)
SELECT 'AT','CH','visa','passport','direct_entry',
 encode(sha256(convert_to('AT|CH|visa|passport|direct_entry|valid_swiss_national_passport|BMI_2026_11_06|BMEIA_BERN','UTF8')),'hex'),
 'not_required','visa_exempt',v.method_id,v.method_revision,v.method_digest,v.package_digest,v.method_epoch,
 '2027-11-16T00:00:00Z'::timestamptz,'verified_visas_v3:CH:'||v.rule_version,v.verified_at,3
FROM official_v3_at_private.verified_visas_v3 v
WHERE v.citizenship_country_code='CH'
 AND v.method_id='jetnity-destination-primary-at-visa'
 AND v.rule_version=(SELECT max(rule_version) FROM official_v3_at_private.verified_visas_v3)
 AND v.method_digest='cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 AND v.package_digest='55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 AND v.verified_at<v.expires_at;

-- Append-only independent publication input/history, no mutable upsert.
CREATE TABLE official_v3_source_renewal_private.batches_v1(
 destination_code text NOT NULL,
 source_batch_id bigint NOT NULL,
 requested_at timestamptz NOT NULL,
 sealed_at timestamptz NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('unchanged','changed','unavailable')),
 source_count integer NOT NULL CHECK(source_count BETWEEN 1 AND 8),
 PRIMARY KEY(destination_code,source_batch_id)
);
CREATE TABLE official_v3_source_renewal_private.observations_v1(
 destination_code text NOT NULL,
 source_batch_id bigint NOT NULL,
 source_id text NOT NULL,
 request_id bigint NOT NULL,
 requested_at timestamptz NOT NULL,
 observed_at timestamptz NOT NULL,
 result text NOT NULL CHECK(result IN ('unchanged_exact','unchanged_asset_version_only','changed','unavailable')),
 observed_bytes integer,
 observed_sha text CHECK(observed_sha IS NULL OR observed_sha ~ '^[a-f0-9]{64}$'),
 reference_digest text NOT NULL CHECK(reference_digest ~ '^[a-f0-9]{64}$'),
 PRIMARY KEY(destination_code,source_batch_id,source_id),
 FOREIGN KEY(destination_code,source_batch_id)
  REFERENCES official_v3_source_renewal_private.batches_v1(destination_code,source_batch_id),
 FOREIGN KEY(destination_code,source_id)
  REFERENCES official_v3_source_renewal_private.sources_v1(destination_code,source_id)
);
-- One new factual lease per new complete source batch, never an UPDATE.
CREATE TABLE official_v3_source_renewal_private.facts_v1(
 fact_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 subject_id bigint NOT NULL REFERENCES official_v3_source_renewal_private.subjects_v1(subject_id),
 destination_code text NOT NULL,
 source_batch_id bigint NOT NULL,
 predecessor_fact_id bigint REFERENCES official_v3_source_renewal_private.facts_v1(fact_id),
 verified_at timestamptz NOT NULL,
 source_checked_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 method_epoch integer NOT NULL CHECK(method_epoch>0),
 approval_origin text NOT NULL,
 source_digest text NOT NULL CHECK(source_digest ~ '^[a-f0-9]{64}$'),
 UNIQUE(subject_id,source_batch_id),
 FOREIGN KEY(destination_code,source_batch_id)
  REFERENCES official_v3_source_renewal_private.batches_v1(destination_code,source_batch_id),
 CHECK(source_checked_at<=verified_at AND expires_at>verified_at
  AND expires_at<=verified_at+interval '1 hour'
  AND expires_at<=source_checked_at+interval '24 hours')
);
CREATE FUNCTION official_v3_source_renewal_private.deny_history_mutation_v1() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN
 RAISE EXCEPTION 'SOURCE_RENEWAL_APPEND_ONLY_HISTORY' USING ERRCODE='P7992';
END $deny$;

DO $privacy$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['passport_priority_v1','sources_v1','subjects_v1','batches_v1',
  'observations_v1','facts_v1'] LOOP
  EXECUTE format('ALTER TABLE official_v3_source_renewal_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE official_v3_source_renewal_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON official_v3_source_renewal_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_source_renewal_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_source_renewal_private.deny_history_mutation_v1()',t);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_source_renewal_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_source_renewal_private.deny_history_mutation_v1()',t);
 END LOOP;
END $privacy$;
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_source_renewal_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA official_v3_source_renewal_private FROM PUBLIC,anon,authenticated,service_role;

-- Immutable watch data is not a legal approval. The only selected connector
-- here is AT; every other country must supply a separate pinned official
-- source monitor + approved subject in a future Owner-gated method extension.
CREATE FUNCTION official_v3_source_renewal_private.seal_at_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $seal$
DECLARE b record; rec record; h official_v3_method_private.heads_v1%ROWTYPE;
  subject record; predecessor record; old_v3 record;
  count_sources integer:=0; count_good integer:=0; changed integer:=0;
  clock_now timestamptz; seen_at timestamptz; result_value text;
  collected_digest text; result_rows integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR NOT pg_try_advisory_xact_lock(771108,44)
 THEN RETURN jsonb_build_object('status','unavailable','renewed',0); END IF;
 -- Exact comparator implementation pinned; changed code requires new review.
 IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
       WHERE oid='official_v3_at_source_watch_private.collect_v1()'::regprocedure)
    IS DISTINCT FROM '0801fc78366e585d6b1e7841dfa30e6cda2874c4319835f41edbef1780470e44'
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
       WHERE oid='official_v3_at_source_watch_private.status_v1()'::regprocedure)
    IS DISTINCT FROM 'bca9b6333bd3081e2053ca8ca224348333cb6e6c4e7709c8d3c18c0f1ee5f743'
 THEN RETURN jsonb_build_object('status','monitor_implementation_changed','renewed',0); END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 SELECT * INTO b FROM official_v3_at_source_watch_private.batches_v1
  ORDER BY batch_id DESC LIMIT 1;
 clock_now:=clock_timestamp();
 IF NOT FOUND OR b.requested_at>clock_now OR b.requested_at<=clock_now-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','source_unavailable','renewed',0); END IF;
 IF (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1
      WHERE batch_id=b.batch_id AND state='pending')>0
 THEN RETURN jsonb_build_object('status','pending','renewed',0); END IF;

 -- Reread all complete official originals; retain unchanged, changed and
 -- unavailable observations in a NEW immutable journal, never overwrite.
 FOR rec IN
  SELECT r.*,p.url,p.raw_sha,p.canonical_sha,p.expected_bytes,p.edition_marker,
     s.official_url,s.raw_sha AS pinned_sha,s.original_bytes,s.canonical_sha AS pinned_canonical,
     s.normalization
  FROM official_v3_at_source_watch_private.reads_v1 r
  JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
  JOIN official_v3_source_renewal_private.sources_v1 s
    ON s.destination_code='AT' AND s.source_id=r.source_id
  WHERE r.batch_id=b.batch_id ORDER BY r.source_id
 LOOP
  count_sources:=count_sources+1;
  IF rec.observed_at IS NULL OR rec.observed_at>clock_now
   OR rec.requested_at IS DISTINCT FROM b.requested_at
   OR rec.requested_at>rec.observed_at OR rec.observed_at>rec.requested_at+interval '5 minutes'
   OR rec.url IS DISTINCT FROM rec.official_url OR rec.raw_sha IS DISTINCT FROM rec.pinned_sha
   OR rec.expected_bytes IS DISTINCT FROM rec.original_bytes
   OR rec.canonical_sha IS DISTINCT FROM rec.pinned_canonical
   OR rec.state NOT IN ('unchanged_exact','unchanged_asset_version_only','changed','unavailable')
  THEN RETURN jsonb_build_object('status','invalid_source_receipt','renewed',0); END IF;
  IF rec.state='unchanged_exact' AND rec.observed_sha=rec.pinned_sha
   AND rec.observed_bytes=rec.original_bytes THEN count_good:=count_good+1;
  ELSIF rec.state='unchanged_asset_version_only'
   AND rec.source_id='bmeia-bern-how-to-apply'
   AND rec.normalization='bmeia-theme-assets-v1'
   AND rec.pinned_canonical='b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
   AND rec.observed_sha ~ '^[a-f0-9]{64}$' AND rec.observed_bytes=rec.original_bytes
  THEN count_good:=count_good+1;
  ELSIF rec.state='changed' THEN changed:=changed+1; END IF;
 END LOOP;
 IF count_sources<>3 THEN RETURN jsonb_build_object('status','incomplete_source_set','renewed',0); END IF;
 result_value:=CASE WHEN changed>0 THEN 'changed'
  WHEN count_good=3 THEN 'unchanged' ELSE 'unavailable' END;
 INSERT INTO official_v3_source_renewal_private.batches_v1(
   destination_code,source_batch_id,requested_at,sealed_at,outcome,source_count)
 VALUES('AT',b.batch_id,b.requested_at,clock_now,result_value,3)
 ON CONFLICT DO NOTHING;
 IF (SELECT outcome FROM official_v3_source_renewal_private.batches_v1
   WHERE destination_code='AT' AND source_batch_id=b.batch_id) IS DISTINCT FROM result_value
 THEN RETURN jsonb_build_object('status','conflicting_journal','renewed',0); END IF;
 INSERT INTO official_v3_source_renewal_private.observations_v1(
  destination_code,source_batch_id,source_id,request_id,requested_at,
  observed_at,result,observed_bytes,observed_sha,reference_digest)
 SELECT 'AT',r.batch_id,r.source_id,r.request_id,r.requested_at,
  r.observed_at,r.state,r.observed_bytes,r.observed_sha,
  encode(sha256(convert_to(
    'AT|'||r.source_id||'|'||p.url||'|'||p.raw_sha||'|'||coalesce(p.canonical_sha,'')||'|'||
    r.request_id::text||'|'||r.state||'|'||coalesce(r.observed_sha,'')||'|'||
    to_char(r.observed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'UTF8')),'hex')
 FROM official_v3_at_source_watch_private.reads_v1 r
 JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
 WHERE r.batch_id=b.batch_id
 ON CONFLICT DO NOTHING;
 IF (SELECT count(*) FROM official_v3_source_renewal_private.observations_v1
   WHERE destination_code='AT' AND source_batch_id=b.batch_id)<>3
 THEN RETURN jsonb_build_object('status','incomplete_journal','renewed',0); END IF;
 IF result_value<>'unchanged'
 THEN RETURN jsonb_build_object('status',result_value,'renewed',0); END IF;
 -- Fresh observation and current official method/Owner epoch are mandatory.
 IF official_v3_at_source_watch_private.status_v1()->>'status'<>'PINNED_UNCHANGED_NOT_APPROVED'
 THEN RETURN jsonb_build_object('status','watch_unavailable','renewed',0); END IF;
 SELECT min(observed_at) INTO seen_at FROM official_v3_source_renewal_private.observations_v1
  WHERE destination_code='AT' AND source_batch_id=b.batch_id;
 IF seen_at IS NULL OR seen_at>clock_now OR seen_at<clock_now-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','old_batch','renewed',0); END IF;
 SELECT * INTO STRICT h FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 result_rows:=official_v3_source_renewal_private.renew_approved_batch_v1('AT',b.batch_id);
 PERFORM official_v3_guard_private.assert_catalog_v1();
 RETURN jsonb_build_object('status','source_checked','renewed',result_rows,
   'sources',count_sources,'accepted_from_research',0);
EXCEPTION WHEN OTHERS THEN
 -- A status writer may fail closed; no exception is converted into
 -- a visitor-facing positive. Transactional SQL errors roll back its effects.
 RETURN jsonb_build_object('status','unavailable','renewed',0);
END $seal$;
REVOKE ALL ON FUNCTION official_v3_source_renewal_private.seal_at_v1() FROM PUBLIC,anon,authenticated,service_role;


-- Shared and METHOD-BOUNDED renewal core for any approved country/priority
-- passport/requirement. The source adapter must first seal a genuine set of
-- current official HTTP observations into immutable batches/observations.
-- This cannot authorize an unapproved subject or bootstrap from research.
CREATE FUNCTION official_v3_source_renewal_private.renew_approved_batch_v1(
  p_destination_code text,p_source_batch_id bigint) RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $renew_approved$
DECLARE b record; s record; preceding record; initial record;
 method official_v3_method_private.heads_v1%ROWTYPE; stamp timestamptz;
 newest timestamptz; signed_sources text; inserted integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
  OR p_destination_code !~ '^[A-Z]{2}$' OR p_source_batch_id IS NULL
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
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
 -- Independently check recorded pinned source identity, one-by-one; BMEIA
 -- theme asset canonicalization is restricted to its already reviewed URL.
 IF EXISTS(
  SELECT 1 FROM official_v3_source_renewal_private.observations_v1 o
  JOIN official_v3_source_renewal_private.sources_v1 p
   USING(destination_code,source_id)
  WHERE o.destination_code=p_destination_code AND o.source_batch_id=p_source_batch_id
   AND (o.observed_at IS NULL OR o.observed_at>stamp OR o.observed_at<o.requested_at
    OR o.observed_at>o.requested_at+interval '5 minutes'
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
  IF s.source_count<>b.source_count OR s.legal_valid_until<=stamp
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
   OR stamp>=s.legal_valid_until
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  THEN RETURN inserted; END IF;
  INSERT INTO official_v3_source_renewal_private.facts_v1(
   subject_id,destination_code,source_batch_id,predecessor_fact_id,
   verified_at,source_checked_at,expires_at,method_epoch,approval_origin,source_digest)
  VALUES(s.subject_id,p_destination_code,p_source_batch_id,preceding.fact_id,
   stamp,newest,least(stamp+interval '1 hour',s.legal_valid_until,
   newest+interval '24 hours'),s.method_epoch,s.approved_origin,signed_sources)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN inserted:=inserted+1; END IF;
 END LOOP;
 RETURN inserted;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $renew_approved$;
REVOKE ALL ON FUNCTION official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)
 FROM PUBLIC,anon,authenticated,service_role;

-- Public read is scoped by every exact subject key; never a general assertion
-- about a country's entry requirements. Source change, missing fresh monitor,
-- expired cache, wrong passport, owner revoke or BG1 outage all fail closed.
CREATE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $read$
DECLARE subject record; fact record; b record; h official_v3_method_private.heads_v1%ROWTYPE;
 latest_source record; instant timestamptz; source_links jsonb;
 unavailable jsonb:=jsonb_build_object('status','unavailable','message','derzeit nicht verfügbar');
BEGIN
 IF p_citizenship_country_code<>'CH'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR official_v3_at_source_watch_private.status_v1()->>'status'<>'PINNED_UNCHANGED_NOT_APPROVED'
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
  OR instant>=subject.legal_valid_until
 THEN RETURN unavailable; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
   WHERE method_id=subject.method_id FOR SHARE;
 IF NOT FOUND OR h.epoch<>subject.method_epoch THEN RETURN unavailable; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
   subject.method_id,subject.method_revision,subject.method_digest,subject.package_digest,h.epoch);
 PERFORM official_v3_guard_private.assert_catalog_v1();
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
END $read$;
REVOKE ALL ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) TO anon,authenticated;

-- The existing 50-minute true-network cap and 5-min collector stay unchanged.
-- Separate reconciliation runs five minutes later; no direct new HTTP caller.
SELECT cron.schedule('jetnity-source-renew-at-dev-v1','2-59/5 * * * *',
 'SELECT official_v3_source_renewal_private.seal_at_v1()');


-- Exactly one new BG1 successor: the old audit baseline is retained and a
-- full, NEW 5-minute BG1 generation must complete before any positive write.
-- It protects the source watch comparator, fact ledger, visitor, permissions,
-- immutable audit chain and all newly introduced dependencies.
CREATE TABLE official_v3_guard_private.source_renewal_baseline_v1(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.source_renewal_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.source_renewal_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.source_renewal_baseline_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.source_renewal_baseline_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.source_renewal_baseline_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.source_renewal_baseline_v1 FROM PUBLIC,anon,authenticated,service_role;

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
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','jetnity_at_visa_v3','jetnity_source_bound_at_visa_v1'))
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
)
SELECT jsonb_object_agg(key,value ORDER BY key COLLATE "C") FROM entries
$function$
;
CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE renewal official_v3_guard_private.source_renewal_baseline_v1%ROWTYPE;
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
    OR renewal.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
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
  IF official_v3_guard_private.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(renewal.required_generation,at_baseline.required_generation,admin.required_generation,a.required_generation,k.required_generation,f.required_generation,c.required_generation,q.required_generation,g.required_generation,r.required_generation,b.required_generation),greatest(renewal.proof_not_before,at_baseline.proof_not_before,admin.proof_not_before,a.proof_not_before,k.proof_not_before,f.proof_not_before,c.proof_not_before,q.proof_not_before,g.proof_not_before,r.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.source_renewal_baseline_v1 renewal CROSS JOIN official_v3_guard_private.at_hrs2_baseline_v1 at_baseline CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a CROSS JOIN official_v3_guard_private.cycle4_recovery_baseline_v1 k CROSS JOIN official_v3_guard_private.refresh_retirement_baseline_v1 f CROSS JOIN official_v3_guard_private.customer_information_baseline_v1 c
      CROSS JOIN official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.gap_recovery_baseline_v1 g
      CROSS JOIN official_v3_guard_private.recovery_baseline_v1 r
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b WHERE renewal.singleton AND at_baseline.singleton AND admin.singleton AND a.singleton AND k.singleton AND f.singleton AND c.singleton AND q.singleton AND g.singleton AND r.singleton AND b.singleton;
  SELECT * INTO STRICT current_state FROM official_v3_guard_private.state_v1 WHERE singleton;
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

INSERT INTO official_v3_guard_private.source_renewal_baseline_v1(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(at_baseline.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(at_baseline)||jsonb_build_object(
  'proof_not_before',extract(epoch FROM at_baseline.proof_not_before)))::text,'UTF8')),'hex'),
 state.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.at_hrs2_baseline_v1 at_baseline
CROSS JOIN official_v3_guard_private.state_v1 state
WHERE at_baseline.singleton AND state.singleton;

DO $successor_post$
DECLARE item text; s record;
BEGIN
 SELECT * INTO STRICT s FROM official_v3_guard_private.source_renewal_baseline_v1 WHERE singleton;
 IF s.required_generation<2
   OR (SELECT count(*) FROM official_v3_source_renewal_private.passport_priority_v1)<>50
   OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1)<>3
   OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
   OR (SELECT count(*) FROM official_v3_source_renewal_private.facts_v1)<>0
   OR (SELECT count(*) FROM official_v3_guard_private.source_renewal_baseline_v1)<>1
   OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname='jetnity-source-renew-at-dev-v1'
     AND command='SELECT official_v3_source_renewal_private.seal_at_v1()')<>1
   OR has_schema_privilege('anon','official_v3_source_renewal_private','USAGE')
   OR has_schema_privilege('authenticated','official_v3_source_renewal_private','USAGE')
   OR has_schema_privilege('service_role','official_v3_source_renewal_private','USAGE')
   OR has_function_privilege('anon','official_v3_source_renewal_private.seal_at_v1()','EXECUTE')
   OR NOT has_function_privilege('anon','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
 THEN RAISE EXCEPTION 'SOURCE_RENEWAL_PRIVACY_OR_BG1_POSTCHECK_REFUSED' USING ERRCODE='P7991'; END IF;
 FOR item IN SELECT relname FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='official_v3_source_renewal_private' AND c.relkind='r' LOOP
   IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
     WHERE oid=format('official_v3_source_renewal_private.%I',item)::regclass)
   THEN RAISE EXCEPTION 'SOURCE_RENEWAL_PRIVATE_RLS_MISSING %',item USING ERRCODE='P7991'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 -- A positive status here would indicate the NEW full audit gate was not armed.
 IF public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'SOURCE_RENEWAL_NEW_FULL_BG1_PROOF_REQUIRED' USING ERRCODE='P7991'; END IF;
END $successor_post$;
COMMIT;
