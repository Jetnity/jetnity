# Official Truth Regulatory Applicability Runtime Foundation 1 — Task

Date: 3 October 2026
Issue: #794
Branch: `feat/official-truth-regulatory-applicability-foundation-1`
Baseline: `main@50c1c799feb20adfafa563a3862b1cda70719cb4`
Logical agent: **Jetnity Official Truth regulatory applicability runtime foundation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Implement only the pure, bounded regulatory applicability evaluator defined by merged architecture #792 / PR #793.

This slice creates no live authority path and no product wiring.

It must not:
- edit `rule-claims.ts`;
- edit extractor registry or same-request server;
- edit DB/migrations;
- add route/UI;
- register a source extractor;
- persist personal regulatory context;
- start F8.

## 2. Binding reads

Read live main first, then at minimum:

1. `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
2. `lib/readiness/domain.ts`
3. `lib/readiness/digest.ts`
4. `lib/readiness/official.ts`
5. `lib/readiness/traveller-kontext.ts`
6. `lib/readiness/rule-claims.ts` for compatibility only — do not edit it.

Live code wins where a helper signature differs.

## 3. Allowed runtime files

Create exactly:

- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`

Delivery docs:

- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_APPLICABILITY_FOUNDATION_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task seed after creation.

Any additional file requires an explicit necessity note before editing and is presumptively forbidden.

## 4. Module boundary

The new module is pure and deterministic.

Allowed imports:
- `landescodeLesen` from `@/lib/readiness/domain`;
- `sha256Hex` from `@/lib/readiness/digest`;
- `visaResultUndModusWidersprechen` and type-only OfficialVisaMode/OfficialRequirementType helpers from `@/lib/readiness/official` if needed.

Forbidden imports/calls:
- Supabase;
- fetch/network;
- Date/new Date/Date.now;
- Math.random;
- environment variables;
- filesystem;
- provider/model/plugin;
- rule acceptance;
- store writer;
- extractor registry;
- same-request server;
- app route code.

No `server-only`: this is a pure domain module, not an authority loader.

## 5. Architecture contract is binding

Implement the merged #793 architecture literally, including:

Constants:
- schema 1;
- depth max 4;
- node max 16;
- operands max 8;
- branches max 8;
- age max 120;
- group threshold max 50;
- group context max 500.

Closed vocabularies:
- destination permission classes;
- travel purposes;
- document classes;
- non-ISO nationality status classes;
- institution statuses;
- regulatory regions;
- missing-fact codes.

Do not add source-specific flags.

## 6. Exact first-slice domain types

Implement/export the architecture types for:

- `RegulierungsPraedikat`;
- `RegulierungsAusdruck`;
- `RegulierungsWenn`;
- `RegulierungsZweig<T>`;
- `RegulierungsAnwendbarkeit<T>`;
- `RegulierungsHerkunft`;
- `RegulierungsFakt<T>`;
- `RegulierungsKontext`;
- `RegulierungsAbhaengigkeit`;
- `RegulierungsEntscheidspur`;
- `RegulierungsAuswertung<T>`;
- `WirkungsAusgang`;
- `VisaOptionsAusgang`;
- the exact schema-1/legacy requirement-effect and visa-option fact types specified in section 3.1 of the architecture.

The module may use narrower internal helper types but must not weaken these shapes.

## 7. Parsing / exact-key validation

Provide strict unknown-input readers.

At minimum export deterministic readers equivalent to:

- `regulierungsKontextLesen(roh: unknown)`;
- `regulierungsAnwendbarkeitWirkungLesen(roh: unknown, requirementType: OfficialRequirementType)`;
- `regulierungsAnwendbarkeitVisaOptionLesen(roh: unknown)`.

Names may differ only if clearer and documented in the report.

Readers must:
- reject arrays where objects are required;
- reject unexpected keys;
- reject functions/regex/string expressions;
- canonicalize country codes through `landescodeLesen`;
- enforce exact closed enums;
- enforce integer bounds;
- enforce branch-id regex and uniqueness;
- enforce support id regex `^ev1_[a-f0-9]{32}$`;
- enforce support max 8, sorted/deduped;
- reject personal identifier keys anywhere in context/expression payload, including existing known prohibited keys plus:
  - schoolName
  - institutionName
  - permitNumber
  - visaNumber
  - documentNumber
  - dateOfBirth
  - passportNumber
  - mrz
  - biometric
  - health / healthRecord equivalents;
