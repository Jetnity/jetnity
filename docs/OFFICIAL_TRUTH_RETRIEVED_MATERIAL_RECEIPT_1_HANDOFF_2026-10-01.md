# Official Truth Retrieved Material Receipt Contract 1 — Handoff

Date: 1 October 2026
Issue: #707
Draft PR: #709
Branch: `feat/official-truth-retrieved-material-receipt-1`
Baseline: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`

Logical agent: **Jetnity Official Truth retrieved material receipt 1**, Generation 1
Session: https://cursor.com/agents/bc-1013f718-e4f9-42a3-9161-1b2e66261b41
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure receipt check for already retrieved official source material. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-retrieved-material.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session moved the local `origin/main` pin from the stale snapshot `0e62a532831e0711aad3bde645b239edea674705` to `e32c60e9f9d2bdc9db42c80eba6721e59e5120df`.
- Merge-base is that SHA. The implementation head `6bbf3be6b9a968ad95d7634e67f5f7fbf9d93a5f` was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.
- The review head is the branch tip after the lane-docs commit. Local gates in the report were run on `6bbf3be6` before that docs commit. The docs commit does not change runtime behaviour.

## Trust rule for the next reader

This function only accepts material that #705 already names as an eligible official source, at a URL that resolves to that same source. It does not fetch the page, rank sources, or turn a missing source into an entry effect. `blocked` with `source_not_eligible` means that selected id was not an eligible `official_authority` for that one cell. It does not mean the traveller is exempt.

A later research executor, if a versioned task creates one, must pass the retrieved bytes through this function before any model extraction. Calling `quellenRouten` or `quellenUrlAufloesen` alone would skip the official-only route, the tracking rejection, the injected clock, or the caller-hash ban. A tracking URL is rejected whole. It is not cleaned and then accepted. The receipt is not an argument to `evidenceKandidatAusModell`.

One call is one canonical cell and one selected source. Another credential option is another request. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No retrieval, no model extraction, and no Candidate Evidence.
- No UI and no public route.
- No edit to #702, #705, the source router, the source registry, evidence, or official time parsing.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser, fetch or model research adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
