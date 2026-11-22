-- DEV ONLY Native PG17 protected v5/v6 immutable baseline bootstrap/revocation proof.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='20s';
SET LOCAL lock_timeout='500ms';
DO $pre$
BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' OR current_user<>session_user
 OR to_regnamespace('jetnity_at_prod_bg1_baseline_20261122') IS NOT NULL
 THEN RAISE EXCEPTION 'DEV_BG1_BOOTSTRAP_TEST_NOT_ISOLATED'; END IF;
END $pre$;
CREATE SCHEMA jetnity_at_prod_bg1_baseline_20261122;
CREATE TABLE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5(
 singleton boolean PRIMARY KEY,
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 qualified_source_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 catalog jsonb NOT NULL
);
CREATE TABLE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6(
 singleton boolean PRIMARY KEY,
 predecessor_catalog_digest text NOT NULL,
 predecessor_baseline_digest text NOT NULL,
 required_generation bigint NOT NULL,
 proof_not_before timestamptz NOT NULL,
 reason text NOT NULL,
 catalog jsonb NOT NULL
);
CREATE FUNCTION jetnity_at_prod_bg1_baseline_20261122.at_v5_bootstrap_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $imm$
BEGIN
 IF TG_OP='UPDATE' AND OLD.catalog='{}'::jsonb AND NEW.catalog<>'{}'::jsonb
 AND NEW.predecessor_catalog_digest IS NOT DISTINCT FROM OLD.predecessor_catalog_digest
 AND NEW.predecessor_baseline_digest IS NOT DISTINCT FROM OLD.predecessor_baseline_digest
 AND NEW.qualified_source_digest IS NOT DISTINCT FROM OLD.qualified_source_digest
 AND NEW.required_generation IS NOT DISTINCT FROM OLD.required_generation
 AND NEW.proof_not_before IS NOT DISTINCT FROM OLD.proof_not_before
 AND current_user='postgres' AND session_user='postgres' THEN
  RETURN NEW;
 END IF;
 RAISE EXCEPTION 'CH_AT_PROD_V5_APPEND_ONLY_BASELINE' USING ERRCODE='P7905';
END $imm$;
CREATE FUNCTION jetnity_at_prod_bg1_baseline_20261122.at_v6_bootstrap_immutable()
 RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN
 IF TG_OP='UPDATE' AND OLD.catalog='{}'::jsonb AND NEW.catalog<>'{}'::jsonb
 AND NEW.predecessor_catalog_digest IS NOT DISTINCT FROM OLD.predecessor_catalog_digest
 AND NEW.predecessor_baseline_digest IS NOT DISTINCT FROM OLD.predecessor_baseline_digest
 AND NEW.required_generation IS NOT DISTINCT FROM OLD.required_generation
 AND NEW.proof_not_before IS NOT DISTINCT FROM OLD.proof_not_before
 AND NEW.reason IS NOT DISTINCT FROM OLD.reason
 AND current_user='postgres' AND session_user='postgres' THEN RETURN NEW;
 END IF;
 RAISE EXCEPTION 'CH_AT_PROD_V6_APPEND_ONLY_ROLLBACK_BASELINE' USING ERRCODE='P7905';
END $immutable$;
CREATE TRIGGER at_v5_immutable BEFORE UPDATE OR DELETE ON jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_prod_bg1_baseline_20261122.at_v5_bootstrap_immutable();
CREATE TRIGGER at_v6_immutable BEFORE UPDATE OR DELETE ON jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6
 FOR EACH ROW EXECUTE FUNCTION jetnity_at_prod_bg1_baseline_20261122.at_v6_bootstrap_immutable();
INSERT INTO jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5 VALUES
 (true,repeat('a',64),repeat('b',64),repeat('c',64),1001,clock_timestamp()-interval '5 minutes','{}'::jsonb);
UPDATE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5 SET catalog=jsonb_build_object('revision','prod_v1_ch_v2') WHERE singleton;
INSERT INTO jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6
 SELECT true,
 encode(sha256(convert_to(v.catalog::text,'UTF8')),'hex'),
 encode(sha256(convert_to((to_jsonb(v)||jsonb_build_object('proof_not_before',extract(epoch FROM v.proof_not_before)))::text,'UTF8')),'hex'),
 v.required_generation+1,clock_timestamp(),
 'CH_AT_V2_OWNER_GO_ROLLBACK_DEFAULT_CLOSED','{}'::jsonb
 FROM jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5 v WHERE singleton;
UPDATE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6 SET catalog=jsonb_build_object('revision','rollback_v6') WHERE singleton;
DO $negative$
DECLARE denied integer:=0;
BEGIN
 BEGIN
  UPDATE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5 SET catalog=jsonb_build_object('tampered',true) WHERE singleton;
 EXCEPTION WHEN SQLSTATE 'P7905' THEN denied:=denied+1; END;
 BEGIN
  UPDATE jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6 SET catalog=jsonb_build_object('tampered',true) WHERE singleton;
 EXCEPTION WHEN SQLSTATE 'P7905' THEN denied:=denied+1; END;
 BEGIN
  DELETE FROM jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5 WHERE singleton;
 EXCEPTION WHEN SQLSTATE 'P7905' THEN denied:=denied+1; END;
 BEGIN
  DELETE FROM jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6 WHERE singleton;
 EXCEPTION WHEN SQLSTATE 'P7905' THEN denied:=denied+1; END;
 IF denied<>4 OR
 (SELECT predecessor_catalog_digest FROM jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_rollback_v6) IS DISTINCT FROM
 (SELECT encode(sha256(convert_to(catalog::text,'UTF8')),'hex') FROM jetnity_at_prod_bg1_baseline_20261122.bg1_prod_ch_at_qualified_v5)
 THEN RAISE EXCEPTION 'DEV_BG1_V5_V6_IMMUTABLE_HISTORY_TEST_FAILED'; END IF;
END $negative$;
SELECT jsonb_build_object('verdict','DEV_PG17_V5_V6_ONCE_BOOTSTRAP_AND_IMMUTABILITY_PASS',
'one_bootstrap_each',true,'four_negative_tamper_trials_blocked',true,
'v6_predecessor_digest_exact',true,'production_change',false,'transaction_end','ROLLBACK') AS proof;
ROLLBACK;
