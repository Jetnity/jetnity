-- Development-only follow-up destination official-source candidates.
-- This is an immutable authority URL inventory and 200-passport research queue,
-- NOT a full-original receipt, official approval, source monitor, legal rule or
-- visitor fact. No changes to existing imported topics, HRS, MA1, BG1 or jobs.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.followup_primary_target='dev:yfvbxvijcorffwxbxahl:FOLLOWUP-SOURCE-CANDIDATES-1';

DO $preflight$
BEGIN
  IF session_user<>'postgres' OR current_user<>session_user
    OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.followup_primary_target',true)
       IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FOLLOWUP-SOURCE-CANDIDATES-1'
    OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
    OR to_regnamespace('jetnity_followup_primary_private') IS NOT NULL
    OR (SELECT count(*) FROM jetnity_followup_research_private.country_packages_v1)<>4
    OR (SELECT count(*) FROM jetnity_followup_research_private.passport_research_v1)<>200
    OR (SELECT count(*) FROM jetnity_followup_research_private.topic_research_v1)<>5200
    OR (SELECT count(*) FROM official_v3_source_renewal_private.passport_priority_v1)<>50
    OR EXISTS (
      SELECT 1 FROM jetnity_followup_research_private.country_packages_v1 c
       WHERE c.destination_code NOT IN ('IT','FR','ES','PT')
          OR c.publication_permission IS NOT FALSE
          OR c.official_source_qualification<>'NOT_VERIFIED_FOR_RULES'
          OR c.research_conflicts<>CASE WHEN c.destination_code='ES' THEN 30 ELSE 0 END
    )
    OR EXISTS (
      SELECT 1 FROM jetnity_followup_research_private.passport_research_v1 r
       LEFT JOIN official_v3_source_renewal_private.passport_priority_v1 priority
          ON priority.rank=r.passport_rank AND priority.code=r.citizenship_country_code
       WHERE priority.code IS NULL
          OR r.destination_code NOT IN ('IT','FR','ES','PT')
          OR r.rule_state<>'derzeit nicht verfügbar' OR r.accepted_fact_count<>0
    )
    OR EXISTS(
      SELECT 1 FROM jetnity_followup_research_private.topic_research_v1 t
       WHERE t.destination_code NOT IN ('IT','FR','ES','PT')
         OR t.state<>'derzeit nicht verfügbar'
         OR t.source_rule_approved IS NOT FALSE
    )
    OR NOT pg_try_advisory_xact_lock(771109,1)
  THEN RAISE EXCEPTION 'FOLLOWUP_PRIMARY_DEV_RESEARCH_PREDECESSOR_REQUIRED'
    USING ERRCODE='P7994'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $preflight$;

CREATE SCHEMA jetnity_followup_primary_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_followup_primary_private FROM PUBLIC,anon,authenticated,service_role;

-- A browsed official page is NOT a verified whole-original pinned source.
-- No content digest is invented. Links/notes require a separate source reader,
-- pinning, scope qualification and real Owner/MA1/BG1 authority before use.
CREATE TABLE jetnity_followup_primary_private.sources_v1(
 destination_code text NOT NULL CHECK(destination_code IN ('IT','FR','ES','PT')),
 source_key text NOT NULL CHECK(source_key ~ '^[a-z][a-z0-9_-]{2,63}$'),
 topic text NOT NULL CHECK(topic IN ('visa','passport_validity','eta','forms','minors','financial_means')),
 source_role text NOT NULL CHECK(source_role IN ('destination_primary','independent_official')),
 authority_code text NOT NULL CHECK(authority_code IN ('IT','FR','ES','PT','EU')),
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 official_page_date date,
 research_checked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 scope_note text NOT NULL CHECK(length(scope_note) BETWEEN 10 AND 400),
 original_body_sha256 text CHECK(original_body_sha256 IS NULL),
 legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
 checked_unchanged boolean NOT NULL DEFAULT false CHECK(checked_unchanged=false),
 source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(publication_allowed=false),
 source_state text NOT NULL DEFAULT 'OFFICIAL_URL_CANDIDATE_NOT_PINNED'
   CHECK(source_state='OFFICIAL_URL_CANDIDATE_NOT_PINNED'),
 PRIMARY KEY(destination_code,source_key),
 UNIQUE(destination_code,official_url),
 CHECK((source_role='destination_primary' AND authority_code=destination_code)
       OR (source_role='independent_official' AND authority_code='EU'))
);

