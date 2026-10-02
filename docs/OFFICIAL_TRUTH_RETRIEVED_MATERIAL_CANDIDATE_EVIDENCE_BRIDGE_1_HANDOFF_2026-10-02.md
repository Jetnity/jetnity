# Official Truth Retrieved Material → Candidate Evidence Bridge 1 — Handoff

Date: 2 October 2026
Issue: #711
Draft PR: #713
Branch: `feat/official-truth-retrieved-material-candidate-evidence-bridge-1`
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`

Logical agent: **Jetnity Official Truth retrieved material candidate evidence bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-60f030cd-8951-4216-bd3e-a06f692b409c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure bridge from a re-checked #709 retrieval envelope to one candidate Evidence version. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-retrieved-candidate-evidence.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice. The status file on this branch still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session resolved `origin/main` to `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`. That SHA is the task baseline.
- The runtime head `27ec55d8eba77c748b47240ddf4588f97acc43b3` was 0 behind and 3 ahead of that SHA. Re-fetch before treating any later SHA as current. The docs commit does not change runtime behaviour.
- Local gates in the report were run on `27ec55d8` before the docs commit.

## Trust rule for the next reader

Call `officialTruthKandidatEvidenceAusAbruf` with the original envelope, the same injected clock, and only the bounded extraction object. Do not pass a receipt object. Do not pass model JSON as the scope. The function re-runs #709, rebuilds the cell from the #702 request, and sets `sourceId` from the validated receipt. `evidenceKandidatAusModell` is the only Evidence constructor.

`candidate_evidence` means the nested Evidence version is `candidate` / `pending`. It is not accepted and it is not Official Truth. `akzeptierteEvidenceLesen` returns null for it. `blocked` is a closed reason. It is not an entry effect and it is not `not_required`.

One call is one canonical cell and one selected source. Another credential option is another request. Citizenship is not reduced to the issuing country. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call, no acceptance, and no Rule Claim.
- No UI and no public route.
- No edit to #702, #705, #708, #709, the source router, the source registry, evidence, or official time parsing.
- No follow-up slice. The engine still does not call this function.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
