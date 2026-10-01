# Official Truth Freshness and Gap Policy 1 — Handoff

Date: 1 October 2026
Issue: #685
Draft PR: #687
Branch: `feat/official-truth-freshness-gap-policy-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Official Truth freshness and gap policy 1**, Generation 1
Session: https://cursor.com/agents/bc-d935cad0-43b7-419f-a9a7-32935c34ef86
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure coverage and freshness policy. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-coverage.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session moved the local `origin/main` pin from the stale snapshot `7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e` to `9c494110196a2877f6eba3babe7cf5ae7c00acf1`.
- Merge-base with that pin is the same SHA. The branch was 0 behind. Re-fetch before treating any later SHA as current.
- Parallel lane B. Do not edit the Source Catalog, schema scanner, global continuity or Supabase files from this slice.

## Trust rule for the next reader

`missing` means there is no accepted claim for that key and fact kind. It does not mean `not_required`, `required` or `conditional`. Do not wire this function into `engine.ts`, `provider.ts` or the store writer unless a later versioned task says so. `requirementsProviderAus()` stays `null`.

One call evaluates one canonical rule-scope key. It does not rank passports or citizenships. Another legal credential option is another key.

The function does not re-accept a rule claim and does not read a fact payload. Acceptance remains `regelKandidatAkzeptieren`. Freshness re-checks lifecycle, validation, scope, fact kind, support identity and the injected clock.

Without `maxAgeMs`, old `retrievedAt` can still be `current`. Do not add the one-hour Official Evidence ceiling here.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No UI and no public route.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
