# ROLLING-QUOTA1 — fixed CH→DE Dev successor

This package changes the admission model for the already existing subject
`research-job:v3:74713fe665cab1a7603f6e93ab06b6a1d1964e83a69571b8cced0ff009032513`
from lifetime quotas to **64 START reservations and 256 queue operations in the
preceding 24 hours**. It does not increase either limit, reset a counter, rotate
the subject/job key, delete history, reapprove a method, or extend any timeout,
lease, projection or source-qualification lifetime. Other subjects keep their
original lifetime limits.

## Source and installation boundary

`build.mjs --check` must reproduce `provider-migration-body.sql` exactly. The
compiler pins the unchanged HM04/HRS/BG1/status/Recovery2/Recovery3 source files.
The last predecessor artifact is Recovery3 SHA256
`96f86b8d5432508a3172ea483c8804cf405027f1bb565422df683615f061f5d7`.
That is a **file digest**; a live catalog digest is a different value.

The provider body requires a transaction as the actual Dev `postgres` creator,
PG17, read committed isolation and controlled quiescence of existing runtime
sessions. Keep the import sender disabled while installing. The fixed Dev
acknowledgement in the body does not select a remote database: the operator must
independently select the existing Dev project `yfvbxvijcorffwxbxahl`.

The migration checks the complete installed BG1 baseline chain ending in
`gap_recovery_baseline_v1/catalog_status_v1`, and compares every old protected
row, catalog object, membership and privilege before and after the change.
It accepts exactly these successors:

| Existing object | Change |
| --- | --- |
| `assert_history_v1(text)` | Preserve exact lifetime-count/history equality and all original row checks; evaluate the selected subject's cap over its rolling window and reuse exact canonical child bytes within one invocation. |
| `tx_execution_start_v1(...)` | Admit a new START only within the actual rolling START/operation window and with a non-regressed DB clock. |
| `tx_queue_cas_v1(...)` | Preserve original-ID replay before admission, reserve the exact terminal operation and apply the new rolling limits to fresh operations. |
| Three `subjects_v1` CHECKs | Permit only the selected subject's monotone lifetime totals above 64/256; all totals remain nonnegative and all other subjects retain v1 ceilings. |
| Five BG1 catalog/admission functions | Follow an immutable new baseline while retaining the complete v1/status/Recovery2/Recovery3 chain and requiring a fresh full proof. |

New objects are two private policy/baseline tables, two private readback helpers
and two indexes on `(job_key, time, original_id)`. A temporary SET-only role edge
for the existing jobs owner is removed before catalog capture; original bootstrap
memberships and their OIDs are preserved exactly. No runtime role gains a new
entry point or table privilege.

The installer creates no positive audit generation. Business IO remains closed
until the existing normal BG1 checker records a new complete generation after
the successor's `proof_not_before`. Do not rewrite an old proof, clock, baseline
or audit due slot to make the check pass. Existing Owner approvals and recovery
records remain untouched.

## Window and idempotency rules

Admission takes its timestamp from `clock_timestamp()` while the unchanged M04
subject/advisory locks are held. The window includes rows whose immutable DB
timestamp is at least `now - 24 hours`. There is deliberately no upper timestamp
filter: future rows remain charged. If the latest retained timestamp or policy
installation is later than the current DB clock, every new operation is refused.
Exact original-operation replay still precedes fresh admission and costs no
additional operation or START.

`operation_count` and `start_count` remain monotone **lifetime** totals, equal to
the complete append-only history. The subject's terminal credit does not age out
with its originating claim. Admission subtracts that reservation until the exact
permitted terminal operation closes it. A full START window does not prevent a
valid terminal operation, but clock regression, an expired lease, invalid token,
changed method or other existing authority failure still prevents the effect.

At a healthy 40-minute cadence the normal path requires approximately 36 STARTs
and 108 operations per 24 hours. Retries and manual runs share the same limits.
There is no quota-free scheduler or special source/publication bypass.

