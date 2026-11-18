-- OWNER-GATED PRODUCTION CANDIDATE, NOT YET APPROVED/TESTED END-TO-END.
-- DO NOT RUN ON PRODUCTION WITHOUT USER APPROVAL AND NATIVE PG17 PROOF.
-- Append-only successor BG1 baseline; predecessor is immutable.
-- Only CH ordinary passport/direct-entry visa; 49 others fail closed.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='25s';
SET LOCAL jetnity.at_batch_switch_v3_target='production:qscbgcdmivbbnzrcyegn:AT-BATCH-SWITCH-V3';
DO $pre$
DECLARE h record;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_batch_switch_v3_target',true)
    IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:AT-BATCH-SWITCH-V3'
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM official_v3_guard_private.at_source_monitor_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND database='postgres'
    AND ((jobname='jetnity-at-production-source-enqueue-v1' AND schedule='*/5 * * * *'
      AND command='SELECT official_v3_at_production_private.enqueue_v1()')
    OR (jobname='jetnity-at-production-source-collect-v1' AND schedule='*/5 * * * *'
      AND command='SELECT official_v3_at_production_private.collect_v1()')
    OR (jobname='jetnity-at-production-source-renew-v1' AND schedule='2-59/5 * * * *'
      AND command='SELECT official_v3_at_production_private.renew_ch_v1()')))<>3
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771112,1)
 OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RAISE EXCEPTION 'AT_BATCH_V3_PREDECESSOR_REJECTED' USING ERRCODE='P7985'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 FOR h IN SELECT * FROM (VALUES
  ('official_v3_at_production_private.renew_ch_v1()','55a272d3431274266b1d5c8ad7b4b21ac213d19028932ff42dde944304d45d1b'),
  ('official_v3_guard_private.assert_catalog_v1()','93ae67b5c1b058d9df26be24b467bab7a25aea514f3d1b24517f666299b20f30'),
  ('official_v3_guard_private.require_open_v1()','2636f28c99b1d87012f73223089afb3b9f189c985c07ef49acafb5ba65cf315a'),
  ('public.jetnity_source_bound_at_visa_v1(text)','9c23e456059e9606ecaa6fd6d5abc8e81464af4ab15c33720c17435e67a5da91'),
  ('public.official_v3_guard_alarm_status_v1()','0e33a6adae5aa4e0dd102c669930f28745f5dbd0ee8e62ad355aa4c0581da14c')
 ) expected(signature,definition_digest) LOOP
 IF to_regprocedure(h.signature) IS NULL
 OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(h.signature)),'UTF8')),'hex')
    IS DISTINCT FROM h.definition_digest
 THEN RAISE EXCEPTION 'AT_BATCH_V3_UNEXPECTED_FUNCTION' USING ERRCODE='P7985'; END IF;
 END LOOP;
END $pre$;

