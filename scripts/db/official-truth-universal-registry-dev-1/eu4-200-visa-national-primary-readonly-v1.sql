-- Development only; 20.11.2026, PR #1254. Four national primary portals
-- + EU Regulation 2018/1806 (consolidated 2025-12-30) -> 4x50 visa source review from EXISTING private
-- research. This is a SELECT-only evidence CROSSCHECK, not a 200-fact issuer.
-- Austria's bilateral visa waivers are NEVER portable to Italy/France/Spain/
-- Portugal. In France the territory (mainland vs overseas) MUST be known.
-- In Spain 30 ONLY financial_means conflicts stay individually quarantined.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='28s';
SET LOCAL lock_timeout='4s';

WITH source_index(destination,required_official_primary) AS (VALUES
 ('IT'::text,'https://vistoperitalia.esteri.it/'::text),
 ('FR','https://france-visas.gouv.fr/fr/faq'),
 ('ES','https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/'),
 ('PT','https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao')
), scoped AS (
 SELECT e.destination_code,e.citizenship_code,e.priority_rank,
 e.registered_official_urls,e.source_last_seen_at,e.source_snapshot_class,
 e.legal_review_disposition,e.legal_rule_qualified,e.owner_aal2_approved,
 e.publication_allowed,e.accepted_fact_count,e.visitor_text,
 e.unresolved_original_conflict,
 p.required_official_primary,b.bmi_group AS at_comparison_only,
 CASE WHEN e.citizenship_code=e.destination_code THEN 'H'
      WHEN b.bmi_group='H' THEN 'F' -- Austrian passport has EU free movement in EU4!
      ELSE b.bmi_group END AS destination_candidate_group,
 EXISTS(SELECT 1 FROM jetnity_legal_review_private.eu_four_case_audit_v1 f
   WHERE f.destination_code=e.destination_code AND f.citizenship_code=e.citizenship_code
     AND f.topic='financial_means' AND f.unresolved_original_conflict) AS financial_conflict_only,
 (e.registered_official_urls @> ARRAY[p.required_official_primary]::text[]) AS official_portal_link_registered
 FROM jetnity_legal_review_private.eu_four_case_audit_v1 e
 JOIN jetnity_legal_review_private.at_50_group_source_review_v2 b
  ON b.passport_code=e.citizenship_code AND b.priority_rank=e.priority_rank
 JOIN source_index p ON p.destination=e.destination_code
 WHERE e.topic='visa'
), evidence AS (
 SELECT count(*) total,
 count(DISTINCT destination_code) destinations,
 count(*) FILTER (WHERE destination_candidate_group='V') visa_baselines,
 count(*) FILTER (WHERE destination_candidate_group='F') eu_eea_ch,
 count(*) FILTER (WHERE destination_candidate_group='E') short_stay_exempt,
 count(*) FILTER (WHERE destination_candidate_group='H') home_cases,
 count(*) FILTER (WHERE NOT official_portal_link_registered) missing_official_portal_links,
 count(*) FILTER (WHERE source_snapshot_class<>'RESEARCH_ONLY_UNVERIFIED_CONTENT'
  OR legal_rule_qualified OR owner_aal2_approved OR publication_allowed
  OR accepted_fact_count<>0 OR visitor_text<>'derzeit nicht verfügbar') invalid_release_states,
 count(*) FILTER (WHERE financial_conflict_only) es_financial_conflict_cases,
 count(*) FILTER (WHERE destination_code<>'ES' AND financial_conflict_only) other_financial_conflicts
 FROM scoped
), topics AS (
 SELECT count(*) total,count(*) FILTER (WHERE legal_rule_qualified
  OR owner_aal2_approved OR publication_allowed OR accepted_fact_count<>0
  OR verified_fee_amount IS NOT NULL OR visitor_text<>'derzeit nicht verfügbar') unauthorized
 FROM jetnity_legal_review_private.eu_four_case_audit_v1
 WHERE destination_code IN ('IT','FR','ES','PT')
), guard AS (
 SELECT public.official_v3_guard_alarm_status_v1()->>'status' bg1,
 official_v3_guard_private.assert_catalog_v1() AS protected_source_catalog
)
SELECT c.destination_code,c.citizenship_code,c.priority_rank,
 c.destination_candidate_group,
 c.at_comparison_only AS austrian_bmi_comparison_not_destination_legal_issuer,
 c.official_portal_link_registered,c.required_official_primary,
 'https://home-affairs.ec.europa.eu/policies/schengen/schengen-visas/eu-visa-policy_en'::text
   AS eu_visa_annex_i_ii_official_crosscheck,
 'https://eur-lex.europa.eu/eli/reg/2018/1806/2025-12-30/eng'::text AS eu_regulation_2018_1806_source,
 c.source_last_seen_at AS registered_research_link_seen_at_not_an_original_receipt,
 c.source_snapshot_class,
 c.destination_code='FR' AS distinguish_france_overseas_territory_before_rule,
 c.destination_code='ES' AS check_specific_es_financial_means_before_rule,
 c.financial_conflict_only AS original_financial_means_conflict_quarantined,
 c.citizenship_code='AT' AND c.destination_code<>'AT' AS austrian_national_is_eu_visitor_not_at_home,
 c.citizenship_code IN ('UA','XK','RS') AS biometric_passport_caveat,
 c.citizenship_code IN ('BR','KR','JP','CA','IL','TR','IN','PK','TH','EG','PH','MA')
   AS do_not_port_austrian_national_passport_exceptions,
 c.citizenship_code IN ('CN','RU') AS separate_eu_diplomatic_exception_or_suspension_check,
 CASE WHEN guard.bg1='current'
    AND current_database()='postgres' AND current_setting('server_version_num')::int/10000=17
    AND (evidence.total,evidence.destinations,evidence.visa_baselines,
       evidence.eu_eea_ch,evidence.short_stay_exempt,evidence.home_cases)=(200,4,80,76,40,4)
    AND evidence.missing_official_portal_links=0 AND evidence.invalid_release_states=0
    AND evidence.es_financial_conflict_cases=30 AND evidence.other_financial_conflicts=0
    AND (topics.total,topics.unauthorized)=(5200,0)
    AND c.official_portal_link_registered
    AND c.source_snapshot_class='RESEARCH_ONLY_UNVERIFIED_CONTENT'
  THEN 'NATIONAL_OFFICIAL_PORTAL_LINKED_EU_VISA_BASELINE_PROPOSAL_NOT_APPROVED'
  ELSE 'SOURCE_LINK_OR_QUARANTINE_GUARD_REFUSED' END AS source_review_disposition,
 false AS destination_passport_original_digest_sealed,
 false AS destination_visa_legal_rule_qualified,
 false AS applicant_document_residence_purpose_and_route_verified,
 false AS ma1_owner_aal2_approved,
 false AS publication_allowed,
 NULL::date AS legal_valid_from,
 NULL::numeric AS legal_fee,
 'derzeit nicht verfügbar'::text AS personal_visa_decision,
 'derzeit nicht verfügbar'::text AS entry_vaccination,
 guard.bg1 AS bg1_status
FROM scoped c CROSS JOIN evidence CROSS JOIN topics CROSS JOIN guard
ORDER BY CASE c.destination_code WHEN 'IT' THEN 1 WHEN 'FR' THEN 2
 WHEN 'ES' THEN 3 WHEN 'PT' THEN 4 ELSE 5 END,c.priority_rank;
ROLLBACK;
