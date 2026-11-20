-- DEV ONLY. One public official USAGov URL; NO visas/ESTA conclusions.
-- Reuse the existing five-minute private review clock, with at most ONE
-- new HTTP GET per 65 minutes. Stop after 320 requests, at 24 MiB of
-- persisted monitor response body text, or >=256 MiB total Dev DB.
-- History append-only; all statuses RESEARCH_ONLY, never publication.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='50s';
SET LOCAL jetnity.usagov_monitor_target='dev:yfvbxvijcorffwxbxahl:USAGOV-HOURLY-V1';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.usagov_monitor_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:USAGOV-HOURLY-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_usagov_watch_private') IS NOT NULL
 OR to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') IS NULL
 OR to_regclass('net._http_response') IS NULL
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1
    WHERE government_source_url='https://www.usa.gov/visa-waiver-esta'
     AND source_bytes=42833
     AND source_sha256='40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47'
     AND NOT source_custody_verified AND NOT legal_rule_qualified
     AND NOT publication_allowed AND accepted_fact_count=0
     AND source_sha256=encode(sha256(original_html),'hex'))<>1
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
    AND schedule='*/5 * * * *' AND active AND username='postgres'
    AND database='postgres'
    AND command='SELECT jetnity_source_body_private.capture_all_v2()')<>1
 OR md5(pg_get_functiondef('jetnity_source_body_private.capture_all_v2()'::regprocedure))
    IS DISTINCT FROM '92979edabef4be3a602bc820cd429c4f'
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,751)
 THEN RAISE EXCEPTION 'USAGOV_WATCH_DEV_EXACT_PREDECESSOR_REQUIRED'
  USING ERRCODE='P7990'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_usagov_watch_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_usagov_watch_private
 FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_usagov_watch_private.no_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
 SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'USAGOV_WATCH_APPEND_ONLY' USING ERRCODE='P7990'; END $deny$;

CREATE TABLE jetnity_usagov_watch_private.requests_v1(
 request_id bigint PRIMARY KEY CHECK(request_id>0),
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 destination_code text NOT NULL DEFAULT 'US' CHECK(destination_code='US'),
 source_key text NOT NULL DEFAULT 'usagov-vwp-esta' CHECK(source_key='usagov-vwp-esta'),
 source_url text NOT NULL DEFAULT 'https://www.usa.gov/visa-waiver-esta'
  CHECK(source_url='https://www.usa.gov/visa-waiver-esta'),
 evidence_class text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(evidence_class='RESEARCH_ONLY')
);
CREATE TABLE jetnity_usagov_watch_private.observations_v1(
 request_id bigint PRIMARY KEY
  REFERENCES jetnity_usagov_watch_private.requests_v1(request_id),
 observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 http_status integer CHECK(http_status IS NULL OR http_status BETWEEN 100 AND 599),
 result text NOT NULL CHECK(result IN(
   'unchanged_unqualified','changed_requires_review','unqualified_snapshot',
   'source_unavailable','invalid_source_body','collection_timeout')),
 raw_sha text CHECK(raw_sha IS NULL OR raw_sha~'^[a-f0-9]{64}$'),
 body_bytes integer CHECK(body_bytes IS NULL OR body_bytes BETWEEN 1000 AND 131072),
 source_body bytea,
 source_custody_verified boolean NOT NULL DEFAULT false CHECK(NOT source_custody_verified),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK(accepted_fact_count=0),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 customer_answer text NOT NULL DEFAULT 'derzeit nicht verfügbar'
  CHECK(customer_answer='derzeit nicht verfügbar'),
 CHECK (
   (result IN('unqualified_snapshot','unchanged_unqualified','changed_requires_review')
    AND http_status=200 AND raw_sha IS NOT NULL AND body_bytes IS NOT NULL AND source_body IS NOT NULL
    AND body_bytes=octet_length(source_body)
    AND raw_sha=encode(sha256(source_body),'hex'))
  OR
   (result IN('source_unavailable','invalid_source_body','collection_timeout')
    AND raw_sha IS NULL AND body_bytes IS NULL AND source_body IS NULL)
 )
);

