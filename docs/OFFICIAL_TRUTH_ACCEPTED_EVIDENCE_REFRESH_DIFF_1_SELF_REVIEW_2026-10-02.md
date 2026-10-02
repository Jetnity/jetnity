# Official Truth Accepted Evidence Refresh Diff Bridge 1 — Self-Review

Date: 2 October 2026
Issue: #718
Draft PR: #719
Branch: `feat/official-truth-accepted-evidence-refresh-diff-1`

Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-b03d9222-abc2-4128-ab33-01bba6fed0cc
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf` is the task seed plus:

- `lib/readiness/official-truth-refresh-diff.ts`
- `lib/readiness/official-truth-refresh-diff.test.ts`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_ACCEPTED_EVIDENCE_REFRESH_DIFF_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-retrieved-material.ts`, `official-truth-retrieved-candidate-evidence.ts`, `official-truth-accepted-evidence.ts`, `evidence.ts`, `rule-claims.ts`, `source-registry.ts` and `source-router.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not. Retrieval is the public #709 function. The registry is the object already on the validated envelope. The reader is the public `akzeptierteEvidenceLesen`. The cell is the public `regelScopeAusEvidenceScope`. The comparison is the public `evidenceVersionenVergleichen`.

## What I checked in the bridge

- A real #702 request, a synthetic `gov.example` authority, a registered HTTPS URL, a past `Z` instant and a snapshot inside the existing fingerprint limit return `unchanged_source_content` for Evidence already accepted through #716. The same decision holds when the new snapshot only changes `\n` to `\r\n`, because #709 fingerprints the normalized text and the comparator sees equal hashes. `contentChanged` is false. `laterAnalysisShortCircuit` is true. `ruleChange` is `not_asserted`. The returned id is the existing version id. The input JSON is unchanged. The result keys are only `status`, `existingVersionId`, `requestKey`, `ruleScopeKey`, `sourceId`, `contentChanged`, `laterAnalysisShortCircuit` and `ruleChange`.
- A changed snapshot returns `changed_source_content`, `contentChanged: true`, `laterAnalysisShortCircuit: false`, and `ruleChange: 'not_asserted'`. Those three fields equal a direct `evidenceVersionenVergleichen` call on the existing object and the #709 hash. The version id of a separately accepted new snapshot is not returned.
- A #713 candidate and lifecycle or validation flips that fail `akzeptierteEvidenceLesen` return `existing_evidence_not_accepted`.
- Licensed Evidence that still passes `akzeptierteEvidenceLesen` returns `existing_source_not_official_authority`. The provider host is not in the JSON.
- A second official source, `interior.example`, with the same cell, passes #709 and then returns `source_id_mismatch`.
- Destination `TH`, passport issuing country `RS` against a `CH` baseline, and transit `TH` plus residence `DE` each pass #709 and then return `scope_mismatch`. The baseline keeps citizenships `CH` and `RS` and issuing country `CH`.
- A caller-built receipt, a stale request key, a swapped destination under the old rule-scope key, a caller hash, an empty snapshot, a future `retrievedAt`, and a null clock deep-equal the #709 blocked object. A caller-built comparison is `existing_evidence_not_accepted`. The content hash and the URL are not in that JSON.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip and traveller note return `sensitive_personal_field` without the value and without the key name. The same is true for a nested passport number under citizenship.
- The runtime file calls #709, then reads the registry, then `akzeptierteEvidenceLesen`, then the official-class check, then the source id check, then `regelScopeAusEvidenceScope`, then `evidenceVersionenVergleichen(gelesen, { sourceContentHash: beleg.sourceContentHash })`. It does not assign `lifecycle: 'accepted'` or `validationState: 'valid'`. It does not contain `not_required`, an acceptance or claim constructor, a hand-built version id, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store, catalog or candidate-batch import. `evidence.ts`, #709, #713 and #716 do not import this module. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. #709 runs before the registry is read. A broken envelope returns the #709 reason and does not call `akzeptierteEvidenceLesen`.
2. The registry is the plain object on the envelope. It is not passed through `quellenRegistryErstellen` again. A missing `sources` or `blockedDomains` array returns `invalid_source_plan`. With the current unmodified #709 path, a successful receipt already used that same object.
3. `ruleChange`, `contentChanged` and `laterAnalysisShortCircuit` are taken from `evidenceVersionenVergleichen`. If that function ever stopped pairing an unchanged hash with `laterAnalysisShortCircuit: true`, or stopped returning `not_asserted`, the bridge returns `invalid_context` and does not invent the flags. With the current unmodified comparator, that branch does not run.
4. Before a success value is copied out, the version id must match `ev1_` plus 32 hex characters, the request key must match `research-request:v1:` plus 64 hex characters, the rule-scope key must match `rule-scope:v1:` plus 64 hex characters, and the source id must match the existing source-id shape. A secret stuffed into `versionId` therefore cannot leave the function. This is an output gate. It is not a second version-id constructor.
5. Personal and traveller-note keys on the existing object are `sensitive_personal_field`. `extractionNote` remains a legal Evidence field and is not returned. The blocked result is only `status` and `reason`.
6. The success statuses are `unchanged_source_content` and `changed_source_content`. They are discriminants about normalized source text. They are not entry effects.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on and does not store either version.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later consumer must not map `laterAnalysisShortCircuit: true` to "the rule is still true" or to `not_required`. It may only skip repeating analysis of this same normalized source text. `changed_source_content` is still `ruleChange: 'not_asserted'`.
2. `akzeptierteEvidenceLesen` checks lifecycle, validation, registry identity, retrieval time, hash shape and the recomputed lookup key. It does not recompute `sourceContentHash` from a snapshot, because the Evidence object has no snapshot. A caller who replaces that hash with another 64-hex string, and leaves the rest intact, can move the comparison. This slice has no store, so it cannot prove the hash is the stored one. A later slice must pass the version read from the trusted store. It must not accept a caller-edited hash as the baseline. Connecting the store, or building a Rule Claim from this decision, is a separate task. This writer does not start it.
3. `docs/ACTIVE_WORK_STATUS.md` on this branch still points at an older writer. Updating it would edit global continuity, which this task forbids. The next reader should start with this handoff.
4. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `51a5a84ad06b2d4117858d55a0dd526c20521ac6` before this docs commit. `origin/main` is `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`. Merge-base is that SHA. The branch was 0 behind and 2 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-refresh-diff.test.ts`: 8/8 pass.
- `npm test`: 4346 pass / 0 fail. 753 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted. The system cluster was not started.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `6b7f92be` or from `51a5a84a`.
