# Trip Plan Editing and Placement Recovery 1 — STATUS

Date: 24 October 2026
Status: **code-review repair implemented on the draft branch, stopped for independent Technical-Lead re-review. Not Ready. Not merged. Not Technical-Lead code PASS.**
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Issue: #996 (leave open)
Draft PR: #999
Branch: `fix/trip-plan-editing-placement-recovery-1`

## Identity

- Session: `bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d`
- Link: https://cursor.com/agents/bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d
- Actual model: `grok-4.7-high-fast` (requested Grok 4.7 High Fast). Not Auto. No fallback.
- Same writer and session as the accepted plan. No replacement generation.
- `origin/main` and merge-base: `0c37d318c47a758f06634448d6e0de3856bbc6a6`
- Accepted plan head: `a4fc53c20433d0c6214acf483ae81648390d1896`
- Accepted plan blob: `98e6d31842647176400b0ae4cfa9ed62b0c87a71`
- Plan blob after the binding no-op clarification: `b0665bc1f6309c590c4cb6d6d9e673a3cc54c436`
- TASK V1 blob, unchanged: `42b124f5f68172aaa51365b028bb22772d362dcc`
- Reviewed implementation head: `8d4fe188025515ab3b9b1168b3281f2f0bde39a1`
- Repair evidence head: `545cbdf783e75ab82f8d23b5f1533b60e56f06a5`
- Earlier runtime evidence head: `aa594b18a0d827b9dcae1b607bfefa4b45764d06`
- Ahead/behind at the repair evidence head: 14 / 0
- Mode: `NORMAL`. This slice does not cross a special Product-Owner gate.
- Lane A of R105. Integration remains A → C → B. No sibling branch is integrated.
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, and #751 are not edited.

The first docs commit after `aa594b18a0d827b9dcae1b607bfefa4b45764d06` recorded the implementation stop at `8d4fe188`. This repair's docs commit follows `545cbdf7` and does not change runtime. A new head invalidates these gates. Native CI 40107587054 gates only `8d4fe188`.

## Code review V1 repair

Technical-Lead findings A-P2-CODE-01, A-P2-PROOF-02, and A-P2-PROOF-03 are repaired in this same session. Native App/Auth CI run 40107587054 on reviewed head `8d4fe188` was green and does not cover this repair.

An older delete error stays visible. Focus moves to that alert only when the delete still owns the interaction. Opening a newer editor, starting a save, changing day, or changing trip takes that ownership. Ordinary delete-error focus still runs when nothing newer has taken it. Save and cancel still return focus when that editor still owns it.

The harness now addresses each pending callback. A genuinely pending save is unmounted and then resolved. Guest delete is proved by the target's DOM absence, its absence from storage, and the surviving items plus revision. Two saves can be pending together. A same-id content or placement change with equal revision and `rowVersion` is a conflict for both `null` and error. Save and Cancel are measured directly at the required widths.

## What this branch now does

An existing plan item can be edited with no selected day, moved between a day and the unassigned list, and removed. A delete error is visible on the plan, including a zero-day trip. Guest delete reads the active key once, compares the full projected basis, and writes the current unprojected graph only when that basis still matches and the target exists exactly once.

## Binding no-op clarification

If the expected domain equals the original domain, the single visible item with that domain is an expected-domain match even when `rowVersion` is unchanged. That includes a genuine guest no-op. Close still requires this operation's `null` callback and unchanged operation and draft ownership. "Null alone" does not require a new `rowVersion`. The mounted guest no-op fixture keeps the item version. The Account fixture still uses a changed `rowVersion`. No writer or callback was expanded.

## Still open for the Technical Lead

- Independent exact-head re-review of the repair. This status is not that review. The earlier review of `8d4fe188` found no P0 or P1; the three P2 findings are the repair in this head.
- Exact-head App CI, Auth CI, and Vercel Preview. Local proof is not those gates.
- Ordinary merge stays with the Technical Lead. This author does not merge, does not mark Ready, and does not close #996.
