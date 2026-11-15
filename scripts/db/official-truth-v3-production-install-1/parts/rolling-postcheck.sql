DO $production_rolling_postcheck$
DECLARE saved record; row_count bigint; row_digest text; table_name text;
BEGIN
  FOR saved IN SELECT kind,value FROM pg_temp.rolling_before WHERE kind LIKE 'table:%' LOOP
    table_name:=substring(saved.kind FROM 7);
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    IF saved.value IS DISTINCT FROM jsonb_build_object('count',row_count,'digest',row_digest) THEN
      RAISE EXCEPTION 'production rolling changed predecessor rows: %',table_name USING ERRCODE='P7911'; END IF;
  END LOOP;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF official_v3_jobs_private.rolling_usage_v2('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513')->>'model'<>'rolling_24h_v2'
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.rolling_policy_v2 WHERE anchor_starts<>0 OR anchor_operations<>0)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1)
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1) THEN
    RAISE EXCEPTION 'production quota must begin empty without an invented audit or job' USING ERRCODE='P7911'; END IF;
END $production_rolling_postcheck$;
