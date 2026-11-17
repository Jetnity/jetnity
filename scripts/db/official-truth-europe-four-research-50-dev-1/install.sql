-- IT -> FR -> ES -> PT 50-passport library research intake, DEVELOPMENT ONLY.
-- The exact user's pinned archive is checked by the corresponding offline
-- command BEFORE installation. No positive facts, passport legal qualification,
-- Official Truth method approval, provider API write, or Production access.
-- Source archive SHA256 6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5.
BEGIN;
SET LOCAL jetnity.followup_dev_target='dev:yfvbxvijcorffwxbxahl:EUROPE-4-50-RESEARCH-1';
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $eu_preflight$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
  OR current_setting('server_version_num')::integer/10000<>17
  OR current_setting('jetnity.followup_dev_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:EUROPE-4-50-RESEARCH-1'
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
  OR to_regnamespace('jetnity_followup_research_private') IS NOT NULL
 THEN RAISE EXCEPTION 'EUROPE_4_EXACT_DEV_RESEARCH_PREDECESSOR_REQUIRED' USING ERRCODE='P7984'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
 IF NOT pg_try_advisory_xact_lock(771101,1) OR NOT pg_try_advisory_xact_lock(771102,1) THEN
 RAISE EXCEPTION 'EUROPE_4_COMPETING_PROTECTED_TRANSITION' USING ERRCODE='P7984'; END IF;
END $eu_preflight$;
CREATE TEMP TABLE eu_before(catalog jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO eu_before SELECT official_v3_guard_private.catalog_status_v1();

CREATE SCHEMA jetnity_followup_research_private;
REVOKE ALL ON SCHEMA jetnity_followup_research_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_followup_research_private.country_packages_v1(
 destination_code text PRIMARY KEY CHECK(destination_code IN ('IT','FR','ES','PT')),
 review_order integer UNIQUE NOT NULL CHECK(review_order BETWEEN 1 AND 4),
 destination_label text NOT NULL,
 general_official_source text NOT NULL CHECK(general_official_source LIKE 'https://%'),
 archive_sha256 text NOT NULL CHECK(archive_sha256='6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5'),
 priority_sha256 text NOT NULL CHECK(priority_sha256='4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358'),
 record_bundle_sha256 text NOT NULL CHECK(record_bundle_sha256 ~ '^[a-f0-9]{64}$'),
 research_record_bytes integer NOT NULL CHECK(research_record_bytes>0),
 records_v22 integer NOT NULL DEFAULT 48 CHECK(records_v22=48),
 records_v21 integer NOT NULL DEFAULT 2 CHECK(records_v21=2),
 research_conflicts integer NOT NULL CHECK(research_conflicts BETWEEN 0 AND 50),
 research_classification text NOT NULL DEFAULT 'RESEARCH_ONLY' CHECK(research_classification='RESEARCH_ONLY'),
 official_source_qualification text NOT NULL DEFAULT 'NOT_VERIFIED_FOR_RULES' CHECK(official_source_qualification='NOT_VERIFIED_FOR_RULES'),
 publication_permission boolean NOT NULL DEFAULT false CHECK(publication_permission=false)
);
CREATE TABLE jetnity_followup_research_private.passport_research_v1(
 destination_code text NOT NULL REFERENCES jetnity_followup_research_private.country_packages_v1(destination_code),
 passport_rank integer NOT NULL CHECK(passport_rank BETWEEN 1 AND 50),
 citizenship_country_code text NOT NULL CHECK(citizenship_country_code ~ '^[A-Z]{2}$'),
 research_archive_path text NOT NULL,
 rule_state text NOT NULL DEFAULT 'derzeit nicht verfügbar' CHECK(rule_state='derzeit nicht verfügbar'),
 accepted_fact_count integer NOT NULL DEFAULT 0 CHECK(accepted_fact_count=0),
 PRIMARY KEY(destination_code,passport_rank),
 UNIQUE(destination_code,citizenship_country_code),
 CHECK(research_archive_path='entry-requirements/records/dest/'||destination_code||'/'||citizenship_country_code||'.json')
);
CREATE TABLE jetnity_followup_research_private.topic_research_v1(
 destination_code text NOT NULL,
 passport_rank integer NOT NULL,
 requirement_type text NOT NULL,
 state text NOT NULL DEFAULT 'derzeit nicht verfügbar' CHECK(state='derzeit nicht verfügbar'),
 source_rule_approved boolean NOT NULL DEFAULT false CHECK(source_rule_approved=false),
 PRIMARY KEY(destination_code,passport_rank,requirement_type),
 FOREIGN KEY(destination_code,passport_rank) REFERENCES jetnity_followup_research_private.passport_research_v1(destination_code,passport_rank)
);
CREATE TEMP TABLE eu_fixed_country (
 review_order integer PRIMARY KEY, code text UNIQUE NOT NULL, label text NOT NULL,
 official_source text NOT NULL, source_bundle_sha text NOT NULL,
 source_bytes integer NOT NULL, conflict_rows integer NOT NULL
) ON COMMIT DROP;
INSERT INTO eu_fixed_country VALUES
  (1,'IT','Italia','https://www.esteri.it/it/ministero/sportello_info/domandefrequenti/sezione_visti_entrare_in_italia/','32be868938c4c0c14ac1feedf587eba958c8e6e6eed7df5afaab8feacd78c5cb',917859,0),
  (2,'FR','France','https://france-visas.gouv.fr/en/faq','d646492fd3b936be823858ba3761a7c4b050c6a240b704e0d764e7c864a255f2',801246,0),
  (3,'ES','España','https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/','33edb428273128b5f04c8868d7e329753c208157b419008c5ad6be9c2ca8bd60',1096297,30),
  (4,'PT','Portugal','https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao','b8dc02c0a0ec43123b2c44184f67bcdf26416e6d7b32e1c34e57b2a432e68571',1029934,0);
CREATE TEMP TABLE eu_fixed_passport(rank integer PRIMARY KEY,code text UNIQUE NOT NULL) ON COMMIT DROP;
INSERT INTO eu_fixed_passport SELECT ord::integer,code FROM unnest(string_to_array('IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL',' ')) WITH ORDINALITY AS p(code,ord);
CREATE TEMP TABLE eu_fixed_topics(topic text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO eu_fixed_topics SELECT unnest(string_to_array('visa electronic_travel_authorization stay_limit passport identity_document passport_validity blank_passport_pages required_vaccinations recommended_vaccinations health_measures health_documents insurance entry_forms form_costs fraud_warnings entry_fees onward_return_ticket financial_means booking_or_travel_document transit minors parental_consent customs dual_nationals recent_changes official_actions',' '));
DO $euro_exact$
BEGIN
 IF (SELECT count(*) FROM eu_fixed_country)<>4
 OR (SELECT count(*) FROM eu_fixed_passport)<>50
 OR (SELECT count(*) FROM eu_fixed_topics)<>26
 OR (SELECT string_agg(code,' ' ORDER BY rank) FROM eu_fixed_passport)<>
 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'
 OR (SELECT string_agg(code,' ' ORDER BY review_order) FROM eu_fixed_country)<>'IT FR ES PT'
 THEN RAISE EXCEPTION 'EUROPE_4_RESEARCH_INVENTORY_REFUSED' USING ERRCODE='P7984'; END IF;
END $euro_exact$;
INSERT INTO jetnity_followup_research_private.country_packages_v1(
 destination_code,review_order,destination_label,general_official_source,archive_sha256,priority_sha256,
 record_bundle_sha256,research_record_bytes,research_conflicts)
 SELECT code,review_order,label,official_source,
 '6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5',
 '4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358',
 source_bundle_sha,source_bytes,conflict_rows FROM eu_fixed_country ORDER BY review_order;
INSERT INTO jetnity_followup_research_private.passport_research_v1(
 destination_code,passport_rank,citizenship_country_code,research_archive_path)
 SELECT c.code,p.rank,p.code,'entry-requirements/records/dest/'||c.code||'/'||p.code||'.json'
 FROM eu_fixed_country c CROSS JOIN eu_fixed_passport p ORDER BY c.review_order,p.rank;
INSERT INTO jetnity_followup_research_private.topic_research_v1(destination_code,passport_rank,requirement_type)
 SELECT r.destination_code,r.passport_rank,t.topic
 FROM jetnity_followup_research_private.passport_research_v1 r CROSS JOIN eu_fixed_topics t;

-- No app auth role can inspect even the research placeholders.
ALTER TABLE jetnity_followup_research_private.country_packages_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_research_private.country_packages_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_research_private.passport_research_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_research_private.passport_research_v1 FORCE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_research_private.topic_research_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_research_private.topic_research_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON jetnity_followup_research_private.country_packages_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY owner_only ON jetnity_followup_research_private.passport_research_v1 TO postgres USING(true) WITH CHECK(true);
CREATE POLICY owner_only ON jetnity_followup_research_private.topic_research_v1 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_research_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION jetnity_followup_research_private.immutable_research_v1() RETURNS trigger
 LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $deny$
 BEGIN RAISE EXCEPTION 'RESEARCH_ONLY immutable cannot publish' USING ERRCODE='P7985'; END $deny$;
REVOKE ALL ON FUNCTION jetnity_followup_research_private.immutable_research_v1() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER research_immutable BEFORE UPDATE OR DELETE ON jetnity_followup_research_private.country_packages_v1 FOR EACH ROW EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
CREATE TRIGGER research_truncate BEFORE TRUNCATE ON jetnity_followup_research_private.country_packages_v1 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
CREATE TRIGGER research_immutable BEFORE UPDATE OR DELETE ON jetnity_followup_research_private.passport_research_v1 FOR EACH ROW EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
CREATE TRIGGER research_truncate BEFORE TRUNCATE ON jetnity_followup_research_private.passport_research_v1 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
CREATE TRIGGER research_immutable BEFORE UPDATE OR DELETE ON jetnity_followup_research_private.topic_research_v1 FOR EACH ROW EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
CREATE TRIGGER research_truncate BEFORE TRUNCATE ON jetnity_followup_research_private.topic_research_v1 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_research_private.immutable_research_v1();
DO $eu_post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_research_private.country_packages_v1)<>4
 OR (SELECT count(*) FROM jetnity_followup_research_private.passport_research_v1)<>200
 OR (SELECT count(*) FROM jetnity_followup_research_private.topic_research_v1)<>5200
 OR EXISTS (SELECT 1 FROM jetnity_followup_research_private.country_packages_v1
   WHERE publication_permission OR research_classification<>'RESEARCH_ONLY' OR official_source_qualification<>'NOT_VERIFIED_FOR_RULES')
 OR EXISTS (SELECT 1 FROM jetnity_followup_research_private.passport_research_v1
   WHERE rule_state<>'derzeit nicht verfügbar' OR accepted_fact_count<>0)
 OR EXISTS (SELECT 1 FROM jetnity_followup_research_private.topic_research_v1
   WHERE state<>'derzeit nicht verfügbar' OR source_rule_approved)
 OR has_schema_privilege('anon','jetnity_followup_research_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_followup_research_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_followup_research_private','USAGE')
 OR (SELECT catalog FROM eu_before LIMIT 1) IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'EUROPE_4_RESEARCH_OR_BG1_BOUNDARY_CHANGED' USING ERRCODE='P7985'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $eu_post$;
COMMIT;
