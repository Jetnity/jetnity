-- Isolated stand-in for BG1 while the renewal rules are exercised.
-- The package test installs the real V6/V8 guards instead of this file.
CREATE FUNCTION official_v3_guard_private.assert_catalog_v1() RETURNS void LANGUAGE plpgsql AS $f$
BEGIN RETURN; END $f$;
CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS bigint LANGUAGE plpgsql AS $f$
BEGIN RETURN 1; END $f$;
CREATE FUNCTION public.official_v3_guard_alarm_status_v1() RETURNS jsonb LANGUAGE sql STABLE
 SET search_path=pg_catalog AS $f$ SELECT jsonb_build_object('schema',1,'status','current') $f$;