CREATE TEMP TABLE at_batch_v3_predecessor(snapshot jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_batch_v3_predecessor SELECT catalog
 FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;

CREATE TABLE official_v3_guard_private.at_batch_switch_baseline_v2(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.at_batch_switch_baseline_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.at_batch_switch_baseline_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.at_batch_switch_baseline_v2
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON official_v3_guard_private.at_batch_switch_baseline_v2
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON official_v3_guard_private.at_batch_switch_baseline_v2
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.at_batch_switch_baseline_v2
 FROM PUBLIC,anon,authenticated,service_role;

-- Existing identities and grants are preserved, no new public routines.
CREATE OR REPLACE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE f record; b record; method official_v3_method_private.heads_v1%ROWTYPE;
 instant timestamptz; check_count integer; source_count integer;
 source_links jsonb; signed_sources text;
 unavailable jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
BEGIN
 -- Nothing else (including any other passport, destination or document) can
 -- be promoted by a generic 50-passport method approval.
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN unavailable; END IF;
 -- Read the most recently AUTHORISED fact first. A newly queued
 -- network batch is not an accepted replacement until renewal commits.
 instant:=clock_timestamp();
 SELECT * INTO f FROM official_v3_at_production_private.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN unavailable; END IF;
 SELECT * INTO b FROM official_v3_at_production_private.watch_batches_v1
 WHERE batch_id=f.source_batch_id;
 IF NOT FOUND OR b.started_at>instant OR b.started_at<=instant-interval '70 minutes'
 THEN RETURN unavailable; END IF;
 SELECT count(*) INTO check_count
 FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=b.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only')
   AND observed_at<=instant AND observed_at>instant-interval '70 minutes';
 SELECT count(*) INTO source_count
 FROM official_v3_at_production_private.source_pins_v1;
 IF check_count<>3 OR source_count<>3
   OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
   OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname IN('jetnity-at-production-source-enqueue-v1',
        'jetnity-at-production-source-collect-v1',
        'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN unavailable; END IF;
 IF f.citizenship_code<>'CH' OR f.destination_code<>'AT'
  OR f.source_batch_id<>b.batch_id OR f.verified_at>instant
  OR f.source_checked_at>instant OR instant>=f.expires_at
  OR instant>=f.source_checked_at+interval '70 minutes'
  OR f.method_revision<>1
  OR f.method_digest<>'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
  OR f.package_digest<>'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 THEN RETURN unavailable; END IF;

 -- A queued successor does not invalidate an unexpired approved fact,
 -- but ANY observed changed/failed official source does so immediately.
 -- Collector reports a missing HTTP response as unavailable after 6 min.
 IF EXISTS(
   SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
   WHERE o.batch_id>f.source_batch_id AND o.observed_at<=instant
    AND o.source_status IN('changed','unavailable')
 ) THEN RETURN unavailable; END IF;
 -- Do not keep serving the old fact if an unfinished successor fails to
 -- collect all 3 pinned sources within the established collector deadline.
 IF EXISTS(
   SELECT 1 FROM official_v3_at_production_private.watch_batches_v1 newer
   WHERE newer.batch_id>f.source_batch_id
    AND newer.started_at<=instant-interval '6 minutes'
    AND ( (SELECT count(*) FROM official_v3_at_production_private.watch_requests_v1 r
            WHERE r.batch_id=newer.batch_id)<>3
       OR (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1 o
            WHERE o.batch_id=newer.batch_id AND o.observed_at<=instant)<>3 )
 ) THEN RETURN unavailable; END IF;
 SELECT * INTO method FROM official_v3_method_private.heads_v1
 WHERE method_id=f.method_id FOR SHARE;
 IF NOT FOUND OR method.epoch<>f.method_epoch THEN RETURN unavailable; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
 f.method_id,f.method_revision,f.method_digest,f.package_digest,f.method_epoch);
 SELECT encode(sha256(convert_to(
   string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=b.batch_id;
 IF signed_sources IS DISTINCT FROM f.source_digest THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
  WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2
  WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM official_v3_at_production_private.source_pins_v1;
 IF jsonb_array_length(source_links)<>3 THEN RETURN unavailable; END IF;
 RETURN jsonb_build_object(
 'status','accepted','citizenshipCountryCode','CH',
 'destinationCountryCode','AT','documentType','passport',
 'visaEffect','not_required','visaMode','visa_exempt',
 'ruleVersion',f.version_id,
 'sourceCheckedAt',to_char(f.source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'verifiedAt',to_char(f.verified_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'expiresAt',to_char(f.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'sourceUrls',source_links);
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_at_production_private.renew_ch_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE latest record; h official_v3_method_private.heads_v1%ROWTYPE;
 previous record; as_of timestamptz; seen timestamptz; digest text; official_count integer;
 expires timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RETURN 0; END IF;
 SELECT * INTO latest FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1 FOR SHARE;
 as_of:=clock_timestamp();
 IF NOT FOUND OR latest.started_at>as_of
   OR latest.started_at<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT count(*),min(observed_at) INTO official_count,seen
 FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only');
 IF official_count<>3 OR seen IS NULL OR seen<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE username='postgres' AND active
    AND jobname IN ('jetnity-at-production-source-enqueue-v1',
                    'jetnity-at-production-source-collect-v1',
                    'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN 0; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM official_v3_at_production_private.first_originals_v1 o
   JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
   WHERE o.source_id='bmi-visa-nationality-matrix'
     AND p.original_sha='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND o.raw_sha=p.original_sha AND o.raw_bytes=498415
     AND position('(Stand: 6.11.2026)' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('EU-Freiz&uuml;gigkeit' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('Schweiz' IN convert_from(o.raw_body,'UTF8'))>0)
 THEN RETURN 0; END IF;
 IF EXISTS(
  SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 r
  JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
  WHERE r.batch_id=latest.batch_id
   AND ((r.source_status='unchanged_exact'
     AND (r.body_sha IS DISTINCT FROM p.original_sha OR r.bytes<>p.original_bytes))
   OR (r.source_status='unchanged_asset_version_only'
     AND (r.source_id<>'bmeia-bern-how-to-apply'
       OR p.normalization<>'bmeia-theme-assets-v1'
       OR p.canonical_sha IS DISTINCT FROM
       'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55'
       OR r.bytes<>p.original_bytes))))
 THEN RETURN 0; END IF;
 SELECT * INTO h FROM official_v3_method_private.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>1 OR h.method_digest<>
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 OR h.package_digest<>
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 OR h.epoch<1
 THEN RETURN 0; END IF;
 PERFORM official_v3_method_private.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 SELECT * INTO previous FROM official_v3_at_production_private.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1 FOR SHARE;
 -- Once any official source is actually changed, do NOT auto-renew a
 -- later reverted source under the old method. Owner requalification required.
 IF FOUND AND EXISTS(
   SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
   WHERE o.batch_id>previous.source_batch_id AND o.batch_id<=latest.batch_id
     AND o.source_status='changed'
 ) THEN RETURN 0; END IF;
 IF FOUND AND (previous.source_batch_id=latest.batch_id
   OR previous.source_checked_at>=seen) THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(
   source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=latest.batch_id;
 IF digest IS NULL THEN RETURN 0; END IF;
 as_of:=clock_timestamp();
 expires:=least(as_of+interval '1 hour',seen+interval '70 minutes',
   '2027-11-16T00:00:00Z'::timestamptz);
 IF expires<=as_of OR as_of>=seen+interval '70 minutes'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 INSERT INTO official_v3_at_production_private.ch_visa_facts_v1(
  source_batch_id,predecessor_version_id,method_epoch,method_id,
  method_revision,method_digest,package_digest,source_digest,
  verified_at,source_checked_at,expires_at)
 VALUES(latest.batch_id,previous.version_id,h.epoch,
 'jetnity-destination-primary-at-visa',1,
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
 digest,as_of,seen,expires)
 ON CONFLICT DO NOTHING;
 IF FOUND THEN
   PERFORM official_v3_guard_private.assert_catalog_v1();
   RETURN 1;
 END IF;
 RETURN 0;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE switch_v2 official_v3_guard_private.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
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
    OR switch_v2.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
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
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
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
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod CROSS JOIN official_v3_guard_private.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
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


DO $comparison$
DECLARE old_catalog jsonb; new_catalog jsonb; drift integer;
BEGIN
 SELECT snapshot INTO STRICT old_catalog FROM pg_temp.at_batch_v3_predecessor;
 new_catalog:=official_v3_guard_private.catalog_status_v1();
 SELECT count(*) INTO drift FROM jsonb_each(old_catalog) orig
 WHERE CASE
   WHEN orig.key IN (
     'function:'||to_regprocedure('official_v3_at_production_private.renew_ch_v1()')::oid,
     'function:'||to_regprocedure('official_v3_guard_private.assert_catalog_v1()')::oid,
     'function:'||to_regprocedure('official_v3_guard_private.require_open_v1()')::oid,
     'function:'||to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)')::oid,
     'function:'||to_regprocedure('public.official_v3_guard_alarm_status_v1()')::oid)
   THEN (orig.value-'definition') IS DISTINCT FROM ((new_catalog->orig.key)-'definition')
   ELSE orig.value IS DISTINCT FROM new_catalog->orig.key END;
 IF drift<>0 THEN RAISE EXCEPTION 'AT_BATCH_V3_PREDECESSOR_CATALOG_DRIFT'
 USING ERRCODE='P7985'; END IF;
END $comparison$;

INSERT INTO official_v3_guard_private.at_batch_switch_baseline_v2(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(old.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(old)||jsonb_build_object('proof_not_before',
   extract(epoch FROM old.proof_not_before)))::text,'UTF8')),'hex'),
 state.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.at_source_monitor_baseline_v1 old
CROSS JOIN official_v3_guard_private.state_v1 state
WHERE old.singleton AND state.singleton;

DO $post$
BEGIN
 IF (SELECT count(*) FROM official_v3_guard_private.at_batch_switch_baseline_v2)<>1
 OR EXISTS(SELECT 1 FROM official_v3_guard_private.at_batch_switch_baseline_v2 v
     WHERE v.proof_not_before<=(SELECT last_proof_started
       FROM official_v3_guard_private.state_v1 WHERE singleton))
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>3
 OR NOT has_function_privilege('anon','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
 OR has_schema_privilege('anon','official_v3_guard_private','USAGE')
 OR has_table_privilege('anon','official_v3_guard_private.at_batch_switch_baseline_v2','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('CH')->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('IN')->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'AT_BATCH_V3_INSTALL_MUST_FAIL_CLOSED' USING ERRCODE='P7985'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
-- Fresh full 5-minute BG1 audit and exact Owner-controlled release readback
-- must follow; never force an audit lease or update immutable evidence.