The full history validator retains every original check. Its envelope serializer
may reuse only an already computed `canonical_v1(child, 1)` result for an exact
`child::text COLLATE "C"` match. Two invocation-local entries share a 64KiB bound
including their keys and values; oversized children are calculated normally.
Only the fixed seven-member envelope shape takes this path, in the original
ASCII member order. Every other shape uses the original serializer. This byte
memo is separate from the unchanged job-validation memo: obtaining bytes never
marks a job, transition or row valid. All subsequent canonical-byte equality,
hash, shape, node, transition, method, timestamp and authority checks still run.

## Scheduler readback

Only `postgres` can call the fixed, argument-free readback:

```sql
SELECT official_v3_guard_private.ch_de_quota_v2();
```

It performs the existing `require_open_v1()` check, then returns:

```text
model = rolling_24h_v2
clock_ok
observed_at, window_start
starts, operations, credit
remaining_starts, remaining_operations
lifetime_starts, lifetime_operations
next_start_capacity_at, next_operation_capacity_at
```

The remaining operation value already subtracts terminal credit. The sender must
require the exact model and `clock_ok=true`, retain its separate 4 START / 16
operation safety reserve and stop if this readback is absent or invalid. It must
not fall back to subtracting lifetime counters. This readback grants no work
authority; every real operation is independently admitted by the unchanged M04
entry point and its new narrow quota predicate.

## Required proof

Run with the repository's server-only test registration and Node22:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-v3-rolling-jobs-quota.test.ts
```

The mandatory selector includes that exact test. It allocates only owned local
PG17 databases, uses the real unmodified prerequisite installers and executes the
generated successor. Single-user PostgreSQL avoids sockets in restricted local
environments. Its statement encoder preserves original SQL/function body bytes;
unhandled ERROR/FATAL/PANIC output fails the proof. Expected PL/pgSQL exception
handlers remain effective. This is a real SQL proof of serial semantics, **not a
new multi-connection contention claim**. Existing required hosted PG17 concurrency
tests remain authoritative for the unchanged locking/API mechanisms.

The historical setup is explicitly synthetic: 64 complete, internally coherent
terminal failure cycles with original commands, claims, reservations, authority
and dispositions spanning more than 24 hours. It uses INSERTs into a new empty
fixture before BG1 installation; it neither edits timestamps later nor invents
accepted source results. The full native proof then executes real API cycles
65–86, exceeds both old lifetime ceilings, fills the rolling operation window
through genuine ordinary deduplicated enqueues, proves the last reserved terminal
operation and free exact replay at 256 operations, and runs a subsequent normal
BG1 audit in its actual next due slot. A separate complete-stack case proves the
64 START refusal while operation capacity remains available. Focused actual PG17
calculation tests cover 24-hour edges, future timestamps, retained old terminal
credit and the unchanged legacy model for other subjects.

A separate actual PG17 differential proof executes the exact inserted serializer
block against the unchanged canonical function. It checks depth24/25, numeric
bounds, escaping and non-ASCII rejection, SQL/JSON null, malformed root shapes,
case-sensitive memo keys, eviction/oversized children and noncanonical original
bytes. It also measures both slots' actual retained bytes and independently
recalculates every stored canonical value at its original depth.

Native output records actual SQL max/p95 M04 time under the unchanged 5-second
deadline and the full BG1 audit duration under its unchanged 30-second deadline.
It does not prove an official HTTP import or hosted cron delivery; Dev activation
still requires the real source run, accepted publication and observed recurring
sender cycle.

## Operating boundary

The known lifetime exhaustion at roughly 38 hours is removed. History remains
append-only and grows; this change makes no unlimited-retention or unlimited-cost
claim. The existing fixed BG1 deadline, freshness and incident alarm remain the
fail-closed performance boundary. Monitor actual audit duration/history growth
and plan a separately reviewed retention design before that boundary becomes
binding. This package introduces no garbage collection or new paid service.
Production installation, merge order and costs require the user's separate
approval; this body is fixed to Dev.
