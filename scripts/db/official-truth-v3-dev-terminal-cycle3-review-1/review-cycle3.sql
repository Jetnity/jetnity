-- Generated exact Dev Cycle3 terminal review; no source/audit/tick/HTTP effect.
-- Runtime/CI/Ready/UI facts below are an operator declaration, not a DB proof
-- of a remote deployment. Original scheduler and protected rows stay unchanged.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL timezone='UTC';
SET LOCAL datestyle='ISO, YMD';
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
CREATE TEMP TABLE cycle3_review_before(kind text PRIMARY KEY,value jsonb NOT NULL) ON COMMIT DROP;
DO $preflight$
DECLARE s official_v3_jobs_private.subjects_v1%ROWTYPE; p pg_proc%ROWTYPE; t record; rows_digest text; quota jsonb;
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_terminal_cycle3_review_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:terminal-cycle3-v1'
    OR current_setting('jetnity.dev_terminal_cycle3_review_ack',true) IS DISTINCT FROM 'full-ci-ready-preview-and-normal-ui-verified-cycle3-v1'
    OR (current_setting('jetnity.dev_terminal_cycle3_review_commit',true) ~ '^[a-f0-9]{40}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle3_review_deployment',true) ~ '^dpl_[A-Za-z0-9]{20,64}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle3_review_ci_run',true) ~ '^[1-9][0-9]{0,17}$') IS NOT TRUE
    OR (current_setting('jetnity.dev_terminal_cycle3_review_ui_version',true) ~ '^([6-9]|[1-9][0-9]{1,8})$') IS NOT TRUE THEN
    RAISE EXCEPTION 'exact Dev Cycle3 operator declaration required';
  END IF;
  PERFORM pg_advisory_xact_lock(771106,31);
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle3_review_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'review already present; confirm original readback, never replace';
  END IF;
  IF to_regclass('jetnity_dev_import_scheduler.terminal_cycle2_review_v1') IS NULL THEN
    RAISE EXCEPTION 'original Cycle2 review is required';
  END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>'79a68078d5423a8646f2faf796174df8cf6680babe3595d57a0708a8e0973add' OR p.proowner<>'postgres'::regrole
    OR p.prosecdef OR p.pronargs<>0 OR p.prorettype<>'text'::regtype
    OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog','statement_timeout=10s','lock_timeout=2s']::text[] THEN
    RAISE EXCEPTION 'exact unchanged Dev sender predecessor required';
  END IF;
  INSERT INTO pg_temp.cycle3_review_before VALUES('tick_metadata',to_jsonb(p)-'prosrc');
  -- Same sender lock/state row, then BG1's existing common write lock BEFORE
  -- any guard row lock, as in audit_v1/begin_component_v1. The genuine checks
  -- below acquire the protected SHARE table locks under their existing owners.
  PERFORM 1 FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dev sender state missing'; END IF;
  PERFORM pg_advisory_xact_lock(771106,1);
  PERFORM official_v3_guard_private.require_open_v1();
  IF EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')) THEN RAISE EXCEPTION 'technical runtime session remains'; END IF;
  LOCK TABLE jetnity_dev_import_scheduler.state_v1,jetnity_dev_import_scheduler.cycles_v1,
    jetnity_dev_import_scheduler.dispatches_v1,jetnity_dev_import_scheduler.preview_access_v1,
    jetnity_dev_import_scheduler.preview_dispatches_v1,
    jetnity_dev_import_scheduler.terminal_cycle2_review_v1 IN SHARE MODE;
  IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' OR (state='blocked' AND id NOT IN (2,3)))
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.dispatches_v1 WHERE processed_at IS NULL)
    OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL) THEN
    RAISE EXCEPTION 'unreviewed scheduler work remains';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')) OR (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1)<>1 THEN
    RAISE EXCEPTION 'original Cycle2 review and evidence are required';
  END IF;
  IF encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex') IS DISTINCT FROM 'cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1' THEN
    RAISE EXCEPTION 'original Cycle3 signed exhausted evidence differs';
  END IF;
  SELECT * INTO STRICT s FROM official_v3_jobs_private.subjects_v1 WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513';
  IF s.open_attempt IS NOT NULL OR s.terminal_credit_claim IS NOT NULL
    OR s.current_job->'lease' IS DISTINCT FROM 'null'::jsonb
    OR s.current_job->>'state' NOT IN ('succeeded','exhausted')
    OR (s.current_job->>'revision')::integer<35
    OR EXISTS(SELECT 1 FROM official_v3_jobs_private.execution_starts_v1 WHERE leased_job->>'jobId'='job3_6caeafbd2bcb1fed2121984e98c3c3e7') THEN
    RAISE EXCEPTION 'original job or current subject has unresolved custody';
  END IF;

  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'genuine current rolling quota required';
  END IF;
  INSERT INTO pg_temp.cycle3_review_before VALUES('quota',quota-'observed_at'-'window_start');
  INSERT INTO pg_temp.cycle3_review_before VALUES('protected_catalog',official_v3_guard_private.catalog_status_v1());
  INSERT INTO pg_temp.cycle3_review_before VALUES('roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r));
  FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('jetnity_dev_import_scheduler','official_v3_guard_private',
      'official_v3_method_private','official_v3_intake_private','official_v3_jobs_private','official_v3_result_private')
    ORDER BY n.nspname,c.relname LOOP
    EXECUTE format('LOCK TABLE %I.%I IN ACCESS SHARE MODE',t.nspname,t.relname);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',t.nspname,t.relname) INTO rows_digest;
    INSERT INTO pg_temp.cycle3_review_before VALUES('rows:'||t.nspname||'.'||t.relname,to_jsonb(rows_digest));
  END LOOP;
END $preflight$;

CREATE TABLE jetnity_dev_import_scheduler.terminal_cycle3_review_v1(
  cycle_id bigint PRIMARY KEY CHECK(cycle_id=3) REFERENCES jetnity_dev_import_scheduler.cycles_v1(id),
  evidence_digest text NOT NULL CHECK(evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'),
  prior_cycle2_evidence_digest text NOT NULL CHECK(prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'),
  owned_session_fix_sha256 text NOT NULL CHECK(owned_session_fix_sha256='0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c'),
  executors_fix_sha256 text NOT NULL CHECK(executors_fix_sha256='f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b'),
  queue_fix_sha256 text NOT NULL CHECK(queue_fix_sha256='1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45'),
  composition_fix_sha256 text NOT NULL CHECK(composition_fix_sha256='68175c868a39a4a1d0e0e5185be448a026ba27010f830241981cd3c3cbcb10cd'),
  import_service_fix_sha256 text NOT NULL CHECK(import_service_fix_sha256='8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33'),
  quarantine_fix_sha256 text NOT NULL CHECK(quarantine_fix_sha256='aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2'),
  job_contract_fix_sha256 text NOT NULL CHECK(job_contract_fix_sha256='d5077d9f21033c3e5bb5eff1e74b6dde1379225b3c9cee59caacd67b38e1c299'),
  job_storage_fix_sha256 text NOT NULL CHECK(job_storage_fix_sha256='6246e2b6b9fb5c48e8170d9aea0ebb797b12d08c55a3bb12dd3fa38089f71ff8'),
  worker_authority_fix_sha256 text NOT NULL CHECK(worker_authority_fix_sha256='e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28'),
  selected_claim_fix_sha256 text NOT NULL CHECK(selected_claim_fix_sha256='29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1'),
  method_authority_fix_sha256 text NOT NULL CHECK(method_authority_fix_sha256='d7c22972b6427d2169aafa56e70b037cf6babefb50469d527b48f122d104da79'),
  owned_scope_fix_sha256 text NOT NULL CHECK(owned_scope_fix_sha256='89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280'),
  runtime_commit text NOT NULL CHECK(runtime_commit ~ '^[a-f0-9]{40}$'),
  ready_deployment text NOT NULL CHECK(ready_deployment ~ '^dpl_[A-Za-z0-9]{20,64}$'),
  ci_run bigint NOT NULL CHECK(ci_run>0), ui_version integer NOT NULL CHECK(ui_version>=6),
  reviewed_at timestamptz NOT NULL CHECK(isfinite(reviewed_at)),
  reviewed_head jsonb NOT NULL
);
ALTER TABLE jetnity_dev_import_scheduler.terminal_cycle3_review_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON jetnity_dev_import_scheduler.terminal_cycle3_review_v1 FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle3_review_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $immutable$
BEGIN RAISE EXCEPTION 'the original Cycle3 review is immutable'; END $immutable$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle3_review_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON jetnity_dev_import_scheduler.terminal_cycle3_review_v1
FOR EACH ROW EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle3_review_v1();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON jetnity_dev_import_scheduler.terminal_cycle3_review_v1
FOR EACH STATEMENT EXECUTE FUNCTION jetnity_dev_import_scheduler.immutable_terminal_cycle3_review_v1();
INSERT INTO jetnity_dev_import_scheduler.terminal_cycle3_review_v1
SELECT 3,'cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1','624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd','0d818c574ef4784589273f4e31b5abb74879028cbacce66e810012f987734f6c','f1fcc6a0e762104c117e771207e266a3d7eac58492bb573b7aa1be1802c7ce3b',
  '1ac59c6db4e32ad14b57ffef050c833ccd71c4260218b433e90a58fcc8b56a45','68175c868a39a4a1d0e0e5185be448a026ba27010f830241981cd3c3cbcb10cd','8bef6976a8199a87d3db0a4f62214486eb330641849c89afb3d0e5b3adcd7b33','aa7fe8e22dd1368f99528232f6f573ca0c37f38f3bc35a36c5c1a0b02480bca2',
  'd5077d9f21033c3e5bb5eff1e74b6dde1379225b3c9cee59caacd67b38e1c299','6246e2b6b9fb5c48e8170d9aea0ebb797b12d08c55a3bb12dd3fa38089f71ff8','e614e23bf62b0d196bb0756d2e131413517d2e9d3c3ef28182534f884a97af28','29be658ca64918c1f7d2d8f50041eca2395b5ccbbfd787dd988a7ea463914dd1','d7c22972b6427d2169aafa56e70b037cf6babefb50469d527b48f122d104da79',
  '89a22b2a2de00365505258a301614a0ac2870af79bd3ced40a66c8794c6fe280',
  current_setting('jetnity.dev_terminal_cycle3_review_commit'),current_setting('jetnity.dev_terminal_cycle3_review_deployment'),
  current_setting('jetnity.dev_terminal_cycle3_review_ci_run')::bigint,current_setting('jetnity.dev_terminal_cycle3_review_ui_version')::integer,
  clock_timestamp(),current_job FROM official_v3_jobs_private.subjects_v1 WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513';

-- Exactly one predicate is replaced. All requests, quotas, periods and normal
-- admission/source/publication checks in the installed sender remain intact.
CREATE OR REPLACE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='10s' SET lock_timeout='2s'
AS $tick$
DECLARE
  moment timestamptz:=clock_timestamp();
  control jetnity_dev_import_scheduler.state_v1%ROWTYPE;
  cycle jetnity_dev_import_scheduler.cycles_v1%ROWTYPE;
  dispatch jetnity_dev_import_scheduler.dispatches_v1%ROWTYPE;
  reply record;
  result jsonb;
  signing_key text;
  preview_cookie text;
  actual_mac text;
  expected_mac text;
  mac_count integer;
  response_status text;
  amount integer;
  request_id bigint;
  timestamp_ms text;
  request_body jsonb;
  start_left integer;
  operation_left integer;
  quota jsonb;
  response_verified boolean:=false;
  target_url constant text:='https://jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app/api/internal/readiness/ch-de-dev-refresh';
  target_path constant text:='/api/internal/readiness/ch-de-dev-refresh';
BEGIN
  IF current_user<>'postgres' OR session_user<>'postgres' OR current_database()<>'postgres' THEN
    RAISE EXCEPTION 'Dev scheduler operator only';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771106,31) THEN RETURN 'busy'; END IF;
  SELECT * INTO STRICT control FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT control.enabled THEN RETURN 'disabled'; END IF;
  IF control.transport_expires_at IS NULL OR control.transport_expires_at<=moment THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='transport_access_expired',observed_at=moment WHERE singleton;
    RETURN 'transport_access_expired';
  END IF;
  -- Unchanged normal BG1 remains authoritative; this sender never runs an audit.
  IF NOT EXISTS(SELECT 1 FROM official_v3_guard_private.state_v1
    WHERE singleton AND incident_generation=resumed_generation AND valid_until>moment
      AND last_proof_started IS NOT NULL AND last_finished>=last_proof_started) THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='guard_not_current' WHERE singleton;
    RETURN 'guard_not_current';
  END IF;
  IF to_regprocedure('official_v3_guard_private.ch_de_quota_v2()') IS NULL THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  -- The separately installed successor owns rolling admission and terminal
  -- reserve. Never derive a daily allowance by resetting lifetime counters.
  quota:=official_v3_guard_private.ch_de_quota_v2();
  IF quota->>'model' IS DISTINCT FROM 'rolling_24h_v2' OR quota->'clock_ok' IS DISTINCT FROM 'true'::jsonb
    OR jsonb_typeof(quota->'remaining_starts') IS DISTINCT FROM 'number'
    OR jsonb_typeof(quota->'remaining_operations') IS DISTINCT FROM 'number'
    OR (quota->>'remaining_starts') !~ '^[0-9]{1,2}$'
    OR (quota->>'remaining_operations') !~ '^[0-9]{1,3}$' THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  start_left:=(quota->>'remaining_starts')::integer;
  operation_left:=(quota->>'remaining_operations')::integer;
  IF start_left>64 OR operation_left>256 THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable',observed_at=moment WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  UPDATE jetnity_dev_import_scheduler.state_v1 SET observed_at=moment,
    remaining_starts=start_left,remaining_operations=operation_left WHERE singleton;
  SELECT decrypted_secret INTO STRICT signing_key FROM vault.decrypted_secrets
    WHERE name='jetnity_dev_import_cron_v1';
  IF signing_key IS NULL OR length(signing_key) NOT BETWEEN 32 AND 256 OR signing_key !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'scheduler signing configuration unavailable';
  END IF;
  -- This separate credential admits only the fixed Dev preview URL. It grants
  -- no application/Owner/import authority. PUBLIC pg_net can see this cookie
  -- and per-request MACs, but never the persistent import signing key.
  SELECT decrypted_secret INTO STRICT preview_cookie FROM vault.decrypted_secrets
    WHERE name='jetnity_dev_import_preview_cookie_v1';
  IF preview_cookie IS NULL OR length(preview_cookie)>2048
    OR preview_cookie !~ '^_vercel_jwt=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'scheduler preview admission unavailable';
  END IF;
  SELECT * INTO cycle FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='active' FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex')) OR EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 blocked WHERE blocked.state='blocked'
      AND NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex'))
      AND NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1 reviewed
        WHERE reviewed.cycle_id=blocked.id AND reviewed.evidence_digest='cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1'
          AND reviewed.prior_cycle2_evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
          AND reviewed.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex'))) THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
      RETURN 'operator_review_required';
    END IF;
    IF control.next_due_at>moment THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='not_due' WHERE singleton;
      RETURN 'not_due';
    END IF;
    -- Reserve the existing attempt/operation allowance. Never reset or increase it.
    IF start_left<4 OR operation_left<16 THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='daily_capacity_low' WHERE singleton;
      RETURN 'daily_capacity_low';
    END IF;
    INSERT INTO jetnity_dev_import_scheduler.cycles_v1(operation_id,lease_id)
      VALUES('op3_'||replace(gen_random_uuid()::text,'-',''),'lease3_'||replace(gen_random_uuid()::text,'-',''))
      RETURNING * INTO cycle;
  END IF;
  SELECT * INTO dispatch FROM jetnity_dev_import_scheduler.dispatches_v1
    WHERE cycle_id=cycle.id AND processed_at IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    SELECT * INTO reply FROM net._http_response WHERE id=dispatch.net_request_id;
    IF NOT FOUND AND moment<dispatch.dispatched_at+interval '90 seconds' THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='awaiting_response' WHERE singleton;
      RETURN 'awaiting_response';
    END IF;
    response_status:='response_unconfirmed';
    IF FOUND AND reply.timed_out IS NOT TRUE AND reply.error_msg IS NULL AND reply.status_code BETWEEN 200 AND 599
      AND reply.content IS NOT NULL AND octet_length(reply.content)<=1024
      AND moment<=dispatch.dispatched_at+interval '150 seconds' THEN
      BEGIN
        result:=reply.content::jsonb;
        amount:=(result->>'published')::integer;
        response_status:=result->>'status';
        SELECT count(*),min(value) INTO mac_count,actual_mac FROM jsonb_each_text(reply.headers)
          WHERE lower(key)='x-jetnity-dev-import-mac';
        expected_mac:=encode(extensions.hmac(concat_ws(E'\n','jetnity-dev-import-response-v1','POST',target_path,
          dispatch.signed_at_ms,'2',dispatch.phase,cycle.operation_id,cycle.lease_id,'1',reply.status_code::text,response_status,amount::text),
          signing_key,'sha256'),'hex');
        response_verified:=result=jsonb_build_object('schema',1,'status',response_status,'published',amount)
          AND response_status IN ('queued','published','complete','exhausted','busy','not_approved','unavailable','access_required','request_refused','unresolved')
          AND amount BETWEEN 0 AND 32 AND (response_status IN ('published','unresolved') OR amount=0)
          AND mac_count=1 AND actual_mac ~ '^[a-f0-9]{64}$' AND actual_mac=expected_mac
          AND dispatch.phase=cycle.phase;
      EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range OR invalid_parameter_value THEN
        response_verified:=false;
      END;
    END IF;
    IF response_verified IS NOT TRUE THEN response_status:='response_unconfirmed'; END IF;
    UPDATE jetnity_dev_import_scheduler.dispatches_v1 SET processed_at=moment,
      http_status=CASE WHEN reply.id IS NOT NULL THEN reply.status_code ELSE NULL END,outcome=response_status
      WHERE id=dispatch.id;
    IF response_verified AND reply.status_code=200 AND response_status='queued' AND cycle.phase='start' THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET phase='resume',phase_attempts=0,last_status='queued'
        WHERE id=cycle.id RETURNING * INTO cycle;
    ELSIF response_verified AND reply.status_code=200 AND response_status='published' AND amount>0 AND cycle.phase='resume' THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='published',published=amount,finished_at=moment,last_status='published'
        WHERE id=cycle.id;
      -- Preparation can precede publication ACK. Anchor to original request time.
      UPDATE jetnity_dev_import_scheduler.state_v1 SET next_due_at=cycle.created_at+interval '40 minutes',status='published' WHERE singleton;
      RETURN 'published';
    ELSE
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET last_status=response_status WHERE id=cycle.id;
    END IF;
    IF response_verified AND response_status IN ('exhausted','not_approved','access_required','request_refused') THEN
      UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='blocked',finished_at=moment WHERE id=cycle.id;
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
      RETURN 'operator_review_required';
    END IF;
  END IF;
  IF cycle.phase_attempts>=8 OR moment>=cycle.created_at+interval '25 minutes' THEN
    UPDATE jetnity_dev_import_scheduler.cycles_v1 SET state='blocked',finished_at=moment,last_status='retry_budget_exhausted' WHERE id=cycle.id;
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
    RETURN 'operator_review_required';
  END IF;
  -- Identifiers and phase are durable before pg_net can send after COMMIT.
  timestamp_ms:=floor(extract(epoch FROM clock_timestamp())*1000)::bigint::text;
  request_body:=jsonb_build_object('schema',2,'mode',cycle.phase,'operationId',cycle.operation_id,'leaseId',cycle.lease_id);
  expected_mac:=encode(extensions.hmac(concat_ws(E'\n','jetnity-dev-import-v1','POST',target_path,timestamp_ms,'2',
    cycle.phase,cycle.operation_id,cycle.lease_id),signing_key,'sha256'),'hex');
  request_id:=net.http_post(url:=target_url,body:=request_body,params:='{}'::jsonb,
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','HMAC-SHA256 '||expected_mac,
      'X-Jetnity-Dev-Import-Time',timestamp_ms,'Cookie',preview_cookie),timeout_milliseconds:=65000);
  INSERT INTO jetnity_dev_import_scheduler.dispatches_v1(cycle_id,phase,signed_at_ms,net_request_id)
    VALUES(cycle.id,cycle.phase,timestamp_ms,request_id);
  UPDATE jetnity_dev_import_scheduler.cycles_v1 SET phase_attempts=phase_attempts+1 WHERE id=cycle.id;
  UPDATE jetnity_dev_import_scheduler.state_v1 SET status='dispatched_'||cycle.phase WHERE singleton;
  RETURN 'dispatched_'||cycle.phase;
END $tick$;

DO $postcheck$
DECLARE t record; rows_digest text; schema_name text; table_name text; p pg_proc%ROWTYPE;
BEGIN

  PERFORM official_v3_guard_private.require_open_v1();
  PERFORM official_v3_guard_private.check_control_v1();
  PERFORM official_v3_guard_private.assert_catalog_v1();
  PERFORM official_v3_guard_private.check_hma_v1();
  PERFORM official_v3_guard_private.check_s1_v1();
  PERFORM official_v3_guard_private.check_jobs_v1();
  PERFORM official_v3_guard_private.check_hrs_v1();
  PERFORM official_v3_guard_private.check_certificates_v1();
  PERFORM official_v3_guard_private.check_retirements_v1();
  IF EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid()
  AND usename IN ('ot_v3_method_transport_login','ot_v3_intake_transport_login','ot_v3_jobs_transport_login',
    'ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier')) THEN RAISE EXCEPTION 'technical runtime session appeared during review'; END IF;
  SELECT * INTO STRICT p FROM pg_proc WHERE oid='jetnity_dev_import_scheduler.tick_v1()'::regprocedure;
  IF encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')<>'354a5727d1e7f872e42cdda0e56f3f6411ccdf94993a9b9363429ea247e65dbe'
    OR (to_jsonb(p)-'prosrc') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle3_review_before WHERE kind='tick_metadata')
    OR official_v3_guard_private.catalog_status_v1() IS DISTINCT FROM (SELECT value FROM pg_temp.cycle3_review_before WHERE kind='protected_catalog')
    OR (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.oid) FROM pg_roles r) IS DISTINCT FROM (SELECT value FROM pg_temp.cycle3_review_before WHERE kind='roles')
    OR (official_v3_guard_private.ch_de_quota_v2()-'observed_at'-'window_start') IS DISTINCT FROM (SELECT value FROM pg_temp.cycle3_review_before WHERE kind='quota') THEN
    RAISE EXCEPTION 'review changed a protected catalog, quota or sender attribute';
  END IF;
  FOR t IN SELECT kind,value FROM pg_temp.cycle3_review_before WHERE kind LIKE 'rows:%' LOOP
    schema_name:=split_part(substring(t.kind from 6),'.',1); table_name:=split_part(substring(t.kind from 6),'.',2);
    EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text COLLATE "C"),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I r',schema_name,table_name) INTO rows_digest;
    IF to_jsonb(rows_digest) IS DISTINCT FROM t.value THEN RAISE EXCEPTION 'review changed old rows: %',t.kind; END IF;
  END LOOP;
  IF (SELECT count(*) FROM jetnity_dev_import_scheduler.terminal_cycle3_review_v1)<>1
    OR NOT EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.terminal_cycle2_review_v1 prior
    WHERE prior.cycle_id=2 AND prior.evidence_digest='624257e5e0902a9ed1e5ba6f647430771850daf94edf54034c2e169a32af4fdd'
      AND prior.queue_fix_sha256='4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d'
      AND prior.composition_fix_sha256='667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89'
      AND prior.evidence_digest=encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=2),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=2),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_5a9ada0e40b2af467fd7e34cc51cb323'))))::text,'UTF8')),'hex'))
    OR encode(sha256(convert_to(((SELECT jsonb_build_object(
 'cycle',(SELECT to_jsonb(c)||jsonb_build_object(
   'created_at',to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'finished_at',to_char(c.finished_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM jetnity_dev_import_scheduler.cycles_v1 c WHERE c.id=3),
 'dispatches',(SELECT jsonb_agg(to_jsonb(d)||jsonb_build_object(
   'dispatched_at',to_char(d.dispatched_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'processed_at',to_char(d.processed_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) ORDER BY d.id)
   FROM jetnity_dev_import_scheduler.dispatches_v1 d WHERE d.cycle_id=3),
 'terminal_operation',(SELECT to_jsonb(q)||jsonb_build_object(
   'recorded_at',to_char(q.recorded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
   FROM official_v3_jobs_private.queue_operations_v1 q WHERE q.operation_id='op3_0ab5b766f0d954b88a7481b0d531881f'))))::text,'UTF8')),'hex') IS DISTINCT FROM 'cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1' THEN
    RAISE EXCEPTION 'original terminal review readback differs';
  END IF;
END $postcheck$;
COMMIT;
