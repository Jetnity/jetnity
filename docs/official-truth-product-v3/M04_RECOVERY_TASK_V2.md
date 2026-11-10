# M04 Recovery / R9 and first native CI correction — TASK V2

**10 November 2026 — Root continuation after verified saved interruption.**
This task supplements the immutable TASK V1, Phase-A freeze, full plan and T01–T03. It is a finite continuation of PR #1178, not a new product slice or changed activation authority.

## Verified baseline and session discontinuity

- Remote and now exact local head: `d9d62c690658444e06d04becf93f21ffb9112165`; tree `ee51fd891fd836a355c8434ad5765862d578524b`.
- Branch `feat/official-truth-v3-durable-jobs-1-20261109`; main / merge-base `be79ea2591e990111bfabea7ddf500023c20a188`; ahead 3, behind 0. All 64 changed file blobs match the preserved worktree; clean before continuation; 16 omitted binary IDs / skip-worktree preserved.
- The previous checkpoint is genuinely published. PR body and #751/#1162 were left stale by the interruption; Root owns their correction.
- Original author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1**, session `/root/m04_durable_jobs_writer`, is unavailable in the new collaboration tree. A direct continuation check returned “live agent path not found”. No original-session continuation is claimed.
- Root assigns the sole replacement author **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, new session reserved `/root/m04_durable_jobs_writer_g2`. This is a documented context-loss continuation under the Operating Standard, not a second simultaneous writer. The actual dispatch is recorded in the PR.
- Independent read-only reviewers: `/root/m04_live_audit_g2` (live gates), `/root/m04_r9_review_g2` (runtime proof). Root makes the independent final decision and may commission a further bounded SQL review.
- Cursor tools are absent from the current tool inventory. This is the existing Codex fallback; no Cursor UI/session assertion.

## New live finding R10: first actual CI failed

Run [42732722870](https://github.com/Jetnity/jetnity/actions/runs/42732722870), exact d9d62c6, failed. Repository verification job129554463494 fails its Tests step; typecheck/lint passed, later hygiene/build were skipped. Core totals: 8661 tests, 8658 pass, one fail, two inherited skips. The mandatory M04 native case fails during setup before any N01–N15 group, with a truthful nativePass:false receipt: one stopped cluster, 18/18 operations settled, 2/2 connections closed. Its AggregateError masks the specific inner failure. This is neither native acceptance nor a retry request.

Root independently confirmed four new queries with two unnamed `set_config` result columns: native.ts fixture marker and native-adapter.ts observer/control/target timeout queries. The unchanged pg-wire decoder rejects duplicate result names with `LocalPgError('duplicate_column')`. This is a concrete source defect and a source-derived explanation of setup failure; actual CI must confirm the corrected path. Fix only those new queries with distinct aliases, without weakening the protected decoder or changing operation/call/time budgets.

Add bounded fixture-only diagnostic phase and sanitized error-code evidence so an actual future setup/assertion/cleanup failure is attributable without dumping SQL, parameters, raw exceptions, source text or credentials. Preserve failure propagation, mandatory execution and truthful nativePass/group receipts. Do not turn a diagnostic into runtime/public output.

## R11 — new SQL identifier collisions found during independent static review

Root and the read-only SQL reviewer independently located two PL/pgSQL name-resolution collisions in the new candidate, not in a protected predecessor: `assert_catalog_v1` declares loop record `x` while later catalog subqueries also alias four catalogs as `x`; the installer `DO $owners$` declares loop record `p` while its query also aliases `pg_proc` as `p`. Rename the loop records or SQL aliases consistently within those new functions/blocks. Do not change `plpgsql.variable_conflict`, existing helpers, ACLs, gates or budgets. These source-derived installer blockers are assigned to the same Generation2 author and require actual native CI confirmation after correction. Reference: [PostgreSQL16 variable substitution](https://www.postgresql.org/docs/16/plpgsql-implementation.html).

## Concurrent main advancement

At 01:28 UTC, the separate PR #1180 was merged by the other workflow. Live main is now `890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree `8c611ec31d518cce88a3a5abb75aecf6620d794c`. Its 80-file delta from be79 does not overlap any of the eighteen M04 sources; `ROADMAP.md` is the sole overlap with the existing sixty-four-file M04 branch delta. Root owns reconciliation of the two independent roadmap additions and preservation of all new main paths before publication. The author continues only the frozen source/evidence inventory. The startup main/production observation above is historical, not a claim that main remains be79.

## R9 remains independently mandatory

Complete [R9 6755677459](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6755677459), U06/N12, within the original scope:

1. Actual composition regression, using real I1/S1 control flow and a controlled pending nested native executor promise beyond an inner facade race.
2. Native controlled S1 reserve/read/finish case (one justified operation suffices). Establish real active SQL wait with exact PID, backend birth, holder and relation before cancellation; observe crossing the actual I1/worker race boundary while that same executor is still pending.
3. Prove abort delivery, no premature outward settlement/slot reuse, no Queue-Fail/backoff/Complete or settled_failure disposition, and no late native admission/effect after releasing and joining the held operation.
4. Keep real backend liveness distinct from retained executor cleanup. A beforeDrain hook after target closure proves context/promise custody, not a still-live backend.
5. Cover both existing worker and I1 race boundaries with exact assertions, preserving fixed budgets. Do not replace actual composition with a callback-only mock and call it native proof.

Final full U01–U07 / N01–N15 assertion map and all 18 source pins must accurately describe actual coverage. Existing independently bounded V7 reviews are historical source evidence; native execution and new-head gates must be regenerated.

## Write scope, checks and STOP

The 18 source paths plus four author evidence paths in M04_PHASE_A_FREEZE_V1.md remain the complete author write inventory. Root owns this task and all current-state/transition/review documents. Do not rewrite frozen plan, historical V7 manifests/reviews or previous checkpoint to pretend they already cover the new work. Preserve existing S0/I1/S1, generic queue/worker/E1, MA1 SQL/rollback, native lifetime/wire helpers, UI, packages/workflows/timeouts and 16 omitted binary objects.

The author may run only named nonnative tests excluding every native entry and focused TypeScript/lint against the existing cache. No installation, git mutation/fetch/push, missing binary retrieval, local full build, local PostgreSQL/socket/native execution. All git reads use GIT_NO_LAZY_FETCH=1. Real native proof runs only through the unchanged existing CI after Root publishes the reviewed candidate. Do not rerun CI on unchanged known-bad code.

**do not mark Ready; do not merge; do not start a follow-up slice.**
Stop after coherent pinned delivery for independent Root review. Immediate review corrections return to this actual Generation2 session; changed heads invalidate previous gates.

## Unchanged special gates

Method NOT_APPROVED. #1139 NOT_RELEASE_READY with 17 recorded pre-Owner gaps. The specifically refused #917 readback remains pending and must not be retried, rephrased, delegated, rerouted, transport-switched or replaced by human SQL. No renewed request for unavailable old Owner evidence. #1131 Ready STOP; both #1135 holds; #968 and #911/#913 remain.

No hosted DB/Auth/RLS/ACL/migration/credential operation or Auth-log access; no real source/provider/research call, scheduler, notification, cost or public V3 activation. Database and Production activation require the concrete complete Dev package and method approval. The current task neither applies a migration nor approves the method. Native fixture roles/synthetic Auth are not hosted-state evidence.
