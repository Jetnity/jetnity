-- DEV ONLY. FR/ES 19 each; real complete government sources but NO
-- visa/entry rule authorization, passport publication, MA1 or BG1 amendment.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL jetnity.fr_es_target='dev:yfvbxvijcorffwxbxahl:FR-ES-REVIEW-38-1';
DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres' OR current_setting('server_version_num')::int/10000<>17
 OR current_setting('jetnity.fr_es_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:FR-ES-REVIEW-38-1'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regclass('jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1') IS NOT NULL
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1 WHERE destination_code IN ('FR','ES'))<>100
 OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1 WHERE destination_code IN ('FR','ES') AND source_group='EU_CH_OFFICIAL_CANDIDATE')<>38
 OR (SELECT research_conflicts FROM jetnity_followup_research_private.country_packages_v1 WHERE destination_code='ES')<>30
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.passport_scope_v1 WHERE destination_code IN ('FR','ES') AND (legal_fact_accepted OR can_publish))
 OR NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.source_originals_v1
 WHERE destination_code='FR' AND raw_bytes=93694 AND raw_sha256='a49a6e0bb426a676652c2cf94f04813ea0b0cf3be19089cf240fdf07b0ef137d'
 AND position('Européen en France' IN convert_from(original_html,'UTF8'))>0
 AND position('Vous pouvez entrer et être présent jusqu' IN convert_from(original_html,'UTF8'))>0
 AND position('passeport ou un titre d' IN convert_from(original_html,'UTF8'))>0
 AND position('Suisse' IN convert_from(original_html,'UTF8'))>0
 AND source_qualified IS FALSE AND publication_allowed IS FALSE)
 OR NOT EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.source_originals_v1
 WHERE destination_code='ES' AND raw_bytes=144882 AND raw_sha256='6e581c8baba9c45de770eacccebb8ee57a4eb4d5b546ab7c8835d7e217471c55'
 AND position('Artículo 4. Entrada.' IN convert_from(original_html,'UTF8'))>0
 AND position('La entrada en territorio español del ciudadano de la Unión' IN convert_from(original_html,'UTF8'))>0
 AND position('Confederación Suiza' IN convert_from(original_html,'UTF8'))>0
 AND source_qualified IS FALSE AND publication_allowed IS FALSE)
 OR NOT pg_try_advisory_xact_lock(771109,38)
 THEN RAISE EXCEPTION 'FR_ES_EXACT_SOURCE_REVIEW_REFUSED' USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;
CREATE TABLE jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1(
 destination_code text NOT NULL CHECK(destination_code IN ('FR','ES')),
 citizenship_country_code text NOT NULL CHECK(citizenship_country_code~'^[A-Z]{2}$'),
 priority_rank integer NOT NULL CHECK(priority_rank BETWEEN 1 AND 50),
 document_type text NOT NULL DEFAULT 'ordinary_valid_national_passport'
  CHECK(document_type='ordinary_valid_national_passport'),
 route_scope text NOT NULL DEFAULT 'direct_entry_short_stay'
  CHECK(route_scope='direct_entry_short_stay'),
 freedom_scheme text NOT NULL CHECK(freedom_scheme IN ('EU_EEA','SWISS_EU')),
 primary_authority text NOT NULL,
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 original_sha256 text NOT NULL CHECK(original_sha256~'^[a-f0-9]{64}$'),
 observed_at timestamptz NOT NULL,
 source_edition date CHECK(source_edition IS NULL),
 legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
 review_status text NOT NULL DEFAULT 'PRIMARY_SOURCE_CANDIDATE_NOT_QUALIFIED'
  CHECK(review_status='PRIMARY_SOURCE_CANDIDATE_NOT_QUALIFIED'),
 result text NOT NULL DEFAULT 'derzeit nicht verfügbar'
  CHECK(result='derzeit nicht verfügbar'),
 accepted_facts integer NOT NULL DEFAULT 0 CHECK(accepted_facts=0),
 method_approved boolean NOT NULL DEFAULT false CHECK(method_approved=false),
 legal_rule_approved boolean NOT NULL DEFAULT false CHECK(legal_rule_approved=false),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(publication_allowed=false),
 PRIMARY KEY(destination_code,priority_rank), UNIQUE(destination_code,citizenship_country_code)
);
INSERT INTO jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1(
 destination_code,citizenship_country_code,priority_rank,freedom_scheme,primary_authority,
 official_url,original_sha256,observed_at)
SELECT p.destination_code,p.citizenship_code,p.priority_rank,
 CASE WHEN p.citizenship_code='CH' THEN 'SWISS_EU' ELSE 'EU_EEA' END,
 CASE WHEN p.destination_code='FR' THEN 'DILA/Service-Public' ELSE 'BOE/Spanish Government' END,
 o.official_url,o.raw_sha256,o.observed_at
FROM jetnity_followup_primary_private.passport_scope_v1 p
JOIN jetnity_followup_source_monitor_private.source_originals_v1 o
 ON o.destination_code=p.destination_code
WHERE p.destination_code IN('FR','ES') AND p.source_group='EU_CH_OFFICIAL_CANDIDATE'
AND p.citizenship_code IN ('DE','PL','IT','RO','FR','NL','ES','HU','CZ','HR','BE','PT','BG','GR','SK','SE','DK','LT','CH');
ALTER TABLE jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER no_rows_changed BEFORE UPDATE OR DELETE
 ON jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 FOR EACH ROW
 EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1();
CREATE TRIGGER no_truncate BEFORE TRUNCATE
 ON jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 FOR EACH STATEMENT
 EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1();
REVOKE ALL ON TABLE jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 FROM PUBLIC,anon,authenticated,service_role;
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1)<>38
 OR (SELECT count(*) FROM jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 WHERE destination_code='FR')<>19
 OR (SELECT count(*) FROM jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 WHERE destination_code='ES')<>19
 OR (SELECT count(*) FROM jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1 WHERE freedom_scheme='SWISS_EU')<>2
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1
 WHERE method_approved OR legal_rule_approved OR publication_allowed OR accepted_facts<>0 OR result<>'derzeit nicht verfügbar')
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR (SELECT bool_and(c.relrowsecurity AND c.relforcerowsecurity AND NOT has_table_privilege('anon',c.oid,'SELECT')
 AND NOT has_table_privilege('authenticated',c.oid,'SELECT') AND NOT has_table_privilege('service_role',c.oid,'SELECT'))
 FROM pg_class c WHERE c.oid='jetnity_followup_primary_private.fr_es_eu_ch_visa_review_v1'::regclass) IS NOT TRUE
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FR_ES_PRIVATE_REVIEW_POSTCHECK_REFUSED' USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;