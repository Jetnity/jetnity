-- DEV ONLY: central immutable review queue for source receipts.
-- One source observation is NOT a legal decision. No customer/public RPC.
-- The scope view covers every 206x50 research case without fabricating a
-- positive fact; additional sources join the same contract only after their
-- own verified registry + owner-gated legal qualification.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='40s';
SET LOCAL jetnity.global_review_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-REVIEW-QUEUE-V1';

DO $pre$
DECLARE expected_sources int;
BEGIN
 SELECT count(*) INTO expected_sources FROM jetnity_global_source_monitor_private.sources_v1;
 IF session_user<>'postgres' OR current_user<>session_user
  OR current_database()<>'postgres'
  OR current_setting('server_version_num')::int/10000<>17
  OR current_setting('jetnity.global_review_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:GLOBAL-REVIEW-QUEUE-V1'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR to_regnamespace('jetnity_global_review_private') IS NOT NULL
  OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1)<>206
  OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
  OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
  OR (SELECT count(*) FROM jetnity_global_research_private.topics_v1)<>26
  OR expected_sources<>11
  OR (SELECT count(DISTINCT dest) FROM jetnity_global_source_monitor_private.sources_v1)<>6
  OR EXISTS(SELECT 1 FROM jetnity_global_source_monitor_private.sources_v1
    WHERE legally_qualified OR publication_allowed OR source_verification_state<>'RESEARCH_ONLY')
  OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE primary_source_verified OR legal_rule_qualified OR publication_allowed
      OR accepted_fact_count<>0 OR customer_status<>'derzeit nicht verfügbar')
  OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
  OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres' AND database='postgres'
    AND ((jobname='jetnity-global-gov-six-enqueue-dev'
      AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_global_source_monitor_private.enqueue_v1()')
      OR (jobname='jetnity-global-gov-six-collect-dev'
      AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_global_source_monitor_private.collect_v1()')))<>2
  OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev')<>0
  OR NOT pg_try_advisory_xact_lock(771115,706)
 THEN RAISE EXCEPTION 'GLOBAL_REVIEW_QUEUE_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7986';
 END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_global_review_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_global_review_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_global_review_private.deny_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'GLOBAL_REVIEW_EVIDENCE_IMMUTABLE' USING ERRCODE='P7986'; END $deny$;

CREATE TABLE jetnity_global_review_private.events_v1(
 batch_id bigint NOT NULL,
 dest text NOT NULL,
 source_key text NOT NULL,
 observed_at timestamptz NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 original_result text NOT NULL CHECK(original_result IN (
  'unqualified_snapshot','same_unqualified_snapshot','changed_unqualified_snapshot',
  'unavailable','rejected_body')),
 disposition text NOT NULL CHECK(disposition IN (
  'INITIAL_RESEARCH_SNAPSHOT','RESEARCH_BYTES_UNCHANGED','RESEARCH_BYTES_CHANGED',
  'SOURCE_UNAVAILABLE','SOURCE_BODY_REJECTED')),
 raw_sha text CHECK(raw_sha IS NULL OR raw_sha ~ '^[a-f0-9]{64}$'),
 http_status integer,
 passport_impact_count integer NOT NULL DEFAULT 50 CHECK(passport_impact_count=50),
 source_qualified boolean NOT NULL DEFAULT false CHECK(NOT source_qualified),
 legal_fact_approved boolean NOT NULL DEFAULT false CHECK(NOT legal_fact_approved),
 public_publish_allowed boolean NOT NULL DEFAULT false CHECK(NOT public_publish_allowed),
 PRIMARY KEY(batch_id,dest,source_key),
 FOREIGN KEY(batch_id,dest,source_key)
  REFERENCES jetnity_global_source_monitor_private.observations_v1(batch_id,dest,source_key),
 FOREIGN KEY(dest,source_key)
  REFERENCES jetnity_global_source_monitor_private.sources_v1(dest,source_key),
 CHECK((original_result='unqualified_snapshot' AND disposition='INITIAL_RESEARCH_SNAPSHOT') OR
       (original_result='same_unqualified_snapshot' AND disposition='RESEARCH_BYTES_UNCHANGED') OR
       (original_result='changed_unqualified_snapshot' AND disposition='RESEARCH_BYTES_CHANGED') OR
       (original_result='unavailable' AND disposition='SOURCE_UNAVAILABLE') OR
       (original_result='rejected_body' AND disposition='SOURCE_BODY_REJECTED'))
);
ALTER TABLE jetnity_global_review_private.events_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_global_review_private.events_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_global_review_private.events_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_global_review_private.events_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_global_review_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_global_review_private.events_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_global_review_private.deny_mutation_v1();

-- Idempotent source-event ingestion. Never infers legal change from HTML SHA.
-- No API invocation, AI decision, user data, or automatic legal publication.
CREATE FUNCTION jetnity_global_review_private.capture_v1() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE saved integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR NOT pg_try_advisory_xact_lock(771115,707)
  OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
  OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 THEN RETURN 0; END IF;
 INSERT INTO jetnity_global_review_private.events_v1
 (batch_id,dest,source_key,observed_at,original_result,disposition,raw_sha,http_status)
 SELECT o.batch_id,o.dest,o.source_key,o.observed_at,o.result,
  CASE o.result
   WHEN 'unqualified_snapshot' THEN 'INITIAL_RESEARCH_SNAPSHOT'
   WHEN 'same_unqualified_snapshot' THEN 'RESEARCH_BYTES_UNCHANGED'
   WHEN 'changed_unqualified_snapshot' THEN 'RESEARCH_BYTES_CHANGED'
   WHEN 'unavailable' THEN 'SOURCE_UNAVAILABLE'
   ELSE 'SOURCE_BODY_REJECTED' END,o.raw_sha,o.http_status
 FROM jetnity_global_source_monitor_private.observations_v1 o
 JOIN jetnity_global_source_monitor_private.sources_v1 s
  ON s.dest=o.dest AND s.source_key=o.source_key
 WHERE NOT EXISTS(SELECT 1 FROM jetnity_global_review_private.events_v1 e
   WHERE e.batch_id=o.batch_id AND e.dest=o.dest AND e.source_key=o.source_key)
 ORDER BY o.batch_id,o.dest,o.source_key
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS saved=ROW_COUNT;
 RETURN saved;
END $capture$;

-- This is a source-specific review status, NOT a pass-specific visa ruling.
-- A newly requested batch stays pending until its own immutable observation
-- arrives. Six-minute collection gaps become visible without rewriting history.
CREATE VIEW jetnity_global_review_private.source_head_v1
WITH (security_invoker=true) AS
SELECT s.dest,s.source_key,s.topic,
  b.batch_id,b.requested_at,evt.observed_at,evt.disposition,evt.raw_sha,
  CASE
   WHEN b.batch_id IS NULL THEN 'NO_SOURCE_BATCH'
   WHEN evt.batch_id=b.batch_id THEN
     CASE evt.disposition
      WHEN 'RESEARCH_BYTES_CHANGED' THEN 'BYTES_CHANGED_REQUIRES_LEGAL_REVIEW'
      WHEN 'SOURCE_UNAVAILABLE' THEN 'SOURCE_UNAVAILABLE_REQUIRES_RETRY'
      WHEN 'SOURCE_BODY_REJECTED' THEN 'BODY_REJECTED_REQUIRES_RETRY'
      ELSE 'RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED' END
   WHEN b.requested_at<=clock_timestamp()-interval '6 minutes'
     THEN 'SOURCE_COLLECTION_TIMEOUT'
   ELSE 'COLLECTION_PENDING'
  END AS triage,
  false::boolean AS legally_qualified,
  false::boolean AS publishable
FROM jetnity_global_source_monitor_private.sources_v1 s
LEFT JOIN LATERAL(
 SELECT b.batch_id,b.requested_at
 FROM jetnity_global_source_monitor_private.batches_v1 b
 JOIN jetnity_global_source_monitor_private.requests_v1 r
   ON r.batch_id=b.batch_id AND r.dest=s.dest AND r.source_key=s.source_key
 ORDER BY b.batch_id DESC LIMIT 1
) b ON true
LEFT JOIN jetnity_global_review_private.events_v1 evt
 ON evt.batch_id=b.batch_id AND evt.dest=s.dest AND evt.source_key=s.source_key;

CREATE VIEW jetnity_global_review_private.destination_head_v1
WITH (security_invoker=true) AS
SELECT dest,count(*)::integer sources,
 count(*) FILTER(WHERE triage='BYTES_CHANGED_REQUIRES_LEGAL_REVIEW')::integer changed,
 count(*) FILTER(WHERE triage IN(
  'SOURCE_UNAVAILABLE_REQUIRES_RETRY','BODY_REJECTED_REQUIRES_RETRY',
  'SOURCE_COLLECTION_TIMEOUT'))::integer failed,
 count(*) FILTER(WHERE triage='COLLECTION_PENDING')::integer pending,
 count(*) FILTER(WHERE triage='RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED')::integer unqualified
FROM jetnity_global_review_private.source_head_v1 GROUP BY dest;

-- Exactly 206*50 private pairs, with optional six-country SOURCE context.
-- Other countries can have their own existing monitors: "not in this registry"
-- never means that the government has no source or that a visa is required.
CREATE VIEW jetnity_global_review_private.passport_triage_v1
WITH (security_invoker=true) AS
SELECT c.destination_code,c.citizenship_code,c.priority_rank,
 c.customer_status,
 COALESCE(d.sources,0)::integer AS global_monitor_sources,
 CASE
  WHEN d.dest IS NULL THEN 'NOT_YET_IN_GLOBAL_SOURCE_REGISTRY'
  WHEN d.changed>0 THEN 'BYTES_CHANGED_REQUIRES_LEGAL_REVIEW'
  WHEN d.failed>0 THEN 'SOURCE_UNAVAILABLE_REQUIRES_RETRY'
  WHEN d.pending>0 THEN 'COLLECTION_PENDING'
  ELSE 'RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED' END AS source_triage,
 false::boolean AS customer_rule_approved,
 false::boolean AS publication_allowed
FROM jetnity_global_research_private.cases_v1 c
LEFT JOIN jetnity_global_review_private.destination_head_v1 d
 ON d.dest=c.destination_code;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;

-- Backfill existing immutable receipts ONCE, then capture subsequent batches.
SELECT jetnity_global_review_private.capture_v1();
SELECT cron.schedule('jetnity-global-source-review-queue-dev','*/5 * * * *',
 'SELECT jetnity_global_review_private.capture_v1()');

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_global_review_private.events_v1)
     IS DISTINCT FROM (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1)
  OR (SELECT count(*) FROM jetnity_global_review_private.source_head_v1)<>11
  OR (SELECT count(*) FROM jetnity_global_review_private.passport_triage_v1)<>10300
  OR (SELECT count(*) FROM jetnity_global_review_private.passport_triage_v1
      WHERE global_monitor_sources>0)<>300
  OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
      WHERE publication_allowed OR accepted_fact_count<>0)<>0
  OR EXISTS(SELECT 1 FROM jetnity_global_review_private.events_v1
    WHERE source_qualified OR legal_fact_approved OR public_publish_allowed)
  OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND jobname='jetnity-global-source-review-queue-dev'
     AND command='SELECT jetnity_global_review_private.capture_v1()'
     AND schedule='*/5 * * * *')<>1
  OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
  OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
    WHERE oid='jetnity_global_review_private.events_v1'::regclass)
  OR has_schema_privilege('anon','jetnity_global_review_private','USAGE')
  OR has_schema_privilege('authenticated','jetnity_global_review_private','USAGE')
  OR has_schema_privilege('service_role','jetnity_global_review_private','USAGE')
  OR has_table_privilege('anon','jetnity_global_review_private.events_v1','SELECT')
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_REVIEW_QUEUE_DEV_POSTCHECK_ROLLBACK' USING ERRCODE='P7986'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
