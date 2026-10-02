# Official Truth Candidate Evidence Acceptance Bridge 1 — Self-Review

Date: 2 October 2026
Issue: #714
Draft PR: #716
Branch: `feat/official-truth-candidate-evidence-acceptance-bridge-1`

Logical agent: **Jetnity Official Truth candidate evidence acceptance bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-8dbb1a52-e186-4f2c-b61a-b6f077b894e6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `16f3a8d631bb823c9daafc724df67c000dcb5985` is the task seed plus:

- `lib/readiness/official-truth-accepted-evidence.ts`
- `lib/readiness/official-truth-accepted-evidence.test.ts`
- `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_CANDIDATE_EVIDENCE_ACCEPTANCE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-retrieved-material.ts`, `official-truth-retrieved-candidate-evidence.ts`, `evidence.ts`, `rule-claims.ts`, `source-registry.ts` and `source-router.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not. The candidate is the public #713 function. The registry is the object already on the validated envelope. Acceptance is the public `evidenceKandidatAkzeptieren`.

## What I checked in the bridge

- A real #702 request, a synthetic `gov.example` authority, a registered HTTPS URL, a past `Z` instant and a snapshot inside the existing fingerprint limit, with null extraction, return `accepted_evidence`. Lifecycle is `accepted`. Validation state is `valid`. Source class is `official_authority`. Previous version is null. Source id, canonical URL, `retrievedAt`, content hash, scope and lookup key equal the #713 candidate. `akzeptierteEvidenceLesen` returns that accepted object and returns null for the candidate. The input JSON is unchanged. The result keys are only `status` and `evidence`.
- `validFrom` `2026-01-01`, `validUntil` `2026-12-31T00:00:00.000Z` and a padded extraction note are stored as the constructor stores them. The note is trimmed. The version id and content hash stay the same as the null-window acceptance. An empty note becomes null.
- A caller-built candidate, an object with `lifecycle: accepted` written by the test, the #713 result wrapper, and an envelope with an extra `evidence` field each return the same blocked object as #713. The content hash is not in that JSON. The original candidate stays `candidate` / `pending`.
- A changed request key is `invalid_request`. A swapped destination under the old rule-scope key is `scope_mismatch`. A caller hash is `source_fingerprint_override_forbidden`. An empty snapshot is `invalid_source_snapshot`. One millisecond after the injected clock is `retrieved_at_in_future`. A null clock is `invalid_validation_clock`. A reversed window is `invalid_validity`. A foreign extraction key is `extraction_field_forbidden`. Each of those results deep-equals the #713 result.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip and traveller note return `sensitive_personal_field` without the value and without the key name. The same is true for a nested passport number under `extractionNote`.
- Two requests that differ only by passport issuing country, CH versus RS, both keep the citizenship set `CH` and `RS`. Their lookup keys differ. A request with transit `TH` and residence `DE` keeps both, plus destination `JP` and both citizenships. No rule-effect key is present.
- The runtime file calls #713 and `evidenceKandidatAkzeptieren(kandidat.evidence, registry)`. It does not assign `lifecycle: 'accepted'` or `validationState: 'valid'`. It does not contain `not_required`, a rule constructor, a hand-built version id, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store, catalog, rule-claims or candidate-batch import. `evidence.ts` and the #713 file do not import this module. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. #713 runs before the registry is read for acceptance. A broken envelope returns the #713 reason and does not call `evidenceKandidatAkzeptieren`.
2. The function has no Evidence parameter. The only object passed to `evidenceKandidatAkzeptieren` is `kandidat.evidence` from that #713 call.
3. The registry is the plain object on the envelope. It is not passed through `quellenRegistryErstellen` again. A missing `sources` or `blockedDomains` array returns `invalid_source_plan` and does not call acceptance. With the current unmodified #713 path, a successful candidate already used that same object.
4. After acceptance, source, scope, URL, retrieval time, hash, version id, lookup key, authority, publisher, validity and note must still match the candidate, and the candidate object must still be `candidate` / `pending`. Otherwise the bridge returns `invalid_context` and does not return the object. With the current unmodified acceptance function, that branch is a guard.
5. Acceptance failures drop `fields`. The blocked result is only `status` and `reason`.
6. The success status is `accepted_evidence`. It is a discriminant, not an entry effect. The nested lifecycle `accepted` is the canonical provenance state.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on and does not store the accepted version.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later slice must not persist a caller-built accepted object. The existing store writer already refuses a non-candidate, and it is not connected here. Connecting it, or building a Rule Claim from this Evidence, is a separate task.
2. `docs/ACTIVE_WORK_STATUS.md` on this branch still points at an older writer. Updating it would edit global continuity, which this task forbids. The next reader should start with this handoff.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `d10ef0f2ae0e54380bc561d734679f464ade6c53` before this docs commit. `origin/main` is `16f3a8d631bb823c9daafc724df67c000dcb5985`. Merge-base is that SHA. The branch was 0 behind and 2 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-accepted-evidence.test.ts`: 8/8 pass.
- `npm test`: 4338 pass / 0 fail. 752 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `16f3a8d6` or from `d10ef0f2`.
