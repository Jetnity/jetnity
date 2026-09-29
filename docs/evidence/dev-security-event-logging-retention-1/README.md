# Evidence classification — Development security-event retention 1

| Class | Result |
| --- | --- |
| SOURCE | SQL, runner, and CI guard are in the branch. Hashes are in the runbook. |
| LOCAL SYNTHETIC EXECUTION | `local-execution.json` on PostgreSQL 16.15: 63 passed, 0 failed, acceptance `not_run` 0. `local-execution-pg17.json` on PostgreSQL 17.11: 63 passed, 0 failed. The PostgreSQL 17 run rejects a shadow-schema function, a column `WHEN`, an `UPDATE OF` trigger, and a duplicate trigger name, then records one reason-only update after restore. Identities are fixed synthetic UUIDs. No account, IP, token, or credential is stored. |
| HOSTED DEVELOPMENT | NOT RUN. The Technical Lead read hosted PostgreSQL 17.6. This writer did not connect to it. Local 17.11 is not that server. |
| NATIVE SCHEDULED | NOT RUN. The local activate step inserts `cron.job_run_details.return_message = LOCAL_FIXTURE_NOT_HOSTED_NATIVE`. That fixture is not a pg_cron worker run. |
| PRODUCTION | NOT RUN. Production ref is excluded. No hosted connection was opened. |

The #494 regression was re-run on its own disposable database `jetnity_security_events_producer_lokal`: 67/67, including one real two-session wait. That harness was not modified.
