# GOV.UK Content API Identity Verifier 1 — Scope Amendment 1

Date: 4 October 2026
Issue: #818
Draft PR: #819
Baseline main: `f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`
Original immutable task:
`docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_TASK_2026-10-04.md`
Original dispatch head:
`2c5cce9a596e85cdb72965a92127312cd421263f`
Blocked implementation head:
`ee48c674d7f531e6ed25706bc0a0d9887daa6728`
Logical writer: **same Jetnity GOV.UK Content API identity verifier 1**
Generation: **1**
Execution environment: **same Codex Desktop session**
Required model: **GPT-6 Astra — Sehr hoch**

## Reason

The implementation correctly reuses the existing
`ContentIdentityProfileDefinition` through a type-only import from:

`lib/readiness/official-truth-content-identity.ts`

The existing R1 test:

`lib/readiness/official-truth-content-identity.test.ts`

contains a repository-wide closed-list guard named:

`repository search pins the finite R2 production importers`

That guard intentionally counts type-only imports and therefore detects the new dormant verifier module as one additional production importer.

The new importer is expected and reviewed:
- it imports only the existing identity contract type;
- it is not imported by any non-test production runtime;
- it does not activate the profile;
- the production profile registry remains exactly empty/frozen.

The blocked head's CI fails only on that closed-list assertion. Vercel Preview is READY and the new focused verifier/parser tests pass.

## Authorized scope amendment

Authorize exactly one additional existing test file:

`lib/readiness/official-truth-content-identity.test.ts`

No other existing production/test/config/schema file is authorized.

The final allowed changed-file count becomes exactly **8**:

1. immutable original task;
2. this scope-amendment document;
3. new verifier/parser module;
4. new focused verifier/parser test;
5. existing R1 content-identity test;
6. report;
7. handoff;
8. self-review.

## Required correction

In the existing test:

`repository search pins the finite R2 production importers`

add exactly:

`lib/readiness/official-truth-govuk-content-api-identity-profile.ts`

to the expected sorted importer list in the correct lexical position.

Do not:
- weaken the repository scan;
- exclude type-only imports;
- add wildcard/prefix matching;
- stop checking exact paths;
- change any other R1 test expectation unless independently required by this exact importer addition;
- edit `official-truth-content-identity.ts`;
- import/register the new profile in production runtime.

The test must continue to prove the complete exact importer set.

## Original task remains binding

All original hard boundaries remain:

- production identity-profile registry stays EMPTY/frozen;
- zero non-test production importers of the new verifier module;
- no source/content/representation/profile registration;
- no Supabase/DB mutation;
- no migration;
- no source/catalog/store/retrieval edit;
- no extractor/composition policy/region pin/Rule fact;
- no schema-1 persistence;
- no F8;
- no route/app/provider/traveller changes;
- no new dependency;
- no live network in tests.

## Resume and validation

Same Codex session / same logical writer / same Generation 1 must:

1. fetch this amendment commit;
2. re-read original task + this amendment;
3. re-read live main/mode/#751/#748;
4. confirm no collision;
5. make only the one R1 importer-list correction above;
6. rerun:
   - new verifier/parser tests;
   - `official-truth-content-identity.test.ts`;
   - affected R1/R2 tests;
   - full npm test;
   - typecheck;
   - lint;
   - Production build;
   - operating-mode guard;
   - API/schema/dead/export/dependency hygiene;
   - git diff --check;
   - exact 8-file scope;
   - task seed byte equality;
   - production registry-empty proof;
   - zero non-test importer proof;
7. update report/handoff/self-review to reflect the authorized correction and final exact-head results;
8. remain Draft;
9. do not Ready/merge;
10. STOP for independent Technical-Lead exact-head review.

If any further outside-scope file becomes required, STOP again.
