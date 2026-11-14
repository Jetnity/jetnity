-- BG1: private state. No runtime login receives table privileges.
CREATE SCHEMA official_v3_guard_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA official_v3_guard_private FROM PUBLIC;
CREATE TABLE official_v3_guard_private.baselines_v1 (
  component text PRIMARY KEY CHECK (component IN ('hrs','jobs','all')),
  predecessor_digest text NOT NULL CHECK (predecessor_digest ~ '^[a-f0-9]{64}$'),
  catalog jsonb NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE official_v3_guard_private.certificates_v1 (
  component text PRIMARY KEY CHECK (component IN ('hma','s1','jobs')),
  generation bigint NOT NULL CHECK (generation > 0),
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$')
);
CREATE TABLE official_v3_guard_private.certificate_history_v1 (
  component text NOT NULL CHECK (component IN ('hma','s1','jobs')),
  generation bigint NOT NULL CHECK (generation > 0),
  before_digest text,
  after_digest text NOT NULL CHECK (after_digest ~ '^[a-f0-9]{64}$'),
  predecessor_hash text,
  recorded_at timestamptz NOT NULL,
  entry_hash text NOT NULL UNIQUE CHECK (entry_hash ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY(component,generation),
  CHECK ((generation=1 AND before_digest IS NULL AND predecessor_hash IS NULL)
    OR (generation>1 AND before_digest ~ '^[a-f0-9]{64}$' AND predecessor_hash ~ '^[a-f0-9]{64}$'))
);
CREATE TABLE official_v3_guard_private.state_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  installed_at timestamptz NOT NULL,
  generation bigint NOT NULL DEFAULT 0 CHECK (generation >= 0),
  last_due timestamptz,
  last_started timestamptz,
  last_proof_started timestamptz,
  last_finished timestamptz,
  valid_until timestamptz,
  incident_generation bigint NOT NULL DEFAULT 0 CHECK (incident_generation >= 0),
  incident_at timestamptz,
  resumed_generation bigint NOT NULL DEFAULT 0 CHECK (resumed_generation >= 0),
  last_observed timestamptz NOT NULL,
  CHECK (resumed_generation <= incident_generation),
  CHECK ((incident_generation = 0) = (incident_at IS NULL)),
  CHECK ((generation = 0 AND last_due IS NULL AND last_started IS NULL AND last_proof_started IS NULL AND last_finished IS NULL AND valid_until IS NULL)
    OR (generation > 0 AND last_due IS NOT NULL AND last_started IS NOT NULL AND last_proof_started IS NOT NULL AND last_finished IS NOT NULL AND valid_until IS NOT NULL
      AND isfinite(last_due) AND isfinite(last_started) AND isfinite(last_proof_started) AND isfinite(last_finished)
      AND last_due <= last_started AND last_started <= last_proof_started AND last_proof_started <= last_finished
      AND last_finished <= last_started + interval '30 seconds'
      AND valid_until = last_due + interval '5 minutes 30 seconds'))
);
CREATE TABLE official_v3_guard_private.runs_v1 (
  due_at timestamptz PRIMARY KEY,
  started_at timestamptz NOT NULL,
  proof_started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('complete','refused','expired','clock','gap')),
  generation bigint NOT NULL CHECK (generation >= 0),
  incident_generation bigint NOT NULL CHECK (incident_generation >= 0)
);
CREATE TABLE official_v3_guard_private.incidents_v1 (
  generation bigint PRIMARY KEY CHECK (generation>0),
  due_at timestamptz NOT NULL,
  reason text NOT NULL CHECK (reason IN ('refused','expired','clock','gap')),
  baseline_generation bigint NOT NULL CHECK (baseline_generation>=0),
  detected_at timestamptz NOT NULL,
  UNIQUE(due_at,reason,baseline_generation)
);
CREATE TABLE official_v3_guard_private.owner_operations_v1 (
  operation_id text PRIMARY KEY CHECK (operation_id ~ '^op3_[a-f0-9]{32}$'),
  action text NOT NULL CHECK (action IN ('retire_unknown','resume')),
  expected_digest text NOT NULL CHECK (expected_digest ~ '^[a-f0-9]{64}$'),
  actor_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  receipt jsonb NOT NULL CHECK (octet_length(receipt::text) <= 8192)
);
CREATE TABLE official_v3_guard_private.retired_attempts_v1 (
  attempt_key text PRIMARY KEY CHECK (attempt_key ~ '^execution-attempt:v3:[a-f0-9]{64}$'),
  job_key text NOT NULL UNIQUE,
  claim_operation_id text NOT NULL UNIQUE,
  intake_operation_id text NOT NULL UNIQUE,
  owner_operation_id text NOT NULL UNIQUE REFERENCES official_v3_guard_private.owner_operations_v1(operation_id),
  before_state jsonb NOT NULL CHECK (octet_length(before_state::text) <= 131072),
  retired_at timestamptz NOT NULL
);

CREATE FUNCTION official_v3_guard_private.immutable_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'bg1 immutable evidence' USING ERRCODE='P7901'; END $$;

