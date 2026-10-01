# Official Truth Demand-Driven Research Request Contract 1 — Handoff

Date: 1 October 2026
Issue: #700
Draft PR: #702
Branch: `feat/official-truth-research-request-contract-1`
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`

Logical agent: **Jetnity Official Truth research request contract 1**, Generation 1
Session: https://cursor.com/agents/bc-49bea35f-5d38-4697-8097-792a24b8bfe8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a pure research-request contract. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_TASK_2026-10-01.md`
2. `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_REPORT_2026-10-01.md`
3. `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_SELF_REVIEW_2026-10-01.md`
4. `lib/readiness/official-truth-research-request.ts`

`docs/ACTIVE_WORK_STATUS.md` was not updated. It is outside the task allowlist. This handoff is the continuity pointer for the slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- `git fetch origin main` in this session moved the local `origin/main` pin from the stale snapshot `a659bd9080c66908a69fb3602214ee395a3e85e8` to `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`.
- A later fetch in the same session still showed that SHA. Merge-base is that SHA. The branch was 0 behind. Re-fetch before treating any later SHA as current.
- Parallel Official Truth lane. Do not edit the Candidate Batch Validator lane, the source catalog, schema scanner, global continuity or Supabase files from this slice.

## Trust rule for the next reader

`missing` means the coverage result has no accepted claim for that key and fact kind. The research request asks for primary official-authority evidence. It does not mean an entry effect. Do not wire this function into `engine.ts`, `provider.ts`, a browser, OpenAI or the store writer unless a later versioned task says so. `requirementsProviderAus()` stays `null`.

One call evaluates one canonical rule-scope cell. It does not rank passports or citizenships. Another legal credential option is another call, and that call still carries the full citizenship set of its cell.

`none` is returned only when the coverage status is `current` and the supplied scope hashes to that same rule-scope key. A different scope is `research_scope_mismatch`, not a silent `none` and not a research of the other cell. A forbidden identifier blocks even a `current` cell.

The function does not recompute freshness and does not re-accept a rule claim. Acceptance remains `regelKandidatAkzeptieren`. Coverage remains `officialTruthAbdeckungBewerten`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No source-catalog seed and no provider call.
- No research execution and no Candidate Evidence.
- No UI and no public route.
- No follow-up slice.

## Exact-head gate

The pushed tip is the review head. Its GitHub CI, Auth job and Vercel Preview are not copied into this file in advance.

## Stop

No Ready. No merge. No Supabase apply. No import. No browser or model research adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
