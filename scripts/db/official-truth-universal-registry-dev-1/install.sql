-- DEV ONLY. Single private registry for source/country/passport/topic/interval.
-- Keep all existing AT, SIX, FOUR and USAGov monitors running as before.
-- No HTTP, no scheduler/cron changes, no method or fact publishing.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='50s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='55s';
SET LOCAL jetnity.registry_target='dev:yfvbxvijcorffwxbxahl:UNIVERSAL-REGISTRY-V1';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.registry_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:UNIVERSAL-REGISTRY-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_source_registry_private') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1)<>206
 OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.topics_v1)<>26
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.pins_v1)<>3
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1)<>1
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-at-source-collect-dev-v1' AND active)<>1
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
    AND active AND command='SELECT jetnity_usagov_watch_private.tick_v1()')<>1
 OR NOT pg_try_advisory_xact_lock(771115,760)
 THEN RAISE EXCEPTION 'UNIVERSAL_REGISTRY_DEV_EXACT_PREDECESSOR_REQUIRED'
 USING ERRCODE='P7991'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_source_registry_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_source_registry_private FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_source_registry_private.reject_mutation_v1()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN
 RAISE EXCEPTION 'SOURCE_REGISTRY_APPEND_ONLY' USING ERRCODE='P7991';
END $deny$;

CREATE TABLE jetnity_source_registry_private.sources_v1(
 source_id text PRIMARY KEY,
 destination_code text NOT NULL REFERENCES
   jetnity_global_research_private.destinations_v1(destination_code),
 source_key text NOT NULL CHECK(source_key~'^[a-z][a-z0-9-]{1,63}$'),
 official_url text NOT NULL,
 monitor_family text NOT NULL CHECK(monitor_family IN('AT','SIX','FOUR','USAGOV','GENERIC')),
 migration_state text NOT NULL CHECK(migration_state IN('LEGACY_SHADOW','REGISTERED_RESEARCH_ONLY')),
 review_interval_minutes integer NOT NULL CHECK(review_interval_minutes BETWEEN 30 AND 43200),
 launch_priority integer NOT NULL CHECK(launch_priority BETWEEN 1 AND 99),
 registered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_custody_verified boolean NOT NULL DEFAULT false CHECK(NOT source_custody_verified),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 accepted_facts integer NOT NULL DEFAULT 0 CHECK(accepted_facts=0),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only),
 UNIQUE(destination_code,source_key),
 CHECK(source_id=destination_code||':'||source_key),
 CHECK(
  official_url~'^https://[a-z0-9-]+(\.[a-z0-9-]+)+(/[^[:space:]#@]*)?$'
  AND official_url NOT LIKE '%@%'
  AND split_part(official_url,'/',3) !~ '^[0-9.]+$'
  AND split_part(official_url,'/',3) NOT LIKE '%..%'
  AND length(official_url) BETWEEN 15 AND 1024
 ),
 CHECK(
   (monitor_family='GENERIC' AND migration_state='REGISTERED_RESEARCH_ONLY')
   OR
   (monitor_family<>'GENERIC' AND migration_state='LEGACY_SHADOW')
 )
);
CREATE TABLE jetnity_source_registry_private.passport_scope_v1(
 source_id text NOT NULL REFERENCES jetnity_source_registry_private.sources_v1(source_id),
 citizenship_code text NOT NULL REFERENCES
   jetnity_global_research_private.passport_priority_v1(citizenship_code),
 scope_kind text NOT NULL DEFAULT 'POTENTIAL_RESEARCH_IMPACT'
  CHECK(scope_kind='POTENTIAL_RESEARCH_IMPACT'),
 passport_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT passport_rule_qualified),
 PRIMARY KEY(source_id,citizenship_code)
);
CREATE TABLE jetnity_source_registry_private.topic_scope_v1(
 source_id text NOT NULL REFERENCES jetnity_source_registry_private.sources_v1(source_id),
 topic text NOT NULL REFERENCES jetnity_global_research_private.topics_v1(topic),
 scope_kind text NOT NULL DEFAULT 'REVIEW_TOPIC_CANDIDATE'
   CHECK(scope_kind='REVIEW_TOPIC_CANDIDATE'),
 topic_fact_approved boolean NOT NULL DEFAULT false CHECK(NOT topic_fact_approved),
 PRIMARY KEY(source_id,topic)
);

