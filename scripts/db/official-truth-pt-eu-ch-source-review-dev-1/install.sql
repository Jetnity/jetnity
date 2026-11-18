-- DEV-ONLY: primary Portugal govt source to 19 ranked EU/Swiss ordinary-passport
-- visa review cases. Actual 200 OK raw HTML was independently received via
-- net.http_get, checked for full exact SHA256 and gov text. Never a positive
-- travel rule, source qualification, MA1 approval, method revision or public RPC.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.pt_eu_review_target='dev:yfvbxvijcorffwxbxahl:PT-EUCH-GOVT-RAW-1';

DO $pre$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR current_database()<>'postgres'
   OR current_setting('server_version_num')::integer/10000<>17
   OR current_setting('jetnity.pt_eu_review_target',true) IS DISTINCT FROM
      'dev:yfvbxvijcorffwxbxahl:PT-EUCH-GOVT-RAW-1'
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR to_regclass('jetnity_followup_primary_private.pt_visa_original_v1') IS NOT NULL
   OR to_regclass('jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1') IS NOT NULL
   OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1
     WHERE destination_code='PT')<>50
   OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1
     WHERE destination_code='PT' AND source_group='EU_CH_OFFICIAL_CANDIDATE')<>19
   OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.passport_scope_v1
     WHERE destination_code='PT' AND (can_publish OR legal_fact_accepted))
   OR (SELECT count(*) FROM net._http_response r WHERE r.id=65
     AND r.status_code=200 AND r.timed_out IS NOT TRUE AND r.error_msg IS NULL
     AND r.content_type~*'^text/html([; ]|$)'
     AND octet_length(convert_to(r.content,'UTF8'))=46233
     AND encode(sha256(convert_to(r.content,'UTF8')),'hex')
      ='c36affa1a49a859dbf1cee010c4012944d9b768a1a61ffc8100f9d504f1a1104'
     AND position('Pedir um Visto Schengen' IN r.content)>0
     AND position('União Europeia (UE)' IN r.content)>0
     AND position('Suíça' IN r.content)>0
     AND position('captcha' IN lower(r.content))=0
     AND position('radware' IN lower(r.content))=0
     AND position('access denied' IN lower(r.content))=0)<>1
   OR NOT pg_try_advisory_xact_lock(771109,19)
 THEN RAISE EXCEPTION 'PT_19_REAL_SOURCE_DEV_PREDECESSOR_REFUSED'
  USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE TABLE jetnity_followup_primary_private.pt_visa_original_v1(
 source_key text PRIMARY KEY CHECK(source_key='pt-gov-schengen-short-stay'),
 official_url text NOT NULL CHECK(official_url=
   'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao'),
 authority text NOT NULL CHECK(authority='Portugal — gov.pt'),
 retrieved_at timestamptz NOT NULL,
 original_body bytea NOT NULL,
 bytes integer GENERATED ALWAYS AS (octet_length(original_body)) STORED,
 sha256 text GENERATED ALWAYS AS (encode(sha256(original_body),'hex')) STORED,
 legal_valid_from timestamptz CHECK(legal_valid_from IS NULL),
 legal_valid_until timestamptz CHECK(legal_valid_until IS NULL),
 law_reference text NOT NULL CHECK(law_reference=
  'https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2006-128792849'),
 law_original_verified boolean NOT NULL DEFAULT false CHECK(law_original_verified=false),
 source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
 positive_legal_facts integer NOT NULL DEFAULT 0 CHECK(positive_legal_facts=0),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(publication_allowed=false),
 CHECK(octet_length(original_body)=46233),
 CHECK(encode(sha256(original_body),'hex')=
  'c36affa1a49a859dbf1cee010c4012944d9b768a1a61ffc8100f9d504f1a1104')
);
INSERT INTO jetnity_followup_primary_private.pt_visa_original_v1
 (source_key,official_url,authority,retrieved_at,original_body,law_reference)
SELECT 'pt-gov-schengen-short-stay',
 'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
 'Portugal — gov.pt',r.created,convert_to(r.content,'UTF8'),
 'https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2006-128792849'
FROM net._http_response r WHERE r.id=65
 AND r.status_code=200 AND r.timed_out IS NOT TRUE AND r.error_msg IS NULL
 AND octet_length(convert_to(r.content,'UTF8'))=46233
 AND encode(sha256(convert_to(r.content,'UTF8')),'hex')=
 'c36affa1a49a859dbf1cee010c4012944d9b768a1a61ffc8100f9d504f1a1104';

