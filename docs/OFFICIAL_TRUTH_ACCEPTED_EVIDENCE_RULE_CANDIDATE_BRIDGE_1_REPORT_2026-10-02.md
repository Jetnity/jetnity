# Official Truth Accepted Evidence → Rule Candidate Bridge 1 — Report

Date: 2 October 2026
Issue: #715
Draft PR: #717
Branch: `feat/official-truth-accepted-evidence-rule-candidate-bridge-1`
Baseline: `main@16f3a8d631bb823c9daafc724df67c000dcb5985`

Logical agent: **Jetnity Official Truth accepted Evidence rule candidate bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-2dc2eeae-983e-4e63-a2cc-0125b9b32fe4
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

`officialTruthRegelKandidatAusEvidence` in `lib/readiness/official-truth-rule-candidate.ts` answers one question: can these already accepted Evidence versions and this bounded research metadata become one existing rule candidate?

- Every version must pass `akzeptierteEvidenceLesen` against the current Source Registry, be `official_authority`, and map through `regelScopeAusEvidenceScope` to one shared rule key.
- Scope, key and support version ids are taken from those accepted versions. Support ids are sorted before the constructor sees them.
- Caller metadata is only `factKind`, `evidenceQuality` and `proposal`. `regelKandidatErstellen` builds the `RegelKandidat`. This file returns that object on success.
- A valid explicit case is `candidate` / `pending`. A composed case with two distinct official sources keeps both sorted support ids. `research_gap` with a non-null proposal fails `research_gap_proposal_forbidden`. Stale, conflict and gap stay those qualities and stay pending candidates.

The result is a research candidate. This function does not accept a Rule Claim.

## What landed

- One call takes the Evidence array, the current registry, and the three metadata fields.
- A candidate or otherwise unaccepted version fails `evidence_not_accepted`. A licensed provider that already passes `akzeptierteEvidenceLesen` fails `primary_source_required`.
- Two official versions whose rule keys differ fail `scope_mismatch`. A repeated version id fails `support_mismatch`. An empty array fails `invalid_support`, because the cell has to come from accepted Evidence.
- `scope`, `key`, `supportVersionIds`, `lifecycle`, `validationState` and `trustedRuleFact` on the metadata fail `unexpected_fields`, including when the values match the derived cell.
- Representative personal and traveller-note keys in the metadata fail `personal_identifier_forbidden`. The result is only `ok` and `reason`.
- For `composed_from_multiple_primary_sources`, fewer than two supports is the constructor's `insufficient_support`. Two supports from one official source are `same_source_composition`, and that result has no candidate. Two distinct official sources keep both version ids, so a later acceptance review can still see both sources.
- The Evidence array, the registry and the metadata object are left as they were passed.

## Traveller context

One call is one regulatory cell. The cell keeps the full citizenship set on the accepted Evidence. In the synthetic fixture that set is `CH` and `RS`, sorted by the existing scope reader. The issuing country stays the credential option's issuing country, and the related citizenship stays the explicit related code. A second passport, with issuing country `RS` and related citizenship `RS`, is a different rule key and fails `scope_mismatch`. This function does not choose a preferred passport, does not infer citizenship from the issuing country, and does not invent a visa, transit, health, carrier or document rule. `research_gap` keeps a null proposal. Stale, conflict and gap are not upgraded to an explicit or composed quality. No passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note is copied into the result.

## Boundaries kept

- No edit to `evidence.ts`, `rule-claims.ts`, `source-registry.ts`, the store, the source catalog, or Lane A Evidence acceptance.
- No database, network, provider, OpenAI, browser, UI or public API.
- No call to `regelKandidatAkzeptieren`. No `trustedRuleFact`. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`. This module does not call it.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `8d09efd1d054cbd549f2e7339896a4a2ec37b5e4` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `16f3a8d631bb823c9daafc724df67c000dcb5985`, which is the task baseline. Merge-base is that SHA. The runtime head was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

The first full `npm test` run failed two existing throwaway PostgreSQL proofs with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16.15 was then installed in this VM. The binary is `/usr/lib/postgresql/16/bin/postgres`. The suite was run again and passed. No database outside those throwaway clusters was contacted. This slice did not apply SQL. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-rule-candidate.test.ts` | 10/10 pass |
| `npm test` | 4340 pass / 0 fail, 752 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `16f3a8d6`.