DO $seed$
DECLARE missing integer;
BEGIN
 INSERT INTO jetnity_source_registry_private.sources_v1(
  source_id,destination_code,source_key,official_url,monitor_family,migration_state,
  review_interval_minutes,launch_priority)
 SELECT dest||':'||source_key,dest,source_key,official_url,'SIX','LEGACY_SHADOW',60,
  CASE dest WHEN 'AT' THEN 1 WHEN 'IT' THEN 2 WHEN 'FR' THEN 3
   WHEN 'ES' THEN 4 WHEN 'PT' THEN 5 ELSE 99 END
 FROM jetnity_global_source_monitor_private.sources_v1
 UNION ALL
 SELECT destination_code||':primary',destination_code,'primary',official_url,
  'FOUR','LEGACY_SHADOW',60,
  CASE destination_code WHEN 'IT' THEN 2 WHEN 'FR' THEN 3
   WHEN 'ES' THEN 4 WHEN 'PT' THEN 5 ELSE 99 END
 FROM jetnity_followup_source_monitor_private.sources_v3
 UNION ALL
 SELECT 'AT:'||source_id,'AT',source_id,url,'AT','LEGACY_SHADOW',50,1
 FROM official_v3_at_source_watch_private.pins_v1
 UNION ALL
 SELECT 'US:'||source_key,'US',source_key,government_source_url,
  'USAGOV','LEGACY_SHADOW',65,99
 FROM jetnity_usagov_fallback_private.original_v1;

 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 THEN RAISE EXCEPTION 'REGISTERED_SOURCE_SEED_MISMATCH' USING ERRCODE='P7991'; END IF;

 -- All 50 passports are possible RESEARCH IMPACT subjects, not 950 confirmed
 -- country/passport entry facts. This scope is not legal applicability.
 INSERT INTO jetnity_source_registry_private.passport_scope_v1(source_id,citizenship_code)
 SELECT s.source_id,p.citizenship_code
 FROM jetnity_source_registry_private.sources_v1 s
 CROSS JOIN jetnity_global_research_private.passport_priority_v1 p;

 INSERT INTO jetnity_source_registry_private.topic_scope_v1(source_id,topic)
 SELECT s.dest||':'||s.source_key,
  CASE s.topic
   WHEN 'visa' THEN 'visa'
   WHEN 'eta' THEN 'electronic_travel_authorization'
   WHEN 'forms' THEN 'entry_forms'
   WHEN 'transit' THEN 'transit'
   ELSE 'official_actions' END
 FROM jetnity_global_source_monitor_private.sources_v1 s
 UNION ALL SELECT destination_code||':primary','visa'
 FROM jetnity_followup_source_monitor_private.sources_v3
 UNION ALL SELECT 'AT:bmi-visa-nationality-matrix','visa'
 UNION ALL SELECT 'AT:bmi-general-entry','passport'
 UNION ALL SELECT 'AT:bmi-general-entry','passport_validity'
 UNION ALL SELECT 'AT:bmeia-bern-how-to-apply','entry_forms'
 UNION ALL SELECT 'US:usagov-vwp-esta','visa'
 UNION ALL SELECT 'US:usagov-vwp-esta','electronic_travel_authorization';

 IF (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>950
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1)<>21
 OR (SELECT count(DISTINCT destination_code) FROM jetnity_source_registry_private.sources_v1)<>11
 THEN RAISE EXCEPTION 'REGISTERED_SCOPE_SEED_MISMATCH' USING ERRCODE='P7991'; END IF;
END $seed$;

-- No per-country implementation is needed for future country/source intake:
-- this one generic postgres-only API adds a NEW research-only entry, 50
-- possible-impact passport links and the explicitly named review topics.
-- Authority proof and actual source polling require a separate later gate.
CREATE FUNCTION jetnity_source_registry_private.register_research_source_v1(
 p_destination_code text,p_source_key text,p_official_url text,
 p_topics text[],p_interval_minutes integer)
 RETURNS text LANGUAGE plpgsql VOLATILE SECURITY INVOKER
 SET search_path=pg_catalog AS $register$
DECLARE sid text; items integer;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR p_destination_code IS NULL OR p_destination_code!~'^[A-Z]{2}$'
 OR p_source_key IS NULL OR p_source_key!~'^[a-z][a-z0-9-]{1,63}$'
 OR p_official_url IS NULL
 OR p_official_url!~'^https://[a-z0-9-]+(\.[a-z0-9-]+)+(/[^[:space:]#@]*)?$'
 OR p_official_url LIKE '%@%'
 OR split_part(p_official_url,'/',3)~'^[0-9.]+$'
 OR split_part(p_official_url,'/',3) LIKE '%..%'
 OR length(p_official_url) NOT BETWEEN 15 AND 1024
 OR p_interval_minutes NOT BETWEEN 30 AND 43200
 OR p_topics IS NULL OR cardinality(p_topics) NOT BETWEEN 1 AND 12
 OR (SELECT count(*) FROM jetnity_global_research_private.passport_priority_v1)<>50
 OR (SELECT count(*) FROM jetnity_global_research_private.destinations_v1
    WHERE destination_code=p_destination_code)<>1
 OR (SELECT count(*) FROM unnest(p_topics) AS t(topic))<>(
    SELECT count(DISTINCT t.topic) FROM unnest(p_topics) AS t(topic)
    JOIN jetnity_global_research_private.topics_v1 known USING(topic))
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)
 OR NOT pg_try_advisory_xact_lock(771115,761)
 THEN RAISE EXCEPTION 'SOURCE_REGISTRY_UNQUALIFIED_INTAKE_REJECTED' USING ERRCODE='P7991'; END IF;
 sid:=p_destination_code||':'||p_source_key;
 INSERT INTO jetnity_source_registry_private.sources_v1(
   source_id,destination_code,source_key,official_url,monitor_family,migration_state,
   review_interval_minutes,launch_priority)
 VALUES(sid,p_destination_code,p_source_key,p_official_url,'GENERIC','REGISTERED_RESEARCH_ONLY',
   p_interval_minutes,CASE p_destination_code WHEN 'AT' THEN 1 WHEN 'IT' THEN 2
    WHEN 'FR' THEN 3 WHEN 'ES' THEN 4 WHEN 'PT' THEN 5 ELSE 99 END);
 INSERT INTO jetnity_source_registry_private.passport_scope_v1(source_id,citizenship_code)
 SELECT sid,citizenship_code FROM jetnity_global_research_private.passport_priority_v1;
 INSERT INTO jetnity_source_registry_private.topic_scope_v1(source_id,topic)
 SELECT sid,topic FROM unnest(p_topics) AS x(topic);
 RETURN sid;
