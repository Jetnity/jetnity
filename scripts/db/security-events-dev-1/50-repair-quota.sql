-- Owner-only quota repair. Sets used to the current origin count.
-- Does not delete legacy rows and does not evict younger events.
-- Not a client RPC and not a retention control.

BEGIN;
SET LOCAL lock_timeout = '4s';
SET LOCAL statement_timeout = '15s';
SELECT jetnity_internal.security_event_dev_repair_quota();
COMMIT;
