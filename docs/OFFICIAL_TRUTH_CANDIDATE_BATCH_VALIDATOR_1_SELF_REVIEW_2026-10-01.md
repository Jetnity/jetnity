# Official Truth Candidate Evidence Batch Validator 1 — Self-Review

Date: 1 October 2026
Issue: #701
Draft PR: #703
Branch: `feat/official-truth-candidate-batch-validator-1`

Logical agent: **Jetnity Official Truth candidate batch validator 1**, Generation 1
Session: https://cursor.com/agents/bc-9f53581b-e94b-4ac0-a637-ae6198e26a1a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8` is the task seed plus:

- `lib/readiness/official-truth-candidate-batch.ts`
- `lib/readiness/official-truth-candidate-batch.test.ts`
- `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_CANDIDATE_BATCH_VALIDATOR_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. No canonical Official Truth type was edited. No Research Request lane file was edited.

## What I checked in the contract

- Exact `RESEARCH_ONLY` and `NOT_APPROVED_FOR_DATABASE_IMPORT` succeed. The JSON has no `importReady` and no bare `APPROVED_FOR_DATABASE_IMPORT`.
- `APPROVED`, `IMPORT-READY`, `OFFICIAL_TRUTH`, `APPROVED_FOR_DATABASE_IMPORT`, `importReady`, `officialTruth` and `accepted` fail as `forbidden_claim`.
- Explicit quality with no supporting URL fails. Composed quality with one supporting URL fails. Two distinct URLs succeed. The same URL twice fails as a duplicate and is not collapsed.
- An action link alone does not satisfy explicit quality. One source plus an action link does not satisfy composed quality. A kept action link is absent from `supportingOfficialSourceUrls`.
- `utm_source` and `UTM_medium` fail. The fixture token is absent from the finding JSON. `?lang=en` remains. `?utm=1` remains, because the required prefix is `utm_`.
- `retrievedAt` equal to the injected clock succeeds. One millisecond later fails. An earlier clock fails the same instant. `+00:00`, a lowercase `z`, a date-only value, surrounding whitespace and `2023-02-29` fail. `2024-02-29` succeeds. A missing clock fails. The module source has no `Date.now` and no `new Date(`.
- Null validity succeeds. Equal dates succeed. Reversed dates fail. `2026-02-31` and a full instant in `validUntil` fail. `1900-02-29` fails. `2000-02-29` succeeds.
- A research gap without `not_required` succeeds as `not_importable_truth`. A `not_required` key fails and the fixture value is not echoed.
- An unresolved conflict with two sources succeeds and stays `not_importable_truth`. A `resolved` key fails.
- Stale primary evidence with one source succeeds and is not `current`. A `current` key fails. Stale evidence with no source URL fails cardinality.
- Representative personal keys, including nested `passportNumber`, fail. The secret value is absent from the JSON.
- A batch that has only `residenceCountryCode` does not come back with that code as citizenship. `issuingCountryCode` fails as `citizenship_not_derivable`. `unknown` document type fails. `national_id` succeeds.
- Input JSON is unchanged. Destination order is unchanged. `aa` with surrounding spaces becomes `AA` through `landescodeLesen`.
- `https://GOV.example/entry` is kept character for character. HTTP, localhost and URL userinfo fail. The userinfo token is not echoed.
- `requirementsProviderAus()` is still `null`. The module source does not name the acceptance functions, Supabase, OpenAI, `fetch` or SQL statements.

## Boundary choices a reviewer should see

1. Envelope field names are new. The task fixed the status values, not the key names, and this repository has no CH batch to copy. Changing the names later is a contract change.
2. `stale_primary_evidence` requires one supporting official URL. The task stated cardinality only for explicit and composed quality. Stale evidence with no source is rejected so it cannot look like a sourced primary statement.
3. `unresolved_conflict` has no minimum URL count. It cannot be marked resolved, and it cannot be promoted. A conflict with zero sources still needs `retrievedAt`, because every non-gap entry is evidence-bearing.
4. `validFrom` and `validUntil` do not reuse `gültigkeitszeitLesen`. That reader also accepts an instant. This slice accepts a date or `null` only.
5. URLs are not canonicalized. `quelleUrlLesen` would replace the written string. Fail-closed keeps the original `https://` string or rejects it. Uppercase `HTTPS://` fails because rewriting the scheme would change the input.
6. The only rejected tracking prefix is `utm_`. A growth audit names `gclid` as an attribution parameter that was not implemented. It is not an Official Truth research convention, so this slice does not invent that denylist. A later documented convention can add exact names.
7. `accepted` is a forbidden claim in addition to the task's approved / import-ready / Official Truth / database-import list. A package must not describe itself as already accepted Evidence. `NOT_APPROVED_FOR_DATABASE_IMPORT` does not match, because the check is the whole normalized token.
8. The personal-key set includes the task's scan, image, face, fingerprint, vaccination and traveller-name variants, and the existing evidence denylist (`tripId`, `phone`, `givenName`, `familyName`, `diagnosis`). The evidence set is not exported. A new key added only in `evidence.ts` is not picked up automatically.
9. Technical caps are 32 destinations, 8 supporting URLs, depth 8 and 64 list items. Eight matches `REGEL_SUPPORT_MAX`. These caps are not legal limits.
10. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
11. One batch is one citizenship and one document. That follows the singular fields in the task. It is not a product decision to ignore a second passport. A second option needs its own batch.

## Findings I am not calling done

1. Nothing in the engine, the requirements route or the store calls this function. That is the task boundary. A later slice must not treat `review_only` as acceptance and must not import a batch from this result.
2. Real research packages are not fixtures here. Passing this validator does not say that a future CH file will match the envelope.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on the working tree before this commit. `origin/main` is `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`. Merge-base is that SHA. The branch is 0 behind.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-candidate-batch.test.ts`: 13/13 pass.
- `npm test`: 4258 pass / 0 fail. 745 suites. The recorded run is after the unused-binding cleanup and after `git merge --ff-only origin/main` reported already up to date. PostgreSQL 16 was present at `/usr/lib/postgresql/16/bin` for the untouched store proof.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The head after this commit is the branch tip. Its GitHub CI, Auth job and Vercel Preview are the gate. They are not written here in advance. Do not copy a baseline run from `a3af1fea`.

## Stop

Draft remains Draft. Cursor does not Ready, does not merge, and does not open an import or promotion slice.
