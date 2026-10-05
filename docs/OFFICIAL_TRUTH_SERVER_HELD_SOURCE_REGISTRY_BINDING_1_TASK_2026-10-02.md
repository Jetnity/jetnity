# Official Truth Server-Held Source Registry Binding 1 — Binding Task

Date: 2 October 2026
Issue: #753
Source audit: merged #749 / F1 primary, with F2/F3 dependency awareness
Baseline: `main@ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d`
Branch: `fix/official-truth-server-held-registry-1`
Logical agent: **Jetnity Official Truth server-held source registry binding 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Close the first confirmed P1 blocker from #749:

A caller-shaped registry must never be able to label an arbitrary source/domain as `official_authority` for a path that could later feed Jetnity Official Truth or Copilot Pro autonomous promotion.

## Current truth

The existing pure contracts accept registry objects from their input envelopes. This is useful for deterministic testing, but not sufficient as a server authority boundary.

The repository already contains the dormant server-only catalog gateway:
`lib/readiness/official-truth-source-catalog-server.ts`

Its RPC remains LOCAL/UNAPPLIED. This slice must **not** apply it remotely.

## Target architecture

Add the smallest server-only trust boundary for the future Official Truth live/autonomous path.

Required behavior:
1. server boundary loads the Source Registry through the existing `quellenKatalogLesen()` gateway or an injected `OfficialTruthSourceCatalogTransport`;
2. caller input to that boundary contains no authoritative registry field;
3. the trusted registry is inserted internally by the server boundary before existing deterministic retrieval/evidence/review functions run;
4. catalog unavailable/invalid => fail closed;
5. a caller attempting to supply/override registry/sourceClass/domains/blockedDomains as authority is rejected or ignored as non-authoritative input; prefer exact-key rejection where current contracts use exact keys;
6. fake source/domain attack from #749 (for example `not-a-government.example` labelled official by caller) must fail when not present in the server-held catalog;
7. an official source present in the injected catalog must still pass the existing source-registry/router rules;
8. no second source-registry truth engine: reuse `quellenRegistryErstellen`, existing router and existing catalog gateway;
9. no provider/model/network access in tests; use injected transport;
10. one regulatory cell / one credential option semantics remain unchanged;
11. `requirementsProviderAus() === null` remains unchanged.

## Scope choice

The preferred implementation is a **server-only adapter/wrapper**, not weakening/replacing existing pure deterministic functions.

It may add a new server-only module that:
- accepts a registry-free input envelope/bundle;
- loads the catalog once through the existing gateway;
- constructs the existing internal envelope with the trusted registry;
- calls the existing retrieval / accepted-evidence / review-packet chain as appropriate.

The resulting wrapper must be sufficient for the future #741 gate to use without accepting a caller registry.

Do not claim F1 is fully closed if only a helper exists but there is no explicit contract that future live/autonomous entry must use the server-held wrapper. Encode that contract in tests/docs.

## Expected runtime/test ownership

Allowed runtime files:
- new server-only readiness module(s) narrowly required for this boundary;
- `lib/readiness/official-truth-source-catalog-server.ts` only if a narrow reusable read helper/type is genuinely required;
- existing Official Truth readiness module(s) only if necessary to expose safe internal calls without changing their truth semantics.

Allowed tests:
- new focused server-held-registry test file(s);
- existing Official Truth tests only if required by a signature/refactor actually made.

Allowed lane docs:
- `docs/OFFICIAL_TRUTH_SERVER_HELD_SOURCE_REGISTRY_BINDING_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_HELD_SOURCE_REGISTRY_BINDING_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_SERVER_HELD_SOURCE_REGISTRY_BINDING_1_SELF_REVIEW_2026-10-02.md`

Do not edit global startup files in this slice.
Do not edit Guardian/Chief-of-Staff files.
Do not edit migration files.

## Mandatory adversarial tests

At minimum:
- fake caller registry containing `not-a-government.example` as `official_authority` cannot make that URL eligible;
- input with an unexpected authoritative `registry` field is rejected at the server boundary;
- trusted injected catalog containing only `real-government.example` accepts that source under existing rules;
- unknown source id fails;
- catalog not configured/failure fails closed;
- licensed provider never becomes official authority merely via caller data;
- no source-catalog registration/write operation is called;
- no live Supabase client/network is used in tests;
- the trusted registry is the one actually used by downstream proof;
- current scope/key/credential-option semantics remain unchanged.

## Relationship to other #749 findings

This slice closes only F1 and creates the prerequisite for F3/F5/F7/F8/F9 remediation.

Do not fix:
- refresh URL equality (F3);
- validity/freshness/fingerprint coverage (F5/F7);
- break-glass/live route guard (F9);
- acceptance endpoint or store wiring (F8);
- snapshot retention (F4);
- review-suggestion consistency (F6).

## Hard boundaries

No Development/Production Supabase apply.
No migration.
No RLS/role/Auth/capability mutation.
No Production DB change.
No endpoint/API route/Server Action.
No trusted Rule write.
No provider/model call.
No external network call.
No secret/env mutation.
No cost.
No public launch/indexing.
Do not touch #626.
Do not implement #741.

## Validation

- read current main and relevant #749 audit;
- finish 0 behind;
- focused adversarial tests;
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
- operating-mode guard;
- no remote Supabase access.

Stay Draft.
Do not Ready.
Do not merge.
Do not start F3 or another follow-up.
STOP for independent Technical-Lead exact-head review.
