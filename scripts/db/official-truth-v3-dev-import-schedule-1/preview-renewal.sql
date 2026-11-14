-- Additive Dev-only preview admission renewal. Apply only after core.sql.
-- No application authority is obtained from the public HTTP response. A saved
-- cookie is a candidate until Vercel admits it and the import returns valid HMAC.
SET LOCAL search_path=pg_catalog;
DO $preflight$
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.dev_import_target',true) IS DISTINCT FROM 'dev:yfvbxvijcorffwxbxahl:refresh1'
    OR to_regprocedure('jetnity_dev_import_scheduler.tick_v1()') IS NULL THEN
    RAISE EXCEPTION 'exact installed Dev scheduler required';
  END IF;
END $preflight$;

CREATE TABLE jetnity_dev_import_scheduler.preview_access_v1 (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  next_refresh_at timestamptz DEFAULT clock_timestamp(),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 8),
  status text NOT NULL DEFAULT 'not_started',
  observed_at timestamptz,
  candidate_digest text CHECK(candidate_digest ~ '^[a-f0-9]{64}$')
);
INSERT INTO jetnity_dev_import_scheduler.preview_access_v1(singleton) VALUES(true);
CREATE TABLE jetnity_dev_import_scheduler.preview_dispatches_v1 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  net_request_id bigint NOT NULL UNIQUE,
  dispatched_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  processed_at timestamptz,
  outcome text
);
CREATE UNIQUE INDEX preview_one_pending ON jetnity_dev_import_scheduler.preview_dispatches_v1((true)) WHERE processed_at IS NULL;
ALTER TABLE jetnity_dev_import_scheduler.preview_access_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_dev_import_scheduler.preview_dispatches_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA jetnity_dev_import_scheduler FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

