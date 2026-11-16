-- One additive immutable successor; no historical baseline is rewritten.
CREATE TABLE official_v3_guard_private.admin_runtime_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  predecessor_provider_digest text NOT NULL CHECK (predecessor_provider_digest = 'PREDECESSOR_SHA256'),
  predecessor_catalog_digest text NOT NULL CHECK (predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_attempt2_digest text NOT NULL CHECK (predecessor_attempt2_digest ~ '^[a-f0-9]{64}$'),
  definition_digest text NOT NULL CHECK (definition_digest = 'DEFINITION_SHA256'),
  required_generation bigint NOT NULL CHECK (required_generation > 0),
  proof_not_before timestamptz NOT NULL CHECK (isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.admin_runtime_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.admin_runtime_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.admin_runtime_baseline_v1 TO postgres USING (true) WITH CHECK (true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.admin_runtime_baseline_v1
  FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.admin_runtime_baseline_v1
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON TABLE official_v3_guard_private.admin_runtime_baseline_v1
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

-- Same first lock as BG1 and its existing guarded writers. The lock survives
-- function return until transaction end; freshness is checked again on return.
CREATE FUNCTION official_v3_guard_private.admin_runtime_guard_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF current_setting('transaction_isolation') IS DISTINCT FROM 'read committed' THEN
    RAISE EXCEPTION 'admin runtime transaction isolation unavailable' USING ERRCODE='P7902';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $$;
REVOKE ALL ON FUNCTION official_v3_guard_private.admin_runtime_guard_v1()
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
