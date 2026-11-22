# Production HTTP allocator — Cron correction, 22 November 2026

**Prepared successor package. No Production SQL execution is authorized by these files.**
**Runtime status: `BLOCKED_PROVIDER_EXECUTION_CONFIRMATION_EXPIRED`.** This is a
reviewable candidate, not a package ready for Production rehearsal authorization.
The previous package and its attempted rehearsal remain immutable. This package
addresses its unsupported `SHARE` lock on provider-owned `cron.job` without adding
any role membership, privilege, ownership or maintenance right.

## Evidence and scope

The earlier Production rehearsal ended with SQLSTATE `42501`; it is not a successful
installation or hosted rollback proof. The separately authorized post-abort read at
`2026-11-22T00:06:22.944557Z` observed the original definitions, absent allocator
objects, unchanged native transport binding and the five historical Cron contracts.
That read also supplied new complete Cron-row hashes, job IDs and localhost/5432
target observations. It did not retrospectively create the missing pre-attempt
row snapshot or prove full equality of all dynamic rows and counters.

The receipt is archived as `inputs/postabort-production-result.json`, SHA-256
`f6404d0d9c1407fcc8277d6b7ba5a9f2b84128b572c32d99d329c9ac23601fe6`.
Historical field expectations still come from the immutable V2 evidence. A mismatch
is a STOP; the builder never replaces a historical expectation with current drift.

The direct protected predecessor remains `query_cost_baseline_v1`, with catalog
SHA `ef4dcbe4d5c17bcdc339ef159a8fe26f352dbc8057943bc035ed3b79340e2a24`.
The original v3 and all earlier links remain required. The optimized unique JSONB
aggregate and both narrow dependency deduplications are preserved.

## Exact correction

1. `cron.job` receives only `ACCESS SHARE`, using its existing SELECT authority.
   This stabilizes the relation against incompatible DDL; it does **not** exclude
   Cron inserts, updates or deletes. There is no privilege workaround.
2. Before any temporary or permanent DDL, five exact relevant Cron rows must match
   the independently observed full-row hashes. Their known command hashes, schedule,
   active flag, user and database remain anchored to the historical contract.
   Complete row hashes additionally bind job ID, host, port and every other stored
   user column. A duplicate relevant name or missing relevant row fails closed.
3. The shared core records a bounded snapshot of **all** Cron rows: at most 128 rows,
   each at most 65,536 bytes. It hashes complete row values and separately
   `(tableoid, xmin, ctid, row)` values. Thus observed changes to existing rows remain
   detectable even when an update restores the previous configuration values.
4. The core refuses observed competing granted or pending Cron writer locks,
   including prepared transactions with a NULL PID. It filters by database OID and
   excludes only the current backend. These are observations, not exclusion locks.
5. The five relevant full-row contracts become a new `cron_contract` component of
   the appended transport metadata. The previous catalog did not contain Cron data;
   the new explicit component supplies this precisely bounded ongoing coverage.
6. The new catalog is captured **once**. Its existing keys and allowed additions are
   checked against the fixed predecessor, and its Cron component must equal the
   reviewed before-snapshot contract. Only that same `live_catalog` JSONB value and
   its `captured_transport` child are inserted into the immutable successor. Later
   reads can reject drift; they cannot replace the checked snapshot with new state.

The global queue lock, ID-ledger locks, existing producer advisory locks, fresh
high-water calculation, 1,024-number spare interval, private LOGGED sequence and
source-qualification barrier are unchanged. The native transport digest remains
`60e34d01b3fdf2834d284a5e43e3cdc0e5fde7dd14a060b336537b285d65c94f`.
The added Cron component has its own independent binding; it is not silently folded
into or substituted for that observed digest.

## Concurrency boundary

This is optimistic Cron protection, **not a frozen Cron table**. An entirely
transient insertion and deletion of an unrelated job between observations may be
unseen. A change can also occur after the last observation and before COMMIT.
Neither the writer check nor row-version hashing closes that final window.

The allocator's ID safety rests on the unchanged queue/ledger/producer barriers,
not on a claim that Cron cannot run. A late change to one of the five bound complete
rows is never learned into the successor: the stored configuration remains the
already validated one. An observed mismatch prevents the new required natural BG1
proof from succeeding; removal of the guard schedule also cannot supply that proof.
There is no claim that every transient change or every unrelated Cron job becomes
permanently monitored. Existing unrelated jobs are allowed and preserved; five is
the selected contract count, not the total size of `cron.job`.

