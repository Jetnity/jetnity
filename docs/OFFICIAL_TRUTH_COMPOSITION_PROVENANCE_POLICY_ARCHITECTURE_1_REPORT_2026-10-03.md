# Official Truth Composition Provenance Policy Architecture 1 — Report

Date: 3 October 2026
Issue: #800
Draft PR: #801
Branch: `docs/official-truth-composition-provenance-policy-architecture-1`
Baseline: `main@aca8f811b2c9820fadc4df6c4756c424a983324c`
Task: `docs/OFFICIAL_TRUTH_COMPOSITION_PROVENANCE_POLICY_ARCHITECTURE_1_TASK_2026-10-03.md`
Task-seed head: `9897d7a19dd7626f6aea10a75dd75923f46d57d6`
Logical agent: **Jetnity Official Truth composition provenance policy architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge. The review head is the tip that contains this report. A commit cannot name its own SHA. Re-fetch before review.

The task file was not rewritten. `.jetnity/operating-mode.json`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, and Issue #751 were not edited. The Technical Lead owns those current-state surfaces.

## Classification

**COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE**

The citation contract, the code-owned registry, and the empty-registry pre-HTTP gate are specified. No legal source sentence was required to specify them. The first runtime slice named in the architecture stays inside server TypeScript, keeps both production registries empty, and does not cross a Product-Owner gate.

F8 stays open. Branched composed acceptance stays `condition_provenance_ambiguous`. Schema-1 persistence stays `applicability_not_persistable`. No source family is registered.

## Live baseline

`git fetch origin main` resolved `origin/main` to `aca8f811b2c9820fadc4df6c4756c424a983324c`, message `Merge #799: wire canonical schema-1 applicability safely`. That is the task baseline. Before these documents, this branch was 1 ahead and 0 behind. The ahead commit is the task seed `9897d7a19dd7626f6aea10a75dd75923f46d57d6`.

`.jetnity/operating-mode.json` has `"mode": "NORMAL"`.

Issue #751 names this agent, Generation 1, Draft PR #801, this branch, this baseline, and session `bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0` as the active writer. Its processed #748 marker is `5971622750`. Issue #748 has 28 comments. None has an id greater than `5971622750`. No newer MATERIAL report exists. No writer collision was found. The seed was executed, not replaced.

## Hard facts re-proved

| Expected observation | Live result |
| --- | --- |
| Production extractor registry is empty | Proven. `Object.freeze([])`. |
| Same-request extraction blocks composed quality before HTTP | Proven. `composition_policy_unavailable` at the composed-quality branch of `decideOfficialTruthSameRequestTrustedFactExtraction`. |
| Extractor framework already has `policyId`, `policyVersion`, and field assignments | Proven, and insufficient. Assignments are `{ fieldPath, sourceId }` parsed from the caller `policy` input. The definition stores only the id, the version, and `requiredFieldPaths`. |
| Schema-1 branched acceptance blocks composed provenance | Proven. `bedingungsHerkunftPruefen` returns `condition_provenance_ambiguous` before it inspects citations. The rule-claim test locks a complementary two-branch fixture to that reason. |
| Same-source composition remains forbidden | Proven in the extractor and in `regelKandidatAkzeptieren`. |
| All schema-1 facts remain non-persistable | Proven. `persistierbarenClaim` rejects every schema-1 fact, including unconditional ones, before transport. |
| F8 remains open | Proven on #751. This slice does not implement it. |
| Production Official Truth DB/catalog apply remains a Product-Owner gate | Proven on #751. No database was contacted. |

Two live details are narrower than a loose reading of the seed:

- The composed acceptance blanket applies when `verzweigteZitate` finds branches. A schema-1 unconditional fact and a legacy fact have no such citations. The legacy composed path is accepted by the current test. The store still refuses schema-1. The same-request path still refuses every composed quality before HTTP, so the autonomous path cannot use the legacy acceptance success.
- `FELD_PFAD` cannot name a branch id or a visa mode, because underscore is outside its alphabet and the depth cap is five segments. Section 12's branch and atom citations do not fit the current assignment object.

The proof guard does not list `policy`, `policyId`, `policyVersion`, or `assignments`. A caller policy on the proof envelope is ignored, not rejected. Extraction never reads it on the live explicit-primary path, and composed quality returns before extraction. The architecture makes the later slice reject those keys before the catalog read.

## What the architecture decides

Authority is a code-owned immutable registry. The production registry is empty. `(policyId, policyVersion)` is immutable. Callers, models, plugins, packets, and research notes do not select it. Zero current matches stay `composition_policy_unavailable` before HTTP. Several current matches are `ambiguous_policy`. There is no first-match.

The match key is fact kind, requirement type, the exact sorted source-id set, source family, schema family, and applicability schema `1` or null. Country and legal outcome are outside the key.

Generic invariants cover citation membership, non-empty branches, subset atoms, no inheritance across two or more sources, and union equality. Every loadable policy declares `joint_complete_fact`, so the union rule is mandatory. Policy-specific data is the slot-to-source assignment, the `single_source` or `equal_values` relation, and a closed role label. The policy stores no predicate body and no effect.

`OfficialTruthExtractorPolitik` stays the old caller-shaped object and is not the authority. Composed provenance is a separate row that can cite one source of a multi-source target. Explicit-primary provenance stays null-policy and unchanged.

Acceptance remains `regelKandidatAkzeptieren`. The policy module is not a second constructor. The composed blanket stays until a later acceptance slice. That slice is not F8. The store guard stays.

The later provenance record's minimum identifiers are named. Retention, migration, and Production apply are not decided.

## Traveller context

The match key does not choose among citizenships, documents, issuing countries, or residence. The proof's scope key remains one regulatory cell, including the full citizenship set and one credential option. A second option is a later invocation. No traveller fact is collected. Unknown stays unknown.

## Validation

Recorded before the documentation commit. The review head is the tip after that commit.

| Check | Result |
| --- | --- |
| `git fetch origin main` | `aca8f811b2c9820fadc4df6c4756c424a983324c` |
| Ahead / behind versus that SHA before these four documents | 1 ahead / 0 behind. The ahead commit is the task seed. |
| #751 active writer | This branch, PR #801, Generation 1, session `bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0` |
| #748 comments newer than `5971622750` | None. 28 comments, marker is the newest. |
| Machine mode | `NORMAL` |
| `git diff --check` | PASS on the four documents before commit. |
| `npm run check:operating-mode` | `operating-mode guard: PASS` |
| `npm test`, typecheck, lint, production build | Not run. No runtime bytes changed. Those gates are not claimed. |
| Production database | Not queried. |

Changed files are the four required outputs plus the pre-existing task seed. The task seed is not modified by this session.

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a follow-up from this session. Agent self-review is not Technical-Lead PASS.
