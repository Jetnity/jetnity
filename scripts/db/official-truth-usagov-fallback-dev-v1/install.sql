-- DEV ONLY. One official US-government alternative source as a private
-- RESEARCH_ONLY CANDIDATE after the original US VWP monitor returned HTTP 403.
-- A one-off pg_net 200 response is NOT source-identity attestation or legal
-- qualification. No background HTTP, model API, publication or passport rule.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='35s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='40s';
SET LOCAL jetnity.usagov_fallback_target='dev:yfvbxvijcorffwxbxahl:USAGOV-FALLBACK-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.usagov_fallback_target',true)
    IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:USAGOV-FALLBACK-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_usagov_fallback_private') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1 WHERE destination_code='US')<>50
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_source_body_private.changed_originals_v1)<1
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND database='postgres' AND jobname='jetnity-global-source-review-queue-dev'
     AND schedule='*/5 * * * *'
     AND command='SELECT jetnity_source_body_private.capture_all_v2()')<>1
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.observations_v1 o
     WHERE o.dest='US' AND o.source_key='us-vwp' AND o.result='unavailable')<1
 OR (SELECT count(*) FROM net._http_response WHERE id=558
     AND status_code=200 AND content_type~*'^text/html([; ]|$)'
     AND timed_out IS NOT TRUE AND error_msg IS NULL
     AND content IS NOT NULL AND octet_length(convert_to(content,'UTF8'))=42833
     AND encode(sha256(convert_to(content,'UTF8')),'hex')=
       '40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47')<>1
 OR NOT pg_try_advisory_xact_lock(771115,741)
 THEN RAISE EXCEPTION 'USAGOV_FALLBACK_EXACT_DEV_PREDECESSOR_REQUIRED'
 USING ERRCODE='P7989'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_usagov_fallback_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_usagov_fallback_private
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION jetnity_usagov_fallback_private.deny_changes_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN
 RAISE EXCEPTION 'USAGOV_FALLBACK_RESEARCH_IMMUTABLE' USING ERRCODE='P7989';
END $deny$;

CREATE TABLE jetnity_usagov_fallback_private.original_v1(
 singleton integer PRIMARY KEY CHECK(singleton=1),
 destination_code text NOT NULL DEFAULT 'US' CHECK(destination_code='US')
   REFERENCES jetnity_global_research_private.destinations_v1(destination_code),
 source_key text NOT NULL DEFAULT 'usagov-vwp-esta'
   CHECK(source_key='usagov-vwp-esta'),
 government_source_url text NOT NULL CHECK(government_source_url='https://www.usa.gov/visa-waiver-esta'),
 authority text NOT NULL CHECK(authority='USAGov - United States Government'),
 request_id bigint NOT NULL UNIQUE CHECK(request_id=558),
 http_status integer NOT NULL CHECK(http_status=200),
 content_type text NOT NULL CHECK(content_type~*'^text/html([; ]|$)'),
 request_result_observed_at timestamptz NOT NULL,
 archived_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source_bytes integer NOT NULL CHECK(source_bytes=42833),
 source_sha256 text NOT NULL CHECK(source_sha256='40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47'),
 original_html bytea NOT NULL,
 retrieval_class text NOT NULL DEFAULT 'OPERATOR_INITIATED_ONEOFF_PG_NET_RESEARCH'
   CHECK(retrieval_class='OPERATOR_INITIATED_ONEOFF_PG_NET_RESEARCH'),
 source_custody_verified boolean NOT NULL DEFAULT false CHECK(NOT source_custody_verified),
 legal_rule_qualified boolean NOT NULL DEFAULT false CHECK(NOT legal_rule_qualified),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK(accepted_fact_count=0),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(NOT publication_allowed),
 customer_answer text NOT NULL DEFAULT 'derzeit nicht verfügbar'
   CHECK(customer_answer='derzeit nicht verfügbar'),
 CHECK(source_bytes=octet_length(original_html)),
 CHECK(source_sha256=encode(sha256(original_html),'hex'))
);

