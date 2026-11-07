-- Native-local package removal only. Never undo the original lifecycle/history.
BEGIN;
DO $$
DECLARE wrapper_ pg_catalog.pg_proc; original_owner_ oid;
BEGIN
 SELECT p.* INTO STRICT wrapper_ FROM pg_catalog.pg_proc p
 WHERE p.oid='official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[])'::pg_catalog.regprocedure;
 SELECT p.proowner INTO STRICT original_owner_ FROM pg_catalog.pg_proc p
 WHERE p.oid='official_original_api.read_candidate(text,text,bigint,text)'::pg_catalog.regprocedure AND p.prosecdef;
 IF wrapper_.proowner<>original_owner_ OR pg_catalog.pg_get_userbyid(original_owner_)<>CURRENT_USER OR NOT wrapper_.prosecdef
  OR NOT wrapper_.proconfig @> ARRAY['search_path=""','TimeZone=UTC']
  OR (SELECT c.relowner FROM pg_catalog.pg_class c WHERE c.oid='official_original_private.refresh_transitions_v1'::pg_catalog.regclass)<>original_owner_ THEN
  RAISE EXCEPTION 'refresh_rollback_owner' USING ERRCODE='42501';
 END IF;
END $$;
DROP FUNCTION official_original_api.refresh_version_v1(text,text,text,uuid,text,bigint,text,bytea,bytea,official_provenance_api.artifact_input_v1[],bytea[]) RESTRICT;
DROP TABLE official_original_private.refresh_transitions_v1 RESTRICT;
REVOKE USAGE ON TYPE official_provenance_api.artifact_input_v1 FROM ot_original_refresh;
REVOKE USAGE ON SCHEMA official_original_api,official_provenance_api FROM ot_original_refresh;
DROP ROLE ot_original_refresh;
COMMIT;
