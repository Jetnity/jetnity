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

Status: **CR-1, CR-2, and CR-3 corrected / Draft / STOP for independent Technical-Lead exact-head review**

The review head is the branch tip that contains this handoff. Re-fetch that tip. Do not review `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b` as the architecture head. That commit is CHANGES REQUIRED under `#5971822658` and `#5972072800`. Do not review the task-seed SHA `9897d7a19dd7626f6aea10a75dd75923f46d57d6` as the architecture head.

## Read this, in order

1. Live `origin/main`, `.jetnity/operating-mode.json`, Issue #751, and #748 comments newer than marker `5971622750`.
2. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_2026-10-03.md`
3. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_REPORT_2026-10-03.md`
4. `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

The task seed stays as dispatched. This session did not edit it.

## What was decided

Composition policy authority is a code-owned immutable registry. Production stays empty.

CR-1. The pre-HTTP key is `factKind`, `requirementType`, the exact sorted source-id set, `sourceFamilyId`, and `schemaFamily`. `sourceFamilyId` and `schemaFamily` are read from the code-owned extractor definition before any socket. `applicabilitySchema` is a pin checked only in phase B. Content type does not select the policy. Zero, URL failure, and more than one URL-eligible extractor fail before HTTP. Phase B does not switch policies.

CR-2. An atom is bound by a locator walked from the normalized schema-1 tree. The structural key omits support ids at every depth and does not follow the stored operand order. Tie groups of equal predicates match by support-id bijection. The fact has no atom id. The policy has no predicate body.

CR-3. `regelKandidatAkzeptieren` remains the only claim constructor and does not prove policy execution. Human fact entry stays a direct call. Autonomous policy-backed success requires a later module-private seal. No same-request module calls acceptance. The composer is not in this pull request. F8 stays open.

`joint_complete_fact` is the only completeness value. Caller policy is refused. Composed quality with zero policies stays `composition_policy_unavailable` before HTTP. Branched composed acceptance stays fail-closed. Schema-1 facts stay non-persistable.

Classification: `COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE`.

## What the next runtime slice may own, after Technical-Lead PASS and a new task

- `lib/readiness/official-truth-composition-policy-registry.ts` — preflight, locator walk, private seal class
- `lib/readiness/official-truth-composition-policy-registry.test.ts` — the section 10 cases that do not call acceptance
- `lib/readiness/regulierungs-anwendbarkeit.ts` — export `regulierungsAusdruckStrukturSchluessel` only
- narrow caller-policy rejection in the same-request proof server
- phase A before `retrieve`, and phase B without a second lookup, in the same-request extraction server
- narrow caller-policy rejection, `duplicate_extractor_match`, and server-held assignments in the extractor framework

It does not register a real policy, edit `regelKandidatAkzeptieren`, add the autonomous composer, persist a claim, or implement F8. This handoff does not dispatch that slice. The acceptance-blanket replacement and the seal-consuming composer are later tasks and are still not F8.

## Boundaries that remain

- Machine mode at authoring: `NORMAL`.
- Active writer: this Draft. Do not select another Official Truth slice while #801 is the active writer.
- #748 marker: `5971622750`. No newer MATERIAL at the closing re-read.
- Production extractor registry: empty.
- No source family proven. GOV.UK ETA remains an adversarial shape, not a registered policy.
- Production Official Truth catalog/store apply: Product-Owner gate. Not taken.
- Provenance retention: unnamed duration, no migration.
- CH-01..CH-10 stay research-only. CH-11 was not started. #626 was not touched.
- Cursor does not mark Ready and does not merge.

## Validation at the correction

- `origin/main` after the closing fetch: `aca8f811b2c9820fadc4df6c4756c424a983324c`
- This branch is 0 behind that SHA
- `git diff --check`: PASS
- `npm run check:operating-mode`: `operating-mode guard: PASS`
- Runtime tests, typecheck, lint, and production build were not run. No runtime file changed.

## Exact next step

Technical Lead re-reads live main, #751, and #748 after the new head, then independently reviews the exact #801 tip. Agent self-review is not PASS. Same session if the review is CHANGES REQUIRED on this slice. No follow-up slice from this agent.
