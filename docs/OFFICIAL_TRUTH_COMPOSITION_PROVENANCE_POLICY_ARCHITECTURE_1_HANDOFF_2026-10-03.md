# Official Truth Composition Provenance Policy Architecture 1 — Handoff

Date: 3 October 2026
Issue: #800
Draft PR: #801
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Task: `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_TASK_2026-10-03.md`
Task-seed head: `9897d7a19dd7626f6aea10a75dd75923f46d57d6`
Logical agent: **Jetnity Official Truth composition provenance policy architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
Session URL: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
`originalModelName`: `grok-4.7-high-fast`

Status: **architecture delivered / Draft / STOP for independent Technical-Lead exact-head review**

The review head is the branch tip that contains this handoff. Re-fetch that tip. Do not review the task-seed SHA `9897d7a19dd7626f6aea10a75dd75923f46d57d6` as the architecture head.

## Read this, in order

1. Live `origin/main`, `.jetnity/operating-mode.json`, Issue #751, and #748 comments newer than marker `5971622750`.
2. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_REPORT_2026-10-03.md`
4. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

The task seed stays as dispatched. This session did not edit it.

## What was decided

Composition policy authority is a code-owned immutable registry. Production stays empty. The match key is structural: fact kind, requirement type, exact source-id set, source family, schema family, applicability schema. Citations distinguish generic invariants from policy assignments. `joint_complete_fact` is the only completeness value. Caller policy is refused. Composed quality with zero policies stays `composition_policy_unavailable` before HTTP. Branched composed acceptance stays fail-closed. Schema-1 facts stay non-persistable. F8 stays open.

Classification: `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`.

## What the next runtime slice may own, after Technical-Lead PASS and a new task

- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`
- narrow caller-policy rejection in the same-request proof server
- narrow empty-registry pre-HTTP gate in the same-request extraction server
- narrow caller-policy rejection in the extractor framework

It does not register a real policy, edit `regelKandidatAkzeptieren`, persist a claim, or implement F8. This handoff does not dispatch that slice.

## Boundaries that remain

- Machine mode at authoring: `NORMAL`.
- Active writer: this Draft. Do not select another Official Truth slice while #801 is the active writer.
- #748 marker: `5971622750`. No newer MATERIAL at authoring.
- Production extractor registry: empty.
- No source family proven. GOV.UK ETA remains an adversarial shape, not a registered policy.
- Production Official Truth catalog/store apply: Product-Owner gate. Not taken.
- Provenance retention: unnamed duration, no migration.
- CH-01..CH-10 stay research-only. CH-11 was not started. #626 was not touched.
- Cursor does not mark Ready and does not merge.

## Validation at authoring

- `origin/main` after the closing fetch: `aca8f811b2c9820fadc4df6c4756c424a983324c`
- Ahead/behind before the architecture commit: 1 ahead / 0 behind
- `git diff --check`: PASS
- `npm run check:operating-mode`: `operating-mode guard: PASS`
- Runtime tests, typecheck, lint, and production build were not run. No runtime file changed.

## Exact next step

Technical Lead re-reads live main, #751, and #748 after this head, then independently reviews the exact #801 tip. Agent self-review is not PASS. Same session if the review is CHANGES REQUIRED on this slice. No follow-up slice from this agent.
