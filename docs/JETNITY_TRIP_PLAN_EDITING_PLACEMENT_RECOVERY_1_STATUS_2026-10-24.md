# Trip Plan Editing and Placement Recovery 1 — STATUS

Date: 24 October 2026
Status: **implemented on the draft branch, stopped for independent Technical-Lead code review. Not Ready. Not merged. Not Technical-Lead code PASS.**
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
- Runtime evidence head: `aa594b18a0d827b9dcae1b607bfefa4b45764d06`
- Ahead/behind at that evidence head: 10 / 0
- Mode: `NORMAL`. This slice does not cross a special Product-Owner gate.
- Lane A of R105. Integration remains A → C → B. No sibling branch is integrated.
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, and #751 are not edited.

The docs commit after `aa594b18a0d827b9dcae1b607bfefa4b45764d06` adds this status, the report, the self-review, the handoff, and `docs/evidence/trip-plan-editing-placement-recovery-1/`. It does not change runtime. The PR comment records `git rev-parse HEAD` after that push. A new head invalidates these gates.

## What this branch now does

An existing plan item can be edited with no selected day, moved between a day and the unassigned list, and removed. A delete error is visible on the plan, including a zero-day trip, and receives focus only while that delete operation is still current. Guest delete reads the active key once, compares the full projected basis, and writes the current unprojected graph only when that basis still matches and the target exists exactly once.

## Binding no-op clarification

If the expected domain equals the original domain, the single visible item with that domain is an expected-domain match even when `rowVersion` is unchanged. That includes a genuine guest no-op. Close still requires this operation's `null` callback and unchanged operation and draft ownership. "Null alone" does not require a new `rowVersion`. The mounted guest no-op fixture keeps the item version. The Account fixture still uses a changed `rowVersion`. No writer or callback was expanded.

## Still open for the Technical Lead

- Independent exact-head code review. This status is not that review.
- Exact-head App CI, Auth CI, and Vercel Preview. Local proof is not those gates.
- Ordinary merge stays with the Technical Lead. This author does not merge, does not mark Ready, and does not close #996.
