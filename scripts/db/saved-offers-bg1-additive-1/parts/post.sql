-- Part 4/4: every check still runs before the single COMMIT.
DO $saved_post$
DECLARE saved official_v3_guard_private.saved_offers_baseline_v1%ROWTYPE;
BEGIN
  SELECT * INTO STRICT saved FROM official_v3_guard_private.saved_offers_baseline_v1 WHERE singleton;
  IF (SELECT count(*) FROM supabase_migrations.schema_migrations
      WHERE version='20261113173644' AND name='saved_offers')<>1
    OR saved.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()
    OR (SELECT value FROM pg_temp.bg1_saved_before WHERE kind='baselines') IS DISTINCT FROM
      (SELECT jsonb_agg(to_jsonb(b) ORDER BY component) FROM official_v3_guard_private.baselines_v1 b)
    OR (SELECT value FROM pg_temp.bg1_saved_before WHERE kind='state') IS DISTINCT FROM
      (SELECT to_jsonb(s) FROM official_v3_guard_private.state_v1 s WHERE singleton)
    OR (SELECT value FROM pg_temp.bg1_saved_before WHERE kind='policy') IS DISTINCT FROM
      (SELECT to_jsonb(p) FROM official_v3_jobs_private.rolling_policy_v2 p)
    OR has_schema_privilege('anon','official_v3_guard_private','USAGE')
    OR has_table_privilege('anon','public.saved_offers','SELECT')
    OR has_table_privilege('anon','public.saved_offers','INSERT')
    OR has_table_privilege('anon','public.saved_offers','UPDATE')
    OR has_table_privilege('anon','public.saved_offers','DELETE') THEN
    RAISE EXCEPTION 'saved_offers post-install guard or ACL mismatch' USING ERRCODE='P7911';
  END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  -- The new required_generation intentionally makes the public service
  -- unavailable until the NEXT real completed BG1 full-proof run.
  IF public.official_v3_guard_alarm_status_v1() IS DISTINCT FROM
     jsonb_build_object('schema',1,'status','unavailable') THEN
    RAISE EXCEPTION 'saved_offers unproved successor must fail closed' USING ERRCODE='P7911';
  END IF;
END $saved_post$;
