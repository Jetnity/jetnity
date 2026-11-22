-- NATIVE PG17 ISOLATED BG1 CHAIN ROLLBACK, synthetic only.
BEGIN; SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout='30s';
SET LOCAL jetnity.at_batch_switch_v3_target='production:qscbgcdmivbbnzrcyegn:AT-BATCH-SWITCH-V3';
CREATE SCHEMA jetnity_at_full_rehearsal AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_at_full_rehearsal FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_at_full_rehearsal.baselines_v1(component text,catalog jsonb,installed_at timestamptz);
CREATE TABLE jetnity_at_full_rehearsal.rolling_policy_v2(mode text,installed_at timestamptz);
CREATE TABLE jetnity_at_full_rehearsal.status_baseline_v1(singleton boolean,provider_digest text,predecessor_catalog_digest text,predecessor_baselines_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.rolling_quota_baseline_v1(singleton boolean,predecessor_provider_digest text,predecessor_catalog_digest text,predecessor_status_digest text,policy jsonb,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.admin_runtime_baseline_v1(singleton boolean,predecessor_provider_digest text,definition_digest text,predecessor_catalog_digest text,predecessor_rolling_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.saved_offers_baseline_v1(singleton boolean,migration_blob text,predecessor_catalog_digest text,predecessor_admin_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.weather_quota_baseline_v1(singleton boolean,candidate_sha256 text,predecessor_sha256 text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.at_source_monitor_baseline_v1(singleton boolean,predecessor_catalog_digest text,predecessor_weather_digest text,catalog jsonb,proof_not_before timestamptz,required_generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.state_v1(singleton boolean PRIMARY KEY,generation bigint,incident_generation bigint,resumed_generation bigint,installed_at timestamptz,last_observed timestamptz,last_finished timestamptz,last_started timestamptz,last_proof_started timestamptz,last_due timestamptz,valid_until timestamptz);
CREATE TABLE jetnity_at_full_rehearsal.runs_v1(due_at timestamptz,started_at timestamptz,proof_started_at timestamptz,finished_at timestamptz,outcome text,generation bigint);
CREATE TABLE jetnity_at_full_rehearsal.cron_job(jobname text primary key,active boolean,username text,database text,schedule text,command text);
INSERT INTO jetnity_at_full_rehearsal.cron_job VALUES
('jetnity-at-production-source-enqueue-v1',true,'postgres','postgres','*/5 * * * *','SELECT jetnity_at_full_rehearsal.enqueue_v1()'),
('jetnity-at-production-source-collect-v1',true,'postgres','postgres','*/5 * * * *','SELECT jetnity_at_full_rehearsal.collect_v1()'),
('jetnity-at-production-source-renew-v1',true,'postgres','postgres','2-59/5 * * * *','SELECT jetnity_at_full_rehearsal.renew_ch_v1()');
CREATE TABLE jetnity_at_full_rehearsal.heads_v1(method_id text,revision int,method_digest text,package_digest text,epoch int);
INSERT INTO jetnity_at_full_rehearsal.heads_v1 VALUES ('jetnity-destination-primary-at-visa',1,
'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',1);
CREATE FUNCTION jetnity_at_full_rehearsal.require_current_locked_v1(mid text,rev int,digest text,pkg text,ep int)
RETURNS void LANGUAGE plpgsql AS $f$ BEGIN
IF NOT EXISTS (SELECT 1 FROM jetnity_at_full_rehearsal.heads_v1 WHERE method_id=mid AND revision=rev AND method_digest=digest AND package_digest=pkg AND epoch=ep)
THEN RAISE EXCEPTION 'MA1 mismatch' USING ERRCODE='P7907';END IF; END $f$;
CREATE TABLE jetnity_at_full_rehearsal.source_pins_v1(source_id text primary key,official_url text,original_sha text,original_bytes int,canonical_sha text,normalization text);
INSERT INTO jetnity_at_full_rehearsal.source_pins_v1 VALUES
('bmi-general-entry','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html','ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655,NULL,'none'),
('bmi-visa-nationality-matrix','https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html','fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415,NULL,'none'),
('bmeia-bern-how-to-apply','https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/','7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',172460,'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55','bmeia-theme-assets-v1');
CREATE TABLE jetnity_at_full_rehearsal.first_originals_v1(source_id text primary key,raw_body bytea,raw_sha text,raw_bytes int);
INSERT INTO jetnity_at_full_rehearsal.first_originals_v1 SELECT source_id,convert_to(CASE WHEN source_id='bmi-visa-nationality-matrix' THEN '(Stand: 6.11.2026) EU-Freiz&uuml;gigkeit Schweiz' ELSE 'Synthetic' END,'UTF8'),original_sha,original_bytes FROM jetnity_at_full_rehearsal.source_pins_v1;
CREATE TABLE jetnity_at_full_rehearsal.watch_batches_v1(batch_id bigint generated always as identity primary key,started_at timestamptz);
CREATE TABLE jetnity_at_full_rehearsal.watch_requests_v1(batch_id bigint,source_id text,request_id bigint,requested_at timestamptz);
CREATE TABLE jetnity_at_full_rehearsal.watch_observations_v1(batch_id bigint,source_id text,observed_at timestamptz,source_status text,bytes int,body_sha text,http_status int);
CREATE TABLE jetnity_at_full_rehearsal.ch_visa_facts_v1(version_id bigint generated always as identity primary key,citizenship_code text DEFAULT 'CH',destination_code text DEFAULT 'AT',source_batch_id bigint,predecessor_version_id bigint,method_epoch int,method_id text,method_revision int,method_digest text,package_digest text,source_digest text,verified_at timestamptz,source_checked_at timestamptz,expires_at timestamptz,document_type text DEFAULT 'passport',visa_effect text DEFAULT 'not_required',visa_mode text DEFAULT 'visa_exempt',legal_valid_until timestamptz);
CREATE FUNCTION jetnity_at_full_rehearsal.catalog_status_v1() RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog AS $snapshot$
WITH entries AS (
 SELECT 'function:'||p.oid::text AS k,jsonb_build_object('definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),'acl',to_jsonb(p.proacl)) AS v
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='jetnity_at_full_rehearsal'
  AND p.proname IN ('visitor_v1','renew_ch_v1','assert_catalog_v1','require_open_v1','public_guard_v1')
 UNION ALL
 SELECT 'relation:'||c.oid::text,jsonb_build_object('force',c.relforcerowsecurity,'rls',c.relrowsecurity,
   'policies',(SELECT count(*) FROM pg_policy WHERE polrelid=c.oid),
   'triggers',(SELECT count(*) FROM pg_trigger WHERE tgrelid=c.oid AND NOT tgisinternal))
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='jetnity_at_full_rehearsal' AND c.relname='at_batch_switch_baseline_v2'
 UNION ALL SELECT 'transport:production_http_id_allocator_v4',jsonb_build_object('native','fixture_pg17_test_v4')
 UNION ALL SELECT 'new_relation:'||c.oid::text, jsonb_build_object(
   'name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
   'acl',c.relacl::text,'triggers',(SELECT count(*) FROM pg_trigger WHERE tgrelid=c.oid AND NOT tgisinternal))
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='jetnity_at_full_rehearsal' AND c.relname IN
   ('ch_source_qualifications_v2','ch_source_originals_v2','ch_visa_facts_v2',
    'bg1_prod_ch_at_qualified_v5','bg1_prod_ch_at_rollback_v6')
 UNION ALL SELECT 'new_function:'||p.oid::text,jsonb_build_object(
  'name',p.proname,'definition',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='jetnity_at_full_rehearsal' AND p.proname IN
   ('batch_qualified_ch_v2','renew_ch_v2','read_ch_v2','at_v5_bootstrap_immutable','at_v6_bootstrap_immutable')
 UNION ALL SELECT 'new_cron:'||j.jobname,to_jsonb(j) FROM jetnity_at_full_rehearsal.cron_job j
 WHERE j.jobname='jetnity-at-production-source-qualified-renew-v2'
) SELECT COALESCE(jsonb_object_agg(k,v ORDER BY k),'{}'::jsonb) FROM entries $snapshot$;CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.immutable_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN RAISE EXCEPTION 'bg1 immutable evidence' USING ERRCODE='P7901'; END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.alarm_status_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_full_rehearsal.state_v1%ROWTYPE; instant timestamptz:=clock_timestamp();
BEGIN
  SELECT * INTO s FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','unavailable'); END IF;
  RETURN jsonb_build_object('schema',1,'status',CASE
    WHEN instant<s.last_observed OR instant<s.last_finished THEN 'clock'
    WHEN s.incident_generation<>s.resumed_generation THEN 'incident'
    WHEN s.generation=0 THEN 'unchecked'
    WHEN instant>=s.valid_until THEN 'stale' ELSE 'current' END);
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_prod jetnity_at_full_rehearsal.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_full_rehearsal.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_full_rehearsal.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_full_rehearsal.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_full_rehearsal.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_full_rehearsal.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT weather FROM jetnity_at_full_rehearsal.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_full_rehearsal.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_full_rehearsal.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_full_rehearsal.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_full_rehearsal.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_full_rehearsal.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_full_rehearsal.rolling_policy_v2 p)
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
    OR at_prod.catalog IS DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_full_rehearsal.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_full_rehearsal.status_baseline_v1 b CROSS JOIN jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_full_rehearsal.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_full_rehearsal.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 at_prod WHERE at_prod.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.public_guard_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state jetnity_at_full_rehearsal.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF jetnity_at_full_rehearsal.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_full_rehearsal.status_baseline_v1 b CROSS JOIN jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_full_rehearsal.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_full_rehearsal.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 at_prod WHERE at_prod.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.runs_v1 run
      WHERE run.due_at=current_state.last_due AND run.outcome='complete' AND run.generation=current_state.generation
        AND run.started_at=current_state.last_started AND run.proof_started_at=current_state.last_proof_started AND run.finished_at=current_state.last_finished)
    OR clock_timestamp()<greatest(current_state.last_observed,current_state.last_finished,earliest_proof)
    OR clock_timestamp()>=current_state.valid_until THEN RETURN unavailable_value; END IF;
  RETURN jsonb_build_object('schema',1,'status','current');
EXCEPTION WHEN query_canceled OR OTHERS THEN RETURN unavailable_value;
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.visitor_v1(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE f record; b record; method jetnity_at_full_rehearsal.heads_v1%ROWTYPE;
 instant timestamptz; check_count integer; source_count integer;
 source_links jsonb; signed_sources text;
 unavailable jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
BEGIN
 -- Nothing else (including any other passport, destination or document) can
 -- be promoted by a generic 50-passport method approval.
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
   OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 THEN RETURN unavailable; END IF;
 SELECT * INTO b FROM jetnity_at_full_rehearsal.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 instant:=clock_timestamp();
 IF NOT FOUND OR b.started_at>instant OR b.started_at<=instant-interval '70 minutes'
 THEN RETURN unavailable; END IF;
 SELECT count(*) INTO check_count
 FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=b.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only')
   AND observed_at<=instant AND observed_at>instant-interval '70 minutes';
 SELECT count(*) INTO source_count
 FROM jetnity_at_full_rehearsal.source_pins_v1;
 IF check_count<>3 OR source_count<>3
   OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
   OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE active AND username='postgres'
     AND jobname IN('jetnity-at-production-source-enqueue-v1',
        'jetnity-at-production-source-collect-v1',
        'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN unavailable; END IF;
 SELECT * INTO f FROM jetnity_at_full_rehearsal.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR f.citizenship_code<>'CH' OR f.destination_code<>'AT'
  OR f.source_batch_id<>b.batch_id OR f.verified_at>instant
  OR f.source_checked_at>instant OR instant>=f.expires_at
  OR instant>=f.source_checked_at+interval '70 minutes'
  OR f.method_revision<>1
  OR f.method_digest<>'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
  OR f.package_digest<>'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 THEN RETURN unavailable; END IF;
 SELECT * INTO method FROM jetnity_at_full_rehearsal.heads_v1
 WHERE method_id=f.method_id FOR SHARE;
 IF NOT FOUND OR method.epoch<>f.method_epoch THEN RETURN unavailable; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1(
 f.method_id,f.method_revision,f.method_digest,f.package_digest,f.method_epoch);
 SELECT encode(sha256(convert_to(
   string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=b.batch_id;
 IF signed_sources IS DISTINCT FROM f.source_digest THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
  WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2
  WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM jetnity_at_full_rehearsal.source_pins_v1;
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
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.renew_ch_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE latest record; h jetnity_at_full_rehearsal.heads_v1%ROWTYPE;
 previous record; as_of timestamptz; seen timestamptz; digest text; official_count integer;
 expires timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
   OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RETURN 0; END IF;
 SELECT * INTO latest FROM jetnity_at_full_rehearsal.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1 FOR SHARE;
 as_of:=clock_timestamp();
 IF NOT FOUND OR latest.started_at>as_of
   OR latest.started_at<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT count(*),min(observed_at) INTO official_count,seen
 FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=latest.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only');
 IF official_count<>3 OR seen IS NULL OR seen<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE username='postgres' AND active
    AND jobname IN ('jetnity-at-production-source-enqueue-v1',
                    'jetnity-at-production-source-collect-v1',
                    'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN 0; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM jetnity_at_full_rehearsal.first_originals_v1 o
   JOIN jetnity_at_full_rehearsal.source_pins_v1 p USING(source_id)
   WHERE o.source_id='bmi-visa-nationality-matrix'
     AND p.original_sha='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND o.raw_sha=p.original_sha AND o.raw_bytes=498415
     AND position('(Stand: 6.11.2026)' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('EU-Freiz&uuml;gigkeit' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('Schweiz' IN convert_from(o.raw_body,'UTF8'))>0)
 THEN RETURN 0; END IF;
 IF EXISTS(
  SELECT 1 FROM jetnity_at_full_rehearsal.watch_observations_v1 r
  JOIN jetnity_at_full_rehearsal.source_pins_v1 p USING(source_id)
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
 SELECT * INTO h FROM jetnity_at_full_rehearsal.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>1 OR h.method_digest<>
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 OR h.package_digest<>
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 OR h.epoch<1
 THEN RETURN 0; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 SELECT * INTO previous FROM jetnity_at_full_rehearsal.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1 FOR SHARE;
 IF FOUND AND (previous.source_batch_id=latest.batch_id
   OR previous.source_checked_at>=seen) THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(
   source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=latest.batch_id;
 IF digest IS NULL THEN RETURN 0; END IF;
 as_of:=clock_timestamp();
 expires:=least(as_of+interval '1 hour',seen+interval '70 minutes',
   '2027-11-16T00:00:00Z'::timestamptz);
 IF expires<=as_of OR as_of>=seen+interval '70 minutes'
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 INSERT INTO jetnity_at_full_rehearsal.ch_visa_facts_v1(
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
   PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
   RETURN 1;
 END IF;
 RETURN 0;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $function$
;
INSERT INTO jetnity_at_full_rehearsal.baselines_v1 VALUES
('all','{"v":"base"}',clock_timestamp()-interval '2 hours'),
('jobs','{"v":"jobs"}',clock_timestamp()-interval '2 hours'),
('s1','{"v":"s1"}',clock_timestamp()-interval '2 hours');
INSERT INTO jetnity_at_full_rehearsal.rolling_policy_v2 VALUES('fixed',clock_timestamp()-interval '2 hours');
INSERT INTO jetnity_at_full_rehearsal.status_baseline_v1
SELECT true,'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e',
encode(sha256(convert_to(catalog::text,'UTF8')),'hex'),
(SELECT encode(sha256(convert_to(jsonb_agg(to_jsonb(b)||jsonb_build_object(
'installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")::text,'UTF8')),'hex')
FROM jetnity_at_full_rehearsal.baselines_v1 b),'{"v":"status"}',clock_timestamp()-interval '90 minutes',1
FROM jetnity_at_full_rehearsal.baselines_v1 WHERE component='all';
INSERT INTO jetnity_at_full_rehearsal.rolling_quota_baseline_v1
SELECT true,'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc',
encode(sha256(convert_to(s.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(s)||jsonb_build_object('proof_not_before',
extract(epoch FROM s.proof_not_before)))::text,'UTF8')),'hex'),
(SELECT to_jsonb(r)||jsonb_build_object('installed_at',extract(epoch FROM r.installed_at))
FROM jetnity_at_full_rehearsal.rolling_policy_v2 r),'{"v":"rolling"}',clock_timestamp()-interval '80 minutes',1
FROM jetnity_at_full_rehearsal.status_baseline_v1 s;
INSERT INTO jetnity_at_full_rehearsal.admin_runtime_baseline_v1
SELECT true,'2804ccfd293752a9c4a7cb3259e71940d02c5019e89ee987ffd7d37c1da7ac4a',
'7bb12b91b5932e772c48e4aa87787e9f7b05badd405035ed78462e9517b3f6de',
encode(sha256(convert_to(r.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(r)||jsonb_build_object('proof_not_before',
extract(epoch FROM r.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"admin"}',clock_timestamp()-interval '70 minutes',1 FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 r;
INSERT INTO jetnity_at_full_rehearsal.saved_offers_baseline_v1
SELECT true,'667766f5455ff2460f4eb56f04c7a62c84ca9e05',
encode(sha256(convert_to(a.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(a)||jsonb_build_object('proof_not_before',
extract(epoch FROM a.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"offers"}',clock_timestamp()-interval '60 minutes',1 FROM jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a;
INSERT INTO jetnity_at_full_rehearsal.weather_quota_baseline_v1
SELECT true,'9cea63adc4f9bfbdc2bac0bb3a7a48da4dbf5aa83db971a3de47ff5c1d01f7ae',
encode(sha256(convert_to((to_jsonb(o)||jsonb_build_object('proof_not_before',
extract(epoch FROM o.proof_not_before)))::text,'UTF8')),'hex'),
'{"v":"weather"}',clock_timestamp()-interval '50 minutes',1 FROM jetnity_at_full_rehearsal.saved_offers_baseline_v1 o;
INSERT INTO jetnity_at_full_rehearsal.at_source_monitor_baseline_v1
SELECT true,encode(sha256(convert_to(w.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(w)||jsonb_build_object('proof_not_before',
extract(epoch FROM w.proof_not_before)))::text,'UTF8')),'hex'),
jetnity_at_full_rehearsal.catalog_status_v1(),clock_timestamp()-interval '40 minutes',2
FROM jetnity_at_full_rehearsal.weather_quota_baseline_v1 w;
INSERT INTO jetnity_at_full_rehearsal.state_v1
SELECT true,3,0,0,clock_timestamp()-interval '3 hours',
clock_timestamp()-interval '1 second',clock_timestamp()-interval '1 second',
clock_timestamp()-interval '3 seconds',clock_timestamp()-interval '2 seconds',
date_bin(interval '5 minutes',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00'),
date_bin(interval '5 minutes',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00')+interval '5 minutes 30 seconds';
INSERT INTO jetnity_at_full_rehearsal.runs_v1 SELECT last_due,last_started,last_proof_started,last_finished,'complete',generation FROM jetnity_at_full_rehearsal.state_v1;
-- OWNER-GATED PRODUCTION CANDIDATE, NOT YET APPROVED/TESTED END-TO-END.
-- DO NOT RUN ON PRODUCTION WITHOUT USER APPROVAL AND NATIVE PG17 PROOF.
-- Append-only successor BG1 baseline; predecessor is immutable.
-- Only CH ordinary passport/direct-entry visa; 49 others fail closed.
DO $pre$
DECLARE h record;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_batch_switch_v3_target',true)
    IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:AT-BATCH-SWITCH-V3'
 OR to_regclass('jetnity_at_full_rehearsal.at_batch_switch_baseline_v2') IS NOT NULL
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1)<>1
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE active AND username='postgres' AND database='postgres'
    AND ((jobname='jetnity-at-production-source-enqueue-v1' AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_at_full_rehearsal.enqueue_v1()')
    OR (jobname='jetnity-at-production-source-collect-v1' AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_at_full_rehearsal.collect_v1()')
    OR (jobname='jetnity-at-production-source-renew-v1' AND schedule='2-59/5 * * * *'
      AND command='SELECT jetnity_at_full_rehearsal.renew_ch_v1()')))<>3
 OR NOT pg_try_advisory_xact_lock(771106,1)
 OR NOT pg_try_advisory_xact_lock(771112,1)
 OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RAISE EXCEPTION 'AT_BATCH_V3_PREDECESSOR_REJECTED' USING ERRCODE='P7985'; END IF;
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
 FOR h IN SELECT * FROM (VALUES
  ('jetnity_at_full_rehearsal.renew_ch_v1()',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('jetnity_at_full_rehearsal.renew_ch_v1()')),'UTF8')),'hex')),
  ('jetnity_at_full_rehearsal.assert_catalog_v1()',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('jetnity_at_full_rehearsal.assert_catalog_v1()')),'UTF8')),'hex')),
  ('jetnity_at_full_rehearsal.require_open_v1()',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('jetnity_at_full_rehearsal.require_open_v1()')),'UTF8')),'hex')),
  ('jetnity_at_full_rehearsal.visitor_v1(text)',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('jetnity_at_full_rehearsal.visitor_v1(text)')),'UTF8')),'hex')),
  ('jetnity_at_full_rehearsal.public_guard_v1()',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('jetnity_at_full_rehearsal.public_guard_v1()')),'UTF8')),'hex'))
 ) expected(signature,definition_digest) LOOP
 IF to_regprocedure(h.signature) IS NULL
 OR encode(sha256(convert_to(pg_get_functiondef(to_regprocedure(h.signature)),'UTF8')),'hex')
    IS DISTINCT FROM h.definition_digest
 THEN RAISE EXCEPTION 'AT_BATCH_V3_UNEXPECTED_FUNCTION' USING ERRCODE='P7985'; END IF;
 END LOOP;
END $pre$;

CREATE TEMP TABLE at_batch_v3_predecessor(snapshot jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_batch_v3_predecessor SELECT catalog
 FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 WHERE singleton;

CREATE TABLE jetnity_at_full_rehearsal.at_batch_switch_baseline_v2(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_baseline_digest text NOT NULL CHECK(predecessor_baseline_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_full_rehearsal.at_batch_switch_baseline_v2
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_at_full_rehearsal.at_batch_switch_baseline_v2
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_full_rehearsal.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_at_full_rehearsal.at_batch_switch_baseline_v2
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_full_rehearsal.immutable_v1();
REVOKE ALL ON TABLE jetnity_at_full_rehearsal.at_batch_switch_baseline_v2
 FROM PUBLIC,anon,authenticated,service_role;

-- Existing identities and grants are preserved, no new public routines.
CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.visitor_v1(p_citizenship_country_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE f record; b record; method jetnity_at_full_rehearsal.heads_v1%ROWTYPE;
 instant timestamptz; check_count integer; source_count integer;
 source_links jsonb; signed_sources text;
 unavailable jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
BEGIN
 -- Nothing else (including any other passport, destination or document) can
 -- be promoted by a generic 50-passport method approval.
 IF p_citizenship_country_code IS DISTINCT FROM 'CH'
   OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 THEN RETURN unavailable; END IF;
 -- Read the most recently AUTHORISED fact first. A newly queued
 -- network batch is not an accepted replacement until renewal commits.
 instant:=clock_timestamp();
 SELECT * INTO f FROM jetnity_at_full_rehearsal.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN unavailable; END IF;
 SELECT * INTO b FROM jetnity_at_full_rehearsal.watch_batches_v1
 WHERE batch_id=f.source_batch_id;
 IF NOT FOUND OR b.started_at>instant OR b.started_at<=instant-interval '70 minutes'
 THEN RETURN unavailable; END IF;
 SELECT count(*) INTO check_count
 FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=b.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only')
   AND observed_at<=instant AND observed_at>instant-interval '70 minutes';
 SELECT count(*) INTO source_count
 FROM jetnity_at_full_rehearsal.source_pins_v1;
 IF check_count<>3 OR source_count<>3
   OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
   OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE active AND username='postgres'
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
   SELECT 1 FROM jetnity_at_full_rehearsal.watch_observations_v1 o
   WHERE o.batch_id>f.source_batch_id AND o.observed_at<=instant
    AND o.source_status IN('changed','unavailable')
 ) THEN RETURN unavailable; END IF;
 -- Do not keep serving the old fact if an unfinished successor fails to
 -- collect all 3 pinned sources within the established collector deadline.
 IF EXISTS(
   SELECT 1 FROM jetnity_at_full_rehearsal.watch_batches_v1 newer
   WHERE newer.batch_id>f.source_batch_id
    AND newer.started_at<=instant-interval '6 minutes'
    AND ( (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_requests_v1 r
            WHERE r.batch_id=newer.batch_id)<>3
       OR (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_observations_v1 o
            WHERE o.batch_id=newer.batch_id AND o.observed_at<=instant)<>3 )
 ) THEN RETURN unavailable; END IF;
 SELECT * INTO method FROM jetnity_at_full_rehearsal.heads_v1
 WHERE method_id=f.method_id FOR SHARE;
 IF NOT FOUND OR method.epoch<>f.method_epoch THEN RETURN unavailable; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1(
 f.method_id,f.method_revision,f.method_digest,f.package_digest,f.method_epoch);
 SELECT encode(sha256(convert_to(
   string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO signed_sources FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=b.batch_id;
 IF signed_sources IS DISTINCT FROM f.source_digest THEN RETURN unavailable; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
  WHEN 'bmi-general-entry' THEN 1
  WHEN 'bmi-visa-nationality-matrix' THEN 2
  WHEN 'bmeia-bern-how-to-apply' THEN 3 ELSE 4 END)
 INTO source_links FROM jetnity_at_full_rehearsal.source_pins_v1;
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

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.renew_ch_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE latest record; h jetnity_at_full_rehearsal.heads_v1%ROWTYPE;
 previous record; as_of timestamptz; seen timestamptz; digest text; official_count integer;
 expires timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
   OR NOT pg_try_advisory_xact_lock(771112,2)
 THEN RETURN 0; END IF;
 SELECT * INTO latest FROM jetnity_at_full_rehearsal.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1 FOR SHARE;
 as_of:=clock_timestamp();
 IF NOT FOUND OR latest.started_at>as_of
   OR latest.started_at<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 SELECT count(*),min(observed_at) INTO official_count,seen
 FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=latest.batch_id
   AND source_status IN('unchanged_exact','unchanged_asset_version_only');
 IF official_count<>3 OR seen IS NULL OR seen<=as_of-interval '70 minutes' THEN RETURN 0; END IF;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE username='postgres' AND active
    AND jobname IN ('jetnity-at-production-source-enqueue-v1',
                    'jetnity-at-production-source-collect-v1',
                    'jetnity-at-production-source-renew-v1'))<>3
 THEN RETURN 0; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM jetnity_at_full_rehearsal.first_originals_v1 o
   JOIN jetnity_at_full_rehearsal.source_pins_v1 p USING(source_id)
   WHERE o.source_id='bmi-visa-nationality-matrix'
     AND p.original_sha='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
     AND o.raw_sha=p.original_sha AND o.raw_bytes=498415
     AND position('(Stand: 6.11.2026)' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('EU-Freiz&uuml;gigkeit' IN convert_from(o.raw_body,'UTF8'))>0
     AND position('Schweiz' IN convert_from(o.raw_body,'UTF8'))>0)
 THEN RETURN 0; END IF;
 IF EXISTS(
  SELECT 1 FROM jetnity_at_full_rehearsal.watch_observations_v1 r
  JOIN jetnity_at_full_rehearsal.source_pins_v1 p USING(source_id)
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
 SELECT * INTO h FROM jetnity_at_full_rehearsal.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.revision<>1 OR h.method_digest<>
 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
 OR h.package_digest<>
 '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 OR h.epoch<1
 THEN RETURN 0; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',1,
  'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
  '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',h.epoch);
 SELECT * INTO previous FROM jetnity_at_full_rehearsal.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1 FOR SHARE;
 -- Once any official source is actually changed, do NOT auto-renew a
 -- later reverted source under the old method. Owner requalification required.
 IF FOUND AND EXISTS(
   SELECT 1 FROM jetnity_at_full_rehearsal.watch_observations_v1 o
   WHERE o.batch_id>previous.source_batch_id AND o.batch_id<=latest.batch_id
     AND o.source_status='changed'
 ) THEN RETURN 0; END IF;
 IF FOUND AND (previous.source_batch_id=latest.batch_id
   OR previous.source_checked_at>=seen) THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(
   source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM jetnity_at_full_rehearsal.watch_observations_v1
 WHERE batch_id=latest.batch_id;
 IF digest IS NULL THEN RETURN 0; END IF;
 as_of:=clock_timestamp();
 expires:=least(as_of+interval '1 hour',seen+interval '70 minutes',
   '2027-11-16T00:00:00Z'::timestamptz);
 IF expires<=as_of OR as_of>=seen+interval '70 minutes'
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 INSERT INTO jetnity_at_full_rehearsal.ch_visa_facts_v1(
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
   PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
   RETURN 1;
 END IF;
 RETURN 0;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $function$;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE switch_v2 jetnity_at_full_rehearsal.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_full_rehearsal.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_full_rehearsal.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_full_rehearsal.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_full_rehearsal.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_full_rehearsal.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_full_rehearsal.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT weather FROM jetnity_at_full_rehearsal.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_full_rehearsal.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_full_rehearsal.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_full_rehearsal.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_full_rehearsal.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_full_rehearsal.baselines_v1 WHERE component='all')
    OR predecessor.predecessor_baselines_digest IS DISTINCT FROM encode(sha256(convert_to(old_baselines::text,'UTF8')),'hex')
    OR rolling.predecessor_provider_digest<>'ac8612bde7fb4b418ee7df565e388fa52bf2b1db22cf2035393b5854151e5ddc'
    OR rolling.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(predecessor.catalog::text,'UTF8')),'hex')
    OR rolling.predecessor_status_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(predecessor)
      ||jsonb_build_object('proof_not_before',extract(epoch FROM predecessor.proof_not_before)))::text,'UTF8')),'hex')
    OR rolling.policy IS DISTINCT FROM (SELECT to_jsonb(p)||jsonb_build_object('installed_at',extract(epoch FROM p.installed_at))
      FROM jetnity_at_full_rehearsal.rolling_policy_v2 p)
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
    OR switch_v2.catalog IS DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_full_rehearsal.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  SELECT * INTO s FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_full_rehearsal.status_baseline_v1 b CROSS JOIN jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_full_rehearsal.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_full_rehearsal.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.public_guard_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE required_proof bigint; earliest_proof timestamptz; current_state jetnity_at_full_rehearsal.state_v1%ROWTYPE;
  unavailable_value jsonb:=jsonb_build_object('schema',1,'status','unavailable');
BEGIN
  IF jetnity_at_full_rehearsal.alarm_status_v1() IS DISTINCT FROM jsonb_build_object('schema',1,'status','current') THEN RETURN unavailable_value; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_full_rehearsal.status_baseline_v1 b CROSS JOIN jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_full_rehearsal.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_full_rehearsal.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT * INTO STRICT current_state FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton;
  IF current_state.generation<required_proof OR current_state.last_proof_started<earliest_proof
    OR current_state.incident_generation<>current_state.resumed_generation
    OR current_state.last_finished>current_state.last_started+interval '30 seconds'
    OR current_state.valid_until<>current_state.last_due+interval '5 minutes 30 seconds'
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.runs_v1 run
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
 new_catalog:=jetnity_at_full_rehearsal.catalog_status_v1();
 SELECT count(*) INTO drift FROM jsonb_each(old_catalog) orig
 WHERE CASE
   WHEN orig.key IN (
     'function:'||to_regprocedure('jetnity_at_full_rehearsal.renew_ch_v1()')::oid,
     'function:'||to_regprocedure('jetnity_at_full_rehearsal.assert_catalog_v1()')::oid,
     'function:'||to_regprocedure('jetnity_at_full_rehearsal.require_open_v1()')::oid,
     'function:'||to_regprocedure('jetnity_at_full_rehearsal.visitor_v1(text)')::oid,
     'function:'||to_regprocedure('jetnity_at_full_rehearsal.public_guard_v1()')::oid)
   THEN (orig.value-'definition') IS DISTINCT FROM ((new_catalog->orig.key)-'definition')
   ELSE orig.value IS DISTINCT FROM new_catalog->orig.key END;
 IF drift<>0 THEN RAISE EXCEPTION 'AT_BATCH_V3_PREDECESSOR_CATALOG_DRIFT'
 USING ERRCODE='P7985'; END IF;
END $comparison$;

INSERT INTO jetnity_at_full_rehearsal.at_batch_switch_baseline_v2(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(old.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(old)||jsonb_build_object('proof_not_before',
   extract(epoch FROM old.proof_not_before)))::text,'UTF8')),'hex'),
 state.generation+1,clock_timestamp(),jetnity_at_full_rehearsal.catalog_status_v1()
FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 old
CROSS JOIN jetnity_at_full_rehearsal.state_v1 state
WHERE old.singleton AND state.singleton;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2)<>1
 OR EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 v
     WHERE v.proof_not_before<=(SELECT last_proof_started
       FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton))
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
 OR NOT has_function_privilege('anon','jetnity_at_full_rehearsal.visitor_v1(text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','jetnity_at_full_rehearsal.visitor_v1(text)','EXECUTE')
 OR has_schema_privilege('anon','official_v3_guard_private','USAGE')
 OR has_table_privilege('anon','jetnity_at_full_rehearsal.at_batch_switch_baseline_v2','SELECT')
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'unavailable'
 OR jetnity_at_full_rehearsal.visitor_v1('CH')->>'status'<>'unavailable'
 OR jetnity_at_full_rehearsal.visitor_v1('IN')->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'AT_BATCH_V3_INSTALL_MUST_FAIL_CLOSED' USING ERRCODE='P7985'; END IF;
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
END $post$;
-- Fresh full 5-minute BG1 audit and exact Owner-controlled release readback
-- must follow; never force an audit lease or update immutable evidence.

DO $before$ BEGIN
PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
IF jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'unavailable' THEN RAISE EXCEPTION 'new proof not required'; END IF;
END $before$;
SELECT pg_sleep(2);
UPDATE jetnity_at_full_rehearsal.state_v1 SET generation=generation+1,last_proof_started=clock_timestamp()-interval '0.3 seconds',last_started=clock_timestamp()-interval '0.5 seconds',last_finished=clock_timestamp()-interval '0.1 seconds',last_observed=clock_timestamp()-interval '0.1 seconds';
INSERT INTO jetnity_at_full_rehearsal.runs_v1 SELECT last_due,last_started,last_proof_started,last_finished,'complete',generation FROM jetnity_at_full_rehearsal.state_v1;
DO $final$ BEGIN
PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
IF jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current' THEN RAISE EXCEPTION 'proof remained unavailable'; END IF;
PERFORM jetnity_at_full_rehearsal.require_open_v1();
BEGIN UPDATE jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 SET required_generation=1;
RAISE EXCEPTION 'baseline mutation succeeded'; EXCEPTION WHEN SQLSTATE 'P7901' THEN NULL; END;
END $final$;
SELECT (SELECT count(*) FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2) AS shadow_successor_count,jetnity_at_full_rehearsal.public_guard_v1()->>'status' AS status;

-- New Dev-only append-only Production-v4 source + BG1 precursor setup.
ALTER TABLE jetnity_at_full_rehearsal.source_pins_v1 ADD COLUMN research_only boolean NOT NULL DEFAULT true,
 ADD COLUMN source_qualified boolean NOT NULL DEFAULT false;
ALTER TABLE jetnity_at_full_rehearsal.first_originals_v1 ADD COLUMN legal_source_approved boolean NOT NULL DEFAULT false,
 ADD COLUMN customer_rule_approved boolean NOT NULL DEFAULT false;
UPDATE jetnity_at_full_rehearsal.first_originals_v1 old
 SET raw_body=research.original_body,raw_sha=encode(sha256(research.original_body),'hex'),
 raw_bytes=octet_length(research.original_body)
 FROM official_v3_at_private.whole_originals_v2 research
 WHERE old.source_id=research.source_id;
ALTER TABLE jetnity_at_full_rehearsal.heads_v1 ADD COLUMN status text NOT NULL DEFAULT 'approved';
UPDATE jetnity_at_full_rehearsal.heads_v1 SET revision=2,epoch=2,
 method_digest='fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e',
 package_digest='6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',
 status='approved';
CREATE UNIQUE INDEX shadow_watch_requests_key ON jetnity_at_full_rehearsal.watch_requests_v1(batch_id,source_id);
CREATE UNIQUE INDEX shadow_watch_observations_key ON jetnity_at_full_rehearsal.watch_observations_v1(batch_id,source_id);
CREATE TABLE jetnity_at_full_rehearsal.mock_http_response(id bigint PRIMARY KEY,status_code integer,timed_out boolean,error_msg text,content text);
CREATE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'NATIVE_SHADOW_APPEND_ONLY' USING ERRCODE='P7979'; END $deny$;
CREATE FUNCTION jetnity_at_full_rehearsal.cron_schedule(name text,timing text,cmd text)
 RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $schedule$
BEGIN
 INSERT INTO jetnity_at_full_rehearsal.cron_job(jobname,active,username,database,schedule,command)
 VALUES(name,true,'postgres','postgres',timing,cmd);
 RETURN 42;
END $schedule$;
CREATE FUNCTION jetnity_at_full_rehearsal.cron_unschedule(name text)
 RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $unschedule$
DECLARE n bigint;
BEGIN
 DELETE FROM jetnity_at_full_rehearsal.cron_job WHERE jobname=name;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $unschedule$;
CREATE TABLE jetnity_at_full_rehearsal.bg1_transient_baseline_v3(
singleton boolean PRIMARY KEY,predecessor_catalog_digest text,predecessor_baseline_digest text,
required_generation bigint,proof_not_before timestamptz,catalog jsonb);
CREATE TABLE jetnity_at_full_rehearsal.query_cost_baseline_v1(
singleton boolean PRIMARY KEY,algorithm text,predecessor_catalog_digest text,predecessor_baseline_digest text,
catalog jsonb);
CREATE TABLE jetnity_at_full_rehearsal.bg1_production_http_allocator_v4(
singleton boolean PRIMARY KEY,predecessor_catalog_digest text,predecessor_baseline_digest text,
publisher_function_digest text,transport_metadata jsonb,transport_metadata_digest text,
required_generation bigint,proof_not_before timestamptz,catalog jsonb);
INSERT INTO jetnity_at_full_rehearsal.bg1_transient_baseline_v3
SELECT true,encode(sha256(convert_to(s.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(s)||jsonb_build_object('proof_not_before',extract(epoch FROM s.proof_not_before)))::text,'UTF8')),'hex'),
3,clock_timestamp()-interval '1 hour',jsonb_build_object('fixture','bg1_v3')
FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 s WHERE singleton;
INSERT INTO jetnity_at_full_rehearsal.query_cost_baseline_v1
SELECT true,'jsonb_unique_narrow_dependency_distinct_v1',
 encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 jsonb_build_object('fixture','optimized')
FROM jetnity_at_full_rehearsal.bg1_transient_baseline_v3 v WHERE singleton;
INSERT INTO jetnity_at_full_rehearsal.bg1_production_http_allocator_v4
SELECT true,
 encode(sha256(convert_to(o.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to(to_jsonb(o)::text,'UTF8')),'hex'),
 encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.renew_ch_v1()'::regprocedure),'UTF8')),'hex'),
 jetnity_at_full_rehearsal.catalog_status_v1()->'transport:production_http_id_allocator_v4',
 encode(sha256(convert_to((jetnity_at_full_rehearsal.catalog_status_v1()->'transport:production_http_id_allocator_v4')::text,'UTF8')),'hex'),
4,(SELECT last_proof_started-interval '0.3 seconds' FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton),
 jetnity_at_full_rehearsal.catalog_status_v1()
FROM jetnity_at_full_rehearsal.query_cost_baseline_v1 o WHERE singleton;
CREATE TABLE jetnity_at_full_rehearsal.expected_legacy_parent_sha(fqn text PRIMARY KEY,sha text NOT NULL);
INSERT INTO jetnity_at_full_rehearsal.expected_legacy_parent_sha VALUES
('assert_catalog_v1',encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.assert_catalog_v1()'::regprocedure),'UTF8')),'hex')),
('catalog_status_v1',encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.catalog_status_v1()'::regprocedure),'UTF8')),'hex')),
('require_open_v1',encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.require_open_v1()'::regprocedure),'UTF8')),'hex')),
('visitor_v1',encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.visitor_v1(text)'::regprocedure),'UTF8')),'hex'));
CREATE TABLE jetnity_at_full_rehearsal.expected_baseline_sha(
 bg1_v3_sha text, optimized_sha text);
INSERT INTO jetnity_at_full_rehearsal.expected_baseline_sha
SELECT encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to(o.catalog::text,'UTF8')),'hex')
 FROM jetnity_at_full_rehearsal.bg1_transient_baseline_v3 v CROSS JOIN jetnity_at_full_rehearsal.query_cost_baseline_v1 o;
DO $native_pre$
BEGIN
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1 o JOIN jetnity_at_full_rehearsal.source_pins_v1 p USING(source_id)
 WHERE o.raw_sha=p.original_sha AND o.raw_bytes=p.original_bytes AND NOT o.legal_source_approved AND NOT o.customer_rule_approved)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4)<>1
 OR (SELECT transport_metadata IS DISTINCT FROM catalog->'transport:production_http_id_allocator_v4' FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 WHERE singleton)
 OR (SELECT publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
 FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 WHERE singleton)
 THEN RAISE EXCEPTION 'DEV_PG17_FULL_V1_V4_SHADOW_PRECONDITION_FAILED'; END IF;
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
 PERFORM jetnity_at_full_rehearsal.require_open_v1();
END $native_pre$;
SELECT jsonb_build_object('native','PG17_PROD_V1_V4_BASELINE_READY',
'BG1_state',(SELECT jsonb_build_object('gen',generation,'last_proof',last_proof_started) FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton),
'v4_frozen_catalog_digest',(SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 WHERE singleton),
'old_originals_unchanged',true,'old_source_jobs',(SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job),
'old_method_epoch_simulated',2,'scope_only_dev',true,'rolled_back',true) AS proof;

-- The original native-V1 fixture predates pg_cron's native jobid metadata.
-- Add its native identity field *only inside this rolled-back schema*.
ALTER TABLE jetnity_at_full_rehearsal.cron_job ADD COLUMN jobid bigint GENERATED BY DEFAULT AS IDENTITY;
-- Dev-only namespace-mapped exact Production-V1/BG1-V5 install SQL, tested with full rollback.
-- PREPARED ONLY. Do not run on Production without a NEW SHA-exact Owner COMMIT Go.
-- Project MUST be selected outside SQL as Supabase Production qscbgcdmivbbnzrcyegn.
-- Exact snapshot: CATALOG-READBACK.json at 2026-11-22T21:03:32.563156Z.
-- Only Swiss ordinary valid passport, direct entry to Austria, visa not required.
-- Old V1 facts/pins/originals, CHDE jobs/dispatches, HTTP ID allocator, MFA and roles unchanged.
-- Begin inherits single Dev rollback transaction.
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='1s';
SET LOCAL idle_in_transaction_session_timeout='50s';
SET LOCAL jetnity.at_prod_ch_v2_target='production:qscbgcdmivbbnzrcyegn:CH_AT_DIRECT_VISA_V2';
DO $pre$
DECLARE latest record; allowed boolean;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR current_database()<>'postgres' OR current_setting('server_version_num')::integer/10000<>17
  OR current_setting('jetnity.at_prod_ch_v2_target',true)
       IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:CH_AT_DIRECT_VISA_V2'
  OR current_setting('session_replication_role') NOT IN('origin','local')
  OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
  OR to_regclass('jetnity_at_full_rehearsal.first_originals_v1') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.watch_observations_v1') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.source_pins_v1') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.ch_visa_facts_v1') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.bg1_production_http_allocator_v4') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.mock_http_response') IS NULL
  OR to_regclass('jetnity_at_full_rehearsal.ch_source_qualifications_v2') IS NOT NULL
  OR to_regclass('jetnity_at_full_rehearsal.ch_visa_facts_v2') IS NOT NULL
  OR to_regclass('jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5') IS NOT NULL
  OR to_regclass('jetnity_at_full_rehearsal.bg1_prod_ch_at_rollback_v6') IS NOT NULL
  OR to_regprocedure('jetnity_at_full_rehearsal.renew_ch_v2()') IS NOT NULL
  OR to_regprocedure('jetnity_at_full_rehearsal.read_ch_v2(text)') IS NOT NULL
  OR EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.cron_job WHERE jobname='jetnity-at-production-source-qualified-renew-v2')
  OR NOT pg_try_advisory_xact_lock(771916,1)
  OR NOT pg_try_advisory_xact_lock(771918,22)
 THEN RAISE EXCEPTION 'AT_PROD_V2_CONTEXT_OR_BASELINE_STOP' USING ERRCODE='P7905'; END IF;
 IF (SELECT encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.assert_catalog_v1()'::regprocedure),'UTF8')),'hex')) IS DISTINCT FROM (SELECT sha FROM jetnity_at_full_rehearsal.expected_legacy_parent_sha WHERE fqn='assert_catalog_v1')
  OR (SELECT encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.catalog_status_v1()'::regprocedure),'UTF8')),'hex')) IS DISTINCT FROM (SELECT sha FROM jetnity_at_full_rehearsal.expected_legacy_parent_sha WHERE fqn='catalog_status_v1')
  OR (SELECT encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.require_open_v1()'::regprocedure),'UTF8')),'hex')) IS DISTINCT FROM (SELECT sha FROM jetnity_at_full_rehearsal.expected_legacy_parent_sha WHERE fqn='require_open_v1')
  OR (SELECT encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.visitor_v1(text)'::regprocedure),'UTF8')),'hex')) IS DISTINCT FROM (SELECT sha FROM jetnity_at_full_rehearsal.expected_legacy_parent_sha WHERE fqn='visitor_v1')
 THEN RAISE EXCEPTION 'AT_PROD_V2_STALE_FUNCTION_PARENT' USING ERRCODE='P7905'; END IF;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
  OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
  OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1 p
    JOIN jetnity_at_full_rehearsal.first_originals_v1 o USING(source_id)
    WHERE p.research_only AND NOT p.source_qualified AND o.raw_sha=p.original_sha
      AND o.raw_bytes=p.original_bytes AND encode(sha256(o.raw_body),'hex')=o.raw_sha
      AND NOT o.legal_source_approved AND NOT o.customer_rule_approved)<>3
  OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.source_pins_v1
    WHERE source_id='bmi-visa-nationality-matrix' AND original_sha=
      'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
      AND original_bytes=498415)
  OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.source_pins_v1
    WHERE source_id='bmi-general-entry' AND original_sha=
      'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'
      AND original_bytes=91655)
  OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.source_pins_v1
    WHERE source_id='bmeia-bern-how-to-apply'
      AND original_sha='7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18'
      AND original_bytes=172460)
  OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE active AND username='postgres' AND database='postgres'
      AND ((jobname='jetnity-at-production-source-enqueue-v1'
        AND schedule='*/5 * * * *'
        AND command='SELECT jetnity_at_full_rehearsal.enqueue_v1()')
        OR (jobname='jetnity-at-production-source-collect-v1'
        AND schedule='*/5 * * * *'
        AND command='SELECT jetnity_at_full_rehearsal.collect_v1()')
        OR (jobname='jetnity-at-production-source-renew-v1'
        AND schedule='2-59/5 * * * *'
        AND command='SELECT jetnity_at_full_rehearsal.renew_ch_v1()')))<>3
 THEN RAISE EXCEPTION 'AT_PROD_V2_HISTORIC_SOURCE_OR_CRON_MISMATCH' USING ERRCODE='P7905'; END IF;
 IF (SELECT publisher_function_digest IS DISTINCT FROM
      encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.renew_ch_v1()'::regprocedure),'UTF8')),'hex')
      OR catalog IS DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1()
      FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 WHERE singleton)
 THEN RAISE EXCEPTION 'AT_PROD_V2_HTTP_V4_PUBLISHER_OR_CATALOG_MISMATCH' USING ERRCODE='P7905'; END IF;
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
 PERFORM jetnity_at_full_rehearsal.require_open_v1();
END $pre$;
-- GENERATED TARGET BODY. No BEGIN/COMMIT; NEVER execute alone.
-- Intended only after the separate exact Production-V1 installer precheck and BG1-v5 guard.
-- Existing V1 source pins, originals, facts, cron jobs and HTTP allocator remain immutable.

CREATE TABLE jetnity_at_full_rehearsal.ch_source_qualifications_v2(
 source_id text PRIMARY KEY REFERENCES jetnity_at_full_rehearsal.source_pins_v1(source_id),
 official_url text NOT NULL,
 accepted_sha text NOT NULL CHECK(accepted_sha ~ '^[a-f0-9]{64}$'),
 accepted_bytes integer NOT NULL CHECK(accepted_bytes BETWEEN 1 AND 1048576),
 expected_watch_state text NOT NULL CHECK(expected_watch_state IN ('unchanged_exact','changed')),
 semantic_scope text NOT NULL CHECK(semantic_scope='CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY'),
 owner_semantic_review text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE jetnity_at_full_rehearsal.ch_source_qualifications_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_full_rehearsal.ch_source_qualifications_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_full_rehearsal.ch_source_qualifications_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_at_full_rehearsal.ch_source_qualifications_v2
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_at_full_rehearsal.ch_source_qualifications_v2
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
REVOKE ALL ON jetnity_at_full_rehearsal.ch_source_qualifications_v2 FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO jetnity_at_full_rehearsal.ch_source_qualifications_v2
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
-- only after jetnity_at_full_rehearsal.mock_http_response status 200, exact SHA/size and native request link.
CREATE TABLE jetnity_at_full_rehearsal.ch_source_originals_v2(
 source_id text PRIMARY KEY REFERENCES jetnity_at_full_rehearsal.ch_source_qualifications_v2(source_id),
 batch_id bigint NOT NULL,
 stored_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 raw_body bytea NOT NULL CHECK(octet_length(raw_body) BETWEEN 1 AND 1048576),
 raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
 FOREIGN KEY(batch_id,source_id) REFERENCES jetnity_at_full_rehearsal.watch_observations_v1(batch_id,source_id)
);
ALTER TABLE jetnity_at_full_rehearsal.ch_source_originals_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_full_rehearsal.ch_source_originals_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_full_rehearsal.ch_source_originals_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_at_full_rehearsal.ch_source_originals_v2
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_at_full_rehearsal.ch_source_originals_v2
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
REVOKE ALL ON jetnity_at_full_rehearsal.ch_source_originals_v2 FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE jetnity_at_full_rehearsal.ch_visa_facts_v2(
 version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_batch_id bigint NOT NULL UNIQUE REFERENCES jetnity_at_full_rehearsal.watch_batches_v1(batch_id),
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
ALTER TABLE jetnity_at_full_rehearsal.ch_visa_facts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_full_rehearsal.ch_visa_facts_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_full_rehearsal.ch_visa_facts_v2 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_at_full_rehearsal.ch_visa_facts_v2
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_at_full_rehearsal.ch_visa_facts_v2
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_full_rehearsal.deny_mutation_v1();
REVOKE ALL ON jetnity_at_full_rehearsal.ch_visa_facts_v2 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE jetnity_at_full_rehearsal.ch_visa_facts_v2_version_id_seq FROM PUBLIC,anon,authenticated,service_role;

-- Inputs never grant authority: real V1 watcher, its exact SHA and time are read again.
CREATE FUNCTION jetnity_at_full_rehearsal.batch_qualified_ch_v2(p_batch bigint)
 RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $qualified$
DECLARE instant_at timestamptz:=clock_timestamp(); started timestamptz;
BEGIN
 IF p_batch IS NULL OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.source_pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.first_originals_v1)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_originals_v2)>3
 THEN RETURN false; END IF;
 SELECT started_at INTO started FROM jetnity_at_full_rehearsal.watch_batches_v1 WHERE batch_id=p_batch;
 IF NOT FOUND OR started>instant_at OR started<=instant_at-interval '70 minutes' THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_requests_v1 WHERE batch_id=p_batch)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_observations_v1 WHERE batch_id=p_batch)<>3
 THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_observations_v1 o
   JOIN jetnity_at_full_rehearsal.ch_source_qualifications_v2 q USING(source_id)
   JOIN jetnity_at_full_rehearsal.watch_requests_v1 r USING(batch_id,source_id)
   WHERE o.batch_id=p_batch AND o.http_status=200
    AND o.observed_at>r.requested_at AND o.observed_at<=r.requested_at+interval '6 minutes 10 seconds'
    AND o.observed_at<=instant_at AND r.requested_at=started
    AND o.source_status=q.expected_watch_state
    AND o.body_sha=q.accepted_sha AND o.bytes=q.accepted_bytes)<>3 THEN RETURN false; END IF;
 -- Even a single newer mismatch means immediate fail-closed, regardless of
 -- whether the still-running successor batch is complete.
 IF EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.watch_observations_v1 o
    JOIN jetnity_at_full_rehearsal.ch_source_qualifications_v2 q USING(source_id)
    WHERE o.batch_id>p_batch AND
      (o.source_status IS DISTINCT FROM q.expected_watch_state
       OR o.body_sha IS DISTINCT FROM q.accepted_sha
       OR o.bytes IS DISTINCT FROM q.accepted_bytes OR o.http_status IS DISTINCT FROM 200))
 OR EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.watch_batches_v1 b
    WHERE b.batch_id>p_batch AND b.started_at<=instant_at-interval '6 minutes 10 seconds'
      AND (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_observations_v1 o
            WHERE o.batch_id=b.batch_id)<>3)
 THEN RETURN false; END IF;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $qualified$;
