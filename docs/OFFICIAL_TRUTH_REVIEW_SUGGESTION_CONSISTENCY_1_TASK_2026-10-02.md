# Official Truth Review Suggestion Consistency Matrix 1 — Binding Task

Date: 2 October 2026
Issue: #763
Source audit: merged #749 / F6
Baseline: `main@8325a5be988ec9e8d1fbd79dd75129373176be2e`
Branch: `fix/official-truth-review-suggestion-consistency-1`
Logical agent: **Jetnity Official Truth review suggestion consistency matrix 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close #749 F6 while keeping the suggestion strictly advisory.

Current suggestion validation checks enums/citations but permits contradictory combinations such as:
- `supports_candidate` with conflict/stale/ambiguous reasons;
- `supports_candidate` with zero citations.

Add one explicit deterministic consistency matrix.

## Permanent boundary

`officialTruthRegelReviewVorschlag` remains advisory review material.

It must NEVER:
- select a decision state;
- authorize fact entry;
- authorize storage;
- call `regelKandidatAkzeptieren`;
- call the trusted store;
- become a trusted fact;
- become an input required for the later #741 acceptance gate.

The future #741 gate must ignore suggestion assessment/reasonCodes as authority.

## Consistency matrix

### supports_candidate
Required:
- at least one cited support;
- at least one reason;
- every reason must be exactly `support_text_matches_candidate`.

Reject any conflict, ambiguity, stale/time-unclear, source-conflict, insufficient or human-judgment reason.

### contradicts_candidate
Required:
- at least one cited support;
- at least one reason;
- reasons may be:
  - `support_text_conflicts_candidate`
  - `support_sources_conflict`

At least one of those must exist. Reject matches/supports, ambiguous-only, stale-only, insufficient-only or human-judgment-only reasoning.

### insufficient_evidence
Required:
- at least one reason;
- allowed reasons:
  - `support_scope_ambiguous`
  - `support_stale_or_time_unclear`
  - `support_sources_conflict`
  - `support_insufficient_for_claim`

Citations may be empty because absence/insufficiency can be the finding.

Reject text-matches, text-conflicts and proposal-human-judgment reasons for this assessment.

### needs_human_review
Required:
- at least one reason;
- allowed reasons:
  - `support_scope_ambiguous`
  - `support_stale_or_time_unclear`
  - `support_sources_conflict`
  - `proposal_requires_human_judgment`

Citations may be empty.

Reject text-matches, text-conflicts and pure insufficient-for-claim as this assessment's reasons.

## Failure contract

Add one narrow fail-closed reason, preferably:
`inconsistent_suggestion`

Use it for:
- empty mandatory citations;
- empty mandatory reason list;
- reason outside the assessment's allowed matrix.

Do not leak the rejected reason text into output.

Existing enum/duplicate/citation-not-in-packet reasons remain where applicable.

Order:
1. structural/enums/duplicates/citation membership;
2. consistency matrix;
3. advisory output.

## Mandatory tests

At minimum prove:

1. valid supports_candidate + citation + match reason passes;
2. supports_candidate with zero citations blocks;
3. supports_candidate with empty reasons blocks;
4. supports_candidate + conflict reason blocks;
5. supports_candidate + stale/ambiguous/source-conflict/insufficient/human-judgment reason blocks;
6. valid contradicts_candidate + citation + conflict reason passes;
7. contradicts_candidate with zero citations blocks;
8. contradicts_candidate with empty reasons blocks;
9. contradicts_candidate + matches reason blocks;
10. valid insufficient_evidence with each allowed reason passes;
11. insufficient_evidence empty reasons blocks;
12. insufficient_evidence may have zero citations;
13. valid needs_human_review with each allowed reason passes;
14. needs_human_review empty reasons blocks;
15. needs_human_review may have zero citations;
16. invalid enum, duplicate reasons/citations and citation-not-in-packet behavior stays unchanged;
17. v2 reviewPacketKey recomputation stays unchanged;
18. result remains advisory and carries no accepted lifecycle/trusted fact/decision;
19. decision-intent module does not import suggestion module;
20. suggestion module does not import/call `regelKandidatAkzeptieren` or store;
21. `requirementsProviderAus() === null`.

## Allowed files

Runtime/test:
- `lib/readiness/official-truth-review-suggestion.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`

May add a narrow decision-intent source-absence assertion only in:
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
if already needed to lock the non-consumer invariant.

Do NOT edit:
- store server/tests (owned by parallel F2 writer);
- packet/fingerprint runtime;
- F9 authority guard;
- rule-claims acceptance;
- app/API;
- Supabase/migrations;
- global startup/Guardian files.

Create:
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_SUGGESTION_CONSISTENCY_1_SELF_REVIEW_2026-10-02.md`

## Hard boundaries

No DB/Auth/RLS/provider/model/network/storage mutation.
No Rule acceptance.
No endpoint.
No #741 implementation.
No change to suggestion assessments/reason-code vocabulary.
No cost.
Do not touch #626.

## Validation

- fetch latest main;
- finish 0 behind;
- focused suggestion tests;
- full `npm test`;
- typecheck/lint/build;
- hygiene;
- diff check;
- operating-mode guard.

Stay Draft.
Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
