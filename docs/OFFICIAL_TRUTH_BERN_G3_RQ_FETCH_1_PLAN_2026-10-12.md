# Official Truth Bern G3-RQ-FETCH-1 — Plan

Date: 2026-10-12
Issue: #934
Parent: #917
Draft PR: #935
Task blob: `fc4a2db0fd9a3ee552ce6da212d696ee38ef8135`
Seed head: `057d39f72aa476b5f2fa2d1853c34880c1c37086`

## Goal

Implement the guarded developer-only Bern S3 research fetch path for task phase A, while preserving all existing official-truth transport/security boundaries and leaving phase B unexecuted.

## Scope executed in this slice

- Binding task seed alignment.
- A03 protected-shared transport arbitration assessment.
- Versioned blocked-state reporting package (plan/status/report/self-review/handoff/evidence).

## Decision in this slice

A03 gate is triggered: enabling a 131072-byte Bern research read without cloning HTTP requires a change in protected shared retrieval internals (`lib/readiness/official-truth-server-owned-retrieval.ts`).

Per binding task, no protected edit is made before independent Technical-Lead arbitration.

## Files touched in this slice

- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_TASK_2026-10-12.md` (seed task document applied)
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_PLAN_2026-10-12.md`
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_STATUS_2026-10-12.md`
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_ARBITRATION_PROPOSAL_2026-10-12.md`
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_REPORT_2026-10-12.md`
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_SELF_REVIEW_2026-10-12.md`
- `docs/OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_HANDOFF_2026-10-12.md`
- `docs/evidence/official-truth-bern-g3-rq-fetch-1/manifest.json`

## Gate outcome

- A01/A02: completed by live/code review.
- A03: **BLOCKED_PENDING_INDEPENDENT_TL_ARBITRATION**.
- A04–A12: not started pending A03 approval.
