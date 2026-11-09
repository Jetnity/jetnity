# M04 final Phase-A review — runtime, identity and lifetime

**Disposition: no open runtime/identity/lifetime design blocker in the frozen Phase-A delivery.** The four findings R2-01–R2-04 are resolved in the actual final plan bytes. This is an independent specialist design review, not a Technical-Lead PASS, implementation acceptance, native proof, dispatch, Ready decision, merge or installation approval. Root alone decides whether to freeze and dispatch Phase B.

Reviewer: `/root/m04_uncertainty_advisory`, the same read-only review session. Author: `/root/m04_durable_jobs_writer`, Jetnity Official Truth V3 Durable Jobs1 — Codex Generation1. No implementation or native test was executed for this review.

## 1. Exact review target and evidence

Frozen delivery directory: `/workspace/scratch/01cbe1264212/recovery/m04-root-review/author-delivery-v1/`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `M04_PLAN_V1.md` | 120753 | `1952dc9c930021d32620f769595bb6f1641743574265f918cad6d36cfefdb88e` |
| `M04_PHASE_A_SOURCE_PINS_V1.json` | 28544 | `fe70d74f42638c1fb9b40304818fb6b278232752be038734a5ba5277a8001c11` |
| `M04_PHASE_A_SELF_REVIEW_V1.md` | 11029 | `9eb56ec078c4a00dc76f0f2416e7379bfcd34b4fd8502d4ec02fc2d1daf4fb9d` |
| `M04_PHASE_A_STATUS_V1.md` | 6602 | `54e5df45041a849d969653e07c6c9d20557cae033577e06676ad6f627b1c903a` |
| `receipt.json` | 975 | `0bdea0b9d161ac983f62724784d4197b0d6488938281e9c22b6519849e2ad7a7` |

Read coverage is the complete previously reviewed V2 plan (`a98fc797fb0091ca58ae78b19e35007582df9950e6d0240f868c64313950fae6`) plus the complete exact final delta, including the new final lock/dependency/teardown and recovery-attempt-key sections. The final source-pin document, author self-review and status were read completely. Portions truncated in an initial diff output were subsequently read in separate bounded ranges. Runtime compatibility was checked against the actual queue, worker, integration, I1, S1, S0 and MA1 source already inspected in this same session; the exact queue post-CAS path was read again for this final review.

I independently recomputed the current local hashes and sizes of all **49 repository inputs and four specialist inputs** listed by the final pin document: all match. Hash identity does not imply complete substantive review of every pinned file, or runtime proof. Git blob comparisons and live service state remain Root/author evidence; this review performed no Git or network operation.

The source baseline remains historical main `7ae1394a00e2b23a60da98d2a029fd6a10c8189d` and M04 seed `14889b050bc6e8b814bc778730c80f70d20c0d47`. Root separately reported live main `be79ea2591e990111bfabea7ddf500023c20a188`, with the protected inputs unchanged after Booking PR #1179. I do not re-attest live main, CI, Preview or Production from this offline design review. Root owns integration against live main before freeze.

## 2. Resolution of R2-01–R2-04

| Prior finding | Actual final correction | Specialist disposition |
| --- | --- | --- |
| **R2-01: database authority cap could regain elapsed time; overlapping reproof could shrink an in-flight Held** | Plan lines 462–466 derive `r = floor(Held.deadline - b)` only after actual read/cleanup and the latest Held calculation. The absolute database cap only shrinks. The new joint factory excludes overlapping same-receipt observation/effect admission and retains exclusive effect custody through acquisition, SQL, ACK, cleanup, decode and final checks. | Resolved as design. Existing standalone MA1 overlap behavior remains protected. Native/monotonic timing proofs remain mandatory. |
| **R2-02: pending I1 evidence/history callbacks could survive a raced facade while an outer lane was reused** | Lines 120, 376, 381 and 386 register each actual callback before dispatch, bound the ledger to eight active/128 cumulative, and retire an outer lane until every admitted producer/evidence/history callback and native child is terminal. Four retired lanes exhaust availability; no TTL/reset or late SQL finalizer exists. | Resolved as design. I1 outward `outcome_unknown` alone never proves callback completion or frees the lane. |
| **R2-03: sealing at delivery completion would prevent the required subsequent S1/I1 work, or confuse failure drain with its own transaction** | Lines 122 and 381 separate pure delivery termination from the longer execution-processing subtree, which includes capture/I1/preparation. Failure custody requires actual terminal callbacks and native children, sealed admission and no ambiguity. The subsequent joint failure transaction belongs to the outer scope and is excluded from its own prerequisite join. | Resolved as design. The original processing scope is not reopened for later work. |
| **R2-04: A01’s older-unknown rule could block the original Claim/read/terminal-confirm chain needed to settle PREPARED or a privately known failure** | Lines 332 and 445–458 provide exact prepared-only recovery and the closed private `continuation` on queue read/confirm. It admits only the matching original full claim/fence and sole unresolved attempt; any other older unknown blocks. Missing terminal command means ledger absence only. Authorized data and CAS still require actual authority and appropriate S1/failure custody. | Resolved as design. It grants no fresh Claim CAS, producer start, transferable receipt or failure authority. |

