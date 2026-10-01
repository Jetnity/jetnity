# Official Truth Freshness and Gap Policy 1 — Binding Task

Date: 1 October 2026
Issue: #685
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Logical agent: **Jetnity Official Truth freshness and gap policy 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Goal
Create a pure deterministic coverage/freshness policy for later demand-driven Official Truth orchestration.

No network. No database. No provider. No model. No runtime activation.

## Files
Create only:
- `lib/readiness/official-truth-coverage.ts`
- `lib/readiness/official-truth-coverage.test.ts`
- this task file
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_SELF_REVIEW_2026-10-01.md`

Do not modify `official.ts`, `evidence.ts`, `rule-claims.ts`, `provider.ts`, `engine.ts`, Supabase files, schema scanner, or global continuity.

## Contract
Input must be narrow and typed around:
- requested canonical rule-scope key;
- requested fact kind;
- zero or one accepted claim;
- support evidence metadata needed only for freshness:
  versionId, ruleScopeKey, lifecycle, validationState, retrievedAt, validFrom, validUntil, sourceId;
- injected current/reference time;
- optional caller-supplied maxAgeMs policy.

No personal identifiers.

Output: closed discriminated union:
- `current`
- `missing`
- `recheck_needed`
- `invalid`

This module MUST NOT create required/not_required/conditional truth.

## Rules
- no claim => missing;
- claim must be accepted + valid;
- every support ID in claim must exist exactly once;
- every support must match exact rule-scope key and be accepted + valid;
- malformed/missing required timestamps => invalid;
- retrievedAt in future => invalid;
- validFrom in future => recheck_needed;
- validUntil before reference time => recheck_needed;
- optional maxAgeMs exceeded => recheck_needed;
- absent maxAgeMs means no invented TTL;
- incomplete/duplicate/mismatched support => invalid;
- support input order must not affect result;
- absence never implies not_required.

Use existing parsers/types by import where appropriate; do not duplicate Product Truth semantics.

## Tests
Cover all rules above, including no-max-age current case, malformed dates, duplicate/missing support, ordering invariance, candidate/pending support rejection, and personal-data rejection or impossible-by-type proof.

## Validation / stop
Run focused tests, full tests, typecheck, lint, build, diff check.
Push one exact head, stay Draft, record session/model, STOP.
Cursor does not Ready, merge or start a follow-up slice.
