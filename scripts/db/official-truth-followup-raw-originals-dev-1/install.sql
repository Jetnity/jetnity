-- DEV only: preserve the FOUR actual full official HTML bytes from one
-- independently observed pg_net GET batch. These are archived SOURCE RESEARCH
-- snapshots, not legal interpretations, accepted facts or source monitor
-- approvals. No raw source bodies are committed to GitHub.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL jetnity.followup_originals_target='dev:yfvbxvijcorffwxbxahl:ORIGINALS-4-V1';
DO $preflight$
BEGIN
 IF session_user<>'postgres' OR current_user<>session_user
   OR current_database()<>'postgres'
   OR current_setting('server_version_num')::integer/10000<>17
   OR current_setting('jetnity.followup_originals_target',true)
      IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:ORIGINALS-4-V1'
   OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
   OR to_regclass('jetnity_followup_source_monitor_private.source_originals_v1') IS NOT NULL
   OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.sources_v3)<>4
   OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.items_v3)<>4
   OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3)<>4
   OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3
       WHERE destination_code='FR' AND status='invalid_source_body')<>1
   OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3
       WHERE destination_code IN('IT','ES','PT') AND status='unqualified_snapshot')<>3
   OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1)<>200
   OR (SELECT count(*) FROM jetnity_followup_primary_private.passport_scope_v1
       WHERE legal_fact_accepted OR can_publish)<>0
   OR NOT pg_try_advisory_xact_lock(771110,9)
 THEN RAISE EXCEPTION 'FOLLOWUP_ORIGINALS_DEV_PREDECESSOR_REFUSED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $preflight$;

CREATE TABLE jetnity_followup_source_monitor_private.source_originals_v1(
 destination_code text NOT NULL CHECK(destination_code IN('IT','FR','ES','PT')),
 snapshot_version integer NOT NULL DEFAULT 1 CHECK(snapshot_version=1),
 source_role text NOT NULL CHECK(source_role IN
  ('nationality_visa_checker','european_entry','european_movement_law','general_entry')),
 official_url text NOT NULL CHECK(official_url LIKE 'https://%'),
 observed_at timestamptz NOT NULL,
 original_html bytea NOT NULL,
 raw_bytes integer GENERATED ALWAYS AS (octet_length(original_html)) STORED,
 raw_sha256 text GENERATED ALWAYS AS (encode(sha256(original_html),'hex')) STORED,
 source_edition_date date,
 legal_effective_until timestamptz CHECK(legal_effective_until IS NULL),
 subject_passport_count integer NOT NULL DEFAULT 50 CHECK(subject_passport_count=50),
 research_only boolean NOT NULL DEFAULT true CHECK(research_only=true),
 source_qualified boolean NOT NULL DEFAULT false CHECK(source_qualified=false),
 positive_legal_facts integer NOT NULL DEFAULT 0 CHECK(positive_legal_facts=0),
 publication_allowed boolean NOT NULL DEFAULT false CHECK(publication_allowed=false),
 PRIMARY KEY(destination_code,snapshot_version),
 CHECK(octet_length(original_html) BETWEEN 1 AND 1048576)
);
ALTER TABLE jetnity_followup_source_monitor_private.source_originals_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_followup_source_monitor_private.source_originals_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY postgres_only
 ON jetnity_followup_source_monitor_private.source_originals_v1
 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE
 ON jetnity_followup_source_monitor_private.source_originals_v1
 FOR EACH ROW EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE
 ON jetnity_followup_source_monitor_private.source_originals_v1
 FOR EACH STATEMENT EXECUTE FUNCTION jetnity_followup_source_monitor_private.no_mutation_v1();
REVOKE ALL ON TABLE jetnity_followup_source_monitor_private.source_originals_v1
 FROM PUBLIC,anon,authenticated,service_role;

-- Expected RAW SHA/lengths were independently read from real Dev GET
-- responses, not derived from research flags or a header-only HTTP 200.
-- The official content/body/marker/challenge checks must ALL pass. This
-- seed does not correct/overwrite the original FR false-positive V3 receipt.
WITH expected(country,sha,bytes,scope) AS (
 VALUES
 ('ES','6e581c8baba9c45de770eacccebb8ee57a4eb4d5b546ab7c8835d7e217471c55',144882,'european_movement_law'),
 ('FR','a49a6e0bb426a676652c2cf94f04813ea0b0cf3be19089cf240fdf07b0ef137d',93694,'european_entry'),
 ('IT','22d6b85b99b02c3695f223a16cdbdcc2cfdebdb0c04c7e7abfb242f421366af4',116057,'nationality_visa_checker'),
 ('PT','d63f73695e07ae32e0f3ec434cdc31983864ffc705293172d92d97d3f473d4d5',37217,'general_entry')
)
INSERT INTO jetnity_followup_source_monitor_private.source_originals_v1
(destination_code,source_role,official_url,observed_at,original_html)
SELECT e.country,e.scope,s.official_url,r.created,convert_to(r.content,'UTF8')
FROM expected e
JOIN jetnity_followup_source_monitor_private.sources_v3 s
 ON s.destination_code=e.country
JOIN jetnity_followup_source_monitor_private.items_v3 i
 ON i.destination_code=e.country
JOIN net._http_response r ON r.id=i.request_id
WHERE r.status_code=200 AND r.timed_out IS NOT TRUE AND r.error_msg IS NULL
 AND r.content IS NOT NULL AND r.content_type ~* '^text/html([; ]|$)'
 AND octet_length(convert_to(r.content,'UTF8'))=e.bytes
 AND encode(sha256(convert_to(r.content,'UTF8')),'hex')=e.sha
 AND position(lower(s.content_marker) IN lower(r.content))>0
 AND position('radware bot manager captcha' IN lower(r.content))=0
 AND position('accesso negato' IN lower(r.content))=0
 AND position('access denied' IN lower(r.content))=0;

DO $post$
BEGIN
 IF (SELECT count(*) FROM jetnity_followup_source_monitor_private.source_originals_v1)<>4
  OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.source_originals_v1
    WHERE original_html IS NULL OR raw_bytes<>octet_length(original_html)
      OR raw_sha256<>encode(sha256(original_html),'hex'))<>0
  OR EXISTS(SELECT 1 FROM jetnity_followup_source_monitor_private.source_originals_v1
    WHERE positive_legal_facts<>0 OR publication_allowed OR source_qualified
     OR research_only IS NOT TRUE OR legal_effective_until IS NOT NULL)
  OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v3)<>4
  OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v1)<>4
  OR (SELECT count(*) FROM jetnity_followup_source_monitor_private.observations_v2)<>4
  OR EXISTS(SELECT 1 FROM jetnity_followup_primary_private.passport_scope_v1
    WHERE legal_fact_accepted OR can_publish)
  OR (SELECT relrowsecurity AND relforcerowsecurity
    FROM pg_class WHERE oid='jetnity_followup_source_monitor_private.source_originals_v1'::regclass)
     IS DISTINCT FROM true
  OR has_table_privilege('anon','jetnity_followup_source_monitor_private.source_originals_v1','SELECT')
  OR has_table_privilege('authenticated','jetnity_followup_source_monitor_private.source_originals_v1','SELECT')
  OR has_table_privilege('service_role','jetnity_followup_source_monitor_private.source_originals_v1','SELECT')
  OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 THEN RAISE EXCEPTION 'FOLLOWUP_ORIGINALS_POSTCHECK_REFUSED' USING ERRCODE='P7999'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $post$;
COMMIT;