DO $tables$
DECLARE name text;
BEGIN
  FOREACH name IN ARRAY ARRAY['baselines_v1','certificates_v1','certificate_history_v1','state_v1','runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I ENABLE ROW LEVEL SECURITY',name);
    EXECUTE format('ALTER TABLE official_v3_guard_private.%I FORCE ROW LEVEL SECURITY',name);
    EXECUTE format('CREATE POLICY owner_only ON official_v3_guard_private.%I TO postgres USING (true) WITH CHECK (true)',name);
    EXECUTE format('REVOKE ALL ON TABLE official_v3_guard_private.%I FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user',name);
  END LOOP;
  FOREACH name IN ARRAY ARRAY['baselines_v1','certificate_history_v1','runs_v1','incidents_v1','owner_operations_v1','retired_attempts_v1'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_v1 BEFORE UPDATE OR DELETE ON official_v3_guard_private.%I FOR EACH ROW EXECUTE FUNCTION official_v3_guard_private.immutable_v1()',name);
  END LOOP;
END $tables$;
INSERT INTO official_v3_guard_private.state_v1(singleton,installed_at,last_observed)
VALUES(true,clock_timestamp(),clock_timestamp());

CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz;
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton FOR SHARE;
  instant:=clock_timestamp();
  IF NOT FOUND OR s.generation=0 OR s.incident_generation<>s.resumed_generation
    OR instant<s.last_observed OR instant<s.last_finished OR instant>=s.valid_until
    OR s.last_finished>s.last_started+interval '30 seconds'
    OR s.valid_until<>s.last_due+interval '5 minutes 30 seconds' THEN
    RAISE EXCEPTION 'bg1 integrity unavailable' USING ERRCODE='P7902';
  END IF;
  RETURN s.incident_generation;
END $$;

CREATE FUNCTION official_v3_guard_private.check_control_v1() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; r record; g bigint:=0; previous_time timestamptz;
BEGIN
  SELECT * INTO STRICT s FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF NOT isfinite(s.installed_at) OR NOT isfinite(s.last_observed) OR s.last_observed<s.installed_at THEN
    RAISE EXCEPTION 'bg1 control time' USING ERRCODE='P7905'; END IF;
  FOR r IN SELECT * FROM official_v3_guard_private.incidents_v1 ORDER BY generation LOOP
    g:=g+1;
    IF r.generation<>g OR r.baseline_generation>s.generation OR NOT isfinite(r.detected_at)
      OR r.detected_at<previous_time OR r.due_at<>date_bin(interval '5 minutes',r.due_at,timestamptz '2000-01-01 00:00:00+00') THEN
      RAISE EXCEPTION 'bg1 incident history' USING ERRCODE='P7905'; END IF;
    previous_time:=r.detected_at;
  END LOOP;
  IF g<>s.incident_generation OR previous_time IS DISTINCT FROM s.incident_at THEN
    RAISE EXCEPTION 'bg1 incident head' USING ERRCODE='P7905'; END IF;
  g:=0; previous_time:=NULL;
  FOR r IN SELECT * FROM official_v3_guard_private.runs_v1 WHERE outcome='complete' ORDER BY generation LOOP
    g:=g+1;
    IF r.generation<>g OR r.incident_generation>s.incident_generation
      OR r.due_at<>date_bin(interval '5 minutes',r.started_at,timestamptz '2000-01-01 00:00:00+00')
      OR NOT isfinite(r.finished_at) OR r.started_at>r.proof_started_at OR r.proof_started_at>r.finished_at
      OR r.finished_at>r.started_at+interval '30 seconds' OR r.started_at<previous_time THEN
      RAISE EXCEPTION 'bg1 full-proof history' USING ERRCODE='P7905'; END IF;
    previous_time:=r.finished_at;
  END LOOP;
  IF g<>s.generation OR (g>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.runs_v1 proof
    WHERE proof.outcome='complete' AND proof.generation=s.generation AND proof.due_at=s.last_due
      AND proof.started_at=s.last_started AND proof.proof_started_at=s.last_proof_started AND proof.finished_at=s.last_finished))
    OR (s.resumed_generation>0 AND NOT EXISTS(SELECT 1 FROM official_v3_guard_private.owner_operations_v1 op
      WHERE op.action='resume' AND (op.receipt->>'generation')::bigint=s.resumed_generation)) THEN
    RAISE EXCEPTION 'bg1 proof or resume head' USING ERRCODE='P7905'; END IF;
END $$;

CREATE FUNCTION official_v3_guard_private.hrs_catalog_v1() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT catalog FROM official_v3_guard_private.baselines_v1 WHERE component='hrs'
$$;
CREATE FUNCTION official_v3_guard_private.open_until_v1() RETURNS timestamptz
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM official_v3_guard_private.require_open_v1();
  RETURN (SELECT valid_until FROM official_v3_guard_private.state_v1 WHERE singleton);
END $$;
CREATE FUNCTION official_v3_guard_private.jobs_catalog_v1()
RETURNS TABLE(object_identity text,fingerprint jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT key,value FROM official_v3_guard_private.baselines_v1 b,
LATERAL jsonb_each(b.catalog) WHERE b.component='jobs'
$$;

CREATE FUNCTION official_v3_guard_private.intake_retired_v1(operation_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE intake_operation_id=operation_value)
$$;
CREATE FUNCTION official_v3_guard_private.attempt_retired_v1(attempt_value text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
SELECT EXISTS(SELECT 1 FROM official_v3_guard_private.retired_attempts_v1 WHERE attempt_key=attempt_value)
$$;

-- This deliberately contains no actor, operation, source or runtime identifiers.
CREATE FUNCTION official_v3_guard_private.alarm_status_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s official_v3_guard_private.state_v1%ROWTYPE; instant timestamptz:=clock_timestamp();
BEGIN
  SELECT * INTO s FROM official_v3_guard_private.state_v1 WHERE singleton;
  IF NOT FOUND THEN RETURN jsonb_build_object('schema',1,'status','unavailable'); END IF;
  RETURN jsonb_build_object('schema',1,'status',CASE
    WHEN instant<s.last_observed OR instant<s.last_finished THEN 'clock'
    WHEN s.incident_generation<>s.resumed_generation THEN 'incident'
    WHEN s.generation=0 THEN 'unchecked'
    WHEN instant>=s.valid_until THEN 'stale' ELSE 'current' END);
END $$;
