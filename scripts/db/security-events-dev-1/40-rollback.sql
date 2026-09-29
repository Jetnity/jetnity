-- Scoped rollback for this Development producer.
--
-- Quiesces only this contract, deletes only provenance-owned event rows,
-- unschedules only the matching cleanup job, and drops only the objects
-- created by 10-install-dormant.sql. It does not reset the database, drop
-- pg_cron, or use DROP SCHEMA ... CASCADE.
--
-- blocked_ips source rows, legacy security_events rows, profiles, and
-- unrelated cron jobs stay in place.

BEGIN;

SELECT jetnity_internal.security_event_dev_prepare_rollback();

DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_prepare_rollback();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_activate();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_repair_quota();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_cleanup(text);
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_on_blocked_ips();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_on_origin_delete();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_event_delete_account();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_event_delete_begin();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_health_state();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_is_dev_produced(uuid);
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_timezone_is_utc();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_cap();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_health_max_age();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_retention();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_job_command();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_job_schedule();
DROP FUNCTION IF EXISTS jetnity_internal.security_event_dev_job_name();

DROP TABLE IF EXISTS jetnity_internal.security_event_producer_origin;
DROP TABLE IF EXISTS jetnity_internal.security_event_producer_quota;
DROP TABLE IF EXISTS jetnity_internal.security_event_dev_control;

DO $empty$
DECLARE
  relations integer;
  routines integer;
BEGIN
  SELECT count(*)
    INTO relations
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'jetnity_internal'
     AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f');
  SELECT count(*)
    INTO routines
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'jetnity_internal';
  IF relations <> 0 OR routines <> 0 THEN
    RAISE EXCEPTION 'security_event dev rollback left internal objects'
      USING ERRCODE = 'P0001';
  END IF;
  DROP SCHEMA jetnity_internal;
END
$empty$;

COMMIT;
