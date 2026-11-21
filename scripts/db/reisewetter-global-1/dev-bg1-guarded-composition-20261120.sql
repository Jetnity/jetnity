-- IMPORTANT: single atomic Supabase DEV migration. Do not apply individually or to Production.
-- Source: scripts/db/reisewetter-global-1/quota-candidate.sql on main;
-- candidate implementation below is copied UNMODIFIED and guarded by exact Dev
-- fingerprints + current BG1 before/after + deny-by-default ACL post-verification.

-- DEV-ONLY reviewed composition. In Production, this intentionally fails because
-- its two DEV-only migration fingerprints are absent. This is NOT a Production
-- migration or a new authorization method.
DO $weather_dev_bg1_pre$
BEGIN
  IF current_user <> 'postgres'
    OR current_setting('server_version_num')::int < 170000 THEN
    RAISE EXCEPTION 'weather_dev_requires_protected_pg17_postgres';
  END IF;
  IF (SELECT count(*) FROM supabase_migrations.schema_migrations
      WHERE name = 'jetnity_global_206x50_research_scope_dev_20261118') <> 1
    OR (SELECT count(*) FROM supabase_migrations.schema_migrations
      WHERE name = 'jetnity_global_six_source_cadence_v2_dev_20261118') <> 1 THEN
    RAISE EXCEPTION 'weather_dev_requires_two_dev_only_fingerprints';
  END IF;
  IF to_regprocedure('public.reisewetter_reservieren_v1()') IS NOT NULL
    OR to_regclass('jetnity_weather_private.reservations_v1') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='jetnity_weather_private') THEN
    RAISE EXCEPTION 'weather_dev_already_installed';
  END IF;
  IF to_regclass('auth.users') IS NULL OR to_regclass('auth.sessions') IS NULL
    OR to_regprocedure('auth.uid()') IS NULL
    OR to_regprocedure('auth.jwt()') IS NULL
    OR NOT EXISTS(
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='official_v3_guard_private' AND p.proname='require_open_v1'
        AND p.prosecdef
    ) THEN
    RAISE EXCEPTION 'weather_dev_missing_bg1_or_auth_trust_dependencies';
  END IF;
  -- Existing immutable BG1 guard must already be CURRENT before Dev install.
  PERFORM official_v3_guard_private.require_open_v1();
END $weather_dev_bg1_pre$;

-- UNAPPLIED. This body belongs inside the separately reviewed BG1 composition.
-- It must never be run independently against an existing protected database.
CREATE SCHEMA jetnity_weather_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA jetnity_weather_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE jetnity_weather_private.reservations_v1 (
  reservation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid NOT NULL,
  reserved_at timestamptz NOT NULL CHECK(isfinite(reserved_at))
);
ALTER TABLE jetnity_weather_private.reservations_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetnity_weather_private.reservations_v1 FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON jetnity_weather_private.reservations_v1 TO postgres USING(true) WITH CHECK(true);
REVOKE ALL ON jetnity_weather_private.reservations_v1 FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX weather_reserved_at_v1 ON jetnity_weather_private.reservations_v1(reserved_at);
CREATE INDEX weather_actor_time_v1 ON jetnity_weather_private.reservations_v1(actor,reserved_at);

CREATE FUNCTION public.reisewetter_reservieren_v1() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog
SET statement_timeout='2500ms' SET lock_timeout='1500ms' AS $weather_quota$
DECLARE who uuid; claims jsonb; session_value uuid; instant timestamptz;
  total_minute integer; total_day integer; actor_minute integer; actor_day integer;
