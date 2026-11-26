-- Synthetic PG17 parent for the Stage 3 package. Not a Production catalog.
-- No network, no secrets, no traveller data, no owner receipt from Production.
CREATE SCHEMA IF NOT EXISTS official_v3_at_production_private;
CREATE SCHEMA IF NOT EXISTS official_v3_guard_private;
CREATE SCHEMA IF NOT EXISTS official_v3_method_private;
CREATE SCHEMA IF NOT EXISTS official_v3_jobs_private;
CREATE SCHEMA IF NOT EXISTS jetnity_ot_auth;
CREATE SCHEMA IF NOT EXISTS jetnity_pgnet_allocator_private;
CREATE SCHEMA IF NOT EXISTS cron;
CREATE SCHEMA IF NOT EXISTS net;
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $roles$;
CREATE FUNCTION official_v3_guard_private.immutable_v1() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN RAISE EXCEPTION 'fixture immutable' USING ERRCODE='P7999'; END $f$;
CREATE FUNCTION official_v3_at_production_private.deny_mutation_v1() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN RAISE EXCEPTION 'fixture immutable' USING ERRCODE='P7999'; END $f$;
CREATE FUNCTION official_v3_guard_private.alarm_status_v1() RETURNS jsonb LANGUAGE sql STABLE
 SET search_path=pg_catalog AS $f$ SELECT jsonb_build_object('schema',1,'status','current') $f$;
CREATE TABLE official_v3_method_private.heads_v1(
 method_id text PRIMARY KEY,status text,revision integer,epoch integer,method_digest text,package_digest text);
INSERT INTO official_v3_method_private.heads_v1 VALUES(
 'jetnity-destination-primary-at-visa','approved',2,2,
 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e',
 '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0');
CREATE FUNCTION official_v3_method_private.require_current_locked_v1(
 p_id text,p_rev integer,p_method text,p_package text,p_epoch integer)
 RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1
  WHERE method_id=p_id AND status='approved' AND revision=p_rev
  AND method_digest=p_method AND package_digest=p_package AND epoch=p_epoch)
 THEN RAISE EXCEPTION 'fixture method refused'; END IF;
END $f$;
CREATE TABLE official_v3_guard_private.state_v1(
 singleton boolean PRIMARY KEY,generation bigint,incident_generation bigint,resumed_generation bigint,
 last_observed timestamptz,last_finished timestamptz,last_started timestamptz,last_due timestamptz,
 last_proof_started timestamptz,valid_until timestamptz);
CREATE TABLE official_v3_guard_private.runs_v1(
 outcome text,generation bigint,due_at timestamptz,started_at timestamptz,proof_started_at timestamptz,finished_at timestamptz);
CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_source_v6(
 singleton boolean PRIMARY KEY,predecessor_catalog_digest text,predecessor_baseline_digest text,
 source_digest text,required_generation bigint,proof_not_before timestamptz,catalog jsonb);
CREATE TABLE official_v3_guard_private.bg1_prod_ch_at_qualified_v5(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 predecessor_catalog_digest text,predecessor_baseline_digest text,qualified_source_digest text);
CREATE TABLE official_v3_guard_private.bg1_production_http_allocator_v4(
 singleton boolean PRIMARY KEY,publisher_function_digest text,required_generation bigint,proof_not_before timestamptz,
 predecessor_catalog_digest text,predecessor_baseline_digest text,transport_metadata_digest text,
 transport_metadata jsonb,catalog jsonb);
CREATE TABLE official_v3_guard_private.query_cost_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,algorithm text,catalog jsonb,
 predecessor_catalog_digest text,predecessor_baseline_digest text);