ALTER TABLE jetnity_usagov_watch_private.requests_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_usagov_watch_private.requests_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_usagov_watch_private.observations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_usagov_watch_private.observations_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_usagov_watch_private.requests_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY postgres_only ON jetnity_usagov_watch_private.observations_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_usagov_watch_private.requests_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_usagov_watch_private.no_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_usagov_watch_private.requests_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_usagov_watch_private.no_mutation_v1();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_usagov_watch_private.observations_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_usagov_watch_private.no_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_usagov_watch_private.observations_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_usagov_watch_private.no_mutation_v1();

-- New HTTP calls MUST be generated only from this fixed code-owned URL
-- without query parameters, cookies, tokens, model content, or personal data.
-- At most 320 across this pilot; >=65-minute spacing guards account for
-- all prior requests, including failed/expired ones. No new Cron.
CREATE FUNCTION jetnity_usagov_watch_private.enqueue_v1()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $enqueue$
DECLARE n integer; last_sent timestamptz; request_id bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,752)
 OR pg_database_size(current_database())>=268435456
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1
     WHERE source_sha256='40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47'
     AND source_bytes=42833 AND NOT source_custody_verified
     AND NOT publication_allowed AND accepted_fact_count=0)<>1
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 THEN RETURN 0; END IF;
 SELECT count(*),max(requested_at) INTO n,last_sent
 FROM jetnity_usagov_watch_private.requests_v1;
 IF n>=320 OR (last_sent IS NOT NULL
    AND last_sent>clock_timestamp()-interval '65 minutes')
 OR (SELECT coalesce(sum(body_bytes),0)
     FROM jetnity_usagov_watch_private.observations_v1)>25165824
 THEN RETURN 0; END IF;

 request_id:=net.http_get('https://www.usa.gov/visa-waiver-esta',
   '{}'::jsonb,'{"accept":"text/html"}'::jsonb,15000);
 INSERT INTO jetnity_usagov_watch_private.requests_v1(request_id,requested_at)
 VALUES(request_id,clock_timestamp());
 RETURN 1;
END $enqueue$;

