-- Synthetic fixture ONLY. All schema names are isolated before execution.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='2s';
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $roles$;
CREATE SCHEMA official_v3_at_production_private;
CREATE SCHEMA official_v3_guard_private;
CREATE SCHEMA official_v3_method_private;
CREATE SCHEMA at_stage2_fixture_api;
-- Stand-in for the already existing public RPC and its existing anon ACL.
-- CREATE OR REPLACE must retain this exact ACL, not create a new endpoint.
CREATE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $old$
 SELECT jsonb_build_object('status','unavailable','destinationCountryCode','AT')
$old$;
REVOKE ALL ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA at_stage2_fixture_api TO anon;
GRANT EXECUTE ON FUNCTION public.jetnity_source_bound_at_visa_v1(text) TO anon;
CREATE TEMP TABLE at_stage2_exact_predecessor(singleton boolean);
CREATE TABLE official_v3_guard_private.fixture_guard(ok boolean NOT NULL);
INSERT INTO official_v3_guard_private.fixture_guard VALUES(true);
CREATE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb
 LANGUAGE sql STABLE SET search_path=pg_catalog AS $f$
 SELECT jsonb_build_object('status',CASE WHEN ok THEN 'current' ELSE 'unavailable' END)
 FROM official_v3_guard_private.fixture_guard
 $f$;
CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint LANGUAGE plpgsql AS $f$
 BEGIN IF NOT (SELECT ok FROM official_v3_guard_private.fixture_guard) THEN RAISE EXCEPTION 'fixture BG1 unavailable'; END IF; RETURN 1; END $f$;
CREATE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void LANGUAGE plpgsql AS $f$
 BEGIN PERFORM official_v3_guard_private.require_open_v1(); END $f$;
CREATE TABLE official_v3_method_private.heads_v1(method_id text PRIMARY KEY,status text,revision integer,epoch integer,method_digest text,package_digest text);
INSERT INTO official_v3_method_private.heads_v1 VALUES('jetnity-destination-primary-at-visa','approved',2,2,'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e','6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0');
CREATE FUNCTION official_v3_method_private.require_current_locked_v1(p_id text,p_rev integer,p_method text,p_package text,p_epoch integer)
 RETURNS void LANGUAGE plpgsql AS $f$
 BEGIN IF NOT EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1 WHERE method_id=p_id AND status='approved' AND revision=p_rev
 AND method_digest=p_method AND package_digest=p_package AND epoch=p_epoch) THEN RAISE EXCEPTION 'fixture method refused'; END IF; END $f$;
CREATE FUNCTION official_v3_at_production_private.deny_mutation_v1() RETURNS trigger LANGUAGE plpgsql AS $f$
 BEGIN RAISE EXCEPTION 'fixture immutable' USING ERRCODE='P7999'; END $f$;
CREATE TABLE official_v3_at_production_private.watch_batches_v1(batch_id bigint PRIMARY KEY,started_at timestamptz NOT NULL);
CREATE TABLE official_v3_at_production_private.watch_requests_v1(batch_id bigint,source_id text,request_id bigint,requested_at timestamptz,PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.watch_observations_v1(batch_id bigint,source_id text,http_status integer,source_status text,body_sha text,bytes integer,observed_at timestamptz,PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.ch_source_qualifications_v3(source_id text PRIMARY KEY,official_url text,original_sha text,original_bytes integer,original_batch bigint);
CREATE TABLE official_v3_at_production_private.ch_source_originals_v3(source_id text PRIMARY KEY,original_batch bigint,raw_body bytea,
 raw_sha text GENERATED ALWAYS AS(encode(sha256(raw_body),'hex')) STORED,raw_bytes integer GENERATED ALWAYS AS(octet_length(raw_body)) STORED);
CREATE TABLE official_v3_at_production_private.ch_source_http_bodies_v3(source_id text,raw_body bytea,raw_sha text GENERATED ALWAYS AS(encode(sha256(raw_body),'hex')) STORED,
 raw_bytes integer GENERATED ALWAYS AS(octet_length(raw_body)) STORED,PRIMARY KEY(source_id,raw_sha));
CREATE TABLE official_v3_at_production_private.ch_source_http_receipts_v3(batch_id bigint,source_id text,request_id bigint,raw_sha text,raw_bytes integer,
 observed_at timestamptz,state text,PRIMARY KEY(batch_id,source_id));
CREATE TABLE official_v3_at_production_private.ch_source_owner_decisions_v3(operation_id text PRIMARY KEY,decision text,source_sha text,source_bytes integer,
 initial_batch bigint,semantic_scope text,method_epoch integer,decided_at timestamptz);
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v1(version_id bigint PRIMARY KEY);
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v2(version_id bigint PRIMARY KEY);
INSERT INTO official_v3_at_production_private.ch_visa_facts_v1 VALUES(40);
INSERT INTO official_v3_at_production_private.ch_visa_facts_v2 VALUES(42);
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
CREATE FUNCTION official_v3_at_production_private.fixture_seed(p_batch bigint,p_started timestamptz,p_drift text DEFAULT NULL,p_missing text DEFAULT NULL)
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
 FROM official_v3_at_production_private.watch_observations_v1 WHERE batch_id=p_batch
 $f$;
CREATE FUNCTION official_v3_at_production_private.fixture_expect(p_ok boolean,p_label text) RETURNS void LANGUAGE plpgsql AS $f$
 BEGIN IF p_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'STAGE2 FIXTURE FAIL: %',p_label; END IF; END $f$;
SELECT official_v3_at_production_private.fixture_seed(1,clock_timestamp()-interval '1 minute');
