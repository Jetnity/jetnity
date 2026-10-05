# Official Truth Composition Policy Runtime Foundation 1 — Task

Date: 3 October 2026
Issue: #802
Baseline: `main@daf87a2abe510c3c93d9a9a975b3114aca9c065f`
Branch: `feat/official-truth-composition-policy-runtime-foundation-1`
Logical agent: **Jetnity Official Truth composition policy runtime foundation 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## Purpose

Implement exactly one bounded, dormant, fail-closed runtime foundation for the composition/provenance policy architecture merged by #801.

This slice makes the code-owned composition-policy machinery executable and testable. It must **not** register a real policy or extractor, must **not** call canonical acceptance or persistence, and must **not** implement F8.

Live evidence overrides this task if anything changed after the baseline.

## Binding startup / collision gate

Before material edits:

1. fetch live `origin/main`;
2. read `.jetnity/operating-mode.json`;
3. read Issue #751;
4. read only #748 MATERIAL comments newer than marker `5971622750`;
5. inspect open PRs/writers;
6. confirm #802 / this branch is the only new Official Truth writer;
7. stop and report a collision if main moved from `daf87a2abe510c3c93d9a9a975b3114aca9c065f` before the task-seed branch baseline is established, or if another live Official Truth writer owns overlapping files.

Read at minimum:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
- `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_HANDOFF_2026-10-03.md`
- `lib/readiness/official-truth-same-request-proof-server.ts` and tests
- `lib/readiness/official-truth-same-request-extraction-server.ts` and tests
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and tests
- `lib/readiness/regulierungs-anwendbarkeit.ts` and tests
- `lib/readiness/rule-claims.ts` and relevant tests

Re-prove live facts instead of trusting prose.

## Binding scope

### A. New code-owned composition-policy module

Create:

- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`

The production composition-policy registry must be exactly empty / frozen. No real source family, legal outcome, country rule, predicate body, or government-specific mapping may be registered.

Implement the architecture's source-neutral types and fail-closed functions needed for:

- immutable policy id/version validation;
- pre-HTTP match/preflight;
- duplicate policy detection;
- support/source-id canonicalization;
- policy assignment validation;
- schema-1 citation target validation;
- support-stable atom locator walk;
- phase-B policy/schema binding;
- composed citation/provenance validation;
- module-private/non-JSON execution seal foundation.

A test may use synthetic injected immutable registry fixtures. Tests must never mutate the production registry or turn a test fixture into Production authority.

No mutable global registry.

### B. Exact phase-A protocol

Implement the architecture section 3.1 semantics.

Phase A may use only facts available before HTTP:

- frozen proof `factKind`;
- frozen proof `requirementType`;
- exact sorted support/source-id set;
- proof canonical support URLs;
- code-owned extractor definitions;
- code-owned policy definitions.

It must not use:

- observed response content type;
- parsed/extracted fact;
- applicability schema discovered from a fact;
- caller policy id/version;
- request-body assignments;
- model/plugin/research output.

Required fail-closed properties:

- zero eligible policy/extractor path => `composition_policy_unavailable` at same-request boundary, before `retrieve`;
- URL outside the only candidate allowlist => existing domain/path failure before HTTP;
- multiple URL-eligible current extractor candidates => `ambiguous_policy` before HTTP;
- duplicate current extractor definitions sharing the architecture's forbidden selector identity => load/definition failure `duplicate_extractor_match`;
- duplicate current policies sharing the pre-HTTP key => `duplicate_policy_match`;
- no first-match behavior;
- content type never resolves ambiguity;
- freeze one extractor id/version + policy id/version for the invocation.

### C. Exact phase-B protocol

After fresh server-owned retrieval, verify only against the already frozen selection.

No second extractor search. No second policy search. No switching to make observed bytes fit.

At minimum verify:

- observed content type is allowlisted by the frozen extractor;
- source id/final URL/content hash still match the same-request proof;
- matcher/extractor run only on the frozen definition;
- extracted fact kind matches frozen fact kind;
- applicability schema matches the frozen policy pin.

Schema/content-type failure must return no fact and must not reselect another definition.

### D. Structural atom locator

In `lib/readiness/regulierungs-anwendbarkeit.ts` export only the narrow support-free structural-key helper required by architecture section 4.6.

Requirements:

- do not change current fact schema;
- do not add atom ids/keys/locators to the fact;
- omit `supportVersionIds` at every depth;
- sort `all` / `any` children by the support-free child structural key;
- do not use stored operand order as semantic identity;
- preserve existing normalizer/evaluator behavior;
- do not encode legal predicate prose into the composition-policy registry.

The composition-policy checker must implement the architecture's unique locator / atomic tie-group rules and fail closed for missing, unassigned, duplicate, non-atomic structural ties, ambiguous tie matching, and support mismatch.

### E. Execution-seal foundation

Implement only the architecture's foundation, not the consumer/composer.

The seal must:

- be created only after the frozen policy/extractor binding, phase B, and citation checks succeed;
- use module-private class/symbol identity or equivalent non-JSON structural authority;
- retain the exact fact object reference plus policy id/version and sorted support version ids;
- not be forgeable by a plain request-body object;
- have no exported public constructor;
- not be an acceptance result and not be a bearer token.

A test must prove a plain object / JSON roundtrip does not satisfy the seal identity.

Do **not** add the future autonomous composer.
Do **not** import `regelKandidatAkzeptieren` into the foundation module or same-request extraction module.

### F. Proof-envelope caller authority rejection

In `lib/readiness/official-truth-same-request-proof-server.ts` and its tests, reject caller authority keys before catalog/authority work:

- `policy`
- `policyId`
- `policyVersion`
- `assignments`

Use the architecture's fail-closed caller-authority behavior. Do not widen accepted witness/evidence inputs.

### G. Existing extractor framework compatibility

In `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and tests, make only the narrow architecture-required changes.

