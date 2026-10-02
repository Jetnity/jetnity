# Official Truth Rule Review Packet 1 — Report

Date: 2 October 2026
Issue: #722
Draft PR: #723
Branch: `feat/official-truth-rule-review-packet-1`
Baseline: `main@708a77defa5092e43d5dec991aa09a77e34822db`

Logical agent: **Jetnity Official Truth rule review packet 1**, Generation 1
Session: https://cursor.com/agents/bc-30066140-adb9-4bc2-8d94-b16353b0f5cd
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## Result

`officialTruthRegelReviewPacket` in `lib/readiness/official-truth-rule-review-packet.ts` builds one internal review packet. It does not mint truth.

The input is `{ supports, metadata }`.

Each support is `{ umschlag, uhr, extraktion }`:

- `umschlag` is the original #709 retrieval envelope;
- `uhr` is the injected validation clock;
- `extraktion` is the #713 extraction metadata.

`metadata` is only `factKind`, `evidenceQuality` and `proposal`, the bounded input accepted by #717.

For every support the function:

1. calls #716 `officialTruthAkzeptierteEvidenceAusAbruf` and requires `accepted_evidence`;
2. independently calls #709 `officialTruthAbgerufenMaterialPruefen` and requires retrieved material;
3. requires the same `sourceId`, rule-scope key, canonical URL, retrieval time and content hash, and `sourceClass` `official_authority`.

It then calls #717 `officialTruthRegelKandidatAusEvidence` with only those re-proven Evidence versions, the registry image from those envelopes, and the bounded metadata. The returned candidate must be `candidate` / `pending`. Its support ids must be exactly the sorted re-proven version ids. Every support's rule-scope key must be that candidate key.

Success is:

- `status: 'rule_review_packet'`;
- `kandidat`, the object #717 returned;
- `supports`, sorted by `versionId`, each with `versionId`, `sourceId`, `canonicalUrl`, `retrievedAt`, `sourceContentHash` and `sourceSnapshot`.

There is no reviewer decision, no accepted Rule Claim, and no trusted rule fact. `sourceSnapshot` is the re-proven public authority page text for review. The packet does not say the proposal is true and does not say the support proves it.

## What landed

- One official `.example` support plus an explicit proposal returns a packet whose candidate deep-equals a direct #717 call on the re-proven Evidence. Lifecycle stays `candidate`. Validation state stays `pending`. Citizenship in the synthetic cell stays `CH` and `RS`. The credential option stays the Swiss passport.
- Two official supports, `gov.example` and `interior.example`, with a composed proposal return one packet. Reversing the input does not change it. Support version ids equal the candidate's sorted support ids. The two source ids stay distinct.
- A `research_gap` metadata object with a null proposal returns a packet. The quality stays `research_gap`. The proposal stays null. The same quality with a non-null proposal fails `research_gap_proposal_forbidden` and returns no packet.
- Caller-built Evidence, a caller-built candidate, a receipt, support version ids and a trusted-fact object fail as extra fields. The marker and `not_required` are absent from the failure.
- A candidate Evidence object, a receipt used as the envelope, a licensed `provider.example` source, a caller hash, an empty snapshot and a future retrieval time fail with the same reason as #716. Those paths do not return a packet.
- A second credential option, issuing country `RS` and related citizenship `RS`, fails `scope_mismatch`. The failure does not contain the country codes.
- The same support twice fails `support_mismatch`. An empty list fails `invalid_support`. Nine supports fail `support_bound_exceeded`. The input arrays stay unchanged.
- Two envelopes whose registry JSON differs fail `invalid_source_plan`. Two snapshots from the same official source with composed quality fail `same_source_composition` and the failure has no candidate.
- Representative personal and note keys in the metadata, the envelope, the extraction and the support shell fail closed. The value and the key name are absent from the result.
- The envelope, the extraction, the metadata and the clock function are left as they were passed.

## Traveller context

One packet is one regulatory cell. The cell keeps the full citizenship set on the re-proven Evidence. In the synthetic fixture that set is `CH` and `RS`, sorted by the existing scope reader. The issuing country stays the credential option's issuing country, and the related citizenship stays the explicit related code. A second passport is a different rule key and fails `scope_mismatch`. This function does not choose a preferred passport, does not infer citizenship from the issuing country, and does not invent a visa, transit, health, carrier or document rule. `research_gap` keeps a null proposal. No passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id or traveller note is copied into the result. Public authority page text in `sourceSnapshot` stays review material.

## Boundaries kept

- No edit to `evidence.ts`, `rule-claims.ts`, the source registry, the source router, #709, #713, #716, #717, the store, or the source catalog.
- No database, network, provider, OpenAI, browser, UI or public API.
- No call to rule acceptance. No trusted rule fact. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`. This module does not call it.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `d8ae295e6fdfea01e649ca95c95e2694a13e7d24` before this docs commit. `git fetch origin main` in this session resolved `origin/main` to `708a77defa5092e43d5dec991aa09a77e34822db`, which is the task baseline. Merge-base is that SHA. The branch was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

This VM did not have PostgreSQL 16 when the session started. PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. Package setup initialized a local cluster and did not start it. The suite then created its own temporary clusters through `/usr/lib/postgresql/16/bin/initdb`. No remote database was contacted. This slice did not add or apply SQL. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-rule-review-packet.test.ts` | 11/11 pass |
| `npm test` | 4359 pass / 0 fail, 754 suites |
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

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a run id from the baseline `708a77de`.

## Stop

No Ready. No merge. No Rule acceptance. No model review. No store, RPC, DB, provider or network path.

**STOP for independent Technical-Lead review of the exact branch tip.**
