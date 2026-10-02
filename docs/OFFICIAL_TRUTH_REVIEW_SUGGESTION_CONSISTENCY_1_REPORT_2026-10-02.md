# Official Truth Review Suggestion Consistency Matrix 1 — Report

Date: 2 October 2026
Issue: #763
Draft PR: #765
Branch: `fix/official-truth-review-suggestion-consistency-1`
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`

Logical agent: **Jetnity Official Truth review suggestion consistency matrix 1**, Generation 1
Session: https://cursor.com/agents/bc-973637b7-5ecb-4f14-ab48-a195236f8c00
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

`officialTruthRegelReviewVorschlag` still validates one advisory suggestion against one re-proven #723 packet and its #726 fingerprint. This slice adds one consistency matrix after the existing structural checks.

Order:

1. personal-key, shape, packet and fingerprint checks, then assessment enum, reason-code enum, duplicate reasons, duplicate citations, and citation membership;
2. the assessment/reason/citation matrix;
3. advisory `review_suggestion` output.

The new fail-closed reason is only `inconsistent_suggestion`. It covers an empty mandatory citation list, an empty reason list, and any reason outside that assessment's allowed set. The blocked object is `{ status: 'blocked', reason: 'inconsistent_suggestion' }`. The rejected reason code is not copied into the output.

The assessment vocabulary and the seven reason codes are unchanged.

### supports_candidate

Requires at least one cited support and at least one reason. Every reason must be `support_text_matches_candidate`. A conflict, ambiguity, stale, source-conflict, insufficient, or human-judgment reason blocks, including when it is paired with the match reason.

### contradicts_candidate

Requires at least one cited support and at least one reason. The only allowed reasons are `support_text_conflicts_candidate` and `support_sources_conflict`. A non-empty list of those reasons therefore contains at least one of them. A match, ambiguity, stale, insufficient, or human-judgment reason blocks.

### insufficient_evidence

Requires at least one reason. Allowed reasons are `support_scope_ambiguous`, `support_stale_or_time_unclear`, `support_sources_conflict`, and `support_insufficient_for_claim`. Citations may be empty. A match, text-conflict, or human-judgment reason blocks.

### needs_human_review

Requires at least one reason. Allowed reasons are `support_scope_ambiguous`, `support_stale_or_time_unclear`, `support_sources_conflict`, and `proposal_requires_human_judgment`. Citations may be empty. A match, text-conflict, or `support_insufficient_for_claim` reason blocks.

Success is still `status: 'review_suggestion'` with the re-computed v2 `reviewPacketKey`, `ruleScopeKey`, the assessment, sorted citations, and sorted reason codes. There is no accepted lifecycle, trusted fact, or decision. The function does not call `regelKandidatAkzeptieren` and does not call the trusted store. `requirementsProviderAus()` stays `null`.

## What the tests lock

- A valid `supports_candidate` with one citation and `support_text_matches_candidate` returns the same v2 `reviewPacketKey` as the fingerprint.
- `supports_candidate` with zero citations, with an empty reason list, or with any non-match reason blocks as `inconsistent_suggestion`. The rejected code is absent.
- A valid `contradicts_candidate` with a citation and a conflict reason passes. Both conflict reasons together pass and come back sorted. Zero citations, an empty reason list, and a match reason block.
- Each allowed `insufficient_evidence` reason passes with zero citations. All four together may also carry a packet citation. An empty reason list blocks. Match, text-conflict, and human-judgment reasons block.
- Each allowed `needs_human_review` reason passes with zero citations. An empty reason list blocks. Match, text-conflict, and insufficient-for-claim reasons block.
- A foreign citation, a duplicate citation, a duplicate reason, an unknown reason code, and an unknown assessment still return their existing reasons. Those checks run before the matrix, even when the matrix would also fail. The rejected text is not echoed.
- The suggestion module imports only the packet and the fingerprint. It does not import or call `regelKandidatAkzeptieren` or the store. The decision-intent module does not import the suggestion module. `requirementsProviderAus()` is `null`.
- Success output still has no `trustedRuleFact`, `lifecycle`, `decision`, snapshot, or proposal.

## Traveller context

The matrix does not read citizenship, residence, documents, or route. One suggestion remains one re-proven regulatory cell. A second credential option remains a different key. This slice does not choose a passport and does not invent a visa, transit, health, carrier, or document rule.

## Boundaries kept

- No edit to the store, the #723 packet, the #726 fingerprint, the F9 authority guard, rule-claim acceptance, app/API, Supabase, or global startup files.
- The diff against `8325a5be` is the task seed plus the suggestion module, its test, and these three delivery docs. PR #764 store files are not in the diff.
- No database, Auth, provider, model, network, or Production mutation.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates ran on `f4504e6e34009b293a1e0f6ab4e1b99fc9760c14` before this docs commit. That commit is the matrix. This docs commit does not change runtime behaviour. `git fetch origin main` before the docs commit resolved `origin/main` to `8325a5be988ec9e8d1fbd79dd75129373176be2e`. The branch was 0 behind and 2 ahead. Re-fetch before treating a later SHA as current.

PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite created its own temporary clusters through `/usr/lib/postgresql/16/bin/initdb`. No remote database was contacted. This slice did not add or apply SQL.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-review-suggestion.test.ts` | 11/11 pass |
| `npm test` | 4454 pass / 0 fail, 761 suites |
| `npm run typecheck` | pass |
| eslint on the two suggestion files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the suggestion files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC. `darf_official_truth_freigeben` is the already merged #761 function. |

`auth:pruefen` was not run locally because it needs repository secrets.

## Exact-head gates

Exact-head GitHub CI, Auth and Vercel for the pushed tip exist only after the push. This report does not embed a run id. Do not copy a run id from `f4504e6e` or from `8325a5be`. The review head is the branch tip after this docs commit.

## Stop

No Ready. No merge. No follow-up. No #741 implementation.

**STOP for independent Technical-Lead exact-head review.**
