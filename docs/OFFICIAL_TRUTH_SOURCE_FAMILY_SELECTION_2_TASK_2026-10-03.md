# Official Truth Deterministic Source-Family Selection 2 — Task

Date: 3 October 2026
Issue: #788
Branch: `docs/official-truth-source-family-selection-2`
Baseline: `main@e5723eac239a0227148e250c97eb6be20f44b36d`
Logical agent: **Jetnity Official Truth deterministic source-family selection 2**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Select exactly one first real government source family for a later deterministic source-specific extractor, if and only if the current Jetnity trust contract can support it without inference.

This is a **docs-only research/architecture audit**.

Do not implement or register an extractor.
Do not edit runtime.
Do not import Candidate Evidence.
Do not promote anything to Official Truth.

Audit focus:
- `passport_validity`
- `blank_passport_pages`

These fact kinds are preferred because the current decoded regulatory scope already carries destination, citizenship set, credential option/document/issuer, residence, requirement type and travel date, while it does **not** carry generic trip purpose, intended stay duration or transport mode.

## 2. Binding architecture

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_FIRST_SOURCE_FAMILY_SELECTION_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`
4. `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md`
5. `lib/readiness/official-truth-server-owned-retrieval.ts`
6. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
7. `lib/readiness/official-truth-same-request-extraction-server.ts`
8. `lib/readiness/rule-claims.ts`
9. `lib/readiness/evidence.ts`
10. Issue #294 comments `5935531376` and `5935581800` for CH-01..CH-10 continuity.

Live code wins.

## 3. Current hard gates

A source family is not eligible unless all are true:

1. official state/government primary source;
2. HTTPS and tracking-clean canonical URL;
3. current response can traverse Jetnity's trusted retrieval path:
   - final response body <= 65,536 bytes;
   - valid UTF-8;
   - no required redirect to an unregistered different source;
4. positive explicit applicability to one seeded CH ordinary-passport regulatory cell;
5. no inference of citizenship from issuing country or issuing country from citizenship;
6. no negative inference from absence;
7. one complete `RegelFakt`;
8. no dropped qualifier that the fact schema cannot represent;
9. stable source-specific structure with explicit drift guards;
10. single-source `explicit_primary_statement`; no composition policy required;
11. parser can fail closed on any structural or semantic drift;
12. no generic prose regex, LLM interpretation or legal default.

## 4. Primary official candidates

Evaluate at minimum these three current official families.

### A. Government of India — official e-Visa portal

Primary official URL candidates:
- `https://indianvisaonline.gov.in/evisa/tvoa.html`
- `https://indianvisaonline.gov.in/visa/tvoa.html`
- only another `indianvisaonline.gov.in` official representation if it is a clearly smaller/current canonical official endpoint for the same rule.

Known positive statements to verify from current bytes:
- Switzerland is positively listed among valid passport countries/regions eligible for eVisa;
- passport should have at least six months validity at the stated anchor;
- passport should have at least two blank pages.

Potential complete facts to test independently:

Passport validity:
```
{
  kind: 'passport_validity',
  semantics: 'minimum_remaining_at_application',
  duration: { value: 6, unit: 'months' }
}
```

Blank pages:
```
{
  kind: 'blank_passport_pages',
  minimumPages: 2
}
```

Do **not** assume these shapes. Verify the exact current wording and anchor.

Important:
- determine response byte size of every candidate URL;
- if the official page exceeds 65,536 bytes and no smaller official representation exists, it is not currently eligible;
- eVisa eligibility/purpose qualifiers must not be silently dropped if they are necessary to applicability;
- ordinary passport must not be inferred if the page explicitly excludes or distinguishes diplomatic/official/travel documents.

### B. Saudi Arabia — official tourist eVisa source

Primary candidate:
- `https://visa.visitsaudi.com/Home/TermsConditions`
- official related `visa.visitsaudi.com` page only if needed to establish government ownership or canonical structure.

Verify:
- whether this site is genuinely an official state/government primary source and identify the responsible government authority;
- whether Switzerland is positively included in the permitted passport/country set;
- whether the same response explicitly states the passport validity rule and exact anchor;
- whether the response is <= 65,536 bytes;
- whether the rule applies to the CH ordinary-passport tourist/eVisa cell without inferring citizenship from issuer.

Potential fact to test:

```
{
  kind: 'passport_validity',
  semantics: 'minimum_remaining_from_entry',
  duration: { value: 6, unit: 'months' }
}
```

Do not select merely because the domain looks official. Authority provenance must be explicit enough.

### C. UAE — Federal Authority for Identity, Citizenship, Customs & Port Security

Official domain:
- `https://icp.gov.ae/`

Evaluate one or more current official visitor/tourist/visa service pages only if they positively bind the passport-validity rule to a scope that actually covers a seeded CH ordinary-passport case.

Known candidate service pages may state:
- passport valid for no less than 6 months.

Potential fact:
```
{
  kind: 'passport_validity',
  semantics: <only the exact supported existing semantics>,
  duration: { value: 6, unit: 'months' }
}
```