BEGIN
  -- Caller identity is supplied only by normal PostgREST verified JWT handling.
  -- No actor, budget, clock, key or role can be supplied as a function argument.
  claims:=auth.jwt(); who:=auth.uid();
  IF current_setting('role',true) IS DISTINCT FROM 'authenticated'
    OR who IS NULL OR claims->>'role' IS DISTINCT FROM 'authenticated'
    OR COALESCE(claims->>'is_anonymous','false')<>'false'
    OR COALESCE(claims->>'exp','') !~ '^[0-9]{1,12}$'
    OR COALESCE(claims->>'session_id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'weather admission unavailable' USING ERRCODE='42501';
  END IF;
  session_value:=(claims->>'session_id')::uuid;
  IF (claims->>'exp')::bigint <= extract(epoch FROM clock_timestamp())
    OR NOT EXISTS(SELECT 1 FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
      WHERE s.id=session_value AND s.user_id=who
        AND ((to_jsonb(s)->>'not_after') IS NULL OR (to_jsonb(s)->>'not_after')::timestamptz>clock_timestamp())
        AND (to_jsonb(u)->>'deleted_at') IS NULL
        AND COALESCE(to_jsonb(u)->>'is_anonymous','false')='false'
        AND ((to_jsonb(u)->>'banned_until') IS NULL
          OR (to_jsonb(u)->>'banned_until')::timestamptz<=clock_timestamp())) THEN
    RAISE EXCEPTION 'weather admission unavailable' USING ERRCODE='42501';
  END IF;
  PERFORM official_v3_guard_private.require_open_v1();
  -- This single database lock serializes all replicas, regions and accounts.
  -- READ COMMITTED + VOLATILE ensures the post-lock queries see prior commits.
  PERFORM pg_advisory_xact_lock(17012026,1215);
  instant:=clock_timestamp();
  IF EXISTS(SELECT 1 FROM jetnity_weather_private.reservations_v1 WHERE reserved_at>instant) THEN
    RAISE EXCEPTION 'weather clock unavailable' USING ERRCODE='55000';
  END IF;
  DELETE FROM jetnity_weather_private.reservations_v1 WHERE reserved_at < instant-interval '24 hours';
  SELECT count(*) FILTER(WHERE reserved_at>=instant-interval '1 minute'),count(*),
    count(*) FILTER(WHERE actor=who AND reserved_at>=instant-interval '1 minute'),
    count(*) FILTER(WHERE actor=who)
  INTO total_minute,total_day,actor_minute,actor_day FROM jetnity_weather_private.reservations_v1;
  IF total_minute>=45 OR total_day>=1000 OR actor_minute>=10 OR actor_day>=120 THEN
    RETURN jsonb_build_object('schema',1,'allowed',false,'retryAfterSec',
      CASE WHEN total_day>=1000 OR actor_day>=120 THEN 86400 ELSE 60 END);
  END IF;
  INSERT INTO jetnity_weather_private.reservations_v1(actor,reserved_at) VALUES(who,instant);
  PERFORM official_v3_guard_private.require_open_v1();
  RETURN jsonb_build_object('schema',1,'allowed',true,'retryAfterSec',0);
END $weather_quota$;
REVOKE ALL ON FUNCTION public.reisewetter_reservieren_v1() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.reisewetter_reservieren_v1() TO authenticated;
COMMENT ON FUNCTION public.reisewetter_reservieren_v1() IS
 'One atomic global weather request reservation. Existing authenticated customer only; fail closed, no refunds or caller clock. No provider credentials.';


DO $weather_dev_bg1_post$
DECLARE fn oid;
BEGIN
  fn := to_regprocedure('public.reisewetter_reservieren_v1()');
  IF fn IS NULL OR NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE oid=fn AND prosecdef AND prorettype='jsonb'::regtype
  ) OR to_regclass('jetnity_weather_private.reservations_v1') IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM pg_class WHERE oid='jetnity_weather_private.reservations_v1'::regclass
        AND relrowsecurity AND relforcerowsecurity
    )
    OR has_schema_privilege('anon','jetnity_weather_private','USAGE')
    OR has_schema_privilege('authenticated','jetnity_weather_private','USAGE')
    OR has_schema_privilege('service_role','jetnity_weather_private','USAGE')
    OR has_table_privilege('anon','jetnity_weather_private.reservations_v1','SELECT')
    OR has_table_privilege('authenticated','jetnity_weather_private.reservations_v1','SELECT')
    OR has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE')
    OR has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.reisewetter_reservieren_v1()','EXECUTE')
    OR (SELECT count(*) FROM jetnity_weather_private.reservations_v1) <> 0
    OR position('official_v3_guard_private.require_open_v1' in pg_get_functiondef(fn)) = 0
  THEN
    RAISE EXCEPTION 'weather_dev_post_install_security_gate_failed';
  END IF;
  -- Re-check existing BG1 proof after weather composition; no bypass or override.
  PERFORM official_v3_guard_private.require_open_v1();
END $weather_dev_bg1_post$;
