# Evidence classification — Development security-event retention 1

| Class | Result |
| --- | --- |
| SOURCE | SQL, runner, and CI guard are in the branch. Hashes are in the runbook. |
| LOCAL SYNTHETIC EXECUTION | `local-execution.json`. Disposable database `jetnity_security_events_dev_lokal`. 43 passed, 0 failed. Identities are fixed synthetic UUIDs. No account, IP, token, or credential is stored. |
| HOSTED DEVELOPMENT | NOT RUN |
| NATIVE SCHEDULED | NOT RUN. The local activate step inserts `cron.job_run_details.return_message = LOCAL_FIXTURE_NOT_HOSTED_NATIVE`. That fixture is not a pg_cron worker run. |
| PRODUCTION | NOT RUN. Production ref is excluded. No hosted connection was opened. |

The #494 regression was re-run on its own disposable database `jetnity_security_events_producer_lokal`: 67/67, including one real two-session wait. That harness was not modified.
