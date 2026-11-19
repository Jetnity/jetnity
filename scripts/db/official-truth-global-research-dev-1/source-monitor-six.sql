-- Development only. Real government source BODY monitor for the six next
-- research countries (GR, GB, US, TR, TH, AE), 11 immutable official URLs.
-- A successful HTTP 200 / raw SHA is only research, NEVER a visa decision.
-- Other priority countries retain their current monitors; all 50-pass
-- candidates of this global source index remain "derzeit nicht verfügbar".
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='35s';
SET LOCAL jetnity.global_monitor_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-GOV-SIX-1';
DO $before$
DECLARE h text;
BEGIN
 SELECT encode(sha256(convert_to(string_agg(dest||'|'||source_key||'|'||official_url,E'\n'
   ORDER BY dest COLLATE "C",source_key COLLATE "C"),'UTF8')),'hex')
 INTO h FROM jetnity_next_six_research_private.official_urls_v1;
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.global_monitor_target',true) IS DISTINCT FROM
   'dev:yfvbxvijcorffwxbxahl:GLOBAL-GOV-SIX-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_global_source_monitor_private') IS NOT NULL
 OR to_regnamespace('jetnity_global_research_private') IS NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_next_six_research_private.official_urls_v1)<>11
 OR (SELECT count(DISTINCT dest) FROM jetnity_next_six_research_private.official_urls_v1)<>6
 OR EXISTS(SELECT 1 FROM jetnity_next_six_research_private.official_urls_v1
   WHERE verified OR accepted OR source_body_sha IS NOT NULL
   OR official_url NOT LIKE 'https://%')
 OR h IS DISTINCT FROM '5aa730bb5d439f45ee42ce0fb14dd344e2007de95e94f7210fc74474f44c4a6d'
 OR (SELECT count(*) FROM cron.job WHERE jobname LIKE 'jetnity-global-gov-six-%')<>0
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regclass('net._http_response') IS NULL
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR NOT pg_try_advisory_xact_lock(771115,6)
 THEN RAISE EXCEPTION 'GLOBAL_SIX_GOV_SOURCE_DEV_PREDECESSOR_REFUSED'
 USING ERRCODE='P7982'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $before$;

CREATE SCHEMA jetnity_global_source_monitor_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_global_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_global_source_monitor_private.immutable_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN
 RAISE EXCEPTION 'GLOBAL_SIX_GOV_APPEND_ONLY' USING ERRCODE='P7982';
END $deny$;
REVOKE ALL ON FUNCTION jetnity_global_source_monitor_private.immutable_v1()
 FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE jetnity_global_source_monitor_private.sources_v1(
 dest text NOT NULL REFERENCES jetnity_global_research_private.destinations_v1(destination_code),
 source_key text NOT NULL CHECK(source_key ~ '^[a-z][a-z0-9-]{1,63}$'),
 topic text NOT NULL CHECK(topic IN ('visa','eta','forms','transit')),
 official_url text NOT NULL UNIQUE CHECK(official_url LIKE 'https://%'),
 archive_manifest_digest text NOT NULL CHECK(archive_manifest_digest=
 '5aa730bb5d439f45ee42ce0fb14dd344e2007de95e94f7210fc74474f44c4a6d'),
 source_verification_state text NOT NULL DEFAULT 'RESEARCH_ONLY'
 CHECK(source_verification_state='RESEARCH_ONLY'),
 legally_qualified boolean NOT NULL DEFAULT false CHECK(NOT legally_qualified),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 PRIMARY KEY(dest,source_key)
);
INSERT INTO jetnity_global_source_monitor_private.sources_v1(
 dest,source_key,topic,official_url,archive_manifest_digest)
SELECT dest,source_key,topic,official_url,
 '5aa730bb5d439f45ee42ce0fb14dd344e2007de95e94f7210fc74474f44c4a6d'
FROM jetnity_next_six_research_private.official_urls_v1
ORDER BY dest,source_key;

