-- One new immutable successor. Existing baselines remain historical evidence.
CREATE TABLE official_v3_guard_private.customer_information_baseline_v1 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_provider_digest text NOT NULL CHECK(predecessor_provider_digest='ROLLING_PROVIDER_SHA256'),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_rolling_digest text NOT NULL CHECK(predecessor_rolling_digest ~ '^[a-f0-9]{64}$'),
 definitions_digest text NOT NULL CHECK(definitions_digest='DEFINITIONS_SHA256'),
 history_definition_digest text NOT NULL CHECK(history_definition_digest='HISTORY_DEFINITION_SHA256'),
 history_guard_definition_digest text NOT NULL CHECK(history_guard_definition_digest='HISTORY_GUARD_DEFINITION_SHA256'),
 atomic_claim_definition_digest text NOT NULL CHECK(atomic_claim_definition_digest='ATOMIC_CLAIM_DEFINITION_SHA256'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 jobs_catalog jsonb NOT NULL,
 hrs_catalog jsonb NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.customer_information_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.customer_information_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.customer_information_baseline_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.customer_information_baseline_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.customer_information_baseline_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.customer_information_baseline_v1
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;
