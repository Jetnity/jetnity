# Official Truth Retrieved Material Receipt Contract 1 — Report

Date: 1 October 2026
Issue: #707
Draft PR: #709
Branch: `feat/official-truth-retrieved-material-receipt-1`
Baseline: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`

Logical agent: **Jetnity Official Truth retrieved material receipt 1**, Generation 1
Session: https://cursor.com/agents/bc-1013f718-e4f9-42a3-9161-1b2e66261b41
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthAbgerufenMaterialPruefen` in `lib/readiness/official-truth-retrieved-material.ts` answers one question: may this already retrieved page be kept as material for this one research request and this one selected official source?

- A valid #702 request, an eligible `official_authority`, a registered HTTPS URL for that same source, a UTC `retrievedAt` not later than the injected clock, and a snapshot inside the existing fingerprint limit return `retrieved_material`.
- The receipt carries `requestKey`, `ruleScopeKey`, `sourceId`, the resolved `canonicalUrl`, `retrievedAt`, the recomputed `sourceContentHash`, and an `EvidenceQuellenmaterial` object.
- That receipt is retrieved material. It is not Candidate Evidence and not Official Truth. It has no rule result and no entry effect.
- A licensed provider, an official source that #705 does not name, a URL that belongs to another registered source, an unregistered, blocked, local, insecure or credential URL, a tracking query, a future or non-Z time, an empty or oversize snapshot, a caller hash, or a second provenance field returns `blocked` and a closed reason. The reason does not contain the snapshot, the credential, or the tracking value.

The function does not retrieve the page.

## What landed

- The input is one envelope: the #702 request, the current registry, the current descriptors, one `sourceId`, and material with `canonicalUrl`, `retrievedAt` and `sourceSnapshot`. The validation clock is a separate injected function. `Date.now` is not used.
- Eligibility is `officialTruthRechercheQuellenRouten`. A caller-built route, `sourceIds` field or other extra field is not accepted. A changed request key is `invalid_request`. A scope that no longer matches its rule-scope key is `scope_mismatch`. An unreadable source plan is `invalid_source_plan`.
- After that bridge answers, the selected registry row must still be `official_authority` and its id must be in the eligible set. A licensed provider is `source_not_official_authority`. Any other selected id is `source_not_eligible`.
- `canonicalUrl` is resolved with `quellenUrlAufloesen`. HTTPS, credentials, localhost, `.local`, blocked hosts and unregistered hosts keep that function's reasons. The stored URL is the resolved canonical URL. A URL that resolves to a different registered source is `url_source_mismatch`.
- Query names `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid` and `mc_eid` are rejected case-insensitively and are not stripped. `lang` and `ref` stay.
- `retrievedAt` must be a complete `Z` instant that `checkedAtLesen` accepts unchanged, including a real calendar date. It must not be later than the injected clock. Equal to the clock is allowed.
- `sourceContentHash` is only `evidenceQuellenFingerprint`. `content`, `contentHash`, `sourceContentHash`, or a `sourceSnapshot` outside the material object, is rejected even when the hash is the correct one. `canonicalUrl` and `retrievedAt` are rejected outside the material object.
- Representative personal and note keys from the research-request set, if present anywhere in the envelope, return `sensitive_personal_field`. The value is not copied. Page text inside a valid snapshot is material, not a traveller credential collected by this function.

## Traveller context

One call is one regulatory cell and one selected official source. The cell is the request #702 already built: one explicit credential option, or no document, plus the citizenship set already on that cell. Another passport, another issuing country, another citizenship set, another destination, another transit country or another residence is another request. This function does not rank those options and does not invent a visa, transit, health, carrier or document rule. No eligible official source stays blocked. It does not become `not_required`. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note.

## Boundaries kept

- No edit to the #702 runtime, #705 routing, `source-router.ts`, `source-registry.ts`, `evidence.ts`, `official.ts`, the candidate-batch validator, `provider.ts`, `engine.ts`, Supabase, the source catalog or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No Candidate Evidence, no `evidenceKandidatAusModell`, no `evidenceKandidatAkzeptieren`, no `regelKandidatAkzeptieren`, no `official_truth_store_accepted_v1`, no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `6bbf3be6b9a968ad95d7634e67f5f7fbf9d93a5f` before this docs commit. `git fetch origin main` in this session resolved the stale snapshot pin `0e62a532831e0711aad3bde645b239edea674705` to `e32c60e9f9d2bdc9db42c80eba6721e59e5120df`. Merge-base is that SHA. The implementation head was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-retrieved-material.test.ts` | 15/15 pass |
| `npm test` | 4299 pass / 0 fail, 748 suites |
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

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `e32c60e9`.
