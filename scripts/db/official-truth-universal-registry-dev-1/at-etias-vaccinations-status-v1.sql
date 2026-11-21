-- DEV ONLY: 50 AT ETIAS public-status candidates, 100 vaccination topics.
-- The current EU ETIAS portal is an official operating-status source.
-- AA independent official report: no vaccination required on entry to Austria;
-- Austrian health portal only says no domestic vaccination duty, NOT an
-- explicit passport/entry primary for all possible border health measures.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';
SET LOCAL jetnity.health_target='dev:yfvbxvijcorffwxbxahl:AT-ETIAS-HEALTH-REVIEW-V1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.health_target',true)
  IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-ETIAS-HEALTH-REVIEW-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_etias_health_status_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_authority_consistency_v1
    WHERE review_verdict='NO_QUALIFIED_AUSTRIAN_ENTRY_PRIMARY_SOURCE')<>100
 THEN RAISE EXCEPTION 'AT_ETIAS_HEALTH_PREDECESSOR_REFUSED' USING ERRCODE='P7982'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE VIEW jetnity_legal_review_private.at_etias_health_status_v1
 WITH (security_invoker=true) AS
SELECT p.citizenship_code,p.topic,p.priority_rank,
 '2026-11-19'::date AS checked_on,
 CASE WHEN p.topic='electronic_travel_authorization'
  THEN 'EU_ETIAS_NOT_IN_OPERATION_NO_APPLICATION_NO_PRICE'
  WHEN p.topic='required_vaccinations'
  THEN 'GERMAN_AA_SAYS_NONE_FOR_ENTRY_AUSTRIAN_ENTRY_PRIMARY_STILL_REQUIRED'
  ELSE 'HEALTH_GUIDANCE_NOT_PERSON_SPECIFIC_RECOMMENDATION' END AS review_status,
 CASE WHEN p.topic='electronic_travel_authorization'
  THEN 'https://travel-europe.europa.eu/de/etias'
  WHEN p.topic='required_vaccinations'
  THEN 'https://www.auswaertiges-amt.de/de/reiseundsicherheit/oesterreichsicherheit-210962'
  ELSE 'https://www.gesundheit.gv.at/leben/gesundheitsvorsorge/impfungen/impfungen-erwachsene.html'
 END AS independent_official_url,
 CASE WHEN p.topic IN ('required_vaccinations','recommended_vaccinations')
  THEN 'https://www.gesundheit.gv.at/leben/gesundheitsvorsorge/impfungen/impfungen-erwachsene.html'
  ELSE 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/information_zu_etias/start.html'
 END AS destination_general_information_url,
 (p.topic='electronic_travel_authorization') AS current_system_operating_status_verified,
 (p.topic='required_vaccinations') AS independent_aa_no_required_vaccines_statement,
 (p.topic IN ('required_vaccinations','recommended_vaccinations')) AS destination_specific_vaccination_primary_missing,
 NULL::numeric AS price,
 NULL::date AS entry_rule_valid_from,NULL::date AS entry_rule_valid_until,
 false::boolean AS passport_specific_legal_rule_verified,
 false::boolean AS publication_allowed,
 'derzeit nicht verfügbar'::text AS individual_entry_rule
FROM jetnity_legal_review_private.at_rule_readiness_v1 p
WHERE p.destination_code='AT' AND p.topic IN
 ('electronic_travel_authorization','required_vaccinations','recommended_vaccinations');

REVOKE ALL ON jetnity_legal_review_private.at_etias_health_status_v1
 FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_legal_review_private.at_etias_health_status_v1)<>150
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_etias_health_status_v1
  WHERE current_system_operating_status_verified)<>50
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_etias_health_status_v1
  WHERE destination_specific_vaccination_primary_missing)<>100
 OR EXISTS(SELECT 1 FROM jetnity_legal_review_private.at_etias_health_status_v1
  WHERE passport_specific_legal_rule_verified OR publication_allowed
   OR price IS NOT NULL OR individual_entry_rule<>'derzeit nicht verfügbar')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_ETIAS_HEALTH_POSTCHECK_ROLLBACK' USING ERRCODE='P7982'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
