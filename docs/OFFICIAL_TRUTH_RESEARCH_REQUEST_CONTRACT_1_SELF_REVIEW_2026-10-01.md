# Official Truth Demand-Driven Research Request Contract 1 — Self-Review

Date: 1 October 2026
Issue: #700
Draft PR: #702
Branch: `feat/official-truth-research-request-contract-1`

Logical agent: **Jetnity Official Truth research request contract 1**, Generation 1
Session: https://cursor.com/agents/bc-49bea35f-5d38-4697-8097-792a24b8bfe8
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8` is the task seed plus:

- `lib/readiness/official-truth-research-request.ts`
- `lib/readiness/official-truth-research-request.test.ts`
- `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_RESEARCH_REQUEST_CONTRACT_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. No canonical type in `evidence.ts`, `rule-claims.ts` or `official-truth-coverage.ts` was edited. The task said to stop if one of those types had to change. It did not.

## What I checked in the contract

- A real `officialTruthAbdeckungBewerten` result of `current` becomes `none`. Reversed support-id order stays `none`.
- A real missing result becomes one request with `researchReason.status === 'missing'`, fact kind preserved, and `evidenceClass === 'official_authority'`.
- A real `recheck_needed` result keeps the exact reason string. `missing` and the three recheck reasons produce four different keys.
- `invalid` stays blocked with the coverage reason, including when the supplied scope is a different country. The other country is not copied into the decision. The result is not a research request.
- A hand-built status `not_required`, and an extra `effect` field, are blocked. The decision JSON does not contain that word.
- The same cell with reversed citizenship order, lower-case country codes and a source id produces the same request key. The returned scope has no `sourceId`. Both citizenships remain, sorted by the existing parser.
- Destination, transit, citizenship set, document type, issuing country, explicit related citizenship, residence, requirement type and travel date each change the key.
- An issuing country does not become citizenship. Residence does not become citizenship. A destination does not become transit. An omitted credential option does not become a passport. An airport list is `unexpected_fields` and is not stored as not applicable.
- Two credential options are two requests. Each still carries the full citizenship set. Neither result has a primary or preferred marker.
- Representative forbidden keys and a nested passport number are `personal_identifier_forbidden`. The secret value is absent from the decision. A canonical URL on the scope is blocked and is not copied.
- A scope that hashes to a different rule key is `research_scope_mismatch`, not a research of that other scope.
- A `current` object with an empty support list is `coverage_unreadable`, not `none` and not research.
- The input object is not mutated.
- The runtime file does not call the coverage function, the acceptance functions, the store RPC, the catalog RPC or `requirementsProviderAus`. It does not import the engine, the provider, the store server or the catalog server. Its source has no provider name, no URL and no entry-effect word.

## Boundary choices a reviewer should see

1. `none` requires a matching scope. A `current` coverage cell paired with a different scope is blocked. Returning `none` there would claim the wrong cell is current.
2. A forbidden identifier blocks even when coverage says `current` or `invalid`. The decision does not echo the forbidden value. Privacy refusal is not a research request and not a repair.
3. A well-formed `invalid` coverage result is returned before the scope is parsed into a request. A broken scope beside that result does not replace the coverage reason and does not start research.
4. The coverage contract emits one recheck reason, the highest-ranked one. This request preserves that one value. It does not invent a reason list and it does not merge `missing` with `recheck_needed`.
5. Residence and travel date stay on the request because `RegelScope` and `rule-scope:v1:` already include them. Dropping them would be a second scope model. They are not inferred when absent.
6. `evidenceClass` is the constant `official_authority`. A caller cannot switch it to a licensed provider. No source id, domain or URL is minted.
7. The research key commits to the existing rule-scope key, the fact kind and the research reason. Fact kind is not inside the rule-scope key, so two facts on one cell do not collide. Support version ids are not part of the key. `current` has no request key.
8. A hand-built `current` with a malformed support list is `coverage_unreadable` rather than `none`. The coverage function would not return that object as `current`.
9. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
10. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later orchestration slice must call it once per credential option, must keep a blocked result distinct from a gap, and must not map the request onto Sherpa, Timatic, KAYAK or an entry effect.
2. The personal-identifier denylist is copied because `rule-claims.ts` does not export it. The test fails if a key from that set disappears from this file. Note keys are an additional local set: `extractionNote`, `travellerNote`, `traveller_note`, `note`, `comment`, `freeText`, `freeform`.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on the working tree before this docs commit. `origin/main` is `a3af1fea1e2cdcb461c9d65a913d653dfe467ce8`. Merge-base is that SHA. The branch is 0 behind.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-research-request.test.ts`: 14/14 pass.
- `npm test`: 4259 pass / 0 fail. 745 suites. Run after the test-file cast fix. PostgreSQL 16 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed.
- `npm run typecheck`: pass after the cast fix. The earlier failure was only the hostile fixtures' direct casts.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass after the cast fix.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The head after this commit is the branch tip. Its GitHub CI, Auth job and Vercel Preview are the gate. They are not written here in advance. Do not copy a baseline run from `a3af1fea`.

## Stop

No Ready. No merge. No Supabase apply. No import. No research adapter. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
