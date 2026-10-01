# Official Truth Research Request Source-Routing Bridge 1 — Binding Task

Date: 1 October 2026
Issue: #704
Baseline: `main@0e62a532831e0711aad3bde645b239edea674705`
Logical agent: **Jetnity Official Truth research source-routing bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Connect the merged deterministic Official Truth research-request contract to the existing Source Registry / Source Router foundation.

This slice still does **not** execute research.

It answers only:

> For this exact research request/canonical rule-scope cell, which already-registered **official_authority** source IDs are eligible?

If none are eligible, the answer remains fail-closed and unknown.

## Read and reuse

Read current:
- `lib/readiness/official-truth-research-request.ts`
- `lib/readiness/source-router.ts`
- `lib/readiness/source-registry.ts`
- `lib/readiness/evidence.ts`
- current Official Truth architecture.

Do not create a second source router or second research scope.

## A. Input

Input must be an already-built `OfficialTruthRechercheAnfrage`.

Do not accept:
- a raw traveller object;
- user/account/trip identifiers;
- raw passport/document values;
- a model-created scope;
- arbitrary URLs.

The bridge must consume the exact canonical request scope already validated by #702.

## B. Official-authority-only routing

The research request fixes:
`evidenceClass: official_authority`.

Therefore:
- only registered sources with `sourceClass === 'official_authority'` may be eligible;
- `licensed_evidence_provider` must be ignored/rejected for this primary Official Truth routing;
- a registry containing only licensed providers returns no eligible official authority source;
- mixed registries may return only the official authorities whose coverage matches.

No commercial provider may become “official” through routing.

## C. Reuse existing coverage semantics

Do not reimplement source coverage logic.

Reuse `quellenRouten` / existing source-router semantics so:
- destination stays destination;
- transit stays transit;
- citizenship remains exact/full-set semantics;
- explicit document option remains exact;
- issuing country is not citizenship;
- residence remains separate;
- `not_applicable` / `independent` / `exact` modes remain;
- missing coverage remains no-source/unknown;
- no empty-list wildcard;
- no best passport/source ranking.

## D. Output

Return a small deterministic route decision, e.g. equivalent to:

- `eligible_official_sources` with sorted unique official source IDs;
- `no_eligible_official_source`;
- `blocked_invalid` if the request or source plan is structurally inconsistent.

Do not return:
- Official Result;
- visa outcome;
- `required` / `not_required`;
- Candidate Evidence;
- URLs to fetch;
- provider choice/ranking;
- timestamps/queue ids.

Source ordering is deterministic stability only, never preference.

## E. Scope/key consistency

Prove:
- the request's `ruleScopeKey` still corresponds to its embedded canonical scope;
- mismatched/tampered request is blocked;
- fact kind/research reason do not change source coverage but remain part of the request identity;
- no second scope constructor is invented.

If checking the request key requires shared logic that is currently private and cannot be reused safely without editing #702's file, STOP and report rather than widening scope.

## F. No execution

Runtime file must contain no:
- `fetch`;
- browser/search;
- OpenAI/model import;
- provider adapter;
- Supabase client;
- SQL/RPC;
- source registration;
- source catalog mutation;
- Candidate Evidence constructor;
- accepted-store writer;
- cron/queue.

`requirementsProviderAus()` remains null.

## G. Synthetic tests

Use synthetic sources/domains only.

Required tests:
1. matching official authority => eligible source;
2. matching licensed provider only => no eligible official source;
3. mixed official + licensed => only official returned;
4. official source with nonmatching destination => no source;
5. destination/transit do not cross;
6. citizenship/issuer do not cross;
7. explicit document mismatch => no source;
8. deterministic ordering independent of descriptor input order;
9. tampered scope/request => blocked;
10. no `not_required`, truth result, network/model/DB paths.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- hygiene;
- git diff --check.

## H. Strict ownership

Allowed:
- `lib/readiness/official-truth-research-source-routing.ts`
- `lib/readiness/official-truth-research-source-routing.test.ts`
- lane docs `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_*`

Read-only:
- #702 research-request contract;
- source-router;
- source-registry;
- evidence.

Forbidden:
- modifying #702 runtime;
- modifying source-router/registry/evidence;
- Candidate Batch Validator;
- app/components;
- Supabase/migrations;
- DB/Auth/RLS;
- providers;
- global continuity;
- package/lockfile.

If existing contracts cannot support this bridge without modification, STOP and report.

## I. Main drift

Before final push:
- fetch current main;
- integrate it;
- remain 0 behind;
- rerun all gates.

## J. Stop

Push one validated head.
Record session/model/head/base/ahead-behind/files/gates.
Stay Draft.
Do not Ready.
Do not merge.
Do not start a browser/model research executor.
STOP for independent TL review.
