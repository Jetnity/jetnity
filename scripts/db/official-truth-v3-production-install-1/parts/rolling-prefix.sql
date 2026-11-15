SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
CREATE TEMP TABLE rolling_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $production_rolling_predecessor$
DECLARE expected record; actual record; before_catalog jsonb; table_name text; row_count bigint; row_digest text;
BEGIN
  IF session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('jetnity.rolling_quota_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:ROLLING-QUOTA1'
    OR current_setting('server_version_num')::integer/10000<>17 OR current_setting('transaction_isolation')<>'read committed'
    OR to_regclass('official_v3_guard_private.rolling_quota_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_jobs_private.rolling_policy_v2') IS NOT NULL
    OR to_regclass('official_v3_guard_private.recovery_baseline_v1') IS NOT NULL
    OR to_regclass('official_v3_guard_private.gap_recovery_baseline_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'production rolling exact fresh predecessor required' USING ERRCODE='P7911'; END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  FOR expected IN SELECT * FROM (VALUES /* PREDECESSOR_FUNCTIONS */) f(signature,body_hash) LOOP
    SELECT * INTO actual FROM pg_proc WHERE oid=to_regprocedure(expected.signature);
    IF NOT FOUND OR encode(sha256(convert_to(actual.prosrc,'UTF8')),'hex') IS DISTINCT FROM expected.body_hash THEN
      RAISE EXCEPTION 'production rolling predecessor definition mismatch' USING ERRCODE='P7911'; END IF;
  END LOOP;
  SELECT (/* STATUS_CATALOG_QUERY */) INTO before_catalog;
  IF before_catalog IS DISTINCT FROM (SELECT catalog FROM official_v3_guard_private.status_baseline_v1 WHERE singleton) THEN
    RAISE EXCEPTION 'production rolling predecessor catalog mismatch' USING ERRCODE='P7911'; END IF;
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF EXISTS(SELECT 1 FROM official_v3_method_private.operations_v1)
    OR EXISTS(SELECT 1 FROM official_v3_intake_private.operations_v1)
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.subjects_v1)
    OR EXISTS(SELECT 1 FROM official_v3_result_private.operations_v1)
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1)
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1)
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1)
    OR EXISTS(SELECT 1 FROM official_v3_guard_private.state_v1 WHERE generation<>0 OR incident_generation<>0 OR resumed_generation<>0) THEN
    RAISE EXCEPTION 'production rolling installation may not adopt used history' USING ERRCODE='P7911'; END IF;
  INSERT INTO pg_temp.rolling_before VALUES('catalog',before_catalog),
    ('memberships',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.oid) FROM pg_auth_members m),'[]'::jsonb)),
    ('schema_acl',(SELECT jsonb_build_object('owner',nspowner,'acl',nspacl) FROM pg_namespace WHERE nspname='official_v3_guard_private')),
    ('content',jsonb_build_object('hma',official_v3_guard_private.content_digest_v1('hma'),
      's1',official_v3_guard_private.content_digest_v1('s1'),'jobs',official_v3_guard_private.content_digest_v1('jobs'),
      'hrs',official_v3_guard_private.hrs_certificate_v1()));
  IF (SELECT count(*) FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='ot_v3_jobs_owner'::regrole AND member='postgres'::regrole
      AND grantor<>'postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option)
    OR pg_has_role('postgres','ot_v3_jobs_owner','SET') OR pg_has_role('postgres','ot_v3_jobs_owner','USAGE')
    OR has_schema_privilege('ot_v3_jobs_owner','official_v3_guard_private','CREATE') THEN
    RAISE EXCEPTION 'production rolling original owner authority required' USING ERRCODE='P7911'; END IF;
  FOREACH table_name IN ARRAY ARRAY[
    'official_v3_method_private.revisions_v1','official_v3_method_private.heads_v1','official_v3_method_private.operations_v1',
    'official_v3_intake_private.operations_v1','official_v3_intake_private.reservations_v1','official_v3_intake_private.completions_v1',
    'official_v3_jobs_private.slots_v1','official_v3_jobs_private.subjects_v1','official_v3_jobs_private.queue_operations_v1',
    'official_v3_jobs_private.execution_starts_v1','official_v3_jobs_private.execution_results_v1','official_v3_jobs_private.execution_dispositions_v1','official_v3_jobs_private.catalog_binding_v1',
    'official_v3_result_private.binding_v1','official_v3_result_private.originals_v1','official_v3_result_private.extractions_v1','official_v3_result_private.qualifications_v1',
    'official_v3_result_private.decisions_v1','official_v3_result_private.archive_pages_v1','official_v3_result_private.versions_v1','official_v3_result_private.projections_v1',
    'official_v3_result_private.heads_v1','official_v3_result_private.operations_v1','official_v3_result_private.outbox_v1','official_v3_result_private.monitor_schedule_v1',
    'official_v3_guard_private.baselines_v1','official_v3_guard_private.certificates_v1','official_v3_guard_private.certificate_history_v1',
    'official_v3_guard_private.state_v1','official_v3_guard_private.runs_v1','official_v3_guard_private.incidents_v1',
    'official_v3_guard_private.owner_operations_v1','official_v3_guard_private.retired_attempts_v1','official_v3_guard_private.status_baseline_v1'
  ] LOOP
    EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(encode(sha256(convert_to(to_jsonb(r)::text,''UTF8'')),''hex''),'''' ORDER BY to_jsonb(r)::text COLLATE "C"),''''),''UTF8'')),''hex'') FROM %s r',table_name::regclass)
      INTO row_count,row_digest;
    INSERT INTO pg_temp.rolling_before VALUES('table:'||table_name,jsonb_build_object('count',row_count,'digest',row_digest));
  END LOOP;
END $production_rolling_predecessor$;