CREATE TABLE jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1(
 destination_code text NOT NULL DEFAULT 'PT' CHECK(destination_code='PT'),
 priority_rank integer NOT NULL CHECK(priority_rank BETWEEN 1 AND 50),
 citizenship_country_code text NOT NULL CHECK(citizenship_country_code~'^[A-Z]{2}$'),
 source_key text NOT NULL DEFAULT 'pt-gov-schengen-short-stay'
  CHECK(source_key='pt-gov-schengen-short-stay'),
 document_type text NOT NULL DEFAULT 'ordinary_valid_national_passport'
  CHECK(document_type='ordinary_valid_national_passport'),
 trip_conditions text NOT NULL DEFAULT 'direct_entry_short_stay_up_to_90_days'
  CHECK(trip_conditions='direct_entry_short_stay_up_to_90_days'),
 review_state text NOT NULL DEFAULT 'LEGAL_PRIMARY_AND_MA1_QUALIFICATION_PENDING'
  CHECK(review_state='LEGAL_PRIMARY_AND_MA1_QUALIFICATION_PENDING'),
 visa_candidate text NOT NULL DEFAULT 'EU_EEA_SWISS_SHORT_STAY_POSSIBLE_EXEMPTION'
  CHECK(visa_candidate='EU_EEA_SWISS_SHORT_STAY_POSSIBLE_EXEMPTION'),
 legal_rule_verified boolean NOT NULL DEFAULT false CHECK(legal_rule_verified=false),
 initial_approved_fact boolean NOT NULL DEFAULT false CHECK(initial_approved_fact=false),
 customer_publication_allowed boolean NOT NULL DEFAULT false CHECK(customer_publication_allowed=false),
 source_checked_at timestamptz NOT NULL,
 PRIMARY KEY(destination_code,priority_rank),
 UNIQUE(destination_code,citizenship_country_code),
 FOREIGN KEY(source_key) REFERENCES jetnity_followup_primary_private.pt_visa_original_v1(source_key)
);
INSERT INTO jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1
 (priority_rank,citizenship_country_code,source_checked_at)
SELECT p.priority_rank,p.citizenship_code,o.retrieved_at
FROM jetnity_followup_primary_private.passport_scope_v1 p
CROSS JOIN jetnity_followup_primary_private.pt_visa_original_v1 o
WHERE p.destination_code='PT' AND p.source_group='EU_CH_OFFICIAL_CANDIDATE'
 AND p.citizenship_code IN
 ('DE','PL','IT','RO','FR','NL','ES','HU','CZ','HR','BE','PT','BG','GR','SK','SE','DK','LT','CH');

DO $private$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['pt_visa_original_v1','pt_eu_ch_visa_candidate_v1'] LOOP
  EXECUTE format('ALTER TABLE jetnity_followup_primary_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE jetnity_followup_primary_private.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY postgres_only ON jetnity_followup_primary_private.%I TO postgres USING(true) WITH CHECK(true)',t);
  EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON jetnity_followup_primary_private.%I FOR EACH ROW EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()',t);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_followup_primary_private.%I FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_primary_private.refuse_mutation_v1()',t);
 END LOOP;
END $private$;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_followup_primary_private FROM PUBLIC,anon,authenticated,service_role;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_primary_private.pt_visa_original_v1)<>1
 OR (SELECT count(*) FROM jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1)<>19
 OR (SELECT count(*) FROM jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1
      WHERE citizenship_country_code='CH')<>1
 OR (SELECT count(*) FROM jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1
      WHERE citizenship_country_code<>'CH')<>18
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1
      WHERE legal_rule_verified OR initial_approved_fact OR customer_publication_allowed)
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.pt_visa_original_v1
      WHERE law_original_verified OR source_qualified OR positive_legal_facts<>0 OR publication_allowed)
 OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.passport_scope_v1
      WHERE destination_code='PT' AND (can_publish OR legal_fact_accepted))
 OR (SELECT bool_and(c.relrowsecurity AND c.relforcerowsecurity
      AND NOT has_table_privilege('anon',c.oid,'SELECT')
      AND NOT has_table_privilege('authenticated',c.oid,'SELECT')
      AND NOT has_table_privilege('service_role',c.oid,'SELECT'))
   FROM pg_class c WHERE c.oid IN
    ('jetnity_followup_primary_private.pt_visa_original_v1'::regclass,
     'jetnity_followup_primary_private.pt_eu_ch_visa_candidate_v1'::regclass)
  ) IS NOT TRUE
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'PT_19_PRIVATE_ORIGINAL_REVIEW_FAILED' USING ERRCODE='P7994'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;