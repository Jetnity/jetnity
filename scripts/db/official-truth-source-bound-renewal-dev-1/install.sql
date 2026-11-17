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
  current_time timestamptz; seen_at timestamptz; result_value text;
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
 current_time:=clock_timestamp();
 IF NOT FOUND OR b.requested_at>current_time OR b.requested_at<=current_time-interval '70 minutes'
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
  IF rec.observed_at IS NULL OR rec.observed_at>current_time
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
 VALUES('AT',b.batch_id,b.requested_at,current_time,result_value,3)
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
 IF seen_at IS NULL OR seen_at>current_time OR seen_at<current_time-interval '70 minutes'
 THEN RETURN jsonb_build_object('status','old_batch','renewed',0); END IF;
 SELECT * INTO STRICT h FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 FOR subject IN SELECT * FROM official_v3_source_renewal_private.subjects_v1
   WHERE destination_code='AT' AND requirement_type='visa' ORDER BY subject_id LOOP
  IF subject.method_id IS DISTINCT FROM h.method_id
   OR subject.method_revision IS DISTINCT FROM h.revision
   OR subject.method_digest IS DISTINCT FROM h.method_digest
   OR subject.package_digest IS DISTINCT FROM h.package_digest
   OR subject.method_epoch IS DISTINCT FROM h.epoch
   OR subject.legal_valid_until<=current_time
   OR subject.source_count<>3
   OR NOT EXISTS(SELECT 1 FROM official_v3_source_renewal_private.passport_priority_v1
    WHERE code=subject.citizenship_code)
  THEN CONTINUE; END IF;
  SELECT * INTO predecessor FROM official_v3_source_renewal_private.facts_v1
    WHERE subject_id=subject.subject_id ORDER BY fact_id DESC LIMIT 1 FOR SHARE;
  IF FOUND AND (predecessor.source_batch_id=b.batch_id OR predecessor.verified_at>=seen_at)
  THEN CONTINUE; END IF;
  IF NOT FOUND THEN
   SELECT * INTO old_v3 FROM official_v3_at_private.verified_visas_v3 v
    WHERE 'verified_visas_v3:CH:'||v.rule_version=subject.approved_origin;
   IF NOT FOUND OR old_v3.method_epoch<>h.epoch OR old_v3.visa_effect<>'not_required'
    OR old_v3.visa_mode<>'visa_exempt' OR old_v3.verified_at>=seen_at OR old_v3.expires_at<=old_v3.verified_at
   THEN CONTINUE; END IF;
  END IF;
  current_time:=clock_timestamp();
  IF current_time>=seen_at+interval '70 minutes' OR current_time>=subject.legal_valid_until
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  THEN RETURN jsonb_build_object('status','expiry_or_guard','renewed',0); END IF;
  -- No invented fact: only renew same existing owner-approved legal effect.
  collected_digest:=(SELECT encode(sha256(convert_to(string_agg(
    source_id||':'||reference_digest,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM official_v3_source_renewal_private.observations_v1
    WHERE destination_code='AT' AND source_batch_id=b.batch_id);
  INSERT INTO official_v3_source_renewal_private.facts_v1(
   subject_id,destination_code,source_batch_id,predecessor_fact_id,
   verified_at,source_checked_at,expires_at,method_epoch,approval_origin,source_digest)
  VALUES(subject.subject_id,'AT',b.batch_id,predecessor.fact_id,
   current_time,seen_at,least(current_time+interval '1 hour',subject.legal_valid_until,
   seen_at+interval '24 hours'),h.epoch,subject.approved_origin,collected_digest)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN result_rows:=result_rows+1; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 RETURN jsonb_build_object('status','source_checked','renewed',result_rows,
   'sources',count_sources,'accepted_from_research',0);
EXCEPTION WHEN OTHERS THEN
 -- A status writer may fail closed; no exception is converted into
 -- a visitor-facing positive. Transactional SQL errors roll back its effects.
 RETURN jsonb_build_object('status','unavailable','renewed',0);
END $seal$;
REVOKE ALL ON FUNCTION official_v3_source_renewal_private.seal_at_v1() FROM PUBLIC,anon,authenticated,service_role;

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

DO $after$
DECLARE name text;
BEGIN
 IF (SELECT count(*) FROM official_v3_source_renewal_private.passport_priority_v1)<>50
  OR (SELECT count(*) FROM official_v3_source_renewal_private.sources_v1)<>3
  OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
  OR (SELECT count(*) FROM official_v3_source_renewal_private.facts_v1)<>0
  OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname='jetnity-source-renew-at-dev-v1'
     AND command='SELECT official_v3_source_renewal_private.seal_at_v1()')<>1
  OR has_schema_privilege('anon','official_v3_source_renewal_private','USAGE')
  OR has_schema_privilege('authenticated','official_v3_source_renewal_private','USAGE')
  OR has_schema_privilege('service_role','official_v3_source_renewal_private','USAGE')
  OR has_function_privilege('anon','official_v3_source_renewal_private.seal_at_v1()','EXECUTE')
  OR NOT has_function_privilege('anon','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
  OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM
     (SELECT catalog FROM renewal_previous_catalog)
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'SOURCE_RENEWAL_PRIVACY_OR_BG1_POSTCHECK_REFUSED' USING ERRCODE='P7991'; END IF;
 FOR name IN SELECT relname FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='official_v3_source_renewal_private' AND c.relkind='r' LOOP
   IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
     WHERE oid=format('official_v3_source_renewal_private.%I',name)::regclass)
   THEN RAISE EXCEPTION 'SOURCE_RENEWAL_PRIVATE_RLS_MISSING %',name USING ERRCODE='P7991'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $after$;
COMMIT;
-- Dev rollback: unschedule 'jetnity-source-renew-at-dev-v1';
-- revoke public RPC and drop only the new isolated schema/functions
-- after preserving the append-only proof history for audit.
