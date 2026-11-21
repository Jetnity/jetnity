-- DEV-ONLY exact approved weather-role ACL v4 successor with AT renewal guard.
-- Full historical protected baselines retained. Source qualifier still RESEARCH_ONLY.
-- Native proof ends in ROLLBACK. Do not install on Production.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
DO $pre$
DECLARE prev jsonb; live jsonb; changed_keys text[]; allowed text:='shared:5:1255:91879:0:1260:16485:a';
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR to_regclass('official_v3_guard_private.source_renewal_baseline_v1') IS NULL
 OR to_regclass('official_v3_guard_private.at_batch_switch_baseline_v2') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_dev_weather_acl_baseline_v4') IS NOT NULL
 OR to_regclass('official_v3_guard_private.bg1_transient_baseline_v3') IS NULL
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'DEV_V4_PREREQUISITE_STOP' USING ERRCODE='P7905';END IF;
 SELECT catalog INTO STRICT prev FROM official_v3_guard_private.bg1_transient_baseline_v3 WHERE singleton;
 SELECT official_v3_guard_private.catalog_status_v1() INTO STRICT live;
 SELECT array_agg(d ORDER BY d COLLATE "C") INTO changed_keys FROM (
   SELECT coalesce(a.key,b.key) d FROM jsonb_each(prev) a FULL JOIN jsonb_each(live) b ON a.key=b.key
   WHERE a.value IS DISTINCT FROM b.value
 ) x;
 IF changed_keys IS DISTINCT FROM ARRAY[allowed]
 OR live->allowed IS DISTINCT FROM jsonb_build_object('dbid','5','classid','1255','objid','91879',
   'objsubid',0,'refclassid','1260','refobjid','16485','deptype','a')
 OR prev ? allowed OR (SELECT oid FROM pg_roles WHERE rolname='authenticated')<>16485
 OR (SELECT proacl::text FROM pg_proc WHERE oid='public.reisewetter_reservieren_v1()'::regprocedure)
    IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres}'
 OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
 OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'DEV_V4_ACL_IS_NOT_THE_ONLY_DRIFT' USING ERRCODE='P7905';END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('public.reisewetter_reservieren_v1()'::regprocedure),'UTF8')),'hex'))<>'9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.assert_catalog_v1()'::regprocedure),'UTF8')),'hex'))<>'97c3e8ea2be65092f88fe7c247a345bc1d9bba53b8609f118519bae22b5d2585'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_guard_private.require_open_v1()'::regprocedure),'UTF8')),'hex'))<>'df6640a4feba7eacd6f6d1ad810133294aca3b8dccb411a2ac2444d038014d08'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('public.official_v3_guard_alarm_status_v1()'::regprocedure),'UTF8')),'hex'))<>'9f9a35611cd99913ca13ada1ab316d5795fd5599737916f9519a56533863220d'
 OR (SELECT encode(sha256(convert_to(pg_get_functiondef('official_v3_source_renewal_private.renew_approved_batch_v1(text,bigint)'::regprocedure),'UTF8')),'hex'))<>'05b3000d35ca26962832db970e22c9916c585a4de95d26dff5ce8694bb6d2779'
 THEN RAISE EXCEPTION 'DEV_V4_FUNCTION_DIGEST_MISMATCH' USING ERRCODE='P7905';END IF;
END $pre$;
CREATE TABLE official_v3_guard_private.bg1_dev_weather_acl_baseline_v4(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest ~ '^[a-f0-9]{64}$'),
 approved_dependency_key text NOT NULL CHECK(approved_dependency_key='shared:5:1255:91879:0:1260:16485:a'),
 weather_function_digest text NOT NULL CHECK(weather_function_digest ~ '^[a-f0-9]{64}$'),
 weather_acl_text text NOT NULL,
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.bg1_dev_weather_acl_baseline_v4
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.bg1_dev_weather_acl_baseline_v4
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
-- Append-only dedicated Dev operator-maintenance receipt, NOT an Owner session.
-- Only the one approved Dev weather-ACL incident may be reconciled after a
-- real post-v4 full proof. No Production code or public EXECUTE is installed.
CREATE TABLE official_v3_guard_private.dev_acl_reconciliation_receipts_v4(
 ticket text PRIMARY KEY CHECK(ticket='dev_weather_acl_20261121'),
 incident_generation bigint NOT NULL CHECK(incident_generation=14),
 previous_resumed_generation bigint NOT NULL CHECK(previous_resumed_generation=13),
 proof_generation bigint NOT NULL CHECK(proof_generation>=1919),
 approved_dependency_key text NOT NULL CHECK(approved_dependency_key='shared:5:1255:91879:0:1260:16485:a'),
 approved_at timestamptz NOT NULL,
 exact_catalog_digest text NOT NULL CHECK(exact_catalog_digest ~ '^[a-f0-9]{64}CREATE OR REPLACE FUNCTION official_v3_source_renewal_private.renew_approved_batch_v1(p_destination_code text, p_source_batch_id bigint)
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
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

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
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
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
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
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
 OR acl_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

INSERT INTO official_v3_guard_private.bg1_dev_weather_acl_baseline_v4
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,approved_dependency_key,
 weather_function_digest,weather_acl_text,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'shared:5:1255:91879:0:1260:16485:a','9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be',
 '{postgres=X/postgres,authenticated=X/postgres}',
 greatest(s.generation+1,v.required_generation+1),greatest(clock_timestamp(),v.proof_not_before+interval '1 microsecond'),
 official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_transient_baseline_v3 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $post$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4)<>1
 OR has_table_privilege('anon','official_v3_guard_private.bg1_dev_weather_acl_baseline_v4','SELECT')
 OR has_table_privilege('authenticated','official_v3_guard_private.bg1_dev_weather_acl_baseline_v4','SELECT')
 OR (SELECT v.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton)
 OR (SELECT v.required_generation<=s.generation FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton)
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
    WHERE disposition='RESEARCH_ONLY' OR NOT importable OR accepted_fact_count<=0)<>3
 THEN RAISE EXCEPTION 'DEV_V4_POSTCHECK_FAILED' USING ERRCODE='P7905';END IF;
