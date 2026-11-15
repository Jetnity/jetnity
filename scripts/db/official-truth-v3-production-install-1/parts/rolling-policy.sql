-- Fresh Production policy only. This is configuration, not a seeded Job/START.
-- The first real enqueue creates its own subject through the normal API.
SET LOCAL ROLE ot_v3_jobs_owner;
CREATE TABLE official_v3_jobs_private.rolling_policy_v2 (
  job_key text PRIMARY KEY CHECK(job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'),
  method_binding jsonb NOT NULL,
  window_seconds integer NOT NULL CHECK(window_seconds=86400),
  start_limit integer NOT NULL CHECK(start_limit=64),
  operation_limit integer NOT NULL CHECK(operation_limit=256),
  anchor_starts integer NOT NULL CHECK(anchor_starts BETWEEN 0 AND 64),
  anchor_operations integer NOT NULL CHECK(anchor_operations BETWEEN 0 AND 256),
  installed_at timestamptz NOT NULL CHECK(isfinite(installed_at))
);
ALTER TABLE official_v3_jobs_private.rolling_policy_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_jobs_private.rolling_policy_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_v2 ON official_v3_jobs_private.rolling_policy_v2 TO ot_v3_jobs_owner USING(true) WITH CHECK(true);
CREATE POLICY readback_v2 ON official_v3_jobs_private.rolling_policy_v2 FOR SELECT TO postgres USING(true);
CREATE TRIGGER guard_row_v2 BEFORE UPDATE OR DELETE ON official_v3_jobs_private.rolling_policy_v2
  FOR EACH ROW EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
CREATE TRIGGER guard_truncate_v2 BEFORE TRUNCATE ON official_v3_jobs_private.rolling_policy_v2
  FOR EACH STATEMENT EXECUTE FUNCTION official_v3_jobs_private.immutable_v1();
REVOKE ALL ON official_v3_jobs_private.rolling_policy_v2 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT SELECT ON official_v3_jobs_private.rolling_policy_v2 TO postgres;
INSERT INTO official_v3_jobs_private.rolling_policy_v2
 VALUES('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513',
 PRODUCTION_METHOD_BINDING,86400,64,256,0,0,clock_timestamp());

-- Same immutable rows; the new indexes bound admission scans to the window.
CREATE INDEX queue_operations_subject_time_v2
 ON official_v3_jobs_private.queue_operations_v1(job_key,recorded_at,operation_id);
CREATE INDEX execution_starts_subject_time_v2
 ON official_v3_jobs_private.execution_starts_v1(job_key,reserved_at,attempt_key);

CREATE FUNCTION official_v3_jobs_private.rolling_usage_v2(k text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY INVOKER CALLED ON NULL INPUT
SET search_path=pg_catalog,pg_temp AS $quota$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE;
 p official_v3_jobs_private.rolling_policy_v2%ROWTYPE;
 instant timestamptz:=clock_timestamp(); cutoff timestamptz;
 starts integer; operations integer; credit integer; newest timestamptz;
 next_start timestamptz; next_operation timestamptz;
BEGIN
 SELECT * INTO s FROM official_v3_jobs_private.subjects_v1 WHERE job_key=k;
 SELECT * INTO p FROM official_v3_jobs_private.rolling_policy_v2 WHERE job_key=k;
 credit:=CASE WHEN s.terminal_credit_claim IS NULL THEN 0 ELSE 1 END;
 IF NOT FOUND THEN
   RETURN jsonb_build_object('model','lifetime_v1','starts',COALESCE(s.start_count,0),
     'operations',COALESCE(s.operation_count,0),'credit',credit,'clock_ok',true,
     'remaining_starts',greatest(0,64-COALESCE(s.start_count,0)),
     'remaining_operations',greatest(0,256-COALESCE(s.operation_count,0)-credit));
 END IF;
 IF (s.job_key IS NULL AND (p.anchor_starts<>0 OR p.anchor_operations<>0
     OR EXISTS(SELECT 1 FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k)
     OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=k)
     OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_results_v1 r JOIN official_v3_jobs_private.execution_starts_v1 t USING(attempt_key) WHERE t.job_key=k)
     OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_dispositions_v1 d JOIN official_v3_jobs_private.execution_starts_v1 t USING(attempt_key) WHERE t.job_key=k)))
   OR (s.job_key IS NOT NULL AND (s.kind<>'rule_research' OR s.method_binding IS DISTINCT FROM p.method_binding
     OR s.start_count<p.anchor_starts OR s.operation_count<p.anchor_operations))
   OR p.method_binding IS DISTINCT FROM PRODUCTION_METHOD_BINDING
   OR p.window_seconds<>86400 OR p.start_limit<>64 OR p.operation_limit<>256 THEN
   RAISE EXCEPTION 'rolling quota binding mismatch' USING ERRCODE='P7911';
 END IF;
 cutoff:=instant-interval '24 hours';
 -- There is intentionally no upper time predicate: future records remain
 -- charged. A backward clock refuses fresh effects rather than refilling quota.
 SELECT count(*)::integer,min(reserved_at)+interval '24 hours' INTO starts,next_start
  FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=k AND reserved_at>=cutoff;
 SELECT count(*)::integer,min(recorded_at)+interval '24 hours' INTO operations,next_operation
  FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k AND recorded_at>=cutoff;
 SELECT greatest(
   (SELECT reserved_at FROM official_v3_jobs_private.execution_starts_v1 WHERE job_key=k ORDER BY reserved_at DESC LIMIT 1),
   (SELECT recorded_at FROM official_v3_jobs_private.queue_operations_v1 WHERE job_key=k ORDER BY recorded_at DESC LIMIT 1),p.installed_at)
  INTO newest;
 RETURN jsonb_build_object('model','rolling_24h_v2','observed_at',instant,'window_start',cutoff,
   'starts',starts,'operations',operations,'credit',credit,'clock_ok',newest<=instant,
   'remaining_starts',greatest(0,64-starts),'remaining_operations',greatest(0,256-operations-credit),
   'next_start_capacity_at',CASE WHEN starts>=64 THEN next_start+interval '1 microsecond' END,
   'next_operation_capacity_at',CASE WHEN operations+credit>=256 THEN next_operation+interval '1 microsecond' END,
   'lifetime_starts',COALESCE(s.start_count,0),'lifetime_operations',COALESCE(s.operation_count,0));
