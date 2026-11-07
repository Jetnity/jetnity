# Official Truth Atomic Version Refresh 1 — TL Amendment R6

Date: 2026-11-07. Same explicitly selected task #1152 and Draft PR #1153; immediate review correction, no successor slice.
Author: **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, actual session `/root/atomic_version_refresh_writer`.
Implementation baseline: `22e3a9039f8dbf001e19c9235110020b2cce3f8c`.
Baseline tree: `587f806f4399c7b6eb9464be2b19276479d86963`.
Main: `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`.
Root alone decides PASS, Ready and Merge. All TASK/R1–R5 restrictions remain except the explicit test-fixture correction below.

## 1. Independently observed failure and its limits

Fresh CI [42415761471 attempt 1](https://github.com/Jetnity/jetnity/actions/runs/42415761471), Refresh job 128533378157, checkout `3517142bcf34e6e18b52f0645d40c125c0a31ac9`, exact tree 587f806f. The completed original reports 0 passed / 1 failed / 0 skipped; parent 589229.535689 ms, total 589933.075151 ms. Error `local_pg_connection_state` / code `connection_state` at pg-wire.ts:294, then native.test.ts:969 in `blocked()`, first invocation at line 990 (`expiry`).

Root independently read the original and exact frozen sources. The driver rejects either busy or closed connections at that line; the log does not distinguish those flags. Source shows a concrete concurrent-use defect: the coordinator starts at line 964, its asynchronous refresh-login connect hook issues expiry mutation and snapshot queries on `w.owner` (956–959), while the outer loop issues lock observations on the same `w.owner` (969). These can overlap when the unchanged canonical Old preflight finishes. Do not claim the log alone proved a specific internal flag.

The current head actually reached all eight original/current positive Oracle probes, both 256-artifact SQL refusals with transport reserves of 8324202 / 8324204 bytes, all fourteen Primary negative pairs, no-cache and false-fact evidence, actual denied calls for all six private workers and five reference functions in both modes, both actual fault rollbacks, full Primary and Composed refresh/ACK/fresh readback, three corrupt-Old cases, and all three bounded-commit guard cases including the actual 700 ms delayed transport. Actual successful refresh SQL: Primary 14315.261 ms, Composed 16232.269 ms, within the unchanged 25 s bound. These partial results do not accept the whole head: lock-wait cases, race and four terminal outcomes were not completed.

Persisted job 128533378102 separately completed SUCCESS, all 95 diagnostics / 45 reads through final rollback. Auth and Preview passed for this head. Core/Aggregate completion must be recorded separately from their actual completed originals. No previous-head gate transfers.

## 2. Explicit narrow frozen-fixture exception

Only author files allowed to change:

1. `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts`, baseline blob `01dd48fa71c4a2d14d13502a5b6c3d7c6a2759a1`, SHA256 `1823bb80ea5a647472722980e7c154d44864d2143efc4400bd0cba779dbf9b5a`, 95048 bytes. Limit code changes to the existing `blocked(kind)` helper and its directly necessary connection/settlement/cleanup bookkeeping. Correct overlapping use of the test observer connection; retain every test case and its actual safety assertion.
2. Existing HANDOFF, baseline blob `a3ad31b3a7288197fe2f7df2c52e7f1afadcce39`: append the exact failure, scoped correction, real checks, and unproved remainder.

All other author files and all earlier task/amendment documents stay byte-identical. In particular, SQL, reference fixture, pg-wire driver, Coordinator, Producer, persisted reader, source/extractor semantics, original 17-table snapshots, runtime APIs, canonical migrations, roles/grants, workflow, package/lockfiles and dependencies remain unchanged. No edits to the earlier Oracle/negative/fault/guard blocks or later race/terminal assertions. A distinct demonstrated finding elsewhere must be returned to Root before changing that scope.

This corrects the local disposable Native test harness; it creates no runtime observer or hosted access path.

## 3. Required correction and cleanup properties

- Give simultaneous observation work its own actual test-owned backend, opened before installing the asynchronous connect hook. Do not share `w.owner` with the polling loop while the hook can mutate or snapshot through it.
- Keep the existing ordering: actual unchanged canonical Old preflight completes before the real head lock is acquired. The exact refresh writer must really wait; the preflight must not become the wait subject.
- Identify concrete owner, blocker, observer and refresh-writer backend PIDs as needed to show distinct ownership and exact blocking. Track owned connections before any hook await that might fail, so partial hook setup cannot leak an unreturned backend.
- Retain actual PostgreSQL Lock observation, true usable-before-wait expiry assertion, actual server-time expiration during the held lock, abort while really waiting, and actual timeout. Do not simulate wait outcomes, insert fake errors, widen expiry or runtime budgets, or accept `connection_state` as the expected refusal.
- Retain complete before/after 17-table snapshot equality, no attempted COMMIT, unchanged abort reason, released locks and restoration of the synthetic expiry fixture. Preserve the current external witness and all original data/capsules.
- Handle both normal and exceptional paths: attach handling immediately to started async work, abort/release test-owned gates when needed, await all started coordinator/hook work before reusing the owner connection for final checks, restore the original global connect function, close every owned observer/blocker/intercepted connection and prove recorded PIDs are gone. Do not hide primary failures with an unhandled secondary promise or claim cleanup that was not reached.
- Do not fix this by queueing arbitrary concurrent queries in the driver, swallowing errors, adding retries, weakening assertions, skipping cases, altering tests outside this helper, reducing the real proofs, or relaxing any limit.

All existing bounds remain: statement 25 s, lock 15 s, idle transaction 20 s, commit 20 s, reader/currentness 60 s, coordinator 120 s, recovery 2/5 s, Native parent 900 s, job 20 minutes. The observation cap remains 45 s. No favorable retry or CI cancellation.

Before delivery, statically inspect the complete remaining blocked/race/terminal section for this same connection-ownership and cleanup class. Report findings truthfully. This permits analysis of adjacent code, not unapproved edits.

## 4. Delivery and acceptance

Use the same author/session. Produce a frozen next snapshot with all 17 author files, complete old/new blob/SHA256/size manifest, exact delta against this baseline, a mechanical unchanged-file audit, the minimal reviewable patch and actual local checks. Do not install missing dependencies or create framework stubs just to report a local full PASS. Native evidence stays pending if local PostgreSQL is unavailable. Preserve full prior failure history in HANDOFF. Return / STOP.

Root publishes this immutable task seed from 22e3a903 and reads it back before implementation; this does not move the branch or cancel remaining CI. Root independently reviews the entire change, confirms all earlier task pins, publishes with expected-head compare-and-swap only after the current run is fully complete, then re-gates the complete new head from scratch.

Final acceptance requires all original/current probes and Primary fourteen negative pairs, 99 actual ACL denials per mode, both complete actual Primary/Composed transitions, both fault rollbacks, all three guard cases, all three lock-wait cases, real separate-reader/two-writer race, all four truthful terminal outcomes, complete backend cleanup and Native completion under 900 s. Fresh Core/Integrated/Persisted/Auth/hygiene/build/Preview and Aggregate are all mandatory. Root alone PASS/Ready/Merge, followed by independent actual post-merge main CI and Production/alias/HTTP checks.

Hosted and product gates remain unchanged: Stage 1 **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**, ledger **UNKNOWN**, Stage 2 **NOT_ATTEMPTED**. No retry, rephrasing, other agent/tool/connection or operator route for refused baseline readback without an evidenced legitimate platform clearance. No #1131 Ready retry, merge or code-copy workaround. No real AA source admission, registration, pilot activation, deployment-target change, Owner test, Production apply, Cursor/cost/settings change or automatic successor task is authorized by this amendment.
