-- Dev-only scheduler state. No protected Official Truth table, counter, expiry,
-- approval or function is changed. Installation and activation are separate.
-- The caller wraps this complete file in one transaction and sets the exact
-- target below. Native tests use an owned local PG17 fixture, never a live URL.
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='3s';
DO $preflight$
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_import_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:refresh1'
    OR to_regprocedure('extensions.hmac(text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'exact Dev scheduler installation context required';
  END IF;
END $preflight$;

CREATE SCHEMA jetnity_dev_import_scheduler AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE TABLE jetnity_dev_import_scheduler.state_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false,
  next_due_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  observed_at timestamptz,
  transport_expires_at timestamptz,
  status text NOT NULL DEFAULT 'disabled',
  remaining_starts integer,
  remaining_operations integer
);
INSERT INTO jetnity_dev_import_scheduler.state_v1(singleton) VALUES(true);
CREATE TABLE jetnity_dev_import_scheduler.cycles_v1 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  operation_id text NOT NULL UNIQUE CHECK(operation_id ~ '^op3_[a-f0-9]{32}$'),
  lease_id text NOT NULL UNIQUE CHECK(lease_id ~ '^lease3_[a-f0-9]{32}$'),
  phase text NOT NULL DEFAULT 'start' CHECK(phase IN ('start','resume')),
  state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','published','blocked')),
  phase_attempts integer NOT NULL DEFAULT 0 CHECK(phase_attempts BETWEEN 0 AND 8),
  last_status text,
  finished_at timestamptz,
  published integer NOT NULL DEFAULT 0 CHECK(published BETWEEN 0 AND 32),
  CHECK((state='published')=(published>0)),
  CHECK((state='active')=(finished_at IS NULL))
);
CREATE UNIQUE INDEX dev_import_one_active ON jetnity_dev_import_scheduler.cycles_v1((true)) WHERE state='active';
CREATE TABLE jetnity_dev_import_scheduler.dispatches_v1 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cycle_id bigint NOT NULL REFERENCES jetnity_dev_import_scheduler.cycles_v1(id),
  phase text NOT NULL CHECK(phase IN ('start','resume')),
  signed_at_ms text NOT NULL CHECK(signed_at_ms ~ '^[0-9]{13}$'),
  dispatched_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  net_request_id bigint NOT NULL UNIQUE,
  processed_at timestamptz,
  http_status integer,
  outcome text
);
ALTER TABLE jetnity_dev_import_scheduler.state_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_dev_import_scheduler.cycles_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_dev_import_scheduler.dispatches_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE FUNCTION jetnity_dev_import_scheduler.preserve_request_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
BEGIN
  IF NEW.id<>OLD.id OR NEW.created_at<>OLD.created_at OR NEW.operation_id<>OLD.operation_id
    OR NEW.lease_id<>OLD.lease_id OR OLD.state<>'active'
    OR (OLD.phase='resume' AND NEW.phase<>'resume') THEN
    RAISE EXCEPTION 'original scheduler request is immutable';
  END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER preserve_request BEFORE UPDATE ON jetnity_dev_import_scheduler.cycles_v1
FOR EACH ROW EXECUTE FUNCTION jetnity_dev_import_scheduler.preserve_request_v1();

CREATE FUNCTION jetnity_dev_import_scheduler.tick_v1() RETURNS text
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
  subject_count integer;
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
  SELECT count(*),64-max(start_count),256-max(operation_count)
    INTO subject_count,start_left,operation_left FROM official_v3_jobs_private.subjects_v1
    WHERE job_key='research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513'
      AND kind='rule_research';
  UPDATE jetnity_dev_import_scheduler.state_v1 SET observed_at=moment,
    remaining_starts=start_left,remaining_operations=operation_left WHERE singleton;
  IF subject_count<>1 OR start_left<0 OR operation_left<0 THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='quota_state_unavailable' WHERE singleton;
    RETURN 'quota_state_unavailable';
  END IF;
  -- Unchanged normal BG1 remains authoritative; this sender never runs an audit.
  IF NOT EXISTS(SELECT 1 FROM official_v3_guard_private.state_v1
    WHERE singleton AND incident_generation=resumed_generation AND valid_until>moment
      AND last_proof_started IS NOT NULL AND last_finished>=last_proof_started) THEN
    UPDATE jetnity_dev_import_scheduler.state_v1 SET status='guard_not_current' WHERE singleton;
    RETURN 'guard_not_current';
  END IF;
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
    IF EXISTS(SELECT 1 FROM jetnity_dev_import_scheduler.cycles_v1 WHERE state='blocked') THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='operator_review_required' WHERE singleton;
      RETURN 'operator_review_required';
    END IF;
    IF control.next_due_at>moment THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='not_due' WHERE singleton;
      RETURN 'not_due';
    END IF;
    -- Reserve the existing attempt/operation allowance. Never reset or increase it.
    IF start_left<4 OR operation_left<16 THEN
      UPDATE jetnity_dev_import_scheduler.state_v1 SET status='pilot_capacity_low' WHERE singleton;
      RETURN 'pilot_capacity_low';
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
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