- reject unauthorized provenances `licensed_provider_confirmed` and `official_document_verified`.

Do not reinterpret invalid input as unknown.

## 8. Expression normalization

Implement raw-tree bounds before normalization and the same bounds after normalization.

Normalization exactly:
1. double NOT collapses;
2. nested ALL flattens;
3. nested ANY flattens;
4. NOT is not distributed;
5. ALL/ANY operands sorted by canonical JSON;
6. duplicate operands deduped;
7. one remaining operand unwraps.

Empty ALL/ANY is invalid.

Canonical normalization must be deterministic across input object/operand ordering.

## 9. Three-valued evaluation

Internal truth values:
- true
- false
- unknown

Exact semantics:
- NOT true = false
- NOT false = true
- NOT unknown = unknown
- ALL: any false -> false; else any unknown -> unknown; else true
- ANY: any true -> true; else any unknown -> unknown; else false

Unknown must never be coerced to false.

Evaluate operands in canonical normalized order.

## 10. Atomic predicate behavior

Implement all architecture atomics.

Important permanent behaviors:

### Destination permission
- matching `valid_on_travel_date` -> true;
- explicit `not_valid` -> false;
- no matching row -> unknown;
- conflicting rows for same destination+class -> context parse failure.

### Lawful residence
- residence country alone does not satisfy entitlement;
- explicit opposite entitlement/departure -> false;
- absent row -> unknown.

### Journey origin
- country predicate uses only journey origin;
- residence/transit/destination are never substituted;
- region predicate uses code-owned region pins only;
- `REGULIERUNGS_REGION_PINS` is exported and exactly empty in this slice;
- known origin + unpinned region -> unknown with `region_membership_unpinned`, not a traveller missing-fact question.

### Age
- integer age on travel date only;
- no DOB accepted.

### Purpose
- exact enum;
- `other` is explicit only, never fallback.

### Document class
- separate from documentType;
- passport does not imply ordinary.

### Citizenship / issuer / credential link
- full citizenship set;
- no issuer->citizenship or citizenship->issuer inference;
- explicit related citizenship only.

### Legal nationality status
- missing status row = unknown;
- explicit `not_held` = false.

### School/group
- no school name;
- bounded sizes;
- missing subfacts use the canonical school-party missing code plus age/purpose where appropriate.

## 11. Decision dependency trace

Implement the corrected #793 semantics.

Every `decided` result has a bounded in-process `decisionTrace`.

Each dependency contains only:
- predicateKind;
- provenance;
- polarity true|false.

No personal values.

Canonical visit order:
- normalized operand order;
- branch id order.

Dependencies:
- ALL false: first decisive false operand only;
- ANY true: first decisive true operand only;
- ALL true / ANY false: all operands;
- NOT: inner dependencies unchanged;
- atomic true/false: that context fact;
- unknown: no decided dependency.

Branch decision:
- one/multiple true branches same outcome and no conflicting unknown branch: first true branch in branch-id order;
- otherwise: union of false-establishing dependencies for **every** expression branch.

Binding:
- any deciding dependency user_asserted -> `context_asserted`;
- non-empty dependencies all account_profile/trip_context -> `context_recorded`;
- null only for genuinely unconditional rule;
- branched decision with empty trace must not become null; fail closed.

Do not expose decisionTrace through any HTTP code; this module has no HTTP code.

## 12. Missing facts

Collect only unknown facts still needed after deterministic short-circuit.

- canonical order;
- deduped;
- unknown never becomes false;
- a known origin with an unpinned region produces `region_membership_unpinned` and must not ask journey_origin again;
- decided results have empty missingFacts;
- branch_conflict/no_applicable_branch do not invent questions.

## 13. Branch outcomes

Implement generic branch walker plus adapters.

Requirement-effect adapter:
- branch outcomes only `required|not_required`;
- validate visaMode using existing contradiction helper;
- non-visa requirement types require visaMode null;
- flat legacy `conditional` returns fail-closed `legacy_conditional_without_payload`;
- branched top-level outcome fields are rejected `mixed_outcome`.

Visa-option adapter:
- branched outcomes are eligibility allowed/not_allowed plus mandate;
- source exclusion such as diplomatic-passport eVisa ineligibility maps to option `not_allowed`, never requirement `not_required`;
- mixed top-level option eligibility/mandate + branched applicability is rejected.

