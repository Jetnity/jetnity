# Official Truth applicability schema 2 dormant runtime foundation 1 — Task

Date: 6 October 2026
Issue: #856
Status: **BINDING / DORMANT RUNTIME FOUNDATION / NO PRODUCER / NO REGISTRY ACTIVATION / NO DB / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@7fb95414db6b7e4de12bea0df29b2c771081b9d4`
Machine mode at dispatch: `NORMAL`

Merged prerequisites:
- #851 — `APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY`
- #855 — `AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_READY_FOR_PERSISTENCE_DESIGN`
- #853 — JP identity/retrieval audit remains `NOT_READY`
- #847 — B01 Account OfficialEvaluation wiring integrated; provider factory remains null/fail-closed

Binding architecture:
`docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md`

Live code wins if implementation details moved, but semantic decisions in the merged architecture are binding unless a contradiction is found. If a contradiction would require semantic redesign, STOP for Technical-Lead review; do not improvise.

## 2. Writer

Logical writer:
**Jetnity Official Truth applicability schema 2 dormant runtime foundation 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

Standing #751 Codex autonomous execution directive applies:
- work autonomously through live re-read, implementation, tests, commit and push;
- no routine Product-Owner approval for commit/push/tests;
- keep PR Draft;
- never Ready or merge;
- STOP after delivery;
- no automatic follow-up slice.

## 3. Exact objective

Implement only the **first atomic dormant runtime subset** of #851.

### 3.1 Applicability/context schema 2

In `lib/readiness/regulierungs-anwendbarkeit.ts`:

- preserve all v1 parsing/evaluation/fingerprint semantics;
- add explicit version dispatch for schema 2;
- implement the exact v2 context additions and exact three new predicate kinds from #851:
  - `activity_characteristic`
  - `planned_stay_duration`
  - `national_passport_for_citizenship`
- preserve existing boolean operators/branch semantics and expression bounds;
- implement strict parsing and three-valued evaluation exactly as specified;
- implement context conflict detection before short-circuiting;
- implement canonical/fingerprint behavior with explicit schema-version separation;
- no JP/GB/source-host branching;
- no generic attribute path;
- no free-text conditions;
- no inference from purpose/issuer/residence/silence.

V1 and v2 must never silently cast into one another.

### 3.2 Activity-characteristic semantics

Implement only the bounded source-neutral characteristic vocabulary defined by #851.

All characteristics initially accept only the architecture-authorized explicit provenance.

Required behavior:
- duplicate same characteristic/value/provenance canonicalizes only after raw bound validation;
- true+false for same characteristic = `context_conflict`;
- missing characteristic => unknown with exact gap;
- no purpose-label inference;
- no employment/account/profile inference;
- no model inference;
- no most-recent-wins logic.

Do not create any producer.

### 3.3 Planned stay semantics

Implement the exact #851 `PlannedStayV2` contract and evaluator rules.

Required:
- CivilDate strict validation;
- arrival/departure/open-ended/unknown distinctions;
- direct declared quantity with exact unit + counting convention;
- day candidates from local civil dates only under explicitly named supported day-count convention;
- no timestamps/UTC/DST;
- no month arithmetic from dates;
- no day↔month/year conversion;
- no rounding/clamping;
- open-ended never implies `more_than=true`;
- declaration/date mismatch = conflict;
- exact technical bounds from architecture;
- exact gap precedence from architecture.

No Trip binder/producer. No whole-Trip start/end mapping.

### 3.4 National passport semantics

Implement the exact three-valued `national_passport_for_citizenship(C)` conjunction from #851:

- credential document type;
- recorded citizenship inclusion;
- exact `relatedCitizenshipCountryCode`;
- explicit `nationalPassport=true`.

Preserve distinctions:
- citizenship != issuer;
- related citizenship != issuer;
- passport != ordinary passport;
- national passport != passport validity;
- no ordinary default.

Implement categorical context conflicts defined in #851, including invalid national-passport assertion combinations for national ID/refugee travel document/laissez-passer where specified.

No producer. No passport scan/number/MRZ/authenticity logic.

### 3.5 Separate event deadline

In `lib/readiness/temporal.ts`:

Add the separately versioned schema-2 `event_deadline` form exactly from #851.

Required bounded semantics:
- action only from the closed architecture vocabulary;
- reference only `current_stay_permission_expiry` + country;
- relation `before`;
- mandatory/recommended semantics;
- permission-state/context contract;
- explicit trusted observation reference time supplied to the pure evaluator;
- instant expiry: open iff T < E, closed iff T >= E;
- date-only expiry retained but returns `insufficient_context / permission_expiry_precision`;
- unknown/ungranted/missing expiry exact gaps;
- no arbitrary event names;
- no timezone/midnight/end-of-day conversion;
- no application-filing inference;
- old `relative_duration` behavior unchanged.

No permission producer/binder.

### 3.6 Canonical v2 Rule-fact carriers

In `lib/readiness/rule-claims.ts`:

Add only the exact bounded v2 carriers specified by #851 needed to preserve:
- applicability-qualified fact semantics;
- stay quantity/grant-event qualification;
- event-deadline temporal semantics where the architecture defines a carrier.

Requirements:
- strict exact-key parsing;
- preserve units/counting/event distinctions;
- mixed v1/v2 carrier/applicability is rejected;
- no legal defaults;
- no source-family special cases;
- canonical parser/fingerprint semantics are version-separated;
- legacy/v1 shapes remain unchanged.

Do **not** relax:
- composed branch acceptance rejection;
- support/provenance checks;
- `regelKandidatAkzeptieren` authority boundary.

No new acceptance constructor.

### 3.7 Store hard refusal

In `lib/readiness/official-truth-store-server.ts`:

Atomically with v2 carrier support, add an explicit guard so **every schema-2 carrier is non-persistable**.

Required:
- fail with a deterministic bounded reason before transport/client/payload/RPC;
- zero external/store side effect;
- preserve existing schema-1 refusal and legacy successful behavior;
- do not add SQL/schema/RPC support for v2;
- do not create a persistence representation.

This guard is mandatory in the same slice so no new v2 shape can fall through the current catch-all.

## 4. Explicitly excluded later #851 paths

Do **not** modify in this first runtime slice:

- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`