INSERT INTO jetnity_followup_primary_private.sources_v1
 (destination_code,source_key,topic,source_role,authority_code,official_url,official_page_date,scope_note) VALUES
 ('IT','maeci-short-stay-visa','visa','destination_primary','IT',
 'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/visto_ingresso/paesi_esenti_visto/',NULL,
 'Official exemption list has biometric-passport and issuing-authority exceptions; must be qualified per ordinary passport and short-stay purpose'),
 ('IT','maeci-travel-documents','passport_validity','destination_primary','IT',
 'https://www.esteri.it/it/servizi-opportunita/ingressosoggiornoinitalia/passaporti_documenti/',NULL,
 'Official recognized-document guidance, not one universal minimum passport validity rule'),
 ('IT','eu-etias-status','eta','independent_official','EU',
 'https://travel-europe.europa.eu/etias/faq',NULL,
 'ETIAS applications currently unavailable; do not publish a fake application form or automatic obligation'),
 ('FR','france-visas-swiss','visa','destination_primary','FR',
 'https://www.france-visas.gouv.fr/web/france-visas/suisse',NULL,
 'Official visa guidance explicitly exempts Swiss and European citizens but has specific French overseas limits'),
 ('FR','service-public-european-entry','passport_validity','destination_primary','FR',
 'https://www.service-public.gouv.fr/particuliers/vosdroits/F13512','2025-02-18',
 'Official valid ID or passport for European and Swiss visitors under three months; verify territory and traveler conditions'),
 ('FR','eu-etias-status','eta','independent_official','EU',
 'https://travel-europe.europa.eu/etias/faq',NULL,
 'ETIAS not in operation; no paid third-party application should be represented as required'),
 ('ES','interior-eu-entry','visa','destination_primary','ES',
 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/ciudadanos-de-la-union-europea/entrada-y-salida/',NULL,
 'Official entry for EU EEA and Swiss with valid ID or passport; not a rule for third-country passports'),
 ('ES','interior-border-passport','passport_validity','destination_primary','ES',
 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/control-de-fronteras/entrada-en-espana/',NULL,
 'Official general third-country passport rules, return journey, financial means and treaty exceptions; preserve 30 research conflicts'),
 ('ES','eu-etias-status','eta','independent_official','EU',
 'https://travel-europe.europa.eu/etias/faq',NULL,
 'ETIAS not in operation, not a presently payable application requirement'),
 ('PT','gov-pt-entry','passport_validity','destination_primary','PT',
 'https://www.gov.pt/guias/entrar-e-sair-de-portugal','2026-10-26',
 'Official valid ID or passport for EU travelers; Swiss and third-country scope needs independent exact legal qualification'),
 ('PT','gov-pt-visa-form','forms','destination_primary','PT',
 'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao','2026-05-21',
 'Official visa service information, not a verified direct application-form URL or fee; historical 80/90 euro difference unresolved'),
 ('PT','gov-pt-minors','minors','destination_primary','PT',
 'https://www.gov.pt/guias/viajar-para-portugal','2026-09-14',
 'Official minor-travel authorization information, no universal national-passport-specific obligation inferred'),
 ('PT','eu-etias-status','eta','independent_official','EU',
 'https://travel-europe.europa.eu/etias/faq',NULL,
 'ETIAS not yet operational; only the genuine EU portal may be linked once applicable');

