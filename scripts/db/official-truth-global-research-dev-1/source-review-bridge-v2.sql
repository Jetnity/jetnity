-- DEV ONLY — shared review queue V2: reuses EXISTING monitored AT + IT/FR/ES/PT
-- and six-country research sources without building eleven legal approval paths.
-- All 206 destinations and all 50 passports keep "derzeit nicht verfügbar"
-- unless separately qualified by protected MA1/BG1; this queue cannot publish.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='40s';
SET LOCAL jetnity.global_review_bridge_target='dev:yfvbxvijcorffwxbxahl:GLOBAL-REVIEW-BRIDGE-V2';
DO $pre$
DECLARE review_jobid bigint; followup_jobid bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.global_review_bridge_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:GLOBAL-REVIEW-BRIDGE-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_global_review_private.events_v1') IS NULL
 OR to_regclass('jetnity_global_review_private.followup_events_v2') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1)<>206
 OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(DISTINCT destination_code) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
    AND database='postgres' AND
    ((jobname='jetnity-global-source-review-queue-dev'
      AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_global_review_private.capture_v1()')
     OR (jobname='jetnity-followup-government-enqueue-v3-dev'
      AND schedule='11 * * * *'
      AND command='SELECT jetnity_followup_source_monitor_private.enqueue_v3()')
     OR (jobname='jetnity-followup-government-collect-v3b-dev'
      AND schedule='*/5 * * * *'
      AND command='SELECT jetnity_followup_source_monitor_private.collect_v3b()')))<>3
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
  WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.sources_v3
  WHERE source_qualified OR approved_facts<>0)
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR NOT pg_try_advisory_xact_lock(771115,708)
 THEN RAISE EXCEPTION 'GLOBAL_REVIEW_BRIDGE_V2_EXACT_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7987'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE TABLE jetnity_global_review_private.followup_events_v2(
 batch_id bigint NOT NULL,
 dest text NOT NULL CHECK(dest IN('IT','FR','ES','PT')),
 observed_at timestamptz NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 original_result text NOT NULL CHECK(original_result IN(
  'unqualified_snapshot','unchanged_unqualified','changed_requires_review',
  'http_unavailable','invalid_source_body')),
 disposition text NOT NULL CHECK(disposition IN(
  'INITIAL_RESEARCH_SNAPSHOT','RESEARCH_BYTES_UNCHANGED','RESEARCH_BYTES_CHANGED',
  'SOURCE_UNAVAILABLE','SOURCE_BODY_REJECTED')),
 raw_sha text CHECK(raw_sha IS NULL OR raw_sha ~ '^[a-f0-9]{64}$'),
 http_code integer,
 passport_impact_count integer NOT NULL DEFAULT 50 CHECK(passport_impact_count=50),
 source_qualified boolean NOT NULL DEFAULT false CHECK(NOT source_qualified),
 legal_fact_approved boolean NOT NULL DEFAULT false CHECK(NOT legal_fact_approved),
 public_publish_allowed boolean NOT NULL DEFAULT false CHECK(NOT public_publish_allowed),
 PRIMARY KEY(batch_id,dest),
 FOREIGN KEY(batch_id,dest) REFERENCES
   jetnity_followup_source_monitor_private.observations_v3(batch_id,destination_code),
 FOREIGN KEY(dest) REFERENCES
   jetnity_followup_source_monitor_private.sources_v3(destination_code),
 CHECK((original_result='unqualified_snapshot' AND disposition='INITIAL_RESEARCH_SNAPSHOT') OR
  (original_result='unchanged_unqualified' AND disposition='RESEARCH_BYTES_UNCHANGED') OR
  (original_result='changed_requires_review' AND disposition='RESEARCH_BYTES_CHANGED') OR
  (original_result='http_unavailable' AND disposition='SOURCE_UNAVAILABLE') OR
  (original_result='invalid_source_body' AND disposition='SOURCE_BODY_REJECTED'))
);
ALTER TABLE jetnity_global_review_private.followup_events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_global_review_private.followup_events_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_global_review_private.followup_events_v2
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_global_review_private.followup_events_v2 FOR EACH ROW
 EXECUTE FUNCTION jetnity_global_review_private.deny_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_global_review_private.followup_events_v2 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_global_review_private.deny_mutation_v1();

