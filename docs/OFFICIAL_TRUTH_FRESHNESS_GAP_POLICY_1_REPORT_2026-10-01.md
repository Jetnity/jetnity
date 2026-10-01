# Official Truth Freshness and Gap Policy 1 — Report

Date: 1 October 2026
Issue: #685
Draft PR: #687
Branch: `feat/official-truth-freshness-gap-policy-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`

Logical agent: **Jetnity Official Truth freshness and gap policy 1**, Generation 1
Session: https://cursor.com/agents/bc-d935cad0-43b7-419f-a9a7-32935c34ef86
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthAbdeckungBewerten` in `lib/readiness/official-truth-coverage.ts` answers one question: for one canonical rule-scope key and one fact kind, is there exactly one accepted claim whose accepted support is still fresh at an injected reference time?

The closed result is `current`, `missing`, `recheck_needed` or `invalid`. A missing claim stays `missing`. The module has no requirement effect and does not emit a travel permission.

## What landed

- Input is the requested `rule-scope:v1:` key, the requested `RegelFaktArt`, zero or one claim, support rows limited to freshness metadata, an injected reference time, and an optional `maxAgeMs`.
- No claim, with a well-formed request, is `missing`. A candidate support row left beside an empty claim does not fill that gap.
- A claim must be `accepted` and `valid`, and its key and fact kind must match the request. Anything else is `invalid`, not a gap and not an effect.
- Every support id on the claim must occur exactly once in the support list. Missing, duplicate, extra, malformed, or over-long support is `invalid`. Support order does not change the result. Returned ids are sorted.
- Each support row must use the same rule-scope key and be `accepted` plus `valid`. Candidate, pending, rejected, conflicted and superseded support is `invalid`.
- Timestamps reuse `checkedAtLesen` and `gültigkeitszeitLesen`. A date-only validity instant is midnight UTC, which is the existing parser's reading.
- `retrievedAt` after the reference time is `invalid`. There is no clock-skew allowance.
- `validFrom` after the reference time, and `validUntil` before the reference time, are `recheck_needed`. Equality with the reference time stays inside the window.
- `maxAgeMs` is applied only when the caller supplies a finite number greater than zero. Age must be strictly greater than that value. An absent `maxAgeMs` does not invent a TTL and does not call `officialCheckedAtMaxAgeMs`.
- `sourceId` is checked against the same shape as `sourceIdLesen`. It is not resolved in a source registry and not looked up in a catalog.
- Personal-identifier keys use the same denylist as `rule-claims.ts`, because that set is module-private. The typed input also cannot name those fields. A fact payload on the claim is an unexpected field and is not read.

## Traveller context

The requested key is one regulatory cell. This module does not choose among citizenships, documents, issuing countries or residences. A gap on one key says nothing about another key. Route Truth stays outside this file.

## Boundaries kept

- No edit to `official.ts`, `evidence.ts`, `rule-claims.ts`, `provider.ts`, `engine.ts`, Supabase, the schema scanner, the source catalog, or global continuity.
- No database, network, provider, OpenAI, cron, queue, UI or public API.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

Re-read on this working tree before the commit. `git fetch origin main` moved the stale snapshot pin `7c3dc2835622355d3dd8f5fb9efa4b3e63899b9e` to `9c494110196a2877f6eba3babe7cf5ae7c00acf1`. Merge-base is that SHA. The branch was 0 behind and 1 ahead (the task seed) before this commit.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-coverage.test.ts` | 21/21 pass |
| `npm test` | 4199 pass / 0 fail, 734 suites |
| `npm run typecheck` | pass |
| eslint on the two new files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the new files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1` and `official_truth_store_accepted_v1`. This slice did not add an RPC. |

The first full `npm test` in this VM failed only in `official-truth-store-server.test.ts` because `/usr/lib/postgresql/16/bin/initdb` was absent. That file was not edited. PostgreSQL 16 was installed in the VM, and the rerun above is the recorded result. No database outside that throwaway cluster was contacted.

## Exact-head gates

GitHub CI, the Auth job and Vercel Preview for the pushed tip are not properties of this prose. They are read after the push. Do not copy run `36905794178` from baseline `9c494110`.