REVOKE ALL ON FUNCTION jetnity_at_full_rehearsal.batch_qualified_ch_v2(bigint)
 FROM PUBLIC,anon,authenticated,service_role;

-- Natural scheduler job is installed separately in the same transaction.
-- It cannot approve a method or synthesize an owner receipt.
CREATE FUNCTION jetnity_at_full_rehearsal.renew_ch_v2()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $renew$
DECLARE b bigint; now_at timestamptz; checked timestamptz; h jetnity_at_full_rehearsal.heads_v1%ROWTYPE;
 total integer; inserted integer:=0; digest text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR to_regclass('jetnity_at_full_rehearsal.bg1_prod_ch_at_rollback_v6') IS NOT NULL
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771918,22)
 THEN RETURN 0; END IF;
 PERFORM jetnity_at_full_rehearsal.require_open_v1();
 SELECT * INTO h FROM jetnity_at_full_rehearsal.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.status<>'approved' OR h.revision<>2 OR h.epoch<=1
 OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RETURN 0; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1(
  'jetnity-destination-primary-at-visa',2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT batch_id INTO b FROM jetnity_at_full_rehearsal.watch_batches_v1 x
 WHERE (SELECT count(*) FROM jetnity_at_full_rehearsal.watch_observations_v1 o
        WHERE o.batch_id=x.batch_id)=3
 ORDER BY batch_id DESC LIMIT 1;
 IF b IS NULL OR NOT jetnity_at_full_rehearsal.batch_qualified_ch_v2(b) THEN RETURN 0; END IF;
 now_at:=clock_timestamp();
 SELECT min(o.observed_at) INTO checked FROM jetnity_at_full_rehearsal.watch_observations_v1 o
 WHERE o.batch_id=b;
 IF checked IS NULL OR checked>now_at OR checked<=now_at-interval '70 minutes' THEN RETURN 0; END IF;
 -- Retain exact original bytes only from V1-approved genuine HTTP 200 requests.
 INSERT INTO jetnity_at_full_rehearsal.ch_source_originals_v2(source_id,batch_id,raw_body)
 SELECT q.source_id,b,convert_to(netresp.content,'UTF8')
 FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2 q
 JOIN jetnity_at_full_rehearsal.watch_requests_v1 req ON req.source_id=q.source_id AND req.batch_id=b
 JOIN jetnity_at_full_rehearsal.watch_observations_v1 obs ON obs.batch_id=req.batch_id AND obs.source_id=req.source_id
 JOIN jetnity_at_full_rehearsal.mock_http_response netresp ON netresp.id=req.request_id
 WHERE netresp.status_code=200 AND netresp.timed_out IS FALSE AND netresp.error_msg IS NULL
  AND encode(sha256(convert_to(netresp.content,'UTF8')),'hex')=q.accepted_sha
  AND octet_length(convert_to(netresp.content,'UTF8'))=q.accepted_bytes
  AND obs.body_sha=q.accepted_sha AND obs.bytes=q.accepted_bytes
 ON CONFLICT(source_id) DO NOTHING;
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_originals_v2)<>3
 OR EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.ch_source_originals_v2 orig
     JOIN jetnity_at_full_rehearsal.ch_source_qualifications_v2 q USING(source_id)
     WHERE orig.raw_sha<>q.accepted_sha OR orig.raw_bytes<>q.accepted_bytes)
 THEN RETURN 0; END IF;
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM jetnity_at_full_rehearsal.watch_observations_v1 WHERE batch_id=b;
 IF digest IS NULL THEN RETURN 0; END IF;
 INSERT INTO jetnity_at_full_rehearsal.ch_visa_facts_v2(
 source_batch_id,method_epoch,source_digest,source_checked_at,verified_at,expires_at)
 VALUES(b,h.epoch,digest,checked,now_at,LEAST(checked+interval '70 minutes',now_at+interval '1 hour'))
 ON CONFLICT(source_batch_id) DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 RETURN inserted;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $renew$;
