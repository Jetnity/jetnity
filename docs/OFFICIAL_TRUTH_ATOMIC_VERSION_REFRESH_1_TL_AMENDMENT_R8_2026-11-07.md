# Official Truth Atomic Version Refresh 1 — TL Amendment R8
Date: 2026-11-07 UTC
Status: explicit immediate POST-MERGE CHANGES REQUIRED correction; same task #1152, same author/session; no new product slice

## 1. Authority, exact baseline and observed failure

Only Root Technical Lead decides PASS, Ready or merge. Assigned author: **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, actual session **/root/atomic_version_refresh_writer**. Cursor stays paused. Return/STOP after one complete immutable delivery.

The original TASK remains immutable at blob b2a3fdb6c1f79cb187b22a7cc9d1a890b8d067d7. R1–R7 and R6A remain immutable; R7 blob dfa4485d3cb27e21ccb16ffca062b9b1010b2dce. This R8 explicitly supersedes R7's two-file-only delivery limit for the narrowly enumerated immediate correction below.

Actual main/publication baseline: **ddb36b2b6a5bd67afa4249028f57a1ea318ec7d8**, tree **dccde88ac41710aea5ccf43482b11af9b34d82fa**; parents a2a3f175670dd7744dbb56ed81fee70c38bbdf38 and b03febcbd5b804bf6ba83a24ddb8fb0b37cfdb23. #1153 is merged; #1152 is reopened because independent Main acceptance failed. The previous PR PASS is not a Main PASS.

Root failure receipt: https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6714372502
Actual main run: https://github.com/Jetnity/jetnity/actions/runs/42422798183
Native job128554632780; aggregate128559374120. Attempt1 only; no rerun authorized.

Completed original evidence:
- Parent failed at900002.26605ms with testTimeoutFailure, explicit900000ms timeout, at23:10:52.251UTC.
- 115 diagnostics; last complete R6 timeout/rollback marker844691ms. All3R6 cases had coordinator/hooks/connections settled and zero cleanup failures up to that point.
- Race completion/actor-settlement and all4 terminal cases absent. The exact internal race state at timeout is UNKNOWN.
- Work continued after Parent failure: provider events until23:14:03.886UTC; runner cancellation around23:14:58 with orphan Node/Postgres termination. No complete late cleanup proof.
- Primary positive SQL19662.146ms (5337.854ms reserve under25s); Composed22043.352ms (2956.648ms reserve), both actual acknowledged COMMIT, closed producer and fresh canonical readback.
- Eight reference/current raw/retained probes completed/restored. Current verifier1835/2072ms retained and1734/1952ms raw; graphworker about732–888ms and artifact_v2 about698–837ms. These profiles do not isolate the cost of each inner statement.
- Primary section438785ms; Composed cumulative558221ms; three corrupt-Old harnesses to715299ms; Guard/R6 to844691ms. Only55309ms Parent budget remained before race and terminal matrix.
- Core8194/8192/0/2, full isolation/hygiene/build; Persisted95diagnostics/45reads; Auth55values/243keys all SUCCESS. Strict aggregate correctly FAILURE because refresh=cancelled.

Pinned baseline files:
- native.test.ts blob12b5531e3986561320f9a2a3f41cff2da95f13ba, SHA2564d36e1b0ced5136ca076d68303d6053ab80abfb9677fcd45f18e8ab2bf0cdfe4.
- semantic-v2.sql blob9ee835c477b3bbd7cba3352a6201db8d573ccb36, SHA25620999778ffae8df285d7460da6e51ae240027b9fc80f5fc233879e1ea6752055.
- Handoff blobfdf615de2b4d3bfe1c7adef8f4289851dbf08a1e.
Use the complete Final10 snapshot as baseline, not Final9 or a partially reconstructed file.

## 2. Deliver one coherent correction

### A. Real Parent lifetime, cancellation and owned cleanup

The900s Parent currently never consumes t.signal. Introduce a test-local owned lifetime before the first asynchronous operation, tied to t.signal. This is orchestration for the existing complete native proof, not a new authority or runtime framework.

Required properties:
1. Parent abort prevents later harness/cluster/connection/actor creation and prevents transition to the next scenario.
2. Register clusters and actual owned connections from creation, including partial setup before owner.connect or migration installation completes. No resource may depend on reaching a later normal finally.
3. Propagate Parent cancellation to ordinary refresh/reader operations and existing blocked/race controllers; release owned resume/early barriers so intercepted connection hooks can settle. Check cancellation at meaningful awaited boundaries and on return from operations that cannot themselves accept a signal.
4. Actively close owned transports on abort so a pending query/connect/hook cannot keep the proof alive. Preserve precise ownership; no scanning/killing unrelated processes or global production resources.
5. Restore patched global connect/commit hooks reliably. Existing allSettled-before-close sequences must not cause unbounded teardown. Initiated actors, observations and deferred commitBefore promises need actual bounded settlement; failure must remain failure.
6. Stop every owned local cluster using its existing bounded stop mechanism. The infrastructure cleanup bound is not additional proof/SQL/authority time. Do not swallow assertions or cleanup failures and do not claim full success when the Parent aborted.
7. Add a meaningful actual disposable-PostgreSQL regression for this lifetime, including abort during a pending operation/gate, no further scenario/cluster work, restored hooks, settled actors and gone own backend identities. Use an injected/local abort through the same lifetime path; do not wait900s or create a fake successful Parent. Source guards must bind the actual Parent t.signal to the proved mechanism.

