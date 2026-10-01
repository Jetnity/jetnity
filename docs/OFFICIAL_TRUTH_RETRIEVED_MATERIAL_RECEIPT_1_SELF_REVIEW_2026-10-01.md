# Official Truth Retrieved Material Receipt Contract 1 — Self-Review

Date: 1 October 2026
Issue: #707
Draft PR: #709
Branch: `feat/official-truth-retrieved-material-receipt-1`

Logical agent: **Jetnity Official Truth retrieved material receipt 1**, Generation 1
Session: https://cursor.com/agents/bc-1013f718-e4f9-42a3-9161-1b2e66261b41
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `e32c60e9f9d2bdc9db42c80eba6721e59e5120df` is the task seed plus:

- `lib/readiness/official-truth-retrieved-material.ts`
- `lib/readiness/official-truth-retrieved-material.test.ts`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_RECEIPT_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-research-request.ts`, `official-truth-research-source-routing.ts`, `source-router.ts`, `source-registry.ts`, `evidence.ts` and `official.ts` were not edited. The task said to stop if the receipt needed a change to those contracts. It did not. Eligibility is the public #705 function. The fingerprint is the public `evidenceQuellenFingerprint`. The URL trust boundary is the public `quellenUrlAufloesen`. The instant form starts from the public `checkedAtLesen`.

## What I checked in the receipt

- A real #702 request, a synthetic `gov.example` authority, `https://www.gov.example/rules`, a past `Z` instant and a snapshot inside the existing size limit return `retrieved_material`. The hash equals `evidenceQuellenFingerprint`. The canonical URL equals `quellenUrlAufloesen`. The input JSON is unchanged.
- The same coverage on a licensed provider returns `source_not_official_authority`. The provider id is not in the blocked result.
- An official source whose destination list is a different country returns `source_not_eligible`.
- A URL on another registered official source returns `url_source_mismatch` when that other source is outside the eligible set and when both sources are eligible. The host is not copied into the result.
- `https://evil.example` is `unregistered_domain`. A blocked host is `blocked_domain`. `localhost` and `.local` are `invalid_url`, which is the existing registry result. `http://` is `insecure_scheme`. A userinfo URL is `credentials`. The credential value is not in the result.
- `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid` and `mc_eid` fail case-insensitively. The tracking value is not in the result. `lang` and `ref` remain on the resolved URL.
- One millisecond after the injected clock is `retrieved_at_in_future`. `+00:00`, a lowercase `z`, a date-only value, a leading space, `24:00` and 29 February 2023 are `invalid_retrieved_at`. 29 February 2024 before the clock is accepted. A missing, throwing or non-finite clock is `invalid_validation_clock`.
- An empty snapshot and a snapshot of length 65,537 are `invalid_source_snapshot`. The oversize marker is not in the result. Length 65,536 still matches the existing fingerprint.
- `sourceContentHash`, `contentHash` and `content` are rejected in the material and on the envelope, including when the hash is the real fingerprint. `sourceSnapshot`, `canonicalUrl` and `retrievedAt` are rejected outside the material. A caller `sourceIds` field is `invalid_envelope`.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip and traveller keys, plus a traveller note, return `sensitive_personal_field` without the value and without the key name.
- A changed request key is `invalid_request`. A swapped destination under the old rule-scope key is `scope_mismatch`. A registry without `blockedDomains` is `invalid_source_plan`.
- A CRLF snapshot is stored unchanged. Its hash is the existing fingerprint, which normalizes the line ending.
- The runtime file calls #705, `quellenUrlAufloesen` and `evidenceQuellenFingerprint`. It does not contain `not_required`, a candidate or claim constructor, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `fetch`, or an engine, provider, store, catalog or candidate-batch import. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. Eligibility is the #705 result, then a second read of `sourceClass`. A licensed id cannot become official because a caller also sent a route object. Extra envelope fields are `invalid_envelope` unless they are a personal key, a fingerprint override or a second provenance field.
2. The personal-key set and the note set are copied from the research request. That set is module-private. Exporting it would have edited #702, which this task forbids. `authorityName` and `publisherName` are not in the set, so a normal registry still passes.
3. Shared registry objects are walked twice. Only an object that appears in its own ancestor chain is an envelope cycle. That avoids rejecting the usual descriptor that points at the same source row the registry already holds.
4. Tracking is checked after `quellenUrlAufloesen` so insecure, credential, local, blocked and unregistered URLs keep the existing reason. The original query names are still tested, case-insensitively, and are not removed.
5. `checkedAtLesen` trims. This receipt requires the trimmed form to be the original string, then checks the calendar date so a rolled-over day is not a valid instant. The clock is the function argument. An equal instant is not future.
6. The success status is `retrieved_material`. It is a discriminant, not an entry effect. The blocked result is only `status` and `reason`, so a finding cannot carry a snapshot, a password or a click id.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later orchestration slice must call it once per retrieved page, must keep `blocked` distinct from a receipt, and must not pass the receipt to `evidenceKandidatAusModell` or map it onto Sherpa, Timatic, KAYAK, a fetch URL or an entry effect.
2. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `6bbf3be6b9a968ad95d7634e67f5f7fbf9d93a5f` before this docs commit. `origin/main` is `e32c60e9f9d2bdc9db42c80eba6721e59e5120df`. Merge-base is that SHA. The branch was 0 behind and 2 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-retrieved-material.test.ts`: 15/15 pass.
- `npm test`: 4299 pass / 0 fail. 748 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `e32c60e9` or from `6bbf3be6`.
