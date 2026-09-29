# Development Security Event Logging and Retention 1 — Technical-Lead runbook

Date: 29 September 2026
Audience: ChatGPT / Technical Lead only, after an independent exact-head PASS.
Cursor does not execute this runbook. Production is excluded.

## Stop conditions

Stop, and do not default to any project, when any of these is true:

- The authenticated control-plane branch/ref is missing or is not the existing `develop` branch. `current_database()` and a caller-supplied label are not project identity.
- The target is Production `qscbgcdmivbbnzrcyegn`, or any ref other than the freshly confirmed `develop` ref.
- The SQL SHA256 below does not match the exact reviewed head.
- The installing role cannot see `cron.job` (pg_cron RLS is `username = current_user`) or cannot `SELECT ... FOR SHARE` / reference `auth.users`.
- `cron.database_name` is not already the Development database. Do not change it.
- Session timezone offset is not 0, or `cron.timezone` is set to something other than empty, `UTC`, `Etc/UTC`, or `GMT`.
- A `cron.job` row already uses `jetnity-security-events-dev-cleanup-v1` with a different command or schedule.
- pg_cron is missing. Do not install a new extension tariff or a new database branch to make this pass.
- Activation is attempted before a real pg_cron worker has written a succeeded `cron.job_run_details` row. A manual `security_event_dev_cleanup('manual')` call, an initialized timestamp, or a superuser-inserted fixture row is not that evidence. This SQL cannot tell a hand-inserted run row from a worker row. Observe the worker write.

## Checksums

SHA256 of the files on this delivery. Recompute on the exact head before any hosted statement.

| File | SHA256 |
| --- | --- |
| `scripts/db/security-events-dev-1/10-install-dormant.sql` | `7ff14588b537b414ba207bffebf27c5b2ae9ce7c31136cdfcd70cf05f143fa34` |
| `scripts/db/security-events-dev-1/20-activate.sql` | `371e7f11aca8eca54df14459e792dacdb9a6b1a45287ee87d0f912ecdcf98a84` |
| `scripts/db/security-events-dev-1/30-readback.sql` | `3b5a2485b44d7385f068ac562a50ba390868539400a13116e9a50d827d798a80` |
| `scripts/db/security-events-dev-1/40-rollback.sql` | `827d1c98bca4e5d641f4f6840321987a5ac50d0f49e12c3216e90c9cab8bafcf` |
| `scripts/db/security-events-dev-1/50-repair-quota.sql` | `47622ec05db14e9b9b9d8f950ccd7e0eddd135275352c6503d7df7293f6976f2` |
| `scripts/db/security-events-dev-1/60-cleanup-manual.sql` | `9cdbce4aff1477088870fe2825744aea4b177035ac687474b71b5aa323c35048` |
| `scripts/db/security-events-dev-1-lokal.mjs` | `4add92801576a3bb0e575786f71f240814e4bd9de79e1a24bf578f9d7b03ccc5` |

R2 replaced the R1 checksums for the install SQL and the local runner. The reviewed head `51ad3a384f626505e5973ca69f1894b187a41bc6` is not this package. Recompute before any hosted statement.

## Ordered hosted actions

Run as the pg_cron owner, on the confirmed `develop` target only, one file per transaction boundary already present in the file. Do not paste these files into `supabase/migrations/`. A Git merge is not an apply.

1. Confirm identity in the control plane. Record the ref, branch name `develop`, PostgreSQL version, `TimeZone`, `cron.timezone`, `cron.database_name`, pg_cron version, and that the job name is absent or identical. The dated pre-dispatch read was pg_cron 1.6.4 and 0 jobs. Re-read it. Do not reuse that timestamp as fresh proof.
2. Apply `10-install-dormant.sql`. Read back with `30-readback.sql`. Expect `state = dormant`, `enabled = false`, `trigger_fault = absent`, `catalog_fault` null, health `unknown`, quota `used = 0`, and one job with schedule `0 * * * *`. The job command must be exactly `SET lock_timeout = '4s'; SET statement_timeout = '30s'; SELECT jetnity_internal.security_event_dev_cleanup('scheduled')`. That prefix is the execution budget. A function-local `statement_timeout` is not. Blocklist writes must still succeed and stay unaudited. The readback uses `date_part`, not `pg_catalog.extract(... FROM ...)`.
3. Wait for the pg_cron worker. Do not shorten `0 * * * *`. After a real succeeded run whose `end_time` is inside 2 hours, read back again. `last_success_kind` must be `scheduled` because the job command passes that argument. Health must be `healthy`.
4. Only then apply `20-activate.sql`. Read back. Expect `state = active`, `enabled = true`, `trigger_fault` null, `catalog_fault` null, and five enabled triggers whose `tgfoid` is the `jetnity_internal` function, whose `tgattr` is empty, and whose update trigger deparses to whole-row `WHEN (old.* IS DISTINCT FROM new.*)`. A disabled trigger, a same-named function in another schema, a column `WHEN`, an `UPDATE OF` list, or a duplicate trigger name must fail this step. A name or keyword match is not success.
5. Exercise one synthetic operator blocklist insert and confirm one provenance row, `used = 1`, type `admin_blocklist_add`, null `ip` and `metadata`. Remove that synthetic row through the normal source DELETE or through scoped rollback. Do not use a traveller account.

`60-cleanup-manual.sql` is an operator recovery tool. It stamps `manual`. It does not satisfy step 3.

`50-repair-quota.sql` sets `used` to the origin count. It does not delete rows.

## Rollback

Apply `40-rollback.sql` only. It locks `blocked_ips`, marks the producer dormant and the quota disabled, deletes only provenance-owned events while the delete triggers still exist, asserts origins and `used` are 0, drops only the five triggers, unschedules only a job whose command and schedule match, deletes only that job's history, then drops the listed functions and three tables and `DROP SCHEMA jetnity_internal` only when the schema is empty.

It does not `DROP SCHEMA ... CASCADE`, drop pg_cron, reset the database, or delete `blocked_ips`, legacy `security_events`, look-alike rows, profiles, trips, or other cron jobs.

## After rollback or a later restore

Do not reactivate until a new native scheduled success exists and quota health matches the origin count. This runbook does not implement a restore.

## Local proof command

`node scripts/db/security-events-dev-1-lokal.mjs`

`node scripts/db/security-events-dev-1-lokal.mjs --pg-major=17`

Both commands are local only. They are not in `package.json` and not in CI. Each refuses `JETNITY_ALLOW_REMOTE_DB=1` and the listed connection-override variables before it opens a database. A refusal does not drop a database this process did not create. The disposable database name is `jetnity_security_events_dev_lokal` and must already equal that cluster's `cron.database_name`. `--pg-major` selects a local cluster major and port. It is not a hosted target. The R1 local runs were PostgreSQL 16.15 and PostgreSQL 17.11 with pg_cron 1.6.8. Hosted Development remains PostgreSQL 17.6 in the Technical Lead's read and was not used.
