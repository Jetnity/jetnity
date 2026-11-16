-- Part 1/4. This file is not standalone SQL: the owner-only assembler wraps
-- all four parts and the EXACT existing saved_offers migration in ONE transaction.
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL idle_in_transaction_session_timeout='30s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
DO $saved_preflight$
DECLARE old_catalog jsonb;
BEGIN
  IF session_user <> 'postgres' OR current_user <> session_user
    OR current_database() <> 'postgres'
    OR current_setting('server_version_num')::integer/10000 <> 17
    OR current_setting('transaction_isolation') <> 'read committed'
    OR current_setting('jetnity.saved_offers_target',true) IS DISTINCT FROM
      'production:qscbgcdmivbbnzrcyegn:SAVED-OFFERS-BG1-1'
    OR to_regclass('public.saved_offers') IS NOT NULL
    OR to_regclass('official_v3_guard_private.saved_offers_baseline_v1') IS NOT NULL
    OR (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20261113173644')<>0 THEN
    RAISE EXCEPTION 'saved_offers exact new production predecessor required' USING ERRCODE='P7911';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771101,1)
    OR NOT pg_try_advisory_xact_lock(771102,1)
    OR NOT pg_try_advisory_xact_lock(771103,1)
    OR NOT pg_try_advisory_xact_lock(771104,1)
    OR NOT pg_try_advisory_xact_lock(771105,1)
    OR NOT pg_try_advisory_xact_lock(771106,1)
    OR NOT pg_try_advisory_xact_lock(771107,1) THEN
    RAISE EXCEPTION 'saved_offers competing protected transition' USING ERRCODE='P7911';
  END IF;
  -- The public Production branch must still have the exact predecessor
  -- definitions reviewed in this proposal. A ref or browser acknowledgement
  -- alone is never identity/TLS evidence.
  IF EXISTS(SELECT 1 FROM (VALUES
    ('official_v3_guard_private.assert_catalog_v1()', '77584da7bc374978c7807a6e26bee5a6965feb300ba98e93ecdde2f36cecbd1d'),
    ('official_v3_guard_private.catalog_status_v1()', 'c23417ecf2a50291c347579546316c53ab4b1618b17c92a211022d63d41c6beb'),
    ('official_v3_guard_private.require_open_v1()', '50260de59f3fb8b286ceca46d572ddae5fd721897daf496dc5d4fc70a999b388'),
    ('public.official_v3_guard_alarm_status_v1()', 'e55b6fa3a7a87ecbf88572294ea1a94c3485b0446f25e953c794e98024a34e3b')
  ) expected(signature,body_digest)
  WHERE to_regprocedure(expected.signature) IS NULL OR
    (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex')
     FROM pg_proc WHERE oid=to_regprocedure(expected.signature)) IS DISTINCT FROM expected.body_digest) THEN
    RAISE EXCEPTION 'saved_offers predecessor code fingerprint changed' USING ERRCODE='P7911';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM
    jsonb_build_object('schema',1,'status','current') THEN
    RAISE EXCEPTION 'saved_offers fresh BG1 proof required' USING ERRCODE='P7911';
  END IF;
  SELECT catalog INTO STRICT old_catalog FROM official_v3_guard_private.rolling_quota_baseline_v1 WHERE singleton;
  IF old_catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1() THEN
    RAISE EXCEPTION 'saved_offers exact old catalog mismatch' USING ERRCODE='P7911';
  END IF;
  -- A live scheduler/visitor write must be quiet and cannot race the transition.
  IF EXISTS(SELECT 1 FROM pg_stat_activity a JOIN pg_roles r ON r.oid=a.usesysid
    WHERE a.pid<>pg_backend_pid() AND
      (r.rolname IN ('ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')
       OR r.rolname LIKE 'ot_v3_%transport_login')) THEN
    RAISE EXCEPTION 'saved_offers protected runtime quiescence required' USING ERRCODE='P7911';
  END IF;
END $saved_preflight$;

-- Safe from concurrent background state writes until transaction ends.
SELECT singleton FROM official_v3_guard_private.state_v1 WHERE singleton FOR UPDATE;
CREATE TEMP TABLE bg1_saved_before(kind text PRIMARY KEY, value jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO bg1_saved_before VALUES
  ('catalog',official_v3_guard_private.catalog_status_v1()),
  ('state',(SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton)),
  ('baselines',(SELECT jsonb_agg(to_jsonb(b) ORDER BY component) FROM official_v3_guard_private.baselines_v1 b)),
  ('policy',(SELECT to_jsonb(p) FROM official_v3_jobs_private.rolling_policy_v2 p));
