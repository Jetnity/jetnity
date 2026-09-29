-- Activate the Development producer.
--
-- Run only after 10-install-dormant.sql has committed on the authenticated
-- Development target. This statement attaches triggers and opens admission
-- in one transaction. It refuses when cleanup health is not a fresh
-- scheduled success or when cron.job_run_details has no matching succeeded
-- row in the last two hours.
--
-- A manual cleanup stamp is not native scheduled-run evidence.
-- Cursor does not execute this file on a hosted database.

BEGIN;
SELECT jetnity_internal.security_event_dev_activate();
COMMIT;
