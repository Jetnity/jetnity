# Development Security Event Logging and Retention 1 — Self-review

Date: 29 September 2026
This note is the writer's review. It is not an independent Technical-Lead PASS.

## What was checked against the task

- Fixed 7-day retention inside SQL, hourly schedule `0 * * * *`, cap 1000, health window 2 hours, job name `jetnity-security-events-dev-cleanup-v1`.
- Provenance ledger reused from #494. No second logging framework. No `_older_than` client interval.
- Dormant install attaches no triggers. Activation is a separate transaction and refuses unknown health, manual-only success, and a scheduled stamp without a matching cron run row.
- Job-name collision raises and does not call `cron.schedule`.
- Direct event and origin writes by anon, authenticated, and service_role origin insert are denied in the local proof. Existing service_role event insert still succeeds and does not move quota.
- Operator AAL2 insert/update/delete emit the fixed payload. No-op and zero-row updates emit nothing. Null-actor service_role blocklist writes stay unaudited.
- R2 activation identity is `tgfoid` in `jetnity_internal`, empty `tgattr`, and the exact deparsed whole-row update definition. The earlier unqualified-name and `IS DISTINCT FROM` substring check is not that contract. Local PostgreSQL 17 rejects a shadow-schema function, `WHEN (OLD.ip IS DISTINCT FROM NEW.ip)`, `UPDATE OF ip`, and a second trigger with the same name. After restore, a reason-only update emits one event and the repeated write emits none.
- Injected failure and outer rollback leave no reservation.
- Two sessions at 999: one commit, one quota error, `used = 1000`, and the loser waited on `transactionid` / `Lock`.
- Multi-row overflow at 999 stays 999.
- Lock timeout `55P03` aborts the waiter. The prior reservation remains.
- Mixed account-style delete of tracked and legacy rows sets `used` from the remaining origin count once. The other user's tracked row and the look-alike remain.
- A mutation that commits during the erasure interval is removed when `auth.users` is deleted, through the origin foreign key. `account-delete-v1` source is unchanged.
- Cleanup rollback restores quota. Committed expiry leaves the look-alike. Own-job history older than 7 days is deleted. Running, recent, and other-job rows stay.
- Stale, failing, drift, inactive job, and non-UTC offset fail closed for new writes. Repair restores `used` without deleting the look-alike. A full cap does not block account-style deletion.
- Scoped rollback drops only this package, keeps legacy rows, the look-alike, and the other cron job, and restores unaudited blocklist writes.
- SQL lives outside `supabase/migrations/` and is not referenced by `package.json` or CI.
- The runner refuses remote overrides before opening a database, and that refusal no longer drops a disposable database this process did not create.

## Limitations — do not upgrade these

1. Hosted Development apply, a real pg_cron worker run, and Production were not performed. Activation SQL accepts any succeeded `cron.job_run_details` row that matches the job. A superuser can insert that row. The local proof does insert a fixture with `return_message = LOCAL_FIXTURE_NOT_HOSTED_NATIVE`. That is not hosted native evidence.
2. Local pg_cron is 1.6.2. The Technical Lead's hosted read was 1.6.4. No 1.6 SQL delta was found in the local extension file. The binary is still not the hosted binary.
3. The local erasure proof simulates `ereignisseLoeschen` as `service_role` DELETE and simulates Auth deletion as `DELETE FROM auth.users`. The harness has no GoTrue. The Edge Function's two calls are separate transactions. Coherence is each database transaction plus the origin cascade on `auth.users` delete.
4. `service_role` can still insert look-alike `security_events` rows. A superuser can still replace the body of the accepted function OID, or rewrite triggers after a passing activation check. The pre-activation check does not claim immunity to that later rewrite.
5. R1 executed cleanup against account-style deletion on one held event row: both committed and `used` matched origins. A second pair locked the higher event id first and then ran cleanup, which locks ids in ascending order. One transaction aborted with `deadlock detected`. The runner retried only that aborted statement. After the retry, owned rows were gone and `used` matched origins. The SQL still does not catch `40P01`. Other deadlock shapes can still abort and must be retried the same way, not treated as success.
6. Exact 7-day equality was tested with one-minute margins around `clock_timestamp() - interval '7 days'`, not a frozen clock. The predicate is `<=`.
7. If the hosted installer cannot see every `cron.job` row or cannot reference `auth.users`, apply must stop. This package does not grant those rights.
8. `npm test` passed 4048/4048 after the runner change that stops a remote-override refusal from dropping a database this process did not create.
9. No signed-in browser, physical device, or hosted readback was done. None is claimed.
10. Finding 5.2 and Release Gate G stay partial. #626 stays open. This self-review is not Ready and not a merge.

## Security, cost, database

No new dependency, vendor, secret, or monthly cost. No Production migration. No RLS or Auth weakening. Private tables have RLS enabled, no policies, and revoked grants. Runtime exceptions use fixed messages and do not include IP, email, or payload text.
