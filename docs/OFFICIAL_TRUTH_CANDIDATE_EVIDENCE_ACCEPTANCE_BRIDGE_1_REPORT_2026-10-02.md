# Official Truth Candidate Evidence Acceptance Bridge 1 — Report

Date: 2 October 2026
Issue: #714
Draft PR: #716
Branch: `feat/official-truth-candidate-evidence-acceptance-bridge-1`
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`

Logical agent: **Jetnity Official Truth candidate evidence acceptance bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-8dbb1a52-e186-4f2c-b61a-b6f077b894e6
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthAkzeptierteEvidenceAusAbruf` in `lib/readiness/official-truth-accepted-evidence.ts` answers one question: can this original retrieval envelope become one accepted Evidence version through the existing acceptance function?

- The function calls `officialTruthKandidatEvidenceAusAbruf` again with the original envelope, the injected clock and the extraction. A caller-built Evidence object is not an input.
- `candidate_evidence` is required. The nested version must still be `candidate` / `pending` / `official_authority`, with the closed Evidence and scope fields, before acceptance runs.
- The registry is read only after that, and only from the same envelope. It is not rebuilt.
- Acceptance is only `evidenceKandidatAkzeptieren(kandidat.evidence, registry)`.
- Success is `accepted_evidence`. The nested object is the object that function returned. Lifecycle is `accepted`, validation state is `valid`, and source class is `official_authority`. Source, scope, canonical URL, `retrievedAt` and content hash stay the candidate's values. So do version id, lookup key, authority, publisher, validity window and extraction note.
- A blocked #713 result is returned unchanged. An acceptance failure or a provenance mismatch is a closed reason. `fields` from the acceptance function are not copied back.

Accepted Evidence here is provenance acceptance. It is not a Rule Claim and it is not an entry effect. The function does not persist it.

## What landed

- The input is the original #709 envelope, the injected validation clock, and the bounded extraction metadata already accepted by #713.
- A valid envelope and null or empty extraction return accepted official Evidence. `akzeptierteEvidenceLesen` returns that object. The candidate built by a separate #713 call stays `candidate` / `pending`, and `akzeptierteEvidenceLesen` on that candidate returns null.
- `validFrom`, `validUntil` and a trimmed `extractionNote` stay the constructor's values. The version id and content hash match the empty-window acceptance.
- A caller-built candidate, an accepted-shaped copy, the #713 result wrapper, and an envelope that carries an extra `evidence` field all fail with the same closed #713 reason. The hash is not echoed.
- A changed request, a scope that no longer matches its rule-scope key, a caller hash, an empty snapshot, a future `retrievedAt`, a missing clock, a reversed validity window, or a forbidden extraction field fails with the #713 reason.
- Personal and traveller-note keys fail as `sensitive_personal_field` without the value and without the key name.
- Two requests that differ only by passport issuing country, CH versus RS, both keep the citizenship set `CH` and `RS`. Their lookup keys differ. Transit `TH` and residence `DE` stay on that request. The issuing country is not used as the only citizenship.
- The envelope and the extraction object are not mutated. The accepted JSON has no rule-effect key and no `not_required`, `conditional`, `optionEligibility`, `optionMandate`, `visaMode` or `trustedRuleFact` text.

## Traveller context

One call is one regulatory cell and one selected official source. The cell keeps every citizenship already on the #702 request. The issuing country is the credential option's issuing country, and the related citizenship stays the explicit related code. Another passport, another issuing country, another citizenship set, another destination, another transit country or another residence is another request. This function does not rank those options and does not invent a visa, transit, health, carrier or document rule. No rule result is produced. `blocked` is not `not_required`. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note.

## Boundaries kept

- No edit to #709, #713, `evidence.ts`, `rule-claims.ts`, the source registry, the source router, the store, the catalog, or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No call to `regelKandidatErstellen` or `regelKandidatAkzeptieren`. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `d10ef0f2ae0e54380bc561d734679f464ade6c53` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `16f3a8d631bb823c9daafc724df67c000dcb5985`, which is the task baseline. Merge-base is that SHA. The runtime head was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-accepted-evidence.test.ts` | 8/8 pass |
| `npm test` | 4338 pass / 0 fail, 752 suites |
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

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `16f3a8d6`.
