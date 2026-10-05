# Official Truth First Deterministic Source-Family Selection 1 — Task

Date: 3 October 2026
Issue: #784
Branch: `docs/official-truth-first-source-family-selection-1`
Baseline: `main@d91be5af020c41b935ea0eb0c90e5ec19b57babe`
Logical agent: **Jetnity Official Truth first deterministic source-family selection 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Select exactly one first real government source family for a later source-specific deterministic extractor.

This is a **docs-only research/architecture audit**.

Do not implement or register an extractor.
Do not edit runtime.
Do not import Candidate Evidence.
Do not promote anything to Official Truth.

The selected family must be suitable for Jetnity's already-merged chain:

server-held proof -> exact registry snapshot -> server-owned official retrieval -> deterministic extractor framework -> later provenance -> later F8.

## 2. Binding current architecture

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`
4. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
5. `lib/readiness/official-truth-same-request-extraction-server.ts`
6. `lib/readiness/rule-claims.ts`
7. `lib/readiness/official.ts`
8. `types/trips.ts`
9. canonical CH-01..CH-10 checkpoint in Issue #294 comments `5935531376` and `5935581800`

Live code wins over docs.

## 3. Research sources

Use only current official state/government primary sources.

No blogs, brokers, travel portals, Wikipedia, Reddit, commercial visa providers, Sherpa, IATA/Timatic, model summaries or search snippets as evidence.

At minimum evaluate these current official candidates:

### New Zealand — Immigration New Zealand
- https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/visa-waiver-countries-and-territories/
- https://www.immigration.govt.nz/opsmanual/88262.htm
- https://www.immigration.govt.nz/visas/new-zealand-electronic-travel-authority-nzeta/

Known candidate reason:
- Switzerland is positively listed among visa-waiver countries.
- The government source explicitly states the consequence of being on that list.
- This may support a single-source explicit-primary visa fact if the exact structure and semantics are sufficiently deterministic.

### United Kingdom — GOV.UK
- https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list
- https://www.gov.uk/guidance/visiting-the-uk-as-an-eu-eea-or-swiss-citizen
- Content API documentation: https://content-api.publishing.service.gov.uk/

Known candidate reason:
- Switzerland is positively present in the ETA National List.
- GOV.UK has an official JSON Content API.
- However, ETA is a separate requirement type and prose must not be silently converted into visa truth.

### Singapore — Immigration & Checkpoints Authority
- https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements
- https://www.ica.gov.sg/enter-transit-depart/entering-singapore

Known risk:
- Switzerland not appearing on a visa-required list is **not enough**. Absence must never become `not_required`.
- Only select Singapore if there is a positive explicit primary statement supporting a complete structured fact.

You may inspect additional CH-01..CH-10 official sources if one is clearly superior, but every evaluated source must remain official government primary evidence.

## 4. Selection criteria

For each candidate, determine:

1. exact canonical official URL(s);
2. publisher/authority;
3. HTTP representation:
   - JSON/API;
   - stable structured HTML;
   - table/list/labeled fields;
   - arbitrary prose;
4. whether the relevant semantic assertion is positive and explicit;
5. exact target `OfficialRequirementType`;
6. exact target `RegelFaktArt`;
7. whether a complete `RegelFakt` can be emitted with no legal default;
8. whether one source is sufficient:
   - `explicit_primary_statement`;
   - or multiple sources would be required;
9. whether citizenship/document conditions are explicit enough for the CH ordinary-passport regulatory cell;
10. drift guards that a future parser would need;
11. URL allowlist shape:
   - exact canonical URL;
   - or queryless exact host + path;
12. expected MIME type;
13. whether the source contains only the rule content or mixes unrelated prose;
14. whether a parser can fail closed when structure changes;
15. whether the source family is reusable beyond Switzerland without inventing negative rules.

## 5. Strict deterministic standard

Eligible:

- official JSON or machine-readable structured response;
- stable official HTML table/list with source-specific versioned parser;
- fixed labels/headings/fields with explicit drift guards;
- positive membership in an official list when the same official source explicitly defines the legal consequence of membership.

Not eligible:

- generic prose regex;
- LLM interpretation;
- "country absent from required list => not required";
- infer ETA from a visa list or visa from an ETA list;
- infer citizenship from residence or issuer;
- guess stay duration from unrelated page;
- merge two sources without a code-owned composition policy;
- use a provider as authority.

## 6. New Zealand special check

Test whether the Immigration New Zealand visa-waiver source can support exactly:

`requirementType: 'visa'`

and a complete:

`RegelAnforderungswirkung = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }`

for the relevant CH ordinary-passport visitor cell.

Do not assume this result.

It is valid only if the current official source itself positively and explicitly establishes:
- Switzerland belongs to the visa-waiver set; and
- members of that set do not need to obtain a visitor visa before travel / receive the relevant visa-waiver treatment.

NZeTA must remain a separate `electronic_travel_authorization` requirement. Do not encode NZeTA as a visa mode.

If one source page cannot carry both positive membership and consequence strongly enough for a single-source extractor, classify it as not yet eligible rather than composing two pages.

## 7. UK special check

Do not select GOV.UK merely because the Content API returns JSON.

JSON transport does not make prose semantics deterministic.

If the ETA National List is selected, target only `electronic_travel_authorization` truth that is explicitly supported by the list and current rule text. Do not silently derive visa exemption from ETA eligibility.

## 8. Singapore special check

Do not infer a Swiss visa exemption from absence on the visa-required list.

A positive explicit official statement is required.

## 9. Required output

Create exactly:

- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_SELF_REVIEW_2026-10-03.md`

The architecture document must include a comparison table and then one selection result:

- `SELECTED_FOR_FIRST_EXTRACTOR`
or
- `NO_SOURCE_FAMILY_PROVEN_YET`

If selected, state exactly:

- source family id proposal;
- extractor id proposal;
- extractor version `1`;
- sourceId proposal;
- exact official URL allowlist;
- MIME type;
- schema-family id proposal;
- factKind;
- requirementType;
- evidence quality;
- complete expected Rule fact shape;
- exact positive official structure used;
- exact drift guards;
- exact fail-closed cases;
- why no negative inference is involved;
- whether this is reusable for other countries and under what positive-membership rule.

Do **not** state that Candidate Evidence is Official Truth.

## 10. CH continuity

CH-01..CH-10 remain:

`RESEARCH_ONLY`
`NOT_APPROVED_FOR_DATABASE_IMPORT`

Do not redo all 64 destinations.

Use the existing CH scope only to confirm whether the selected source family can cover one already-seeded case.

No CH-11.

## 11. No runtime

Forbidden:

- editing `lib/**`, `app/**`, `components/**`, `types/**`;
- registering any extractor;
- migration or DB apply;
- Supabase mutation;
- Evidence/store write;
- Rule acceptance;
- F8;
- route;
- provider/model/plugin integration;
- secrets or paid calls;
- #626;
- Production change.

## 12. Validation / STOP

Before STOP:

- verify every final evidence URL is current, official and tracking-clean;
- record retrieval/check time in UTC in the docs;
- distinguish source semantics from your architecture conclusion;
- no copied long passages;
- `git diff --check`;
- fetch current main and finish 0 behind;
- keep Draft;
- report session id + `originalModelName` + exact head/files;
- STOP.

No Ready. No merge. No extractor implementation.