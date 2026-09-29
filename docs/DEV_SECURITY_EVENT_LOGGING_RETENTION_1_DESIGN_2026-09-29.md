# Development Security Event Logging and Retention 1 — Design

Date: 29 September 2026
Logical agent: Jetnity development security event logging retention 1, Generation 1
Status: local package only. This is not a hosted apply and not a Technical-Lead PASS.

## What this package is

It reuses the accepted #494 mutation-derived blocklist contract on the existing `security_events` table. Provenance is membership in the private origin ledger `jetnity_internal.security_event_producer_origin`, not the public JSON shape. Event types stay `admin_blocklist_add` for INSERT and real UPDATE, and `admin_blocklist_remove` for DELETE. The actor is `auth.uid()` only. The payload is the fixed object `{surface, result, op}` at most 256 bytes. `ip` and `metadata` stay null. A no-op UPDATE (`OLD IS DISTINCT FROM NEW`) and a zero-row statement emit nothing. A null actor is the disclosed uncovered case: the source write commits and no event is written. Baseline `service_role` ALL on `security_events` is not revoked, so a look-alike insert can still exist and stays untracked.

The new work is the fixed Development lifecycle around that contract: 7-day retention, one hourly pg_cron job, a 1,000-row cap on provenance-owned rows, cleanup health, own-job history bounds, and quota coherence through the existing account-erasure DELETE.

## Dormant install and activation

`10-install-dormant.sql` creates the private schema, control row, quota row, origin table, functions, and at most one collision-checked cron job. It does not attach triggers. Blocklist writes stay unaudited. Re-running the install does not reset health (`ON CONFLICT DO NOTHING`) and does not call `cron.schedule` when an identical job already exists. A different command or schedule, or more than one row with the job name, raises and rolls the install back. `cron.schedule` with the same name would otherwise replace a job.

`20-activate.sql` sets `lock_timeout` and `statement_timeout`, then calls `security_event_dev_activate()` in that same transaction. Activation accepts a dormant producer only when `security_event_dev_trigger_fault()` returns `absent`, and an already active producer only when that function returns null. The fault function requires exactly one non-internal trigger of each expected name. It compares enabled state `O`, relation, `tgfoid` with the single zero-argument function in `jetnity_internal`, `tgtype`, and an empty `tgattr`. The update trigger must deparse, with `search_path` empty, to the whole-row definition `WHEN (old.* IS DISTINCT FROM new.*)` on `AFTER UPDATE` with no `UPDATE OF` column list. A matching unqualified name, a `WHEN` expression that merely contains `IS DISTINCT FROM`, or a nonempty `tgattr` is a fault. A disabled, mis-bound, shadowed, column-restricted, or duplicated trigger fails closed and is not silently recreated. After a dormant attach, the same check must pass before `state` becomes `active`. The earlier name-and-keyword check was not this contract.

Activation also requires the catalog contract: RLS enabled and not forced, no policies, table owner equal to the function owner, and no `USAGE` or table/function privilege for `public`, `anon`, `authenticated`, or `service_role` on this package. It still requires UTC offset 0, `cron.timezone` null/empty/`UTC`/`Etc/UTC`/`GMT`, quota cap 1000 with `used` equal to the origin count, cleanup health `healthy`, `last_success_kind = scheduled` inside 2 hours, and a succeeded `cron.job_run_details` row for the exact job command and schedule inside 2 hours. A manual cleanup stamp is not that row. A superuser can still rewrite triggers after activation. This check does not claim otherwise.

## Clocks

Expiry and health use `clock_timestamp()`. Event `created_at` uses `now()` (transaction timestamp). Both are `timestamptz`. The session timezone offset must be 0. The schedule `0 * * * *` is minute 0 of every hour in that UTC zone. pg_cron deletes on the next successful sweep, not at the exact expiry second. The predicate is `created_at <= clock_timestamp() - interval '7 days'`. The retention interval is hardcoded. There is no `_older_than` argument.

## Quota

`used` is the current retained origin count, never a lifetime admission total. Admission locks the actor `auth.users` row `FOR SHARE`, then the control row `FOR UPDATE`, then the quota row `FOR UPDATE`, and increments `used` only when `used + 1 <= cap`. A multi-row statement that would pass the cap rolls the whole statement back. Drift (`used` not equal to the origin count) fails new audited writes until `50-repair-quota.sql` sets `used` to the count, or until a real delete reconciles it. Repair deletes nothing.