REVOKE ALL ON FUNCTION jetnity_at_full_rehearsal.renew_ch_v2()
 FROM PUBLIC,anon,authenticated,service_role;

-- Only existing public RPC is used by the website; this private reader
-- cannot be called directly by anon, authenticated or service_role.
CREATE FUNCTION jetnity_at_full_rehearsal.read_ch_v2(p_citizenship text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $reader$
DECLARE none jsonb:=jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 f jetnity_at_full_rehearsal.ch_visa_facts_v2%ROWTYPE;
 h jetnity_at_full_rehearsal.heads_v1%ROWTYPE; now_at timestamptz:=clock_timestamp();
 digest text; links jsonb;
BEGIN
 IF p_citizenship IS DISTINCT FROM 'CH'
 OR to_regclass('jetnity_at_full_rehearsal.bg1_prod_ch_at_rollback_v6') IS NOT NULL
 OR jetnity_at_full_rehearsal.public_guard_v1()->>'status'<>'current'
 THEN RETURN none; END IF;
 PERFORM jetnity_at_full_rehearsal.require_open_v1();
 SELECT * INTO f FROM jetnity_at_full_rehearsal.ch_visa_facts_v2 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR f.source_checked_at>now_at OR f.verified_at>now_at
 OR now_at>=f.expires_at OR now_at>=f.source_checked_at+interval '70 minutes'
 OR f.method_revision<>2 OR f.method_epoch<=1 OR f.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
 OR f.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 OR NOT jetnity_at_full_rehearsal.batch_qualified_ch_v2(f.source_batch_id)
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_originals_v2)<>3
 THEN RETURN none; END IF;
 SELECT * INTO h FROM jetnity_at_full_rehearsal.heads_v1
 WHERE method_id='jetnity-destination-primary-at-visa' FOR SHARE;
 IF NOT FOUND OR h.epoch<>f.method_epoch OR h.status<>'approved'
 OR h.revision<>2 OR h.method_digest<>'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e' OR h.package_digest<>'6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0'
 THEN RETURN none; END IF;
 PERFORM jetnity_at_full_rehearsal.require_current_locked_v1('jetnity-destination-primary-at-visa',
 2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0',h.epoch);
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 INTO digest FROM jetnity_at_full_rehearsal.watch_observations_v1 WHERE batch_id=f.source_batch_id;
 IF digest IS DISTINCT FROM f.source_digest THEN RETURN none; END IF;
 SELECT jsonb_agg(official_url ORDER BY CASE source_id
    WHEN 'bmi-general-entry' THEN 1 WHEN 'bmi-visa-nationality-matrix' THEN 2 ELSE 3 END)
 INTO links FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2;
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
REVOKE ALL ON FUNCTION jetnity_at_full_rehearsal.read_ch_v2(text)
 FROM PUBLIC,anon,authenticated,service_role;

-- Reuse the existing externally allowed public RPC and preserve its ACL and
-- exact return schema. No direct privilege on private source/reader tables.
CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.visitor_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
AS $public_v2$
BEGIN
 IF p_citizenship_country_code IS DISTINCT FROM 'CH' THEN
  RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
 END IF;
 RETURN jetnity_at_full_rehearsal.read_ch_v2(p_citizenship_country_code);
EXCEPTION WHEN OTHERS THEN
 RETURN jsonb_build_object('status','unavailable','destinationCountryCode','AT');
END $public_v2$;
-- CREATE OR REPLACE preserves existing public RPC grants. Do not grant private rights.

-- PRODUCTION V1 BG1-v5 guarded successor. Body fragment only; never run separately.
-- All three existing old ATPROD source jobs, V1 issuer, immutable originals and HTTP allocator stay byte-identical.
-- New fourth CRON local job is included in catalog_status hash; no external service or key.
SELECT jetnity_at_full_rehearsal.cron_schedule('jetnity-at-production-source-qualified-renew-v2','2-59/5 * * * *',
 'SELECT jetnity_at_full_rehearsal.renew_ch_v2()');
CREATE TABLE jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5(
 singleton boolean PRIMARY KEY CHECK(singleton),
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 qualified_source_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5
 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 FROM PUBLIC,anon,authenticated,service_role;
-- Exactly one bootstrap transition while catalog='{}' is allowed. Thereafter immutable.
CREATE FUNCTION jetnity_at_full_rehearsal.at_v5_bootstrap_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $imm$
BEGIN
 IF TG_OP='UPDATE' AND OLD.catalog='{}'::jsonb AND NEW.catalog<>'{}'::jsonb
 AND NEW.predecessor_catalog_digest IS NOT DISTINCT FROM OLD.predecessor_catalog_digest
 AND NEW.predecessor_baseline_digest IS NOT DISTINCT FROM OLD.predecessor_baseline_digest
 AND NEW.qualified_source_digest IS NOT DISTINCT FROM OLD.qualified_source_digest
 AND NEW.required_generation IS NOT DISTINCT FROM OLD.required_generation
 AND NEW.proof_not_before IS NOT DISTINCT FROM OLD.proof_not_before
 AND current_user='postgres' AND session_user='postgres' THEN
  RETURN NEW;
 END IF;
 RAISE EXCEPTION 'CH_AT_PROD_V5_APPEND_ONLY_BASELINE' USING ERRCODE='P7905';
END $imm$;
REVOKE ALL ON FUNCTION jetnity_at_full_rehearsal.at_v5_bootstrap_immutable() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER at_v5_immutable BEFORE UPDATE OR DELETE ON jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_full_rehearsal.at_v5_bootstrap_immutable();
CREATE TRIGGER at_v5_no_truncate BEFORE TRUNCATE ON jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_full_rehearsal.at_v5_bootstrap_immutable();
INSERT INTO jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5(
 singleton,predecessor_catalog_digest,predecessor_baseline_digest,
 qualified_source_digest,required_generation,proof_not_before,catalog)
SELECT true,
 encode(sha256(convert_to(parent.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(parent)||
   jsonb_build_object('proof_not_before',extract(epoch FROM parent.proof_not_before)))::text,'UTF8')),'hex'),
 (SELECT encode(sha256(convert_to(string_agg(source_id||':'||accepted_sha||':'||accepted_bytes::text||':'||
    expected_watch_state,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
    FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2),
 s.generation+1,clock_timestamp(),'{}'::jsonb
FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 parent
CROSS JOIN jetnity_at_full_rehearsal.state_v1 s WHERE parent.singleton AND s.singleton;

-- Production catalog compiled under diagnostic alias; isolated test catalog monitors mapped V5/V6 objects and Cron.
CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.catalog_status_snapshot_prod_v1()
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
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','jetnity_bg1_alarm_kind_v2','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'))
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
 FROM (SELECT * FROM jetnity_at_full_rehearsal.cron_job
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

CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE ch_at_v5 jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5%ROWTYPE;
 allocator_v4 jetnity_at_full_rehearsal.bg1_production_http_allocator_v4%ROWTYPE;
 optimized jetnity_at_full_rehearsal.query_cost_baseline_v1%ROWTYPE;
 bg1_v3 jetnity_at_full_rehearsal.bg1_transient_baseline_v3%ROWTYPE;
 switch_v2 jetnity_at_full_rehearsal.at_batch_switch_baseline_v2%ROWTYPE;
 at_prod jetnity_at_full_rehearsal.at_source_monitor_baseline_v1%ROWTYPE;
 weather jetnity_at_full_rehearsal.weather_quota_baseline_v1%ROWTYPE;
  offers jetnity_at_full_rehearsal.saved_offers_baseline_v1%ROWTYPE;
  admin jetnity_at_full_rehearsal.admin_runtime_baseline_v1%ROWTYPE;
  predecessor jetnity_at_full_rehearsal.status_baseline_v1%ROWTYPE;
  rolling jetnity_at_full_rehearsal.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7905'; END IF;
  SELECT * INTO STRICT ch_at_v5 FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 WHERE singleton;
  SELECT * INTO STRICT allocator_v4 FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 WHERE singleton;
  SELECT * INTO STRICT optimized FROM jetnity_at_full_rehearsal.query_cost_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT bg1_v3 FROM jetnity_at_full_rehearsal.bg1_transient_baseline_v3 WHERE singleton;
  SELECT * INTO STRICT weather FROM jetnity_at_full_rehearsal.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT switch_v2 FROM jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 WHERE singleton;
  SELECT * INTO STRICT offers FROM jetnity_at_full_rehearsal.saved_offers_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT admin FROM jetnity_at_full_rehearsal.admin_runtime_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT predecessor FROM jetnity_at_full_rehearsal.status_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT rolling FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 WHERE singleton;
  SELECT jsonb_agg(to_jsonb(b)||jsonb_build_object('installed_at',extract(epoch FROM b.installed_at)) ORDER BY b.component COLLATE "C")
    INTO old_baselines FROM jetnity_at_full_rehearsal.baselines_v1 b;
  IF jsonb_array_length(old_baselines) IS DISTINCT FROM 3
    OR predecessor.provider_digest<>'9edecdaad322ca8beceabac8a7d09962167ad3c7beba655531583a8bc2fdf62e'
    OR predecessor.predecessor_catalog_digest IS DISTINCT FROM (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
      FROM jetnity_at_full_rehearsal.baselines_v1 WHERE component='all')
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
 OR encode(sha256(convert_to(bg1_v3.catalog::text,'UTF8')),'hex') IS DISTINCT FROM (SELECT bg1_v3_sha FROM jetnity_at_full_rehearsal.expected_baseline_sha)
 OR encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex') IS DISTINCT FROM (SELECT optimized_sha FROM jetnity_at_full_rehearsal.expected_baseline_sha)
 OR allocator_v4.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(optimized.catalog::text,'UTF8')),'hex')
 OR allocator_v4.predecessor_baseline_digest IS DISTINCT FROM encode(sha256(convert_to(to_jsonb(optimized)::text,'UTF8')),'hex')
 OR allocator_v4.required_generation<=bg1_v3.required_generation
 OR allocator_v4.proof_not_before<=bg1_v3.proof_not_before
 OR allocator_v4.publisher_function_digest IS DISTINCT FROM encode(sha256(convert_to(pg_get_functiondef('jetnity_at_full_rehearsal.renew_ch_v1()'::pg_catalog.regprocedure),'UTF8')),'hex')
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
    FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2)
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2)<>3
 OR ch_at_v5.catalog IS DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
END $function$
;
CREATE OR REPLACE FUNCTION jetnity_at_full_rehearsal.require_open_v1()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE s jetnity_at_full_rehearsal.state_v1%ROWTYPE; instant timestamptz;
  required_proof bigint; earliest_proof timestamptz;
BEGIN
  IF pg_catalog.current_setting('session_replication_role') NOT IN('origin','local') THEN
    RAISE EXCEPTION 'bg1 transport session context unavailable' USING ERRCODE='P7902'; END IF;
  SELECT * INTO s FROM jetnity_at_full_rehearsal.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds' OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902'; END IF;
  SELECT greatest(switch_v2.required_generation,at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(switch_v2.proof_not_before,at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.rolling_quota_baseline_v1 q
      CROSS JOIN jetnity_at_full_rehearsal.status_baseline_v1 b CROSS JOIN jetnity_at_full_rehearsal.admin_runtime_baseline_v1 a CROSS JOIN jetnity_at_full_rehearsal.saved_offers_baseline_v1 offers CROSS JOIN jetnity_at_full_rehearsal.weather_quota_baseline_v1 weather CROSS JOIN jetnity_at_full_rehearsal.at_source_monitor_baseline_v1 at_prod CROSS JOIN jetnity_at_full_rehearsal.at_batch_switch_baseline_v2 switch_v2 WHERE at_prod.singleton AND switch_v2.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof
    FROM jetnity_at_full_rehearsal.bg1_transient_baseline_v3 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.bg1_production_http_allocator_v4 v WHERE v.singleton;
  SELECT greatest(required_proof,v.required_generation),greatest(earliest_proof,v.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 v WHERE v.singleton;
  IF s.generation<required_proof OR s.last_proof_started<earliest_proof OR instant<earliest_proof
    OR NOT EXISTS(SELECT 1 FROM jetnity_at_full_rehearsal.runs_v1 run WHERE run.outcome='complete' AND run.generation=s.generation
      AND run.due_at=s.last_due AND run.started_at=s.last_started AND run.proof_started_at=s.last_proof_started AND run.finished_at=s.last_finished) THEN
    RAISE EXCEPTION 'bg1 recovery fresh full proof required' USING ERRCODE='P7902'; END IF;
  RETURN s.incident_generation;
END $function$
;
UPDATE jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5
 SET catalog=jetnity_at_full_rehearsal.catalog_status_v1() WHERE singleton AND catalog='{}'::jsonb;
DO $verify$
BEGIN
 IF (SELECT count(*) FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 WHERE singleton)<>1
 OR (SELECT catalog IS DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1()
   FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 WHERE singleton)
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_visa_facts_v2)<>0
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_originals_v2)<>0
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE jobname='jetnity-at-production-source-qualified-renew-v2' AND active
   AND username='postgres' AND database='postgres'
   AND command='SELECT jetnity_at_full_rehearsal.renew_ch_v2()')<>1
 OR jetnity_at_full_rehearsal.visitor_v1('CH')->>'status'<>'unavailable'
 OR jetnity_at_full_rehearsal.visitor_v1('IN')->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'CH_AT_PROD_V5_PRE_OWNER_DEFAULT_CLOSED_GATE' USING ERRCODE='P7905';END IF;
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
END $verify$;

SELECT jsonb_build_object(
 'phase','PROD_CH_AT_V2_BOUND_INSTALL_PRECOMMIT_STOP_OPEN',
 'source_qualification_count',(SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2),
 'source_original_count',(SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_originals_v2),
 'new_fact_count',(SELECT count(*) FROM jetnity_at_full_rehearsal.ch_visa_facts_v2),
 'BG1_required_generation',(SELECT required_generation FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 WHERE singleton),
 'visitor_CH',jetnity_at_full_rehearsal.visitor_v1('CH')->>'status',
 'visitor_IN',jetnity_at_full_rehearsal.visitor_v1('IN')->>'status',
 'exact_guard_catalog', (SELECT catalog IS NOT DISTINCT FROM jetnity_at_full_rehearsal.catalog_status_v1()
   FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5 WHERE singleton),
 'no_owner_action',true,'no_customer_release',true,
 'no_changes_to_CHDE_or_HTTP_v4',true) AS installation_precommit_result;

DO $test_v5$
BEGIN
 PERFORM jetnity_at_full_rehearsal.assert_catalog_v1();
 IF jetnity_at_full_rehearsal.visitor_v1('CH')->>'status'<>'unavailable'
 OR jetnity_at_full_rehearsal.visitor_v1('IN')->>'status'<>'unavailable'
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.bg1_prod_ch_at_qualified_v5)<>1
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_visa_facts_v2)<>0
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.ch_source_qualifications_v2)<>3
 OR (SELECT count(*) FROM jetnity_at_full_rehearsal.cron_job WHERE jobname='jetnity-at-production-source-qualified-renew-v2' AND active)<>1
 THEN RAISE EXCEPTION 'DEV_NATIVE_EXACT_PROD_V5_POST_INSTALL_NOT_CLOSED'; END IF;
 BEGIN
 PERFORM jetnity_at_full_rehearsal.require_open_v1();
 RAISE EXCEPTION 'DEV_NATIVE_PROD_V5_PRE_PROOF_OPENED_TOO_EARLY';
 EXCEPTION WHEN SQLSTATE 'P7902' THEN NULL;
 END;
END $test_v5$;
SELECT jsonb_build_object('verdict','DEV_PG17_PROD_V1_V4_TO_V5_FULL_COMPOSITE_DEFAULT_CLOSED_PASS',
'exact_production_ddl_adapted_to_shadow',true,'BG1_v5_assert_catalog_executed',true,
'cron_installation_tested',true,'new_proof_required',true,'no_owner_action',true,
'no_persistent_dev_changes',true,'no_prod_changes',true,'transaction','ROLLBACK') AS witness;
ROLLBACK;