Review known locations in the baseline: openHarness creation before try around116–133; normal observe()/reader calls; commitBefore promises around879/920; blocked finally around1058–1065; race gates around1143/1150 and finally1205–1211; later harness opens around795/816/832/1221. These are entry points, not an exhaustive resource inventory.

### B. Reduce demonstrated cumulative work without reducing proof

The full unchanged matrix must finish with real measured reserve inside the existing900s Parent. Do not merely make the job terminate on failure.

The TL-selected bounded SQL optimization candidate is the repeated metadata membership scan inside the existing private **validate_inspected_graph_v2**. You may replace its repeated edge/root array scans with a complete per-invocation metadata index built after unchanged prechecks. Bind all original matching fields and preserve bigint casts, NULL behavior, duplicate/count handling, type checks, malformed-input refusal and byte/graph validation. The index is not a validation witness; it must not outlive the invocation. Keep original full artifacts as the source of every byte check and all other semantics.

Keep the graph traversal/longest-depth/cycle/bounds suffix, public wrappers, artifact_v2, decode, semantic joins, outer retained/current reproofs and other SQL function definitions byte-identical. No SQL type/function/grant/API additions. If a safe membership-only optimization cannot address the measured deficit, return a precise finding to TL before widening this part of the implementation. Do not assert a speedup from source intuition.

Preserve all9 outer reproofs and actual publish/bind/supersede, Old/New canonical readers, full table snapshots, full immutable payloads, eight owner-only reference/current raw/retained probes,14 paired adversarial comparisons, actual role denials, count256 SQL refusal, all fault/corrupt-Old/COMMIT/R6/race/terminal cases. No replacing the reference baseline or moving work outside the timed Parent to gain apparent reserve. New lifetime proof adds coverage.

## 3. Exact writable scope

Allowed:
- scripts/db/official-truth-atomic-version-refresh-1/native.test.ts
- At most one new test-local helper under that same directory for owned lifetime/cancellation, with no application/runtime importer.
- scripts/db/official-truth-atomic-version-refresh-1/fixtures.ts: only optional Parent-signal/check propagation between the existing actuallyFreshObservations operations, if needed to prevent starting later work after abort. All five real fresh producers, complete payloads, corpus, observation ordering and existing execution budgets stay unchanged.
- lib/readiness/official-truth-atomic-version-refresh-1.test.ts for focused meaningful lifecycle/source-isolation guards, if needed.
- scripts/db/official-truth-integrated-pilot-1/semantic-v2.sql: only the existing validate_inspected_graph_v2 body/declarations for B; all other definitions/suffixes as above unchanged.
- docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_HANDOFF_2026-11-07.md: append actual R8 changes, evidence, remaining gates and failure history.

Do not edit shared pg-wire, runtime refresh/reader contracts, engine, fixture payloads or normal fixture semantics, reference fixture, workflow, package commands, migrations, production files or older TASKs/amendments. A demonstrated need outside the list requires a concrete TL decision before editing. No new dependencies or installation. The complete author delivery must include all17 existing author files plus any authorized helper; unchanged files remain exact.

## 4. Hard limits and non-goals

Unchanged900s Parent and20min CI job; unchanged25s SQL,15s lock,20s idle/COMMIT and existing reader/deadline/guard limits. No splitting/sharding the Parent to evade its bound. No favorable unchanged retry, skipped/removed/softened assertions, smaller positive payloads or hidden setup outside the measured suite. Do not treat an abort as positive, restart authority time or auto-replay an uncertain commit.

No hosted database query/apply/readback, no migration/role/Auth change, no real source request/admission, no grants or pilot/provider activation. Stage1 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING; ledger UNKNOWN; Stage2 NOT_ATTEMPTED. The original refused readback has no evidenced platform clearance. #1131 and other held work remain separate and must not be copied. No Cursor/cost/settings changes.

## 5. Delivery and independent completion criteria

1. One immutable complete snapshot plus manifest (old/new Git blobs, SHA256, byte sizes, changed flag), exact full delta, scope and mechanical unchanged-function/traversal proofs. Bind baseline main and the actual immutable R8 seed separately. Never change this task file.
2. Updated truthful Handoff: actual Main failure and missing late cases retained, precise lifetime/resource strategy, index equivalence reasoning and performed checks. No local PG compile/PASS if unavailable.
3. Full matrix remains mandatory, including actual late race/terminal results and added abort cleanup. Record Parent elapsed/reserve, both25s positive reserves, all relevant completion markers and actual cleanup. No local or PR partial pass used as Main evidence.
4. Root independently reviews complete source/diff, publishes the correction as a new Draft PR, and runs all exact-head Core/Persisted/Refresh/Auth/Preview/hygiene/build/strict aggregate gates. Root alone Ready/merge after PASS.
5. Actual new main must independently complete the entire fresh gate set and correct Production/alias/HTTP checks. Until that happens #1152 remains open and no POST-MERGE PASS is claimed.
6. After delivery returned/STOP. No automatic follow-up or other feature implementation.

This is an explicit Technical-Lead choice to correct the current incomplete release. It does not replace the separate real database/source/Owner/Production path A–F.
