-- DEV ONLY. Legal review evidence for ordinary valid passport/direct entry
-- EU/Swiss freedom-of-movement visa exemption to Austria. 19 passports:
-- the entire original BMI 06.11.2026 matrix contains EU-Freizuegigkeit in
-- ALL FOUR relevant visa categories. This is not a customer publication,
-- owner MA1 approval, entry/transit/fee/health/form rule or new HRS source.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.at_eea_review_target='dev:yfvbxvijcorffwxbxahl:AT-EU-CH-19-REVIEW';
DO $pre$
DECLARE latest_batch bigint;
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
 OR current_database()<>'postgres'
 OR current_setting('server_version_num')::integer/10000<>17
 OR current_setting('jetnity.at_eea_review_target',true)
 IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:AT-EU-CH-19-REVIEW'
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR to_regnamespace('jetnity_at_eu_ch_review_private') IS NOT NULL
 OR official_v3_at_source_watch_private.status_v1()->>'status'<>'PINNED_UNCHANGED_NOT_APPROVED'
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1)<>50
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_topics_v1)<>1300
 OR (SELECT count(*) FROM official_v3_at_private.whole_originals_v2)<>3
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1
      WHERE destination_code='AT' AND citizenship_code='CH' AND requirement_type='visa')<>1
 OR (SELECT count(*) FROM jetnity_entry_research_private.passport_visa_v1 r
   WHERE r.matrix_evidence_present AND r.source_matrix_sha256=
     'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
    AND r.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit'
    AND r.raw_matrix_cells->>1='EU-Freiz&uuml;gigkeit'
    AND r.raw_matrix_cells->>2='EU-Freiz&uuml;gigkeit'
    AND r.raw_matrix_cells->>3='EU-Freiz&uuml;gigkeit')<>19
 OR NOT pg_try_advisory_xact_lock(771111,19)
 THEN RAISE EXCEPTION 'AT_19_LEGAL_REVIEW_PREDECESSOR_REFUSED'
 USING ERRCODE='P7988'; END IF;
 SELECT max(batch_id) INTO latest_batch FROM official_v3_at_source_watch_private.batches_v1;
 IF latest_batch IS NULL
 OR (SELECT count(*) FROM official_v3_at_source_watch_private.reads_v1
   WHERE batch_id=latest_batch AND state IN('unchanged_exact','unchanged_asset_version_only')
     AND observed_at IS NOT NULL AND observed_at>clock_timestamp()-interval '70 minutes')<>3
 THEN RAISE EXCEPTION 'AT_19_OFFICIAL_SOURCE_TOO_OLD' USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $pre$;