CREATE TABLE official_v3_guard_private.bg1_transient_baseline_v3(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 predecessor_catalog_digest text,predecessor_baseline_digest text);
CREATE TABLE official_v3_guard_private.at_batch_switch_baseline_v2(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 predecessor_catalog_digest text,predecessor_baseline_digest text);
CREATE TABLE official_v3_guard_private.at_source_monitor_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 predecessor_catalog_digest text,predecessor_weather_digest text);
CREATE TABLE official_v3_guard_private.weather_quota_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 candidate_sha256 text,predecessor_sha256 text);
CREATE TABLE official_v3_guard_private.saved_offers_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 migration_blob text,predecessor_catalog_digest text,predecessor_admin_digest text);
CREATE TABLE official_v3_guard_private.admin_runtime_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 predecessor_provider_digest text,definition_digest text,predecessor_catalog_digest text,predecessor_rolling_digest text);
CREATE TABLE official_v3_guard_private.status_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,
 provider_digest text,predecessor_catalog_digest text,predecessor_baselines_digest text);
CREATE TABLE official_v3_guard_private.rolling_quota_baseline_v1(
 singleton boolean PRIMARY KEY,required_generation bigint,proof_not_before timestamptz,catalog jsonb,policy jsonb,
 predecessor_provider_digest text,predecessor_catalog_digest text,predecessor_status_digest text);
CREATE TABLE official_v3_guard_private.baselines_v1(
 component text,catalog jsonb,installed_at timestamptz);
CREATE TABLE official_v3_jobs_private.rolling_policy_v2(installed_at timestamptz);
INSERT INTO official_v3_jobs_private.rolling_policy_v2 VALUES(clock_timestamp());
CREATE TABLE cron.job(
 jobid bigint,jobname text,schedule text,command text,nodename text,nodeport integer,
 database text,username text,active boolean);
INSERT INTO cron.job(jobid,jobname,schedule,command,database,username,active) VALUES
 (1,'jetnity-at-production-source-collect-v1','*/5 * * * *','SELECT official_v3_at_production_private.collect_v1()','postgres','postgres',true),
 (2,'jetnity-at-production-source-enqueue-v1','*/5 * * * *','SELECT official_v3_at_production_private.enqueue_v1()','postgres','postgres',true),
 (3,'jetnity-at-production-source-renew-v1','2-59/5 * * * *','SELECT official_v3_at_production_private.renew_ch_v1()','postgres','postgres',true),
 (4,'jetnity-at-production-source-qualified-renew-v2','7-59/5 * * * *','SELECT official_v3_at_production_private.renew_ch_v2()','postgres','postgres',true),
 (5,'jetnity-ch-de-prod-import-v1','11 * * * *','SELECT official_v3_ch_de_private.import_v1()','postgres','postgres',true),
 (6,'jetnity-official-truth-production-guard-v1','*/5 * * * *','SELECT official_v3_guard_private.run_v1()','postgres','postgres',true);
CREATE FUNCTION official_v3_at_production_private.renew_ch_v1()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $function$
BEGIN
 RETURN 0;
END
$function$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.renew_ch_v1() FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO official_v3_guard_private.bg1_production_http_allocator_v4(
 singleton,publisher_function_digest,required_generation,proof_not_before,transport_metadata,catalog)
SELECT true,encode(sha256(convert_to(pg_get_functiondef('official_v3_at_production_private.renew_ch_v1()'::regprocedure),'UTF8')),'hex'),
 1,clock_timestamp()-interval '2 minutes','{}'::jsonb,'{}'::jsonb;
