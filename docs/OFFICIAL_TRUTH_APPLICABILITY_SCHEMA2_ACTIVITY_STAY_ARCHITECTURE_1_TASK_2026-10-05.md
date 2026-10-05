# Official Truth applicability schema 2 — activity/stay qualification architecture 1 — Task

Date: 5 October 2026
Issue: #850
Status: **BINDING / DOCS-ONLY ARCHITECTURE / NO RUNTIME / NO DB / NO F8**

## 1. Baseline

Repository: `Jetnity/jetnity`
Baseline: `main@2f27956cc9fd4289d30f258a5ee8eeaaa60aafec`
Machine mode at dispatch: `NORMAL`

Relevant merged evidence:
- #845 GOV.UK ETA clause-complete audit → `ETA_SEMANTIC_CONTRACT_STILL_NOT_READY`
- #849 JP first-pilot source audit → `JP_FIRST_PILOT_SOURCE_FAMILY_NOT_READY`
- #847 B01 Account OfficialEvaluation wiring → integrated, provider still null/fail-closed
- existing applicability v1, rule-claims, temporal, same-request extraction, composition and store foundations

## 2. Writer

Logical writer:
**Jetnity Official Truth applicability schema 2 activity/stay architecture 1**

Generation: **1**

Execution:
**Codex Desktop — new session**

Required model:
`gpt-6-astra` / `xhigh`.

Standing #751 autonomous execution rule applies through commit+push.
Keep Draft. Never Ready/merge. STOP after delivery.

## 3. Goal

Design the **smallest source-neutral next version** of Jetnity's regulatory applicability/context contract required to represent currently observed official-rule semantics losslessly.

Do not design a Japan-only or UK-only DSL.

The architecture must explicitly resolve whether and how to represent:

### A. Activity / remuneration qualification
Current problem:
`travelPurpose` plus existing work/business labels cannot safely represent:
- no remunerative activity;
- no income-earning activity;
- no profit-making business operation;
- permission for business contacts that are still non-remunerative.

Determine the minimal source-neutral semantic atom(s), including:
- canonical names/values;
- truth domain;
- unknown/missing behavior;
- whether facts come from user assertion, trip context, account/traveller profile, or remain unsupported;
- whether negation is explicit or derived;
- how contradictory assertions fail closed.

No free-text condition blob.

### B. Planned stay / duration qualification
Current problem:
official rules may condition an exemption on a stay/duration threshold.

Determine:
- whether planned stay belongs in applicability context at all;
- if yes, exact source-neutral representation;
- whether to represent date interval, duration quantity, or both;
- unit preservation;
- inclusive/exclusive boundary rules;
- what can be derived from Trip start/end and what must not be inferred;
- how unknown/open-ended travel dates behave;
- no day↔month conversion unless separately explicit.

Do not conflate:
- intended trip duration;
- landing permission grant;
- visa validity;
- maximum extension;
- permission expiry.

### C. Presented national passport ↔ citizenship linkage
Current problem:
a rule may require a national passport of the relevant citizenship; issuer alone is not citizenship.

Determine whether existing credential-option linkage is sufficient.
If not, define the smallest additional semantic needed.

Must distinguish:
- citizenship;
- issuing country;
- related citizenship;
- document class;
- national passport / ordinary national passport;
- emergency/refugee/official/diplomatic documents.

Do not default document class or linkage.

### D. Permission-expiry / reference-time semantics
Determine whether current `OfficialTemporalAnchor` is sufficient for official deadlines such as “apply before permitted period expires”.

If not, define the narrowest source-neutral event/reference model.

Do not turn a later permission event into a pre-travel requirement condition unless the source actually does so.

### E. Versioning / compatibility
Decide:
- whether this truly requires applicability schema 2;
- exact version identifier/domain;
- v1↔v2 compatibility boundary;
- parser/evaluator behavior for unknown versions;
- fingerprint impact;
- extractor/policy pins;
- evidence/store behavior;
- whether v1 accepted/dormant material remains readable but not reinterpreted.

No migration implementation.

## 4. Required code/doc reads

Read current live implementations, at minimum:
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- its tests
- `lib/readiness/rule-claims.ts`
- `lib/readiness/temporal.ts`
- `lib/readiness/traveller-kontext.ts`
- `lib/readiness/provider.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-store-server.ts`
- #845/#849 audit docs
- Issue #294 binding target
- Issue #741 only as gate context, not implementation permission

Live code wins over historical architecture.

## 5. Decision output

End with exactly one:

### `APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_READY`

Only if a bounded, source-neutral, testable, backwards-safe contract is fully specified.

OR:

### `APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_NOT_READY`

List exact unresolved architecture evidence needed.

A READY architecture authorizes only later TL consideration of a separately versioned dormant implementation slice.

## 6. Required architecture artifacts

Specify at least:
- proposed exact types/fields/enums;
- parser bounds and unknown handling;
- three-valued evaluation semantics;
- contradiction behavior;
- context provenance/authority boundary;
- version/fingerprint impact;
- extractor/policy/store implications;
- migration/non-migration statement;
- test matrix;
- adversarial cases;
- exact files a later implementation would be allowed to touch;
- what remains deliberately unsupported.

Mark all proposed names as **PROPOSAL / NOT IMPLEMENTED**.

## 7. Hard prohibitions

Absolutely no:
- runtime/code/test changes
- schema implementation
- DB/Supabase/migration
- Production
- source/profile registration
- extractor/policy activation
- accepted Evidence
- Rule acceptance
- F8
- CH import/CH-11
- Trip Workspace/B01 change
- paid/provider/model API integration
- Ready/Merge
- follow-up slice

## 8. Allowed files

Immutable TASK:
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_TASK_2026-10-05.md`

Delivery only:
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_SELF_REVIEW_2026-10-05.md`

No other files.

## 9. Parallel guard

A separate JP identity/retrieval audit may run in parallel.
Before work and before push:
- re-read main/mode/#751/#748/this issue/PR;
- inspect the other writer's current paths;
- prove zero path overlap;
- STOP on overlap.

## 10. Validation / STOP

Before push:
- immutable TASK blob;
- exact five-file diff;
- merge-base/ahead/behind;
- no writer collision;
- `git diff --check`;
- operating-mode gate;
- exact session/model/effort.

Commit + push autonomously.
Read exact-head CI/Vercel if triggered.

Then STOP for independent Technical-Lead exact-head review.

Do not Ready.
Do not merge.
Do not start implementation.
