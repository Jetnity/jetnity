# Official Truth Retrieved Material → Candidate Evidence Bridge 1 — Report

Date: 2 October 2026
Issue: #711
Draft PR: #713
Branch: `feat/official-truth-retrieved-material-candidate-evidence-bridge-1`
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`

Logical agent: **Jetnity Official Truth retrieved material candidate evidence bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-60f030cd-8951-4216-bd3e-a06f692b409c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthKandidatEvidenceAusAbruf` in `lib/readiness/official-truth-retrieved-candidate-evidence.ts` answers one question: can this original retrieval envelope become one existing candidate Evidence version?

- The function calls `officialTruthAbgerufenMaterialPruefen` again with the original envelope and the injected clock. A caller-built receipt is not an input.
- After that receipt passes, the regulatory cell is `regelScopeAusEvidenceScope` on the #702 request scope. `sourceId` is added only from the receipt. `evidenceKandidatAusModell` then builds the Evidence version. This file does not assign `versionId`, `lookupKey`, lifecycle or validation state.
- A valid envelope and null or empty extraction return `candidate_evidence`. The Evidence lifecycle is `candidate`, the validation state is `pending`, and the source class is `official_authority`. `akzeptierteEvidenceLesen` on that object returns null.
- `validFrom`, `validUntil` and `extractionNote` are the only extraction fields. They are passed through the existing constructor. A trimmed note and an accepted validity window are the constructor's values. Any other extraction key is `extraction_field_forbidden`. A personal or traveller-note key is `sensitive_personal_field`. The blocked result is only `status` and `reason`.
- A changed request, a scope that no longer matches its rule-scope key, a caller hash, an empty snapshot, a future `retrievedAt`, or a missing clock fails with the #709 reason. The bridge does not keep a previous receipt.

Candidate Evidence is not Official Truth. The function does not accept it and does not build a Rule Claim.

## What landed

- The input is the original #709 envelope, the injected validation clock, and one extraction object or null.
- Extraction may contain only `validFrom`, `validUntil` and `extractionNote`. Each value must be null or a string. Undefined, numbers and objects are `invalid_extraction`. The constructor still decides whether a string is a valid window or a bounded note. `invalid_validity` and `invalid_context` are returned without the rejected text and without a `fields` list.
- Scope, rule-scope key, request key, source id, source class, authority name, publisher name, canonical URL, retrieval time, snapshot, content hashes, decision fields and personal fields in the extraction object are rejected before the constructor sees them.
- The trusted scope copies destination, transit, the citizenship set, the one credential option, residence, requirement type and travel-date validity from the canonical request cell. It does not infer citizenship from the issuing country or from residence. A second passport is a second request.
- A `sourceId` placed on the request scope is not the Evidence source. `regelScopeAusEvidenceScope` drops it. The Evidence `sourceId` is the receipt's validated official source, and the lookup key is the key `evidenceSuchschluessel` computes for that cell plus that source.
- Provenance on the Evidence version is the receipt's canonical URL, `retrievedAt` and `sourceContentHash`. If the constructor result is not candidate/pending, not `official_authority`, or not that provenance, the bridge returns `blocked` and does not return the object.
- The envelope and the extraction object are not mutated.

## Traveller context

One call is one regulatory cell and one selected official source. The cell keeps every citizenship already on the #702 request. The issuing country is the credential option's issuing country, and the related citizenship stays the explicit related code. Another passport, another issuing country, another citizenship set, another destination, another transit country or another residence is another request. This function does not rank those options and does not invent a visa, transit, health, carrier or document rule. No rule result is produced. `blocked` is not `not_required`. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note.

## Boundaries kept

- No edit to the #702 runtime, #705 routing, #708 planning, #709 retrieved material, `source-router.ts`, `source-registry.ts`, `evidence.ts`, `official.ts`, the candidate-batch validator, `provider.ts`, `engine.ts`, Supabase, the source catalog or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No call to `evidenceKandidatAkzeptieren` or `regelKandidatAkzeptieren`. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `27ec55d8eba77c748b47240ddf4588f97acc43b3` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`, which is the task baseline. Merge-base is that SHA. The runtime head was 0 behind and 3 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts` | 8/8 pass |
| `npm test` | 4317 pass / 0 fail, 750 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing store proofs could run. The binary is `/usr/lib/postgresql/16/bin/postgres`. No database outside those throwaway clusters was contacted. This slice did not apply SQL. Development and Production were not touched.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `3f4b1bfd`.
