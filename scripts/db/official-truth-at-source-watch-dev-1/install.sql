-- DEV ONLY: additive hourly Austrian authority-source observation, never a fact writer.
-- The only mutable rows are private monitoring receipts; Official Truth source,
-- owner approval, guard, passport research and accepted facts are untouched.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.at_dev_target='dev:yfvbxvijcorffwxbxahl:AT-SOURCE-WATCH-1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-SOURCE-WATCH-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT official_v3_at_private.source_current_v3()
 OR to_regnamespace('official_v3_at_source_watch_private') IS NOT NULL
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR (SELECT count(*) FROM cron.job WHERE jobname IN (
   'jetnity-at-source-enqueue-dev-v1','jetnity-at-source-collect-dev-v1'))<>0
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regprocedure('extensions.digest(bytea,text)') IS NULL
 THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_EXACT_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7986'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF NOT pg_try_advisory_xact_lock(771108,1) THEN
  RAISE EXCEPTION 'AT_SOURCE_WATCH_COMPETING_CHANGE' USING ERRCODE='P7986'; END IF;
END $pre$;

CREATE SCHEMA official_v3_at_source_watch_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_at_source_watch_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE official_v3_at_source_watch_private.pins_v1(
 source_id text PRIMARY KEY,
 url text UNIQUE NOT NULL CHECK(url LIKE 'https://%'),
 expected_bytes integer NOT NULL CHECK(expected_bytes BETWEEN 1 AND 1048576),
 raw_sha text NOT NULL CHECK(raw_sha ~ '^[a-f0-9]{64}$'),
 canonical_sha text CHECK(canonical_sha IS NULL OR canonical_sha ~ '^[a-f0-9]{64}$'),
 edition_marker text,
 CHECK(source_id IN ('bmi-visa-nationality-matrix','bmi-general-entry','bmeia-bern-how-to-apply'))
);
INSERT INTO official_v3_at_source_watch_private.pins_v1(source_id,url,expected_bytes,raw_sha,canonical_sha,edition_marker) VALUES
 ('bmi-visa-nationality-matrix',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
  498415,'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778',NULL,
  '(Stand: 6.11.2026)'),
 ('bmi-general-entry',
  'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html',
  91655,'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e',NULL,NULL),
 ('bmeia-bern-how-to-apply',
  'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/',
  172460,'7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18',
  'b696180d20ac97333f54f0bb6fc3dc55481884ac3663d3dcb67a7a3367052a55',NULL);