CREATE TABLE jetnity_global_source_monitor_private.batches_v1(
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_count integer NOT NULL DEFAULT 11 CHECK(source_count=11),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only)
);
CREATE TABLE jetnity_global_source_monitor_private.requests_v1(
 batch_id bigint NOT NULL REFERENCES jetnity_global_source_monitor_private.batches_v1(batch_id),
 dest text NOT NULL,
 source_key text NOT NULL,
 request_id bigint NOT NULL UNIQUE,
 requested_at timestamptz NOT NULL,
 PRIMARY KEY(batch_id,dest,source_key),
 FOREIGN KEY(dest,source_key) REFERENCES jetnity_global_source_monitor_private.sources_v1(dest,source_key)
);
CREATE TABLE jetnity_global_source_monitor_private.observations_v1(
 batch_id bigint NOT NULL,
 dest text NOT NULL,
 source_key text NOT NULL,
 observed_at timestamptz NOT NULL,
 http_status integer,
 result text NOT NULL CHECK(result IN(
  'unqualified_snapshot','same_unqualified_snapshot',
  'changed_unqualified_snapshot','unavailable','rejected_body')),
 raw_sha text CHECK(raw_sha IS NULL OR raw_sha ~ '^[a-f0-9]{64}$'),
 body_bytes integer CHECK(body_bytes IS NULL OR body_bytes BETWEEN 1000 AND 1048576),
 approved boolean NOT NULL DEFAULT false CHECK(NOT approved),
 published_facts integer NOT NULL DEFAULT 0 CHECK(published_facts=0),
 PRIMARY KEY(batch_id,dest,source_key),
 FOREIGN KEY(batch_id,dest,source_key) REFERENCES
  jetnity_global_source_monitor_private.requests_v1(batch_id,dest,source_key),
 CHECK((result IN ('unqualified_snapshot','same_unqualified_snapshot','changed_unqualified_snapshot'))
   = (raw_sha IS NOT NULL AND body_bytes IS NOT NULL))
);
CREATE TABLE jetnity_global_source_monitor_private.first_originals_v1(
 dest text NOT NULL,
 source_key text NOT NULL,
 batch_id bigint NOT NULL,
 observed_at timestamptz NOT NULL,
 original_html bytea NOT NULL CHECK(octet_length(original_html) BETWEEN 1000 AND 1048576),
 raw_sha text GENERATED ALWAYS AS (encode(sha256(original_html),'hex')) STORED,
 body_bytes integer GENERATED ALWAYS AS (octet_length(original_html)) STORED,
 evidence_kind text NOT NULL DEFAULT 'UNQUALIFIED_GOVERNMENT_HTTP_BODY'
 CHECK(evidence_kind='UNQUALIFIED_GOVERNMENT_HTTP_BODY'),
 legal_rule_approved boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_approved),
 public_rule_approved boolean NOT NULL DEFAULT false CHECK(NOT public_rule_approved),
 PRIMARY KEY(dest,source_key),
 FOREIGN KEY(dest,source_key) REFERENCES jetnity_global_source_monitor_private.sources_v1(dest,source_key),
 FOREIGN KEY(batch_id,dest,source_key) REFERENCES
  jetnity_global_source_monitor_private.observations_v1(batch_id,dest,source_key)
);

DO $rls$
DECLARE tbl text;
BEGIN
 FOREACH tbl IN ARRAY ARRAY['sources_v1','batches_v1','requests_v1','observations_v1','first_originals_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_global_source_monitor_private.%I ENABLE ROW LEVEL SECURITY',tbl);
  EXECUTE format('ALTER TABLE jetnity_global_source_monitor_private.%I FORCE ROW LEVEL SECURITY',tbl);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_global_source_monitor_private.%I TO postgres USING(true) WITH CHECK(true)',tbl);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_global_source_monitor_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_global_source_monitor_private.immutable_v1()',tbl);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_global_source_monitor_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_global_source_monitor_private.immutable_v1()',tbl);
 END LOOP;
END $rls$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_global_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_global_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_global_source_monitor_private.enqueue_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $enqueue$
DECLARE b bigint; n integer:=0; src record; now_at timestamptz:=clock_timestamp();
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,61)
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 THEN RETURN 0; END IF;
 IF (SELECT max(requested_at) FROM jetnity_global_source_monitor_private.batches_v1)
 >now_at-interval '50 minutes' THEN RETURN 0; END IF;
 INSERT INTO jetnity_global_source_monitor_private.batches_v1(requested_at)
 VALUES(now_at) RETURNING batch_id INTO b;
 FOR src IN SELECT dest,source_key,official_url
  FROM jetnity_global_source_monitor_private.sources_v1
  ORDER BY dest,source_key LOOP
  INSERT INTO jetnity_global_source_monitor_private.requests_v1
  (batch_id,dest,source_key,request_id,requested_at)
  VALUES(b,src.dest,src.source_key,
    net.http_get(src.official_url,'{}'::jsonb,'{"accept":"text/html"}'::jsonb,15000),now_at);
  n:=n+1;
 END LOOP;
 IF n<>11 THEN RAISE EXCEPTION 'GLOBAL_SOURCE_INCOMPLETE_BATCH' USING ERRCODE='P7982'; END IF;
 RETURN n;
