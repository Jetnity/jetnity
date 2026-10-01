# Official Truth Research Execution Allowlist Plan 1 — Report

Date: 1 October 2026
Issue: #706
Draft PR: #708
Branch: `feat/official-truth-research-execution-allowlist-plan-1`
Baseline: `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`

Logical agent: **Jetnity Official Truth research execution allowlist plan 1**, Generation 1
Session: https://cursor.com/agents/bc-157efd04-cbc8-4fe1-8475-13d1efdb5edb
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## R1 correction

Technical-Lead R1 `5386675895` on `a390cd9fe357841ed035858a0eb63dbcc7caefe3` accepted the plan and required R1-F1 only.

A registered hostname and a blocked hostname now fail the whole plan when they overlap in either direction. `gov.example` with blocked `blocked.gov.example` is `blocked_invalid`. `sub.gov.example` with blocked `gov.example` is `blocked_invalid`. An unrelated blocked hostname leaves that source plan intact. A sibling hostname on the same row is not kept. The plan emits no wildcard, path, or query.

`main@0842f9854a1362e9fc71dfe22f0c49617c122e65` (#709) is integrated and unchanged. The retrieved-material receipt is not this slice.

## Result

`officialTruthRechercheAusfuehrungsplan` in `lib/readiness/official-truth-research-execution-plan.ts` answers one question: for this exact research request, which already-registered `official_authority` hostnames may be named before any fetch?

- A matching official authority returns `ready`, the request identity, and one plan per source: `sourceId` plus that registry row's normalized hostnames.
- Two matching official authorities return those plans in source-id order. Hostname order inside a plan is alphabetical. That order is stability, not a ranking and not a default source.
- A matching licensed provider, alone, returns `no_eligible_official_source`. The provider id and its hostname are absent.
- A mixed registry returns only the official plan. The licensed id and hostname are absent.
- A blocked hostname, a hostname under a blocked name, a non-normalized hostname, a repeated hostname, an empty hostname list, a duplicated source id, or an unreadable block list returns `blocked_invalid`. The plan does not drop the bad name and keep the rest.
- A request #705 would reject returns the same block reason. The output does not copy the tampered value.
- No plan contains a URL, a path, a query, a page list, or a discovery suggestion.

The function does not execute research.

## What landed

- The input is the same triple #705 already accepts: an `OfficialTruthRechercheAnfrage`, the current Source Registry, and the current source descriptors. There is no parameter for a caller-built routing decision. `officialTruthRechercheQuellenRouten` is called again.
- Request identity on `ready` and on `no_eligible_official_source` is the #705 identity: `requestKey`, `ruleScopeKey`, `factKind`, and `researchReason`. Fact kind and research reason stay on that identity and do not choose a source.
- For every returned source id, the registry row must exist once, `sourceClass` must be `official_authority`, and every hostname must already be the normalized registry string. Hostnames are read from that registry row, not from the descriptor.
- `no_eligible_official_source` has request identity and no `sources` field. It is not `not_required` and not an entry effect.
- `blocked_invalid` is only status and reason.

## Traveller context

One call is one regulatory cell: one explicit credential option, or no document, plus the citizenship set already on that cell. Another passport, another issuing country, another citizenship set, another destination, another transit country, or another residence is another request. This function does not rank those options and does not invent a visa, transit, health, or document rule. No official source stays unknown. The issuing country is not treated as citizenship. Route Truth is not rebuilt here. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, or account id.

## Boundaries kept

- No edit to the #702 runtime, the #705 runtime, `source-router.ts`, `source-registry.ts`, `evidence.ts`, the candidate-batch validator, `provider.ts`, `engine.ts`, Supabase, the source catalog, or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI, or public API.
- No Candidate Evidence, no `evidenceKandidatAkzeptieren`, no `regelKandidatAkzeptieren`, no `official_truth_store_accepted_v1`, no `official_truth_source_catalog_v1`.
- No URL is returned. `quellenUrlAufloesen` is not called. `quellenRouten` is not called from this file.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

The first delivery gates were on `bd87a593d4ba9107d5f6aeedd987448dcba6661f` against `main@e32c60e9f9d2bdc9db42c80eba6721e59e5120df`: focused tests 10/10, `npm test` 4294 pass / 0 fail. Those numbers are not the R1 gate.

R1 gates below were run on `d2680c57a7e989122fbf3f5cdad31a43be304a6a` after the #709 merge and before this docs commit. `git fetch origin main` resolved `origin/main` to `0842f9854a1362e9fc71dfe22f0c49617c122e65`. Merge-base is that SHA. That head was 0 behind. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-research-execution-plan.test.ts` | 10/10 pass |
| `npm test` | 4309 pass / 0 fail, 749 suites |
| `npm run typecheck` | pass |
| eslint on the two slice files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the slice files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

PostgreSQL 16.15 was installed in this VM so the existing store proofs could run. No database outside those throwaway clusters was contacted. This slice did not apply SQL.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a run id from `a390cd9f` or from `0842f985`.
