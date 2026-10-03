# Official Truth First Deterministic Source-Family Selection 1 — Report

Date: 3 October 2026
Issue: #784
Draft PR: #785
Branch: `docs/official-truth-first-source-family-selection-1`
Baseline: `main@d91be5af020c41b935ea0eb0c90e5ec19b57babe`
Task: `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth first deterministic source-family selection 1**
Generation: **1**
Session: https://cursor.com/agents/bc-54a267e6-4407-4557-83d9-6fbcb8814f25
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge. Review the branch tip after the R1/R2 correction commit. Do not review `42c74252cb0fe21f25fca0e5800b98db9bea6fb7` as the correction head. That SHA is the CHANGES REQUIRED head. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task names exactly three output files, and those files are the continuity record for this slice.

## Technical-Lead correction on `42c74252`

Independent review accepted `NO_SOURCE_FAMILY_PROVEN_YET`. Two current-contract points were missing.

R1. `BODY_MAX` in `lib/readiness/official-truth-server-owned-retrieval.ts` is `65_536`. A larger `Content-Length`, or a stream that crosses that size, fails as `response_too_large`. The INZ visa-waiver body measured in this audit is 681,132 bytes. The NZeTA body is 881,465 bytes. Both are over the ceiling, so neither page can reach an extractor on the current trusted retrieval path. This slice does not raise the ceiling. A later INZ selection would need a separately reviewed smaller official representation or endpoint, or a separate reviewed retrieval-policy change. The session's direct research fetch is not that production boundary.

R2. The merged extractor context receives `scopeKey` and does not receive the decoded regulatory scope or a `travelDate`. `scopeKey` is an opaque `rule-scope:v1:` digest and must not be reversed into a date. The GOV.UK ETA list places Switzerland in the group for travel on or after 2 April 2025. An extractor cannot prove that the caller's travel date meets that boundary. Dropping the date, assuming later trips qualify, or parsing the research envelope in the extractor would be a second authority path. A later date-qualified family needs a separately reviewed binding of the decoded server-held scope, or a different complete fact representation. This slice does not add that binding.

The result still means no family is proven compatible with the current fact and retrieval contract. It does not mean the government sources are unreliable.

## Result

`NO_SOURCE_FAMILY_PROVEN_YET`

The architecture record is `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`.

Immigration New Zealand's current visa-waiver page does list Switzerland as its own list item, and the same page says a passport from a listed country can travel without applying for a visa first. The same page also says a visitor visa is given on arrival, and that an NZeTA is required first. The live schema cannot hold `not_required` together with `visa_on_arrival`, and it cannot hold `required` together with `visa_exempt`. The complete fact `{ kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }` is therefore not established. NZeTA stays `electronic_travel_authorization` and was not written into a visa mode.

The GOV.UK ETA National List does list Switzerland and does say those nationalities require an ETA. The Content API returns that rule as HTML inside JSON. The date group for Switzerland is embedded in a neighbouring list item. A travel-date qualifier cannot be stored on `requirement_effect` without dropping it. The visit-guidance page was not used to turn ETA eligibility into a visa exemption.

The ICA visa-requirements page states a visa requirement for travel documents issued by the listed places. Switzerland is not listed. That absence was not read as `not_required`.

No extractor id, source family id, source id, allowlist, or fact shape was proposed. CH-01..CH-10 remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. NZ is the CH-02 destination this check used. GB and SG are CH-01 destinations. No CH-11.

## Files

Created:

- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_SELF_REVIEW_2026-10-03.md`

Not edited: the task file, `lib/**`, `app/**`, `components/**`, `types/**`, tests, migrations, routes, and the production extractor registry.

A dirty `next-env.d.ts` was already in the worktree. It stays unstaged.

## Binding reads

Live main at the start of this session, after `git fetch origin main`, is `d91be5af020c41b935ea0eb0c90e5ec19b57babe`. This branch was 0 behind that commit and 1 ahead, the task seed.

Read for the decision: the three architecture and report files named in the task, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `lib/readiness/official-truth-same-request-extraction-server.ts`, `lib/readiness/rule-claims.ts`, `lib/readiness/official.ts`, `types/trips.ts`, and Issue #294 comments `5935531376` and `5935581800`.

Official URL check window: 2026-10-03T08:58:45Z to 2026-10-03T08:58:53Z. Every requested evidence URL returned HTTP 200 on itself, with no redirect and no tracking query. The NZeTA page's own canonical link points at `https://www.immigration.govt.nz/visas/`, which this session confirmed is the visas index, a different document. The ops manual page declares its instructions archived and no longer current. Hashes of the raw bodies are in the architecture record. They are session fingerprints, not Evidence hashes.

## Out of scope, unchanged

Not implemented, and not claimed as done:

- an extractor registration or a source-specific parser
- `regelKandidatAkzeptieren`, an accepted Rule Claim, or F8
- an Evidence or store write
- a route, UI, Auth, AAL, RLS, migration, or database apply
- #626 and CH import
- a provider, model, plugin, secret, or paid call

`requirementsProviderAus()` was not called. No runtime file was edited.

## Validation

Docs-only slice. `npm test`, typecheck, lint, and the production build were not run. The runtime bytes are the baseline. I do not claim those gates.

First delivery, before `42c74252cb0fe21f25fca0e5800b98db9bea6fb7`: `origin/main` was `d91be5af020c41b935ea0eb0c90e5ec19b57babe`, the branch was `0 1` against it, `git diff --check` passed, and the operating-mode guard passed. That record belongs to the CHANGES REQUIRED head.

R1/R2 correction, on this docs tree before the correction commit: fetch current main again, confirm 0 behind, `git diff --check` on the three documents, and `node scripts/operating-mode-guard.mjs`. The self-review states those command results. Machine mode is `NORMAL`. `.jetnity/operating-mode.json` was not edited. The review head is the branch tip after the correction commit. Re-fetch that tip.

## Recommendation

Do not implement an extractor from any of these three families on this evidence. The next source worth a selection audit is one official response that already has a uniform record for effect, visa mode or an explicit null, and the citizenship or document condition, and that covers one seeded CH cell by positive membership. This report does not open that audit.

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge.
