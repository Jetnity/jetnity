# Official Truth Applicability Canonical Wiring Runtime 1 — Task

Date: 3 October 2026
Issue: #798
Branch: `feat/official-truth-applicability-canonical-wiring-1`
Baseline: `main@e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`
Logical agent: **Jetnity Official Truth applicability canonical wiring runtime 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement exactly the merged #797 wiring plan.

This slice must atomically:
1. add the store loss-prevention guard;
2. widen the one existing canonical Rule-fact parser to schema-1 applicability;
3. prove extractor/same-request compatibility through tests only.

No schema-1 persistence is allowed.
No DB migration.
No real source extractor.
No F8.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
4. `lib/readiness/regulierungs-anwendbarkeit.ts`
5. `lib/readiness/rule-claims.ts`
6. `lib/readiness/official-truth-store-server.ts`
7. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
8. `lib/readiness/official-truth-same-request-extraction-server.ts`
9. relevant tests.

Live code wins.

## 3. Atomic ordering

One PR only.

Safe implementation order inside the branch:

A. Add the store loss-prevention guard first.
B. Then widen the canonical parser.
C. Then update the importer lock and tests.
D. STOP.

Do not split parser widening and store guard across separate PRs.

## 4. Canonical parser — one path only

`regelFaktLesen` remains the single internal Rule-fact semantic parser.

Required:
- `rule-claims.ts` imports the existing fact-shape readers/types from `regulierungs-anwendbarkeit.ts`;
- `requirement_effect` delegates to `regulierungsAnwendbarkeitWirkungLesen`;
- `visa_options` keeps the existing `requirementType === 'visa'` gate in `rule-claims.ts`, then delegates to `regulierungsAnwendbarkeitVisaOptionLesen`;
- the other six fact kinds remain on their current readers;
- `regelFaktKanonischLesen` still delegates only to `regelFaktLesen`;
- `regelKandidatAkzeptieren` still delegates only to `regelFaktLesen`;
- no extractor-only parser;
- no second Rule acceptance constructor.

Do not import traveller evaluation functions into `rule-claims.ts`.

Forbidden imports there:
- `regulierungsKontextLesen`;
- `regulierungsWirkungAuswerten`;
- `regulierungsVisaOptionAuswerten`;
- `regulierungsAusdruckAuswerten`;
- `regelAnwendbarkeitFingerprint`.

## 5. Type integration

Reuse existing applicability types. Do not duplicate schema-1 interfaces.

Expected direction:
- `regulierungs-anwendbarkeit.ts` stays independent and does not import `rule-claims.ts`;
- `rule-claims.ts` imports type/readers from applicability.

Widen:
- `RegelAnforderungswirkung` to the existing applicability requirement-effect union;
- `RegelVisaOptionen` to the existing applicability visa-options union;
- `RegelFakt` first two arms accordingly.

Keep:
- same eight fact-kind strings;
- same `factKind`;
- same Rule scope/key algorithm;
- same `AkzeptierteRegelClaim` fields;
- no applicability fingerprint field.

Avoid circular imports.

## 6. Error vocabulary

Add to `RegelClaimFehler` as required by #797:

- `legacy_conditional_without_payload`
- `mixed_outcome`
- `provenance_not_authorized`
- `depth_exceeded`
- `node_bound_exceeded`
- `operand_bound_exceeded`
- `branch_bound_exceeded`

Existing:
- `invalid_fact`
- `invalid_fact_kind`
- `visa_contradiction`
- `visa_mode_forbidden`
- `invalid_support`
- `support_bound_exceeded`

remain.

`applicability_not_persistable` is a **store-writer result**, not a `RegelClaimFehler`.

## 7. Legacy compatibility

Must preserve:

- legacy requirement-effect `required/not_required`;
- legacy visa options;
- all other six fact kinds;
- Rule scope/key semantics;
- existing successful store payloads.

Legacy flat `effect:'conditional'` changes intentionally:
- no longer accepted as a successful Rule fact;
- returns `legacy_conditional_without_payload`;
- no schema-1 upgrade;
- store RPC call count stays zero.

Do not change `lib/readiness/official.ts` product result vocabulary.

## 8. Store loss-prevention guard — mandatory

In `akzeptierteRegelClaimSpeichern`:

1. call `regelKandidatAkzeptieren` exactly as today;
2. if acceptance fails, return its reason;
3. inspect the accepted `claim.fact`;
4. if the fact is **any schema-1 applicability fact**, return:
   `{ ok:false, reason:'applicability_not_persistable' }`;
5. this return must happen before:
   - `transportAus`;
   - Supabase client creation;
   - `claimPayload`;
   - `faktSpalten`;
   - `transport.aufrufen`;
   - any RPC.

Binding decision:
**all schema-1 facts are non-persistable, including unconditional**.

Do not flatten schema-1 unconditional facts.

