# M04 Recovery R41 — Root source review and release boundaries v1

Date: 12 November 2026. Reviewer/decision authority: ChatGPT Technical Lead / Root.
Disposition: **SOURCE PASS** for the exact corrected source identified below. This is a dated pre-publication source review, **not** CI, deployment, installation, method activation or public-release PASS.

## 1. Why this repair is required

Actual main `4313049c2a8c276f2a63101dda8df996327230e0`, tree `5a331f1a8846e8dc07a3e0a6de033fcf8da7400f`, failed its own push CI [43150141948 / #4117 / attempt1](https://github.com/Jetnity/jetnity/actions/runs/43150141948). M04 group25 N05 exceeded the frozen240000ms effect budget during actual start64, after63 completed starts. Group24 completed all256 actual ledger commits; group25 did not finish and groups26–31 did not execute. Core/Aggregate failed; the other six jobs passed. Clean terminal cleanup does not complete the missing proofs.

Historical #1190 PR run43146039408/#4116 passed its own exact head. That earlier PR evidence cannot pass the failed actual-main run. Root preserved both complete M04 payloads/TAP, all168 Core structured diagnostics per run, all317 companion objects per run, raw Atomic 22P02 lines, actual-main job steps, full Aggregate output and log/artifact identities in [M04_RECOVERY_R41_EVIDENCE_V1.json](M04_RECOVERY_R41_EVIDENCE_V1.json): blob `0711d48e6500e9f3e55c29fc6c7e420896fe9e7b`,937539 UTF-8 bytes,SHA256 `bff3cd4e7def40f622ce771a38f3d1a0a40a6227dadb247d766ffc21d8e3a4f3`. The original whole Core logs remain separately identified by their actual byte counts/hashes and GitHub job sources; this JSON does not claim to contain both entire raw logs.

The failure supports investigation of sequential native test cost. Fixed-call client await totals were56766ms for the ledger and87870ms for cycles, while command construction was465/366ms. These are client durations, not proof of a server bottleneck, runner contention or production SLO.

## 2. Authority, author and rejected head

Binding task: [R41 / V31 v3 PhaseA](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6814186404) and [PhaseB1 amendment](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6814328565), copied in full into [M04_RECOVERY_R41_TASK_V1.md](M04_RECOVERY_R41_TASK_V1.md).

Actual implementer remains **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation4**, reachable original session `/root/m04_durable_jobs_writer_g4`. Root used the same session for this immediate review fix. No new successor session is implied. The Product Owner's permanent unreachable-session exception remains recorded in the operating standard; it does not replace truthful actual session evidence.

First candidate `1c372a662658f18c31e358f944aca683b9fa7b91`,tree `20cd02b439cc7eb78c526054c0bde4531290a13d`,Native blob `34067778683d69965c70501faaff6b3c7279e953`,199455bytes/SHA256 `5db9469249268d0e0c5a7b6da1fd7d1b69f2d15abf1802d850e1e937880a886f`, was **CHANGES REQUIRED**, never SOURCE PASS. [Root disposition R41B1-NODE-01](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6814683745) records the concrete P2 finding: the new first-error record retained an unknown cause, but final cause-truthiness could yield failure:null/nativePass:true for a falsy Throwable such as0, although Node would still fail the subtest. This was a source counterexample, not an observed CI result or claimed whole-run bypass.

The same G4 session returned corrected candidate97fe69abc3e6a702c0cd98b32adef633823a6a61. Root and the independent Node reviewer confirmed that explicit assertion/primary failure-presence flags now drive propagation and terminal reporting, and first-record selection preserves the actual cause even if it is nullish or falsy. R41B1-NODE-01 is CLOSED for this corrected source. The exact endpoint comparison contains11 presence/error-selection replacements (nine contiguous text-edit regions), with every other byte identical to the rejected candidate. No execution occurred during this correction.

## 3. Exact corrected candidate and manifest

- Sole parent: `4313049c2a8c276f2a63101dda8df996327230e0`.
- Author candidate: `97fe69abc3e6a702c0cd98b32adef633823a6a61`.
- Candidate tree: `28b50f72aa1f8bc22b2b48ff4f33c15ff1e0dce9`.
- Only source change: `scripts/db/official-truth-v3-durable-jobs-1/native.ts`.
- Native blob: `625a0bbd2be8cf56311992e8ef09292885a3133f`; UTF-8 bytes **199707**; SHA256 `a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea`.
- Full GitHub patch: 38008bytes/SHA256 `d5c83cd215819d9b22c6fb62b917c702e4b7050b72dca5bb2645c00df7462616`,6hunks. Root independently replayed the entire patch against the original full source and obtained the exact corrected full bytes.
- Baseline Native: blob `0b3f7d9906687ec42171de5af60fed009d07b39f`,191098bytes/SHA256 `f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0`.
- Candidate full tree:10316 entries/9473 leaf entries;9472 other leaves unchanged, no mode/path/type substitution.
- Ahead1/behind0, merge-base equals the sole parent at source review.

All18 source pins below use exact actual blobs. The17 non-Native pins are unchanged. Aggregate serialization is lexicographic path order, each line `sha256 + SPACE + decimal UTF-8 bytes + SPACE + path + LF`. Baseline aggregate `f9f0bfaf2476692119f63e474bb61988bc0d50bb3c4518b96ee4987ef56e40e2` was reproduced. Corrected aggregate: `5e3936a760de912c78c073b596dcab2c7ae2b6670f0a2cfc5e1df06c462e11a8`,2395serializedbytes.

| Path | Blob | UTF-8 bytes | SHA256 |
|---|---|---:|---|
| lib/readiness/official-truth-product-v3/jobs/composition.test.ts | `2909b02861c4fef06edf8d1c4adf7109df0db97b` | 27466 | `4b8cc4d40cda71d07a4a99c38a103634d194d24bf288fd6a73cfe0f87014820c` |
| lib/readiness/official-truth-product-v3/jobs/composition.ts | `4f6e3d1a8902b0637b6b7e219d210ff364fe9779` | 22124 | `ff060734982233c0afe4455da4865fbb70ada750e3a733165bbd8d33fda0bd34` |
| lib/readiness/official-truth-product-v3/jobs/contract.test.ts | `01db56a4f260ad698a0dcb60d7f208407c51b37a` | 13319 | `2c9ccbdb30eb00e8b56b1ab0a56dac578facfdcf8a7c39bcfd40f10d68daa895` |
| lib/readiness/official-truth-product-v3/jobs/contract.ts | `9c67612b77da9d6779a26f87d5aa1f785b8ab1a3` | 27249 | `46c8893003d337b736fc85f66db5ef828dafaecccfdbbfe1b027d60e7532684d` |
| lib/readiness/official-truth-product-v3/jobs/native.test.ts | `4bbfa957f78dabc539be864671ce775eff57455b` | 150 | `c8513b83b691584948583621552b222a325b9abf3858eba5c836b9423f7638c9` |
| lib/readiness/official-truth-product-v3/jobs/owned-scope.test.ts | `39693def8fe2c9b6fa3f873752dc58dc6d9b9f75` | 4330 | `fdd75e573e53263f5dce9e9571b0331ea63d8315682a5ca55befea9a49554326` |
| lib/readiness/official-truth-product-v3/jobs/owned-scope.ts | `c80c48cca369cc8ea0c30bc5f620cada639a1e05` | 8816 | `f1fe66e3311ddbc5c6209d046188f653e2895ad1857565ad52bc8d777046c94e` |
| lib/readiness/official-truth-product-v3/jobs/postgres.test.ts | `e2caa902072b421f8b5ed00bbad72eadf995cdce` | 5985 | `8ad5cd9a0ba887f5dd0ff767a9f478f7dbcf67f232b39d254fad515f00372183` |
| lib/readiness/official-truth-product-v3/jobs/postgres.ts | `3c519e73fc440146bafe168983ae96d765b4a66f` | 12578 | `e906165fcb33a9a4c84d6445d1f2d6ae61c829c8e8127afae307dfa94b0509a8` |
| lib/readiness/official-truth-product-v3/method/authority-postgres.ts | `19be9e9b914e37d115828edebdd71d14033fbfb1` | 16656 | `c06a222cdebbfa74f10bf222bf9a8df32fb488fab8939b3ea56f194c657eca3d` |
| lib/readiness/official-truth-product-v3/method/authority.test.ts | `4986199904f8e2b0fb8ab83b04f7f585e651f364` | 37608 | `2363b7283d7ba484d8df561bfb99c125f4f256ac0edb047db8684497c7c4f661` |
| scripts/db/official-truth-v3-durable-jobs-1/fixtures.ts | `5280246b707f506c5d9d83929562965faea9279c` | 6321 | `68312bc9424dc71066b6717135f4d13bf350968618dadda143b9b7e16f0bd927` |
| scripts/db/official-truth-v3-durable-jobs-1/generate-identity-vectors.ts | `b3c25d9276e5d36e6ed7083da53de87fc8642056` | 6324 | `aae453a17142947ab83de25fca7160c316277574f3d0941e5318f6ed6e0957e7` |
| scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.rollback.sql | `bb371a26f018107439d0031f5f72c23675aaf97c` | 6175 | `9b9089d74242a802455cc7e3fb8a0a8515c17b61b45ae730b9bbba1adb650a66` |
| scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql | `7021673c611b0b2cc5dc62cbd5dccb92e5024837` | 160983 | `0d2210d84c02aacbeef1c8e14b38e7be6c2e3e8c387057fd97666fb00c71bba4` |
| scripts/db/official-truth-v3-durable-jobs-1/native-adapter.ts | `66e7dd443c51b7db8d90d99c8b6422d1226ff237` | 13389 | `5c34ce52023d7840e09d004d9c577a2bd4dc78efb3171e7e7b8aff07b0cf7b57` |
| scripts/db/official-truth-v3-durable-jobs-1/native.ts | `625a0bbd2be8cf56311992e8ef09292885a3133f` | 199707 | `a61b94e98691ecf6212f2e9cadfada3d470927c319f0ef9a6ed008f63ec658ea` |
| scripts/db/official-truth-v3-durable-jobs-1/process-worker.ts | `f3bd0bb399d5b5f7c0578d67c61adbce2adf5329` | 8128 | `f37008c8a9164059d6b169997b07b9f5223297dd6187a316711c4226fda5e033` |

## 4. Root's independent behavioral review

### Scope and proof preservation

The change permits concurrency2 only in this existing M04 native parent so two independent quota subjects on the same existing cluster can overlap. Existing plan423 requires sequential clusters/max3; the B1 amendment expressly authorizes this one test-parent scheduling exception. Every other proof remains explicitly awaited. No workflow, runner, global test concurrency, SQL, adapter, driver, fixture, production concurrency or time budget is changed.

All31 original proof names/order are preserved. Proofs1–23 remain byte-exact as a121479byte region, SHA256 `98ef4bf95716dba82640b47d6fa65a5c1e1eca3bc081ba4a0eed9945d4750f29`. Proofs26–31 and original intervening teardown/setup remain byte-exact as a10927byte region,SHA256 `fcbf1427248e08af777884c33aa6427b8590e516e4237e8bc13cf3575622ff3f`. The two quota bodies retain the original assertions/SQL/call counts after only the reviewed lane/serialization wrappers and second runtime-handle substitution.

The required workload remains256 actual ledger commits,64 actual completed starts,a genuine65thclaim refusal,terminal-credit/full older history and contradictory-pointer refusal. The fixed-call total remains520 starts/519 normal returns, including one expectedP7603 rejection. Fresh MA1/S1/full-history/per-call transactions and both actual R9 blocked-operation/abort/drain/backend-absence witnesses remain required. No historical counters can be substituted for fresh runtime receipts.

### Ownership, serialization and inventories

The original restricted runtime is retained for the ledger. Exactly one extra same-login/role restricted runtime is acquired through the unchanged owned fixture for cycles; no new pool/driver/raw socket is introduced. It opens before either lane's full backend inventory; the same handle set remains through both before/after comparisons. Only after both complete proofs and both serializers join is the extra runtime closed and actual backend absence checked before group26.

Shared owner operations and observer inventories use distinct deferred FIFO serializers with bounded admission, lifetime checks before admission and dispatch, truthful counters and original errors returned to the caller. Owner/observer queues do not nest. The neutralized internal queue tail only allows serialization settlement; it is not a success result for a failed operation. ExpectedP7603 remains inside the original assert.rejects path and is not converted into global cancellation.

### Node completion, abort and first cause

Root read the actual unchanged OwnedTestLifetime implementation, including run/track/beginStop/drain/dispose, and the new full proof/pair code. Node test completion is not assumed to prove raw-body settlement. Each quota proof separately joins its raw body, owned lifetime wrapper and Node runner; the pair awaits settled full-proof outcomes and both serializer tails. The runner-settled seal prevents a late callback from admitting detached work.

The raw-body catch records the first actual failure before OwnedTestLifetime's post-abort check can replace it. The first record wins; peer failures do not overwrite the cause. It immediately aborts/seals effect work; later cleanup/settlement remains allowed without admitting new SQL effects. No child TestContext.signal listener aborts the shared effect controller: successful child completion also aborts that Node signal and must not stop its peer. No tracked lane body disposes/drains its own lifetime.

Root independently traced the corrected falsy-cause path: assertionFailurePresent is set in the inner catch before propagation; firstQuotaFailure is selected by record presence rather than cause truthiness/nullishness; primaryFailurePresent is set unconditionally on the outer catch and controls the failure object,nativePass and aggregate throw. A present failure with0,false,an empty string,NaN,null orundefined retains its original aggregate cause and cannot claim nativePass. The unchanged bounded nativeFailure serializer returns a non-null classified record without leaking arbitrary payloads. Cleanup-only errors still fail independently. This is source reasoning,not a synthetic runtime receipt.

### Honest evidence and frozen boundaries

Proof ordinals are reserved before the first await; only completed proofs are recorded and final records sort by those original ordinals. Each lane owns its own phase/boundary/timestamps/failure/join flags. Fixed-call interval counters require actual client-await overlap and return active0; they do not claim server execution/CPU parallelism. Receipt accounting must come from the new run, including the extra owned handle; the unchanged derived guard/control floor remains mandatory.

The240000ms effect,60000ms cleanup and300000ms parent limits are unchanged, without timer reset/pause/retry. Pair setup,queueing,joins and backend absence remain inside the existing effect budget. Whether runtime now fits is not established by source review.

## 5. Independent reviewers and Root decision

- `/root/ch_de_release_gate_audit`: full source/tree/scope,31proofs,quota-body preservation,17unchanged pins,SQL and manifest; reviewed corrected-head delta again.
- `/root/ch_de_method_readiness`: Node/lifetime/error/abort/joins; found R41B1-NODE-01; reviewed exact corrective head for explicit failure presence and unchanged original cause.
- `/root/ch_de_ci_reconstruction`: complete original evidence and eight Root documentation blobs; final ninth-document/joint-package consistency remains a separate publication gate.
- Root independently read the complete actual diff/source areas, replayed the patch, verified tree/blobs/hashes/manifest/proof regions and the finding/fix. Agent self-review is never Root PASS.

Both source reviewers returned corrected-head SOURCE ACCEPT/PASS with no remaining finding in their respective scopes. Root confirmed the original evidence, full actual source patch, endpoint correction,31proof identities/preserved regions,9473leaf tree and18-source manifest independently. Root therefore issues SOURCE PASS for the corrected author candidate only. The prepared Root continuity/evidence package and all runtime/release gates remain subject to the explicit final checks below.

## 6. Bounded Root integration and gates still pending

The integration adds this exact author Native blob to the nine authorized Root documentation paths: marker-only ARCHITECTURE.md,JETNITY_HANDOFF.md,JETNITY_START_HERE.md,ROADMAP.md,docs/ACTIVE_WORK_STATUS.md; additive prefix to M04_HANDOFF_V1.md preserving the entire85387byte historical suffix; three new R41 TASK/ROOT_REVIEW/EVIDENCE records. Ten paths total,seven modified andthree added; no existing completion/failure record is rewritten. Root has checked all five marker-exterior regions and the unchanged handoff suffix. The final joint commit/tree/PR identifiers and fresh runtime results belong in its PR/#751 receipt, avoiding a self-attestation commit cycle.

Before publication: verify exact joint10-path tree/full diff, all9document bytes/modes, corrected Native unchanged, same current main/rules/operating mode, one-ahead/zero-behind merge base, and independent final-package review. Then Root alone may publish a fresh non-forced branch/Draft PR for existing reviewed CI/Preview.

Before Ready/merge: all8CI jobs on the exact candidate,actual synthetic checkout parents/tree,original Core/M04 and companion receipts,31groups/fullquotas/realR9/cleanup/resource/inventory/overlap proofs,Preview exact source identity,review threads/rules/main drift and independent Root release judgment. No Auth logs, secrets or restricted hosted readback. No unchanged retry. Every changed head re-gates fully.

After merge: confirm exact merge commit/tree,parentage,new own push CI and Production deployment plus jetnity.com/jetnity-app.vercel.app aliases. A PR pass cannot pass actual main. A Vercel READY state cannot prove CH→DE functionality.

## 7. Product truth, remaining risks and next boundary

- **P0:** no new P0 source finding established by this bounded review; this is not a blanket platform-security attestation.
- **P1 release blockers:** failed main must be repaired and re-gated; #1139 actual target/authority/install prerequisites are still incomplete; #1142 installation is NOT_VERIFIED and its actual target installation state is unknown; current AA qualification and active D1/source/import/version/cache/jobs/publication connections remain unproven.
- **P2 source finding:** R41B1-NODE-01 is CLOSED on the exact corrected source only. Timing improvement remains unmeasured; fresh CI must establish it within the frozen cap.
- **P3 continuity:** prior PR/Main PASS evidence is historical; current pointers preserve failed actual-main truth and do not silently erase it.

#917 is administratively CLOSED/not_planned with unfinished product work explicitly transferred to #1162 and target/install remainder to #1139. Existing human Run2 is accepted for its observed Stage1 function/configuration/ACL/fingerprint values; actual Stage1 ledger ID/history remain unknown and Stage2 historically NOT_ATTEMPTED. The original platform STOP is retained. No denied operation was repeated, reformulated, delegated or replaced by a new human SQL workaround. MA1's exact #1142 guard prerequisite remains a real installation dependency; an old Stage1 ledger ID or old TripWorkspace feature is not invented as a direct MA1 runtime input.

#1131 is independently NOT_REQUIRED and remains held/untouched. The separate AA candidate59c794fbcbf7a16bb0d4e8d1e89e3d29b7bd88b9 is SOURCE_ONLY,unpublished,Run0/unarmed. No DNS/source GET occurred; after accepted repaired main it requires rebase/repinning/new exact review before any separately bound one-shot execution. The current pilot window has not yet been extended beyond13November.

The Product Owner already authorized the five-step CH→DE path,one-time D1 approval and window extension; no ordinary approval request is needed. Target public date remains15November2026,not a proven delivery result. Genuine publicCH→DE remains off. No unrelated travel/hotel/flight work is introduced.