CREATE FUNCTION jetnity_global_review_private.capture_followup_v2() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE saved integer:=0;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,709)
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RETURN 0; END IF;
 INSERT INTO jetnity_global_review_private.followup_events_v2
   (batch_id,dest,observed_at,original_result,disposition,raw_sha,http_code)
 SELECT o.batch_id,o.destination_code,o.observed_at,o.status,
  CASE o.status
    WHEN 'unqualified_snapshot' THEN 'INITIAL_RESEARCH_SNAPSHOT'
    WHEN 'unchanged_unqualified' THEN 'RESEARCH_BYTES_UNCHANGED'
    WHEN 'changed_requires_review' THEN 'RESEARCH_BYTES_CHANGED'
    WHEN 'http_unavailable' THEN 'SOURCE_UNAVAILABLE'
    ELSE 'SOURCE_BODY_REJECTED' END,
  o.source_sha256,o.http_code
 FROM jetnity_followup_source_monitor_private.observations_v3 o
 JOIN jetnity_followup_source_monitor_private.sources_v3 src
   ON src.destination_code=o.destination_code
 WHERE NOT EXISTS(SELECT 1 FROM jetnity_global_review_private.followup_events_v2 e
   WHERE e.batch_id=o.batch_id AND e.dest=o.destination_code)
 ORDER BY o.batch_id,o.destination_code
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS saved=ROW_COUNT;
 RETURN saved;
END $capture$;

-- Exactly ONE existing scheduler for both existing collectors' receipts.
-- No independent government HTTP requests and no separate AI auto-publisher.
CREATE FUNCTION jetnity_global_review_private.capture_all_v2() RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $capture$
DECLARE six_count integer; eu_count integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR NOT pg_try_advisory_xact_lock(771115,710)
 THEN RETURN 0; END IF;
 six_count:=jetnity_global_review_private.capture_v1();
 eu_count:=jetnity_global_review_private.capture_followup_v2();
 RETURN six_count+eu_count;
END $capture$;

CREATE VIEW jetnity_global_review_private.followup_source_head_v2
 WITH (security_invoker=true) AS
SELECT s.destination_code AS dest,'primary'::text AS source_key,
 s.official_url AS official_url,b.batch_id,b.requested_at,
 evt.observed_at,evt.disposition,evt.raw_sha,
 CASE
  WHEN b.batch_id IS NULL THEN 'NO_SOURCE_BATCH'
  WHEN evt.batch_id=b.batch_id THEN CASE evt.disposition
    WHEN 'RESEARCH_BYTES_CHANGED' THEN 'BYTES_CHANGED_REQUIRES_LEGAL_REVIEW'
    WHEN 'SOURCE_UNAVAILABLE' THEN 'SOURCE_UNAVAILABLE_REQUIRES_RETRY'
    WHEN 'SOURCE_BODY_REJECTED' THEN 'BODY_REJECTED_REQUIRES_RETRY'
    ELSE 'RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED' END
  WHEN b.requested_at<=clock_timestamp()-interval '6 minutes'
   THEN 'SOURCE_COLLECTION_TIMEOUT'
  ELSE 'COLLECTION_PENDING' END AS triage,
 false::boolean AS legally_qualified,false::boolean AS publishable
FROM jetnity_followup_source_monitor_private.sources_v3 s
LEFT JOIN LATERAL(
 SELECT b.batch_id,b.requested_at FROM jetnity_followup_source_monitor_private.requests_v3 b
 JOIN jetnity_followup_source_monitor_private.items_v3 item
 ON item.batch_id=b.batch_id AND item.destination_code=s.destination_code
 ORDER BY b.batch_id DESC LIMIT 1
) b ON true
LEFT JOIN jetnity_global_review_private.followup_events_v2 evt
 ON evt.batch_id=b.batch_id AND evt.dest=s.destination_code;

-- Austria's original THREE exact pinned official sources already have their
-- own V3 monitor/qualified CH-only method. Reuse read-only monitor evidence
-- only: NEVER infer the other 49 passports are entitled to CH's rule.
CREATE VIEW jetnity_global_review_private.austria_source_head_v2
 WITH (security_invoker=true) AS
SELECT 'AT'::text AS dest,p.source_id AS source_key,p.url AS official_url,
 b.batch_id,b.requested_at,r.observed_at,r.state AS disposition,
 r.observed_sha AS raw_sha,
 CASE WHEN b.batch_id IS NULL THEN 'NO_SOURCE_BATCH'
  WHEN r.batch_id=b.batch_id THEN
   CASE WHEN r.state IN('unchanged_exact','unchanged_asset_version_only')
     THEN 'RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED'
    ELSE 'SOURCE_UNAVAILABLE_REQUIRES_RETRY' END
  WHEN b.requested_at<=clock_timestamp()-interval '6 minutes'
   THEN 'SOURCE_COLLECTION_TIMEOUT'
  ELSE 'COLLECTION_PENDING' END AS triage,
 false::boolean AS legally_qualified,false::boolean AS publishable
FROM official_v3_at_source_watch_private.pins_v1 p
LEFT JOIN LATERAL(
 SELECT b.batch_id,b.requested_at
 FROM official_v3_at_source_watch_private.batches_v1 b
 ORDER BY b.batch_id DESC LIMIT 1
) b ON true
LEFT JOIN official_v3_at_source_watch_private.reads_v1 r
 ON r.batch_id=b.batch_id AND r.source_id=p.source_id;