## 9. Persistable narrowing

Do not let `faktSpalten` accept the widened full `RegelFakt` union.

Create a private narrowed persistable fact type / type guard that excludes:
- schema-1 requirement effect;
- schema-1 visa-options fact.

`claimPayload` / `faktSpalten` must only receive that persistable legacy-compatible shape.

TypeScript should make it impossible to serialize a branched or schema-1 unconditional fact accidentally.

No throw-based guard.
No guard inside `faktSpalten`.
The explicit store return owns the error.

## 10. Schema-1 detection

Fail closed when:

Requirement effect:
- `kind==='requirement_effect'` and `schema===1` / applicability exists.

Visa options:
- `kind==='visa_options'` and parent `schema===1`.

Do not inspect only branched vs unconditional. Every schema-1 shape is non-persistable.

Other six fact kinds have no schema-1 arm in this slice.

## 11. Extractor compatibility

Do not register a real extractor.

Production:
`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY`
must remain exactly empty.

Add a synthetic test through:
`officialTruthTrustedFactExtrahierenMitDefinitionen`
that emits one valid schema-1 fact and proves it passes through the existing canonical parser.

Do not add a second parser to the extractor.

Do not modify extractor source unless a type-only narrowing is strictly required. If edited, document why.

## 12. Same-request compatibility

Prefer no source edit.

Add a test that a synthetic schema-1 fact can remain on same-request success material as `trustedRuleFact` without:
- `RegulierungsKontext`;
- context fingerprint;
- persistence;
- acceptance.

The live path continues using the empty production registry.

No call to `regelKandidatAkzeptieren` from same-request extraction.

## 13. Importer lock

Update `regulierungs-anwendbarkeit.test.ts`:

Before this slice only its own test imports the module.

After this slice the only non-test production importer allowed is:
- `lib/readiness/rule-claims.ts`.

Any other runtime importer fails the repository assertion.

In particular no direct import from:
- store server;
- extractor registry;
- same-request server;
- app/routes/components.

## 14. Mandatory tests

At minimum prove:

1. all existing legacy Rule-fact tests stay green;
2. legacy required parses unchanged;
3. legacy not_required parses unchanged;
4. legacy flat conditional -> `legacy_conditional_without_payload`;
5. schema-1 unconditional requirement effect parses;
6. schema-1 branched requirement effect parses;
7. mixed top-level outcome + branches -> `mixed_outcome`;
8. schema-1 unconditional visa options parse;
9. schema-1 branched visa options parse;
10. canonical wrapper and acceptance produce deep-equal semantic fact for the same trusted input;
11. no second parser path;
12. extractor test seam accepts a synthetic schema-1 fact through canonical parser;
13. production extractor registry remains empty;
14. same-request test seam retains schema-1 `trustedRuleFact` with no traveller context/hash;
15. schema-1 branched requirement-effect accepted in memory but store returns `applicability_not_persistable` and RPC count 0;
16. schema-1 unconditional requirement-effect same;
17. schema-1 branched visa-options same;
18. schema-1 all-unconditional visa-options same;
19. guard returns before store configuration/client construction; `store_not_configured` must not mask it;
20. legacy requirement-effect store payload byte/shape unchanged;
21. legacy visa-options store payload byte/shape unchanged;
22. other flat fact store payload tests unchanged;
23. current SQL schema tests unchanged;
24. no new migration file;
25. importer lock only permits `rule-claims.ts`;
26. no traveller evaluation import in `rule-claims.ts`;
27. no route/UI/provider/model;
28. no F8.

## 15. Allowed source edits

Primary:
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`

Test-only if required:
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`

Source files expected **not** to need edits:
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`

Any edit to those three source files requires a necessity note and must not add authority/evaluation/persistence.

Delivery docs:
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_SELF_REVIEW_2026-10-03.md`

Task seed remains unchanged.

## 16. Forbidden

No:
- `supabase/**` edit;
- migration;
- DB/RLS/apply;
- Production DB/catalog change;
- source-specific extractor;
- production extractor registration;
- route/UI/components/hooks;
- provider/model/plugin;
- Rule evaluator wiring into user flows;
- traveller context persistence;
- `rule-applicability:v1` on accepted claim;
- `reg-eval-ctx:v1`;
- CH import;
- BODY_MAX change;
- #626;
- F8;
- follow-up slice.

## 17. Validation / STOP

Before STOP:

- focused Rule parser tests;
- focused store tests;
- focused applicability importer test;
- focused extractor/same-request compatibility tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- operating-mode/hygiene gates;
- `git diff --check`;
- verify no new migration;
- verify production extractor registry empty;
- fetch current main and finish 0 behind;
- push exact review head;
- keep Draft;
- report session id + `originalModelName` + exact head/files/gates;
- STOP.

No Ready. No merge. No F8. No follow-up.