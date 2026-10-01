# Official Truth Research Execution Allowlist Plan 1 — Binding Task

Date: 1 October 2026
Issue: #706
Baseline: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`
Logical agent: **Jetnity Official Truth research execution allowlist plan 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Build the final pure pre-fetch planning layer.

Input:
- an existing #702 `OfficialTruthRechercheAnfrage`;
- current Source Registry;
- current source descriptors.

The implementation must call/reuse #705 routing and may only produce a deterministic allowlist plan for already-registered official authorities.

## Required output

Equivalent semantics:
- `ready` with request identity and sorted official source plans;
- each source plan has:
  - `sourceId`;
  - registered hostname allowlist only;
- `no_eligible_official_source`;
- `blocked_invalid`.

No full URLs, URL paths, query strings, page lists or discovery suggestions.

## Hard truth

- `official_authority` only.
- `licensed_evidence_provider` never appears in the plan.
- no source/provider ranking;
- no default source;
- no passport/citizenship ranking;
- source/domain order is deterministic stability only.
- destination/transit/citizenship/document/residence/validity remain the exact #702/#705 cell.
- no eligible source remains unknown/no-source; never `not_required`.

## Integrity

Do not trust a caller-built #705 decision. Re-run/reuse #705 from the request + registry + descriptors.

For every resulting sourceId:
- source must exist exactly once in the Registry;
- sourceClass must be `official_authority`;
- domains must come only from that registry record;
- blocked domains must never be emitted;
- output domains must be normalized existing registry hostnames.

Do not call `quellenUrlAufloesen`; this stage has no URL.

## No execution

No:
- fetch/browser/search;
- OpenAI/model;
- provider adapter;
- cron/queue;
- source registration/catalog mutation;
- Candidate Evidence;
- Evidence/Rule acceptance;
- store/catalog RPC;
- Supabase/DB/Auth/RLS;
- UI/public API.

`requirementsProviderAus()` remains null.

## Tests

Synthetic `.example` sources only.

Prove:
1. matching official source -> ready with sourceId + domains;
2. two matching officials -> deterministic ordering;
3. licensed-only -> no eligible plan;
4. mixed -> licensed omitted;
5. blocked/tampered registry plan -> blocked;
6. source with multiple registered domains preserves normalized sorted domains;
7. request tampering -> blocked;
8. no URL/path/query/fetch/model/DB fields/calls;
9. no `not_required`;
10. input is not mutated.

Run focused tests, full npm test, typecheck, lint, build, hygiene, git diff --check.

## Ownership

Allowed:
- `lib/readiness/official-truth-research-execution-plan.ts`
- `lib/readiness/official-truth-research-execution-plan.test.ts`
- `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_*`

Read-only:
- #702 request;
- #705 routing;
- source registry/router.

Forbidden:
- modifying any of those existing runtime files;
- Lane B retrieved-material files;
- Supabase/migrations;
- app/components;
- package/lock;
- global continuity.

If existing contracts cannot support this without edits, STOP and report.

Before final push integrate then-current main, remain 0 behind, rerun all gates.

Stay Draft. Do not Ready. Do not merge. Do not start actual research execution.
STOP for independent TL review.
