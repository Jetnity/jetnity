-- UNAPPLIED local-only candidate under TASK V1 + TL R2. No hosted authority.
-- Install only in the newly owned disposable native proof cluster. This file
-- is outside every canonical migration/apply path; no existing object changes.
BEGIN;
DO $$
DECLARE original_owner name; original_definer boolean;
BEGIN
 SELECT pg_catalog.pg_get_userbyid(p.proowner),p.prosecdef INTO STRICT original_owner,original_definer
 FROM pg_catalog.pg_proc p WHERE p.oid='official_original_api.read_candidate(text,text,bigint,text)'::pg_catalog.regprocedure;
 IF NOT original_definer OR original_owner<>CURRENT_USER THEN
  RAISE EXCEPTION 'projection_install_owner_mismatch' USING ERRCODE='42501';
 END IF;
 IF pg_catalog.to_regprocedure('official_original_api.read_projection_candidate(text,text,bigint,text)') IS NOT NULL THEN
  RAISE EXCEPTION 'projection_candidate_already_exists' USING ERRCODE='42723';
 END IF;
END $$;

CREATE FUNCTION official_original_api.read_projection_candidate(fingerprint_ text,key_ text,sequence_ bigint,hash_ text)
RETURNS TABLE(ordinal integer,original_pin uuid,evidence_version text,raw_digest text,original_bytes bytea,
 expires_at timestamptz,freshness_until timestamptz,lifecycle_valid_until timestamptz,observed_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE row_ record; original_ official_original_private.originals; head_ official_original_private.head; count_ integer:=0;
BEGIN
 -- The unchanged reader owns every closure/review/cipher/lifecycle check and
 -- its READ COMMITTED SHARE lock. Do not replace it with a table-only path.
 FOR row_ IN SELECT c.* FROM official_original_api.read_candidate(fingerprint_,key_,sequence_,hash_) c ORDER BY c.ordinal LOOP
  IF count_>=8 OR row_.ordinal<>count_ THEN RAISE EXCEPTION 'projection_row_order' USING ERRCODE='55000'; END IF;
  SELECT o.* INTO STRICT original_ FROM official_original_private.originals o WHERE o.original_pin=row_.original_pin;
  SELECT h.* INTO STRICT head_ FROM official_original_private.head h WHERE h.singleton;
  IF original_.evidence_version IS DISTINCT FROM row_.evidence_version OR original_.raw_digest IS DISTINCT FROM row_.raw_digest
   OR head_.sequence IS DISTINCT FROM sequence_ OR head_.event_hash IS DISTINCT FROM hash_ THEN
   RAISE EXCEPTION 'projection_bound_identity' USING ERRCODE='55000';
  END IF;
  observed_at:=pg_catalog.clock_timestamp();
  expires_at:=original_.expires_at; freshness_until:=original_.freshness_until;
  lifecycle_valid_until:=head_.checked_at+interval '60 seconds';
  IF expires_at IS NULL OR freshness_until IS NULL OR lifecycle_valid_until IS NULL
   OR NOT pg_catalog.isfinite(expires_at) OR NOT pg_catalog.isfinite(freshness_until)
   OR NOT pg_catalog.isfinite(lifecycle_valid_until) OR NOT pg_catalog.isfinite(observed_at)
   OR observed_at>=expires_at OR observed_at>=freshness_until OR observed_at>=lifecycle_valid_until
   OR observed_at<original_.captured_at OR observed_at<head_.checked_at THEN
   RAISE EXCEPTION 'projection_bound_unavailable' USING ERRCODE='55000';
  END IF;
  ordinal:=row_.ordinal; original_pin:=row_.original_pin; evidence_version:=row_.evidence_version;
  raw_digest:=row_.raw_digest; original_bytes:=row_.original_bytes;
  count_:=count_+1; RETURN NEXT;
 END LOOP;
 IF count_<1 THEN RAISE EXCEPTION 'projection_rows_missing' USING ERRCODE='55000'; END IF;
END $$;

REVOKE ALL ON FUNCTION official_original_api.read_projection_candidate(text,text,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION official_original_api.read_projection_candidate(text,text,bigint,text) TO ot_original_reader;
COMMIT;
