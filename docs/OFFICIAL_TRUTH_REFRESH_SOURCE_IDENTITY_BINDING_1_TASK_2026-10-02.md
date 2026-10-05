# Official Truth Refresh Source Identity Binding 1 — Binding Task

Date: 2 October 2026
Issue: #756
Source audit: merged #749 / F3
Prerequisite: merged #755 / F1 server-held registry boundary
Baseline: `main@ca40e5b2e133c938070a8d13aafcdcb66fa608fd`
Branch: `fix/official-truth-refresh-source-identity-1`
Logical agent: **Jetnity Official Truth refresh source identity binding 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close #749 F3:

A refresh comparison must not treat a different official page or a different registry identity as the same source merely because sourceId, ruleScopeKey and sourceContentHash happen to match.

## Current behavior

`officialTruthAkzeptierteEvidenceAuffrischungVergleichen`:
- re-proves baseline accepted Evidence;
- re-proves baseline retrieved material;
- re-proves refreshed retrieved material;
- checks same sourceId and ruleScopeKey;
- compares content hash;
- does not require equal canonical URL;
- does not require equal registry identity.

## Required behavior

Before content comparison may return `unchanged_source_content` or `changed_source_content`:

1. baseline and refresh must resolve to the exact same canonical URL after the existing URL normalization;
2. baseline and refresh must use the same semantic registry identity;
3. sourceId and ruleScopeKey checks remain;
4. a different canonical page must fail closed with a distinct reason, e.g. `different_official_page`;
5. a different registry identity must fail closed with a distinct reason, e.g. `different_source_registry`;
6. content equality alone can never override either mismatch;
7. `ruleChange` stays `not_asserted`;
8. no Rule truth is inferred from refresh.

## Registry identity

Do not create a second source-registry truth engine.

Use the existing validated `QuellenRegistry` shape and compare its semantic authority content deterministically.

The identity comparison must include, at minimum:
- every registered source id;
- source class;
- publisher name;
- authority name;
- canonical domain set/order as produced by the existing registry builder;
- blockedDomains.

Equivalent registries built independently from the same canonical inputs must compare equal.
Any change to the authority/domain/blocked-domain set must compare different.

Do not use object reference equality.

If a narrow reusable helper belongs in `source-registry.ts`, STOP and report before widening scope. Prefer a module-local comparator for this slice unless duplication would become a second truth rule.

## Mandatory adversarial tests

At minimum prove:

1. same sourceId + same scope + same snapshot hash + different canonical URL => blocked `different_official_page`;
2. same sourceId + same scope + same URL/content + changed sourceClass/publisher/authority/domain/blockedDomains in the refresh registry => blocked `different_source_registry` or an earlier existing fail-closed registry/router reason where that mutation makes the envelope invalid;
3. independently constructed semantically identical registries + same canonical URL => normal unchanged/changed result;
4. equivalent URL normalization still resolves to one canonical URL and passes;
5. different sourceId remains `different_official_source`;
6. different rule scope remains `different_rule_scope`;
7. caller hash/version/Evidence injection remains impossible;
8. one credential option remains one cell;
9. no provider/model/network/storage path is introduced.

## Allowed runtime/test files

- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`

Only if absolutely necessary for test fixtures and no runtime semantics:
- existing narrow refresh-related test helper files.

Do **not** edit:
- server-held registry module from #755;
- source catalog gateway;
- source-registry.ts unless the module-local approach is proven impossible; STOP first;
- app/API/routes;
- migrations/Supabase;
- global continuity files.

Allowed lane docs:
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REFRESH_SOURCE_IDENTITY_BINDING_1_SELF_REVIEW_2026-10-02.md`

## Relationship to #755

#755 closes F1 for the future server-held live/autonomous entry.

This slice closes F3 in the existing pure refresh contract. It does not add a live refresh endpoint and does not apply the source catalog.

A later live/autonomous refresh path must combine the server-held registry boundary with this tightened refresh contract.

## Out of scope

Do not fix F2, F4, F5, F6, F7, F8 or F9.
Do not implement #741.
Do not apply any database migration.
Do not add a route/Server Action.
Do not store anything.
Do not change Auth/RLS/capabilities.
Do not call a provider/model/network.
Do not add cost.
Do not touch #626.

## Validation

- fetch latest main;
- finish 0 behind;
- focused refresh tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- `check:dead`;
- `check:exports`;
- `check:deps`;
- `check:api-schutz`;
- `check:schema-bezug`;
- `git diff --check`;
- operating-mode guard.

Stay Draft.
Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
