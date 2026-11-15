-- Separate Production approval required. No request, job or key is created here.
-- Fixed available provider: supabase/pg_net v0.19.5, commit
-- a7792bfd913c7859e14025d606624982706c2a7f. Never drop/reinstall another provider.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
DO $provider$
BEGIN
  IF session_user<>'postgres' OR current_user<>'postgres' OR current_database()<>'postgres'
    OR current_setting('server_version_num')::integer/10000<>17
    OR current_setting('jetnity.prod_import_target',true) IS DISTINCT FROM 'production:qscbgcdmivbbnzrcyegn:refresh1'
    OR current_setting('pg_net.database_name',true) IS DISTINCT FROM 'postgres'
    OR NOT ('pg_net'=ANY(regexp_split_to_array(current_setting('shared_preload_libraries'),E'\\s*,\\s*')))
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron' AND extversion='1.6.4')
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='supabase_vault' AND extversion='0.3.1')
    OR NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pgcrypto' AND extversion='1.3' AND extnamespace='extensions'::regnamespace)
    OR NOT EXISTS(SELECT 1 FROM pg_available_extension_versions WHERE name='pg_net' AND version='0.19.5')
    OR EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net') OR to_regnamespace('net') IS NOT NULL THEN
    RAISE EXCEPTION 'exact uninstalled Production pg_net prerequisites required';
  END IF;
END $provider$;
CREATE EXTENSION pg_net WITH SCHEMA extensions VERSION '0.19.5';
DO $verify$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_net' AND extversion='0.19.5' AND extnamespace='extensions'::regnamespace)
    OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
    OR to_regprocedure('net.check_worker_is_up()') IS NULL
    OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='net.http_post(text,jsonb,jsonb,jsonb,integer)'::regprocedure
      AND prorettype='bigint'::regtype AND proargnames=ARRAY['url','body','params','headers','timeout_milliseconds'])
    OR (SELECT jsonb_object_agg(a.attname,format_type(a.atttypid,a.atttypmod)) FROM pg_attribute a
      WHERE a.attrelid='net._http_response'::regclass AND a.attnum>0 AND NOT a.attisdropped)
      IS DISTINCT FROM '{"id":"bigint","status_code":"integer","content_type":"text","headers":"jsonb","content":"text","timed_out":"boolean","error_msg":"text","created":"timestamp with time zone"}'::jsonb THEN
    RAISE EXCEPTION 'installed Production pg_net API readback refused';
  END IF;
END $verify$;
COMMIT;