The final optimistic Cron check is placed immediately before the two COMMIT
statements. It narrows the observation gap without claiming to eliminate it.
All stopped transactions must retain their actual error and rollback evidence.

## Files and authorization boundaries

| File | Purpose | Separate future permission |
| --- | --- | --- |
| `10-production-http-id.REHEARSAL-ROLLBACK.sql` | Actual DDL, ID and guard negative probes, followed by complete ROLLBACK | Exact new Production rehearsal Go |
| `11-production-http-id.POSTREHEARSAL-READONLY.sql` | Independent restored query-cost/transport/domain/Cron checks | Exact bounded post-rehearsal read scope |
| `20-production-http-id.INSTALL-COMMIT.sql` | The reviewed atomic source barrier, allocator and successor | Explicit COMMIT Go after actual 10 and 11 evidence |
| `30-production-http-id.FENCE-ROLLBACK.sql` | Probe denying future queue inserts while preserving sequence/history | Later specifically bound Fence rehearsal Go |
| `40-production-http-id.FENCE-COMMIT.sql` | Commit that denial without rewinding or reverting to the old allocator | Later specifically bound Fence COMMIT Go |
| `50-production-http-id.POSTCOMMIT-READONLY.sql` | Full native-definition/authority checks before Guard invocation and committed successor readback | Exact post-commit read scope |

The Fence's committed-successor pin deliberately remains NULL until an actual
installation and independent readback supply it. New private-object ACL hardening
from the preceding installation design remains prepared code; no existing object's
rights or role membership are changed by this correction. The Dev tests execute no
GRANT, REVOKE, SET ROLE, owner change or production installer against Dev.

## Shared Dev test contract and reproducibility

`cron-protection-core.sql` is the exact shared input, SHA-256
`6fb59e9ce1da9a43527fd0a945dd18dbfec6a14726ea1667674e14ea340fdd79`.
Its five temporary invoker helpers perform no HTTP, publication, Cron DML or
permission change. The permanent catalog expression is extracted directly from
the same `$cron_contract$` body. Scoped tests may replace only the fixed Cron
relation with a fixture relation; that mechanical substitution must be recorded.
The existing Dev v8 guard, logged allocator, source records and live Cron rows stay
intact. Fixture results must not be described as a Production installation proof.

The actual Dev permission read has already shown that SELECT and ACCESS SHARE work
while UPDATE, DELETE, TRUNCATE and MAINTAIN are unavailable. The shared core's 14
native test groups and the two-session concurrency test have **not run**. No native
core, concurrency, full setup or rollback PASS is claimed.

The first exact fixture-setup call lost its original tool response and remains
`UNKNOWN`. Separate Dev reads observed the fixture absent and the original v8
context intact; they do not reconstruct the lost response or prove a full rollback.
The second exact setup call returned an MCP error with structured status `expired`:
the provider's required execution confirmation had expired. Its recorded interval
is `2026-11-22T00:23:46.470Z` to `2026-11-22T00:58:36.373Z`; that is a tool-call
interval, not demonstrated SQL execution time. The final independent Dev READ ONLY
at `2026-11-22T01:00:48.645764Z` found the fixture absent, no matching active test
sessions and the original exact v8 catalog, with 43 roles, 40 memberships, 11 Cron
jobs, 71 facts and three originals. No fixture cleanup was needed. These observations
do not convert either setup call or the unrun tests into a successful execution.

The Dev task remains authorized, but the provider's technical confirmation must be
completed before its normal SQL execution path can continue. No migration, login,
credential, role or alternate-interface route may bypass that confirmation. There
is no automatic retry or Production rehearsal Go in this package. The exact receipt
paths and hashes are listed in `required-production-bindings.json` and `MANIFEST.json`.

`python build-candidates.py` performs local assembly only. It verifies archived
inputs and emits this package's SQL and provenance. It does not connect to a
database, execute SQL, import the previous builder or modify the previous package.
The exact byte manifest and completed Dev evidence must be reviewed before asking
for a new Production Go. A successful local rebuild is not a native parser,
concurrency, hosted rollback, HTTP-delivery or positive-renewal result.
