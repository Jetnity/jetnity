-- Owner-gated Austrian Production source-monitor installation.
-- This CANDIDATE is UNAPPLIED. Supabase project selection must independently
-- equal qscbgcdmivbbnzrcyegn; current_database() alone cannot prove it.
-- NO AT method, positive visitor fact, public visa RPC or Vercel flag.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.at_source_prod_target='production:qscbgcdmivbbnzrcyegn:AT-SOURCE-BG1-1';
DO $actual_production$
DECLARE expected record;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.at_source_prod_target',true) IS DISTINCT FROM
 'production:qscbgcdmivbbnzrcyegn:AT-SOURCE-BG1-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('official_v3_at_production_private') IS NOT NULL
 OR to_regclass('official_v3_guard_private.at_source_monitor_baseline_v1') IS NOT NULL
 OR to_regnamespace('official_v3_source_renewal_private') IS NOT NULL
 OR to_regnamespace('official_v3_at_source_watch_private') IS NOT NULL
 OR to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL
 OR EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1
  WHERE method_id='jetnity-destination-primary-at-visa')
 OR (SELECT count(*) FROM official_v3_guard_private.weather_quota_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.saved_offers_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.admin_runtime_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.rolling_quota_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.status_baseline_v1)<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
   AND jobname='jetnity-official-truth-production-guard-v1')<>1
 OR EXISTS(SELECT 1 FROM cron.job
   WHERE jobname IN('jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-collect-v1'))
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regclass('net._http_response') IS NULL
 OR NOT pg_try_advisory_xact_lock(771112,101)
 THEN RAISE EXCEPTION 'AT_PRODUCTION_CURRENT_SAVED_OFFERS_WEATHER_BG1_REQUIRED'
 USING ERRCODE='P7978'; END IF;
 FOR expected IN SELECT * FROM (VALUES
  ('official_v3_guard_private.catalog_status_v1()','edc393042cba779c8a991b228128a46266be6bc41c585375077387cb3f855f81'),
  ('official_v3_guard_private.assert_catalog_v1()','0148d8973e0a47e5cfea3906990e19b4075fd18856dbb012e22f426b69587903'),
  ('official_v3_guard_private.require_open_v1()','db394f5cc4380abc49ce6b5f74308ec9d045101a6ec010391120795050eef0b4'),
  ('public.official_v3_guard_alarm_status_v1()','917a0679562d7b22f22e0c81968b09f3ebc75fbd6ce5a974be41fd75fbcd9923')
 ) v(signature,body_sha256) LOOP
 IF to_regprocedure(expected.signature) IS NULL
 OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc
 WHERE oid=to_regprocedure(expected.signature)) IS DISTINCT FROM expected.body_sha256
 THEN RAISE EXCEPTION 'AT_PRODUCTION_GUARD_DEFINITION_DRIFT'
 USING ERRCODE='P7978'; END IF;
 END LOOP;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $actual_production$;
