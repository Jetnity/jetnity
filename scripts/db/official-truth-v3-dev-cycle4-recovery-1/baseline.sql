CREATE TABLE official_v3_guard_private.retired_cycle4_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK(attempt_key='CYCLE4_ATTEMPT'),
  job_key text NOT NULL CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
  claim_operation_id text NOT NULL UNIQUE CHECK(claim_operation_id='CYCLE4_CLAIM'),
  intake_operation_id text NOT NULL UNIQUE CHECK(intake_operation_id='CYCLE4_INTAKE'),
  owner_operation_id text NOT NULL UNIQUE CHECK(owner_operation_id ~ '^op3_[a-f0-9]{32}$'),
  before_state jsonb NOT NULL CHECK(octet_length(before_state::text)<=131072 AND before_state->>'kind'='ch_de_cycle4_unknown'),
  retired_at timestamptz NOT NULL CHECK(isfinite(retired_at))
);
CREATE TABLE official_v3_guard_private.cycle4_recovery_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  predecessor_provider_digest text NOT NULL CHECK(predecessor_provider_digest='CYCLE4_PROVIDER_SHA256'),
  predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_refresh_digest text NOT NULL CHECK(predecessor_refresh_digest ~ '^[a-f0-9]{64}$'),
  original_evidence_digest text NOT NULL CHECK(original_evidence_digest='ORIGINAL_EVIDENCE_SHA256'),
  required_generation bigint NOT NULL CHECK(required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
  jobs_catalog jsonb NOT NULL,
  hrs_catalog jsonb NOT NULL,
  catalog jsonb NOT NULL
);
DO $cycle4_tables$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['retired_cycle4_attempts_v1','cycle4_recovery_baseline_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING(true) WITH CHECK(true)',table_name);
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.%I FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',table_name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner',table_name);
  END LOOP;
END $cycle4_tables$;