CREATE TABLE official_v3_at_production_private.watch_batches_v1(batch_id bigint PRIMARY KEY,started_at timestamptz NOT NULL);
CREATE TABLE official_v3_at_production_private.watch_requests_v1(
 batch_id bigint,source_id text,request_id bigint,requested_at timestamptz,PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.watch_observations_v1(
 batch_id bigint,source_id text,http_status integer,source_status text,body_sha text,bytes integer,observed_at timestamptz,
 PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.ch_source_qualifications_v2(
 source_id text PRIMARY KEY,accepted_sha text,accepted_bytes integer,expected_watch_state text);
CREATE TABLE official_v3_at_production_private.ch_source_originals_v2(source_id text PRIMARY KEY,raw_sha text);
INSERT INTO official_v3_at_production_private.ch_source_qualifications_v2 VALUES
 ('bmi-general-entry',repeat('a',64),1,'unchanged_exact'),
 ('bmi-visa-nationality-matrix',repeat('b',64),1,'unchanged_exact'),
 ('bmeia-bern-how-to-apply',repeat('c',64),1,'changed');
INSERT INTO official_v3_at_production_private.ch_source_originals_v2 VALUES
 ('bmi-general-entry',repeat('a',64)),('bmi-visa-nationality-matrix',repeat('b',64)),('bmeia-bern-how-to-apply',repeat('c',64));
CREATE TABLE official_v3_at_production_private.ch_source_qualifications_v3(
 source_id text PRIMARY KEY,official_url text,original_sha text,original_bytes integer,original_batch bigint);
CREATE TABLE official_v3_at_production_private.ch_source_originals_v3(
 source_id text PRIMARY KEY,original_batch bigint,raw_body bytea,
 raw_sha text GENERATED ALWAYS AS(encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS(octet_length(raw_body)) STORED);
CREATE TABLE official_v3_at_production_private.ch_source_http_bodies_v3(
 source_id text,raw_body bytea,
 raw_sha text GENERATED ALWAYS AS(encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS(octet_length(raw_body)) STORED,
 PRIMARY KEY(source_id,raw_sha));
CREATE TABLE official_v3_at_production_private.ch_source_http_receipts_v3(
 batch_id bigint,source_id text,request_id bigint,raw_sha text,raw_bytes integer,observed_at timestamptz,state text,
 PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.ch_source_owner_decisions_v3(
 operation_id text PRIMARY KEY,decision text,source_sha text,source_bytes integer,initial_batch bigint,
 semantic_scope text,method_epoch integer,decided_at timestamptz);
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v1(version_id bigint PRIMARY KEY);
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v2(version_id bigint PRIMARY KEY);
INSERT INTO official_v3_at_production_private.ch_visa_facts_v1 VALUES(40);
INSERT INTO official_v3_at_production_private.ch_visa_facts_v2 VALUES(82);
INSERT INTO official_v3_at_production_private.ch_source_originals_v3(source_id,original_batch,raw_body) VALUES
 ('bmi-general-entry',1,convert_to('<html>Synthetic general entry</html>','UTF8')),
 ('bmi-visa-nationality-matrix',1,convert_to('<html>Synthetic matrix</html>','UTF8')),
 ('bmeia-bern-how-to-apply',1,convert_to('<html><head>'
  ||repeat('<link rel="stylesheet" href="/typo3conf/ext/theme_bmeia/Resources/Public/CSS/bootstrap.css?1794830959" media="all">',4)
  ||repeat('<script src="/typo3conf/ext/theme_bmeia/Resources/Public/JS/jquery.js?1794830959"></script>',15)
  ||'</head><body><a href="/visum">Synthetic rule</a></body></html>','UTF8'));
INSERT INTO official_v3_at_production_private.ch_source_qualifications_v3
SELECT source_id,CASE source_id
 WHEN 'bmi-general-entry' THEN 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'
 WHEN 'bmi-visa-nationality-matrix' THEN 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
 ELSE 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/' END,
 raw_sha,raw_bytes,original_batch FROM official_v3_at_production_private.ch_source_originals_v3;
INSERT INTO official_v3_at_production_private.ch_source_owner_decisions_v3
SELECT 'atsrc3_'||repeat('a',32),'rule_neutral_ch_at_visa_only',original_sha,original_bytes,1,
 'CH_AT_VALID_SWISS_PASSPORT_DIRECT_VISA_ONLY',2,clock_timestamp()
FROM official_v3_at_production_private.ch_source_qualifications_v3 WHERE source_id='bmeia-bern-how-to-apply';
CREATE FUNCTION official_v3_at_production_private.fixture_seed(
 p_batch bigint,p_started timestamptz,p_drift text DEFAULT NULL,p_missing text DEFAULT NULL)
 RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog AS $seed$
DECLARE r record; b bytea; h text; n integer; i integer:=0; st text;
BEGIN
 INSERT INTO official_v3_at_production_private.watch_batches_v1 VALUES(p_batch,p_started);
 FOR r IN SELECT * FROM official_v3_at_production_private.ch_source_originals_v3 ORDER BY source_id LOOP
  i:=i+1;
  IF r.source_id IS NOT DISTINCT FROM p_missing THEN CONTINUE; END IF;
  b:=r.raw_body;
  IF r.source_id IS NOT DISTINCT FROM p_drift THEN b:=b||convert_to(' Semantic change','UTF8'); END IF;
  h:=encode(sha256(b),'hex'); n:=octet_length(b);
  st:=CASE WHEN r.source_id='bmeia-bern-how-to-apply' OR r.source_id IS NOT DISTINCT FROM p_drift THEN 'changed' ELSE 'unchanged_exact' END;
  INSERT INTO official_v3_at_production_private.watch_requests_v1 VALUES(p_batch,r.source_id,p_batch*10+i,p_started);
  INSERT INTO official_v3_at_production_private.watch_observations_v1 VALUES(p_batch,r.source_id,200,st,h,n,p_started+interval '1 second');
  INSERT INTO official_v3_at_production_private.ch_source_http_bodies_v3(source_id,raw_body) VALUES(r.source_id,b) ON CONFLICT DO NOTHING;
  INSERT INTO official_v3_at_production_private.ch_source_http_receipts_v3 VALUES(p_batch,r.source_id,p_batch*10+i,h,n,p_started+interval '1 second',st);
 END LOOP;
END $seed$;
CREATE FUNCTION official_v3_at_production_private.fixture_digest(p_batch bigint) RETURNS text LANGUAGE sql AS $f$
 SELECT encode(sha256(convert_to(string_agg(source_id||':'||body_sha,'|' ORDER BY source_id COLLATE "C"),'UTF8')),'hex')
 FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=p_batch $f$;
CREATE FUNCTION official_v3_at_production_private.fixture_expect(p_ok boolean,p_label text)
 RETURNS void LANGUAGE plpgsql AS $f$
BEGIN IF p_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'STAGE3 FIXTURE FAIL: %',p_label; END IF; END $f$;
SELECT official_v3_at_production_private.fixture_seed(690,clock_timestamp()-interval '1 minute');
INSERT INTO official_v3_guard_private.baselines_v1 VALUES
 ('all','{}'::jsonb,clock_timestamp()),('jobs','{}'::jsonb,clock_timestamp()),('result','{}'::jsonb,clock_timestamp());
DO $guard_seed$
DECLARE started timestamptz:=clock_timestamp()-interval '10 seconds';
 finished timestamptz:=clock_timestamp()-interval '9 seconds';
 due timestamptz:=finished;
 proof timestamptz:=clock_timestamp()-interval '1 minute';
BEGIN
 INSERT INTO official_v3_guard_private.state_v1 VALUES(
  true,10,1,1,finished,finished,started,due,proof,due+interval '5 minutes 30 seconds');
 INSERT INTO official_v3_guard_private.runs_v1 VALUES(
  'complete',10,due,started,proof,finished);
 INSERT INTO official_v3_guard_private.bg1_prod_ch_at_source_v6 VALUES(
  true,repeat('b',64),repeat('c',64),repeat('a',64),1,clock_timestamp()-interval '2 minutes','{"synthetic":true}'::jsonb);
 INSERT INTO official_v3_guard_private.bg1_prod_ch_at_qualified_v5 VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.query_cost_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.bg1_transient_baseline_v3(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.at_batch_switch_baseline_v2(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.at_source_monitor_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.weather_quota_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.saved_offers_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.admin_runtime_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.status_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 INSERT INTO official_v3_guard_private.rolling_quota_baseline_v1(singleton,required_generation,proof_not_before,catalog)
  VALUES(true,1,clock_timestamp()-interval '2 minutes','{}'::jsonb);
 UPDATE official_v3_guard_private.bg1_production_http_allocator_v4
  SET required_generation=1,proof_not_before=clock_timestamp()-interval '2 minutes';
END $guard_seed$;
CREATE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
 RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $old$
 SELECT jsonb_build_object('status','unavailable','destinationCountryCode','AT') $old$;
REVOKE ALL ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) TO anon;
SELECT set_config('jetnity.at_stage3_expected_v6_catalog_digest',
 (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex')
  FROM official_v3_guard_private.bg1_prod_ch_at_source_v6 WHERE singleton),true);
