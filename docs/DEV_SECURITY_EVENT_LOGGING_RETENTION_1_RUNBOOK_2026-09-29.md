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
| `scripts/db/security-events-dev-1/10-install-dormant.sql` | `72e5a2a3608fcc13bfeddc3a7b7f763004fedd8ca6a60d5740039b5118b0d4ee` |
| `scripts/db/security-events-dev-1/20-activate.sql` | `291794591e1c6870bf30a42d7b037f4f79ef53128ca724462ac3b47ae9f049a8` |
| `scripts/db/security-events-dev-1/30-readback.sql` | `b90fe76f7028bedbdaaadafba0ee2b1f040503574a016677f0e4259e9e60f7db` |
| `scripts/db/security-events-dev-1/40-rollback.sql` | `12b03c79224052a748f52b42ade70fd42fc04b28b836767a6561f0a88a718ab8` |
| `scripts/db/security-events-dev-1/50-repair-quota.sql` | `92162a534e688a56f2125de8cb9a3172a916f4f5bfbc04579b7d778d52a989ed` |
| `scripts/db/security-events-dev-1/60-cleanup-manual.sql` | `be7974ac4e6bf3e98afc46794186f7f5f1f8f50c7568392f80925a0b23964dda` |
| `scripts/db/security-events-dev-1-lokal.mjs` | `c1a514ec7f601cd8962e8557356f977bb3157dc946a3d20b86a4b8f4aeedde60` |

## Ordered hosted actions

Run as the pg_cron owner, on the confirmed `develop` target only, one file per transaction boundary already present in the file. Do not paste these files into `supabase/migrations/`. A Git merge is not an apply.

1. Confirm identity in the control plane. Record the ref, branch name `develop`, PostgreSQL version, `TimeZone`, `cron.timezone`, `cron.database_name`, pg_cron version, and that the job name is absent or identical. The dated pre-dispatch read was pg_cron 1.6.4 and 0 jobs. Re-read it. Do not reuse that timestamp as fresh proof.
2. Apply `10-install-dormant.sql`. Read back with `30-readback.sql`. Expect `state = dormant`, `enabled = false`, trigger count 0, health `unknown`, quota `used = 0`, and one job with schedule `0 * * * *` and command `select jetnity_internal.security_event_dev_cleanup('scheduled')`. Blocklist writes must still succeed and stay unaudited.
3. Wait for the pg_cron worker. Do not shorten `0 * * * *`. After a real succeeded run whose `end_time` is inside 2 hours, read back again. `last_success_kind` must be `scheduled` because the job command passes that argument. Health must be `healthy`.
4. Only then apply `20-activate.sql`. Read back. Expect `state = active`, `enabled = true`, and five triggers named `security_event_dev_v1_*`.
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

That command is not in `package.json` and not in CI. It refuses `JETNITY_ALLOW_REMOTE_DB=1` and the listed connection-override variables before it opens a database. A refusal does not drop a database this process did not create. The disposable database name is `jetnity_security_events_dev_lokal` and must already equal local `cron.database_name`.
