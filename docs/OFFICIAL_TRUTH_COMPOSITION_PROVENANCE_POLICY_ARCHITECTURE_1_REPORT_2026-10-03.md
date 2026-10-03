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

This report is the author record of the CR correction. A Technical-Lead PASS requires an independent exact-head review of the branch tip after this commit. This report is not Ready and not a merge. The review head is the tip that contains this report. A commit cannot name its own SHA. Re-fetch before review.

Head `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b` is CHANGES REQUIRED under comments `#5971822658` and `#5972072800`. It is not the review head.

The task file was not rewritten. `.jetnity/operating-mode.json`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, and Issue #751 were not edited. The Technical Lead owns those current-state surfaces.

## Classification

**COMPOSITION_POLICY_FOUNDATION_READY_FOR_RUNTIME_SLICE**

The citation contract, the two-phase selector, the atom locator, the autonomous seal boundary, and the empty-registry pre-HTTP gate are specified. No legal source sentence was required. The first runtime slice named in the architecture stays inside server TypeScript, keeps both production registries empty, and does not cross a Product-Owner gate.

F8 stays open. Branched composed acceptance stays `condition_provenance_ambiguous`. Schema-1 persistence stays `applicability_not_persistable`. No source family is registered. This correction implements no runtime.

## Live baseline

`git fetch origin main` resolved `origin/main` to `aca8f811b2c9820fadc4df6c4756c424a983324c`, message `Merge #799: wire canonical schema-1 applicability safely`. That is the task baseline. The task-seed commit is `9897d7a19dd7626f6aea10a75dd75923f46d57d6`. The first architecture commit is `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b`.

`.jetnity/operating-mode.json` has `"mode": "NORMAL"`.

Issue #751 names this agent, Generation 1, Draft PR #801, this branch, this baseline, and session `bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0` as the active writer. Its processed #748 marker is `5971622750`. The closing re-read is recorded in Validation. No writer collision was found at authoring. The seed was executed, not replaced.

## Hard facts re-proved

| Expected observation | Live result |
| --- | --- |
| Production extractor registry is empty | Proven. `Object.freeze([])`. |
| Same-request extraction blocks composed quality before HTTP | Proven. `composition_policy_unavailable` at the composed-quality branch of `decideOfficialTruthSameRequestTrustedFactExtraction`. |
| Extractor definitions already carry `sourceFamilyId` and `schemaFamily` | Proven on `OfficialTruthExtractorDefinition`. Those fields are code-owned. They are not read from the HTTP response. |
| Live extractor selection uses observed content types | Proven. `ausfuehren` keeps definitions whose `contentTypes` cover the observed types, and returns `ambiguous_structure` when more than one remains. Phase A does not copy that filter. |
| `applicabilitySchema` is not known before extraction | Proven. It is a property of the parsed fact. The pre-HTTP key does not include it. |
| Extractor framework policy assignments are caller-shaped | Proven, and insufficient. Assignments are `{ fieldPath, sourceId }` parsed from the caller `policy` input. |
| Schema-1 atoms have no atom id | Proven. An atom is `{ op: 'atomic', predicate, supportVersionIds? }`. `extract` success is the fact. |
| `normalisieren` sorts operands with support ids included | Proven. The sort key is `JSON.stringify(ausdruckObjekt(...))`. The structural-key export must not reuse that order. |
| Schema-1 branched acceptance blocks composed provenance | Proven. `bedingungsHerkunftPruefen` returns `condition_provenance_ambiguous` before it inspects citations. |
| Same-source composition remains forbidden | Proven in the extractor and in `regelKandidatAkzeptieren`. |
| All schema-1 facts remain non-persistable | Proven. `persistierbarenClaim` rejects every schema-1 fact before transport. |
| `regelKandidatAkzeptieren` does not read a policy or a seal | Proven. Its input keys are `kandidat`, `trustedRuleFact`, `evidenceVersions`, and `registry`. |
| F8 remains open | Proven on #751. This slice does not implement it. |
| Production Official Truth DB/catalog apply remains a Product-Owner gate | Proven on #751. No database was contacted. |

## What the correction decides

