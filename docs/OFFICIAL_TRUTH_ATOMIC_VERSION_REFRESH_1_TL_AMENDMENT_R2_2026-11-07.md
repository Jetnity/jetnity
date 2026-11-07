# Atomic Version Refresh 1 — TL amendment R2: canonical predecessor, semantic slots and bounded commit

Date: 2026-11-07. Issue #1152 / Draft #1153.
TASK V1 blob `b2a3fdb6c1f79cb187b22a7cc9d1a890b8d067d7`; R1 blob `ebd7c51b746891e44c8c8bfd8c09e47a84efe596`.
Root intermediate review: https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6710955853

Same author and session: Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1, `/root/atomic_version_refresh_writer`.
This amendment fixes three evidenced gaps in frozen Snapshot 1. TASK and R1 stay immutable. No new implementation slice or hosted authority.

## 1. Full canonical Old proof and exact SQL corpus restrictions

Before opening the write transaction, the coordinator must invoke the unchanged #1151 canonical reader on the original external witness. Require the unique verified expected predecessor and exact witness; otherwise refuse without attempting the transition. This is a fresh owned operation, not a reusable caller-supplied positive capability.

Keep the existing SQL reproof after acquiring the lifecycle lock and immediately before supersession. It must refer to the exact immutable predecessor closure, original bytes and originally supplied witness; a changed external lifecycle state is never forgiven by reading a newer cursor. The preflight's canonical result plus unchanged complete immutable material does not replace those SQL currentness checks.

The directly callable narrow wrapper must also close the concrete differences from the fixed canonical projection:

- Resolve actual Old AND New SelectedSupportManifest/Custody/validity-origin artifacts through the existing verified closure helpers. Compare the complete `{validFrom, validUntil, validFromBasis, validUntilBasis}` value to the code-owned fixed `derivePilotValidity(item, pilotBody(item))` result, along with the already required exact original bytes. A correct date with an incorrect qualified locator is refused.
- Require the complete Composed policy-registry definitions list to equal the unchanged projection's exact one-current-selected-definition list, including the actual selected definition pin. An additional inactive policy entry is not admitted merely because the selected descriptor matches.
- Preserve all existing scope, catalog, profile, extractor, policy, fact, review, observation and custody pins. These are finite equality restrictions against the frozen corpus, not a copied parser or a second rules engine.

Use closure-consistent negative fixtures to demonstrate both discrepancies, including direct SQL where applicable. Rehashing explicit corruption fixtures is permitted; synthesizing positive evidence or observation times is not.

## 2. Semantic support correspondence; immutable canonical receipt order

This section supersedes only the ambiguous cross-version physical-position wording in R1 section 1.

The existing receipt/review/support arrays retain their own required canonical version-ID order. Genuinely new version IDs can naturally change that physical order across actual observations. Do not mutate, reorder or rehash a valid receipt to make its positions match another receipt.

For comparison, map each version independently and bijectively onto the same complete fixed semantic slots, using the full admitted source/content-item/representation/profile binding. Every expected slot occurs exactly once; no missing, duplicate, extra, mixed or partially old slot. Within each matched slot require unchanged qualified bytes/content/fact/identity and strictly later new observation/version evidence. Bind original bytes to that version's actual receipt position, not the other receipt's index.

A natural change in version-hash ordering is allowed. An actually reordered or inconsistent receipt, body list, review or historical manifest remains refused by its unchanged canonical verification. Positive fixtures must work with the real observations obtained; no clock-based retry until convenient hashes appear.

## 3. Narrowly authorized frozen-seam change: shortened commit deadline

The proven gap is between the coordinator's pre-COMMIT check and the actual wire dispatch after asynchronous guard arming. A fixed 20-second commit guard can exceed a smaller actual source/retention/original-lifecycle bound.

The only additional existing source file authorized for modification is:

`scripts/db/official-truth-integrated-pilot-1/pg-wire.ts`
baseline blob `0d546eaf0acedff4e75157cdd1f05c6090ec30e2`.

