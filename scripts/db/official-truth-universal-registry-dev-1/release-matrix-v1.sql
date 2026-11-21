-- DEV ONLY, read-only release-readiness projection: AT first, then IT/FR/ES/PT.
-- No published or accepted rules. Public text stays "derzeit nicht verfügbar"
-- until separate per-passport/per-topic authority, method, BG1 and Owner gates.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.release_readiness_target='dev:yfvbxvijcorffwxbxahl:RELEASE-MATRIX-V1';

DO $guard$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.release_readiness_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:RELEASE-MATRIX-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_release_review_private') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.topics_v1)<>26
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1 WHERE destination_code IN ('AT','IT','FR','ES','PT'))<>250
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev' AND active
      AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1 WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,771)
 THEN RAISE EXCEPTION 'RELEASE_MATRIX_DEV_PREDECESSOR_REQUIRED' USING ERRCODE='P7993'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $guard$;

CREATE SCHEMA jetnity_release_review_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_release_review_private FROM PUBLIC,anon,authenticated,service_role;

CREATE VIEW jetnity_release_review_private.passport_topic_status_v1
 WITH (security_invoker=true) AS
SELECT c.destination_code,c.citizenship_code,c.priority_rank,
 CASE c.destination_code WHEN 'AT' THEN 1 WHEN 'IT' THEN 2
   WHEN 'FR' THEN 3 WHEN 'ES' THEN 4 WHEN 'PT' THEN 5 END AS rollout_priority,
 'ordinary_passport_research'::text AS travel_document_scope,
 t.topic,
 x.candidate_sources,
 x.registered_official_urls,
 x.latest_observed_at AS source_last_seen_at,
 CASE WHEN x.candidate_sources=0 THEN 'NO_REGISTERED_TOPIC_SOURCE'
  WHEN x.last_research_source_count=0 THEN 'NOT_YET_OBSERVED'
  ELSE 'UNQUALIFIED_SOURCE_OBSERVATION' END AS research_status,
 false::boolean AS rule_verified,
 false::boolean AS rule_publishable,
 0::integer AS accepted_facts,
 'derzeit nicht verfügbar'::text AS customer_answer,
 CASE WHEN t.topic='entry_forms' THEN x.first_official_url ELSE NULL::text END AS candidate_official_form_url,
 NULL::numeric AS verified_form_price,
 NULL::numeric AS verified_entry_fee,
 NULL::numeric AS verified_financial_requirement,
 CASE WHEN t.topic IN ('entry_forms','form_costs','fraud_warnings')
   THEN 'Warnung vor kostenpflichtigen Vermittler- und Fake-Seiten; nur nach Quellenprüfung offizielle Formulare nutzen'
   ELSE NULL::text END AS research_fraud_warning,
 NULL::date AS legally_valid_from,
 NULL::date AS legally_valid_until
FROM jetnity_global_research_private.cases_v1 c
CROSS JOIN jetnity_global_research_private.topics_v1 t
LEFT JOIN LATERAL (
 SELECT count(s.source_id)::integer AS candidate_sources,
 count(o.last_observed_at)::integer AS last_research_source_count,
 max(o.last_observed_at) AS latest_observed_at,
 min(s.official_url) AS first_official_url,
 array_agg(s.official_url ORDER BY s.official_url) FILTER (WHERE s.source_id IS NOT NULL)
  AS registered_official_urls
 FROM jetnity_source_registry_private.topic_scope_v1 ts
 JOIN jetnity_source_registry_private.sources_v1 s ON s.source_id=ts.source_id
 LEFT JOIN jetnity_source_registry_private.latest_research_status_v1 o ON o.source_id=s.source_id
 WHERE s.destination_code=c.destination_code AND ts.topic=t.topic
   AND ts.scope_kind='REVIEW_TOPIC_CANDIDATE'
   AND s.research_only AND NOT s.publication_allowed AND NOT s.legal_rule_qualified
) x ON true
WHERE c.destination_code IN ('AT','IT','FR','ES','PT')
 AND NOT c.publication_allowed AND NOT c.legal_rule_qualified
 AND c.accepted_fact_count=0 AND c.customer_status='derzeit nicht verfügbar'
 AND t.research_only AND NOT t.positive_rule_allowed;

CREATE VIEW jetnity_release_review_private.rollout_counts_v1
 WITH (security_invoker=true) AS
SELECT destination_code,rollout_priority,count(*) AS topic_passport_slots,
count(DISTINCT citizenship_code) passports,
count(DISTINCT topic) topics,
count(*) FILTER(WHERE candidate_sources>0) research_sourced_slots,
count(*) FILTER(WHERE candidate_sources=0) unsupported_slots,
count(*) FILTER(WHERE rule_publishable) publishable,
count(*) FILTER(WHERE customer_answer<>'derzeit nicht verfügbar') customer_positive
FROM jetnity_release_review_private.passport_topic_status_v1
GROUP BY destination_code,rollout_priority;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_release_review_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_release_review_private FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR (SELECT count(*) FROM jetnity_release_review_private.rollout_counts_v1)<>5
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.rollout_counts_v1
   WHERE topic_passport_slots<>1300 OR passports<>50 OR topics<>26
     OR customer_positive<>0 OR publishable<>0)
 OR (SELECT rollout_priority FROM jetnity_release_review_private.rollout_counts_v1 WHERE destination_code='AT')<>1
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1 WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR has_schema_privilege('anon','jetnity_release_review_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_release_review_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_release_review_private','USAGE')
 OR has_table_privilege('anon','jetnity_release_review_private.passport_topic_status_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_release_review_private.passport_topic_status_v1','SELECT')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'RELEASE_MATRIX_POSTCHECK_ROLLBACK' USING ERRCODE='P7993'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;