No current accepted-claim parser is edited. These are pure adapters/readers only.

## 14. Exact fact-shape compatibility

Implement only the pure shape readers described in section 3.1.

Requirement effect:
- legacy exact keys kind/effect/visaMode;
- schema-1 unconditional exact keys kind/schema/applicability/effect/visaMode;
- schema-1 branched exact keys kind/schema/applicability only.

Visa options:
- legacy fact exact kind/options with legacy option exact keys;
- schema-1 fact exact kind/schema/options;
- every schema-1 option has exact applicability;
- unconditional option carries top-level eligibility/mandate;
- branched option carries no top-level eligibility/mandate.

No persistence.

## 15. Fingerprints

Implement/export only the non-personal global-rule fingerprint:

`rule-applicability:v1:<sha256>`

over canonical normalized applicability including branch ids and support ids.

Do **not** implement, compute, export or return `reg-eval-ctx:v1`.

Tests must source-assert that the module does not contain `reg-eval-ctx:v1`.

## 16. Privacy

Context parser must fail closed on personal identifier keys.

No logging.
No analytics.
No telemetry.
No persistence.
No caches.
No traveller clientRef in the type.
No context fingerprint.

This module returns only the parsed/canonical context or evaluation material to its immediate in-process caller.

## 17. Mandatory tests

At minimum test:

1. exact three-valued truth table;
2. NOT unknown remains unknown;
3. otherwise never runs with an unknown exemption;
4. explicit destination permission not_valid is false; absence is unknown;
5. explicit nationality status not_held is false; absence is unknown;
6. mandatory corrected case: two user_asserted negative exemption facts -> otherwise required + `context_asserted` + false dependency trace;
7. short-circuit ALL false excludes later user_asserted dependency;
8. NOT of user-asserted false keeps false inner polarity;
9. recorded-only deciding dependencies -> `context_recorded`;
10. unconditional -> null binding;
11. branch conflict;
12. no applicable branch;
13. missing-fact minimization and dedupe;
14. known origin + unpinned CTA -> region_membership_unpinned without asking origin again;
15. full multi-citizenship membership;
16. citizenship order canonicalization;
17. issuer does not satisfy citizenship;
18. credential link null is unknown;
19. documentType passport does not satisfy document_class ordinary;
20. personal keys rejected;
21. unauthorized provenance rejected;
22. depth/node/operand/branch bounds;
23. normalization flatten/sort/dedupe/double-not;
24. normalized equivalent inputs have identical rule-applicability fingerprint;
25. fingerprint changes on meaningful predicate/outcome/support change;
26. support ids validated/sorted/deduped/bounded;
27. legacy required/not_required accepted as unconditional adapter input;
28. legacy conditional fails closed;
29. schema-1 mixed top-level+branches rejected;
30. schema-1 unconditional requirement effect;
31. schema-1 branched requirement effect;
32. legacy visa options;
33. schema-1 unconditional visa option;
34. schema-1 branched visa option;
35. visa contradiction rejection;
36. no source-specific GOV.UK/India/Saudi runtime vocabulary;
37. `REGULIERUNGS_REGION_PINS.length === 0`;
38. module source has no `reg-eval-ctx:v1`;
39. source has no fetch/Supabase/Date/random/provider/model/store/acceptance/extractor imports;
40. no `app/` import of this module in this slice.

## 18. No wiring

No other runtime module imports this new module in this slice, except its test.

Repository source assertion must prove no non-test importer exists.

This makes the foundation dormant.

## 19. Forbidden

No:
- `rule-claims.ts` edit;
- accepted claim constructor edit;
- store writer edit;
- extractor framework edit;
- same-request server edit;
- source registry edit;
- route/UI;
- DB/migration/RLS;
- provider/model/plugin;
- source extractor;
- CH import;
- BODY_MAX change;
- F8;
- follow-up slice.

## 20. Validation / STOP

Before STOP:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- operating-mode/hygiene gates;
- `git diff --check`;
- verify exactly the owned files + delivery docs changed;
- verify no non-test importer;
- fetch current main and finish 0 behind;
- push exact review head;
- keep Draft;
- report session id + `originalModelName` + exact head/files/gates;
- STOP for independent TL review.

No Ready. No merge. No follow-up.