Add one narrowly typed bounded COMMIT entry (for example `commitBefore`) that accepts the coordinator's already proved conservative absolute monotonic deadline and actual database cutoff. It may only shorten the existing commit operation. It is not a generic SQL proxy, caller callback, authority token, clock injection or application interface.

Requirements:

1. Preserve the ordinary existing `query` behavior and all current startup/statement/lock/idle/commit/recovery limits. No timeout increase, new dependency, broader connection target or role grant.
2. Retain the existing independently owned PostgreSQL guard, target PID/backend-birth/transaction identity, pre-established recovery/control connection and cancel/join cleanup. A Node timer or closing the producer socket alone is insufficient.
3. Bound the new path by the smaller of the existing 20-second guard and the actual remaining deadline. Use the actual database cutoff in the server-side guard so guard scheduling does not silently restart an expired source budget.
4. Check the immutable monotonic bound after asynchronous arming work and synchronously immediately before the actual COMMIT frame, with no intervening await. Expiry before dispatch must not send COMMIT.
5. Preserve actual dispatch/acknowledgement truth in bounded sanitized diagnostics as necessary. A definitely unsent COMMIT can be refused/not attempted. A dispatched commit without a trusted acknowledgement remains unknown. Preserve an actual CommandComplete(COMMIT) acknowledgement even if later ReadyForQuery/cleanup fails.
6. After acknowledged COMMIT, preserve the earliest SQL-derived deadline through producer-departure proof, independent unchanged #1151 readback, immutable result construction and the final outer success return. Do not reset it from a newer lifecycle timestamp or disable it after ACK.
7. If an actual ACK exists but any later deadline/currentness/cleanup/readback check fails, return committed but unverified, with no positive evaluation, automatic replay, undo or claimed rollback.

The bounded coordinator controls its own commit path. Do not claim that it forces arbitrary direct SQL callers to commit by a physical wall-clock instant, or that a received timeout proves rollback. The SQL wrapper must be valid at its actual guarded mutation/reproof points. Positive coordinator completion additionally requires all acknowledgement/readback/final-return bounds.

A deferred constraint trigger is not a substitute for this path: SET CONSTRAINTS can force it to run early, and later commit/ACK work can still be delayed. Do not add a purported universal commit-time authority based on such a trigger.

Required native additions: actual expiry during guard arming with no COMMIT dispatch; actually running deferred COMMIT constrained by a shorter deadline than 20 seconds; real acknowledged COMMIT followed by delayed cleanup/readback/final outer return beyond the earliest bound, producing committed/unverified. Preserve existing guard-loss/ACK semantics and run the unchanged legacy native tests through full CI. New test instrumentation belongs only in this new package; do not change old test expectations to accommodate regressions.

## 4. Internal failure points and scope

Root authorizes test-only state-asserting fault triggers in the newly owned disposable native test cluster, installed and removed by that test, to demonstrate actual New-bind-before-Old-supersede failure. They must assert the reached real state before raising a distinct failure. No production fault parameter, canonical migration or existing SQL-source change is authorized. After-supersession failure must likewise prove the actual reached state and complete rollback. Existing helper-level ACK-loss instrumentation must be labelled accurately, not described as a wire-packet-loss proof.

All prior frozen files remain frozen except the narrowly enumerated pg-wire seam. The unchanged #1151 reader and projection, existing SQL/migrations, corpus/parser and source authority remain unchanged. A broader necessary gap must return to Root before editing.

Every changed final head needs complete independent review, all three real test phases, fresh Auth, strict aggregate, Preview and ordinary Root merge/post-merge gates. No implementation PASS is granted by this amendment.

Development Stage1 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, actual ledger UNKNOWN; Stage2 NOT_ATTEMPTED. The refused readback and held #1131 remain untouched. Production activation and the real Owner/CH-pass/AA pilot remain separate reserved gates.
