-- Production-specific READ-ONLY predecessor pin for the Owner-gated
-- Austria Official Truth release. This is a verification gate, NOT a
-- migration, method approval, source import, grant or visitor activation.
-- Execute via the already-identified Supabase Production project only.
-- The backend must verify project_ref=qscbgcdmivbbnzrcyegn independently;
-- Postgres current_database()='postgres' alone cannot prove project identity.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='2s';
DO $prod_predecessor$
DECLARE expected record;
BEGIN
  IF current_database()<>'postgres' OR current_user<>'postgres'
    OR session_user<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR public.official_v3_guard_alarm_status_v1()->>'status'<>'current'
    OR (SELECT count(*) FROM cron.job
        WHERE jobname='jetnity-official-truth-production-guard-v1'
          AND username='postgres' AND active)<>1
    OR to_regnamespace('official_v3_at_private') IS NOT NULL
    OR to_regnamespace('official_v3_at_source_watch_private') IS NOT NULL
    OR to_regnamespace('official_v3_source_renewal_private') IS NOT NULL
    OR to_regprocedure('public.jetnity_source_bound_at_visa_v1(text)') IS NOT NULL
    OR EXISTS(SELECT 1 FROM official_v3_method_private.heads_v1
       WHERE method_id='jetnity-destination-primary-at-visa')
    OR EXISTS(SELECT 1 FROM official_v3_method_private.revisions_v1
       WHERE method_id='jetnity-destination-primary-at-visa')
    OR (SELECT count(*) FROM official_v3_guard_private.saved_offers_baseline_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.weather_quota_baseline_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.admin_runtime_baseline_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.rolling_quota_baseline_v1)<>1
    OR (SELECT count(*) FROM official_v3_guard_private.status_baseline_v1)<>1
  THEN RAISE EXCEPTION 'AT_PRODUCTION_EXACT_PREDECESSOR_REFUSED'
    USING ERRCODE='P7993'; END IF;

  -- The actual Production baseline uses saved_offers + weather_quota.
  -- Never reuse the different Dev BG1 successor or its source fingerprints.
  FOR expected IN SELECT * FROM (VALUES
    ('official_v3_guard_private.assert_catalog_v1()',
     '0148d8973e0a47e5cfea3906990e19b4075fd18856dbb012e22f426b69587903'),
    ('official_v3_guard_private.catalog_status_v1()',
     'edc393042cba779c8a991b228128a46266be6bc41c585375077387cb3f855f81'),
    ('official_v3_guard_private.require_open_v1()',
     'db394f5cc4380abc49ce6b5f74308ec9d045101a6ec010391120795050eef0b4'),
    ('public.official_v3_guard_alarm_status_v1()',
     '917a0679562d7b22f22e0c81968b09f3ebc75fbd6ce5a974be41fd75fbcd9923'),
    ('official_v3_method_private.require_current_locked_v1(text,integer,text,text,integer)',
     '7e98f2a32a2388efde95d729d425581bf9443e4397eb8311d82e6a46eb88ca8c')
  ) AS v(signature,source_sha256) LOOP
    IF to_regprocedure(expected.signature) IS NULL
      OR (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex')
          FROM pg_proc WHERE oid=to_regprocedure(expected.signature))
         IS DISTINCT FROM expected.source_sha256
    THEN RAISE EXCEPTION 'AT_PRODUCTION_PROTECTED_FUNCTION_DRIFT'
      USING ERRCODE='P7993'; END IF;
  END LOOP;

  -- No historical BG1 chain is replaced. Original guards independently
  -- verify their complete recorded catalog, RLS/ACL and credentials.
  PERFORM official_v3_guard_private.assert_catalog_v1();
END $prod_predecessor$;
SELECT jsonb_build_object(
  'contract','AT_PRODUCTION_BG1_SAVED_OFFERS_WEATHER_V1',
  'state','EXACT_PREDECESSOR_VERIFIED_NOT_INSTALLED',
  'ownerMethodApproved',false,
  'allowApply',false,
  'next','construct independently reviewed additive Production PG17 successor'
) AS gate;
ROLLBACK;