DO $pin$
DECLARE p record; archived record; canonical text; asset_count integer;
BEGIN
 IF (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3 THEN
  RAISE EXCEPTION 'AT_SOURCE_WATCH_PIN_CARDINALITY' USING ERRCODE='P7986'; END IF;
 FOR p IN SELECT * FROM official_v3_at_source_watch_private.pins_v1 LOOP
  SELECT * INTO archived FROM official_v3_at_private.whole_originals_v2 WHERE source_id=p.source_id;
  IF NOT FOUND OR archived.body_bytes<>p.expected_bytes
   OR archived.body_digest<>p.raw_sha OR archived.official_url<>p.url
   OR archived.body_digest<>encode(extensions.digest(archived.original_body,'sha256'),'hex')
  THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_PIN_MISMATCH' USING ERRCODE='P7986'; END IF;
  IF p.edition_marker IS NOT NULL AND position(p.edition_marker IN convert_from(archived.original_body,'UTF8'))=0
  THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_EDITION_MISMATCH' USING ERRCODE='P7986'; END IF;
  IF p.source_id='bmeia-bern-how-to-apply' THEN
   SELECT count(*) INTO asset_count FROM regexp_matches(convert_from(archived.original_body,'UTF8'),
     '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")', 'g');
   canonical:=regexp_replace(convert_from(archived.original_body,'UTF8'),
     '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
     E'\\1TIMESTAMP\\2','g');
   IF asset_count<>19 OR encode(extensions.digest(convert_to(canonical,'UTF8'),'sha256'),'hex')<>p.canonical_sha
   THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_CANONICAL_CONTRACT_INVALID' USING ERRCODE='P7986'; END IF;
  END IF;
 END LOOP;
END $pin$;

CREATE TABLE official_v3_at_source_watch_private.batches_v1(
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE official_v3_at_source_watch_private.reads_v1(
 batch_id bigint NOT NULL REFERENCES official_v3_at_source_watch_private.batches_v1(batch_id),
 source_id text NOT NULL REFERENCES official_v3_at_source_watch_private.pins_v1(source_id),
 request_id bigint UNIQUE NOT NULL,
 requested_at timestamptz NOT NULL,
 observed_at timestamptz,
 observed_bytes integer,
 observed_sha text,
 state text NOT NULL DEFAULT 'pending'
   CHECK(state IN ('pending','unchanged_exact','unchanged_asset_version_only','changed','unavailable')),
 PRIMARY KEY(batch_id,source_id),
 CHECK((state='pending' AND observed_at IS NULL) OR (state<>'pending' AND observed_at IS NOT NULL))
);
ALTER TABLE official_v3_at_source_watch_private.pins_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_source_watch_private.pins_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_source_watch_private.batches_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_source_watch_private.batches_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_source_watch_private.reads_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_at_source_watch_private.reads_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON official_v3_at_source_watch_private.pins_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY postgres_only ON official_v3_at_source_watch_private.batches_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY postgres_only ON official_v3_at_source_watch_private.reads_v1 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON ALL TABLES IN SCHEMA official_v3_at_source_watch_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA official_v3_at_source_watch_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION official_v3_at_source_watch_private.enqueue_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $enqueue$
DECLARE p record; bid bigint; req bigint; started timestamptz;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_GUARD_REFUSED' USING ERRCODE='P7987'; END IF;
 IF NOT pg_try_advisory_xact_lock(771108,2) THEN RETURN 0; END IF;
 IF (SELECT max(requested_at) FROM official_v3_at_source_watch_private.batches_v1)>
   clock_timestamp()-interval '50 minutes' THEN RETURN 0; END IF;
 started:=clock_timestamp();
 INSERT INTO official_v3_at_source_watch_private.batches_v1(requested_at)
 VALUES(started) RETURNING batch_id INTO bid;
 FOR p IN SELECT * FROM official_v3_at_source_watch_private.pins_v1 ORDER BY source_id LOOP
  req:=net.http_get(p.url,'{}'::jsonb,'{"accept":"text/html"}'::jsonb,15000);
  INSERT INTO official_v3_at_source_watch_private.reads_v1(
   batch_id,source_id,request_id,requested_at) VALUES(bid,p.source_id,req,started);
 END LOOP;
 RETURN 3;
END $enqueue$;

CREATE FUNCTION official_v3_at_source_watch_private.collect_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $collect$
DECLARE a record; r record; result_state text; measured_bytes integer; measured_sha text;
 canonical text; asset_count integer; settled integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN
  RAISE EXCEPTION 'AT_SOURCE_WATCH_COLLECT_ROLE_REFUSED' USING ERRCODE='P7987'; END IF;
 FOR a IN
  SELECT c.batch_id,c.source_id,c.request_id,c.requested_at,p.expected_bytes,p.raw_sha,
   p.canonical_sha,p.edition_marker
  FROM official_v3_at_source_watch_private.reads_v1 c
  JOIN official_v3_at_source_watch_private.pins_v1 p USING(source_id)
  WHERE c.state='pending' ORDER BY c.batch_id,c.source_id FOR UPDATE OF c SKIP LOCKED
 LOOP
  SELECT * INTO r FROM net._http_response WHERE id=a.request_id ORDER BY created DESC LIMIT 1;
  IF NOT FOUND AND clock_timestamp()<a.requested_at+interval '5 minutes' THEN CONTINUE; END IF;
  result_state:='unavailable'; measured_bytes:=NULL; measured_sha:=NULL;
  IF FOUND AND r.status_code=200 AND r.timed_out IS NOT TRUE AND r.error_msg IS NULL
   AND r.content IS NOT NULL AND r.content_type ~* '^text/html([; ]|$)' THEN
   measured_bytes:=octet_length(convert_to(r.content,'UTF8'));
   IF measured_bytes BETWEEN 1 AND 1048576 THEN
    measured_sha:=encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex');
    IF measured_bytes=a.expected_bytes AND measured_sha=a.raw_sha
      AND (a.edition_marker IS NULL OR position(a.edition_marker IN r.content)>0)
    THEN result_state:='unchanged_exact';
    ELSIF a.source_id='bmeia-bern-how-to-apply' AND measured_bytes=a.expected_bytes THEN
      SELECT count(*) INTO asset_count FROM regexp_matches(r.content,
       '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")','g');
      canonical:=regexp_replace(r.content,
       '((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")',
       E'\\1TIMESTAMP\\2','g');
      IF asset_count=19 AND encode(extensions.digest(convert_to(canonical,'UTF8'),'sha256'),'hex')=a.canonical_sha
      THEN result_state:='unchanged_asset_version_only';
      ELSE result_state:='changed'; END IF;
    ELSE result_state:='changed'; END IF;
   END IF;
  END IF;
  UPDATE official_v3_at_source_watch_private.reads_v1
    SET state=result_state,observed_at=clock_timestamp(),
      observed_bytes=measured_bytes,observed_sha=measured_sha
    WHERE batch_id=a.batch_id AND source_id=a.source_id AND state='pending';
  settled:=settled+1;
 END LOOP;
 RETURN settled;
END $collect$;

CREATE FUNCTION official_v3_at_source_watch_private.status_v1() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $status$
DECLARE b record; checks integer; same integer; changed_count integer; still_pending integer;
 enabled_jobs integer; decision text:='SOURCE_UNAVAILABLE';
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user THEN
  RAISE EXCEPTION 'AT_SOURCE_WATCH_STATUS_ROLE_REFUSED' USING ERRCODE='P7987'; END IF;
 SELECT * INTO b FROM official_v3_at_source_watch_private.batches_v1
 ORDER BY batch_id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('status',decision,'accepted',0,'published',0); END IF;
 SELECT count(*),
  count(*) FILTER (WHERE state IN ('unchanged_exact','unchanged_asset_version_only')),
  count(*) FILTER (WHERE state='changed'),
  count(*) FILTER (WHERE state='pending')
 INTO checks,same,changed_count,still_pending
 FROM official_v3_at_source_watch_private.reads_v1 WHERE batch_id=b.batch_id;
 SELECT count(*) INTO enabled_jobs FROM cron.job WHERE active AND username='postgres'
  AND jobname IN ('jetnity-at-source-enqueue-dev-v1','jetnity-at-source-collect-dev-v1');
 IF enabled_jobs=2 AND clock_timestamp()<b.requested_at+interval '70 minutes'
  AND public.official_v3_guard_alarm_status_v1()->>'status'='current'
  AND checks=3 AND still_pending=0 THEN
   IF changed_count>0 THEN decision:='CHANGED_REQUIRES_REVIEW';
   ELSIF same=3 THEN decision:='PINNED_UNCHANGED_NOT_APPROVED'; END IF;
 END IF;
 RETURN jsonb_build_object('status',decision,'sources',checks,'exactOrAssetOnly',same,
  'changed',changed_count,'requestedAt',b.requested_at,'accepted',0,'published',0);
END $status$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_at_source_watch_private FROM PUBLIC,anon,authenticated,service_role;

-- The collector is not a fact importer; it never updates source custody or
-- approved projections. 5-minute reconciliation is only for pg_net receipts.
SELECT cron.schedule('jetnity-at-source-enqueue-dev-v1','9 * * * *',
 'SELECT official_v3_at_source_watch_private.enqueue_v1()');
SELECT cron.schedule('jetnity-at-source-collect-dev-v1','*/5 * * * *',
 'SELECT official_v3_at_source_watch_private.collect_v1()');
DO $post$
BEGIN
 IF (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND jobname IN
    ('jetnity-at-source-enqueue-dev-v1','jetnity-at-source-collect-dev-v1'))<>2
 OR has_schema_privilege('anon','official_v3_at_source_watch_private','USAGE')
 OR has_schema_privilege('authenticated','official_v3_at_source_watch_private','USAGE')
 OR has_schema_privilege('service_role','official_v3_at_source_watch_private','USAGE')
 OR has_function_privilege('anon','official_v3_at_source_watch_private.enqueue_v1()','EXECUTE')
 OR has_function_privilege('authenticated','official_v3_at_source_watch_private.status_v1()','EXECUTE')
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
     WHERE n.nspname='official_v3_at_source_watch_private' AND c.relkind='r'
       AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_SOURCE_WATCH_SCHEDULER_OR_PRIVILEGE_PROOF_FAILED' USING ERRCODE='P7986'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
-- Rollback after independent review: cron.unschedule both named jobs,
-- then DROP SCHEMA official_v3_at_source_watch_private CASCADE, Dev only.
