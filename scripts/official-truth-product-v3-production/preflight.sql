BEGIN;
SET TRANSACTION READ ONLY;
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

-- Read-only provider preflight. The core installer uses built-in PG17 crypto;
-- cron/Vault/pgcrypto are required before the separate scheduler installation.
DO $production_provider_preflight$
BEGIN
  IF current_setting('ssl') IS DISTINCT FROM 'on'
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4' AND extnamespace='pg_catalog'::regnamespace)
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='supabase_vault' AND extversion='0.3.1')
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pgcrypto' AND extversion='1.3')
    OR current_setting('cron.database_name',true) IS DISTINCT FROM 'postgres'
    OR current_setting('cron.log_run',true) IS DISTINCT FROM 'on'
    OR to_regclass('cron.job') IS NULL OR to_regclass('cron.job_run_details') IS NULL THEN
    RAISE EXCEPTION 'production provider scheduler prerequisites required' USING ERRCODE='P7921'; END IF;
END $production_provider_preflight$;
SELECT jsonb_build_object('schema',1,'target','qscbgcdmivbbnzrcyegn','core','unused',
  'pg17',current_setting('server_version'),'providerPrerequisites','present',
  'pgNetInstalled',EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net'),
  'remoteIdentity','requires_independent_connector_and_tls_host_proof',
  'ownerApproval','not_created','sourceImport','not_started') AS production_preflight;

ROLLBACK;
