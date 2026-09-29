-- Development Security Event Logging and Retention 1 — dormant install.
--
-- LOCAL REVIEW AND LATER TECHNICAL-LEAD APPLY ONLY.
-- This file is not a supabase/migrations entry and must not be wired into
-- build, install, or deploy hooks. It does not select a hosted target.
-- A mismatch on the authenticated control-plane ref is STOP.
-- Do not default this script to any hosted project. Production is excluded.
--
-- Dormant means: objects, fixed limits, and at most the collision-checked
-- cleanup job exist, and no producer trigger is attached to blocked_ips or
-- security_events. Existing blocklist writes stay unaudited until 20-activate.sql.
--
-- Clock: expiry and health use pg_catalog.clock_timestamp() (wall clock).
-- Event actor time uses pg_catalog.now() (transaction timestamp).
-- Both are timestamptz. Session TimeZone offset must be 0 (UTC / Etc/UTC).
-- Cron schedule '0 * * * *' is minute 0 of every hour in that UTC zone.
-- pg_cron fires the next successful sweep; it is not exact-second deletion.
--
-- Lock order for paths this package controls:
--   1. auth.users actor row FOR SHARE (admission only)
--   2. security_event_dev_control FOR UPDATE
--   3. provenance event rows in event_id order (cleanup / rollback)
--   4. security_event_producer_quota FOR UPDATE
-- Rollback locks the owned event rows before it updates quota. Account-erasure
-- DELETE cannot be reordered. It locks event rows, then the delete trigger
-- locks quota. Opposite event-row scan order can still deadlock (40P01).
-- This package does not catch that error. The aborted transaction rolls back
-- fully. The caller retries that statement. A caught deadlock is not success.
--
-- statement_timeout on a function does not arm a deadline for the caller
-- statement that is already running. Operator files and the cron command SET
-- lock_timeout and statement_timeout before the function call. Trigger
-- functions still SET lock_timeout, which is read when they take a lock.
-- The caller's own statement_timeout remains the execution bound for a
-- blocklist statement. This package does not claim a second one.
--
-- Quota writes on deletion happen only in the AFTER DELETE statement trigger
-- on security_events (set used to the remaining origin count). Cleanup,
-- rollback, and account erasure delete rows and do not adjust used themselves.

BEGIN;

CREATE SCHEMA IF NOT EXISTS jetnity_internal;

REVOKE ALL ON SCHEMA jetnity_internal FROM PUBLIC;
REVOKE ALL ON SCHEMA jetnity_internal FROM anon, authenticated, service_role;

COMMENT ON SCHEMA jetnity_internal IS
  'Development-only private producer objects. Not a Data API schema.';

ALTER DEFAULT PRIVILEGES IN SCHEMA jetnity_internal
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA jetnity_internal
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA jetnity_internal
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_job_name()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT 'jetnity-security-events-dev-cleanup-v1'::text $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_job_schedule()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT '0 * * * *'::text $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_job_command()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT 'SET lock_timeout = ''4s''; SET statement_timeout = ''30s''; SELECT jetnity_internal.security_event_dev_cleanup(''scheduled'')'::text $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_retention()
RETURNS interval
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT interval '7 days' $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_health_max_age()
RETURNS interval
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT interval '2 hours' $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_cap()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT 1000 $$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_timezone_is_utc()
RETURNS boolean
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$ SELECT extract(timezone from now()) = 0 $$;

REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_job_name() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_job_schedule() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_job_command() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_retention() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_health_max_age() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_cap() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_timezone_is_utc() FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS jetnity_internal.security_event_dev_control (
  id text PRIMARY KEY,
  retention interval NOT NULL,
  cap integer NOT NULL,
  schedule text NOT NULL,
  timezone_name text NOT NULL,
  job_name text NOT NULL,
  job_command text NOT NULL,
  history_retention interval NOT NULL,
  health_max_age interval NOT NULL,
  state text NOT NULL,
  last_success_at timestamptz,
  last_success_kind text,
  last_cutoff_at timestamptz,
  installed_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  activated_at timestamptz,
  CONSTRAINT security_event_dev_control_id_check CHECK (id = 'dev_v1'),
  CONSTRAINT security_event_dev_control_retention_check
    CHECK (retention = interval '7 days'),
  CONSTRAINT security_event_dev_control_cap_check CHECK (cap = 1000),
  CONSTRAINT security_event_dev_control_schedule_check CHECK (schedule = '0 * * * *'),
  CONSTRAINT security_event_dev_control_timezone_check CHECK (timezone_name = 'UTC'),
  CONSTRAINT security_event_dev_control_job_name_check
    CHECK (job_name = 'jetnity-security-events-dev-cleanup-v1'),
  CONSTRAINT security_event_dev_control_job_command_check
    CHECK (job_command = 'SET lock_timeout = ''4s''; SET statement_timeout = ''30s''; SELECT jetnity_internal.security_event_dev_cleanup(''scheduled'')'),
  CONSTRAINT security_event_dev_control_history_check
    CHECK (history_retention = interval '7 days'),
  CONSTRAINT security_event_dev_control_health_check
    CHECK (health_max_age = interval '2 hours'),
  CONSTRAINT security_event_dev_control_state_check
    CHECK (state IN ('dormant', 'active')),
  CONSTRAINT security_event_dev_control_kind_check
    CHECK (last_success_kind IS NULL OR last_success_kind IN ('manual', 'scheduled'))
);

