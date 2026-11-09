# IN1 — real S1/N1 intake composition, TASK V1

9 November 2026. Root / Technical Lead. This finishes the real File→SQL→I1 acceptance explicitly required by [N1 TASK V1](https://github.com/Jetnity/jetnity/blob/10d3e4f44460513e6425714af2c8c0b3ab4678a6/docs/official-truth-product-v3/N1_TASK_V1.md), [N1 handoff](https://github.com/Jetnity/jetnity/blob/10d3e4f44460513e6425714af2c8c0b3ab4678a6/docs/official-truth-product-v3/N1_HANDOFF_V1.md) and [PROGRAM V1](PROGRAM_V1.md). It is not an arbitrary follow-up product slice or activation.

## Exact inputs and author

- Live main `ce3366e26de73961d4682236af92347bfc3a4ca8`, NORMAL; fresh Guardian inbox read has no newer material report.
- S1 #1168 source-reviewed candidate `bb5ce4d69f9e479867581ecf0262e549bfc20e6c`, tree `17a35e395cab636d47c451dbc943315ab5ede314`. Source/R4 review accepted for Draft publication only; mandatory native/Core CI42613102499 is still running. No native PASS is assumed.
- N1 #1170 `10d3e4f44460513e6425714af2c8c0b3ab4678a6`, actual CI42605139395 successful. Runtime source reviewed again; 46 independent filesystem tests pass. Their fake intake is not a SQL proof.
- Common merge base `78ae1691cb9e8e75a3c353d2be0f83a2e2f82b81`; frozen intake contract SHA256 `49c4c4f5c2fd0b163be4f387af47032ed8c030fd75e7bfecd875af775bf6f69b`.
- Branch `feat/official-truth-v3-intake-composition-1-20261109`, worktree `/workspace/scratch/01cbe1264212/jetnity-v3-intake-composition`.
- One implementation writer: **Jetnity Official Truth V3 Intake Composition 1 — Codex Generation 1**, session **/root/v3_intake_composition_writer**. This is a distinct bounded composition task, not an invented resumption of the unavailable N1/S1 Generation1 sessions. No Cursor identity is claimed.

Before edits beyond this taskseed, read the required startup/operating documents and these exact source inputs. Send a short `IN1_PLAN_V1.md` covering actual tests, ownership and merge resolution to Root; implement only after Root accepts it. Upstream CI may reveal S1 corrections; do not silently consume local unpublished files or change upstream implementations. Root explicitly repins any successor head and re-gates the complete composition.

## Composition ownership

Merge the exact N1 input into this S1-based worktree without committing or publishing. Preserve all N1 runtime/tests/docs byte-for-byte. Root's Git merge-tree preflight found only the expected Foundation-guard conflict. Resolve it as the finite union below, preserving the scanner, existing assertions and both branches' negative cases.

Five unique artifact-helper consumers under `lib/readiness/official-truth-product-v3/`:

| File | Exact names |
| --- | --- |
| `storage/intake-contract.ts` | `immutable`, `ownRecord` |
| `storage/quarantine-codec.ts` | `immutable`, `ownRecord`, `provenanceCanonical` |
| `storage/quarantine-postgres.ts` | `immutable`, `ownRecord` |
| `storage/retention-shape.ts` | `provenanceCanonical` |
| `ingress/service-server.ts` | `ownRecord` |

Deduplicate the shared contract entry. No wildcard, directory allowance, alias normalization, namespace/default import, extra helper or scanner change. Keep S1's exact Regulierungs entries unchanged and Content-Identity byte-identical. This task is the explicit Root authorization for that one finite conflict resolution.

Own new implementation paths: `scripts/db/official-truth-v3-intake-composition-1/`, the mandatory wrapper `lib/readiness/official-truth-product-v3/integration/intake-native.test.ts`, and `docs/official-truth-product-v3/IN1_*`. Compose existing public N1/S1/I1 seams and test-only S1 fixture/native-executor helpers. No production test hook or runtime change is presumed necessary. Report an actual upstream defect to Root instead of editing another writer's owned code.

## Required real acceptance cases

1. **Actual file → committed SQL → stored original → I1.** Create a real run-owned, pinned temp directory and regular UTF-8 JSON file with original whitespace. Use actual N1 plus actual S1/native SQL executor. Exact reference, byte digest/length and SQL BYTEA must match. Before I1 assert one operation, zero reservations/completions and no source extraction/acceptance. Remove the source file. Fresh store/executor and ingress instances confirm the same reference. Reopen SQL and submit only `reopened.record.text` with its stored binding into I1; no fixture-text shortcut. Read back the full completion/audit. Prepared remains `acceptance: not_committed`; no Accepted/cache write or new authority is fabricated.
2. **Refusal before retention.** Through actual N1→S1 reject top-level, nested and escaped duplicate member names, including an earlier private canary hidden by a repeated valid final key. No capture SQL dispatch and no original/reservation/completion row. Include one real unsafe-file case with zero intake SQL; keep all inherited N1 filesystem tests.
3. **Concurrent delivery and collision.** Independent executors deliver the same file/binding concurrently and converge on one immutable original. Changed whitespace or runner/delivery/input-revision binding under the same operation yields nonpositive collision/refusal and does not mutate or duplicate custody.
4. **Lost actual capture acknowledgment.** Native executor commits but withholds capture ACK. N1 reports recorded only after exact-reference confirmation, with one capture, at most one confirm, completed capture drain before confirm and one row. Withhold confirmation ACK too: result remains unconfirmed. Delete the file and recover through a fresh explicit confirmation without filesystem access.
5. **Actual blocked SQL and cancellation/deadline.** Observe the exact dispatched backend PID/birth, active statement and real lock wait with known blocker before aborting through N1. Terminate/drain owned SQL, forbid a late positive and post-expiry confirmation. Prove precommit rollback/no row and honest uncertain reference. Preserve existing budgets and cleanup discipline; no timing-only assertion or detached Promise.race.
6. **Custody is not method approval.** A canonically shaped proposal can be stored as untrusted while the separately resolved synthetic method is unapproved. Actual I1 yields full `method_not_approved` outcome/audit, with no accepted write. Researcher file/metadata cannot construct trusted runner configuration, source/job/Owner/method authority.

Existing S1 real child-process interruption coverage remains mandatory. Fresh objects/connections in IN1 must not be described as process-restart evidence. Use only existing fictional fixtures; no statement about actual current entry law or source freshness.

## Verification and deliverables

Use supplied Node22.23.4 and existing dependencies. Existing CI discovers the new lib wrapper unconditionally with no skip. **No local PostgreSQL launch/retry, socket-path or TCP switch, alternative operator, or guard bypass.** The existing mandatory normal GitHub CI is the permitted native execution environment; offline syntax/type/fixture checks must be labeled accurately. No central workflow, driver, dependency, budget or skip change.

Run actual offline V3/N1 tests, precise guard union tests, whole typecheck, scoped lint and existing five hygiene checks. Provide source/head input snapshot, manifest with byte-identical upstream pins, changed-file inventory, actual commands/results, honest pending native evidence, self-review and `IN1_HANDOFF_V1.md`. Root independently reviews and publishes, then accepts only actual exact-head native/Core/build/Preview evidence.

Only this worktree. No commit/ref/remote mutation unless Root expressly instructs. Do not mark Ready; do not merge; do not start a follow-up slice. STOP for independent Root review; immediate fixes return to this same session while available.

## Unchanged reserved gates

No hosted DB/Auth/ACL/RLS/migration/credential query or mutation, real source/provider/researcher call, public route, scheduler/notification activation or new cost. The specific refused #917 readback is not retried, rephrased, delegated, rerouted or handed to a human substitute. #917 independent readback/ledger and #1139/17 pre-Owner gaps remain open. Method NOT_APPROVED, Dev package NOT_RELEASE_READY, SQL UNAPPLIED; no database/Production activation before the separate mature package and Owner approval. #1131 Ready-STOP, #1135, #968 and other privacy/Owner gates remain.
