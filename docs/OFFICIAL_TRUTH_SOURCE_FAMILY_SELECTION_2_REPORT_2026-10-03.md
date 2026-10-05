# Official Truth Deterministic Source-Family Selection 2 — Report

Date: 3 October 2026
Issue: #788
Draft PR: #789
Branch: `docs/official-truth-source-family-selection-2`
Baseline: `main@e5723eac239a0227148e250c97eb6be20f44b36d`
Task: `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth deterministic source-family selection 2**
Generation: **1**
Session: https://cursor.com/agents/bc-a0a5897c-bffa-41bd-8886-3b80b85f1673
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge. Review the branch tip after the documentation commit that adds this file. The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task names exactly three output files, and those files are the continuity record for this slice.

## Result

`NO_SOURCE_FAMILY_PROVEN_YET`

The architecture record is `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`.

The Government of India e-Visa page does list Switzerland as country record 153, and it does say that an applicant's passport should have at least six months validity at the time of making the e-Visa application. A separate FAQ sentence says at least two blank pages. The same page also excludes diplomatic and official passports, states both a passport-from predicate and a nationals predicate, and places the six-month and two-page sentences inside e-Visa purpose prose. The raw body is 192,454 bytes. `BODY_MAX` is 65,536. The smaller `visa/tvoa.html` response is a 325-byte script location assignment and does not contain the rule.

`https://visa.visitsaudi.com/Home/TermsConditions` returned HTTP 403 from this external network. The body is a 257,009-byte interstitial with a Ministry of Tourism logo. It says the page is not accessible from an external network. It does not contain Switzerland or a six-month entry sentence. Node-like and browser-like requests returned the same status and size, with different hashes. The entry-anchor fact was not verified because the terms were not served.

The ICP "Issuance of a Visa" page says, in English, "Passport valid for no less than 6 months." It does not say whether that duration is counted from entry, from application, from planned departure, or through the stay. `valid_on_entry` cannot store a duration. The page does not name Switzerland. Its service description covers tourism, visit, treatment, work residence, and family residence, and the terms block concatenates conditions for more than one category. The Arabic final body is 627,025 bytes. The English final body is 616,726 bytes. Both are over the ceiling. The English page's canonical link is the Arabic URL.

No extractor id, source family id, source id, allowlist, or fact shape was proposed. CH-01..CH-10 remain `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT`. India is the CH-02 destination this check used. Saudi Arabia is the CH-04 destination. The United Arab Emirates is the CH-01 destination. No CH-11.

## Files

Created:

- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_SELF_REVIEW_2026-10-03.md`

Not edited: the task file, `lib/**`, `app/**`, `components/**`, `types/**`, tests, migrations, routes, and the production extractor registry.

A dirty `next-env.d.ts` was already in the worktree. It stays unstaged.

## Binding reads

Live `origin/main` after `git fetch origin main` is `e5723eac239a0227148e250c97eb6be20f44b36d`. This branch was 0 behind that commit. The commit already on the branch, before these three documents, is the task seed.

Read for the decision: the selection-1 architecture record, the decoded-scope binding report, the same-request extraction report, the trusted-fact extractor framework report, `lib/readiness/official-truth-server-owned-retrieval.ts`, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, `lib/readiness/official-truth-same-request-extraction-server.ts`, `lib/readiness/rule-claims.ts`, `lib/readiness/evidence.ts`, `types/trips.ts`, and Issue #294 comments `5935531376` and `5935581800`.

The decoded-scope binding is on this baseline. The extractor context includes `scope` as well as `scopeKey`. Selection 1's statement that the extractor receives only an opaque digest is historical for that earlier baseline.

Official URL check window: 2026-10-03T10:00:28Z to 2026-10-03T10:03:24Z. Hashes of the raw bodies are in the architecture record. They are session fingerprints, not Evidence hashes. The research fetch is not the production retrieval boundary.

## Traveller context

The result can differ by citizenship set, credential option, issuing country, related citizenship, residence, destination, and travel date. This audit kept the research cell at citizenship `CH` and `ordinary_passport`. It did not infer citizenship from the India passport-from list, and it did not infer a Swiss issuing country from citizenship `CH`. `ordinary_passport` was not rewritten to decoded `passport`. No personal identifier was collected. No shadow identity model was added.

## Out of scope, unchanged

Not implemented, and not claimed as done:

- an extractor registration or a source-specific parser
- a retrieval `BODY_MAX` change
- `regelKandidatAkzeptieren`, an accepted Rule Claim, or F8
- an Evidence or store write
- a route, UI, Auth, AAL, RLS, migration, or database apply
- #626 and CH import
- a provider, model, plugin, secret, or paid call
- a new passport-class value or a new passport-validity semantics

`requirementsProviderAus()` was not called. No runtime file was edited.

## Validation

Docs-only slice. `npm test`, typecheck, lint, and the production build were not run. The runtime bytes are the baseline. I do not claim those gates.

Validation recorded in the self-review, on this docs tree before the delivery commit: fetch current main, confirm 0 behind, `git diff --check` on the three documents, and `node scripts/operating-mode-guard.mjs`. Machine mode is `NORMAL`. `.jetnity/operating-mode.json` was not edited.

## Recommendation

Do not implement an extractor from the India e-Visa page, the Saudi terms URL, or the ICP visa issuance page on this evidence. A later selection still needs one official response that is inside 65,536 bytes, names one seeded CH cell by a predicate the decoded scope can match without inferring citizenship from issuer or issuer from citizenship, and states one complete fact whose qualifiers the fact schema can store. Where a page excludes diplomatic or official passports, that selection also needs a reviewed document-class value. An unanchored "valid for six months" sentence needs a reviewed semantics before it can be a fact. This report does not open that work.

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge.