**CR-1.** Selection is two-phase. Phase A, before any retrieval socket, uses the frozen proof (`factKind`, `requirementType`, source ids, canonical URLs) and the code-owned extractor definitions (`sourceFamilyId`, `schemaFamily`, `urlAllowlist`). Zero candidates stay `composition_policy_unavailable`. A URL miss on the only candidate is `domain_or_path_not_allowlisted`. More than one URL-eligible current extractor is `ambiguous_policy`. There is no first-match and no content-type tie-break. Load time rejects two current extractors that share `(factKind, sourceIds)` as `duplicate_extractor_match`, and two current policies that share the pre-HTTP key as `duplicate_policy_match`, including a pair that differs only by `applicabilitySchema`. Phase B verifies the frozen pair. A content type outside the frozen list is `content_type_not_allowlisted`. A parsed schema that misses the pin is `schema_mismatch`. Neither result selects another policy.

**CR-2.** Atom identity is a locator derived from the normalized schema-1 tree. The fact gains no `atomKey`. `extract` still returns only `{ ok: true, fact }`. The structural key omits `supportVersionIds` at every depth and sorts `all` / `any` operands by that support-free key, so the live support-inclusive operand sort cannot move an index. A unique locator resolves to the one node at that path. Structurally identical atoms stay distinct by a bijection of embedded `supportVersionIds` to projected assignment version ids. A non-atomic structural tie is `atom_locator_duplicate`. Missing, unassigned, and duplicate locators fail closed before provenance. The policy stores locators and source ids, not predicate bodies.

**CR-3.** `regelKandidatAkzeptieren` stays the only claim constructor. Its `ok: true` does not prove that a policy ran. Authorized human fact entry remains a direct call, is not routed through phase A, and is not widened. Branched composed quality remains `condition_provenance_ambiguous` on that path. A legacy composed acceptance stays a human-path result. The autonomous path may treat a branched composed fact as policy-backed only through a later composer that holds a module-private class seal bound to the server-produced fact reference. A plain object or a JSON body cannot construct that seal. The composer returns `policy_binding_missing` and does not call acceptance when the seal check fails. No same-request module calls `regelKandidatAkzeptieren`. This pull request does not add the composer and does not implement F8.

Generic citation invariants stay defense in depth. They do not read the policy registry. The composed blanket stays until a later acceptance slice. That slice is not F8, and replacing the blanket still does not make the pure function prove policy execution.

The later provenance record's minimum identifiers are named. Retention, migration, and Production apply are not decided.

## Traveller context

The pre-HTTP key does not choose among citizenships, documents, issuing countries, or residence. The proof's scope key remains one regulatory cell, including the full citizenship set and one credential option. A second option is a later invocation. No traveller fact is collected. Unknown stays unknown. No visa, transit, or exemption outcome is encoded. GOV.UK ETA remains source variables N and A.

## Validation

Recorded immediately before the correction commit. The review head is the tip after that commit. Head `5a5245eccb6b7f7c5f7f57ccda21e4112c84c58b` is the rejected head.

| Check | Result |
| --- | --- |
| `git fetch origin main` | `aca8f811b2c9820fadc4df6c4756c424a983324c` |
| Ahead / behind versus that SHA | 0 behind. The correction commit is an additional ahead commit on this branch. |
| #751 active writer | This branch, PR #801, Generation 1, session `bc-bebba19d-e9c1-49fd-8ef5-504f8449cfd0` |
| #748 comments newer than `5971622750` | None at the closing re-read. |
| Machine mode | `NORMAL` |
| `git diff --check` | PASS on the staged correction before commit. |
| `npm run check:operating-mode` | `operating-mode guard: PASS` |
| Task seed bytes | Unchanged against `9897d7a19dd7626f6aea10a75dd75923f46d57d6`. |
| `npm test`, typecheck, lint, production build | Not run. No runtime bytes changed. Those gates are not claimed. |
| Production database | Not queried. |

Changed files against `main` remain the four required outputs plus the pre-existing task seed. This session does not modify the task seed.

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review of the new tip. Do not Ready, merge, or open a follow-up from this session. Agent self-review is not Technical-Lead PASS.
