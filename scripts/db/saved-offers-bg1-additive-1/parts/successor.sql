-- Part 3/4: only after the exact 25-key delta has passed.
-- The immutable original BG1, status and rolling baselines remain untouched.
CREATE TABLE official_v3_guard_private.saved_offers_baseline_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  migration_blob text NOT NULL CHECK(migration_blob='667766f5455ff2460f4eb56f04c7a62c84ca9e05'),
  predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
  predecessor_admin_digest text NOT NULL CHECK(predecessor_admin_digest ~ '^[a-f0-9]{64}$'),
  approved_delta_digest text NOT NULL CHECK(approved_delta_digest ~ '^[a-f0-9]{64}$'),
  required_generation bigint NOT NULL CHECK(required_generation>0),
  proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
  catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.saved_offers_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.saved_offers_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.saved_offers_baseline_v1
  TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE
  ON official_v3_guard_private.saved_offers_baseline_v1 FOR EACH ROW
  EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE
  ON official_v3_guard_private.saved_offers_baseline_v1 FOR EACH STATEMENT
  EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.saved_offers_baseline_v1
  FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,
    ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

-- Preserve the complete installed Admin guard, extending its catalogue and proof requirements.
 /* POST_ADMIN_VALIDATORS */

-- Migration history is recorded with the canonical original statement bytes,
-- not via a broad db push that could apply other pending migrations.
INSERT INTO supabase_migrations.schema_migrations(version,name,statements,created_by)
VALUES ('20261113173644','saved_offers',ARRAY[
  /* INJECT_CANONICAL_MIGRATION_STATEMENT */
]::text[],current_user);

INSERT INTO official_v3_guard_private.saved_offers_baseline_v1 (
 singleton,migration_blob,predecessor_catalog_digest,predecessor_admin_digest,
 approved_delta_digest,required_generation,proof_not_before,catalog)
SELECT true,'667766f5455ff2460f4eb56f04c7a62c84ca9e05',
 encode(sha256(convert_to(admin.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(admin)||jsonb_build_object('proof_not_before',
   extract(epoch FROM admin.proof_not_before)))::text,'UTF8')),'hex'),
 encode(sha256(convert_to((SELECT value FROM pg_temp.bg1_saved_before
   WHERE kind='authorized_delta_catalog')::text,'UTF8')),'hex'),
 state.generation+1,clock_timestamp(),official_v3_guard_private.catalog_status_v1()
FROM official_v3_guard_private.admin_runtime_baseline_v1 admin
CROSS JOIN official_v3_guard_private.state_v1 state
WHERE admin.singleton AND state.singleton;