CREATE FUNCTION jetnity_dev_import_scheduler.maintain_preview_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='10s' SET lock_timeout='2s'
AS $renew$
DECLARE
  moment timestamptz:=clock_timestamp();
  control jetnity_dev_import_scheduler.state_v1%ROWTYPE;
  renewal jetnity_dev_import_scheduler.preview_access_v1%ROWTYPE;
  dispatch jetnity_dev_import_scheduler.preview_dispatches_v1%ROWTYPE;
  reply record;
  share_key text;
  cookie_header text;
  cookie_value text;
  payload_text text;
  claims jsonb;
  issued_at timestamptz;
  expires_at timestamptz;
  cookie_secret_id uuid;
  header_count integer;
  request_id bigint;
  accepted_shape boolean:=false;
  host_name constant text:='jetnity-app-git-feat-official-truth-hum-6fe0cd-jetnity-e1b93c82.vercel.app';
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres' THEN
    RAISE EXCEPTION 'Dev scheduler operator only';
  END IF;
  IF NOT pg_try_advisory_xact_lock(771106,31) THEN RETURN 'busy'; END IF;
  SELECT * INTO STRICT control FROM jetnity_dev_import_scheduler.state_v1 WHERE singleton FOR UPDATE;
  IF NOT control.enabled THEN RETURN 'disabled'; END IF;
  SELECT * INTO STRICT renewal FROM jetnity_dev_import_scheduler.preview_access_v1 WHERE singleton FOR UPDATE;
  UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET observed_at=moment WHERE singleton;
  SELECT decrypted_secret INTO share_key FROM vault.decrypted_secrets WHERE name='jetnity_dev_import_preview_share_v1';
  IF share_key IS NULL OR share_key !~ '^[A-Za-z0-9_-]{32}$' THEN
    UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET status='preview_configuration_unavailable' WHERE singleton;
    RETURN 'preview_configuration_unavailable';
  END IF;
  SELECT * INTO dispatch FROM jetnity_dev_import_scheduler.preview_dispatches_v1 WHERE processed_at IS NULL FOR UPDATE;
  IF FOUND THEN
    SELECT * INTO reply FROM net._http_response WHERE id=dispatch.net_request_id;
    IF NOT FOUND AND moment<dispatch.dispatched_at+interval '90 seconds' THEN RETURN 'awaiting_preview_response'; END IF;
    IF FOUND AND reply.timed_out IS NOT TRUE AND reply.error_msg IS NULL
      AND reply.status_code IN (200,307,308) AND moment>=dispatch.dispatched_at
      AND moment<=dispatch.dispatched_at+interval '150 seconds' THEN
      BEGIN
        SELECT count(*),min(value) INTO header_count,cookie_header FROM jsonb_each_text(reply.headers)
          WHERE lower(key)='set-cookie';
        cookie_value:=substring(cookie_header from '^_vercel_jwt=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+);');
        IF header_count=1 AND cookie_value IS NOT NULL AND length(cookie_value)+12<=2048
          AND length(cookie_header)<=4096 AND cookie_header !~ E'[\r\n]' THEN
          payload_text:=split_part(cookie_value,'.',2);
          claims:=convert_from(decode(translate(payload_text,'-_','+/')||repeat('=',(4-length(payload_text)%4)%4),'base64'),'UTF8')::jsonb;
          IF jsonb_typeof(claims)='object' AND claims->>'aud'=host_name
            AND claims->>'sub'='protection-bypass-url' AND claims->>'bypass'=share_key
            AND jsonb_typeof(claims->'iat')='number' AND claims->>'iat' ~ '^[0-9]{10}$'
            AND (NOT (claims ? 'exp') OR (jsonb_typeof(claims->'exp')='number' AND claims->>'exp' ~ '^[0-9]{10}$')) THEN
            issued_at:=to_timestamp((claims->>'iat')::bigint);
            -- The observed permanent alias link issues a JWT without exp.
            -- Bound our use locally to seven days; this is not a JWT expiry claim.
            expires_at:=CASE WHEN claims ? 'exp' THEN to_timestamp((claims->>'exp')::bigint)
              ELSE issued_at+interval '7 days' END;
            accepted_shape:=issued_at>=dispatch.dispatched_at-interval '5 seconds'
              AND issued_at<=moment+interval '5 seconds'
              AND expires_at>moment+interval '24 hours'
              AND expires_at<=issued_at+interval '7 days'
              AND (control.transport_expires_at IS NULL OR expires_at>control.transport_expires_at);
          END IF;
        END IF;
      EXCEPTION WHEN invalid_text_representation OR invalid_parameter_value OR character_not_in_repertoire
        OR numeric_value_out_of_range OR datetime_field_overflow THEN accepted_shape:=false;
      END;
    END IF;
    IF accepted_shape IS TRUE THEN
      SELECT id INTO STRICT cookie_secret_id FROM vault.secrets WHERE name='jetnity_dev_import_preview_cookie_v1';
      PERFORM vault.update_secret(cookie_secret_id,'_vercel_jwt='||cookie_value);
      UPDATE jetnity_dev_import_scheduler.state_v1 SET transport_expires_at=expires_at WHERE singleton;
      UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET next_refresh_at=expires_at-interval '24 hours',
        attempts=0,status='cookie_candidate_saved',candidate_digest=encode(sha256(convert_to(cookie_value,'UTF8')),'hex') WHERE singleton;
      UPDATE jetnity_dev_import_scheduler.preview_dispatches_v1 SET processed_at=moment,outcome='cookie_candidate_saved' WHERE id=dispatch.id;
      RETURN 'cookie_candidate_saved';
    END IF;
    -- Invalid/old/missing candidates cannot replace a still-valid credential.
    UPDATE jetnity_dev_import_scheduler.preview_dispatches_v1 SET processed_at=moment,outcome='preview_response_unconfirmed' WHERE id=dispatch.id;
    UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET next_refresh_at=moment+interval '5 minutes',
      status='preview_response_unconfirmed' WHERE singleton;
    renewal.next_refresh_at:=moment+interval '5 minutes';
  END IF;
  IF renewal.attempts>=8 OR renewal.next_refresh_at IS NULL THEN
    UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET status='operator_review_required',next_refresh_at=NULL WHERE singleton;
    RETURN 'operator_review_required';
  END IF;
  IF renewal.next_refresh_at>moment THEN RETURN 'preview_not_due'; END IF;
  -- Fixed-host read-only credential refresh. No source/import IDs or signing
  -- key are sent. Its URL token is visible to the provider's PUBLIC net roles.
  request_id:=net.http_get(url:='https://'||host_name||'/?_vercel_share='||share_key,params:='{}'::jsonb,
    headers:='{}'::jsonb,timeout_milliseconds:=10000);
  INSERT INTO jetnity_dev_import_scheduler.preview_dispatches_v1(net_request_id) VALUES(request_id);
  UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET attempts=attempts+1,status='preview_refresh_dispatched' WHERE singleton;
  RETURN 'preview_refresh_dispatched';
END $renew$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.maintain_preview_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;

-- A renewal failure must not cancel source work while the existing credential
-- remains valid. The subtransaction discards partial renewal writes; tick_v1
-- still applies its own expiry, quota, BG1 and signed-response gates.
CREATE FUNCTION jetnity_dev_import_scheduler.run_v1() RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog SET statement_timeout='15s' SET lock_timeout='2s'
AS $run$
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres' THEN
    RAISE EXCEPTION 'Dev scheduler operator only';
  END IF;
  BEGIN
    PERFORM jetnity_dev_import_scheduler.maintain_preview_v1();
  EXCEPTION WHEN query_canceled OR OTHERS THEN
    UPDATE jetnity_dev_import_scheduler.preview_access_v1 SET status='preview_renewal_error',
      observed_at=clock_timestamp() WHERE singleton;
  END;
  RETURN jetnity_dev_import_scheduler.tick_v1();
END $run$;
REVOKE ALL ON FUNCTION jetnity_dev_import_scheduler.run_v1() FROM PUBLIC,anon,authenticated,service_role,supabase_read_only_user;
