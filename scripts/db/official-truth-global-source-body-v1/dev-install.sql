-- DEV ONLY. Preserve a bounded sample of CHANGED unqualified public
-- government HTML. This is research evidence, NEVER a legal determination.
-- Existing first-original archives remain untouched. No additional HTTP calls.
-- pg_net normally expires response bodies; absence never becomes approved.
-- Fixed global cap: 96 rows AND 16 MiB raw body bytes, one per source/day UTC.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='45s';
SET LOCAL jetnity.source_body_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-BODY-V1';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.source_body_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:GLOBAL-BODY-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_source_body_private') IS NOT NULL
 OR to_regnamespace('jetnity_global_review_private') IS NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
     AND active AND username='postgres' AND database='postgres'
     AND schedule='*/5 * * * *'
     AND command='SELECT jetnity_global_review_private.capture_all_v2()')<>1
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR NOT pg_try_advisory_xact_lock(771115,720)
 THEN RAISE EXCEPTION 'SOURCE_BODY_DEV_EXACT_PREDECESSOR_REQUIRED'
   USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_source_body_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_source_body_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_source_body_private.no_mutation_v1() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'SOURCE_BODY_APPEND_ONLY' USING ERRCODE='P7988'; END $deny$;

CREATE TABLE jetnity_source_body_private.changed_originals_v1(
 source_family text NOT NULL CHECK(source_family IN('SIX','FOUR')),
 destination_code text NOT NULL REFERENCES
   jetnity_global_research_private.destinations_v1(destination_code),
 source_key text NOT NULL,
 batch_id bigint NOT NULL CHECK(batch_id>0),
 six_batch_id bigint,
 four_batch_id bigint,
 observed_at timestamptz NOT NULL,
 observed_day_utc date NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_result text NOT NULL CHECK(source_result IN(
   'changed_unqualified_snapshot','changed_requires_review')),
 raw_sha text NOT NULL CHECK(raw_sha~'^[a-f0-9]{64}$'),
 body_bytes integer NOT NULL CHECK(body_bytes BETWEEN 1000 AND 262144),
 original_html bytea NOT NULL,
 evidence_class text NOT NULL DEFAULT 'UNQUALIFIED_RESEARCH_SNAPSHOT'
    CHECK(evidence_class='UNQUALIFIED_RESEARCH_SNAPSHOT'),
 primary_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT primary_rule_qualified),
 legal_fact_approved boolean NOT NULL DEFAULT false CHECK(NOT legal_fact_approved),
 public_publish_allowed boolean NOT NULL DEFAULT false CHECK(NOT public_publish_allowed),
 PRIMARY KEY(source_family,destination_code,source_key,batch_id),
 UNIQUE(source_family,destination_code,source_key,observed_day_utc),
 FOREIGN KEY(six_batch_id,destination_code,source_key)
  REFERENCES jetnity_global_source_monitor_private.observations_v1(batch_id,dest,source_key),
 FOREIGN KEY(four_batch_id,destination_code)
  REFERENCES jetnity_followup_source_monitor_private.observations_v3(batch_id,destination_code),
 CHECK(
   (source_family='SIX' AND six_batch_id=batch_id AND four_batch_id IS NULL
     AND source_result='changed_unqualified_snapshot')
   OR
   (source_family='FOUR' AND four_batch_id=batch_id AND six_batch_id IS NULL
     AND source_key='primary' AND source_result='changed_requires_review')
 ),
 CHECK(observed_day_utc=(observed_at AT TIME ZONE 'UTC')::date),
 CHECK(body_bytes=octet_length(original_html)),
 CHECK(raw_sha=encode(sha256(original_html),'hex'))
);

ALTER TABLE jetnity_source_body_private.changed_originals_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_body_private.changed_originals_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_source_body_private.changed_originals_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_source_body_private.changed_originals_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_source_body_private.no_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_source_body_private.changed_originals_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_source_body_private.no_mutation_v1();

