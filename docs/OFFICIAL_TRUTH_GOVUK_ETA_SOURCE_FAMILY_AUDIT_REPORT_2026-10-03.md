# Official Truth GOV.UK ETA Deterministic Source-Family Audit — Report

Date: 3 October 2026
Issue: #790
Draft PR: #791
Branch: `docs/official-truth-govuk-eta-source-family-audit`
Baseline: `main@32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`
Task: `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth GOV.UK ETA source-family audit**
Generation: **1**
Session: https://cursor.com/agents/bc-5ef68db6-34e5-49e9-b6e4-cacf373730c8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge. Review the branch tip after the commit that adds these three documents. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task names exactly three output files, and those files are the continuity record for this slice.

## Result

`NO_SOURCE_FAMILY_PROVEN_YET`

The architecture record is `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`.

The current National List does place Switzerland in its own list item, and the group label that applies to that item is travel to the UK on or after 2 April 2025. Decoded `scope.validity.travelDate` can be compared with that date. Both National List responses are valid UTF-8 and at or under 65,536 bytes. The Content API hash matches the hash recorded in selection 1. The full HTML page is the same length as in selection 1 and a different hash, while `details.body` remains verbatim inside it.

That is not a complete `required` fact. The list states the requirement pursuant to Appendix Electronic Travel Authorisation. The Appendix says a person who already holds a valid entry clearance, or permission to enter or stay, is not required to obtain an ETA. It also says a person lawfully resident in Ireland who travels from elsewhere in the Common Travel Area does not need an ETA. The current `RegelScope` cannot prove either sentence aside. `requirement_effect` cannot store the condition. `conditional` was not used as a bucket.

The Appendix HTML is 88,426 bytes and would fail the live retrieval ceiling. The Appendix Content API is 22,965 bytes and does not name Switzerland. `explicit_primary_statement` takes one support. The same-request path blocks multi-source composition before HTTP. Same Home Office publisher is not one representation: the two pages have different `content_id` values.

No extractor id, source family id, source id, allowlist, or fact shape was proposed. CH-01..CH-10 remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. No CH-11.

## Files

Created:

- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_SELF_REVIEW_2026-10-03.md`

Not edited: the task file, `lib/**`, `app/**`, `components/**`, `types/**`, tests, migrations, routes, and the production extractor registry.

A dirty `next-env.d.ts` was already in the worktree. It stays unstaged.

## Binding reads

Live main at the start of this session, after `git fetch origin main`, is `32a0d6d85bc9f5591eeebb50a27ae71fac44b73f`. This branch was 0 behind that commit and 1 ahead, the task seed.

Read for the decision: `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`, `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md`, `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `lib/readiness/official-truth-same-request-extraction-server.ts`, `lib/readiness/rule-claims.ts`, `lib/readiness/evidence.ts`, `lib/readiness/official-truth-server-owned-retrieval.ts`, and `types/trips.ts`.

Official URL check windows are in the architecture record. Hashes there are session fingerprints of the raw response bodies, not Evidence hashes and not production retrieval.

## Out of scope, unchanged

- No extractor registration and no edit to `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY`.
- No `BODY_MAX` change.
- No database, migration, or apply.
- No route, UI, provider, or model integration.
- No acceptance, store, or provenance write.
- No F8 change.
- No Production or Development query.
- No import or promotion of CH-01..CH-10. No CH-11.
- No follow-up implementation.

## Security, privacy, and cost

The fetches were public HTTPS GET requests of GOV.UK guidance. No credential, traveller identifier, passport number, or secret was sent. No new store and no new recurring cost. The research user agent and the node-like header set returned the same body hashes. Neither fetch is the server-owned retrieval client.

Traveller context stays on the decoded scope. Citizenship is the set. The issuer is not treated as citizenship. Related citizenship is used only when the cell already states it. Exemptions the scope cannot see stay unknown.

## Recommendation

Stop for independent Technical-Lead review of the exact branch tip.

The date-contract block from selection 1 is closed for this family: `travelDate` is on the decoded scope, and the 2 April 2025 threshold is in the current bytes. The remaining block is smaller than a new source hunt and smaller than unblocking multi-source composition. It is a scope predicate for "does not already hold valid UK entry clearance or permission to enter or stay", with ETA 1.3's Ireland and Common Travel Area condition in the same class, plus a single response that actually states both the nationality and those exemptions. This slice does not build that predicate. Ready and merge stay with the Technical Lead.
