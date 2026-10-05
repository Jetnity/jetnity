# Official Truth GOV.UK ETA Semantic Reconciliation 2 — Task

Date: 5 October 2026
Issue: #838
Status: **BINDING / DOCS-ONLY RECONCILIATION / NO EXTRACTOR / NO DB / NO F8**

## 1. Baseline

- main: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`
- mode: `NORMAL`
- Development v2 hardening apply is complete and read-only verified
- Production Official Truth v2 remains absent
- Development catalog contains only GOV.UK ETA National List identity; Evidence/Rule rows remain 0
- #791 result: `NO_SOURCE_FAMILY_PROVEN_YET`
- #793/#795/#799/#801/#803 and later content-identity work landed after #791
- no active Official Truth implementation writer at dispatch
- Workspace #836/#837 runs in parallel and is file-disjoint

Re-read live main/mode/#751/#748/open PRs before audit. Live evidence wins.

## 2. Writer

Logical writer: **Jetnity Official Truth GOV.UK ETA semantic reconciliation 2**, Generation 1.

Execution: **Codex Desktop**
Required model: **GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No runtime edits.

## 3. Goal

Re-run the #791 ETA source-family decision against today's architecture.

Do **not** assume the old reasons are still current.

Answer:
1. Which original #791 semantic blockers are now resolved?
2. Which remain?
3. Can the current applicability model represent each relevant ETA exemption without inventing facts?
4. Can the current trusted runtime obtain/prove those context facts?
5. Can National List + Appendix ETA be combined under today's content-item/composition model?
6. Can the resulting branched applicability fact be persisted today?
7. Which content identity registrations/profiles are still missing?
8. What is the exact smallest ordered implementation sequence before a real extractor can be selected?
9. Is a real GOV.UK ETA extractor now selectable, or does the result remain `NO_SOURCE_FAMILY_PROVEN_YET`?

## 4. Mandatory current code to read

At minimum:
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-composition-policy-registry.ts`
- composition-policy tests/current registry
- same-request extraction/proof wiring
- trusted-fact extractor registry
- content identity/catalog code and current GOV.UK profile
- source identity granularity reconciliation
- CTA region-pin audit/current region-pin registry
- current Development registration receipts and #835 hardening docs
- #791 audit/task/report/self-review
- #793/#795/#797/#799/#801/#803 reports/handoffs

## 5. Reconcile every #791 exemption

For each current Appendix ETA exemption/qualification, map it to the **actual current predicate/context contract**, or mark it unrepresentable.

At minimum:

### Existing UK permission
- valid entry clearance;
- permission to enter or stay.

Check current:
- `destination_permission`;
- permission classes;
- validity semantics;
- permitted provenance;
- whether **absence/non-validity** can be proven safely rather than inferred.

### Ireland / CTA
- lawful residence in Republic of Ireland;
- entitlement/departure condition;
- journey origin from elsewhere in Common Travel Area.

Check:
- `lawful_residence`;
- `journey_origin`;
- region predicate support;
- current region-pin registry/authority;
- whether route/trip context can prove the exact origin fact;
- do not substitute residence country for lawful entitlement.

### Nationality statuses
- British Overseas Territory Citizen;
- British National (Overseas).

Check:
- `nationality_status`;
- holding/not-held semantics;
- whether absence can be asserted/proven;
- no ISO-country substitution.

### School-party exemptions
Check:
- age_on_travel_date;
- institution_status;
- group_size;
- traveller included;
- authority confirmation;
- visitor purpose;
- current provenance restrictions.

### Passport qualification
Check Appendix's "national passport establishing identity/nationality" condition:
- document type;
- document class;
- issuing country;
- explicit credential↔citizenship link.

**Do not equate `ordinary` with "national passport" unless current semantics actually prove that equivalence.**
Null related citizenship remains unknown.

### Other current ETA exemptions
Re-read current audited Appendix semantics from repository evidence and include every exemption still relevant to a Swiss traveller.

No web refresh is required unless the binding repository evidence is insufficient; if external freshness becomes necessary, STOP and report the exact need rather than silently researching.

## 6. Composition reconciliation

Reconcile #791's two-content-item problem against today's architecture.

