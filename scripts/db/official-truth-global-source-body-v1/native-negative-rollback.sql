-- Native Dev PG17 negative mutation/security proof. Read-only final state.
-- Exact source body evidence must not be modified, removed, truncated or
-- accepted by anybody. All rejected mutations are caught; full ROLLBACK.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='3s';

DO $proof$
DECLARE update_blocked boolean:=false;
 delete_blocked boolean:=false;
 truncate_blocked boolean:=false;
BEGIN
 IF public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
 OR (SELECT count(*) FROM jetnity_source_body_private.changed_originals_v1)<1
 OR has_schema_privilege('anon','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('authenticated','jetnity_source_body_private','USAGE')
 OR has_schema_privilege('service_role','jetnity_source_body_private','USAGE')
 OR has_table_privilege('anon','jetnity_source_body_private.changed_originals_v1','SELECT')
 OR has_table_privilege('authenticated','jetnity_source_body_private.changed_originals_v1','SELECT')
 OR has_table_privilege('service_role','jetnity_source_body_private.changed_originals_v1','SELECT')
 THEN RAISE EXCEPTION 'SOURCE_BODY_NEGATIVE_PRECONDITION_MISSING'; END IF;

 BEGIN
  UPDATE jetnity_source_body_private.changed_originals_v1
   SET raw_sha=raw_sha
   WHERE (source_family,destination_code,source_key,batch_id)=
   (SELECT source_family,destination_code,source_key,batch_id
    FROM jetnity_source_body_private.changed_originals_v1 ORDER BY captured_at LIMIT 1);
 EXCEPTION WHEN SQLSTATE 'P7988' THEN update_blocked:=true;
 END;

 BEGIN
  DELETE FROM jetnity_source_body_private.changed_originals_v1
   WHERE (source_family,destination_code,source_key,batch_id)=
   (SELECT source_family,destination_code,source_key,batch_id
    FROM jetnity_source_body_private.changed_originals_v1 ORDER BY captured_at LIMIT 1);
 EXCEPTION WHEN SQLSTATE 'P7988' THEN delete_blocked:=true;
 END;

 BEGIN
  TRUNCATE jetnity_source_body_private.changed_originals_v1;
 EXCEPTION WHEN SQLSTATE 'P7988' THEN truncate_blocked:=true;
 END;

 IF NOT update_blocked OR NOT delete_blocked OR NOT truncate_blocked
 OR (SELECT count(*) FROM pg_trigger t
    WHERE t.tgrelid='jetnity_source_body_private.changed_originals_v1'::regclass
    AND NOT t.tgisinternal)<>2
 OR (SELECT count(*) FROM jetnity_global_research_private.cases_v1
     WHERE publication_allowed OR legal_rule_qualified OR accepted_fact_count<>0)<>0
 THEN RAISE EXCEPTION 'SOURCE_BODY_MUTATION_NEGATIVE_PROOF_FAILED'; END IF;
 PERFORM official_v3_guard_private.assert_catalog_v1();
END $proof$;

SELECT (SELECT count(*) FROM jetnity_source_body_private.changed_originals_v1) AS preserved_rows,
       (SELECT count(*) FROM jetnity_source_body_private.changed_originals_v1
        WHERE primary_rule_qualified OR legal_fact_approved OR public_publish_allowed) AS approved_rules,
       public.official_v3_guard_alarm_status_v1()->>'status' AS bg1;
ROLLBACK;