CREATE VIEW jetnity_global_review_private.all_source_head_v2
 WITH (security_invoker=true) AS
SELECT dest,source_key,triage,'GLOBAL_SIX'::text AS registry
 FROM jetnity_global_review_private.source_head_v1
UNION ALL
SELECT dest,source_key,triage,'FOLLOWUP_FOUR'::text AS registry
 FROM jetnity_global_review_private.followup_source_head_v2
UNION ALL
SELECT dest,source_key,triage,'AT_OFFICIAL'::text AS registry
 FROM jetnity_global_review_private.austria_source_head_v2;

CREATE VIEW jetnity_global_review_private.destination_head_v2
 WITH (security_invoker=true) AS
SELECT dest,count(*)::integer sources,
count(*) FILTER(WHERE triage='BYTES_CHANGED_REQUIRES_LEGAL_REVIEW')::integer changed,
count(*) FILTER(WHERE triage IN('SOURCE_UNAVAILABLE_REQUIRES_RETRY',
 'BODY_REJECTED_REQUIRES_RETRY','SOURCE_COLLECTION_TIMEOUT'))::integer failed,
count(*) FILTER(WHERE triage='COLLECTION_PENDING')::integer pending
FROM jetnity_global_review_private.all_source_head_v2
GROUP BY dest;

CREATE VIEW jetnity_global_review_private.passport_triage_v2
 WITH (security_invoker=true) AS
SELECT c.destination_code,c.citizenship_code,c.priority_rank,
 c.customer_status,COALESCE(d.sources,0)::integer AS source_monitor_candidates,
 CASE
  WHEN d.dest IS NULL THEN 'NOT_YET_IN_SHARED_SOURCE_REGISTRY'
  WHEN d.changed>0 THEN 'BYTES_CHANGED_REQUIRES_LEGAL_REVIEW'
  WHEN d.failed>0 THEN 'SOURCE_UNAVAILABLE_REQUIRES_RETRY'
  WHEN d.pending>0 THEN 'COLLECTION_PENDING'
  ELSE 'RESEARCH_ONLY_NOT_LEGALLY_QUALIFIED' END AS source_triage,
 false::boolean AS customer_rule_approved,
 false::boolean AS publication_allowed
FROM jetnity_global_research_private.cases_v1 c
LEFT JOIN jetnity_global_review_private.destination_head_v2 d
 ON d.dest=c.destination_code;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_global_review_private
 FROM PUBLIC,anon,authenticated,service_role;

-- The original followup hourly slot can collide with its own 50-minute
-- dedupe. Five-minute CHECKS, not five-minute authority HTTP requests.
DO $schedule$
DECLARE review_jobid bigint; followup_jobid bigint;
BEGIN
 SELECT jobid INTO STRICT review_jobid FROM cron.job
  WHERE jobname='jetnity-global-source-review-queue-dev';
 SELECT jobid INTO STRICT followup_jobid FROM cron.job
  WHERE jobname='jetnity-followup-government-enqueue-v3-dev';
 PERFORM cron.alter_job(review_jobid,
  command=>'SELECT jetnity_global_review_private.capture_all_v2()');
 PERFORM cron.alter_job(followup_jobid,schedule=>'*/5 * * * *');
END $schedule$;

SELECT jetnity_global_review_private.capture_all_v2();

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_global_review_private.events_v1)
   IS DISTINCT FROM (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1)
 OR (SELECT count(*) FROM jetnity_global_review_private.followup_events_v2)
   IS DISTINCT FROM (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3)
 OR (SELECT count(*) FROM jetnity_global_review_private.all_source_head_v2)<>18
 OR (SELECT count(DISTINCT dest) FROM jetnity_global_review_private.all_source_head_v2)<>11
 OR (SELECT count(*) FROM jetnity_global_review_private.passport_triage_v2)<>10300
 OR (SELECT count(*) FROM jetnity_global_review_private.passport_triage_v2
   WHERE source_monitor_candidates>0)<>550
 OR EXISTS(SELECT 1 FROM jetnity_global_review_private.followup_events_v2
   WHERE source_qualified OR legal_fact_approved OR public_publish_allowed)
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
  AND jobname='jetnity-global-source-review-queue-dev'
  AND schedule='*/5 * * * *'
  AND command='SELECT jetnity_global_review_private.capture_all_v2()')<>1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
  AND jobname='jetnity-followup-government-enqueue-v3-dev'
  AND schedule='*/5 * * * *'
  AND command='SELECT jetnity_followup_source_monitor_private.enqueue_v3()')<>1
 OR has_schema_privilege('anon','jetnity_global_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_global_review_private.followup_events_v2','SELECT')
 OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
  WHERE oid='jetnity_global_review_private.followup_events_v2'::regclass)
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
  WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)<>0
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'GLOBAL_REVIEW_BRIDGE_V2_POSTCHECK_ROLLBACK' USING ERRCODE='P7987'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