END $post$;
SELECT 'DEV_BG1_WEATHER_ACL_V4_WITH_AT_GUARD_ROLLBACK_PASS' result,
 (SELECT v.catalog=official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton) catalog_equal,
 (SELECT v.required_generation FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton) required_next_proof,
 false AS dev_owner_resume_bypassed,false AS unqualified_visa_fact_published;
ROLLBACK;
),
 operator_authorization text NOT NULL CHECK(operator_authorization='explicit_user_dev_approval_2026_11_21')
);
ALTER TABLE official_v3_guard_private.dev_acl_reconciliation_receipts_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.dev_acl_reconciliation_receipts_v4 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.dev_acl_reconciliation_receipts_v4 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_guard_private.dev_acl_reconciliation_receipts_v4
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_guard_private.dev_acl_reconciliation_receipts_v4
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.dev_acl_reconciliation_receipts_v4 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
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
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$;

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
    SELECT greatest(v.required_generation,required_proof),greatest(v.proof_not_before,earliest_proof)
     INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_transient_baseline_v3 v WHERE singleton;
 SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
 INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton;
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
END $function$;

CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE acl_v4 official_v3_guard_private.bg1_dev_weather_acl_baseline_v4%ROWTYPE;
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
 OR acl_v4.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'bg1 recovery protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$;

INSERT INTO official_v3_guard_private.bg1_dev_weather_acl_baseline_v4
 (singleton,predecessor_catalog_digest,predecessor_baseline_digest,approved_dependency_key,
 weather_function_digest,weather_acl_text,required_generation,proof_not_before,catalog)
SELECT true,encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 'shared:5:1255:91879:0:1260:16485:a','9c9e0dc4a1c7cf48c60b434b32eb26f2c65805f9ab95e9c0ca832d7b5e1b27be',
 '{postgres=X/postgres,authenticated=X/postgres}',
 greatest(s.generation+1,v.required_generation+1),greatest(clock_timestamp(),v.proof_not_before+interval '1 microsecond'),
 official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.bg1_transient_baseline_v3 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton;
DO $post$
BEGIN
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 OR (SELECT count(*) FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4)<>1
 OR has_table_privilege('anon','official_v3_guard_private.bg1_dev_weather_acl_baseline_v4','SELECT')
 OR has_table_privilege('authenticated','official_v3_guard_private.bg1_dev_weather_acl_baseline_v4','SELECT')
 OR (SELECT v.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton)
 OR (SELECT v.required_generation<=s.generation FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v CROSS JOIN official_v3_guard_private.state_v1 s WHERE v.singleton AND s.singleton)
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2
    WHERE disposition='RESEARCH_ONLY' OR NOT importable OR accepted_fact_count<=0)<>3
 THEN RAISE EXCEPTION 'DEV_V4_POSTCHECK_FAILED' USING ERRCODE='P7905';END IF;
END $post$;
SELECT 'DEV_BG1_WEATHER_ACL_V4_WITH_AT_GUARD_ROLLBACK_PASS' result,
 (SELECT v.catalog=official_v3_guard_private.catalog_status_v1() FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton) catalog_equal,
 (SELECT v.required_generation FROM official_v3_guard_private.bg1_dev_weather_acl_baseline_v4 v WHERE singleton) required_next_proof,
 false AS dev_owner_resume_bypassed,false AS unqualified_visa_fact_published;
ROLLBACK;