CREATE TABLE jetnity_followup_primary_private.passport_scope_v1(
 destination_code text NOT NULL CHECK(destination_code IN ('IT','FR','ES','PT')),
 priority_rank integer NOT NULL CHECK(priority_rank BETWEEN 1 AND 50),
 citizenship_code text NOT NULL CHECK(citizenship_code ~ '^[A-Z]{2}$'),
 source_group text NOT NULL CHECK(source_group IN ('EU_CH_OFFICIAL_CANDIDATE','PER_PASSPORT_QUALIFICATION_REQUIRED')),
 legal_fact_accepted boolean NOT NULL DEFAULT false CHECK(legal_fact_accepted=false),
 can_publish boolean NOT NULL DEFAULT false CHECK(can_publish=false),
 visitor_status text NOT NULL DEFAULT 'derzeit nicht verfügbar'
  CHECK(visitor_status='derzeit nicht verfügbar'),
 next_gate text NOT NULL DEFAULT 'PIN_WHOLE_PRIMARY_QUALIFY_DOCUMENT_ROUTE_MA1_BG1'
  CHECK(next_gate='PIN_WHOLE_PRIMARY_QUALIFY_DOCUMENT_ROUTE_MA1_BG1'),
 PRIMARY KEY(destination_code,priority_rank),
 UNIQUE(destination_code,citizenship_code)
 -- No FK to the protected BG1/SourceRenewal priority table: that would add
 -- catalog dependencies to immutable protected history. The read-only
 -- preflight checks the exact 50 rank/code pairs before the insert.
);
INSERT INTO jetnity_followup_primary_private.passport_scope_v1
 (destination_code,priority_rank,citizenship_code,source_group)
 SELECT r.destination_code,r.passport_rank,r.citizenship_country_code,
   CASE WHEN r.citizenship_country_code IN
    ('DE','PL','IT','RO','FR','NL','ES','HU','CZ','HR','BE','PT','BG','GR','SK','SE','DK','LT','CH')
   THEN 'EU_CH_OFFICIAL_CANDIDATE'
   ELSE 'PER_PASSPORT_QUALIFICATION_REQUIRED' END
 FROM jetnity_followup_research_private.passport_research_v1 r
 WHERE r.destination_code IN ('IT','FR','ES','PT');

CREATE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog AS $deny$
BEGIN
 RAISE EXCEPTION 'FOLLOWUP_SOURCE_RESEARCH_APPEND_ONLY' USING ERRCODE='P7994';
END $deny$;
REVOKE ALL ON FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()
 FROM PUBLIC,anon,authenticated,service_role;
DO $private$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['sources_v1','passport_scope_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_followup_primary_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE jetnity_followup_primary_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_followup_primary_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER immut_rows BEFORE UPDATE OR DELETE ON jetnity_followup_primary_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()',t);
  EXECUTE format('CREATE TRIGGER immut_trunc BEFORE TRUNCATE ON jetnity_followup_primary_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()',t);
 END LOOP;
END $private$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_primary_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_followup_primary_private FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_primary_private.sources_v1)<>13
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1)<>200
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1
     WHERE source_group='EU_CH_OFFICIAL_CANDIDATE')<>76
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.passport_scope_v1
     WHERE can_publish OR legal_fact_accepted OR visitor_status<>'derzeit nicht verfügbar')
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.sources_v1
     WHERE original_body_sha256 IS NOT NULL OR source_qualified OR checked_unchanged OR publication_allowed)
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='jetnity_followup_primary_private' AND c.relkind='r'
       AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
        OR has_table_privilege('anon',c.oid,'SELECT')
        OR has_table_privilege('authenticated',c.oid,'SELECT')
        OR has_table_privilege('service_role',c.oid,'SELECT')))
 OR has_schema_privilege('anon','jetnity_followup_primary_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_followup_primary_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_followup_primary_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOLLOWUP_SOURCE_RESEARCH_POSTCHECK_REFUSED'
  USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
