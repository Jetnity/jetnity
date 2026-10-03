# Official Truth Applicability Canonical Wiring Runtime 1 — Handoff

Date: 3 October 2026
Issue: #798
Draft PR: #799
Branch: `feat/official-truth-applicability-canonical-wiring-1`
Baseline: `main@e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`
Task: `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_TASK_2026-10-03.md`
Task seed: `44fdc9cd` is not the review head.
Guard commit: `37be473d`
Parser commit: `ef0f4d4c`
Logical agent: **Jetnity Official Truth applicability canonical wiring runtime 1**
Generation: **1**
Session: https://cursor.com/agents/bc-2b43f956-a705-4f8a-84c4-38c38645e965
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

The review head is the branch tip that contains this handoff. Re-fetch before review. This handoff is not Ready and not a merge.

## Read first

1. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_TASK_2026-10-03.md`
2. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md`
3. `lib/readiness/official-truth-store-server.ts`
4. `lib/readiness/rule-claims.ts`
5. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_REPORT_2026-10-03.md`
6. this handoff
7. `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_SELF_REVIEW_2026-10-03.md`

Machine mode is `NORMAL`. This slice does not edit `.jetnity/operating-mode.json`.

## Status

One atomic wiring PR. Draft. Stopped for independent Technical-Lead review.

The store guard landed in `37be473d` before the parser widening in `ef0f4d4c`. Both commits are on this branch. Schema-1 facts parse through `regelFaktLesen` and are refused before transport.

## Owned files

Implementation:

- `lib/readiness/official-truth-store-server.ts`
- `lib/readiness/official-truth-store-server.test.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/rule-claims.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts` (importer allowlist only)
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts` (test seam)
- `lib/readiness/official-truth-same-request-extraction-server.test.ts` (test seam)

Delivery:

- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_SELF_REVIEW_2026-10-03.md`

The task seed was already on the branch and was not edited. These source files were not edited: `regulierungs-anwendbarkeit.ts`, the extractor registry, the same-request server. No route, UI, migration, provider, or model file was edited. `docs/ACTIVE_WORK_STATUS.md` was not edited; this handoff is the continuity record for the exact-file task.

## Behaviour a reviewer should re-check

- `regelFaktLesen` is the only semantic parser. Canonical read and acceptance both call it. Their facts deep-equal for the same trusted input.
- Legacy `required` and `not_required` stay successful. Legacy flat `conditional` is `legacy_conditional_without_payload` and the JSON has no `auswertung`.
- Schema-1 unconditional and branched requirement effects parse. A top-level outcome together with branches is `mixed_outcome`.
- Schema-1 unconditional and branched visa options parse. The visa requirement-type gate stays in front of the visa reader.
- `provenance_not_authorized`, `depth_exceeded`, `branch_bound_exceeded`, and `operand_bound_exceeded` pass through `faktGrund`. `node_bound_exceeded` is on that switch and has no separate runtime case here. `context_conflict` maps to `invalid_fact`.
- Four schema-1 shapes accept in memory and the store returns `applicability_not_persistable` with RPC count 0, including when env is empty. A legacy fact with empty env still returns `store_not_configured`.
- Legacy requirement-effect and visa-options store payloads keep their existing JSON shape.
- Production extractor registry is `Object.freeze([])`. The synthetic schema-1 extractor and same-request seams do not persist, do not accept a claim, and do not attach `reg-eval-ctx:v1` or `rule-applicability:v1`.
- The string `regulierungs-anwendbarkeit` is imported from production code only by the module itself and by `rule-claims.ts`.

## Gates

Author gates on `ef0f4d4c`, same run as the report and the self-review, before this documentation commit:

- Focused files listed above: 114 pass / 0 fail / 9 suites.
- `npm test`: 4596 pass / 0 fail / 768 suites.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, 0 errors, 148 pre-existing warnings.
- `npm run build` (Next.js 16.3.8): exit 0. 25 static pages.
- `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: exit 0.
- `check:schema-bezug` still lists the same four LOCAL/UNAPPLIED RPCs. This slice added none.
- `git diff --check`: exit 0.

No remote database was contacted. Nothing was applied. Local PostgreSQL 16 binaries on the agent VM let the existing throwaway `initdb` proof run. The system cluster was not started. Exact-head CI and Vercel belong to the pushed tip.

`origin/main` at the pre-documentation fetch: `e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`. The implementation branch was 0 behind that pin.

## Database, cost, provider

No migration. No RLS change. No service role. No secret. No new running cost. No provider activation. `requirementsProviderAus()` stays as it is on this branch.

## Do not do

Do not Ready. Do not merge. Do not persist schema-1 facts. Do not register a production extractor. Do not evaluate a traveller inside acceptance. Do not add `rule-applicability:v1` to an accepted claim. Do not compute `reg-eval-ctx:v1`. Do not start F8 or a follow-up slice.

## Next step

Independent exact-head Technical-Lead review. Cursor stops.
