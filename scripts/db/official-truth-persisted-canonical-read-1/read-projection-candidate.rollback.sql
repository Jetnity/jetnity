-- Local-only rollback of this exact new candidate. No CASCADE or old objects.
BEGIN;
REVOKE EXECUTE ON FUNCTION official_original_api.read_projection_candidate(text,text,bigint,text) FROM ot_original_reader;
DROP FUNCTION official_original_api.read_projection_candidate(text,text,bigint,text) RESTRICT;
COMMIT;
