# M04 Phase-B author self-review V1

**GENERATION2 AUTHOR SELF-REVIEW — INDEPENDENT ROOT REVIEW AND CURRENT NATIVE CI STILL REQUIRED.** Author statements are not Technical-Lead acceptance.

Author/session: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation2**, `/root/m04_durable_jobs_writer_g2`. This is a new documented context-loss continuation of d9, not a claim to Generation1's old session. [Dispatch](https://github.com/Jetnity/jetnity/pull/1178#issuecomment-6756274057); [TaskV2](M04_RECOVERY_TASK_V2.md). Exact eighteen-source digest **`cc2e47f1afcec38ea749b1d3f88372a18ed01e14b2005501585e96dee4df1c3f`**; individual pins and check commands are in [source manifest](M04_PHASE_B_SOURCE_MANIFEST_V1.json).

## R9: what is now directly demonstrated

The two added full-factory protocol tests retain the actual nested S1 reserve executor under real M04/I1/worker control flow. In the natural I1 case, the unchanged5000ms facade deadline expires and a subsequent fail `queue_confirm` is observed while that executor is still pending. In the caller-abort case, cancellation propagates and the outward factory remains pending. Three other same-facade method calls retain the remaining lanes. A fifth invalid call is `unavailable` while all four are occupied and becomes `invalid` only after the original reserve is released and actually joined; the three other promises remain pending at both checks. No terminal fail/complete CAS, backoff state, finish or late native admission is observed. Every gate is released and each started promise is joined in finally.

An additional test directly invokes the existing exported `composeM04Invocation` with a real owned scope, actual standalone MA1 and an explicitly handwritten fixed-request protocol bridge. It observes the **raw integration result** `unconfirmed` while the same reserve remains pending, then separately observes `scope.drainNative()` and `scope.finish()` remain pending with one occupied lane. Releasing the reserve permits both to complete and releases the lane. This test does not measure private `authorityCore`, a separately held raw worker promise or a natural30000ms worker expiry. The full-factory tests retain actual private wiring coverage. No protected code or production debug API was introduced.

The native group uses exact S1 operation2 (`reserve_v1`), which is inside I1 and distinct from pre-I1 capture/read. A separate holder locks the real captured operation row; target PID, backend birth, blocking holder and relation must be observed before cancellation. It then keeps that same executor at its existing `beforeDrain` hook. Target/control backends are already closed there: the test explicitly queries their absence and separately asserts retained executor/context ownership. It never calls that retained context a live backend.

Three pre-enqueued independent work calls use the same outward facade. Each performs its actual native MA1 read and retains its original executor promise with the unchanged30s work budget; they cannot start a producer while held. They enter before the nested native cleanup gate because the adapter serializes cleanup. Both lane checks require these three still pending, eliminating accidental method expiry as the explanation. The natural case also observes fail-confirm; explicit caller cancellation is labelled separately and does not claim a separately observed raw native worker return. Before/after snapshots include exact S1 operations, reservations and completions plus full M04 state. The original nested call must be dispatched, drained and uncommitted; admissions/state remain unchanged after join. Cleanup releases and joins all calls in finally. **These native assertions have not executed for this cut.**

## R10/R11 and diagnostic correctness

All four double `set_config` queries now return unique column names. This repairs a concrete incompatibility with unchanged `pg-wire` duplicate-column rejection while preserving statement/call counts. Source tracing correlates the historical18-operation setup stop to the fixture-marker query; the historical AggregateError did not independently reveal the code. New fixture-only diagnostics emit a finite phase and bounded sanitized LocalPgError/SQLSTATE or fixed error kind, with at most eight causes and depth2. Raw exception messages/stacks, SQL and parameters are excluded. Cleanup assertion errors are collected before the receipt so nativePass cannot become true on terminal failure, and errors still propagate.

The new SQL candidate's two PL/pgSQL record aliases now have distinct names (`binding_row`, `function_row`), avoiding collision with catalog relation aliases. Protected SQL, decoder, runtime authority contract, `variable_conflict`, budgets and workflow remain unchanged. Installation, runtime catalog assertions and rollback require actual CI.

## Full frozen proof map

The machine-readable evidence contains all22 U01–U07/N01–N15 rows, exact test/group anchors, assertion descriptions and practical limits. The table below is a navigation map, not a claim that a source test name proves every proposed variant or that native persistence passed.

