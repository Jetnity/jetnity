# M04 — Root recovery review V2

**10 November 2026. Source review and independent nonnative checks complete; actual new-head native/full CI acceptance OPEN. This is not Ready, merge or activation.**

## Reconstructed starting truth

The previous chat did successfully publish interruption checkpoint `d9d62c690658444e06d04becf93f21ffb9112165`, tree `ee51fd891fd836a355c8434ad5765862d578524b`, in Draft [#1178](https://github.com/Jetnity/jetnity/pull/1178). Root verified all sixty-four changed file blobs against the preserved worktree and reconstructed that exact local commit from returned GitData metadata. The earlier green `05b30109` run was documentation-only and did not accept this runtime.

The actual checkpoint CI [42732722870](https://github.com/Jetnity/jetnity/actions/runs/42732722870) failed in native setup before N01. Core: 8661 tests, 8658 pass, one failure, two inherited skips. Typecheck/lint succeeded; hygiene/build were skipped. Native receipt was truthfully false: eighteen operations started/settled, zero pending, two connections closed, one cluster stopped, no proof groups. [Bounded actual log](M04_CHECKPOINT_D9_NATIVE_FAILURE_V2.txt) and [live audit](M04_RECOVERY_LIVE_AUDIT_V2.json) preserve this negative evidence.

The original Generation1 author session was unavailable: a direct continuation attempt returned `live agent path not found`. The replacement is explicitly **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, `/root/m04_durable_jobs_writer_g2`, the sole source writer. Root's [TASK V2](M04_RECOVERY_TASK_V2.md) and [verified dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756274057) preserve the discontinuity. No Cursor or same-session fiction is asserted.

## Reviewed source identity and finite delta

The eighteen-file source aggregate is `cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f`, using the frozen sorted SHA256/bytes/path recipe. Relative to d9, exactly four source files changed:

| Path suffix | SHA256 |
| --- | --- |
| jobs/composition.test.ts | `4b8cc4d40cda71d07a4a99c38a103634d194d24bf288fd6a73cfe0f87014820c` |
| durable-jobs-1/native.ts | `670f4a62b0f7b8964de8f2df4fd3ef99044067c9c92484e1d7c1fd53374deaac` |
| durable-jobs-1/native-adapter.ts | `5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57` |
| durable-jobs-1/jobs-candidate.sql | `3f17aebedfb69891a1ad5ccea7a7f1326d2431ba6a73c9d790254c581fe65fdb` |

All eighteen full paths, sizes and independent pins are in the [Root receipt](M04_RECOVERY_ROOT_OFFLINE_CHECKS_V2.json). Runtime composition, ownership scope, authority adapter, rollback, protected predecessors, generic races, native helpers, workflows, packages and original budgets are unchanged by Generation2.

## R9 — combined native lifetime proof

Root and read-only reviewer `/root/m04_r9_review_g2` reviewed the frozen new delta independently. The actual full-factory unit cases hold the exact nested S1 reserve beyond natural I1 timeout or external caller abort. The timeout case observes the actual worker's fail-confirmation read while the reserve remains pending; this is distinct from a mutating fail command. Three additional held same-facade method promises fill the other lanes. A fifth invalid invocation is unavailable before original drain and invalid after only that original drain, demonstrating actual lane release. No fail/complete CAS or false settled disposition is accepted.

A further unit case invokes actual exported composition and actual scope with real standalone MA1 ports and an explicitly handwritten fixed-request protocol bridge. It observes raw integration `unconfirmed` while the same reserve and native/intake/outer counters remain occupied. Actual `drainNative` and `finish` stay pending until release. This test does not claim to exercise private `authorityCore`; the full-factory/native cases cover that wiring. Caller abort is not a naturally elapsed thirty-second worker timeout, and the raw worker promise is not separately observed.

The new mandatory native witness uses an actual row lock on the captured original, exact PID/backend birth/holder/relation evidence, the real reserve statement, cancellation, and retention of that same executor in `beforeDrain`. The backend is separately proved absent while its executor context is held; it is not described as still alive after close. M04 state and exact S1 original/reservation/completion history are compared before/after drain and after a late-work turn. Three helper work invocations are started before the adapter's serialized cleanup gate; their actual method reads have ended but their executor promises remain held. All gates release and calls join in `finally`.

**Disposition:** the source supplies the requested meaningful witness, and the nonnative cases actually pass. R9 native acceptance still requires the unchanged CI to execute both witnesses, all N01–N15 obligations and complete terminal receipts. No source review converts that future execution to PASS.

## R10 and R11 — concrete native setup blockers

Root independently confirmed four new multi-column `set_config` queries with duplicate output names. The protected wire decoder rejects duplicates. Unique aliases now preserve the original calls, settings and quotas. Bounded fixture phase/category/SQLSTATE diagnostics distinguish future failures without raw SQL, parameters, source bytes or credentials; failure propagation and mandatory execution remain intact. The historical AggregateError did not expose its inner code, so the original runtime cause remains a source-derived diagnosis until corrected CI runs.

The independent full new-candidate/rollback review by `/root/m04_live_audit_g2` found two PL/pgSQL record/alias collisions. Root inspected both. The new `assert_catalog_v1` loop record is now `binding_row`; `$owners$` uses `function_row`. SQL aliases, ownership, ACL, fixed search path, variables policy and twenty-nine-function inventory remain unchanged. [SQL review receipt](M04_RECOVERY_SQL_STATIC_AUDIT_V2.json). No additional concrete blocker was identified in that bounded review. Real installation/rollback are still CI obligations.

## Independent execution by Root

On stable pins, Root executed the five explicitly named nonnative test files, focused TypeScript over sixteen roots, and targeted ESLint using the existing cache. **64 tests /64 pass /0 fail /0 cancelled /0 skipped; TypeScript zero diagnostics; lint zero errors/warnings.** [Commands and receipts](M04_RECOVERY_ROOT_OFFLINE_CHECKS_V2.json), [unit log](M04_RECOVERY_ROOT_UNIT_LOG_V2.txt). Source hashes were checked before and after each independent run. Local Node24.22.1 differs from CI22. No local native SQL, PostgreSQL, socket proof, full core, full build, install or package download occurred.

## Main reconciliation and remaining exact-head gates

The separate PR #1180 advanced main to `890dfe9323b4b6d3644c372d81cb8893b6548d11`, tree `8c611ec31d518cce88a3a5abb75aecf6620d794c`. Root read back [main CI42736015143](https://github.com/Jetnity/jetnity/actions/runs/42736015143): all eight jobs SUCCESS. Both production aliases now point to READY `dpl_7K4gHmn2d2HBqCq1CHBThRjAXHw7`, exact890, aliasError null. These are the other workstream's deployment facts, not M04 delivery.

Before reconciliation, M04 is ahead3/behind22 with merge-basebe79. Only `ROADMAP.md` overlaps its sixty-four-file diff and main's eighty-file delta. Root preserves both roadmap entries and every unrelated main file. Seventy-three UTF-8 snapshots were verified by exact Git blob IDs; six newly added image blobs are preserved by ID without retrieval. The original sixteen missing binary IDs remain intact. Root alone publishes the resulting reviewed tree with parents d9 and exact current main, checks the branch lease, compares the result and awaits actual new-head CI/Preview. Current exact SHA/tree and subsequent acceptance are recorded in the PR receipts.

Fourteen PRs remain open at this observation, all Draft. #1178 has no formal reviews or inline threads; issue-comment findings still bind. Strict ruleset21875372 has no bypass. Bounded #751/#748 comment reads since00:00UTC found no new Guardian comments. Recheck live main/PR drift, all checks, native/process/cleanup receipts, Preview/production metadata, review requirements and gates before any Ready/merge decision. Every changed head invalidates prior exact-head gates. Immediate correction returns to the same Generation2 session.

## Risks and Owner boundaries

- **P0:** no new confirmed incident; all authority, privacy and activation boundaries remain enforced. Source review does not authorize hosted changes.
- **P1:** actual new-head native install, persistence, concurrency, identity, authority/revocation, original retention, recovery, rollback and lifetime proofs remain open until executed. R9/R10/R11 cannot be closed on author self-review alone.
- **P2:** deliberate conservative availability for unknown outcomes and finite quotas; operational/provider attachment and public p95 remain outside the dormant slice. Historical dependency findings and two inherited skips are not recast as a current project-wide security PASS.
- **P3:** later fixture construction may retain a prior bounded diagnostic phase label; it cannot create a false native PASS. Unrelated inherited UI limits are outside M04.

Method **NOT_APPROVED**. #1139 **NOT_RELEASE_READY**, seventeen pre-Owner gaps. #917's specifically refused readback remains pending with no retry, rephrase, delegation, reroute, transport switch or human SQL substitute, and no renewed request for unavailable old Owner evidence. #1131 Ready STOP, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credentials or Auth-log operation, real sources/providers/research, scheduler, notification, new cost or public V3 activation. Native fixture truth is not hosted-state truth. No automatic next slice.
