# Applicability schema 2 dormant runtime foundation 1 — Handoff

Date: 6 October 2026 · Issue #856 · Draft PR #857
Logical writer: **Jetnity Official Truth applicability schema 2 dormant runtime foundation 1**, Generation 1.

## Review target

Review the exact remote SHA reported by the final delivery readback on `feat/official-truth-applicability-schema2-dormant-runtime-1`. The commit containing this handoff follows seed `f4105039a0ae04a91d02b9e72d6401ff547333ae`; main/merge-base is `7fb95414db6b7e4de12bea0df29b2c771081b9d4`. TASK blob must remain `54f58f8d7018efb6188e40087ece0516f4b43697`.

Read the companion REPORT for exact changed files, local checks, frozen v1 hashes and environment qualifications. Read the SELF_REVIEW for conformance coverage and trust-boundary review. Session metadata confirms `01a10e1c-6994-73e0-ac3b-f5e2031f49c7`, `gpt-6-astra`, `xhigh`.

## Deliberate integration boundary

- Existing four-argument `regelFaktKanonischLesen` callers continue to parse only legacy/v1. V2 requires its explicit fifth parsing-contract argument and returns `RegelFaktV2`.
- New v2 context/evaluator entry points are pure. Existing runtime code does not populate the new values or select these entry points.
- A supplied country is a claimed precondition for the pure contract, not a new trusted binder, extractor/policy pin or acceptance capability.
- All schema-2 carriers are refused by the store before any dependency/client/transport access. Existing v1 refusal remains.
- `regelKandidatAkzeptieren`, the trusted-fact/composition registries, same-request extraction, provider, traveller context and temporal UI projection remain unchanged.

This separation is necessary to keep new qualified stay/temporal shapes from reaching existing legacy catch-all handling. Future registry/pin integration is explicitly outside this delivery and is not started or authorized by this handoff.

## Reproduction

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/regulierungs-anwendbarkeit.test.ts \
  lib/readiness/e4-temporal-rules.test.ts \
  lib/readiness/rule-claims.test.ts \
  lib/readiness/official-truth-store-server.test.ts
npm test
npm run typecheck
npm run lint
npm run build
npm run check:operating-mode
git diff --check origin/main...HEAD
```

The full and focused commands require the pre-existing Linux PostgreSQL-16 fixture environment; the final local runs used a disposable, network-disabled Linux copy with matching locked dependencies and `.git` included. No hosted database access is needed. Final counts: focused 117/117; full 5,418/5,418, no skips. Typecheck/build and all hygiene checks pass; lint has 0 errors and 144 existing warnings.

## Independent review emphasis

1. Verify the complete context is rejected before boolean/branch shortcuts on activity, duration or national-passport conflicts.
2. Check counting/unit mismatch precedence, declaration-vs-date convention, inclusive 3,661 candidate blocking and same-day exit-exclusive zero.
3. Check national-passport known-false versus unknown, citizenship-link independence from issuer, and separate ordinary-class evaluation.
4. Check event identity, explicit observation, equality closed and civil-date precision refusal.
5. Check v2 carrier exact keys, scope equality, complete fingerprints and continued acceptance/store isolation.
6. Compare frozen v1 source bodies and golden vectors against baseline; inspect exact-head CI and Vercel separately from local checks.

## Required stop

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

PR stays Draft. No Ready, merge, new writer, follow-up slice, producer/binder, registry integration, persistence, DB/Supabase, F8 or source-family readiness claim is part of this delivery.
