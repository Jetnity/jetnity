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
