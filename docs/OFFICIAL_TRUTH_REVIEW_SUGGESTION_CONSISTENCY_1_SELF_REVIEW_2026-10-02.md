# Official Truth Review Suggestion Consistency Matrix 1 — Self-Review

Date: 2 October 2026
Issue: #763
Draft PR: #765
Branch: `fix/official-truth-review-suggestion-consistency-1`

Logical agent: **Jetnity Official Truth review suggestion consistency matrix 1**, Generation 1
Session: https://cursor.com/agents/bc-973637b7-5ecb-4f14-ab48-a195236f8c00
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `8325a5be988ec9e8d1fbd79dd75129373176be2e` is the task seed plus:

- `lib/readiness/official-truth-review-suggestion.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. The store, the #723 packet, the #726 fingerprint, the F9 authority guard, and rule-claim acceptance were not edited. The suggestion module still imports only `officialTruthRegelReviewPacket` and `officialTruthRegelReviewPacketFingerprint`.

## What I checked

- `supports_candidate` passes only with at least one packet citation and only `support_text_matches_candidate`. Zero citations, an empty reason list, each rejected reason, and a match reason paired with a rejected reason return `inconsistent_suggestion`. The rejected code is absent. The passing case keeps the v2 fingerprint key.
- `contradicts_candidate` passes with a citation and either conflict reason, and with both conflict reasons. Zero citations, an empty reason list, and a match reason block. Ambiguous, stale, insufficient, and human-judgment reasons also block.
- Each of the four `insufficient_evidence` reasons passes with zero citations. The four together may include a real citation. Empty reasons block. Match, text-conflict, and human-judgment reasons block.
- Each of the four `needs_human_review` reasons passes with zero citations. Empty reasons block. Match, text-conflict, and `support_insufficient_for_claim` block.
- A citation outside the packet, a duplicate citation, a duplicate reason, an unknown reason, and an unknown assessment keep their old reasons even when the matrix would also fail.
- Success output has no accepted lifecycle, trusted fact, or decision. `requirementsProviderAus()` is `null`.
- The decision-intent source does not mention the suggestion module. The suggestion source does not mention `regelKandidatAkzeptieren` or the store. The decision-intent test already locked the same non-import, so that file was not edited.

## Boundary choices a reviewer should see

1. Allowed reasons are exclusive. `contradicts_candidate` does not keep a stale or ambiguous reason beside a conflict reason. The task says those reasons may be the two conflict codes, and it rejects stale-only and ambiguous-only reasoning. A mixed extra reason is outside that set, so it fails closed.
2. `needs_human_review` does not accept `support_insufficient_for_claim`, even beside an allowed human-review reason. That code is not in its allowed list. The task's "pure insufficient-for-claim" sentence is implemented as "this reason is not allowed here".
3. `insufficient_evidence` and `needs_human_review` may cite packet supports. Empty citations are allowed. Citations are not forbidden.
4. `inconsistent_suggestion` is the only new failure reason. It does not include the rejected code. Existing enum, duplicate, and membership reasons are unchanged and run first.
5. The matrix does not read page text. It only checks that the closed assessment and the closed reason codes agree. It does not decide whether the page actually supports the candidate.
6. One suggestion is still one cell. A second credential option is a different key. This slice does not collect traveller credentials.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

Focused file: 11/11 pass on `f4504e6e34009b293a1e0f6ab4e1b99fc9760c14`. Full `npm test` on that tree: 4454 pass / 0 fail, 761 suites. Typecheck, lint, build, diff check, operating-mode guard and the hygiene checks passed on that same tree. Lint reports 0 errors and 148 pre-existing warnings, none in the suggestion files. Schema reference still lists four already known unapplied RPCs, including `darf_official_truth_freigeben` from merged #761. This slice added none.

PostgreSQL 16 was not on the machine at the start. After installing PostgreSQL 16.15 locally, the suite passed, including the existing throwaway cluster proofs. The package cluster was not started. Those proof clusters are local and temporary. No remote database was contacted. This slice did not apply SQL.

## Stop line

The matrix behaviour is `f4504e6e`. The review head is the branch tip after the docs commit that adds this file. Exact-head CI is not embedded here. This remains a Draft. No Ready, no merge, and no follow-up from this writer.

**STOP for independent Technical-Lead exact-head review.**
