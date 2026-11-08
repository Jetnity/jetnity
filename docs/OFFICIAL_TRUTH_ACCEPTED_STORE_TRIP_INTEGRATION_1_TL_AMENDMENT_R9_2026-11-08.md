# Accepted Store Trip Integration 1 — TL amendment R9

Date: 2026-11-08. Authority and decision: ChatGPT / Technical Lead (Root).
Work #1155 / PR #1156, same author/session as R8. Exact parent `a75e709f074576d3f1ad1d4ac8fec54956fcb02a`; main `e1fe0c696ade9f39b417772b5c065f87530204d6`.

## Explicit decision and its limits

**Approve a measured change of the existing Atomic suite's outer test budget from900000ms to1200000ms, and its GitHub Actions job from20 to25 minutes.**

This explicitly supersedes the prior no-timeout-change instruction **only for these two aggregate test watchdogs**. It is a documented test-contract change, not a performance optimization, an unchanged gate, or an assertion that the failed runs passed. No Product-Owner reserved gate is involved: this is necessary release-verification engineering within the already selected package.

All actual business/reader/SQL/authority/cancellation/cleanup contracts, cases and assertions remain unchanged. The required CI check names, strict ruleset, aggregate dependencies and requirement that every mandatory job succeed remain unchanged. No required check is removed or bypassed.

## Independently verified measurements

Root independently read the completed original logs and recomputed the30 negative-statement totals, complete ordered common marker prefix, terminal times and reference cleanup. Nine Atomic-package source files and the workflow are identical across587/e51/a75. Corpus sizes are unchanged: primary63 artifacts/5565412 canonical bytes; composed72/5587552.

| Evidence, milliseconds | 587 complete | e51 timeout | a75 timeout |
|---|---:|---:|---:|
| 30 negative Refresh SQL statements | 91143 | 135238 | 136670 |
| Positive primary SQL | 8530.359 | 12678.376 | 12761.071 |
| Positive composed SQL | 9381.355 | 14030.060 | 14149.006 |
| readback_failure reached | 604576 | 826365 | 836148 |
| cleanup_after_bound reached | 685420 | absent | absent |
| reader_after_bound reached | 766125 | absent | absent |
| Full global cleanup / suite completion | 766383 | absent | absent |

At a75's last observed end case,63852ms remains under the old budget. The complete587 tail actually took161807ms. Adding that historical tail to a75 projects997955ms; scaling only that tail by1.5 projects1078858.5ms. **These are projections, not observed complete a75 outcomes or future guarantees.** Actual measured SQL work is approximately1.5 times slower; the cause of that speed difference is unknown because no CPU/load/pressure evidence was captured.

The complete eight mandatory verifier probes total24700ms at a75, so removing them would both violate the required proof and fail to close the measured shortfall. JIT on/off probes do not show a meaningful improvement. Snapshots already hash all17 tables server-side. No sufficiently large, demonstrably redundant harness path was found. Naive parallelization is unsafe because observer hooks patch process-global fetch/connection functions. Shortening real bound waits or caching authority/closure results would change the intended proof.

The selected1200000ms parent gives a bounded margin over the conservative projection. The25-minute job also allows observed setup (approximately65.8s before the test command), the existing35s cleanup-drain window and job teardown. It guarantees no future success; a full actual new run is still mandatory.

## Exact implementation scope

1. `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts`: change only the aggregate parent timeout and matching `parentReserveMs` calculation to1200000ms. A single local constant may make those two uses identical. Update directly related explanatory comments if necessary. Preserve every scenario, call order, negative/positive control, assertion, actual global resource counters and parent-abort regression.
2. `scripts/db/official-truth-atomic-version-refresh-1/test-lifetime.ts`: update only the comment naming the parent duration. **DRAIN_MS remains35000; no implementation changes here.**
3. `.github/workflows/ci.yml`: change only `refresh_native.timeout-minutes` from20 to25, plus a directly explanatory comment if useful. Core remains30min, Persisted20min, Auth10min, aggregate2min; commands, runners, dependencies, required job relationships and secrets remain unchanged.
4. Update the package handoff/matrix to disclose this changed test budget and preserve all historical red results. Root persists the measured diagnosis and exact CI checkpoint.

The actual reader/operation budgets60s/120s, SQL limits25s/15s/20s, absolute cutoffs, abort behavior and35s drain remain unchanged. No separate favorable rerun of a75, no test deletion/skip, no proof cache, no concurrency/partition change and no product SQL adjustment is authorized by R9.

Native240s integration timing remains a separate pending proposal; R9 grants no change to that test.

## Required independent acceptance

Return an exact frozen delta to Root. Independent review must verify that only the explicitly authorized aggregate watchdogs changed and all semantic/time-bound assertions remain. The next head must execute all required jobs and every Atomic case, including both previously missing terminal cases, actual global cleanup, all initiated operations settled, zero pending work and complete owned resource closure with positive parent reserve.

Previous e51/a75900s runs remain FAILURE / CHANGES REQUIRED with no observed global completion. A later green run cannot retrospectively supply their missing evidence. If the new bounded full gate fails, return the actual failure; no further automatic budget increase.

R8 product corrections and all TASK/R1–R7 authority/source/graph/custody/receipt/witness contracts remain. Only Root sets TL PASS, Ready or merge. SQL remains UNAPPLIED, binding/contracts/provider inactive and FEATURE_NOT_LIVE; all #917/#1131 and other reserved gates remain. No hosted action or automatic following slice.

Measurement artifact: `three-run-measurements.json`, SHA256 `0fb269758abfaa7a625c49167750408654e552be3247f2b7ff57faa41b350594`. Its historical original-log paths/hashes and projection labels must remain explicit.
