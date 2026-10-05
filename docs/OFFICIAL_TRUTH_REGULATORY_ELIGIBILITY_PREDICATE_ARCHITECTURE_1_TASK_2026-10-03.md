# Official Truth Regulatory Eligibility Predicate Architecture 1 — Task

Date: 3 October 2026
Issue: #792
Branch: `docs/official-truth-regulatory-eligibility-predicate-architecture-1`
Baseline: `main@cb6b32dd34075a47eb220454ea46fc8371752b15`
Logical agent: **Jetnity Official Truth regulatory eligibility predicate architecture 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## 1. Purpose

Design the smallest reusable deterministic architecture for conditional regulatory rules and traveller-specific exception facts.

This is **docs-only architecture**.

Do not edit runtime.
Do not edit DB/schema.
Do not add UI.
Do not add a real source extractor.
Do not start F8.

## 2. Problem proven by merged audits

Current `RegelScope` contains:

- destinationCountryCode
- transitCountryCode
- citizenship set
- one credential option
- residence
- requirementType
- validity/travelDate

This is intentionally non-personal and compact.

That scope is insufficient for several real official rules already audited:

### GOV.UK ETA
Current official rules contain exemptions/conditions based on:
- already holding valid UK entry clearance or permission to enter/stay;
- lawful residence in Ireland plus journey from elsewhere in the Common Travel Area;
- British Overseas Territory Citizen / British National (Overseas) status;
- age thresholds;
- school / educational institution status;
- school-party size/context;
- visitor purpose;
- passport-to-nationality linkage.

### India eVisa
Current official page also distinguishes:
- diplomatic / official / laissez-passer document classes;
- eVisa visit-purpose conditions;
- passport-from vs nationality predicates.

Do not design a GOV.UK-only one-off flag set. Design a reusable regulatory predicate vocabulary.

## 3. Binding code reads

Read live main first, then at minimum:

- `types/trips.ts`
- `lib/readiness/traveller-kontext.ts`
- `lib/readiness/provider.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/official.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_SOURCE_FAMILY_SELECTION_2_2026-10-03.md`

Live code wins.

## 4. Architecture separation

The design must keep three distinct truth layers:

### A. Global regulatory truth
Non-personal official rule definition.

May contain:
- predicates / applicability conditions;
- exceptions;
- outcomes;
- official provenance.

Must never contain a specific traveller's values.

### B. Traveller regulatory context
Facts about one traveller/trip used only to evaluate applicability.

Examples:
- destination permission already held;
- lawful residence status;
- journey origin;
- travel purpose;
- age band/value;
- document class;
- legal nationality/status class.

This is not Official Truth and must not become globally reusable truth.

### C. Evaluation result
Derived per traveller/cell:
- required
- not_required
- conditional/insufficient_context
- missing facts

The evaluator may not infer false from an absent traveller fact.

## 5. Required design decision: conditions as first-class semantics

The current:

`{ kind:'requirement_effect', effect:'required|not_required|conditional', visaMode }`

cannot encode conditions.

Evaluate at least these options:

1. extend `requirement_effect` with condition expression;
2. add a separate `RegelApplicability` / condition object attached to a Rule Claim;
3. add a new fact kind representing conditional applicability;
4. another cleaner design if demonstrated.

Choose one canonical architecture.

The chosen design must:
- avoid a second Rule engine;
- preserve `regelKandidatAkzeptieren` as the sole acceptance constructor;
- keep existing unconditional facts representable without boilerplate;
- allow deterministic fail-closed evaluation;
- make unknown traveller context produce unknown/insufficient_context, not false;
- support explicit exceptions;
- be versionable;
- support provenance per condition if composition is later enabled.

## 6. Predicate vocabulary

Design a bounded, typed vocabulary. It must be general enough for the audited cases but not an arbitrary expression language.

At minimum evaluate predicates for:

### Existing destination permission
Examples:
- has valid destination entry clearance;
- has valid permission to enter/stay;
- has already-valid ETA/visa/permit where legally relevant.

Must define:
- destination binding;
- permission class;
- validity status;
- no document number / permit number.

### Lawful residence / entitlement
Distinguish:
- residence country;
- legally entitled to reside;
- rule-specific entitlement condition when needed.

Do not equate current `residenceCountryCode` with lawful-entitlement proof.

### Journey origin / region
Examples:
- travelling from country X;
- travelling from an explicit code-owned region such as Common Travel Area.

Do not infer origin from residence or destination.

### Age
Avoid date of birth if not necessary.

Evaluate:
- integer age on travel date;
- age-band predicate;
- another privacy-bounded representation.

It must support <=18 and <=19 rules without storing DOB.

### Travel purpose
Bounded enum only, no prose.

At minimum consider:
- visitor/tourism;
- business;
- study;
- medical;
- transit;
- work/creative-worker;
- other/unknown.

Do not silently map existing trip interests into legal purpose.

### Document class
Current documentType `passport` is too broad.

Evaluate a separate class dimension such as:
- ordinary
- diplomatic
- official/service
- emergency/temporary
- refugee/travel_document
- laissez_passer
- unknown

Do not overload `documentType`.

### Nationality/status class
Need a safe model for non-ISO legal status classes such as:
- British Overseas Territory Citizen;
- British National (Overseas).

Do not pretend these are ISO countries.

### Group / institution predicates
School-party rules prove this class exists.