The amended A02 preserves the actual MA1 sequencing: the exclusive observation is not over merely because a raw executor promise ended. Decoding, latest Held mutation and private cap update are part of the observation's terminal boundary. Conversely, an effect owns that receipt until its actual native terminal/decode/final-check boundary. These requirements are present in the final observation/effect wording and ownership map; they are not a change to the old standalone factory.

## 3. Full original-operation continuation and post-settlement ownership

The final design supports the unchanged generic control flow without treating an execution-negative result as fresh permission:

1. `artifacts.resume` checks the complete stable subject and all retained uncertainty before the generic worker consumes a Claim attempt. Eligible PREPARED requires the original claim/current live fence and original approval epoch. Its generic `not_attempted` means only “no completed worker yet”; private prepared-only custody disables all reserve/producer paths.
2. The worker can reconcile the original immutable Claim command and its exact record. The private prepared continuation permits the corresponding current-queue read and missing original Complete command check while that original attempt remains unresolved. A new Claim CAS or a different claim cannot use this exception.
3. Result lookup/confirmation reconstructs only result custody after actual S1/MA1 proof. The Complete CAS stages the exact queue command and matching disposition atomically, with full original identity, actual S1 validation, final current MA1 and original lease checks for the new effect.
4. A known failure uses separately earned private custody after all execution-processing callbacks and children actually end. The joint Queue-Fail/disposition cannot borrow certainty from a generic `commit_unconfirmed`, `verification_unavailable`, I1 race, missing reply or expired lease.
5. After acknowledged completion, E1 may reopen the original artifacts and repeat its existing I1 integration path under fresh same-epoch authority. No producer permission is reconstructed. Changed approval epochs cannot revive an old unknown or PREPARED attempt.

Two implementation allocations are required by these existing requirements and should be explicit in the Phase-B control flow. They are **not additional design blockers or scope requests**:

- **Retire transient continuation after known settlement.** Actual `monitor/queue.ts` lines 138–150 and 184–186 call `confirmed()` and then `storage.read()` after a committed CAS. A non-null continuation in the plan is a permission to traverse the *unresolved original* path. Once a Complete/Fail CAS has a validated actual COMMIT acknowledgement, terminal cleanup and decoded result, the private adapter must retire that transient continuation before the generic post-CAS current read. The ordinary null-continuation read then verifies the now-settled complete history/current record with authority. Never clear it on a query-row result, before actual ACK/drain, or after an ambiguous response. Exact already-committed command reconciliation remains observation, not a new effect.
- **Keep later outer work separate from the sealed original subtree.** Sealing after PREPARED concerns the original delivery/capture/I1/preparation subtree. Queue Complete and E1 artifact reopen/repeated I1 remain admissible as separately classified outer-owned operations. Their evidence/history callbacks still use the same per-invocation eight-active/128-cumulative ledger and four-lane retirement rule. This uses the existing outer ownership and callback inventory; it neither reopens the old subtree nor introduces an unaccounted callback class. Plan line 476 explicitly budgets later E1 imports after known queue settlement.

The existing proof matrix's successful original resume/Complete/E1 and known-failure cases must exercise the post-CAS read and post-PREPARED ownership boundaries, rather than stopping at a raw native row or PREPARED index. This is coverage of already planned paths, not a new workflow, endpoint or slice.

## 4. Identity, replay, capacity and recovery checks