-- A maximum of one latest available changed government response per UTC day
-- and source is copied from existing unlogged pg_net responses, only after
-- matching the immutable original monitor's exact byte length + SHA-256.
-- No model endpoint / no extra government HTTP / no new cost allocation.
CREATE FUNCTION jetnity_source_body_private.capture_changed_v1() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE src record; saved integer:=0; used_rows integer; used_bytes bigint;
 content_bytes bytea; current_bytes integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,721)
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
   WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RETURN 0; END IF;
 SELECT count(*),coalesce(sum(body_bytes),0)
 INTO used_rows,used_bytes FROM jetnity_source_body_private.changed_originals_v1;
 IF used_rows>=96 OR used_bytes>=16777216 THEN RETURN 0; END IF;

 FOR src IN
  WITH requested AS(
   SELECT 'SIX'::text AS source_family,o.dest AS destination_code,
    o.source_key AS source_key,o.batch_id,o.observed_at,
    (o.observed_at AT TIME ZONE 'UTC')::date AS observed_day_utc,
    o.result AS source_result,o.raw_sha,o.body_bytes,
    n.content,n.status_code,n.content_type,n.timed_out,n.error_msg
   FROM jetnity_global_source_monitor_private.observations_v1 o
   JOIN jetnity_global_source_monitor_private.requests_v1 r
    USING(batch_id,dest,source_key)
   JOIN net._http_response n ON n.id=r.request_id
   WHERE o.result='changed_unqualified_snapshot'
    AND o.observed_at>clock_timestamp()-interval '6 hours'
   UNION ALL
   SELECT 'FOUR'::text,o.destination_code,'primary'::text,
    o.batch_id,o.observed_at,(o.observed_at AT TIME ZONE 'UTC')::date,
    o.status,o.source_sha256,o.source_bytes,
    n.content,n.status_code,n.content_type,n.timed_out,n.error_msg
   FROM jetnity_followup_source_monitor_private.observations_v3 o
   JOIN jetnity_followup_source_monitor_private.items_v3 r
    USING(batch_id,destination_code)
   JOIN net._http_response n ON n.id=r.request_id
   WHERE o.status='changed_requires_review'
    AND o.observed_at>clock_timestamp()-interval '6 hours'
  )
  SELECT DISTINCT ON (source_family,destination_code,source_key,observed_day_utc)
   source_family,destination_code,source_key,batch_id,observed_at,
   observed_day_utc,source_result,raw_sha,body_bytes,content
  FROM requested v
  WHERE status_code=200 AND timed_out IS NOT TRUE AND error_msg IS NULL
   AND content IS NOT NULL AND content_type~*'^text/html([; ]|$)'
   AND raw_sha ~ '^[a-f0-9]{64}$'
   AND body_bytes BETWEEN 1000 AND 262144
   AND NOT EXISTS(
    SELECT 1 FROM jetnity_source_body_private.changed_originals_v1 e
    WHERE e.source_family=v.source_family
     AND e.destination_code=v.destination_code
     AND e.source_key=v.source_key
     AND e.observed_day_utc=v.observed_day_utc)
  ORDER BY source_family,destination_code,source_key,observed_day_utc,batch_id DESC
 LOOP
  content_bytes:=convert_to(src.content,'UTF8');
  current_bytes:=octet_length(content_bytes);
  IF current_bytes IS DISTINCT FROM src.body_bytes
   OR encode(sha256(content_bytes),'hex') IS DISTINCT FROM src.raw_sha
   OR position('<html' IN lower(left(src.content,4096)))=0
     AND position('<!doctype html' IN lower(left(src.content,4096)))=0
   OR position('radware bot manager captcha' IN lower(left(src.content,4096)))>0
   OR position('access denied' IN lower(left(src.content,4096)))>0
   OR position('accesso negato' IN lower(left(src.content,4096)))>0
  THEN CONTINUE; END IF;
  IF used_rows>=96 OR used_bytes+current_bytes>16777216 THEN EXIT; END IF;
  INSERT INTO jetnity_source_body_private.changed_originals_v1(
   source_family,destination_code,source_key,batch_id,six_batch_id,four_batch_id,
   observed_at,observed_day_utc,source_result,raw_sha,body_bytes,original_html)
  VALUES(src.source_family,src.destination_code,src.source_key,
   src.batch_id,CASE WHEN src.source_family='SIX' THEN src.batch_id END,
   CASE WHEN src.source_family='FOUR' THEN src.batch_id END,
   src.observed_at,src.observed_day_utc,src.source_result,
   src.raw_sha,current_bytes,content_bytes)
  ON CONFLICT DO NOTHING;
  IF FOUND THEN saved:=saved+1;used_rows:=used_rows+1;used_bytes:=used_bytes+current_bytes; END IF;
 END LOOP;
 RETURN saved;