Binding requirements:

- production extractor registry remains `Object.freeze([])`;
- a caller-provided non-null `policy` object is refused;
- composition assignments come from server-held code-owned policy selection, never request/model/plugin data;
- duplicate extractor match is detected fail-closed;
- explicit-primary scalar provenance behavior remains unchanged;
- source-neutral generic framework remains one pipeline;
- no real source matcher/parser/URL family is registered.

Do not introduce a second extractor pipeline.

### H. Same-request extraction wiring

In `lib/readiness/official-truth-same-request-extraction-server.ts` and tests:

- preserve canonical same-request proof as the only authority;
- preserve one catalog read / one server reference time / frozen registry;
- for composed quality, run phase A before any retrieval;
- because Production registries remain empty, Production composed input must still return `composition_policy_unavailable` before retrieval;
- test fixtures may inject synthetic code-owned definitions to exercise phase B and the seal without changing Production constants;
- reuse the exact proof support list and URLs;
- no caller retrieval/fact/policy/support list;
- no second catalog read;
- no acceptance call;
- no store call.

Explicit-primary successful behavior and result shape must remain backwards compatible unless a type-only additive field is strictly necessary and proven non-breaking. Prefer no public-shape change.

## Mandatory failure / adversarial tests

Implement every architecture section-10 case that belongs to this foundation, including at minimum:

- caller policy injection before catalog read;
- wrong/missing/non-current policy id/version;
- zero policy/extractor candidate before HTTP;
- multiple candidate ambiguity before HTTP;
- two extractor definitions differing only by content type still rejected/ambiguous before HTTP;
- two policies differing only by applicability-schema pin but sharing pre-HTTP key => duplicate policy match;
- URL allowlist failure before HTTP;
- observed content type mismatch does not reselect;
- schema mismatch does not reselect;
- same-source composition;
- repeated source id / ambiguous structure;
- branch citation empty;
- branch support union incomplete;
- atom cites support outside branch;
- multi-source atom omission;
- nested all/any/not locator;
- support-id permutation stability;
- structurally different atoms keep locators when support ids swap;
- structurally identical atomic tie-group bijection;
- omitted support in tie group;
- non-atomic structural tie;
- locator missing/unassigned/duplicate;
- conflicting / duplicate parsed target value;
- missing assignment;
- policy-version change changes policy provenance identity;
- JSON/plain-object fake seal fails;
- explicit-primary path stays unchanged;
- composed Production path with empty registries calls no retrieval;
- no acceptance/store/F8 import or call.

Use synthetic source ids, synthetic canonical facts and local test doubles only. No live network.

## Explicit forbidden files/actions

Do not edit:

- `lib/readiness/rule-claims.ts` except if a compile-only type import becomes unavoidable; if so STOP and ask Technical Lead instead of changing behavior;
- any store writer or persistence schema;
- `supabase/**`;
- `app/**`;
- Auth/AAL/role/RLS code;
- provider integration code;
- Production configuration;
- CH Candidate Evidence or Official Truth DB/catalog data.

Do not:

- register a real policy;
- register a real extractor;
- call a provider/model/plugin;
- call a live government endpoint;
- raise retrieval body limits;
- add a DB migration;
- change launch/indexing;
- implement F8;
- add the autonomous acceptance composer;
- replace `condition_provenance_ambiguous` in canonical acceptance.

## Allowed file ownership

Material runtime/test edits are limited to:

- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`
- its existing test file
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- its existing test file
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- its existing test file
- this task's required report/handoff/self-review docs

If implementation needs another production file, STOP and report why rather than expanding scope silently.

## Required outputs

Create:

- `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task seed after dispatch.

The report must state:

- exact final head;
- exact main baseline;
- exact changed files;
- exact production registry state;
- how phase A proves no HTTP for empty/ambiguous cases;
- how phase B proves no re-selection;
- how locator identity is support-stable;
- how fake seal objects fail;
- how explicit-primary behavior was preserved;
- how composed Production remains blocked before retrieval;
- confirmation that no acceptance/store/F8/DB/provider/Production gate was crossed.

The self-review must attack bypasses rather than merely restate success.

## Required validation

Before STOP:

- re-fetch live `origin/main`;
- re-read machine mode, #751 and #748 after marker;
- confirm no writer collision;
- `git diff --check`;
- `npm run check:operating-mode`;
- targeted tests for every changed runtime module;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build` or canonical Production build command used by CI;
- inspect final diff for forbidden files/imports/actions.

If any required gate fails, do not claim PASS.

## Delivery / governance

- Keep PR Draft.
- Do not mark Ready.
- Do not merge.
- Do not start a follow-up slice.
- Do not modify global continuity/current-state files; Technical Lead owns #751 and post-merge continuity.
- Report exact final head.
- Report session id/URL.
- Report exact `originalModelName`.
- Agent self-review is never Technical-Lead PASS.
- STOP for independent exact-head review.
