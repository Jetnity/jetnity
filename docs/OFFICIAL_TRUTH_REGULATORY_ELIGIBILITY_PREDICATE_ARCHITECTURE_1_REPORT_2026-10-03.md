# Official Truth Regulatory Eligibility Predicate Architecture 1 — Report

Date: 3 October 2026
Issue: #792
Draft PR: #793
Branch: `docs/official-truth-regulatory-eligibility-predicate-architecture-1`
Baseline: `main@cb6b32dd34075a47eb220454ea46fc8371752b15`
Task: `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_TASK_2026-10-03.md`
Task seed: `631995ef6b11f78c1782043c842ca5e5c84d7e37` is not the review head.
Logical agent: **Jetnity Official Truth regulatory eligibility predicate architecture 1**
Generation: **1**
Session: https://cursor.com/agents/bc-1e56bb1a-bd9c-41d6-9243-ea23429e4ddd
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. It does not implement a runtime slice and it does not implement F8.

## Classification

**`PREDICATE_FOUNDATION_READY_FOR_RUNTIME_SLICE`**

Binding design: `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`.

The contract is specific enough for a later pure module. It is not an authorization to start that module from this pull request.

## Baseline

`git fetch origin main` in this session resolved `origin/main` to `cb6b32dd34075a47eb220454ea46fc8371752b15` (`Merge #791: record GOV.UK ETA source-family audit`). That SHA is the task baseline. Merge-base of this branch and `origin/main` is that SHA. Before these architecture documents the branch was the task seed `631995ef6b11f78c1782043c842ca5e5c84d7e37`: 1 ahead, 0 behind. Machine mode in `.jetnity/operating-mode.json` is `NORMAL`. This slice does not edit that file.

## What was designed

Global Official Truth, traveller regulatory context, and the per-traveller evaluation stay three objects. The static cell remains `RegelScope` / `EvidenceAtom`. Permission, lawful entitlement, journey origin, age, purpose, document class, nationality status, and school-party facts are evaluated after lookup. They are not added to `rule-scope:v1:` or `evidence-key:v2:`.

The canonical payload is schema-1 applicability on the trusted fact. Flat `effect: 'conditional'` is not a condition. Unconditional legacy facts stay the three-key object. Branched outcomes are `required` or `not_required` only. `visa_options` uses the same walker with eligibility `allowed` or `not_allowed`, so an India "not available" sentence is not stored as `not_required`. `regelKandidatAkzeptieren` stays the only future acceptance constructor. A later slice extends the existing fact readers inside it. The current store writer must reject a branched fact with `applicability_not_persistable` until a separate migration exists, because today's effect table would drop the branches.

The expression grammar is `all`, `any`, `not`, and `atomic`, with depth 4, 16 nodes, and 8 operands. `unknown` is never coerced to `false`. `not unknown` is `unknown`. `otherwise` runs only when every expression branch is `false`.

The vocabulary covers destination permission, lawful residence distinct from residence country, journey origin including an unpinned `common_travel_area` region, inclusive integer age without a date of birth, a closed travel-purpose enum, document class distinct from `documentType`, issuing country versus citizenship membership versus an explicit credential link, British Overseas Territory Citizen and British National (Overseas) as non-ISO statuses, and school-party authority, size, membership, and confirmation without a school name.

Missing-fact codes are returned only for predicates the matched rule still needs. Empty permission, status, and entitlement lists are `unknown`, not a denial. Context provenance `user_asserted`, `account_profile`, and `trip_context` is defined. Provenance is not authority. Asserted exemptions stay labelled `context_asserted`. Reserved provider and document-verified provenances are rejected.

Multi-citizenship keeps the full set. There is no best-passport selection. Future composition would cite support ids on branches and, when one branch cites two sources, on atoms. Same-request extraction still returns `composition_policy_unavailable`. F8 may later accept only a complete fact that includes applicability, and only through `regelKandidatAkzeptieren`.

The first runtime files are `lib/readiness/regulierungs-anwendbarkeit.ts` and `lib/readiness/regulierungs-anwendbarkeit.test.ts`. Migration impact of that slice: none.

## Limits that remain explicit

- The Common Travel Area has no member pin in this repository record. A region predicate stays `region_membership_unpinned` until a later slice copies members from a server-reproved official source. The CTA exemption branch must not be omitted to force `required`.
- India purpose phrases are not mapped onto the enum. Marriage/Civil Partnership Visitor and S2 Healthcare Visitor are not `visitor`.
- The National List and the Appendix remain two content items. This design does not join them.
- GOV.UK extraction, India extraction, CH import, and F8 stay unauthorized.
- `requirementsProviderAus()` stays `null`. No provider is selected.

## Handoff

- Arbeitsblock: docs-only regulatory eligibility predicate architecture. Issue #792. Draft PR #793. Branch `docs/official-truth-regulatory-eligibility-predicate-architecture-1`.
- Status: technically specified, waiting for independent Technical-Lead review. Not Ready. Not merged.
- Implemented: the architecture, this report, and the self-review. No runtime.
- Not implemented: the pure module, acceptance wiring, migration, UI, extractor, composition policy, region pin, F8.
- DB / Production: no migration, no apply, no RLS change, no store write. Branched facts are defined as not persistable on the current effect table.
- Costs / provider / secrets: none.
- Product-Owner gates: unchanged. A later persist of personal legal-status context, or a Production migration, remains gated.
- Exact next step: independent Technical-Lead review of the branch tip that adds these documents. Cursor does not Ready, merge, or start the runtime slice.
- Read first: the task, the architecture, this report, the self-review, then the GOV.UK ETA audit and source-family selection 2.

`docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. The task's required output is these three documents. This report is the branch handoff.

## Validation

Recorded in the self-review after `git diff --check` and the operating-mode guard on this docs tree. `npm test`, typecheck, lint, and the production build are not claimed. Runtime bytes are the baseline.

## Stop

No Ready. No merge. No runtime follow-up.
