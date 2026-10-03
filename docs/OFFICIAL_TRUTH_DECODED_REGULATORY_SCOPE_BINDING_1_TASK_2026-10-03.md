# Official Truth Decoded Regulatory Scope Binding 1 — Task

Date: 3 October 2026
Issue: #786
Branch: `feat/official-truth-decoded-regulatory-scope-binding-1`
Baseline: `main@4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`
Logical agent: **Jetnity Official Truth decoded regulatory scope binding 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the missing decoded regulatory-scope binding needed before a real deterministic source-specific extractor can safely evaluate country/document/date conditions.

Current state:
- proof graph has the canonical rebuilt `RegelKandidat` and accepted Evidence;
- same-request extraction binds fresh server-owned source bytes;
- extractor framework receives only opaque `scopeKey`, not the decoded regulatory scope;
- #785 therefore found date-qualified GOV.UK ETA semantics cannot be evaluated inside the extractor.

This slice must add a canonical, non-personal, server-held decoded `RegelScope` to extractor context.

No real extractor is registered here.
Production extractor registry stays EMPTY.

## 2. Binding reads

Read live main first, then at minimum:

1. `lib/readiness/rule-claims.ts`
2. `lib/readiness/evidence.ts`
3. `lib/readiness/official-truth-same-request-proof-server.ts`
4. `lib/readiness/official-truth-same-request-extraction-server.ts`
5. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
6. corresponding tests
7. #785 source-family audit docs
8. #783 / #781 reports

Live code wins.

## 3. Scope contract

The decoded extractor scope is exactly the canonical source-neutral `RegelScope` / `EvidenceAtom` shape:

- `destinationCountryCode`
- `transitCountryCode`
- `citizenship`
- `credentialOption`
- `residence`
- `requirementType`
- `validity`

It contains no `sourceId`.

No personal identifiers.

The existing canonical function `regelScopeAusEvidenceScope` remains the authority for parsing and key derivation. Do not create a second scope parser or second scope-key algorithm.

## 4. Extractor framework change

Narrowly extend the extractor input/context with:

- `scopeKey`
- `scope` (decoded canonical `RegelScope`)

The framework must:

1. parse/normalize `scope` through `regelScopeAusEvidenceScope`;
2. require the recomputed key equals input `scopeKey`;
3. require top-level `requirementType === scope.requirementType`;
4. reject `sourceId` inside decoded scope;
5. reject unexpected scope keys;
6. reject personal identifiers;
7. freeze a safe canonical copy before matcher/extractor execution.

The matcher/extractor receives the canonical decoded scope, not the raw input object.

A malformed or mismatching scope fails before matcher/extractor.

Use an existing suitable fail reason if semantically exact, otherwise add one bounded reason such as `scope_mismatch`.

## 5. Same-request composition change

The live same-request extraction path must derive decoded scope only from its canonical proof material.

Preferred source:
- `proof.kandidat.scope`, after canonical re-validation with `regelScopeAusEvidenceScope`.

Before retrieval/extraction require:

1. candidate scope canonicalizes successfully;
2. recomputed key equals `proof.ruleScopeKey`;
3. candidate `requirementType` equals scope requirement type;
4. every accepted EvidenceVersion canonicalizes to the same source-neutral scope/key;
5. no support belongs to a different regulatory cell.

Pass only that canonical frozen decoded scope into extractor input.

Do not read a separate caller `scope` field as authority.
Do not parse the original research envelope a second time for extractor context.

## 6. Importer trust boundary

The production extractor entry becomes more powerful once it can see decoded scope.

Therefore add a repository source assertion proving that, outside its own module/tests, the production entry `officialTruthTrustedFactExtrahieren` is imported only by the same-request extraction server module.

The test seam `officialTruthTrustedFactExtrahierenMitDefinitionen` must remain test-only / non-route.

No `app/` import of either entry.

This is a repository-enforced architecture guard, not a bearer capability.

## 7. Regulatory-context semantics

