# Official Truth Review Suggestion Consistency Matrix 1 — Handoff

Date: 2 October 2026
Issue: #763
Draft PR: #765
Branch: `fix/official-truth-review-suggestion-consistency-1`
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`

Logical agent: **Jetnity Official Truth review suggestion consistency matrix 1**, Generation 1
Session: https://cursor.com/agents/bc-973637b7-5ecb-4f14-ab48-a195236f8c00
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

## Current state

The branch adds a fail-closed assessment/reason matrix to the existing advisory suggestion validator. The suggestion stays non-authoritative. It is a Draft. It is not Ready and not merged.

Read first:

1. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_TASK_2026-10-02.md`
2. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_REPORT_2026-10-02.md`
3. `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_SELF_REVIEW_2026-10-02.md`
4. `lib/readiness/official-truth-review-suggestion.ts`

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task allowlist forbids global continuity. This handoff is the continuity pointer for the slice. The status file still describes an older writer. Do not treat that older section as this slice.

## Session facts

- Machine mode: `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.
- The task baseline remains `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`.
- `git fetch origin main` before this docs commit left the branch 0 behind that SHA. Re-fetch before treating any later SHA as current.
- Matrix code head: `f4504e6e34009b293a1e0f6ab4e1b99fc9760c14`. Local gates on that tree: focused tests 11/11, `npm test` 4454 pass / 0 fail across 761 suites, typecheck, lint, build, diff check, operating-mode guard and hygiene pass. Lint is 0 errors and 148 pre-existing warnings, none in the suggestion files. This docs commit does not change runtime behaviour.
- PostgreSQL 16.15 was installed in this VM for the existing throwaway proofs. The package cluster was not started. No remote database was contacted.
- The review head is the branch tip after this docs commit. Re-fetch before review.

## Trust rule for the next reader

Call `officialTruthRegelReviewVorschlag` with the original `{ supports, metadata }` packet input and a suggestion of `assessment`, `citedSupportVersionIds`, and `reasonCodes` only.

Structural failures still win:

- unknown assessment: `invalid_assessment`;
- unknown or non-array reason: `invalid_reason_code`;
- duplicate reason: `duplicate_reason_code`;
- duplicate citation: `duplicate_citation`;
- citation outside the re-proven packet: `citation_not_in_packet`.

Only after those checks does the matrix run. A matrix failure is `inconsistent_suggestion` and does not echo the rejected reason code.

`supports_candidate` and `contradicts_candidate` need at least one citation. `insufficient_evidence` and `needs_human_review` may have zero citations. Every assessment needs at least one reason from its own allowed set. The allowed sets are in the report.

`supports_candidate` is still only a suggestion. It does not accept a Rule Claim. The decision-intent module does not import this module. Nothing here calls `regelKandidatAkzeptieren` or the store. `requirementsProviderAus()` stays `null`.

## What this slice did not do

- No migration, no Development apply, no Production apply.
- No provider, model, Auth, or network change.
- No edit to PR #764 store files, the packet, the fingerprint, the F9 authority guard, or rule acceptance.
- No #741 gate. That future gate must ignore suggestion assessment and reason codes as authority.
- No follow-up slice.

## Exact-head gate

Do not review `f4504e6e` as the tip after this docs commit. Exact-head GitHub CI, Auth and Vercel belong to the pushed tip. This handoff does not embed a run id.

## Stop

No Ready. No merge. No Supabase apply. No Rule acceptance slice and no model-review slice from this writer.

**STOP for independent Technical-Lead exact-head review.**