Those remain a later separate integration/pinning slice after this pure/core runtime foundation independently passes.

Do not change extractor or policy registries. They remain empty/dormant.

## 5. Explicitly forbidden product producers/integration

Do not modify:

- `lib/readiness/provider.ts`
- `lib/readiness/traveller-kontext.ts`
- Trip/account traveller storage/types
- Trip Workspace/B01
- `temporal-projection.ts`
- routes/API
- Account Registry
- UI/components

No code may populate new schema-2 activity/stay/national-passport/permission values from live traveller data in this slice.

No product-runtime user flow changes are authorized.

## 6. Security/trust prohibitions

Absolutely no:

- source/profile/catalog registration
- JP/GOV.UK source implementation
- extractor activation
- composition policy activation
- accepted Evidence
- Rule acceptance
- F8
- autonomous provenance receipt implementation
- provider activation
- model/browser output as truth
- DB/Supabase/migration
- Production Official Truth apply
- CH-01..CH-10 import
- CH-11
- paid/live provider calls
- secrets/credentials

Production registries must remain empty where currently empty.

## 7. V1 compatibility contract

Tests must prove old v1 behavior is unchanged.

At minimum:
- existing v1 parser/fingerprint golden vectors remain identical;
- existing v1 context/evaluator results remain identical;
- existing expression normalization/depth/node/operand/branch bounds remain;
- existing v1 negative-provenance semantics remain;
- existing `otherwise` behavior remains;
- old temporal relative-duration tests remain identical;
- legacy Rule-fact parsing remains;
- current schema-1 store refusal remains before transport.

Do not “clean up” legacy behavior while adding v2.

## 8. V2 focused conformance tests

Use the #851 architecture's A/D/P/L/F/T/S/G adversarial/conformance matrix as binding source.

At minimum test:

### Activity
- true / false / unknown;
- conflict true+false;
- duplicate canonicalization;
- wrong/unknown provenance rejected;
- purpose cannot satisfy characteristic.

### Planned stay
- direct days same convention;
- inclusive/exclusive date-derived candidates;
- same-date behavior;
- mismatch declaration vs dates;
- open-ended => unknown;
- unknown dates with matching direct declaration;
- months only via matching direct assertion;
- no days↔months conversion;
- bounds;
- declaration counting mismatch;
- exact gap precedence.

### Passport/citizenship
- complete true conjunction;
- non-passport known false;
- explicit nationalPassport false;
- missing link/citizenship/type/assertion => unknown as specified;
- ordinary passport requires separate class atom;
- issuer cannot replace related citizenship;
- categorical conflict combinations.

### Event deadline
- instant T<E open;
- T=E and T>E closed;
- date-only precision gap;
- permission unknown/not-yet-granted;
- recorded permission with missing expiry;
- wrong country/visit binding;
- reference time missing;
- old relative temporal semantics unchanged.

### V2 carriers/store
- strict allowed keys;
- schema mismatch rejected;
- units/events retained;
- every v2 carrier blocked before transport/RPC;
- no hidden v2 successful store path.

## 9. Allowed files

Primary runtime:
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `lib/readiness/temporal.ts`
- `lib/readiness/e4-temporal-rules.test.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`

Immutable TASK:
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_TASK_2026-10-06.md`

Delivery:
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_SELF_REVIEW_2026-10-06.md`

No other files may change.

If a compile/import/hygiene constraint genuinely requires another path: STOP for TL scope review before editing it.

## 10. No new source-family readiness claim

This runtime capability does not make:
- Japan ready;
- GOV.UK ETA ready;
- any CH batch importable;
- any provider active;
- any Rule accepted.

Do not create source-specific fixtures that masquerade as legal truth.

Tests may use clearly synthetic countries/values and architecture fixtures only.

## 11. Validation

Before delivery:
- re-read live main/mode/#751/new #748/#856/PR;
- verify no overlapping active writer;
- TASK blob unchanged;
- exact changed-file list;
- merge-base/ahead/behind;
- `git diff --check`;
- focused tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- operating-mode gate;
- working tree clean;
- exact session id/model/effort.

After push:
- inspect exact-head GitHub CI;
- inspect exact-head Vercel Preview;
- if GitHub hosted-runner infrastructure is delayed, report honestly; do not invent PASS.

## 12. Delivery / STOP

Commit + push autonomously to the existing Draft PR.

Delivery must report:
- exact remote head;
- exact changed files;
- TASK blob;
- merge-base / ahead / behind;
- focused test counts;
- full test count;
- typecheck/lint/build;
- store refusal proof;
- v1 compatibility proof;
- CI/Vercel status;
- session/model/effort;
- any unresolved implementation limitation.

Keep PR Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start registry integration, producer/binder, persistence, F8 or any follow-up.