END $register$;

ALTER TABLE jetnity_source_registry_private.sources_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_registry_private.sources_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_registry_private.passport_scope_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_registry_private.passport_scope_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_registry_private.topic_scope_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_source_registry_private.topic_scope_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_source_registry_private.sources_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY postgres_only ON jetnity_source_registry_private.passport_scope_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY postgres_only ON jetnity_source_registry_private.topic_scope_v1
 TO postgres USING(true) WITH CHECK(true);

CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_source_registry_private.sources_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_source_registry_private.sources_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_source_registry_private.passport_scope_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_source_registry_private.passport_scope_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_source_registry_private.topic_scope_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_source_registry_private.topic_scope_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_source_registry_private.reject_mutation_v1();

-- Common source observation view over the already-running legacy monitors.
-- No new web call, no claim that equality of raw HTML makes legal facts true.
CREATE VIEW jetnity_source_registry_private.latest_research_status_v1
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
)
SELECT r.source_id,r.destination_code,r.source_key,r.monitor_family,
 r.review_interval_minutes,r.launch_priority,r.migration_state,
 o.observed_at AS last_observed_at,o.raw_state AS source_observation,
 o.raw_sha AS last_observed_sha,
 CASE WHEN r.monitor_family='AT' THEN 'LEGACY_AT_PROTECTED_MONITOR_UNTOUCHED'
      WHEN r.monitor_family='GENERIC' THEN 'REGISTERED_AWAITING_AUTHORITY_CHECK'
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

CREATE VIEW jetnity_source_registry_private.release_priority_v1
 WITH (security_invoker=true) AS
SELECT destination_code,launch_priority,count(*) AS registered_sources,
 count(*) FILTER(WHERE migration_state='LEGACY_SHADOW') AS legacy_running,
 count(*) FILTER(WHERE migration_state='REGISTERED_RESEARCH_ONLY') AS new_pending,
 false::boolean AS country_approved,
 0::integer AS accepted_new_rules
FROM jetnity_source_registry_private.sources_v1
GROUP BY destination_code,launch_priority;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_source_registry_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_source_registry_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_source_registry_private
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>19
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>950
 OR (SELECT count(*) FROM jetnity_source_registry_private.topic_scope_v1)<>21
 OR (SELECT count(*) FROM jetnity_source_registry_private.latest_research_status_v1)<>19
 OR (SELECT count(*) FROM jetnity_source_registry_private.release_priority_v1)<>11
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
       WHERE destination_code='AT')<>3
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1
       WHERE destination_code IN('IT','FR','ES','PT'))<>4
 OR EXISTS(SELECT 1 FROM jetnity_source_registry_private.sources_v1
       WHERE legal_rule_qualified OR publication_allowed OR accepted_facts<>0
          OR source_custody_verified OR NOT research_only)
 OR EXISTS(SELECT 1 FROM jetnity_source_registry_private.passport_scope_v1
       WHERE passport_rule_qualified)
 OR EXISTS(SELECT 1 FROM jetnity_source_registry_private.topic_scope_v1
       WHERE topic_fact_approved)
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
       WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job WHERE jobname='jetnity-global-source-review-queue-dev'
     AND active AND command='SELECT jetnity_usagov_watch_private.tick_v1()')<>1
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='jetnity_source_registry_private' AND c.relkind='r'
       AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
          OR has_table_privilege('anon',c.oid,'SELECT')
          OR has_table_privilege('authenticated',c.oid,'SELECT')
          OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_source_registry_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_registry_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_registry_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'UNIVERSAL_REGISTRY_DEV_POSTCHECK_ROLLBACK' USING ERRCODE='P7991'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