**Semantic subject and canonical parity.** The plan retains complete source-derived canonical preimages as the identity comparison, with hashes as locators only. It distinguishes context/condition normalization, support stripping followed by renormalization, the legacy insertion order of RuleScope/research keys, and full immutable command contents. Active enqueue dedup may return the older same-cycle full context/reason even when a new semantically equivalent enqueue carried other support/reason fields; the plan does not replace that historical command with the newest input. Native parity and malformed/raw-form fixtures remain required.

**M04-D01 and actual chronology.** Root's selected restriction applies to producer original context/research normal form, without rewriting original bytes and without widening Rule or Discovery applicability. It is an explicit new producer admission restriction, broader than country aliases. The complete immutable Rule delivery or entire Discovery batch is validated before the first S1 capture/I1 effect. Outer enqueue still uses the unchanged raw S0 reader. A producer's earlier hidden S1 effect cannot be reclassified as a pre-effect rejection. The fixed dependency/callback admission boundary is therefore a reviewed code-owned precondition, not JavaScript sandboxing.

**Uncertainty and known failure.** All starts without a disposition, including PREPARED, are unresolved under the stable subject. A new enqueue ID, job ID, fence, reason/support variant, restart, capacity limit or new method approval cannot erase an older unknown. Bounded all-history checks must disagree closed with the pointer/counts. A known SETTLED_FAILURE is useful only with its matching immutable Queue-Fail and allows later claims solely under the existing queue policy; it is not a general reset operation.

**A03 terminal capacity.** The final plan reserves the Claim's terminal command credit under the same subject serialization and checks `operation_count + CASE WHEN terminal_credit_claim IS NULL THEN 0 ELSE 1 END <= 256`. Claim requires its own slot plus the future terminal slot before burning an attempt; interstitial dedup cannot spend the credit. START rechecks the exact claim credit and reserves result/disposition capacity. Complete/privately justified Fail consumes the credit with the immutable operation and disposition atomically. The 16 reserved native admissions protect the disposition path within the finite invocation cap. The previously identified legal quota trace is addressed; later actual native proofs must demonstrate the specified boundary cases.

**Recovery attempt key.** Authorized execution reads add the data-only validated `attemptKey` beside the complete original claim/job/result/references. It comes from actual immutable rows and belongs only in reconstructed private result/artifact custody. A probe returns none; it is not an epoch extractor, start token or failure token. Original/current epoch equality and complete constituent checks remain required. This closes the locator gap without expanding the six-operation inventory or outward three-method facade.

**SQL privilege boundary.** From this runtime review, the proposed new fixed S1 owner-owned definer bridge is consistent with the original privilege issue: `postgres` NOINHERIT/BYPASSRLS alone does not confer the missing S1 object privileges. The plan grants access to the new helper, retains the consumed real OID dependencies, and leaves old S1/MA1 roles/grants/defaults unchanged. The independent SQL specialist owns the full function/ACL/lock/rollback inventory review; this report does not substitute for it.

## 5. Honest remaining limits and stopping point

The final self-review and status correctly stop for Root freeze; neither claims TL acceptance or native implementation proof. No author-only claim was upgraded to an independent PASS here.

Phase B still has to implement the finite inventory and prove TS/native identity parity, strict full-record/command validation, all failure/restart/ACK-loss paths, same-Held admission, exact callback retirement, actual native acquisition/drain/cancellation, quota reservations, and the SQL privilege/dependency/rollback behavior. Aggregate 262144-byte wire capacity and CI timing are planned bounds, not measured results; a valid counterexample requires Root review, never silent truncation or expansion. Retiring all four invocation lanes deliberately sacrifices availability while unknown external callback termination remains unproved. Native executor and pure callback implementations remain explicit reviewed preconditions.

No code, SQL, native test, socket, Git/ref, hosted service, provider, Auth/log, credential, installation, Ready or merge action was taken. Method remains NOT_APPROVED; #1139 remains NOT_RELEASE_READY; the #917 readback refusal and every existing Product-Owner hold remain unchanged. No retry, reroute, delegation or human substitute for that refused readback was attempted.

**STOP:** this bounded specialist review is complete. Root owns any final wording allocation, freeze, live-main integration and Phase-B dispatch. There is no next-slice permission from this receipt.