CREATE SCHEMA jetnity_at_eu_ch_review_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_at_eu_ch_review_private
 FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_at_eu_ch_review_private.visa_review_v1(
 passport text PRIMARY KEY CHECK(passport ~ '^[A-Z]{2}$'),
 priority_rank integer NOT NULL UNIQUE CHECK(priority_rank BETWEEN 1 AND 50),
 destination text NOT NULL DEFAULT 'AT' CHECK(destination='AT'),
 document_scope text NOT NULL DEFAULT 'ordinary_valid_national_passport'
  CHECK(document_scope='ordinary_valid_national_passport'),
 route_scope text NOT NULL DEFAULT 'direct_entry'
  CHECK(route_scope='direct_entry'),
 legal_scheme text NOT NULL CHECK(legal_scheme IN
 ('EU_EEA_FREEDOM_OF_MOVEMENT','SWISS_EU_FREE_MOVEMENT_AGREEMENT')),
 visa_source_interpretation text NOT NULL DEFAULT 'EU-Freiz&uuml;gigkeit'
  CHECK(visa_source_interpretation='EU-Freiz&uuml;gigkeit'),
 primary_authority text NOT NULL DEFAULT 'BMI Oesterreich'
  CHECK(primary_authority='BMI Oesterreich'),
 primary_source_url text NOT NULL DEFAULT
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
 CHECK(primary_source_url=
 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'),
 source_edition date NOT NULL DEFAULT '2026-11-06'
 CHECK(source_edition='2026-11-06'),
 pinned_primary_sha256 text NOT NULL
 CHECK(pinned_primary_sha256='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'),
 checked_at timestamptz NOT NULL,
 method_approval_status text NOT NULL DEFAULT 'NOT_GRANTED_FOR_NEW_SUBJECT'
 CHECK(method_approval_status='NOT_GRANTED_FOR_NEW_SUBJECT'),
 initial_verified_fact boolean NOT NULL DEFAULT false CHECK(initial_verified_fact=false),
 customer_publication_allowed boolean NOT NULL DEFAULT false CHECK(customer_publication_allowed=false),
 remaining_subjects_still_unavailable boolean NOT NULL DEFAULT true
 CHECK(remaining_subjects_still_unavailable=true)
);
INSERT INTO jetnity_at_eu_ch_review_private.visa_review_v1(
 passport,priority_rank,legal_scheme,pinned_primary_sha256,checked_at)
SELECT r.citizenship_country_code,r.rank,
 CASE WHEN r.citizenship_country_code='CH' THEN 'SWISS_EU_FREE_MOVEMENT_AGREEMENT'
 ELSE 'EU_EEA_FREEDOM_OF_MOVEMENT' END,
 r.source_matrix_sha256,
 (SELECT min(observed_at) FROM official_v3_at_source_watch_private.reads_v1
  WHERE batch_id=(SELECT max(batch_id) FROM official_v3_at_source_watch_private.batches_v1))
FROM jetnity_entry_research_private.passport_visa_v1 r
WHERE r.matrix_evidence_present AND r.source_edition='2026-11-06'
 AND r.source_matrix_sha256='fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
 AND r.raw_matrix_cells->>0='EU-Freiz&uuml;gigkeit'
 AND r.raw_matrix_cells->>1='EU-Freiz&uuml;gigkeit'
 AND r.raw_matrix_cells->>2='EU-Freiz&uuml;gigkeit'
 AND r.raw_matrix_cells->>3='EU-Freiz&uuml;gigkeit';

ALTER TABLE jetnity_at_eu_ch_review_private.visa_review_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_at_eu_ch_review_private.visa_review_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only ON jetnity_at_eu_ch_review_private.visa_review_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE FUNCTION jetnity_at_eu_ch_review_private.reject_change_v1() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $deny$
BEGIN RAISE EXCEPTION 'AT_LEGAL_REVIEW_APPEND_ONLY' USING ERRCODE='P7988'; END $deny$;
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_at_eu_ch_review_private.visa_review_v1
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_eu_ch_review_private.reject_change_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_at_eu_ch_review_private.visa_review_v1
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_at_eu_ch_review_private.reject_change_v1();
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_at_eu_ch_review_private
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_at_eu_ch_review_private
 FROM PUBLIC,anon,authenticated,service_role;
DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_at_eu_ch_review_private.visa_review_v1)<>19
 OR (SELECT count(*) FROM jetnity_at_eu_ch_review_private.visa_review_v1
   WHERE legal_scheme='SWISS_EU_FREE_MOVEMENT_AGREEMENT')<>1
 OR (SELECT count(*) FROM jetnity_at_eu_ch_review_private.visa_review_v1
   WHERE legal_scheme='EU_EEA_FREEDOM_OF_MOVEMENT')<>18
 OR EXISTS(SELECT 1 FROM jetnity_at_eu_ch_review_private.visa_review_v1
   WHERE customer_publication_allowed OR initial_verified_fact
     OR method_approval_status<>'NOT_GRANTED_FOR_NEW_SUBJECT')
 OR (SELECT count(*) FROM official_v3_source_renewal_private.subjects_v1)<>1
 OR (SELECT count(*) FROM official_v3_source_renewal_private.facts_v1)<1
 OR (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class
   WHERE oid='jetnity_at_eu_ch_review_private.visa_review_v1'::regclass)
   IS DISTINCT FROM true
 OR has_schema_privilege('anon','jetnity_at_eu_ch_review_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_at_eu_ch_review_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_at_eu_ch_review_private','USAGE')
 OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'AT_19_LEGAL_REVIEW_POSTCHECK_REFUSED'
 USING ERRCODE='P7988'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;