CREATE TEMP TABLE at_prod_old_catalog (snapshot jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO at_prod_old_catalog SELECT official_v3_guard_private.catalog_status_v1();

-- Owner-gated Production stage 1. INSTALLATION CANDIDATE: NEVER execute until
-- independent Owner Merge/Production approval. No visas published at this stage.
-- Source pins are based on the exact official Austrian originals read in Dev.
-- New public visa facts and method approval are explicitly NOT created here.

CREATE SCHEMA official_v3_at_production_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_at_production_private FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE official_v3_at_production_private.source_pins_v1(
  source_id text PRIMARY KEY CHECK(source_id IN
    ('bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply')),
  authority_code text NOT NULL DEFAULT 'AT' CHECK(authority_code='AT'),
  official_url text NOT NULL UNIQUE CHECK(official_url LIKE 'https://%'),
  original_sha text NOT NULL CHECK(original_sha~'^[0-9a-f]{64}$'),
  original_bytes integer NOT NULL CHECK(original_bytes BETWEEN 1 AND 1048576),
  canonical_sha text CHECK(canonical_sha IS NULL OR canonical_sha~'^[0-9a-f]{64}$'),
  normalization text NOT NULL CHECK(normalization IN ('none','bmeia-theme-assets-v1')),
  edition text,
  research_only boolean NOT NULL DEFAULT true CHECK(research_only=true),
  source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
  CHECK(source_id='bmeia-bern-how-to-apply' OR (canonical_sha IS NULL AND normalization='none'))
);
INSERT INTO official_v3_at_production_private.source_pins_v1
 (source_id,official_url,original_sha,original_bytes,canonical_sha,normalization,edition) VALUES
 ('bmi-visa-nationality-matrix',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
  'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',498415,NULL,'none','BMI 06.11.2026'),
 ('bmi-general-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
  'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',91655,NULL,'none',NULL),
 ('bmeia-bern-how-to-apply',
  'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
  '7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',172460,
  'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55',
  'bmeia-theme-assets-v1',NULL);

CREATE TABLE official_v3_at_production_private.watch_batches_v1(
  batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE official_v3_at_production_private.watch_requests_v1(
  batch_id bigint NOT NULL REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
  source_id text NOT NULL REFERENCES official_v3_at_production_private.source_pins_v1(source_id),
  request_id bigint NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL,
  PRIMARY KEY(batch_id,source_id)
);
-- One observation per official source per hourly batch. Old observations
-- are NEVER updated, deleted, overwritten or retroactively relabelled.
CREATE TABLE official_v3_at_production_private.watch_observations_v1(
  batch_id bigint NOT NULL,
  source_id text NOT NULL,
  observed_at timestamptz NOT NULL,
  source_status text NOT NULL CHECK(source_status IN
    ('unchanged_exact','unchanged_asset_version_only','changed','unavailable')),
  bytes integer CHECK(bytes IS NULL OR bytes BETWEEN 1 AND 1048576),
  body_sha text CHECK(body_sha IS NULL OR body_sha~'^[a-f0-9]{64}$'),
  http_status integer,
  PRIMARY KEY(batch_id,source_id),
  FOREIGN KEY(batch_id,source_id) REFERENCES
    official_v3_at_production_private.watch_requests_v1(batch_id,source_id),
  CHECK((source_status IN('unchanged_exact','unchanged_asset_version_only','changed'))
    = (bytes IS NOT NULL AND body_sha IS NOT NULL))
);
-- Retain full official originals just once per source. Later unchanged
-- batches append only source identity/length/status, avoiding repeated
-- large HTML copies or recurring source-storage growth.
CREATE TABLE official_v3_at_production_private.first_originals_v1(
  source_id text PRIMARY KEY REFERENCES official_v3_at_production_private.source_pins_v1(source_id),
  batch_id bigint NOT NULL,
  stored_at timestamptz NOT NULL,
  raw_body bytea NOT NULL,
  raw_sha text GENERATED ALWAYS AS (encode(sha256(raw_body),'hex')) STORED,
  raw_bytes integer GENERATED ALWAYS AS (octet_length(raw_body)) STORED,
  source_state text NOT NULL CHECK(source_state IN('unchanged_exact','unchanged_asset_version_only')),
  legal_source_approved boolean NOT NULL DEFAULT false CHECK(legal_source_approved=false),
  customer_rule_approved boolean NOT NULL DEFAULT false CHECK(customer_rule_approved=false),
  FOREIGN KEY(batch_id,source_id) REFERENCES
    official_v3_at_production_private.watch_observations_v1(batch_id,source_id),
  CHECK(octet_length(raw_body) BETWEEN 1 AND 1048576)
);

CREATE FUNCTION official_v3_at_production_private.deny_mutation_v1()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog AS $immutable$
BEGIN
  RAISE EXCEPTION 'AT_PRODUCTION_IMMUTABLE_SOURCE_HISTORY' USING ERRCODE='P7979';
END $immutable$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.deny_mutation_v1()
 FROM PUBLIC,anon,authenticated,service_role;

DO $all_private$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['source_pins_v1','watch_batches_v1','watch_requests_v1',
    'watch_observations_v1','first_originals_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_at_production_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE official_v3_at_production_private.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY postgres_only ON official_v3_at_production_private.%I TO postgres USING(true) WITH CHECK(true)',t);
    EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON official_v3_at_production_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',t);
    EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON official_v3_at_production_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1()',t);
  END LOOP;
END $all_private$;
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_at_production_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA official_v3_at_production_private
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION official_v3_at_production_private.enqueue_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $enqueue$
DECLARE src record; b bigint; n integer:=0; started timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 IF NOT pg_try_advisory_xact_lock(771112,1) THEN RETURN 0; END IF;
 IF (SELECT max(started_at) FROM official_v3_at_production_private.watch_batches_v1)
 >clock_timestamp()-interval '50 minutes' THEN RETURN 0; END IF;
 started:=clock_timestamp();
 INSERT INTO official_v3_at_production_private.watch_batches_v1(started_at)
 VALUES(started) RETURNING batch_id INTO b;
 FOR src IN SELECT source_id,official_url FROM official_v3_at_production_private.source_pins_v1 ORDER BY source_id LOOP
   INSERT INTO official_v3_at_production_private.watch_requests_v1
     (batch_id,source_id,request_id,requested_at)
   VALUES(b,src.source_id,net.http_get(src.official_url,'{}'::jsonb,
      '{"accept":"text/html"}'::jsonb,15000),started);
   n:=n+1;
 END LOOP;
 IF n<>3 THEN RAISE EXCEPTION 'AT_PRODUCTION_INCOMPLETE_SOURCE_REQUEST' USING ERRCODE='P7979'; END IF;
 RETURN n;
END $enqueue$;

CREATE FUNCTION official_v3_at_production_private.collect_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $collect$
DECLARE req record; resp record; stat text; sha text; size integer; cnt integer;
 canon text; good boolean; seen boolean; inserted integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 FOR req IN SELECT r.*,p.original_sha,p.original_bytes,p.canonical_sha,p.normalization
 FROM official_v3_at_production_private.watch_requests_v1 r
 JOIN official_v3_at_production_private.source_pins_v1 p USING(source_id)
 WHERE NOT EXISTS(SELECT 1 FROM official_v3_at_production_private.watch_observations_v1 o
  WHERE o.batch_id=r.batch_id AND o.source_id=r.source_id)
 ORDER BY r.batch_id,r.source_id FOR UPDATE OF r SKIP LOCKED
 LOOP
  SELECT * INTO resp FROM net._http_response WHERE id=req.request_id ORDER BY created DESC LIMIT 1;
  seen:=FOUND;
  IF NOT seen AND clock_timestamp()<req.requested_at+interval '6 minutes' THEN CONTINUE; END IF;
  stat:='unavailable';size:=NULL;sha:=NULL;good:=false;
  IF seen AND resp.status_code=200 AND resp.timed_out IS NOT TRUE
   AND resp.error_msg IS NULL AND resp.content IS NOT NULL
   AND resp.content_type~*'^text/html([; ]|$)' THEN
    size:=octet_length(convert_to(resp.content,'UTF8'));
    IF size BETWEEN 1 AND 1048576
      AND position('radware bot manager captcha' IN lower(resp.content))=0
      AND position('access denied' IN lower(resp.content))=0
      AND position('accesso negato' IN lower(resp.content))=0 THEN
      sha:=encode(sha256(convert_to(resp.content,'UTF8')),'hex');
      IF size=req.original_bytes AND sha=req.original_sha
       THEN stat:='unchanged_exact';good:=true;
      ELSIF req.source_id='bmeia-bern-how-to-apply' AND size=req.original_bytes
       AND req.normalization='bmeia-theme-assets-v1' THEN
        SELECT count(*) INTO cnt FROM regexp_matches(resp.content,
        '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g');
        canon:=regexp_replace(resp.content,
        '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
        E'\\1TIMESTAMP\\2','g');
        IF cnt=19 AND encode(sha256(convert_to(canon,'UTF8')),'hex')=req.canonical_sha
        THEN stat:='unchanged_asset_version_only';good:=true;
        ELSE stat:='changed'; END IF;
      ELSE stat:='changed'; END IF;
    ELSE stat:='unavailable';size:=NULL;sha:=NULL; END IF;
  END IF;
  INSERT INTO official_v3_at_production_private.watch_observations_v1
    (batch_id,source_id,observed_at,source_status,bytes,body_sha,http_status)
  VALUES(req.batch_id,req.source_id,clock_timestamp(),stat,size,sha,
    CASE WHEN seen THEN resp.status_code ELSE NULL END);
  IF good THEN
    INSERT INTO official_v3_at_production_private.first_originals_v1
     (source_id,batch_id,stored_at,raw_body,source_state)
    VALUES(req.source_id,req.batch_id,clock_timestamp(),convert_to(resp.content,'UTF8'),stat)
    ON CONFLICT DO NOTHING;
  END IF;
  inserted:=inserted+1;
 END LOOP;
 RETURN inserted;
END $collect$;

CREATE FUNCTION official_v3_at_production_private.source_status_v1()
 RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $status$
DECLARE batch record; n integer; good integer; changed integer; pending integer;
 active_jobs integer; value text:='SOURCE_UNAVAILABLE';
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 THEN RETURN jsonb_build_object('status',value,'published',0,'approved',0); END IF;
 SELECT * INTO batch FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('status',value,'published',0,'approved',0); END IF;
 SELECT count(*),count(*) FILTER(WHERE source_status IN('unchanged_exact','unchanged_asset_version_only')),
   count(*) FILTER(WHERE source_status='changed')
 INTO n,good,changed FROM official_v3_at_production_private.watch_observations_v1
 WHERE batch_id=batch.batch_id;
 SELECT count(*) INTO active_jobs FROM cron.job
 WHERE active AND username='postgres'
 AND jobname IN ('jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-collect-v1');
 IF active_jobs=2 AND batch.started_at>clock_timestamp()-interval '70 minutes'
   AND batch.started_at<=clock_timestamp()
   AND n=3 AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
 THEN
   IF changed>0 THEN value:='CHANGED_REQUIRES_REVIEW';
   ELSIF good=3 AND (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)=3
     THEN value:='PINNED_UNCHANGED_RESEARCH_ONLY';
   END IF;
 END IF;
 RETURN jsonb_build_object('status',value,'sources',n,'unchanged',good,'changed',changed,
   'requestedAt',batch.started_at,'published',0,'approved',0);
END $status$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_at_production_private
 FROM PUBLIC,anon,authenticated,service_role;

-- This installation schedules source collection and the future approved
-- CH-only issuer. It writes ZERO facts until exact Owner+AAL2 MA1 and
-- three unchanged current official source receipts.
SELECT cron.schedule('jetnity-at-production-source-enqueue-v1','9 * * * *',
 'SELECT official_v3_at_production_private.enqueue_v1()');
SELECT cron.schedule('jetnity-at-production-source-collect-v1','*/5 * * * *',
 'SELECT official_v3_at_production_private.collect_v1()');


-- CH->AT only Production Official-Truth V3 issuer and guarded visitor.
-- Installed empty: no method head, no legal fact, no public positive. A real
-- Owner+AAL2 approval of the exact existing method and an unmodified complete
-- government source batch are REQUIRED before the sole CH rule can rotate.
-- All other 49 passports are permanently unavailable in this revision.
CREATE TABLE official_v3_at_production_private.ch_visa_facts_v1(
  version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  citizenship_code text NOT NULL DEFAULT 'CH' CHECK(citizenship_code='CH'),
  destination_code text NOT NULL DEFAULT 'AT' CHECK(destination_code='AT'),
  requirement_type text NOT NULL DEFAULT 'visa' CHECK(requirement_type='visa'),
  document_type text NOT NULL DEFAULT 'passport' CHECK(document_type='passport'),
  route_type text NOT NULL DEFAULT 'direct_entry' CHECK(route_type='direct_entry'),
  visa_effect text NOT NULL DEFAULT 'not_required' CHECK(visa_effect='not_required'),
  visa_mode text NOT NULL DEFAULT 'visa_exempt' CHECK(visa_mode='visa_exempt'),
  source_batch_id bigint NOT NULL UNIQUE
    REFERENCES official_v3_at_production_private.watch_batches_v1(batch_id),
  predecessor_version_id bigint
    REFERENCES official_v3_at_production_private.ch_visa_facts_v1(version_id),
  method_epoch integer NOT NULL CHECK(method_epoch>0),
  method_id text NOT NULL CHECK(method_id='jetnity-destination-primary-at-visa'),
  method_revision integer NOT NULL DEFAULT 1 CHECK(method_revision=1),
  method_digest text NOT NULL CHECK(method_digest=
    'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'),
  package_digest text NOT NULL CHECK(package_digest=
    '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'),
  source_digest text NOT NULL CHECK(source_digest~'^[0-9a-f]{64}$'),
  verified_at timestamptz NOT NULL,
  source_checked_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
  approved_origin text NOT NULL DEFAULT 'OWNER_METHOD_AND_EXACT_BMI_CH'
   CHECK(approved_origin='OWNER_METHOD_AND_EXACT_BMI_CH'),
  CHECK(verified_at>=source_checked_at AND expires_at>verified_at
    AND expires_at<=verified_at+interval '1 hour'
    AND expires_at<=source_checked_at+interval '70 minutes'
    AND expires_at<='2027-11-16T00:00:00Z'::timestamptz)
);
ALTER TABLE official_v3_at_production_private.ch_visa_facts_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_production_private.ch_visa_facts_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_at_production_private.ch_visa_facts_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON official_v3_at_production_private.ch_visa_facts_v1 FOR EACH ROW
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON official_v3_at_production_private.ch_visa_facts_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION official_v3_at_production_private.deny_mutation_v1();
REVOKE ALL ON TABLE official_v3_at_production_private.ch_visa_facts_v1
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE official_v3_at_production_private.ch_visa_facts_v1_version_id_seq
 FROM PUBLIC,anon,authenticated,service_role;

-- Called by the private hourly source batch reconciler (not the visitor).
-- The function intentionally has no automatic "approve source" operation.
-- It may insert CH only after the existing human Owner MA1 is current and
-- only for the exact reviewed original BMI edition + supporting official pages.
CREATE FUNCTION official_v3_at_production_private.renew_ch_v1()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $renew$
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
END $renew$;
REVOKE ALL ON FUNCTION official_v3_at_production_private.renew_ch_v1()
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.jetnity_source_bound_at_visa_v1(p_citizenship_country_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog AS $visitor$
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
 SELECT * INTO b FROM official_v3_at_production_private.watch_batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 instant:=clock_timestamp();
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
 SELECT * INTO f FROM official_v3_at_production_private.ch_visa_facts_v1
 ORDER BY version_id DESC LIMIT 1;
 IF NOT FOUND OR f.citizenship_code<>'CH' OR f.destination_code<>'AT'
  OR f.source_batch_id<>b.batch_id OR f.verified_at>instant
  OR f.source_checked_at>instant OR instant>=f.expires_at
  OR instant>=f.source_checked_at+interval '70 minutes'
  OR f.method_revision<>1
  OR f.method_digest<>'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9'
  OR f.package_digest<>'55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe'
 THEN RETURN unavailable; END IF;
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
END $visitor$;
REVOKE ALL ON FUNCTION public.jetnity_source_bound_at_visa_v1(text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.jetnity_source_bound_at_visa_v1(text)
 TO anon,authenticated;

-- One atomic source-based revision per complete unchanged government batch;
-- no manual time extension. No method approval or legal fact is inserted by
-- the installation itself. Before Owner+AAL2, this job writes ZERO facts.
SELECT cron.schedule('jetnity-at-production-source-renew-v1','17-59/5 * * * *',
 'SELECT official_v3_at_production_private.renew_ch_v1()');

-- Protects the new append-only authority monitor and its code, every RLS
-- policy, original/receipt ledger, dependency and PostgreSQL privileges.
-- Old saved_offers, weather, Admin, status and rolling baselines stay intact.
CREATE TABLE official_v3_guard_private.at_source_monitor_baseline_v1(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest~'^[a-f0-9]{64}$'),
 predecessor_weather_digest text NOT NULL CHECK(predecessor_weather_digest~'^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.at_source_monitor_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.at_source_monitor_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_guard_private.at_source_monitor_baseline_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON official_v3_guard_private.at_source_monitor_baseline_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON official_v3_guard_private.at_source_monitor_baseline_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.at_source_monitor_baseline_v1
 FROM PUBLIC,anon,authenticated,service_role;


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
    'official_v3_result_private','official_v3_result_api','official_v3_guard_private','jetnity_reporting','jetnity_cms_private','jetnity_marketing_private','jetnity_weather_private','official_v3_at_production_private')
), procs AS (
  SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE p.pronamespace IN (SELECT oid FROM namespaces)
    OR (n.nspname='auth' AND p.proname IN ('uid','jwt','role'))
    OR (n.nspname='public' AND p.proname IN ('aktuelle_rolle','aktuelles_admin_aal2','hat_rolle_mindestens',
      'profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen','rollenrang','darf_konten_verwalten',
      'profil_autoritaet_integritaet_pruefen_v1','official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1','official_v3_guard_review_v1',
      'official_v3_guard_retire_v1','official_v3_guard_resume_v1','official_v3_guard_confirm_v1','official_v3_guard_alarm_status_v1','admin_account_counts_v1','admin_cms_inspiration_command_v1','admin_cms_inspiration_read_v1','admin_cms_inspiration_confirm_v1','cms_inspiration_published_v1','admin_marketing_drafts_apply_v1','admin_marketing_drafts_read_v1','darf_inhalte_moderieren','reisewetter_reservieren_v1','jetnity_source_bound_at_visa_v1'))
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
$function$;


CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE at_prod official_v3_guard_private.at_source_monitor_baseline_v1%ROWTYPE;
 weather official_v3_guard_private.weather_quota_baseline_v1%ROWTYPE;
  offers official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
  admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;
  predecessor official_v3_guard_private.status_baseline_v1%ROWTYPE;
  rolling official_v3_guard_private.rolling_quota_baseline_v1%ROWTYPE; old_baselines jsonb;
BEGIN
  SELECT * INTO STRICT weather FROM official_v3_guard_private.weather_quota_baseline_v1 WHERE singleton;
  SELECT * INTO STRICT at_prod FROM official_v3_guard_private.at_source_monitor_baseline_v1 WHERE singleton;
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
    OR at_prod.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'production rolling protected catalog changed' USING ERRCODE='P7905'; END IF;
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
  SELECT greatest(at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod WHERE at_prod.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
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
  SELECT greatest(at_prod.required_generation,weather.required_generation,offers.required_generation,a.required_generation,q.required_generation,b.required_generation),greatest(at_prod.proof_not_before,weather.proof_not_before,offers.proof_not_before,a.proof_not_before,q.proof_not_before,b.proof_not_before)
    INTO STRICT required_proof,earliest_proof FROM official_v3_guard_private.rolling_quota_baseline_v1 q
      CROSS JOIN official_v3_guard_private.status_baseline_v1 b CROSS JOIN official_v3_guard_private.admin_runtime_baseline_v1 a CROSS JOIN official_v3_guard_private.saved_offers_baseline_v1 offers CROSS JOIN official_v3_guard_private.weather_quota_baseline_v1 weather CROSS JOIN official_v3_guard_private.at_source_monitor_baseline_v1 at_prod WHERE at_prod.singleton AND weather.singleton AND q.singleton AND b.singleton AND a.singleton AND offers.singleton;
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
END $function$;


INSERT INTO official_v3_guard_private.at_source_monitor_baseline_v1(
 singleton,predecessor_catalog_digest,predecessor_weather_digest,
 required_generation,proof_not_before,catalog)
SELECT true,
encode(sha256(convert_to(w.catalog::text,'UTF8')),'hex'),
encode(sha256(convert_to((to_jsonb(w)||jsonb_build_object(
 'proof_not_before',extract(epoch FROM w.proof_not_before)))::text,'UTF8')),'hex'),
s.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.weather_quota_baseline_v1 w
CROSS JOIN official_v3_guard_private.state_v1 s
WHERE w.singleton AND s.singleton;

DO $post$
DECLARE p record;
BEGIN
 SELECT * INTO STRICT p FROM official_v3_guard_private.at_source_monitor_baseline_v1
 WHERE singleton;
 IF p.required_generation<2
 OR (SELECT count(*) FROM official_v3_at_production_private.source_pins_v1)<>3
 OR (SELECT count(*) FROM official_v3_at_production_private.watch_batches_v1)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.watch_observations_v1)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.first_originals_v1)<>0
 OR (SELECT count(*) FROM official_v3_at_production_private.ch_visa_facts_v1)<>0
 OR NOT has_function_privilege('anon','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jetnity_source_bound_at_visa_v1(text)','EXECUTE')
 OR public.jetnity_source_bound_at_visa_v1('CH')->>'status'<>'unavailable'
 OR public.jetnity_source_bound_at_visa_v1('IN')->>'status'<>'unavailable'
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
    AND jobname='jetnity-at-production-source-renew-v1')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
  AND jobname IN('jetnity-at-production-source-enqueue-v1','jetnity-at-production-source-collect-v1'))<>2
 OR (SELECT count(*) FROM official_v3_guard_private.saved_offers_baseline_v1)<>1
 OR (SELECT count(*) FROM official_v3_guard_private.weather_quota_baseline_v1)<>1
 OR EXISTS(SELECT 1 FROM official_v3_at_production_private.source_pins_v1
  WHERE source_qualified OR research_only IS NOT TRUE)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='official_v3_at_production_private' AND c.relkind='r'
  AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
  OR has_table_privilege('anon',c.oid,'SELECT')
  OR has_table_privilege('authenticated',c.oid,'SELECT')
  OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','official_v3_at_production_private','USAGE')
 OR has_schema_privilege('authenticated','official_v3_at_production_private','USAGE')
 OR has_schema_privilege('service_role','official_v3_at_production_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'unavailable'
 THEN RAISE EXCEPTION 'AT_PRODUCTION_SOURCE_MONITOR_BG1_NOT_ARMED'
 USING ERRCODE='P7978'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
