-- UNAPPLIED PRODUCTION OWNER GATE, 19 November 2026.
-- Legacy cron calls an intentionally removed function (20260817120300_generisches_profil.sql).
-- Execute only with explicit Owner approval, on the verified Production project.
-- The cron is removed, not replaced by a new SECURITY DEFINER function.
BEGIN;
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '10s';
DO $owner_cron_fix$
DECLARE legacy_job record; n integer;
BEGIN
  IF to_regprocedure('public.sync_creator_profile_core()') IS NOT NULL THEN
    RAISE EXCEPTION 'creator core exists: legacy job needs independent review';
  END IF;
  SELECT count(*) INTO n FROM cron.job WHERE jobname = 'sync_profile_emails_hourly';
  IF n <> 1 THEN RAISE EXCEPTION 'expected exactly one orphaned cron, found %', n; END IF;
  SELECT jobid, command, active INTO legacy_job
    FROM cron.job WHERE jobname = 'sync_profile_emails_hourly';
  IF btrim(legacy_job.command) <> 'select public.sync_creator_profile_core();'
     OR legacy_job.active IS NOT TRUE THEN
    RAISE EXCEPTION 'cron command or state changed, review required';
  END IF;
  IF cron.unschedule(legacy_job.jobid) IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'could not unschedule orphaned cron';
  END IF;
  IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='sync_profile_emails_hourly') THEN
    RAISE EXCEPTION 'cron remains after unschedule';
  END IF;
END $owner_cron_fix$;
COMMIT;
