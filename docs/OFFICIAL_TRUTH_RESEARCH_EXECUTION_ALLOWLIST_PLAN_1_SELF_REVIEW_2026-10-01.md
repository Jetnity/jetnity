# Official Truth Research Execution Allowlist Plan 1 — Self-Review

Date: 1 October 2026
Issue: #706
Draft PR: #708
Branch: `feat/official-truth-research-execution-allowlist-plan-1`

Logical agent: **Jetnity Official Truth research execution allowlist plan 1**, Generation 1
Session: https://cursor.com/agents/bc-157efd04-cbc8-4fe1-8475-13d1efdb5edb
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `e32c60e9f9d2bdc9db42c80eba6721e59e5120df` is the task seed plus:

- `lib/readiness/official-truth-research-execution-plan.ts`
- `lib/readiness/official-truth-research-execution-plan.test.ts`
- `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_EXECUTION_ALLOWLIST_PLAN_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-research-request.ts`, `official-truth-research-source-routing.ts`, `source-router.ts`, `source-registry.ts` and `evidence.ts` were not edited. The task said to stop if this plan needed a change to those contracts. It did not. Eligibility stays inside #705. Hostname checks use the exported `domaeneNormalisieren`. The registry's private host relation is repeated here as the same one-line comparison, because exporting it would have edited the registry.

## What I checked in the plan

- A real #702 request for a cell covered by one synthetic official authority returns that source ID and `gov.example` only. `stay_limit` / `missing` and `visa_options` / `max_age_exceeded` return the same hostnames and different request keys.
- Two official IDs come back in alphabetical order when the descriptor list is reversed. Their hostnames stay with the matching source.
- The same coverage on a licensed provider alone returns `no_eligible_official_source`. The provider ID and hostname are not in the plan.
- A mixed registry returns the official plan and drops the licensed ID and hostname.
- An exact blocked hostname, a hostname under a blocked name, a non-normalized hostname, a duplicated source id, a repeated hostname, an empty hostname list, an unreadable block list, and a descriptor whose publisher no longer matches the registry each return `blocked_invalid` and do not echo the hostname.
- Several registered hostnames are emitted sorted, including when the hand-built row listed them in another order. The input row is not rewritten.
- A destination swapped under the old rule-scope key is `scope_mismatch`. A changed request key or evidence class is `invalid_request`. A raw traveller object that also carries a source-id list is blocked and does not copy the person or the id. A canonical URL on the scope is blocked and not copied. The request, registry, and descriptor JSON are unchanged.
- A `canonicalUrl` hung on the descriptor is not copied. The plan still has only the registry hostname.
- A Swiss passport cell receives only the Swiss authority hostname. A Serbian passport against that Swiss source is `no_eligible_official_source`. A source limited to another destination is also no source. Neither result is `not_required`.
- The runtime file does not contain `not_required`, a direct `quellenRouten(` call, `officialTruthRechercheEntscheiden`, a candidate or claim constructor, a store or catalog RPC, `requirementsProviderAus`, `quellenUrlAufloesen`, or an engine, provider, evidence, store, or catalog import. Its source has no provider name, no URL, and no network call. The #702 import is `import type` for the research-reason shape.

## Boundary choices a reviewer should see

1. Licensed providers are removed by calling #705 again, not by a second coverage matcher. This file does not call `quellenRouten`. An invalid descriptor still fails inside #705 before any hostname is read.
2. There is no input for a pre-built #705 decision. The only call is `officialTruthRechercheQuellenRouten(anfrage, registry, deskriptoren)`.
3. Hostnames come from the registry row whose `sourceId` matches once. The descriptor is not a second domain list. A URL field on that descriptor is ignored.
4. One bad hostname fails the whole plan. A blocked name is not omitted from an otherwise `ready` list. An empty list is not `ready`.
5. A hostname under a blocked registry name is blocked. The comparison is exact host or a longer name that ends with `.<blocked>`. Emitting `border.example` does not grant `www.border.example` unless that second name is itself on the registry row.
6. Source order and hostname order are alphabetical. That is not a preference, a default source, or a passport ranking.
7. `ready` and `no_eligible_official_source` carry the #705 request identity. `blocked_invalid` carries only status and reason, so a tampered value is not echoed. `no_eligible_official_source` has no `sources` field.
8. An unreadable block list fails even when #705 would have said there is no eligible source. A block list that cannot be checked must not look like a clean no-source answer.
9. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
10. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser, or the store calls this function. That is the task boundary. A later orchestration slice must call it once per research request, must keep `blocked_invalid` distinct from no source, and must not map the hostnames onto Sherpa, Timatic, KAYAK, a fetch URL, a path, a query, or an entry effect.
2. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `bd87a593d4ba9107d5f6aeedd987448dcba6661f` before this docs commit. `origin/main` is `e32c60e9f9d2bdc9db42c80eba6721e59e5120df`. Merge-base is that SHA. The branch was 0 behind and 3 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-research-execution-plan.test.ts`: 10/10 pass.
- `npm test`: 4294 pass / 0 fail. 748 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `e32c60e9` or from `bd87a593`.
