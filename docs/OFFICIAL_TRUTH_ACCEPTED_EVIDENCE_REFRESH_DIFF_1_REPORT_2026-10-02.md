# Official Truth Accepted Evidence Refresh Diff Bridge 1 — Report

Date: 2 October 2026
Issue: #718
Draft PR: #719
Branch: `feat/official-truth-accepted-evidence-refresh-diff-1`
Baseline: `main@6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`

Logical agent: **Jetnity Official Truth accepted Evidence refresh diff bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-b03d9222-abc2-4128-ab33-01bba6fed0cc
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthAkzeptierteEvidenceAktualisierungVergleichen` in `lib/readiness/official-truth-refresh-diff.ts` answers one question: did the normalized source text of one already accepted official Evidence version change in one newly validated retrieval for the same source and the same regulatory cell?

- The function calls `officialTruthAbgerufenMaterialPruefen` again with the original envelope and the injected clock. A caller-built receipt, a caller-built comparison, and a caller-supplied hash are not arguments.
- A blocked #709 result is returned unchanged.
- The registry is read only after that, and only from the same envelope. It is not rebuilt.
- The existing object must pass `akzeptierteEvidenceLesen(existing, registry)`.
- `sourceClass` must be `official_authority`.
- The existing `sourceId` must equal the validated retrieval `sourceId`.
- `regelScopeAusEvidenceScope(existing.scope).key` must equal the validated retrieval `ruleScopeKey`.
- The only hash comparison is `evidenceVersionenVergleichen(existing, { sourceContentHash: receipt.sourceContentHash })`.
- `unchanged_source_content` means the comparator reported `contentChanged: false` and `laterAnalysisShortCircuit: true`.
- `changed_source_content` means the comparator reported `contentChanged: true` and `laterAnalysisShortCircuit: false`.
- `ruleChange` is the comparator's `not_asserted` in both. This file does not invent a second comparison.

Equal content hash means only: the same normalized source text. It does not mean the rule is current, the rule is correct, no legal change exists outside this source, an entry requirement is not required, or a prior Rule Claim is reaffirmed.

The result identifiers are `existingVersionId`, `requestKey`, `ruleScopeKey`, and `sourceId`. There is no new version id, no lookup key, no URL, no snapshot, no content hash, and no rule effect.

## What landed

- The input is one existing Evidence object, the original #709 envelope, and the injected validation clock.
- Accepted official Evidence plus the same snapshot, including a newline-normalized equivalent, returns `unchanged_source_content`. `laterAnalysisShortCircuit` is true. `ruleChange` is `not_asserted`. A validity window and an extraction note on the existing object do not change that result, and the note is not returned.
- A changed snapshot returns `changed_source_content`. `laterAnalysisShortCircuit` is false. `ruleChange` stays `not_asserted`. The returned version id is the existing id. A separately accepted version of the new snapshot has a different version id, and this function does not return that id.
- A #713 candidate, and an accepted object flipped back to `candidate`, `pending`, `rejected`, or `superseded`, returns `existing_evidence_not_accepted`. `akzeptierteEvidenceLesen` on the candidate is null.
- Licensed Evidence that still passes `akzeptierteEvidenceLesen` returns `existing_source_not_official_authority`.
- The same cell retrieved from a second synthetic official source returns `source_id_mismatch`. #709 itself succeeded for that second source.
- A different destination, a different passport issuing country, and a different transit-plus-residence cell each return `scope_mismatch` after #709 succeeded. Both citizenships stay on the existing object. The issuing country is not treated as the only citizenship.
- A caller-built receipt, a changed request key, a scope that no longer matches its rule-scope key, a caller hash, an empty snapshot, a future `retrievedAt`, and a missing clock deep-equal the #709 blocked result. A caller-built comparison object is `existing_evidence_not_accepted` even when the envelope is valid.
- Personal and traveller-note keys on the existing object or the envelope return `sensitive_personal_field` without the value and without the key name. A secret placed in `extractionNote`, `previousVersionId`, or a non-`ev1_` version id is not echoed.
- The existing object and the envelope are not mutated. Success and blocked JSON have no rule-effect key and no `not_required`, `conditional`, `optionEligibility`, `optionMandate`, `visaMode`, or `trustedRuleFact` text.

## Traveller context

One call is one regulatory cell and one selected official source. The cell keeps every citizenship already on the existing Evidence and on the #702 request inside the envelope. Another passport, another issuing country, another destination, another transit country, or another residence is another comparison and does not short-circuit as unchanged source text. This function does not rank those options and does not invent a visa, transit, health, carrier, or document rule. No rule result is produced. `blocked` is not `not_required`. `unchanged_source_content` is not `not_required`. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id, or traveller note.

## Boundaries kept

- No edit to #709, #713, #716, `evidence.ts`, `rule-claims.ts`, the source registry, the source router, the store, the catalog, or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI, or public API.
- No call to `evidenceKandidatAkzeptieren`, `evidenceKandidatAusModell`, `regelKandidatErstellen`, or `regelKandidatAkzeptieren`. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `51a5a84ad06b2d4117858d55a0dd526c20521ac6` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `6b7f92be217bdc5b7463c7699fc2ac585a7a27cf`, which is the task baseline. Merge-base is that SHA. The runtime head was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-refresh-diff.test.ts` | 8/8 pass |
| `npm test` | 4346 pass / 0 fail, 753 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. Package setup did not start the system cluster (`policy-rc.d` denied start). The store tests used throwaway clusters. No database outside those clusters was contacted. This slice did not apply SQL. Development and Production were not touched.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `6b7f92be`.