CREATE TABLE IF NOT EXISTS jetnity_internal.security_event_producer_quota (
  id text PRIMARY KEY,
  used integer NOT NULL,
  cap integer NOT NULL,
  enabled boolean NOT NULL,
  CONSTRAINT security_event_producer_quota_id_check CHECK (id = 'tracked_producer'),
  CONSTRAINT security_event_producer_quota_cap_check CHECK (cap = 1000),
  CONSTRAINT security_event_producer_quota_used_check CHECK (used >= 0)
);

CREATE TABLE IF NOT EXISTS jetnity_internal.security_event_producer_origin (
  event_id uuid PRIMARY KEY
    REFERENCES public.security_events (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL
    REFERENCES auth.users (id) ON DELETE CASCADE,
  produced_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  producer text NOT NULL,
  source_op text NOT NULL,
  CONSTRAINT security_event_producer_origin_producer_check
    CHECK (producer = 'blocked_ips_dev_v1'),
  CONSTRAINT security_event_producer_origin_op_check
    CHECK (source_op IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX IF NOT EXISTS security_event_producer_origin_actor_id_idx
  ON jetnity_internal.security_event_producer_origin (actor_id);

COMMENT ON TABLE jetnity_internal.security_event_dev_control IS
  'Fixed Development limits and cleanup health. last_success_at is stamped only by a committed cleanup call.';

COMMENT ON TABLE jetnity_internal.security_event_producer_quota IS
  'used is the current retained provenance-owned event count, never a lifetime admission total.';

COMMENT ON TABLE jetnity_internal.security_event_producer_origin IS
  'Private origin ledger. Membership, not the public JSON shape, is provenance. actor_id cascades when the Auth user row is deleted.';

ALTER TABLE jetnity_internal.security_event_dev_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_internal.security_event_producer_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_internal.security_event_producer_origin ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE jetnity_internal.security_event_dev_control FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE jetnity_internal.security_event_producer_quota FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE jetnity_internal.security_event_producer_origin FROM PUBLIC, anon, authenticated, service_role;

INSERT INTO jetnity_internal.security_event_dev_control (
  id, retention, cap, schedule, timezone_name, job_name, job_command,
  history_retention, health_max_age, state, last_success_at, last_success_kind
)
VALUES (
  'dev_v1',
  interval '7 days',
  1000,
  '0 * * * *',
  'UTC',
  'jetnity-security-events-dev-cleanup-v1',
  jetnity_internal.security_event_dev_job_command(),
  interval '7 days',
  interval '2 hours',
  'dormant',
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO jetnity_internal.security_event_producer_quota (id, used, cap, enabled)
VALUES ('tracked_producer', 0, 1000, false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_is_dev_produced(event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM jetnity_internal.security_event_producer_origin o
     WHERE o.event_id = security_event_is_dev_produced.event_id
       AND o.producer = 'blocked_ips_dev_v1'
  );
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_health_state()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  success_at timestamptz;
  latest_status text;
  latest_end timestamptz;
BEGIN
  SELECT c.last_success_at
    INTO success_at
    FROM jetnity_internal.security_event_dev_control c
   WHERE c.id = 'dev_v1';

  IF NOT FOUND THEN
    RETURN 'missing';
  END IF;

  SELECT d.status, d.end_time
    INTO latest_status, latest_end
    FROM cron.job j
    JOIN cron.job_run_details d ON d.jobid = j.jobid
   WHERE j.jobname = jetnity_internal.security_event_dev_job_name()
     AND d.status IN ('succeeded', 'failed')
     AND d.end_time IS NOT NULL
   ORDER BY d.end_time DESC
   LIMIT 1;

  IF success_at IS NULL AND latest_status = 'failed' THEN
    RETURN 'failing';
  END IF;
  IF success_at IS NULL THEN
    RETURN 'unknown';
  END IF;
  IF latest_status = 'failed' AND latest_end > success_at THEN
    RETURN 'failing';
  END IF;
  IF success_at < pg_catalog.clock_timestamp() - jetnity_internal.security_event_dev_health_max_age() THEN
    RETURN 'stale';
  END IF;
  RETURN 'healthy';
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_event_delete_begin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.set_config('jetnity.security_event_dev_deleting_event', '1', true);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_event_delete_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  remaining integer;
BEGIN
  -- Single deletion accounting site. Cap and cleanup health do not block this.
  IF EXISTS (
    SELECT 1
      FROM jetnity_internal.security_event_producer_quota q
     WHERE q.id = 'tracked_producer'
  ) THEN
    PERFORM 1
      FROM jetnity_internal.security_event_producer_quota q
     WHERE q.id = 'tracked_producer'
     FOR UPDATE;
    SELECT count(*)
      INTO remaining
      FROM jetnity_internal.security_event_producer_origin o;
    UPDATE jetnity_internal.security_event_producer_quota
       SET used = remaining
     WHERE id = 'tracked_producer';
  END IF;
  PERFORM pg_catalog.set_config('jetnity.security_event_dev_deleting_event', '', true);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_on_origin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
BEGIN
  -- Event-delete cascades reach this trigger while the event statement is
  -- already accounting. Auth-user deletion cascades here first and must
  -- remove the paired event so the interval after ereignisseLoeschen cannot
  -- leave a new actor-linked row behind.
  IF pg_catalog.current_setting('jetnity.security_event_dev_deleting_event', true) = '1' THEN
    RETURN NULL;
  END IF;
  DELETE FROM public.security_events
   WHERE id = OLD.event_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_on_blocked_ips()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  actor uuid;
  event_type text;
  extra jsonb;
  event_id uuid;
  quota_used integer;
  quota_cap integer;
  quota_enabled boolean;
  retained bigint;
  reserved integer;
  health text;
  job_ok boolean;
  producer_state text;
BEGIN
  actor := (SELECT auth.uid());
  IF actor IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Same lock order as auth-user deletion: actor row, then control, then quota.
  PERFORM 1
    FROM auth.users u
   WHERE u.id = actor
   FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'security_event dev actor is not a database user'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT c.state
    INTO producer_state
    FROM jetnity_internal.security_event_dev_control c
   WHERE c.id = 'dev_v1'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'security_event dev control missing'
      USING ERRCODE = 'P0001';
  END IF;
  IF producer_state IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'security_event dev producer is not active'
      USING ERRCODE = 'P0001';
  END IF;

  IF jetnity_internal.security_event_dev_timezone_is_utc() IS NOT TRUE THEN
    RAISE EXCEPTION 'security_event dev timezone drifted'
      USING ERRCODE = 'P0001';
  END IF;

  health := jetnity_internal.security_event_dev_health_state();
  IF health IS DISTINCT FROM 'healthy' THEN
    RAISE EXCEPTION 'security_event dev cleanup health %', health
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'DELETE' THEN
    event_type := 'admin_blocklist_remove';
  ELSE
    event_type := 'admin_blocklist_add';
  END IF;

  extra := pg_catalog.jsonb_build_object(
    'surface', 'blocked_ips',
    'result', 'ok',
    'op', TG_OP
  );
  IF pg_catalog.octet_length(extra::text) > 256 THEN
    RAISE EXCEPTION 'security_event dev payload exceeds 256 bytes'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT q.used, q.cap, q.enabled
    INTO quota_used, quota_cap, quota_enabled
    FROM jetnity_internal.security_event_producer_quota q
   WHERE q.id = 'tracked_producer'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'security_event dev quota missing'
      USING ERRCODE = 'P0001';
  END IF;
  IF quota_enabled IS NOT TRUE OR quota_cap IS DISTINCT FROM jetnity_internal.security_event_dev_cap() THEN
    RAISE EXCEPTION 'security_event dev quota disabled or invalid'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)
    INTO retained
    FROM jetnity_internal.security_event_producer_origin o
    JOIN public.security_events e ON e.id = o.event_id;
  IF retained IS DISTINCT FROM quota_used THEN
    RAISE EXCEPTION 'security_event dev quota drifted'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM cron.job j
     WHERE j.jobname = jetnity_internal.security_event_dev_job_name()
       AND j.schedule = jetnity_internal.security_event_dev_job_schedule()
       AND j.command = jetnity_internal.security_event_dev_job_command()
       AND j.active IS TRUE
  )
    INTO job_ok;
  IF job_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'security_event dev scheduler drifted'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE jetnity_internal.security_event_producer_quota
     SET used = used + 1
   WHERE id = 'tracked_producer'
     AND used + 1 <= cap
     AND enabled IS TRUE
     AND cap = jetnity_internal.security_event_dev_cap()
  RETURNING used INTO reserved;
  IF reserved IS NULL THEN
    RAISE EXCEPTION 'security_event dev quota exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.security_events (type, ip, user_id, extra, created_at, metadata)
  VALUES (event_type, NULL, actor, extra, pg_catalog.now(), NULL)
  RETURNING id INTO event_id;

  INSERT INTO jetnity_internal.security_event_producer_origin (
    event_id, actor_id, producer, source_op
  )
  VALUES (event_id, actor, 'blocked_ips_dev_v1', TG_OP);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_cleanup(kind text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  cutoff timestamptz;
  deleted integer := 0;
BEGIN
  IF kind IS DISTINCT FROM 'manual' AND kind IS DISTINCT FROM 'scheduled' THEN
    RAISE EXCEPTION 'security_event dev cleanup kind invalid'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM 1
    FROM jetnity_internal.security_event_dev_control c
   WHERE c.id = 'dev_v1'
   FOR UPDATE;

  cutoff := pg_catalog.clock_timestamp() - jetnity_internal.security_event_dev_retention();

  PERFORM e.id
    FROM public.security_events e
    JOIN jetnity_internal.security_event_producer_origin o ON o.event_id = e.id
   WHERE e.created_at <= cutoff
   ORDER BY e.id
   FOR UPDATE OF e;

  DELETE FROM public.security_events e
   USING jetnity_internal.security_event_producer_origin o
   WHERE e.id = o.event_id
     AND e.created_at <= cutoff;
  GET DIAGNOSTICS deleted = ROW_COUNT;

  DELETE FROM cron.job_run_details d
   USING cron.job j
   WHERE j.jobid = d.jobid
     AND j.jobname = jetnity_internal.security_event_dev_job_name()
     AND d.status IN ('succeeded', 'failed')
     AND d.end_time IS NOT NULL
     AND d.end_time <= pg_catalog.clock_timestamp() - jetnity_internal.security_event_dev_retention();

  UPDATE jetnity_internal.security_event_dev_control
     SET last_success_at = pg_catalog.clock_timestamp(),
         last_success_kind = kind,
         last_cutoff_at = cutoff
   WHERE id = 'dev_v1';

  RETURN deleted;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_repair_quota()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  remaining integer;
BEGIN
  PERFORM 1
    FROM jetnity_internal.security_event_producer_quota q
   WHERE q.id = 'tracked_producer'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'security_event dev quota missing'
      USING ERRCODE = 'P0001';
  END IF;
  SELECT count(*)
    INTO remaining
    FROM jetnity_internal.security_event_producer_origin o;
  UPDATE jetnity_internal.security_event_producer_quota
     SET used = remaining
   WHERE id = 'tracked_producer';
  RETURN remaining;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_trigger_fault()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  spec record;
  trig record;
  seen integer := 0;
  name_count integer;
  fn_count integer;
  fn_oid oid;
  predicate text;
BEGIN
  FOR spec IN
    SELECT *
      FROM (
        VALUES
          (
            'security_event_dev_v1_blocked_ins_del'::text,
            'public'::text,
            'blocked_ips'::text,
            13::smallint,
            'security_event_dev_on_blocked_ips'::text,
            NULL::text
          ),
          (
            'security_event_dev_v1_blocked_upd',
            'public',
            'blocked_ips',
            17::smallint,
            'security_event_dev_on_blocked_ips',
            'CREATE TRIGGER security_event_dev_v1_blocked_upd AFTER UPDATE ON public.blocked_ips FOR EACH ROW WHEN (old.* IS DISTINCT FROM new.*) EXECUTE FUNCTION jetnity_internal.security_event_dev_on_blocked_ips()'
          ),
          (
            'security_event_dev_v1_event_delete_begin',
            'public',
            'security_events',
            10::smallint,
            'security_event_dev_event_delete_begin',
            NULL::text
          ),
          (
            'security_event_dev_v1_event_delete_account',
            'public',
            'security_events',
            8::smallint,
            'security_event_dev_event_delete_account',
            NULL::text
          ),
          (
            'security_event_dev_v1_origin_delete',
            'jetnity_internal',
            'security_event_producer_origin',
            9::smallint,
            'security_event_dev_on_origin_delete',
            NULL::text
          )
      ) AS expected(tgname, nspname, relname, tgtype, proname, expected_def)
  LOOP
    SELECT count(*)
      INTO name_count
      FROM pg_catalog.pg_trigger t
     WHERE NOT t.tgisinternal
       AND t.tgname = spec.tgname;
    IF name_count = 0 THEN
      CONTINUE;
    END IF;
    IF name_count > 1 THEN
      RETURN 'ambiguous:' || spec.tgname;
    END IF;
    SELECT t.oid, t.tgfoid, t.tgenabled, t.tgtype, t.tgattr, t.tgqual, n.nspname, c.relname
      INTO trig
      FROM pg_catalog.pg_trigger t
      JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE NOT t.tgisinternal
       AND t.tgname = spec.tgname;
    seen := seen + 1;
    IF trig.tgenabled IS DISTINCT FROM 'O' THEN
      RETURN 'disabled:' || spec.tgname;
    END IF;
    IF trig.nspname IS DISTINCT FROM spec.nspname OR trig.relname IS DISTINCT FROM spec.relname THEN
      RETURN 'relation:' || spec.tgname;
    END IF;
    SELECT count(*), min(p.oid)
      INTO fn_count, fn_oid
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace fn_ns ON fn_ns.oid = p.pronamespace
     WHERE fn_ns.nspname = 'jetnity_internal'
       AND p.proname = spec.proname
       AND pg_catalog.pg_get_function_identity_arguments(p.oid) = '';
    IF fn_count IS DISTINCT FROM 1 THEN
      RETURN 'ambiguous-function:' || spec.proname;
    END IF;
    IF trig.tgfoid IS DISTINCT FROM fn_oid THEN
      RETURN 'function:' || spec.tgname;
    END IF;
    IF trig.tgtype IS DISTINCT FROM spec.tgtype THEN
      RETURN 'timing:' || spec.tgname;
    END IF;
    IF pg_catalog.cardinality(trig.tgattr::smallint[]) IS DISTINCT FROM 0 THEN
      RETURN 'columns:' || spec.tgname;
    END IF;
    IF spec.expected_def IS NOT NULL THEN
      predicate := pg_catalog.pg_get_triggerdef(trig.oid, true);
      IF predicate IS DISTINCT FROM spec.expected_def THEN
        RETURN 'predicate:' || spec.tgname;
      END IF;
    ELSIF trig.tgqual IS NOT NULL THEN
      RETURN 'predicate:' || spec.tgname;
    END IF;
  END LOOP;

  IF seen = 0 THEN
    IF EXISTS (
      SELECT 1
        FROM pg_catalog.pg_trigger t
       WHERE NOT t.tgisinternal
         AND t.tgname LIKE 'security_event_dev_v1_%'
    ) THEN
      RETURN 'unexpected';
    END IF;
    RETURN 'absent';
  END IF;
  IF seen <> 5 OR EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger t
     WHERE NOT t.tgisinternal
       AND t.tgname LIKE 'security_event_dev_v1_%'
       AND t.tgname NOT IN (
         'security_event_dev_v1_blocked_ins_del',
         'security_event_dev_v1_blocked_upd',
         'security_event_dev_v1_event_delete_begin',
         'security_event_dev_v1_event_delete_account',
         'security_event_dev_v1_origin_delete'
       )
  ) THEN
    RETURN 'unexpected';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_catalog_fault()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rel record;
  role_name text;
  priv text;
BEGIN
  FOR rel IN
    SELECT n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relowner
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE (n.nspname, c.relname) IN (
       ('jetnity_internal', 'security_event_dev_control'),
       ('jetnity_internal', 'security_event_producer_quota'),
       ('jetnity_internal', 'security_event_producer_origin')
     )
  LOOP
    IF rel.relrowsecurity IS NOT TRUE THEN
      RETURN 'rls:' || rel.relname;
    END IF;
    IF rel.relforcerowsecurity IS TRUE THEN
      RETURN 'force-rls:' || rel.relname;
    END IF;
    IF rel.relowner IS DISTINCT FROM (
      SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname = current_user
    ) THEN
      RETURN 'owner:' || rel.relname;
    END IF;
    IF EXISTS (
      SELECT 1
        FROM pg_catalog.pg_policy pol
        JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = rel.nspname
         AND c.relname = rel.relname
    ) THEN
      RETURN 'policy:' || rel.relname;
    END IF;
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
    LOOP
      FOREACH priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
      LOOP
        IF pg_catalog.has_table_privilege(
          role_name,
          pg_catalog.format('%I.%I', rel.nspname, rel.relname),
          priv
        ) THEN
          RETURN 'grant:' || rel.relname;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  IF (
    SELECT count(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE (n.nspname, c.relname) IN (
       ('jetnity_internal', 'security_event_dev_control'),
       ('jetnity_internal', 'security_event_producer_quota'),
       ('jetnity_internal', 'security_event_producer_origin')
     )
  ) <> 3 THEN
    RETURN 'missing-relation';
  END IF;

  FOREACH role_name IN ARRAY ARRAY['public', 'anon', 'authenticated', 'service_role']
  LOOP
    IF pg_catalog.has_function_privilege(role_name, 'jetnity_internal.security_event_dev_cleanup(text)', 'EXECUTE')
       OR pg_catalog.has_function_privilege(role_name, 'jetnity_internal.security_event_dev_activate()', 'EXECUTE')
       OR pg_catalog.has_function_privilege(role_name, 'jetnity_internal.security_event_dev_prepare_rollback()', 'EXECUTE')
       OR pg_catalog.has_schema_privilege(role_name, 'jetnity_internal', 'USAGE') THEN
      RETURN 'privilege:' || role_name;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_activate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  producer_state text;
  success_at timestamptz;
  success_kind text;
  quota_used integer;
  quota_cap integer;
  retained bigint;
  trigger_fault text;
  catalog_fault text;
  native_ok boolean;
  cron_zone text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'security_event dev pg_cron missing'
      USING ERRCODE = 'P0001';
  END IF;
  IF jetnity_internal.security_event_dev_timezone_is_utc() IS NOT TRUE THEN
    RAISE EXCEPTION 'security_event dev timezone offset must be UTC'
      USING ERRCODE = 'P0001';
  END IF;
  cron_zone := pg_catalog.current_setting('cron.timezone', true);
  IF cron_zone IS NOT NULL
     AND cron_zone <> ''
     AND cron_zone NOT IN ('UTC', 'Etc/UTC', 'GMT') THEN
    RAISE EXCEPTION 'security_event dev cron.timezone is not UTC'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT c.state, c.last_success_at, c.last_success_kind
    INTO producer_state, success_at, success_kind
    FROM jetnity_internal.security_event_dev_control c
   WHERE c.id = 'dev_v1'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'security_event dev control missing'
      USING ERRCODE = 'P0001';
  END IF;

  catalog_fault := jetnity_internal.security_event_dev_catalog_fault();
  IF catalog_fault IS NOT NULL THEN
    RAISE EXCEPTION 'security_event dev catalog contract %', catalog_fault
      USING ERRCODE = 'P0001';
  END IF;

  trigger_fault := jetnity_internal.security_event_dev_trigger_fault();
  IF producer_state = 'active' AND trigger_fault IS NULL THEN
    NULL;
  ELSIF producer_state = 'dormant' AND trigger_fault = 'absent' THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'security_event dev trigger contract %', COALESCE(trigger_fault, 'state')
      USING ERRCODE = 'P0001';
  END IF;

  SELECT q.used, q.cap
    INTO quota_used, quota_cap
    FROM jetnity_internal.security_event_producer_quota q
   WHERE q.id = 'tracked_producer'
   FOR UPDATE;
  IF NOT FOUND OR quota_cap IS DISTINCT FROM 1000 THEN
    RAISE EXCEPTION 'security_event dev quota invalid'
      USING ERRCODE = 'P0001';
  END IF;
  SELECT count(*)
    INTO retained
    FROM jetnity_internal.security_event_producer_origin o;
  IF retained IS DISTINCT FROM quota_used THEN
    RAISE EXCEPTION 'security_event dev quota drifted'
      USING ERRCODE = 'P0001';
  END IF;

  IF jetnity_internal.security_event_dev_health_state() IS DISTINCT FROM 'healthy' THEN
    RAISE EXCEPTION 'security_event dev cleanup health is not healthy'
      USING ERRCODE = 'P0001';
  END IF;
  IF success_kind IS DISTINCT FROM 'scheduled'
     OR success_at IS NULL
     OR success_at < pg_catalog.clock_timestamp() - interval '2 hours' THEN
    RAISE EXCEPTION 'security_event dev activation requires a fresh scheduled cleanup'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM cron.job j
      JOIN cron.job_run_details d ON d.jobid = j.jobid
     WHERE j.jobname = jetnity_internal.security_event_dev_job_name()
       AND j.schedule = jetnity_internal.security_event_dev_job_schedule()
       AND j.command = jetnity_internal.security_event_dev_job_command()
       AND j.active IS TRUE
       AND d.status = 'succeeded'
       AND d.command = jetnity_internal.security_event_dev_job_command()
       AND d.end_time IS NOT NULL
       AND d.end_time >= pg_catalog.clock_timestamp() - interval '2 hours'
  )
    INTO native_ok;
  IF native_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'security_event dev native scheduled run evidence missing'
      USING ERRCODE = 'P0001';
  END IF;

  IF producer_state = 'dormant' THEN
    CREATE TRIGGER security_event_dev_v1_blocked_ins_del
      AFTER INSERT OR DELETE ON public.blocked_ips
      FOR EACH ROW
      EXECUTE FUNCTION jetnity_internal.security_event_dev_on_blocked_ips();

    CREATE TRIGGER security_event_dev_v1_blocked_upd
      AFTER UPDATE ON public.blocked_ips
      FOR EACH ROW
      WHEN (OLD IS DISTINCT FROM NEW)
      EXECUTE FUNCTION jetnity_internal.security_event_dev_on_blocked_ips();

    CREATE TRIGGER security_event_dev_v1_event_delete_begin
      BEFORE DELETE ON public.security_events
      FOR EACH STATEMENT
      EXECUTE FUNCTION jetnity_internal.security_event_dev_event_delete_begin();

    CREATE TRIGGER security_event_dev_v1_event_delete_account
      AFTER DELETE ON public.security_events
      FOR EACH STATEMENT
      EXECUTE FUNCTION jetnity_internal.security_event_dev_event_delete_account();

    CREATE TRIGGER security_event_dev_v1_origin_delete
      AFTER DELETE ON jetnity_internal.security_event_producer_origin
      FOR EACH ROW
      EXECUTE FUNCTION jetnity_internal.security_event_dev_on_origin_delete();
    trigger_fault := jetnity_internal.security_event_dev_trigger_fault();
    IF trigger_fault IS NOT NULL THEN
      RAISE EXCEPTION 'security_event dev trigger contract %', trigger_fault
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE jetnity_internal.security_event_dev_control
     SET state = 'active',
         activated_at = COALESCE(activated_at, pg_catalog.clock_timestamp())
   WHERE id = 'dev_v1';
  UPDATE jetnity_internal.security_event_producer_quota
     SET enabled = true
   WHERE id = 'tracked_producer';
END;
$$;

CREATE OR REPLACE FUNCTION jetnity_internal.security_event_dev_prepare_rollback()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET lock_timeout = '4s'
AS $$
DECLARE
  job_row record;
BEGIN
  LOCK TABLE public.blocked_ips IN ACCESS EXCLUSIVE MODE;

  UPDATE jetnity_internal.security_event_dev_control
     SET state = 'dormant'
   WHERE id = 'dev_v1';

  PERFORM e.id
    FROM public.security_events e
    JOIN jetnity_internal.security_event_producer_origin o ON o.event_id = e.id
   ORDER BY e.id
   FOR UPDATE OF e;

  DELETE FROM public.security_events e
   USING jetnity_internal.security_event_producer_origin o
   WHERE e.id = o.event_id;

  UPDATE jetnity_internal.security_event_producer_quota
     SET enabled = false
   WHERE id = 'tracked_producer';

  IF EXISTS (SELECT 1 FROM jetnity_internal.security_event_producer_origin) THEN
    RAISE EXCEPTION 'security_event dev rollback left provenance rows'
      USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM jetnity_internal.security_event_producer_quota q
     WHERE q.id = 'tracked_producer'
       AND q.used <> 0
  ) THEN
    RAISE EXCEPTION 'security_event dev rollback left quota'
      USING ERRCODE = 'P0001';
  END IF;

  DROP TRIGGER IF EXISTS security_event_dev_v1_blocked_ins_del ON public.blocked_ips;
  DROP TRIGGER IF EXISTS security_event_dev_v1_blocked_upd ON public.blocked_ips;
  DROP TRIGGER IF EXISTS security_event_dev_v1_event_delete_begin ON public.security_events;
  DROP TRIGGER IF EXISTS security_event_dev_v1_event_delete_account ON public.security_events;
  DROP TRIGGER IF EXISTS security_event_dev_v1_origin_delete ON jetnity_internal.security_event_producer_origin;

  FOR job_row IN
    SELECT j.jobid, j.command, j.schedule
      FROM cron.job j
     WHERE j.jobname = jetnity_internal.security_event_dev_job_name()
  LOOP
    IF job_row.command IS DISTINCT FROM jetnity_internal.security_event_dev_job_command()
       OR job_row.schedule IS DISTINCT FROM jetnity_internal.security_event_dev_job_schedule() THEN
      RAISE EXCEPTION 'security_event dev rollback refused an unrelated cron command'
        USING ERRCODE = 'P0001';
    END IF;
    PERFORM cron.unschedule(job_row.jobid);
    DELETE FROM cron.job_run_details d
     WHERE d.jobid = job_row.jobid;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION jetnity_internal.security_event_dev_on_blocked_ips() IS
  'Trigger-only mutation producer. Not a client RPC. No-actor calls return without an event.';
COMMENT ON FUNCTION jetnity_internal.security_event_dev_cleanup(text) IS
  'Fixed 7-day provenance expiry plus this job''s terminal history. kind classifies the stamp; it is not a retention control.';
COMMENT ON FUNCTION jetnity_internal.security_event_dev_activate() IS
  'Attaches the full contract only after limits, ACL prerequisites, quota coherence, fresh scheduled health, and cron run evidence.';
COMMENT ON FUNCTION jetnity_internal.security_event_dev_prepare_rollback() IS
  'Quiesce this producer, delete only its provenance rows, and unschedule only its matching job.';

REVOKE ALL ON FUNCTION jetnity_internal.security_event_is_dev_produced(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_health_state() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_event_delete_begin() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_event_delete_account() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_on_origin_delete() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_on_blocked_ips() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_cleanup(text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_repair_quota() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_activate() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_prepare_rollback() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_trigger_fault() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION jetnity_internal.security_event_dev_catalog_fault() FROM PUBLIC, anon, authenticated, service_role;

-- Scheduling is part of dormant install so a later native run can exist
-- before any producer trigger is attached. Same-name cron.schedule replaces
-- a job; this block never calls it when a visible row already differs.
DO $schedule$
DECLARE
  job_count integer;
  existing_command text;
  existing_schedule text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'security_event dev requires the existing pg_cron extension'
      USING ERRCODE = 'P0001';
  END IF;
  IF jetnity_internal.security_event_dev_timezone_is_utc() IS NOT TRUE THEN
    RAISE EXCEPTION 'security_event dev database timezone offset must be UTC'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*), min(j.command), min(j.schedule)
    INTO job_count, existing_command, existing_schedule
    FROM cron.job j
   WHERE j.jobname = jetnity_internal.security_event_dev_job_name();

  IF job_count > 1
     OR (
       job_count = 1
       AND (
         existing_command IS DISTINCT FROM jetnity_internal.security_event_dev_job_command()
         OR existing_schedule IS DISTINCT FROM jetnity_internal.security_event_dev_job_schedule()
       )
     ) THEN
    RAISE EXCEPTION 'security_event dev cron job name collision'
      USING ERRCODE = 'P0001';
  END IF;

  IF job_count = 0 THEN
    PERFORM cron.schedule(
      jetnity_internal.security_event_dev_job_name(),
      jetnity_internal.security_event_dev_job_schedule(),
      jetnity_internal.security_event_dev_job_command()
    );
  END IF;
END
$schedule$;

-- A re-run may observe an already active producer. It must not detach it
-- and must not treat that state as a successful dormant attach.
DO $dormant$
DECLARE
  producer_state text;
  trigger_fault text;
BEGIN
  SELECT c.state
    INTO producer_state
    FROM jetnity_internal.security_event_dev_control c
   WHERE c.id = 'dev_v1';
  trigger_fault := jetnity_internal.security_event_dev_trigger_fault();
  IF producer_state = 'dormant' AND trigger_fault IS DISTINCT FROM 'absent' THEN
    RAISE EXCEPTION 'security_event dev dormant install found producer triggers'
      USING ERRCODE = 'P0001';
  END IF;
  IF producer_state = 'active' AND trigger_fault IS NOT NULL THEN
    RAISE EXCEPTION 'security_event dev re-run found a half-configured producer'
      USING ERRCODE = 'P0001';
  END IF;
END
$dormant$;

COMMIT;