END $enqueue$;
CREATE FUNCTION jetnity_global_source_monitor_private.collect_v1() RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $collector$
DECLARE req record; resp record; prev record; found_response boolean;
 bytes integer; digest text; state text; saved integer:=0; original text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RETURN 0; END IF;
 FOR req IN
 SELECT r.* FROM jetnity_global_source_monitor_private.requests_v1 r
 WHERE NOT EXISTS(
   SELECT 1 FROM jetnity_global_source_monitor_private.observations_v1 o
   WHERE o.batch_id=r.batch_id AND o.dest=r.dest AND o.source_key=r.source_key)
 ORDER BY r.batch_id,r.dest,r.source_key FOR UPDATE OF r SKIP LOCKED
 LOOP
  SELECT * INTO resp FROM net._http_response WHERE id=req.request_id LIMIT 1;
  found_response:=FOUND;
  IF NOT found_response AND clock_timestamp()<req.requested_at+interval '6 minutes' THEN CONTINUE; END IF;
  state:='unavailable';digest:=NULL;bytes:=NULL;
  IF found_response AND resp.status_code=200 AND resp.timed_out IS NOT TRUE
    AND resp.error_msg IS NULL AND resp.content IS NOT NULL
    AND resp.content_type~*'^text/html([; ]|$)' THEN
   original:=resp.content;
   bytes:=octet_length(convert_to(original,'UTF8'));
   IF bytes BETWEEN 1000 AND 1048576
      AND (position('<html' IN lower(left(original,4096)))>0
        OR position('<!doctype html' IN lower(left(original,4096)))>0)
      AND position('radware bot manager captcha' IN lower(left(original,4096)))=0
      AND position('access denied' IN lower(left(original,4096)))=0
      AND position('accesso negato' IN lower(left(original,4096)))=0
   THEN
    digest:=encode(sha256(convert_to(original,'UTF8')),'hex');
    SELECT * INTO prev FROM jetnity_global_source_monitor_private.first_originals_v1
    WHERE dest=req.dest AND source_key=req.source_key;
    IF NOT FOUND THEN state:='unqualified_snapshot';
    ELSIF prev.raw_sha=digest AND prev.body_bytes=bytes THEN state:='same_unqualified_snapshot';
    ELSE state:='changed_unqualified_snapshot'; END IF;
   ELSE state:='rejected_body';digest:=NULL;bytes:=NULL; END IF;
  END IF;
  INSERT INTO jetnity_global_source_monitor_private.observations_v1(
   batch_id,dest,source_key,observed_at,http_status,result,raw_sha,body_bytes)
  VALUES(req.batch_id,req.dest,req.source_key,clock_timestamp(),
   CASE WHEN found_response THEN resp.status_code ELSE NULL END,state,digest,bytes);
  IF state='unqualified_snapshot' THEN
   INSERT INTO jetnity_global_source_monitor_private.first_originals_v1(
     dest,source_key,batch_id,observed_at,original_html)
   VALUES(req.dest,req.source_key,req.batch_id,clock_timestamp(),convert_to(original,'UTF8'))
   ON CONFLICT DO NOTHING;
  END IF;
  saved:=saved+1;
 END LOOP;
 RETURN saved;
END $collector$;

CREATE FUNCTION jetnity_global_source_monitor_private.summary_v1() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $status$
DECLARE b bigint; n integer; same integer; changed integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 THEN RETURN jsonb_build_object('status','unavailable','approved',0,'published',0); END IF;
 SELECT max(batch_id) INTO b FROM jetnity_global_source_monitor_private.batches_v1;
 IF b IS NULL THEN RETURN jsonb_build_object('status','unavailable','approved',0,'published',0); END IF;
 SELECT count(*),count(*) FILTER(WHERE result='same_unqualified_snapshot'),
  count(*) FILTER(WHERE result='changed_unqualified_snapshot')
 INTO n,same,changed FROM jetnity_global_source_monitor_private.observations_v1
 WHERE batch_id=b;
 RETURN jsonb_build_object('status','RESEARCH_ONLY','sources',11,'observed',n,
  'sameResearchBody',same,'changedResearchBody',changed,'approved',0,'published',0);
END $status$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_global_source_monitor_private
 FROM PUBLIC,anon,authenticated,service_role;

-- Staggered from the existing Dev authority and BG1 crons.
-- Enqueue at :24 hourly; short collector checks every five minutes from :27.
SELECT cron.schedule('jetnity-global-gov-six-enqueue-dev','24 * * * *',
 'SELECT jetnity_global_source_monitor_private.enqueue_v1()');
SELECT cron.schedule('jetnity-global-gov-six-collect-dev','27,32,37,42,47,52,57 * * * *',
 'SELECT jetnity_global_source_monitor_private.collect_v1()');

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(DISTINCT dest) FROM jetnity_global_source_monitor_private.sources_v1)<>6
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.batches_v1)<>0
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.requests_v1)<>0
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1)<>0
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.first_originals_v1)<>0
 OR EXISTS(SELECT 1 FROM jetnity_global_source_monitor_private.sources_v1
  WHERE legally_qualified OR publication_allowed OR source_verification_state<>'RESEARCH_ONLY')
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
  AND jobname IN('jetnity-global-gov-six-enqueue-dev','jetnity-global-gov-six-collect-dev'))<>2
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='jetnity_global_source_monitor_private' AND c.relkind='r'
   AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR has_table_privilege('anon',c.oid,'SELECT')
    OR has_table_privilege('authenticated',c.oid,'SELECT')
    OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_global_source_monitor_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_global_source_monitor_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_global_source_monitor_private','USAGE')
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
     WHERE customer_status<>'derzeit nicht verfügbar' OR publication_allowed)<>0
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_GOV_SIX_PRIVATE_MONITOR_POSTCHECK_REFUSED'
 USING ERRCODE='P7982'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
