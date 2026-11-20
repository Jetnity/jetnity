-- DEV ONLY. Fix universal register to display actual GENERIC HTTP observations.
-- Monitoring is NOT an admission of passport-, nationality- or topic-specific law.
-- Preserve legacy SIX, FOUR, USAGov and protected AT monitors exactly.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='40s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.registry_read_target='dev:yfvbxvijcorffwxbxahl:REGISTRY-READ-V2';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.registry_read_target',true)
     IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:REGISTRY-READ-V2'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>36
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
     WHERE monitor_family='GENERIC')<>17
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>17
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.observations_v1)<1
 OR (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1
     WHERE monitor_family='GENERIC' AND last_observed_at IS NOT NULL)<>0
 OR position('REGISTERED_AWAITING_AUTHORITY_CHECK' IN
     pg_get_viewdef('jetnity_source_registry_private.latest_research_status_v1'::regclass))=0
 OR (SELECT count(*) FROM cron.job WHERE active
     AND jobname='jetnity-global-source-review-queue-dev'
     AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,781)
 THEN RAISE EXCEPTION 'REGISTRY_READ_V2_PREDECESSOR_REQUIRED' USING ERRCODE='P7990'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE OR REPLACE VIEW jetnity_source_registry_private.latest_research_status_v1
 WITH (security_invoker=true) AS
WITH observed AS (
 SELECT 'SIX'::text family,o.dest destination_code,o.source_key,
        o.observed_at,o.result raw_state,o.raw_sha
 FROM jetnity_global_source_monitor_private.observations_v1 o
 UNION ALL
 SELECT 'FOUR',o.destination_code,'primary',o.observed_at,o.status,o.source_sha256
 FROM jetnity_followup_source_monitor_private.observations_v3 o
 -- AT HRS/BG1-protected monitoring intentionally stays inside its own
 -- existing adapter. A persistent SQL VIEW dependency on its guarded tables
 -- would change the protected catalog fingerprint; never add that edge.
 UNION ALL
 SELECT 'USAGOV','US','usagov-vwp-esta',o.observed_at,o.result,o.raw_sha
 FROM jetnity_usagov_watch_private.observations_v1 o
 UNION ALL
 SELECT 'GENERIC',s.destination_code,s.source_key,o.observed_at,o.result,o.raw_sha
 FROM jetnity_source_dispatch_private.observations_v1 o
 JOIN jetnity_source_dispatch_private.requests_v1 q USING(request_id)
 JOIN jetnity_source_registry_private.sources_v1 s ON s.source_id=q.source_id
 WHERE s.monitor_family='GENERIC'
)
SELECT r.source_id,r.destination_code,r.source_key,r.monitor_family,
 r.review_interval_minutes,r.launch_priority,r.migration_state,
 o.observed_at AS last_observed_at,o.raw_state AS source_observation,
 o.raw_sha AS last_observed_sha,
 CASE WHEN r.monitor_family='AT' THEN 'LEGACY_AT_PROTECTED_MONITOR_UNTOUCHED'
      WHEN r.monitor_family='GENERIC' AND o.observed_at IS NULL
        THEN 'GENERIC_NOT_YET_OBSERVED'
      WHEN r.monitor_family='GENERIC' AND o.raw_state IN
           ('REJECTED_HTML','SOURCE_UNAVAILABLE','COLLECTION_TIMEOUT')
        THEN 'GENERIC_SOURCE_UNAVAILABLE'
      WHEN r.monitor_family='GENERIC' AND o.raw_state='CHANGED_REQUIRES_REVIEW'
        THEN 'GENERIC_CHANGED_PENDING_LEGAL_REVIEW'
      WHEN r.monitor_family='GENERIC' AND o.observed_at <
        clock_timestamp()-make_interval(mins=>greatest(65,r.review_interval_minutes)*3)
        THEN 'GENERIC_STALE_RESEARCH_ONLY'
      WHEN r.monitor_family='GENERIC' THEN 'GENERIC_OBSERVED_UNQUALIFIED'
      WHEN o.observed_at IS NULL THEN 'UNOBSERVED_RESEARCH_ONLY'
      WHEN o.observed_at < clock_timestamp()-make_interval(mins=>r.review_interval_minutes*3)
        THEN 'STALE_RESEARCH_ONLY'
      ELSE 'OBSERVED_RESEARCH_ONLY' END AS research_status,
 false::boolean AS legal_rule_qualified,false::boolean AS publication_allowed,
 0::integer AS accepted_facts
FROM jetnity_source_registry_private.sources_v1 r
LEFT JOIN LATERAL (
 SELECT observed_at,raw_state,raw_sha
 FROM observed
 WHERE observed.family=r.monitor_family
 AND observed.destination_code=r.destination_code
 AND observed.source_key=r.source_key
 ORDER BY observed_at DESC LIMIT 1
) o ON true;

REVOKE ALL ON jetnity_source_registry_private.latest_research_status_v1
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1)<>36
 OR (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1
     WHERE monitor_family='GENERIC' AND last_observed_at IS NOT NULL)<1
 OR (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1
     WHERE monitor_family='AT'
       AND research_status='LEGACY_AT_PROTECTED_MONITOR_UNTOUCHED')<>3
 OR EXISTS(SELECT 1 FROM jetnity_source_registry_private.latest_research_status_v1
     WHERE legal_rule_qualified OR publication_allowed OR accepted_facts<>0)
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
     WHERE rule_verified OR rule_publishable OR accepted_facts<>0
       OR customer_answer<>'derzeit nicht verfügbar')
 OR has_schema_privilege('anon','jetnity_source_registry_private','USAGE')
 OR has_table_privilege('anon','jetnity_source_registry_private.latest_research_status_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_source_registry_private.latest_research_status_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'REGISTRY_READ_V2_POSTCHECK_ROLLBACK' USING ERRCODE='P7990'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