The framework itself must not choose facts from the scope.

It merely makes exact server-held context available to a future source-specific extractor.

Permanent rules:

- citizenship country codes remain a full set; framework does not pick one;
- issuing country is not citizenship;
- `relatedCitizenshipCountryCode` is used only when explicitly present;
- residence is separate from citizenship;
- document type is not inferred;
- travel date is used only when `validity.mode === 'travel_date'`;
- `not_applicable` remains distinct from missing/unknown;
- destination and transit remain separate;
- no personal traveller id, passport number, MRZ, scan, biometrics or health data.

## 8. Synthetic date-qualified proof

Tests may use a synthetic extractor definition only in tests to prove the new context is usable.

Include a test where:
- synthetic official source structure names a positive rule with a fixed effective date;
- decoded scope has `validity.mode='travel_date'`;
- extractor deterministically compares that server-held travelDate to the fixed source rule date;
- one date succeeds with the expected complete fact;
- a date before the rule boundary fails closed or produces the separately defined supported outcome according to the synthetic definition;
- no caller envelope field is read by the extractor.

This test is architectural only. Do not encode GOV.UK or any real country/source in runtime or test fixture names.

## 9. Multi-citizenship / document tests

At minimum prove:

- full citizenship set reaches context unchanged/canonicalized;
- reordered citizenship input produces the same canonical scope/key;
- two citizenships remain two citizenships; no ranking/selection;
- issuingCountryCode does not replace citizenship;
- related citizenship remains null unless explicitly present;
- credential document type remains exact;
- residence context remains separate;
- travelDate is available only through canonical `scope.validity`.

## 10. Scope-key mismatch adversarial tests

At minimum:

1. decoded scope + wrong `scopeKey` blocks before matcher/extractor;
2. top-level requirementType differs from scope requirementType -> block;
3. scope with `sourceId` -> block;
4. scope with extra field -> block;
5. scope with PII key -> `personal_identifier_forbidden` or existing equivalent;
6. malformed country/document/date value -> block;
7. proof candidate scope and accepted Evidence scope mismatch -> block before HTTP;
8. proof `ruleScopeKey` mismatch -> block before HTTP;
9. mutation of source proof/input after canonicalization cannot alter extractor context/result.

## 11. Production registry remains empty

Do not add:
- GOV.UK;
- Immigration New Zealand;
- Singapore ICA;
- any CH source;
- any real extractor definition;
- any synthetic runtime definition.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` remains exactly empty.

Live path still ends `extractor_not_registered` after trust checks.

## 12. Allowed files

Primary edits:

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`

Narrow edit only if strictly necessary:
- `lib/readiness/rule-claims.ts` / test, but only to expose an existing canonical helper; do not duplicate parsing.

Delivery docs:
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DECODED_REGULATORY_SCOPE_BINDING_1_SELF_REVIEW_2026-10-03.md`

Do not edit:
- task seed;
- source catalog/migrations;
- DB;
- global current-state docs.

Any additional file requires a necessity note before editing.

## 13. Forbidden

No:
- real extractor registration;
- source-specific parser;
- retrieval BODY_MAX change;
- `regelKandidatAkzeptieren`;
- accepted Rule Claim;
- Evidence/store write;
- provenance persistence/schema;
- migration/apply;
- Production DB/catalog change;
- route/UI;
- Auth/AAL/RLS;
- provider/model/plugin;
- secrets/cost;
- CH import;
- #626;
- F8;
- follow-up slice.

## 14. Validation / STOP

Before STOP:

- focused extractor tests;
- focused same-request extraction tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- operating-mode/hygiene gates;
- `git diff --check`;
- verify production extractor registry empty;
- verify non-test importer restriction;
- verify no app route imports;
- fetch current main and finish 0 behind;
- push exact review head;
- keep Draft;
- report session id + `originalModelName` + exact head/files/gates;
- STOP for independent TL review.

No Ready. No merge. No real source-specific extractor follow-up.