Deletion accounting has one site: the AFTER DELETE statement trigger on `security_events` sets `used` to `count(origins)` after FK cascades. Cleanup, rollback, and account erasure only DELETE rows. A per-row decrement was rejected because a BEFORE-row trigger can still see sibling origin rows and strand `used`. Deletes, cleanup, and repair are not blocked by a full cap or by stale/unknown health.

## Account erasure without editing account-delete

`ereignisseLoeschen` still deletes `security_events` by `user_id` and commits before the Auth user row is deleted. That function is not edited. A concurrent mutation can commit a new event after that snapshot. `origin.actor_id` references `auth.users(id)` ON DELETE CASCADE. The origin AFTER DELETE trigger, when it is not already inside an event delete (GUC `jetnity.security_event_dev_deleting_event`), deletes the paired `security_events` row. Auth user deletion therefore clears an event that landed in that interval. The event-delete path sets the GUC in BEFORE STATEMENT and clears it in AFTER STATEMENT so the cascade does not delete twice. A BEFORE origin trigger was rejected: PostgreSQL reported that the tuple to be deleted was already modified.

This is a new private foreign key. There is no new foreign key on `security_events.user_id`.

## Lock order and timeouts

Paths this package controls:

1. `auth.users` actor row `FOR SHARE` on admission.
2. `security_event_dev_control` `FOR UPDATE`.
3. Provenance event rows in `event_id` order for cleanup and rollback.
4. `security_event_producer_quota` `FOR UPDATE`.

Rollback takes `LOCK TABLE blocked_ips ACCESS EXCLUSIVE` first, then the control row, then provenance event rows in `event_id` order, and only then deletes those rows. The delete trigger locks quota after the event locks. Quota `enabled` is cleared after that delete. Account-erasure DELETE cannot be reordered because the Edge Function is not edited. It locks event rows first and the trigger then locks quota. Opposite event-row scan order can still deadlock (`40P01`). The package does not catch that error. The aborted transaction rolls back fully. The caller retries the aborted statement. A caught deadlock is not success.

`statement_timeout` set on a function does not start a deadline for the caller statement that is already running. Operator files and the cron command therefore `SET` `lock_timeout` and `statement_timeout` before the function call. The cron command is `SET lock_timeout = '4s'; SET statement_timeout = '30s'; SELECT jetnity_internal.security_event_dev_cleanup('scheduled')`. Trigger functions still `SET lock_timeout = '4s'`, which is read when they take a lock. A blocklist statement is bounded by the caller's own `statement_timeout`. This package does not claim a second execution cap inside the trigger. Lock timeout `55P03` aborts the waiter and leaves no partial reservation. An outer `statement_timeout` cancels the cleanup statement and rolls the transaction back.

## Cleanup health and history

States are `unknown` (never run), `failing` (latest terminal cron run failed after the last success, or failed with no success), `stale` (success older than 2 hours), and `healthy`. `last_success_at` is stamped only by a committed cleanup. `kind` is `manual` or `scheduled` and is not native proof. Fake initialization is not success. New audited writes require `healthy`, `state = active`, quota enabled, and an active matching cron job.

History deletion removes only this job's terminal rows (`succeeded` or `failed`) whose `end_time` is older than 7 days. Running rows, null `end_time`, and other jobs stay.

## Privileges

Functions are `SECURITY DEFINER` with `search_path` empty, except the timezone helper which uses `search_path = pg_catalog`. `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`, and `service_role`. RLS is enabled on the three private tables with no policies and revoked grants. `jetnity_internal` is not a Data API schema. RLS is not forced, because forcing it would block the non-superuser owner.

The installer must be able to see `cron.job`. pg_cron RLS is `username = current_user`, and the unique key is `(jobname, username)`. The runbook requires the Technical Lead to run as the pg_cron owner. `FOR SHARE` and the foreign key on `auth.users` require the installing role to reference `auth.users`. If the hosted role cannot, stop.

## What this design does not do

It does not close finding 5.2 or Release Gate G. It does not ingest login, MFA, or platform logs. It does not enforce the blocklist on the network. It does not change Auth, AAL, or account-delete. It does not apply itself to Development or Production.