| ID | Requirement | Concrete test files or native groups | Evidence state |
|---|---|---|---|
| U01 | Closed contract, all seventeen predicate families, strict shape/numeric/JSON admission | contract.test.ts | Named offline suite PASS; protocol/source limit |
| U02 | Full identity and support stripping after actual S0 validation | contract.test.ts | Named offline suite PASS; protocol/source limit |
| U03 | Immutable command and original claim/replay binding | composition.test.ts, contract.test.ts, postgres.test.ts | Named offline suite PASS; protocol/source limit |
| U04 | Whole-original/whole-batch D01 admission and bounded wire | composition.test.ts, contract.test.ts | Named offline suite PASS; protocol/source limit |
| U05 | MA1 custody, monotone deadlines and closed private outward surface | authority.test.ts, composition.test.ts | Named offline suite PASS; protocol/source limit |
| U06 | Nested I1/worker race and actual owned drain/retired lane | composition.test.ts, owned-scope.test.ts | Named offline suite PASS; protocol/source limit |
| U07 | Uncertain I1 results cannot create known failure | composition.test.ts, owned-scope.test.ts | Named offline suite PASS; protocol/source limit |
| N01 | Exact fictional install and security/catalog inventory | N01, N01/N14/T02 | Source implemented; current native NOT RUN |
| N02 | Native canonical/direct-entry identity | N02, N02/U04 | Source implemented; current native NOT RUN |
| N03 | Durable commands, exact replay and dedup | N03 | Source implemented; current native NOT RUN |
| N04 | One original START winner, ACK uncertainty and restart | N04/N06, N04/N06/N10, N05/N09, N04/N10/N12 | Source implemented; current native NOT RUN |
| N05 | All older unknown and finite history/ledger caps | N05/N09, N05/A03, N05 | Source implemented; current native NOT RUN |
| N06 | Preflight/start contention and independent progress | N04/N06, N04/N06/N10 | Source implemented; current native NOT RUN |
| N07 | Actual Rule S1/I1/PREPARED/completion/E1 path | N07, N07/R4 | Source implemented; current native NOT RUN |
| N08 | Sixteen persisted originals and whole-batch admission | N08, N08/U04, N04/N10/N12 | Source implemented; current native NOT RUN |
| N09 | Fresh-process PREPARED/completed recovery and claim fidelity | N05/N09, N09 | Source implemented; current native NOT RUN |
| N10 | Known failure versus unknown callback/native outcome | N04/N06/N10, N10/U06, N04/N10/N12, N13, N05/A03 | Source implemented; current native NOT RUN |
| N11 | Real waits followed by final authority/clock | N11 | Source implemented; current native NOT RUN |
| N12 | Acquisition/cancellation/ACK and nested executor terminal ownership | N12, N04/N10/N12, N12/U06/R9, N12/R7-03 | Source implemented; current native NOT RUN |
| N13 | Legacy original preserved but ineligible for M04 preparation | N13 | Source implemented; current native NOT RUN |
| N14 | Creator defaults, prerequisite drift and actual dependencies | N14, N01/N14/T02 | Source implemented; current native NOT RUN |
| N15 | Guarded rollback with nonempty and concurrent late history | N15, N15/T02 | Source implemented; current native NOT RUN |

## Preserved implementation boundaries

The dormant factory still exposes only enqueueRule/enqueueDiscovery/workOnce; actual existing S0/S1/I1/M1/E1 composition and original-byte custody remain. Whole-batch D01 admission precedes the first S1 effect. Older unresolved starts remain blockers across identities/reasons/epochs; known failure still requires privately justified original custody and actual child terminality. The new candidate remains seven tables/twenty-nine functions/fourteen guards/seven policies with actual final S1/MA1 proof, fixed dependencies and guarded companion-first rollback. No source change in this continuation alters those runtime designs.

Only four of eighteen sources changed. All49 protected input paths equal d9, including the two previously allowed authority files. Frozen plan and historical V7 evidence remain historical and unmodified. Root owns current-main integration after concurrent PR#1180 and all global continuity documents. No author Git mutation or publication occurred.

## Executed checks and honest limits

The five named nonnative files passed **64/64**,0 failures/cancellations/skips,8102.282633ms. Focused sixteen-root TypeScript5.9.3 has0 diagnostics; ESLint has0 errors/warnings. Node24.22.1 differs from CI22. During authoring, one initial full-factory timeout witness intercepted an original remaining method read because its helper hold was armed before coordinator microtasks settled; the finite test sequencing was corrected. The added raw bridge initially needed its explicitly test-only nominal request type. Final frozen checks passed; neither interim test issue established a production ownership defect.

The historical d9 native run failed before all groups and is separately recorded. Current native SQL syntax/installation, transactions, catalog/ACL assertions, real waits/process restart, full budget and terminal cleanup remain unexecuted until unchanged GitHub CI. No local PostgreSQL, native SQL/socket, full test:core/build or package installation ran.

The240-call terminal test is actual generic queue, standalone MA1 and scope through a handwritten fixed bridge; it is not a private-authorityCore-at240 proof. Source-derived wire bound160772 is below262144, but its native entry/reply assertion is pending. Same-Held exclusion remains a reviewed private source boundary, with no test-only production export. Arbitrary hostile JavaScript is not sandboxed: code-owned SQL-incapable producer/evidence/history ports remain a design premise. Native group N08's uncertainty coverage uses a separate finish-ACK-loss witness; no distinct sixteenth-write-loss execution is claimed.

## Risk and disposition

P0/P1 prevention (authority, full identity/privacy, original uncertainty, atomicity and terminal lifetime) is implemented but still requires independent exact-source/native acceptance before release. This author delivery activates no production change. P2 conservative unknown/capacity refusal, unbound provider/scheduler operation, public-p95 and inherited dependency/operational gaps remain. P3 inherited presentation limitations stay outside scope.

**AUTHOR STOP FOR ROOT REVIEW; no Ready/merge/follow-up slice.** Root must decide R9/R10/R11 sufficiency, integrate latest main, publish a new head and independently inspect all new exact-head CI/Preview/Production/thread evidence. Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17gaps; #917's refused readback is not retried/substituted. #1131, both #1135 holds, #968 and #911/#913 remain. No hosted DB/Auth/RLS/ACL/migration/credentials/Auth logs, provider/source research, scheduler, notification, cost or public activation.