Do not select a generic visa-service condition if Swiss ordinary-passport visitors are outside that service path or if the time anchor is not explicit enough for an existing `passport_validity` semantics.

## 5. Optional fourth candidate

You may evaluate **one** additional CH-01..CH-10 government source only if it is clearly stronger than the three above for:
- passport validity, or
- blank passport pages.

Do not reopen all 64 destinations.
Do not start CH-11.

## 6. Exact fact compatibility

Current complete types:

### `passport_validity`

A valid result must be exactly:

```
{
  kind: 'passport_validity',
  semantics:
    | 'valid_on_entry'
    | 'valid_through_stay'
    | 'minimum_remaining_from_entry'
    | 'minimum_remaining_from_planned_departure'
    | 'minimum_remaining_at_application'
    | 'expired_document_exception',
  duration: { value: integer, unit: 'days' | 'months' | 'years' } | null
}
```

Do not invent an anchor.
Do not convert “passport valid 6 months” into `minimum_remaining_from_entry` unless entry is explicit.
Do not convert an application rule into an entry rule.

### `blank_passport_pages`

A valid result must be exactly:

```
{
  kind: 'blank_passport_pages',
  minimumPages: integer 1..10
}
```

The source must explicitly state the minimum number.
Do not infer “pages for stamping” if no numeric minimum is stated.

## 7. Applicability to the decoded scope

For any selection, document exactly which current decoded scope fields the future matcher uses.

At minimum consider:
- destinationCountryCode;
- citizenship.countryCodes as the full set;
- credentialOption.documentType;
- credentialOption.issuingCountryCode;
- credentialOption.relatedCitizenshipCountryCode;
- residence;
- validity/travelDate.

Rules:
- never choose one citizenship from a multi-citizenship set;
- never treat issuingCountryCode as citizenship;
- if the official rule is based on passport issuer, match only credential issuer;
- if based on citizenship/nationality, match only explicit citizenship;
- if source says ordinary passport, require exact ordinary-passport-compatible document condition; do not broaden;
- if a source condition depends on trip purpose, stay duration, transport mode, prior visa history or another field absent from the current scope, it is not eligible for a complete fact unless the official rule is independent of that condition.

## 8. Deterministic structure test

For each candidate describe:

- exact URL;
- effective URL after redirects;
- observed MIME type;
- raw response byte count;
- current retrieval compatibility;
- official authority;
- positive scope membership structure;
- rule-value structure;
- exact HTML/JSON structure to pin;
- whether membership and fact value are in the same response;
- drift guards;
- what exact change makes parser fail closed.

Eligible examples:
- stable numbered clause + stable eligibility list in same response;
- stable labeled field/list;
- official machine-readable object with direct fields.

Not eligible:
- generic prose search;
- page-wide regex for “6 months”;
- model extraction;
- cross-page composition;
- meaning reconstructed from page absence;
- structure requiring heuristic grouping.

## 9. Output

Create exactly:

- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_SELF_REVIEW_2026-10-03.md`

Architecture result must be exactly one of:

- `SELECTED_FOR_FIRST_EXTRACTOR`
- `NO_SOURCE_FAMILY_PROVEN_YET`

If selected, state exactly:

- source family id proposal;
- sourceId proposal;
- extractor id proposal;
- extractor version 1;
- schema family id;
- exact URL allowlist;
- MIME type;
- factKind;
- requirementType;
- evidence quality;
- exact complete Rule fact shape;
- exact decoded-scope predicates;
- exact positive source structure;
- exact drift guards;
- exact fail-closed cases;
- current response byte count;
- why no negative inference or legal default is involved.

If two facts on one family qualify, select only **one** first extractor fact. Prefer the smaller/less ambiguous contract, not the more commercially impressive one.

## 10. CH continuity

CH-01..CH-10 remain:

`RESEARCH_ONLY`
`NOT_APPROVED_FOR_DATABASE_IMPORT`

This audit may reuse one seeded destination only to verify scope coverage.
It does not import Candidate Evidence.
It does not promote Candidate Evidence to Official Truth.
No CH-11.

## 11. Forbidden

No edits to:
- `lib/**`
- `app/**`
- `components/**`
- `types/**`
- `supabase/**`

No:
- extractor registration;
- runtime parser;
- BODY_MAX change;
- Rule acceptance;
- Evidence/store write;
- provenance persistence;
- migration/apply;
- provider/model/plugin;
- secrets or paid calls;
- #626;
- F8;
- Production change.

## 12. Validation / STOP

Before STOP:

- all final evidence URLs current, official and tracking-clean;
- record UTC check window;
- record byte size and MIME from direct current HTTP response;
- clearly distinguish research fetch from Jetnity production retrieval;
- no long copied passages;
- `git diff --check`;
- operating-mode guard;
- fetch current main and finish 0 behind;
- keep Draft;
- report session id + `originalModelName` + exact head/files;
- STOP.

No Ready. No merge. No extractor implementation follow-up.