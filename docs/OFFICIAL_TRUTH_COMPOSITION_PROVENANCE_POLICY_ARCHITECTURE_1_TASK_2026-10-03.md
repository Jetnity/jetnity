# Official Truth Composition Provenance Policy Architecture 1 — Task

Date: 3 October 2026
Issue: #800
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Logical agent: **Jetnity Official Truth composition provenance policy architecture 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## Purpose

Design, but do not implement, the smallest deterministic **server-owned composition/provenance policy contract** required to safely process `evidenceQuality: 'composed_from_multiple_primary_sources'` in Jetnity's first-party Official Truth chain.

This is the next bounded architecture slice after Merge #799. It is not F8 and it is not a source-specific extractor.

Live evidence wins over every sentence below.

## Binding live baseline

Before writing, fetch live `origin/main`, read live machine mode, Issue #751 and only #748 MATERIAL comments newer than marker `5971622750`. If main or the active-writer state changed, stop and report the collision instead of continuing from this seed.

Read at minimum:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`
5. `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`
6. `docs/OFFICIAL_TRUTH_F8_TRUSTED_FACT_SOURCE_AUDIT_1_REPORT_2026-10-03.md`
7. `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
8. `docs/OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_FRAMEWORK_1_REPORT_2026-10-03.md`
9. `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_REPORT_2026-10-03.md`
10. `docs/OFFICIAL_TRUTH_REGULATORY_ELIGIBILITY_PREDICATE_ARCHITECTURE_1_2026-10-03.md` — especially §12 Composition provenance
11. `docs/OFFICIAL_TRUTH_GOVUK_ETA_SOURCE_FAMILY_AUDIT_2026-10-03.md`
12. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_REPORT_2026-10-03.md`
13. `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
14. `lib/readiness/official-truth-same-request-extraction-server.ts`
15. `lib/readiness/rule-claims.ts`
16. relevant current tests for those modules.

Do not assume the earlier architecture prose is already a complete composition policy. Prove what is reusable and what remains unspecified.

## Current hard facts to re-prove

The task seed expects, but does not grant, these observations:

- production extractor registry is empty;
- same-request extraction blocks composed quality as `composition_policy_unavailable` before HTTP;
- the extractor framework already has a code-owned policy shape with `policyId`, `policyVersion`, and field assignments;
- schema-1 branched acceptance currently blocks composed provenance as `condition_provenance_ambiguous`;
- same-source composition remains forbidden;
- all schema-1 facts remain non-persistable at the current flat store boundary;
- F8 remains open and must not be implemented by this slice;
- Production Official Truth DB/catalog apply remains a Product-Owner gate.

If live code disproves any item, document the live truth instead.

## Required architecture questions

### 1. Policy authority and versioning

Specify the only acceptable source of composition policy authority.

At minimum decide:
- whether the policy is a pure code-owned immutable registry/definition;
- exact `policyId` and `policyVersion` semantics;
- whether a caller, model, plugin, request body, stored review packet, or research note may ever select or mutate the policy;
- how zero, one, or multiple matching policies fail or select;
- what change requires a new policy version.

No caller-provided policy authority is allowed.

### 2. Policy scope and matching

Define the deterministic match key without choosing a legal result.

Consider at minimum:
- fact kind;
- exact source-id set;
- source family / extractor definition;
- schema family;
- requirement type;
- applicability schema version;
- optional exact source URL/path constraints if already owned by the extractor definition.

Do not make country-specific legal truth a generic default.

### 3. Field / branch / atom provenance

For a composed `RegelFakt`, specify exact provenance rules for:
- top-level fact fields that are not applicability branches;
- each branch outcome;
- each branch condition;
- each atomic predicate;
- `otherwise`;
- visa option fields where relevant.

Reconcile the live extractor framework's field-path assignments with the schema-1 rules already accepted in §12 of the predicate architecture.

Binding safety direction:
- every cited version id must belong to the re-proven accepted Evidence support set;
- each composed branch cites a non-empty subset of claim supports;
- branch citation union equals claim supports when the policy says all supports jointly make the complete fact;
- an atom may cite only a subset of its branch;
- no implicit inheritance across two or more source ids;
- if a value cannot be assigned to exact source support(s), fail closed rather than infer.

Determine precisely where these are generic invariants versus policy-specific assignments.

### 4. Multi-source completeness

Define what proves that multiple official source items together form **one complete fact** rather than unrelated or contradictory fragments.

The architecture must distinguish:
- complementary sources;
- duplicate corroboration;
- conflicting sources;
- stale/mixed-epoch sources;
- one source stating an exception while another states a general rule;
- one source only listing nationality applicability while another defines exemptions.

Do not encode GOV.UK ETA outcomes in this generic architecture. Use it only as an adversarial example to prove the contract can represent a National-List + Appendix style composition without inventing semantics.