Check:
- National List and Appendix ETA are distinct GOV.UK content IDs;
- same authority is now allowed or not under current distinct-content-item composition rules;
- whether `composed_from_multiple_primary_sources` naming now semantically means distinct content items;
- current composition-policy registry state;
- whether a policy exists that specifically authorizes this pair/fact/schema;
- whether same-request retrieval can fetch both proof-bound content items;
- exact support/provenance assignment requirements;
- whether Content Identity registration is required for Appendix ETA before any composition.

Do not activate a policy.

## 7. Persistence reconciliation

Check current store behavior for schema-1 branched applicability.

Prove whether:
- parser/evaluator accepts a complete branched ETA fact in memory;
- current store still returns `applicability_not_persistable`;
- current DB schema can or cannot preserve branch predicates/outcomes/support provenance losslessly.

If persistence is blocked, specify the **minimal persistence schema/runtime slice** required. Do not design a second acceptance constructor.

## 8. Content identity prerequisites

Current Development has:
- source `govuk`;
- item `eta-national-list`;
- representation `content-api-en`;
- profile `govuk-eta-national-list-content-api-en` v1.

Audit what Appendix ETA would need:
- proposed content item id;
- exact current GOV.UK content_id already recorded by repository audit;
- representation id;
- URL;
- schema/locale/media type;
- whether the existing National List identity verifier can be reused safely or a separate profile is required;
- publisher/authority pins;
- whether a new registration audit/profile slice must precede DB registration.

Do not register anything.

## 9. Context provenance / privacy

For every traveller-context fact needed by an ETA applicability evaluation:
- state allowed provenance(s);
- state whether current Jetnity account/trip data can currently supply it;
- state whether explicit user assertion is permitted;
- distinguish unknown from false;
- do not store passport numbers, permit numbers, school names, DOB, MRZ, scans, biometrics or health data;
- preserve global Official Truth as non-personal.

Do not propose a traveller-context fingerprint if current architecture forbids it.

## 10. Required output

Create one architecture/audit record with a decision matrix.

Final classification exactly one of:

- `GOVUK_ETA_SEMANTIC_CHAIN_READY_FOR_EXTRACTOR_IMPLEMENTATION`
- `GOVUK_ETA_SEMANTIC_CHAIN_NOT_READY`

If NOT READY:
- list blockers P1/P2;
- give exact ordered next slices;
- each slice must have one bounded purpose;
- identify Product-Owner gates separately from ungated code/docs work.

If READY:
- specify exact source-family/content-item set, extractor schema, applicability fact shape, composition policy identity and support requirements;
- still do not implement it.

## 11. Expected hard questions

Explicitly answer:
- Are all #791 missing predicates now present?
- Does "predicate exists" mean Jetnity can prove the corresponding traveller fact today?
- Can a user assertion safely prove **not holding** UK permission/status?
- Can route context prove CTA journey origin without inference?
- Is a region pin currently active for CTA?
- Is Appendix ETA content identity registered?
- Is the composition-policy registry non-empty for this case?
- Does current persistence preserve branched applicability?
- Can a complete rule be shown in Workspace today without lying?
- What must happen before F8?

## 12. Allowed files

Docs only:
- immutable TASK
- one reconciliation architecture/audit document
- REPORT
- HANDOFF
- SELF_REVIEW

No runtime/test/migration changes.

If the audit discovers a code defect requiring proof, document it; do not fix it.

## 13. Non-scope

Absolutely no:
- extractor;
- profile activation;
- Appendix registration;
- DB migration/apply;
- Evidence/Rule write;
- composition-policy activation;
- region-pin activation;
- traveller-context runtime wiring;
- Workspace wiring;
- F8;
- Production;
- provider/model call;
- launch;
- follow-up slice.

## 14. Validation / delivery

- git diff --check
- npm run check:operating-mode
- docs/hygiene checks required by repo
- re-read main/mode/#751/#748/PR before delivery
- task seed unchanged
- exact changed files, merge-base/ahead/behind, final head, model evidence
- no hosted DB/Production mutation

Create REPORT/HANDOFF/SELF_REVIEW. Keep Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready/merge/start next implementation.
