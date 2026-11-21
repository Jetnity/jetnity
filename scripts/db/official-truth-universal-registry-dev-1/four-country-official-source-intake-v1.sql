-- DEV ONLY. Nine destination-government research URLs checked 2026-11-19.
-- One preexisting universal dispatcher; no new country code, rules, cron or costs.
-- These are SOURCE CANDIDATES, not passport-/purpose-specific legal validations.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.four_source_target='dev:yfvbxvijcorffwxbxahl:FOUR-SOURCE-V1';
DO $intake$
DECLARE id text;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.four_source_target',true)
   IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOUR-SOURCE-V1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_legal_review_private.at_rule_readiness_v1') IS NULL
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>26
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>7
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>4
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1)<>10300
 OR (SELECT count(*) FROM jetnity_release_review_private.passport_topic_status_v1)<>6500
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
   WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR (SELECT count(*) FROM cron.job WHERE active AND jobname='jetnity-global-source-review-queue-dev'
   AND schedule='*/5 * * * *'
   AND command='SELECT jetnity_source_dispatch_private.tick_v1()')<>1
 OR pg_database_size(current_database())>=268435456
 OR NOT pg_try_advisory_xact_lock(771115,777)
 THEN RAISE EXCEPTION 'FOUR_COUNTRY_SOURCE_PREDECESSOR_REQUIRED' USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();

  id:=jetnity_source_registry_private.register_research_source_v1('IT','maeci-foreign-stay',
    'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/soggiorno_stranieri_in_italia/',ARRAY['visa','passport','passport_validity','stay_limit','financial_means','onward_return_ticket','booking_or_travel_document','transit']::text[],720);
  IF id<>'IT:maeci-foreign-stay' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('IT','maeci-visa',
    'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/',ARRAY['visa','entry_forms','form_costs','entry_fees','official_actions']::text[],720);
  IF id<>'IT:maeci-visa' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('FR','state-shortstay',
    'https://www.service-public.gouv.fr/particuliers/vosdroits/F21921',ARRAY['visa','passport','passport_validity','insurance','financial_means','booking_or_travel_document','stay_limit','official_actions']::text[],720);
  IF id<>'FR:state-shortstay' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('FR','france-visas-faq',
    'https://france-visas.gouv.fr/fr/faq',ARRAY['visa','entry_forms','form_costs','entry_fees','official_actions']::text[],720);
  IF id<>'FR:france-visas-faq' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('FR','customs-cash',
    'https://www.douane.gouv.fr/fiche/vous-voyagez-avec-10-000-euros-ou-plus',ARRAY['customs','official_actions']::text[],720);
  IF id<>'FR:customs-cash' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('ES','interior-border',
    'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/',ARRAY['visa','passport','passport_validity','financial_means','onward_return_ticket','booking_or_travel_document','stay_limit','official_actions']::text[],720);
  IF id<>'ES:interior-border' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('ES','tax-customs',
    'https://sede.agenciatributaria.gob.es/Sede/viajeros-trabajadores-desplazados-fronterizos/viajeros/informacion-general.html',ARRAY['customs','official_actions']::text[],720);
  IF id<>'ES:tax-customs' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('PT','gov-travel',
    'https://www.gov.pt/guias/viajar-para-portugal',ARRAY['passport','identity_document','minors','parental_consent','official_actions']::text[],720);
  IF id<>'PT:gov-travel' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;

  id:=jetnity_source_registry_private.register_research_source_v1('PT','gov-visa-application',
    'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',ARRAY['visa','entry_forms','form_costs','entry_fees','financial_means','onward_return_ticket','insurance','official_actions']::text[],720);
  IF id<>'PT:gov-visa-application' THEN RAISE EXCEPTION 'FOUR_REGISTRY_ID_INCORRECT'; END IF;
  PERFORM jetnity_source_dispatch_private.admit_host_v1('IT','www.esteri.it');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('FR','www.service-public.gouv.fr');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('FR','france-visas.gouv.fr');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('FR','www.douane.gouv.fr');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('ES','www.interior.gob.es');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('ES','sede.agenciatributaria.gob.es');
  PERFORM jetnity_source_dispatch_private.admit_host_v1('PT','www.gov.pt');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('IT:maeci-foreign-stay','https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/soggiorno_stranieri_in_italia/');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('IT:maeci-visa','https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('FR:state-shortstay','https://www.service-public.gouv.fr/particuliers/vosdroits/F21921');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('FR:france-visas-faq','https://france-visas.gouv.fr/fr/faq');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('FR:customs-cash','https://www.douane.gouv.fr/fiche/vous-voyagez-avec-10-000-euros-ou-plus');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('ES:interior-border','https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('ES:tax-customs','https://sede.agenciatributaria.gob.es/Sede/viajeros-trabajadores-desplazados-fronterizos/viajeros/informacion-general.html');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('PT:gov-travel','https://www.gov.pt/guias/viajar-para-portugal');
  PERFORM jetnity_source_dispatch_private.admit_source_v1('PT:gov-visa-application','https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao');
 IF (SELECT count(*) FROM jetnity_source_registry_private.sources_v1)<>35
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_hosts_v1)<>11
 OR (SELECT count(*) FROM jetnity_source_dispatch_private.research_admissions_v1)<>16
 OR (SELECT count(*) FROM jetnity_source_registry_private.passport_scope_v1)<>1750
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='AT')<>10
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='IT')<>3
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='FR')<>4
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='ES')<>3
 OR (SELECT count(*) FROM jetnity_source_registry_private.sources_v1 WHERE destination_code='PT')<>3
 OR (SELECT count(*) FROM jetnity_legal_review_private.at_rule_readiness_v1)<>1300
 OR EXISTS(SELECT 1 FROM jetnity_release_review_private.passport_topic_status_v1
    WHERE customer_answer<>'derzeit nicht verfügbar' OR rule_publishable
      OR rule_verified OR accepted_facts<>0)
 OR EXISTS(SELECT 1 FROM jetnity_global_research_private.cases_v1
    WHERE legal_rule_qualified OR publication_allowed OR accepted_fact_count<>0)
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOUR_COUNTRY_SOURCE_POSTCHECK_ROLLBACK' USING ERRCODE='P7997'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $intake$;
COMMIT;