END $capture$;

-- Keep the single existing shared review job; extend its private command.
-- This also prevents "analyzed" from leaking into the existing public reader.
CREATE FUNCTION jetnity_source_body_private.capture_all_v1() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $both$
DECLARE seen integer; copied integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,722)
 THEN RETURN 0; END IF;
 seen:=jetnity_global_review_private.capture_all_v2();
 copied:=jetnity_source_body_private.capture_changed_v1();
 RETURN seen+copied;
END $both$;

-- This status is not a legal or model classification. Any later changed
-- body without the same hash is UNSAMPLED until a verified sample exists.
CREATE VIEW jetnity_source_body_private.latest_six_source_v1
 WITH (security_invoker=true) AS
SELECT s.dest,s.source_key,
 last_obs.batch_id,last_obs.observed_at,last_obs.raw_sha,last_obs.result,
 CASE
  WHEN last_obs.batch_id IS NULL THEN 'NO_SOURCE_OBSERVATION'
  WHEN last_obs.result='unavailable' THEN 'SOURCE_UNAVAILABLE'
  WHEN last_obs.result='rejected_body' THEN 'SOURCE_BODY_REJECTED'
  WHEN last_obs.raw_sha=sample.raw_sha THEN 'SAMPLED_UNQUALIFIED'
  WHEN last_obs.result='same_unqualified_snapshot' THEN 'UNCHANGED_RESEARCH_ONLY'
  ELSE 'CHANGED_OR_UNSAMPLED_REQUIRES_REVIEW' END AS triage,
 false::boolean AS legal_rule_qualified,false::boolean AS publishable
FROM jetnity_global_source_monitor_private.sources_v1 s
LEFT JOIN LATERAL(
 SELECT o.batch_id,o.observed_at,o.raw_sha,o.result
 FROM jetnity_global_source_monitor_private.observations_v1 o
 WHERE o.dest=s.dest AND o.source_key=s.source_key
 ORDER BY o.batch_id DESC LIMIT 1) last_obs ON true
LEFT JOIN LATERAL(
 SELECT b.raw_sha FROM jetnity_source_body_private.changed_originals_v1 b
 WHERE b.source_family='SIX' AND b.destination_code=s.dest
 AND b.source_key=s.source_key
 ORDER BY b.batch_id DESC LIMIT 1) sample ON true;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_source_body_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_body_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_source_body_private
 FROM PUBLIC,anon,authenticated,service_role;

DO $job$
DECLARE jobid bigint;
BEGIN
 SELECT j.jobid INTO STRICT jobid FROM cron.job j
 WHERE j.jobname='jetnity-global-source-review-queue-dev'
  AND j.active AND j.username='postgres' AND j.database='postgres'
  AND j.schedule='*/5 * * * *'
  AND j.command='SELECT jetnity_global_review_private.capture_all_v2()';
 PERFORM cron.alter_job(jobid,
  command=>'SELECT jetnity_source_body_private.capture_all_v1()');
END $job$;

SELECT jetnity_source_body_private.capture_all_v1();

DO $post$
DECLARE n integer; used bigint;
BEGIN
 SELECT count(*),coalesce(sum(body_bytes),0) INTO n,used
 FROM jetnity_source_body_private.changed_originals_v1;
 IF n>96 OR used>16777216
 OR (SELECT count(*) FROM jetnity_source_body_private.latest_six_source_v1)<>11
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
  WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
   AND jobname='jetnity-global-source-review-queue-dev'
   AND command='SELECT jetnity_source_body_private.capture_all_v1()'
   AND schedule='*/5 * * * *')<>1
 OR EXISTS(SELECT 1 FROM jetnity_source_body_private.changed_originals_v1
    WHERE primary_rule_qualified OR legal_fact_approved OR public_publish_allowed)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='jetnity_source_body_private' AND c.relkind='r'
   AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
    OR has_table_privilege('anon',c.oid,'SELECT')
    OR has_table_privilege('authenticated',c.oid,'SELECT')
    OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_body_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_SOURCE_BODY_DEV_POSTCHECK_ROLLBACK'
 USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