-- A received HTTP 200 is still not a legal source attestation. Treat all
-- changes, inaccessible pages and timeouts as nonpublishable research only.
CREATE FUNCTION jetnity_usagov_watch_private.collect_v1()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $collect$
DECLARE item record; n integer:=0; new_hash text; earlier_hash text;
 result_code text; data_bytes bytea; bytes integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,753)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 THEN RETURN 0; END IF;
 FOR item IN
  SELECT q.request_id,q.requested_at,
    r.id response_id,r.status_code,r.content_type,r.content,r.timed_out,r.error_msg
  FROM jetnity_usagov_watch_private.requests_v1 q
  LEFT JOIN net._http_response r ON r.id=q.request_id
  WHERE NOT EXISTS (
   SELECT 1 FROM jetnity_usagov_watch_private.observations_v1 e
   WHERE e.request_id=q.request_id)
  ORDER BY q.requested_at ASC LIMIT 8
 LOOP
  IF item.response_id IS NULL AND
    item.requested_at>clock_timestamp()-interval '8 minutes'
  THEN CONTINUE; END IF;
  data_bytes:=NULL;new_hash:=NULL;bytes:=NULL;
  IF item.response_id IS NULL THEN result_code:='collection_timeout';
  ELSIF item.status_code IS DISTINCT FROM 200
   OR item.error_msg IS NOT NULL OR item.timed_out IS TRUE
   THEN result_code:='source_unavailable';
  ELSIF item.content IS NULL OR item.content_type IS NULL
    OR item.content_type!~*'^text/html([; ]|$)'
    OR octet_length(convert_to(item.content,'UTF8')) NOT BETWEEN 1000 AND 131072
    OR position('<html' IN lower(left(item.content,4096)))=0
    OR position('access denied' IN lower(left(item.content,4096)))>0
    OR position('captcha' IN lower(left(item.content,4096)))>0
    THEN result_code:='invalid_source_body';
  ELSE
   data_bytes:=convert_to(item.content,'UTF8');
   bytes:=octet_length(data_bytes);
   new_hash:=encode(sha256(data_bytes),'hex');
   SELECT COALESCE(
     (SELECT e.raw_sha FROM jetnity_usagov_watch_private.observations_v1 e
       WHERE e.raw_sha IS NOT NULL ORDER BY e.observed_at DESC,e.request_id DESC LIMIT 1),
     (SELECT o.source_sha256 FROM jetnity_usagov_fallback_private.original_v1 o
       WHERE o.singleton=1 AND NOT o.source_custody_verified
         AND NOT o.publication_allowed AND o.accepted_fact_count=0))
   INTO earlier_hash;
   IF earlier_hash IS NULL THEN
    data_bytes:=NULL;new_hash:=NULL;bytes:=NULL;
    result_code:='invalid_source_body';
   ELSIF earlier_hash=new_hash THEN result_code:='unchanged_unqualified';
   ELSE result_code:='changed_requires_review';
   END IF;
  END IF;
  INSERT INTO jetnity_usagov_watch_private.observations_v1(
    request_id,observed_at,http_status,result,raw_sha,body_bytes,source_body)
  VALUES(item.request_id,clock_timestamp(),item.status_code,result_code,
    new_hash,bytes,data_bytes)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN n:=n+1; END IF;
 END LOOP;
 RETURN n;
END $collect$;

-- Exactly the existing one five-minute collector, never a second scheduler.
CREATE FUNCTION jetnity_usagov_watch_private.tick_v1()
 RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $tick$
DECLARE prior integer; collected integer; queued integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,754)
 THEN RETURN 0; END IF;
 prior:=jetnity_source_body_private.capture_all_v2();
 collected:=jetnity_usagov_watch_private.collect_v1();
 queued:=jetnity_usagov_watch_private.enqueue_v1();
 RETURN prior+collected+queued;
END $tick$;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_usagov_watch_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_usagov_watch_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_usagov_watch_private
 FROM PUBLIC,anon,authenticated,service_role;

DO $schedule$
DECLARE job_id bigint;
BEGIN
 SELECT j.jobid INTO STRICT job_id FROM cron.job j
 WHERE j.jobname='jetnity-global-source-review-queue-dev'
  AND j.active AND j.username='postgres' AND j.database='postgres'
  AND j.schedule='*/5 * * * *'
  AND j.command='SELECT jetnity_source_body_private.capture_all_v2()';
 PERFORM cron.alter_job(job_id,
  command=>'SELECT jetnity_usagov_watch_private.tick_v1()');
END $schedule$;

SELECT jetnity_usagov_watch_private.tick_v1();

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_usagov_watch_private.requests_v1)<>1
 OR (SELECT count(*) FROM jetnity_usagov_watch_private.observations_v1)<>0
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job j WHERE j.active AND j.username='postgres'
    AND j.database='postgres' AND j.jobname='jetnity-global-source-review-queue-dev'
    AND j.schedule='*/5 * * * *'
    AND j.command='SELECT jetnity_usagov_watch_private.tick_v1()')<>1
 OR (SELECT count(*) FROM jetnity_source_body_private.changed_originals_v1)<11
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
     WHERE ns.nspname='jetnity_usagov_watch_private' AND c.relkind='r'
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
      OR has_table_privilege('anon',c.oid,'SELECT')
      OR has_table_privilege('authenticated',c.oid,'SELECT')
      OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_usagov_watch_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_usagov_watch_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_usagov_watch_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'USAGOV_WATCH_POSTCHECK_ROLLBACK' USING ERRCODE='P7990'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
