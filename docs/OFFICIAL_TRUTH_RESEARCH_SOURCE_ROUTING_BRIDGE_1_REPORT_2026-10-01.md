# Official Truth Research Request Source-Routing Bridge 1 — Report

Date: 1 October 2026
Issue: #704
Draft PR: #705
Branch: `feat/official-truth-research-source-routing-bridge-1`
Baseline: `main@0e62a532831e0711aad3bde645b239edea674705`

Logical agent: **Jetnity Official Truth research source-routing bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-7874834e-9d85-4110-8e95-f4c444a7845f
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthRechercheQuellenRouten` in `lib/readiness/official-truth-research-source-routing.ts` answers one question: for this exact research request, which already-registered `official_authority` source IDs are eligible?

- A matching official authority returns `eligible_official_sources` and the sorted unique source IDs.
- A matching licensed provider, alone or beside an official authority, never becomes eligible. A mixed registry returns only the official authorities whose coverage matches.
- No matching official coverage returns `no_eligible_official_source` with an empty ID list. That is not an entry effect and not `not_required`.
- A request that is not the request #702 would build, or a source plan `quellenRouten` rejects, returns `blocked_invalid`.

The function does not execute research.

## What landed

- The input is an already-built `OfficialTruthRechercheAnfrage`. A raw traveller object, an account or trip id, a passport number, a model-made scope and a URL are rejected. The decision does not copy those values.
- The request is proven by calling `officialTruthRechercheEntscheiden` again with the request's own rule-scope key, fact kind and research reason. The private research-request hash stays in #702. This file does not reimplement it. A changed key, fact kind, research reason, evidence class or scope is blocked.
- `ruleScopeKey` must still be the key `regelScopeAusEvidenceScope` computes for the embedded scope. That check is the public reader. There is no second scope constructor.
- Coverage is `quellenRouten`. Destination stays destination, transit stays transit, citizenship keeps the existing exact and full-set behaviour, an explicit document stays exact, the issuing country is not citizenship, and residence stays separate. An empty coverage list is not a wildcard. Missing coverage stays no source.
- After the router answers, only registry entries with `sourceClass === 'official_authority'` remain. Source order is alphabetical stability. Duplicate IDs are removed. That order is not a preference and not a provider ranking.
- The routed cell must still hash to the same rule-scope key. Fact kind and research reason are copied onto the decision and do not change the source IDs.
- `evidenceClass` on a accepted request stays `official_authority`. A caller cannot switch the request to a licensed provider.

## Traveller context

One call is one regulatory cell: one explicit credential option, or no document, plus the citizenship set already on that cell. Another passport, another issuing country, another citizenship set, another destination, another transit country or another residence is another request. This function does not rank those options and does not invent a visa, transit, health or document rule. No official source stays unknown. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email or account id.

## Boundaries kept

- No edit to the #702 runtime, `source-router.ts`, `source-registry.ts`, `evidence.ts`, the candidate-batch validator, `provider.ts`, `engine.ts`, Supabase, the source catalog or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No Candidate Evidence, no `evidenceKandidatAkzeptieren`, no `regelKandidatAkzeptieren`, no `official_truth_store_accepted_v1`, no `official_truth_source_catalog_v1`.
- No URL is returned. `quellenUrlAufloesen` is not called.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Local gates below were run on `c53bfcfc` before this docs commit. `git fetch origin main` in this session resolved the stale snapshot to `0e62a532831e0711aad3bde645b239edea674705`. A later fetch, after the gates, still showed that SHA. Merge-base is that SHA. The branch was 0 behind and 2 ahead. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-research-source-routing.test.ts` | 12/12 pass |
| `npm test` | 4284 pass / 0 fail, 747 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing store proofs could run. No database outside those throwaway clusters was contacted. This slice did not apply SQL.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `0e62a532`.
