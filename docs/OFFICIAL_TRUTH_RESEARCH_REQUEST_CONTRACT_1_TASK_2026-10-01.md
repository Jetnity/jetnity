# Official Truth Demand-Driven Research Request Contract 1 — Binding Task

Date: 1 October 2026
Issue: #700
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`
Logical agent: **Jetnity Official Truth research request contract 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Why this slice exists

Jetnity already has:
- source registry/router/evidence contracts;
- private Evidence / accepted Rule Claim persistence;
- trusted accepted-store writer;
- source-catalog gateway;
- freshness/gap coverage policy.

What is still missing is a provider-independent contract that says:

> “This exact Official Truth scope needs research now.”

That contract must exist **before** any browser/OpenAI adapter is allowed to research on demand.

This slice does not research anything. It only defines the deterministic request.

## Existing truth to reuse

Read current main before coding:
- `lib/readiness/official-truth-coverage.ts`
- `lib/readiness/evidence.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/source-registry.ts`
- `lib/readiness/source-router.ts`
- relevant Official Truth architecture docs.

Do not create a second coverage model or second scope model.

## A. Coverage → research decision

Build one pure function that consumes the existing coverage result plus the exact existing scope needed to research.

Required behavior:
- `current` → **no research request**;
- `missing` → bounded research request;
- `recheck_needed` → bounded research request preserving the exact recheck reason(s);
- `invalid` → **blocked invalid state**, not a research request and not an automatic repair.

Missing or stale evidence must never become `not_required`.

Do not reinterpret an invalid state as missing.

## B. Exact scope

The request must reuse canonical existing scope/value types. It must not infer any of:

- citizenship from residence;
- citizenship from document issuer;
- a primary/preferred citizenship;
- a primary/default passport;
- transit context from destination;
- missing airports/transit as “not applicable”.

Where the current product contract distinguishes destination/transit/credential options, preserve that distinction.

No person name or traveller account identifier belongs in the research contract unless an existing canonical **non-personal** scope type already requires it. Prefer the minimum global/non-personal research scope.

## C. Request identity

A request must be deterministic from semantically relevant canonical scope + reason.

Requirements:
- same canonical scope + same research reason => same request key;
- semantically irrelevant input ordering must not change the key;
- different citizenship/document/destination/transit scope must not collide;
- `missing` and `recheck_needed` must not silently collapse if their action semantics differ.

Do not use timestamps/random UUIDs for the deterministic identity.

## D. Allowed research boundary

The request may express:
- that primary official authority evidence is required;
- the exact fact/scope to research;
- why research is needed.

It must not:
- name a commercial provider as Official Truth;
- select Sherpa/Timatic/KAYAK;
- contain credentials/secrets;
- contain a network URL that was not already canonical input truth;
- mint source domains;
- execute search;
- call OpenAI/web/browser;
- create Candidate Evidence;
- call `evidenceKandidatAkzeptieren`;
- call `regelKandidatAkzeptieren`;
- call `official_truth_store_accepted_v1`;
- call `official_truth_source_catalog_v1`;
- activate `requirementsProviderAus()`.

## E. Privacy hard boundary

The contract must not accept or persist:
- passport/document number;
- MRZ;
- scans/files;
- biometrics;
- health record;
- birth date;
- full name;
- email;
- account/user id;
- free-form traveller note.

Tests must prove representative forbidden keys are absent from the public type/runtime contract.

## F. Proposed API shape

Do not copy this blindly if existing types support a better equivalent.

A likely shape is:

- a discriminated decision:
  - `{ action: 'none', reason: 'current' }`
  - `{ action: 'research', request: ... }`
  - `{ action: 'blocked_invalid', ... }`

The exact names may follow current German naming conventions.

The research request should carry only canonical scope, fact/reason, required evidence class and a deterministic key.

## G. Tests

Prove at minimum:
- current → none;
- missing → research;
- recheck_needed → research with reason preserved;
- invalid → blocked, no research;
- no `not_required` derivation;
- deterministic identity;
- order-independent canonical inputs where semantically irrelevant;
- scope differences do not collide;
- no default passport/citizenship;
- no personal/sensitive fields;
- no network/model/DB imports in runtime file.

Run:
- focused tests;
- full `npm test`;
- typecheck;
- lint;
- build;
- hygiene checks;
- `git diff --check`.

## H. Strict ownership

Allowed:
- `lib/readiness/official-truth-research-request.ts`
- `lib/readiness/official-truth-research-request.test.ts`
- lane-specific docs:
  - `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_*`

Read-only:
- existing Official Truth / readiness runtime.

Forbidden:
- Candidate Batch Validator lane files;
- Supabase/migrations;
- app/components;
- source catalog data;
- global continuity files;
- package/lockfile;
- Auth/RLS;
- providers;
- Production configuration.

If an existing canonical type must be modified to make this possible, STOP and report before editing it.

## I. Main drift

Before final push:
- fetch then-current main;
- integrate it into this same branch/session;
- remain 0 behind;
- rerun full gates.

## J. Stop

Push one exact validated head.
Record session/model/head/base/ahead-behind/changed files/gates.
Stay Draft.
Do not Ready.
Do not merge.
Do not start the browser/model research adapter.
STOP for independent Technical-Lead review.
