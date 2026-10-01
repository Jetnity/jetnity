# Official Truth Demand-Driven Research Request Contract 1 — Report

Date: 1 October 2026
Issue: #700
Draft PR: #702
Branch: `feat/official-truth-research-request-contract-1`
Baseline: `main@a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`

Logical agent: **Jetnity Official Truth research request contract 1**, Generation 1
Session: https://cursor.com/agents/bc-49bea35f-5d38-4697-8097-792a24b8bfe8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthRechercheEntscheiden` in `lib/readiness/official-truth-research-request.ts` answers one question: given an existing coverage result and the existing rule scope for that same cell, is research allowed?

- `current`, and the scope key matches, yields `{ action: 'none', reason: 'current' }`. There is no research request.
- `missing` yields one bounded request for that cell and fact kind.
- `recheck_needed` yields one bounded request and keeps the exact coverage reason: `valid_from_in_future`, `valid_until_elapsed` or `max_age_exceeded`.
- `invalid` stays `{ action: 'blocked_invalid' }` with the coverage reason. It is not rewritten as a gap and it is not researched.

The function does not call `officialTruthAbdeckungBewerten`. It consumes that result. A missing or stale cell never becomes an entry effect.

## What landed

- The scope is read only through `regelScopeAusEvidenceScope`. Country-code order, case and surrounding spaces follow that parser. This module does not define a second scope.
- The returned scope is one `RegelScope`: destination and transit stay separate, the full citizenship set stays on the cell, and one credential option stays one option. Residence and validity stay because they are already part of that cell and of `rule-scope:v1:`.
- Several credential options are several calls. This function does not rank a passport or a citizenship.
- Issuing country, residence and destination are not copied into another field. A missing credential option, a missing citizenship and an airport list are blocked. They are not filled in.
- The request key is `research-request:v1:` plus the SHA-256 of the canonical rule-scope key, the fact kind, and the research reason. `missing` and each recheck reason get different keys. No clock and no random id is used.
- `evidenceClass` is always `official_authority`. It is not an input. No provider, domain or URL is selected.
- Personal-identifier keys use the same denylist as `rule-claims.ts`. Free-form note keys are rejected as well. Forbidden values are not copied into the decision.
- A coverage cell whose key is not the key of the supplied scope is `research_scope_mismatch`. That includes a `current` cell paired with a different scope. `none` is only returned for the same cell.

## Traveller context

This contract is traveller-relevant and non-personal. One call is one regulatory cell, which is one explicit credential option plus the full citizenship set already on that cell. Another passport, another issuing country, another citizenship set, another destination, another transit country, another residence or another travel date is another key. Route Truth stays outside this file. The function does not watch context changes; a changed cell is a new coverage result and a new call. It stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, account id or free-form note.

## Boundaries kept

- No edit to `official-truth-coverage.ts`, `evidence.ts`, `rule-claims.ts`, `provider.ts`, `engine.ts`, Supabase, the source catalog or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI or public API.
- No Candidate Evidence, no `evidenceKandidatAkzeptieren`, no `regelKandidatAkzeptieren`, no `official_truth_store_accepted_v1`, no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Re-read on this working tree before the docs commit. `git fetch origin main` in this session resolved the stale snapshot to `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`. A later fetch in the same session still showed that SHA. The branch was 0 behind. Re-fetch before treating any later SHA as current.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-research-request.test.ts` | 14/14 pass |
| `npm test` | 4259 pass / 0 fail, 745 suites |
| `npm run typecheck` | pass on the cast-fixed tree |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

The first `npm run typecheck` and the first `npm run build` failed in the test file only: hostile fixtures needed a cast through `unknown`. The runtime file was not part of that error. The recorded typecheck, build and full test are the runs after that cast fix. PostgreSQL 16 was installed in this VM so the store proofs could run. No database outside those throwaway clusters was contacted.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy a baseline run id from `a3af1fea`.