Design minimally:
- institution type/status;
- group size threshold;
- traveller membership in group;
- jurisdiction/authority confirmation where legally required.

Do not add free-text school identity to global Official Truth.

## 7. Expression model

Design a deterministic bounded expression grammar.

At minimum support:
- ALL
- ANY
- NOT
- atomic predicate

Hard bounds:
- max depth;
- max nodes;
- no recursion from caller;
- canonical ordering where semantics permit;
- duplicate elimination;
- deterministic fingerprint.

No:
- arbitrary JavaScript;
- regex from DB;
- model expression;
- executable DSL;
- free-form text conditions.

Clearly define three-valued evaluation:
- true
- false
- unknown

Rules:
- unknown is never coerced to false;
- NOT unknown = unknown;
- ALL with one false = false, else unknown if any unknown;
- ANY with one true = true, else unknown if any unknown.

## 8. Rule outcome model

Design how predicates map to outcomes.

It must handle patterns such as:

- BASE required, EXCEPT when predicate -> not_required;
- required only when predicate;
- different outcome by predicate branch;
- a rule with no applicable branch -> unknown, not guessed.

Avoid source-specific imperative code as the only semantics.

A source-specific extractor may populate a typed condition structure, but the evaluator must be generic.

## 9. Traveller context provenance

For each traveller-context fact, design provenance classes.

At minimum consider:
- `user_asserted`
- `account_profile`
- `trip_context`
- later `licensed_provider_confirmed`
- later `official_document_verified` only if ever explicitly designed

Do not make provenance automatically equal authority.

For this architecture, define which predicates can be safely evaluated from:
- user assertion;
- existing account/trip fields;
- provider-confirmed fields.

Do not propose pass scans, MRZ, biometrics or permit numbers.

## 10. Persistence and privacy

This architecture must explicitly decide persistence posture.

Default preference:
- global rule predicate definitions may later be persisted as non-personal Official Truth;
- traveller regulatory context should be **ephemeral or trip-scoped minimal context**, not copied into global Official Truth;
- sensitive or uncommon facts should not be persisted by default.

Audit current Jetnity privacy stance:
- no passport/document numbers;
- no MRZ;
- no scans;
- no biometrics;
- no health record.

For each proposed traveller fact classify:
- non-sensitive/basic trip context;
- personal legal-status context;
- should be ephemeral;
- may be persisted later only behind separate Product-Owner/privacy gate.

Do not implement persistence here.

## 11. Missing facts / UX contract

Design machine-readable missing-fact codes for the evaluator.

Examples:
- destination_permission_status
- lawful_residence_status
- journey_origin
- age_on_travel_date
- travel_purpose
- document_class
- nationality_status
- school_party_context

The UI can later ask only the minimum needed question after a rule requires it.

Do not require every traveller to fill every field upfront.

## 12. Scope compatibility

Decide whether these predicates should:
- expand `RegelScope`;
- live in a separate `RegulatoryEvaluationContext`;
- or split static lookup scope from dynamic eligibility context.

Strong preference: do not bloat the global Evidence lookup key with volatile or uncommon traveller facts unless a concrete reason requires it.

Document the chosen separation and fingerprint rules.

## 13. Multi-citizenship behavior

Must remain exact:
- full citizenship set is retained;
- rules may explicitly test membership;
- no automatic “best passport” selection;
- no first-match priority unless a separately defined evaluator deliberately compares credential options;
- legal-status classes remain separate from citizenship countries.

## 14. Composition interaction

Current composed Official Truth is blocked.

Architecture must explain how future multi-source composition would assign provenance to:
- outcome;
- condition predicates;
- exceptions.

Do not implement composition policy.

## 15. Acceptance / F8 interaction

Explain what F8 would eventually accept.

F8 must not accept merely:
- a flat `effect: required` when required exceptions are unrepresented.

It may eventually accept:
- a complete deterministic rule + bounded applicability semantics + provenance.

`regelKandidatAkzeptieren` remains sole canonical acceptance constructor.

No new acceptance function.

## 16. Required output

Create exactly:

- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

The architecture doc must conclude with exactly one implementation classification:

- `PREDICATE_FOUNDATION_READY_FOR_RUNTIME_SLICE`
- `ARCHITECTURE_GAP_REMAINS`

If ready, specify:
- exact proposed TypeScript types;
- exact canonical predicate kinds;
- expression bounds;
- evaluation truth table;
- separation between static rule scope and dynamic traveller context;
- missing-fact codes;
- privacy/persistence classification;
- migration impact: NONE for first runtime slice if possible;
- exact files the first runtime foundation should own;
- explicit non-goals.

## 17. Forbidden

No edits to:
- `lib/**`
- `app/**`
- `components/**`
- `types/**`
- `supabase/**`

No:
- runtime;
- DB/migration/apply;
- UI;
- extractor registration;
- route;
- provider/model integration;
- CH import;
- F8;
- Production change.

## 18. Validation / STOP

Before STOP:
- read current code;
- reconcile with GOV.UK ETA and India audit examples, but do not re-research web sources unless needed to understand already-recorded rules;
- no personal data;
- `git diff --check`;
- operating-mode guard;
- fetch current main and finish 0 behind;
- keep Draft;
- report session id + `originalModelName` + exact head/files;
- STOP.

No Ready. No merge. No runtime follow-up.