ALTER TABLE jetnity_usagov_fallback_private.original_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_usagov_fallback_private.original_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_usagov_fallback_private.original_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_usagov_fallback_private.original_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_usagov_fallback_private.deny_changes_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_usagov_fallback_private.original_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_usagov_fallback_private.deny_changes_v1();

INSERT INTO jetnity_usagov_fallback_private.original_v1(
 singleton,destination_code,source_key,government_source_url,authority,request_id,
 http_status,content_type,request_result_observed_at,source_bytes,source_sha256,original_html
)
SELECT 1,'US','usagov-vwp-esta','https://www.usa.gov/visa-waiver-esta',
 'USAGov - United States Government',n.id,n.status_code,n.content_type,n.created,
 octet_length(convert_to(n.content,'UTF8')),
 encode(sha256(convert_to(n.content,'UTF8')),'hex'),
 convert_to(n.content,'UTF8')
FROM net._http_response n WHERE n.id=558 AND n.status_code=200
 AND n.content_type~*'^text/html([; ]|$)'
 AND n.timed_out IS NOT TRUE AND n.error_msg IS NULL
 AND n.content IS NOT NULL
 AND octet_length(convert_to(n.content,'UTF8'))=42833
 AND encode(sha256(convert_to(n.content,'UTF8')),'hex')=
  '40f0bd8cf60b63b169218f790bcbb1c92d377ba96a11fdff639dbee72cb4de47'
 AND position('Visa Waiver Program' IN n.content)>0
 AND position('ESTA' IN n.content)>0;

-- A government-source research candidate can apply to the research INDEX
-- for all 50 passports; this does not independently certify ANY passport.
CREATE VIEW jetnity_usagov_fallback_private.us_passport_review_v1
 WITH (security_invoker=true) AS
SELECT c.destination_code,c.citizenship_code,c.priority_rank,
  'UNQUALIFIED_SOURCE_CANDIDATE'::text AS research_status,
  false::boolean AS source_custody_verified,
  false::boolean AS legal_rule_qualified,
  false::boolean AS publication_allowed,
  0::integer AS accepted_fact_count,
  'derzeit nicht verfügbar'::text AS customer_answer,
  o.source_key,o.source_sha256
FROM jetnity_global_research_private.cases_v1 c
CROSS JOIN jetnity_usagov_fallback_private.original_v1 o
WHERE c.destination_code='US'
 AND NOT c.legal_rule_qualified
 AND NOT c.publication_allowed
 AND c.accepted_fact_count=0;

REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_usagov_fallback_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_usagov_fallback_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SCHEMA jetnity_usagov_fallback_private
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_usagov_fallback_private.original_v1)<>1
 OR (SELECT count(*) FROM jetnity_usagov_fallback_private.us_passport_review_v1)<>50
 OR EXISTS(SELECT 1 FROM jetnity_usagov_fallback_private.us_passport_review_v1
    WHERE source_custody_verified OR legal_rule_qualified OR publication_allowed
    OR accepted_fact_count<>0 OR customer_answer<>'derzeit nicht verfügbar')
 OR (SELECT count(*) FROM jetnity_global_source_monitor_private.sources_v1)<>11
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 OR (SELECT count(*) FROM cron.job WHERE active AND username='postgres'
     AND database='postgres' AND jobname='jetnity-global-source-review-queue-dev'
     AND schedule='*/5 * * * *'
     AND command='SELECT jetnity_source_body_private.capture_all_v2()')<>1
 OR has_schema_privilege('anon','jetnity_usagov_fallback_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_usagov_fallback_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_usagov_fallback_private','USAGE')
 OR has_table_privilege('anon','jetnity_usagov_fallback_private.original_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_usagov_fallback_private.original_v1','SELECT')
 OR has_table_privilege('service_role','jetnity_usagov_fallback_private.original_v1','SELECT')
 OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
    WHERE oid='jetnity_usagov_fallback_private.original_v1'::regclass)
 OR (SELECT count(*) FROM pg_trigger
    WHERE tgrelid='jetnity_usagov_fallback_private.original_v1'::regclass
    AND NOT tgisinternal)<>2
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'USAGOV_FALLBACK_RESEARCH_POSTCHECK_ROLLBACK'
  USING ERRCODE='P7989'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
