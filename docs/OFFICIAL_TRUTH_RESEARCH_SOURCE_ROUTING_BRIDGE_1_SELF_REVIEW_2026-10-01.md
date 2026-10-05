# Official Truth Research Request Source-Routing Bridge 1 — Self-Review

Date: 1 October 2026
Issue: #704
Draft PR: #705
Branch: `feat/official-truth-research-source-routing-bridge-1`

Logical agent: **Jetnity Official Truth research source-routing bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-7874834e-9d85-4110-8e95-f4c444a7845f
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `0e62a532831e0711aad3bde645b239edea674705` is the task seed plus:

- `lib/readiness/official-truth-research-source-routing.ts`
- `lib/readiness/official-truth-research-source-routing.test.ts`
- `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_SOURCE_ROUTING_BRIDGE_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-research-request.ts`, `source-router.ts`, `source-registry.ts` and `evidence.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not. The research-request key is checked by calling the public #702 function, so the private hash did not have to be copied or exported.

## What I checked in the bridge

- A real #702 request for a cell covered by one synthetic official authority returns that source ID only.
- The same coverage on a licensed provider alone returns `no_eligible_official_source`. The provider ID is not in the decision.
- A mixed registry returns the official ID and drops the licensed ID.
- An official source whose destination list is a different country returns no source. A source limited to another requirement type also returns no source.
- A destination cell does not receive a transit-only source, and a transit cell does not receive a destination-only source.
- An issuing country does not satisfy a different citizenship list. A related citizenship does not satisfy a different issuing country. With no document, exact citizenship still requires the full citizenship set. Residence is a separate exact list.
- A national ID, or a passport issued by the other country, does not match the cell's passport.
- Two official IDs come back in alphabetical order when the descriptor list is reversed, and a duplicate descriptor does not duplicate the ID. A licensed ID that would sort between them is absent.
- `stay_limit` / `missing` and `visa_options` / `max_age_exceeded` return the same source IDs and different request keys. The three recheck reasons stay on the decision.
- A destination swapped under the old rule-scope key is `scope_mismatch`. A changed request key, fact kind or evidence class is `invalid_request`. A raw traveller object and a canonical URL on the scope are blocked and not copied. An unregistered source and an empty country list block the plan even when another descriptor would have matched.
- An empty descriptor list is no source, not an official result and not `not_required`.
- The input request JSON is unchanged.
- The runtime file does not contain `not_required`, a candidate or claim constructor, a store or catalog RPC, `requirementsProviderAus`, `quellenUrlAufloesen`, or an engine, provider, evidence, store or catalog import. Its source has no provider name, no URL and no network call.

## Boundary choices a reviewer should see

1. Licensed providers are removed after `quellenRouten`, not by a second coverage matcher. Any non-official class is dropped. An invalid descriptor still fails the whole plan before that filter, including a licensed descriptor with an empty country list.
2. The research-request key is not recomputed here. `officialTruthRechercheEntscheiden` rebuilds the request from the supplied key, fact kind, reason and scope. If that rebuild is not an identical research request, the bridge blocks. The one cast to `RegelScope` is only the call boundary; #702 parses the scope again.
3. The router input is the one credential option already on the proven scope, or `not_applicable` when the cell has no document. No second option is added. If the routed cell key differs from the request, the result is `invalid_source_plan`.
4. Fact kind and research reason are on the decision so two facts for one cell stay distinct. They are not passed to the router as coverage.
5. The decision returns source IDs only. It does not return domains, URLs, publisher names, `officialResult`, or a ranked provider.
6. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
7. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later orchestration slice must call it once per research request, must keep `blocked_invalid` distinct from no source, and must not map the IDs onto Sherpa, Timatic, KAYAK, a fetch URL or an entry effect. Calling `quellenRouten` directly for this request would let a licensed provider through.
2. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `c53bfcfc` before this docs commit. `origin/main` is `0e62a532831e0711aad3bde645b239edea674705`. Merge-base is that SHA. The branch was 0 behind and 2 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-research-source-routing.test.ts`: 12/12 pass.
- `npm test`: 4284 pass / 0 fail. 747 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `0e62a532` or from `c53bfcfc`.
