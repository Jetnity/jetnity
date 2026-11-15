SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='2s';
DO $production_preflight$
DECLARE creator pg_roles%ROWTYPE;
BEGIN
  -- This acknowledgement cannot identify a remote server. The operator must
  -- separately prove the fixed connector/project/TLS host before sending SQL.
  IF current_setting('jetnity.production_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:INSTALL1'
    OR session_user<>'postgres' OR current_user<>session_user OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17 OR current_setting('server_encoding')<>'UTF8'
    OR current_setting('transaction_isolation')<>'read committed'
    OR current_setting('createrole_self_grant')<>'' THEN
    RAISE EXCEPTION 'production fixed target and PG17 Creator context required' USING ERRCODE='P7921'; END IF;
  SELECT * INTO STRICT creator FROM pg_roles WHERE rolname='postgres';
  IF creator.rolsuper OR NOT creator.rolcanlogin OR NOT creator.rolinherit OR NOT creator.rolcreatedb
    OR NOT creator.rolcreaterole OR NOT creator.rolbypassrls
    OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE oid=10 AND rolsuper)
    OR NOT EXISTS(SELECT 1 FROM pg_database WHERE datname=current_database() AND datdba=creator.oid AND encoding=6)
    OR EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid=creator.oid)
    OR (SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated','authenticator','service_role','supabase_auth_admin','supabase_read_only_user'))<>6
    OR EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_has_role(r.oid,creator.oid,'SET') OR pg_has_role(r.oid,creator.oid,'USAGE'))) THEN
    RAISE EXCEPTION 'production original managed role boundary required' USING ERRCODE='P7921'; END IF;
  IF to_regclass('public.profiles') IS NULL OR to_regclass('auth.users') IS NULL OR to_regclass('auth.sessions') IS NULL
    OR to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('auth.jwt()') IS NULL THEN
    RAISE EXCEPTION 'production existing auth/profile prerequisites required' USING ERRCODE='P7921'; END IF;
  IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='jetnity_ot_auth' OR nspname LIKE 'official\_v3\_%' ESCAPE '\')
    OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname LIKE 'ot\_v3\_%' ESCAPE '\')
    OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND (p.proname LIKE 'official\_v3\_%' ESCAPE '\' OR p.proname='profil_autoritaet_integritaet_pruefen_v1'))
    OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.profiles'::regclass AND tgname='profiles_autoritaet_integritaet_v1') THEN
    RAISE EXCEPTION 'production fresh installation only; adoption or reinstallation refused' USING ERRCODE='P7921'; END IF;
END $production_preflight$;
