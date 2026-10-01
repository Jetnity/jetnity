# Official Truth Retrieved Material Receipt Contract 1 — Binding Task

Date: 1 October 2026
Issue: #707
Baseline: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`
Logical agent: **Jetnity Official Truth retrieved material receipt 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Define the fail-closed post-retrieval envelope that a later executor must pass before any model extraction.

This slice performs no retrieval.

## Input

Must bind:
- an existing #702 research request;
- current Source Registry;
- current source descriptors;
- one selected `sourceId`;
- retrieval material:
  - `canonicalUrl`;
  - `retrievedAt`;
  - `sourceSnapshot`;
- injected validation clock.

Do not accept a caller-built routing result as truth. Re-run/reuse #705 to prove `sourceId` is eligible for this request.

## Required validation

1. request is valid via #705 path;
2. selected sourceId is among eligible official authority sources;
3. registry source is exactly `official_authority`;
4. `canonicalUrl` resolves via existing `quellenUrlAufloesen` to that same sourceId;
5. HTTPS only; credentials/local/blocked/unregistered host fail via existing registry rules;
6. reject tracking-only query names, case-insensitively:
   - `utm_*`
   - `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, `mc_eid`
   Functional `lang` and generic `ref` remain allowed.
7. `retrievedAt` must be a complete valid UTC instant and not later than the injected clock;
8. `sourceSnapshot` must pass existing `evidenceQuellenFingerprint` limits;
9. source fingerprint is recomputed by Jetnity; caller cannot provide/override it;
10. error findings must not echo snapshot content, URL credentials or tracking values.

## Output

A validated receipt may contain:
- requestKey / ruleScopeKey;
- sourceId;
- canonicalUrl;
- retrievedAt;
- sourceContentHash;
- an `EvidenceQuellenmaterial`-compatible material object if safe.

It is still **retrieved material**, not Candidate Evidence and not Official Truth.

No extracted rule result/effect.

## No model / no write

No:
- fetch/browser/search;
- OpenAI/model;
- provider adapter;
- Candidate Evidence constructor;
- `evidenceKandidatAusModell`;
- Evidence/Rule acceptance;
- store/catalog RPC;
- source registration;
- Supabase/DB/Auth/RLS;
- cron/queue.

`requirementsProviderAus()` stays null.

## Privacy

Reject representative personal/sensitive keys if injected into the envelope:
passport/document number, MRZ, scan, biometric, health, birth date, name, email, account/user/trip/traveller IDs, free-form traveller notes.

Do not echo rejected values.

## Tests

Synthetic `.example` only.

Prove:
1. eligible official source + registered URL + valid time/snapshot -> validated receipt;
2. licensed provider source -> blocked;
3. non-eligible official source -> blocked;
4. URL on another registered source -> blocked;
5. unregistered/blocked/local/insecure/credential URL -> blocked;
6. tracking params rejected without value echo;
7. functional lang/ref allowed;
8. future/invalid/non-Z time rejected using injected clock;
9. empty/oversize snapshot rejected;
10. caller-provided hash/provenance override rejected;
11. no model/network/DB/write path;
12. input not mutated.

Run focused/full tests, typecheck, lint, build, hygiene, diff check.

## Ownership

Allowed:
- `lib/readiness/official-truth-retrieved-material.ts`
- `lib/readiness/official-truth-retrieved-material.test.ts`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_*`

Read-only:
- #702 request;
- #705 routing;
- source registry/router;
- evidence fingerprint/material types.

Forbidden:
- modifying existing runtime files;
- Lane A execution-plan files;
- Candidate Batch Validator;
- Supabase/migrations;
- app/components;
- package/lock;
- global continuity.

If safe implementation needs existing runtime edits, STOP and report.

Before final push integrate current main, remain 0 behind, rerun gates.

Stay Draft. Do not Ready. Do not merge. Do not start fetch/model execution.
STOP for independent TL review.
