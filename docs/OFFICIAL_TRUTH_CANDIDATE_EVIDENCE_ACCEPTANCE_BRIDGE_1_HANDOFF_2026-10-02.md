# Official Truth Candidate Evidence Acceptance Bridge 1 — Handoff

Date: 2 October 2026
Issue: #714
Draft PR: #716
Branch: `feat/official-truth-candidate-evidence-acceptance-bridge-1`
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`

Logical agent: **Jetnity Official Truth candidate evidence acceptance bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-8dbb1a52-e186-4f2c-b61a-b6f077b894e6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure bridge from a re-checked #713 candidate to one accepted Evidence version. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-accepted-evidence.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice. The status file on this branch still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session resolved `origin/main` to `16f3a8d631bb823c9daafc724df67c000dcb5985`. That SHA is the task baseline.
- The runtime head `d10ef0f2ae0e54380bc561d734679f464ade6c53` was 0 behind and 2 ahead of that SHA. Re-fetch before treating any later SHA as current. The docs commit does not change runtime behaviour.
- Local gates in the report were run on `d10ef0f2` before the docs commit.

## Trust rule for the next reader

Call `officialTruthAkzeptierteEvidenceAusAbruf` with the original envelope, the same injected clock, and only the bounded extraction object. Do not pass an Evidence object. The function re-runs #713 and then calls `evidenceKandidatAkzeptieren` with that candidate and the registry on the same envelope.

`accepted_evidence` means the nested Evidence version is `accepted` / `valid` / `official_authority`. It is provenance acceptance. It is not a Rule Claim, not an entry effect, and not Official Truth about a visa or transit outcome. `blocked` is a closed reason. It is not `not_required`.

One call is one canonical cell and one selected source. Another credential option is another request. Citizenship is not reduced to the issuing country. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No model call and no Rule Claim.
- No UI and no public route.
- No edit to #709, #713, evidence, rule claims, the source registry or the source router.
- No follow-up slice. The engine still does not call this function. The store writer is not wired to it.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No persistence slice. No Rule acceptance.

**STOP for independent Technical-Lead review of the exact branch tip.**