END $quota$;
REVOKE ALL ON FUNCTION official_v3_jobs_private.rolling_usage_v2(text)
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
GRANT EXECUTE ON FUNCTION official_v3_jobs_private.rolling_usage_v2(text) TO postgres;
RESET ROLE;

-- This is an immutable successor, never an UPDATE to an installed baseline.
CREATE TABLE official_v3_guard_private.rolling_quota_baseline_v1 (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 predecessor_provider_digest text NOT NULL CHECK(predecessor_provider_digest='PRODUCTION_STATUS_SHA256'),
 predecessor_catalog_digest text NOT NULL CHECK(predecessor_catalog_digest ~ '^[a-f0-9]{64}$'),
 predecessor_status_digest text NOT NULL CHECK(predecessor_status_digest ~ '^[a-f0-9]{64}$'),
 required_generation bigint NOT NULL CHECK(required_generation>0),
 proof_not_before timestamptz NOT NULL CHECK(isfinite(proof_not_before)),
 policy jsonb NOT NULL,
 jobs_catalog jsonb NOT NULL,
 hrs_catalog jsonb NOT NULL,
 catalog jsonb NOT NULL
);
ALTER TABLE official_v3_guard_private.rolling_quota_baseline_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_v3_guard_private.rolling_quota_baseline_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON official_v3_guard_private.rolling_quota_baseline_v1 TO postgres USING(true) WITH CHECK(true);
CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.rolling_quota_baseline_v1
 FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
CREATE TRIGGER immutable_truncate_v1 BEFORE TRUNCATE ON official_v3_guard_private.rolling_quota_baseline_v1
 FOR EACH STATEMENT EXECUTE FUNCTION official_v3_guard_private.immutable_v1();
REVOKE ALL ON official_v3_guard_private.rolling_quota_baseline_v1
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;

CREATE FUNCTION official_v3_guard_private.ch_de_quota_v2() RETURNS jsonb
LANGUAGE plpgsql VOLATILE PARALLEL UNSAFE SECURITY DEFINER CALLED ON NULL INPUT
SET search_path=pg_catalog AS $readback$
DECLARE result jsonb;
BEGIN
 PERFORM official_v3_guard_private.require_open_v1();
 result:=official_v3_jobs_private.rolling_usage_v2('research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513');
 IF result->>'model'<>'rolling_24h_v2' THEN RAISE EXCEPTION 'rolling quota not installed' USING ERRCODE='P7911'; END IF;
 RETURN result;
END $readback$;
REVOKE ALL ON FUNCTION official_v3_guard_private.ch_de_quota_v2()
 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user,ot_v3_jobs_owner,ot_v3_result_owner,ot_v3_intake_owner;