### 5. Same-request trust binding

Specify how the policy is selected and executed only after:
- canonical same-request proof;
- one frozen server-held registry truth;
- re-proven accepted Evidence;
- current freshness at the server instant;
- fresh server-owned retrieval for every support;
- exact source/url/hash/version binding;
- code-selected extractor definition.

No second catalog read, caller registry, caller Evidence, caller retrieval, caller support list, caller fact, caller policy or bearer witness may become authority.

### 6. Extractor framework compatibility

Determine the smallest later runtime seam.

Do not implement it.

Specify:
- whether `OfficialTruthExtractorPolitik` is sufficient or must be narrowly extended;
- how `requiredFieldPaths` and `assignments` bind complete fact fields, branch outcomes and atomic predicates;
- how policy assignment reaches extractor output provenance;
- how `policy_required`, `policy_version_mismatch`, `policy_field_unassigned`, `conflicting_value`, `ambiguous_structure`, `same_source_composition`, and new errors if truly required should behave;
- whether the current generic extractor framework can remain source-neutral.

Prefer the smallest safe extension. Do not duplicate the extractor framework.

### 7. Acceptance compatibility

The future composed fact must still enter only through `regelKandidatAkzeptieren`.

Specify:
- how extractor provenance and schema-1 embedded support citations agree before acceptance;
- how `condition_provenance_ambiguous` may later become a successful composed case only under a code-owned policy;
- which checks remain defense in depth inside `regelKandidatAkzeptieren`;
- why the composition policy is not a second acceptance constructor.

Do not implement F8.

### 8. Provenance record inputs

A later autonomous provenance record is a separate slice.

Define only the minimum non-personal identifiers that a future record would need from this policy execution, such as:
- extractor id/version;
- policy id/version;
- reviewPacketKey;
- support version ids;
- source content hashes or stable evidence linkage, if appropriate;
- rule-applicability fingerprint, if appropriate.

Do not select retention duration. Do not add a migration. Do not persist raw page text, review packet bodies, proposal/model output, or traveller context.

### 9. Failure / adversarial matrix

Specify mandatory later tests for at least:
- caller policy injection;
- model/plugin policy injection;
- wrong policy id/version;
- zero/multiple matching policies;
- same-source composition;
- support id not in accepted Evidence;
- branch without citations;
- branch union incomplete;
- atom cites support outside branch;
- multi-source atom with omitted citation;
- source changes after Evidence / hash mismatch;
- mixed freshness / stale support;
- conflicting source values;
- duplicate but non-complementary source values;
- missing field assignment;
- source-family/schema mismatch;
- order permutation producing stable canonical result;
- policy-version change changing provenance identity;
- schema-1 explicit-primary path remains unchanged;
- composed output still blocked by store persistence boundary;
- no F8 acceptance/store call.

### 10. First runtime-slice recommendation

At the end, classify only the **composition policy foundation**, not F8, as one of:

- `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`
- `REQUIRES_NARROW_ARCHITECTURE_PREREQUISITE`
- `BLOCKED_BY_PRODUCT_OWNER_GATE`
- `BLOCKED_BY_MISSING_SOURCE_SEMANTICS`

If ready, name exact file ownership for one later bounded runtime slice and prove it does not cross a Product-Owner gate.

If blocked, identify the exact missing proof. Do not solve it by inventing legal semantics.

## Required outputs

Create only:

- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task file.

Do not edit:
- `.jetnity/operating-mode.json`;
- `JETNITY_START_HERE.md`;
- `JETNITY_HANDOFF.md`;
- `docs/ACTIVE_WORK_STATUS.md`;
- Issue #751;
- any runtime, test, migration, app, component, route, provider or configuration file.

The Technical Lead owns global current-state updates.

## Hard boundaries

No runtime/test implementation.
No extractor registration.
No source-specific legal mapping.
No F8.
No acceptance call.
No store/persistence call.
No Supabase/migration/RLS/Auth change.
No remote database access required.
No provider/model/plugin/network call required for the architecture.
No secrets or new cost.
No #626 work.
No CH import or CH-11.
No public launch/indexing.
No Product-Owner gate crossing.

## Validation and STOP

Before STOP:
- re-fetch `origin/main`;
- finish 0 behind or stop and report why rebasing would be unsafe;
- verify changed files are only the four required outputs plus this pre-existing task seed;
- `git diff --check`;
- `npm run check:operating-mode` or the canonical operating-mode guard;
- report exact branch head;
- report session URL/id and `originalModelName`;
- produce report, handoff and adversarial self-review;
- remain Draft;
- do not mark Ready;
- do not merge;
- do not start a follow-up slice.

STOP for independent Technical-Lead exact-head review.
