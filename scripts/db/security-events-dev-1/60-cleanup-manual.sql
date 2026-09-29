-- Operator manual cleanup. This stamps last_success_kind = manual.
-- It is not native scheduled-run evidence and cannot by itself activate
-- the producer. Retention stays the fixed 7-day interval inside the function.

BEGIN;
SET LOCAL lock_timeout = '4s';
SET LOCAL statement_timeout = '30s';
SELECT jetnity_internal.security_event_dev_cleanup('manual');
COMMIT;
