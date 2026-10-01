# Official Truth Freshness and Gap Policy 1 — Self-Review

Date: 1 October 2026
Issue: #685
Draft PR: #687
Branch: `feat/official-truth-freshness-gap-policy-1`

Logical agent: **Jetnity Official Truth freshness and gap policy 1**, Generation 1
Session: https://cursor.com/agents/bc-d935cad0-43b7-419f-a9a7-32935c34ef86
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `9c494110196a2877f6eba3babe7cf5ae7c00acf1` is the task seed plus:

- `lib/readiness/official-truth-coverage.ts`
- `lib/readiness/official-truth-coverage.test.ts`
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_REPORT_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_HANDOFF_2026-10-01.md`
- `docs/OFFICIAL_TRUTH_FRESHNESS_GAP_POLICY_1_SELF_REVIEW_2026-10-01.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids it. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added.

## What I checked in the contract

- No claim returns `missing` and the JSON has no permission word. A candidate row in `support` does not change that.
- A claim that is only a candidate, or whose validation is not `valid`, returns `claim_not_accepted`.
- Fact-kind and rule-scope mismatches return `invalid`. They are not treated as a gap.
- Support must match the claim id set exactly. Missing, duplicate, extra, empty and nine-id input fail. A malformed id outranks a duplicate, in either list order.
- Reversing support order keeps the same status and the same sorted id list.
- Candidate, pending, rejected, conflicted and superseded support return `support_not_accepted`.
- Malformed `retrievedAt`, reference time and validity windows return `invalid`. `retrievedAt` one millisecond after the reference time is `retrieved_at_in_future`. The same instant is allowed. There is no five-minute skew.
- `validFrom` after the reference time is `recheck_needed` and outranks `max_age_exceeded`. `validUntil` before the reference time is `recheck_needed`. Equal endpoints stay `current`.
- A retrieval from 2020 with no `maxAgeMs` stays `current`. Age equal to `maxAgeMs` stays `current`. One millisecond over it is `recheck_needed`. Zero, negative, `NaN`, infinity and `null` are `invalid_max_age`.
- The module source does not call `officialFrische` or `officialCheckedAtMaxAgeMs`, and it does not import the engine, the provider or the store writer.
- Personal-identifier fields are absent from the input type and rejected at runtime. The denylist strings are the same set as `PERSONEN_SCHLUESSEL` in `rule-claims.ts`.
- A `fact` object attached to the claim is `unexpected_fields` and is not copied into the result.
- The input object is not mutated.

## Boundary choices a reviewer should see

1. `maxAgeMs` uses a strict greater-than. The task says "exceeded". `officialFrische` uses `>=` and also clamps to a one-hour ceiling. This module does not reuse that ceiling. Equality stays `current`.
2. Future `retrievedAt` has no clock skew. The task states that future retrieval is `invalid`.
3. Date-only `validFrom` / `validUntil` become midnight UTC through `gültigkeitszeitLesen`. A date-only end on the reference calendar day is already before a noon reference time.
4. `sourceId` is a shape check only. This slice has no registry argument and does not open the source catalog.
5. The policy does not call `regelKandidatAkzeptieren`. It re-checks the freshness fields of an already narrow claim. A caller can still pass a hand-built object with `lifecycle: 'accepted'`. That is outside this function. The store writer remains the place that accepts only `regelKandidatAkzeptieren` output.
6. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
7. `requirementsProviderAus()` is still `null`. This slice does not turn the policy on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route or the store calls this function. That is the task boundary. A later orchestration slice must keep `missing` distinct from a permission and must not invent a TTL when the caller omitted `maxAgeMs`.
2. The personal-identifier denylist is copied because `rule-claims.ts` does not export it. The test fails if a key from that set disappears from this file. A new key added only in `evidence.ts` would not be picked up, because the evidence set is a subset of the claim set today.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on the working tree before this commit. `origin/main` is `9c494110196a2877f6eba3babe7cf5ae7c00acf1`. Merge-base is that SHA. The branch is 0 behind.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-coverage.test.ts`: 21/21 pass.
- `npm test`: 4199 pass / 0 fail. 734 suites. The earlier run in this VM failed one store proof because `initdb` was not installed. The recorded run is after PostgreSQL 16 was present at `/usr/lib/postgresql/16/bin`. The store test file was not changed.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the two existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The head after this commit is the branch tip. Its GitHub CI, Auth job and Vercel Preview are the gate. They are not written here in advance. Do not copy baseline run `36905794178`.

## Stop

No Ready. No merge. No Supabase apply. No import. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
