# Official Truth Composition Policy Runtime Foundation 1 — Report

Date: 3 October 2026
Issue: #802
Draft PR: #803
Branch: `feat/official-truth-composition-policy-runtime-foundation-1`
Baseline: `main@daf87a2abe510c3c93d9a9a975b3114aca9c065f`
Task: `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_TASK_2026-10-03.md`
Task-seed head: `7957158bb8cfb64013412541682372597ea6a3f9`
Runtime commit: `afa673d43d1bdbacf02f7054c3c6796dab604570`
Correction commit: `0c5ed000` — CR-1, CR-2, CR-3
Logical agent: **Jetnity Official Truth composition policy runtime foundation 1**, Generation 1
Session: https://cursor.com/agents/bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6
`originalModelName` of the first delivery: `grok-4.7-high-fast`. Not Auto.
`originalModelName` of this correction: `claude-opus-5-thinking-high` — **Claude Opus 5 High**. Not Auto, not Grok. The Product Owner granted an explicit model-continuity exception for this correction because the Grok quota is exhausted. The model was verified before the first material edit.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip after the documentation commit that contains this file. This report is not Ready and not a merge. A commit cannot name its own SHA. Re-fetch the branch tip before review.

## Head `70b0bb37` is superseded

Head `70b0bb37b30f63afd28a50d9cfde95d7ccb3ce54` is **not PASS**. The Technical Lead required three corrections in PR comment `#5973512798`. The section "Technical-Lead corrections" below records how each one was implemented. Every statement in the older sections of this report that describes the phase-B pipeline, observations, or the seal is superseded by that section.

The task file was not rewritten. `.jetnity/operating-mode.json`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, and Issue #751 were not edited. The Technical Lead owns those current-state surfaces.

## Classification

**COMPOSITION_POLICY_RUNTIME_FOUNDATION_READY_FOR_INDEPENDENT_REVIEW**

The dormant runtime foundation is implemented. Both production registries stay empty. No real policy, no real extractor, no legal outcome, no acceptance, no store, no F8, and no Production Official Truth apply landed.

## Live baseline

Closing re-read immediately before the runtime commit:

| Check | Result |
| --- | --- |
| `git fetch origin main` | `daf87a2abe510c3c93d9a9a975b3114aca9c065f` — `Merge #801: composition provenance policy architecture` |
| Ahead / behind versus that SHA | 0 behind. This branch adds the task seed plus the runtime commit. |
| Machine mode | `NORMAL` in `.jetnity/operating-mode.json` |
| Issue #751 active writer | This agent, Generation 1, Draft PR #803, this branch, this baseline, session `bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6` |
| #748 comments with id greater than `5971622750` | None. The latest comment is the marker itself. |
| Open PRs | #803 is the only Official Truth writer. #28, #39, #40, #50, and #52 remain historical drafts and do not touch this slice. |
| Writer collision | None. |

## Exact changed files

Runtime commit `afa673d43d1bdbacf02f7054c3c6796dab604570`:

- `lib/readiness/official-truth-composition-policy-registry.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts`
- `lib/readiness/regulierungs-anwendbarkeit.ts`
- `lib/readiness/regulierungs-anwendbarkeit.test.ts`
- `lib/readiness/official-truth-same-request-proof-server.ts`
- `lib/readiness/official-truth-same-request-proof-server.test.ts`
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`
- `lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts`

The documentation commit adds only this report, the handoff, and the self-review. `lib/readiness/rule-claims.ts` was not edited.

## Production registry state

`OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY` is `Object.freeze([])`.
`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` remains `Object.freeze([])`.

Synthetic policies and extractors exist only as test fixtures passed into `officialTruthCompositionRegistriesPruefen`, phase A, phase B, or the same-request dependency slots `compositionPolicies` / `compositionExtractors`. The live entry `loadOfficialTruthSameRequestTrustedFactExtraction` does not pass those slots.

## Phase A proves no HTTP for empty and ambiguous cases

Same-request extraction calls `officialTruthCompositionRegistriesPruefen` and `officialTruthCompositionPhaseA` before the retrieval loop when evidence quality is `composed_from_multiple_primary_sources`.

Phase A reads only the frozen proof fact kind, requirement type, sorted source ids, canonical support URLs, and the code-owned definitions. It does not read content type, a parsed fact, an applicability schema, or a caller policy.

Proven fail-closed results before `retrieve`:

- empty production registries → `composition_policy_unavailable`, with the test double's retrieval list length 0;
- URL outside the only candidate allowlist → `domain_or_path_not_allowlisted`, retrieval length 0;
- two URL-eligible current extractors injected past load → `ambiguous_policy`;
- load of two current extractors that share `(factKind, sourceIds)` → `duplicate_extractor_match`, including a pair that differs only by content type;
- load of two current policies that share the pre-HTTP key and differ only by `applicabilitySchema` → `duplicate_policy_match`.

There is no first-match. Content type is not a selector.

## Phase B proves no re-selection

After retrieval, `officialTruthCompositionPhaseB` verifies only the frozen extractor id/version and policy id/version.

- A content type outside the frozen allowlist returns `content_type_not_allowlisted` and the same frozen policy id. Match is not called.
- A parsed schema that misses the frozen pin returns `schema_mismatch` with the same policy id and version. No second definition is loaded.
- Retrieval source id, final URL, and content hash must still match the same-request proof.
- One distinct source id returns `same_source_composition` before match and extract.
- A repeated source id inside a larger set returns `ambiguous_structure` before match and extract.
- An observed value whose target has no assignment returns `policy_field_unassigned`.
- A second source on a `single_source` target returns `duplicate_value`. Disagreeing canonical values return `conflicting_value`.

## Locator identity is support-stable

`regulierungsAusdruckStrukturSchluessel` omits `supportVersionIds` at every depth and sorts `all` / `any` children by that support-free key. The fact schema is unchanged. No atom id is stored on the fact.

The checker walks `branch:<id>/` plus `(all|any|not):<index>/` and `(all|any):tie:<base>:<tieIndex>/`. Structurally different atoms keep their locators when support ids swap. Structurally identical atoms match by a bijection from embedded support version ids to projected assignment version ids. A non-atomic structural tie, a missing locator, an unassigned locator, a duplicate locator, an omitted tie-group support, and a support id outside the branch all fail closed.

## Fake seals fail

`OfficialTruthCompositionExecutionSeal` is a module-private class. Its constructor is not exported. `isOfficialTruthCompositionSeal` is `instanceof` that class. A plain object and `JSON.parse(JSON.stringify(seal))` both fail. The seal is created only after phase B and citation checks succeed. It is not an acceptance result and not a bearer token. `regelKandidatAkzeptieren` is not imported.

## Explicit-primary behavior

`explicit_primary_statement` still retrieves, then calls the existing extractor entry with `policy: null`. Its success status remains the previous material result. The new status `same_request_composition_bound` is returned only for a composed fixture that passes phase B. Production composed input never reaches that status while the registries are empty.

## Composed Production remains blocked before retrieval

With both production registries empty, composed quality returns `composition_policy_unavailable` from phase A and does not call `retrieve` or `extract`.

## Gates not crossed

No acceptance call, no autonomous composer, no store call, no F8, no migration, no Supabase apply, no Auth/RLS change, no provider, no model, no live government fetch, and no Production Official Truth catalog write.

## Validation

Recorded on the runtime tree before the documentation commit. `npm run typecheck` includes `next typegen && tsc --noEmit`.

| Check | Result |
| --- | --- |
| `git diff --check` | Clean |
| `npm run check:operating-mode` | PASS |
| Targeted readiness suites | PASS — composition registry, same-request extraction, proof server, extractor registry, applicability |
| `npm test` | PASS — 4615 tests, 0 fail. The first run failed two throwaway PostgreSQL proofs with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16 was installed in this VM only. The rerun on the final tree passed 4615/4615. No repository file changed for that install. |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 149 pre-existing warnings |
| `npm run build` | PASS — Next.js 16.3.8 production build. Setup check warned that no `.env` file is present in this VM. |

## Technical-Lead corrections on head `70b0bb37`

Correction commit `0c5ed000`. Changed files: `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` and its test, `lib/readiness/official-truth-composition-policy-registry.ts` and its test, `lib/readiness/official-truth-same-request-extraction-server.ts` and its test. The task seed and both production registries are untouched.

### CR-1 — one canonical extractor execution pipeline

The composition-policy module no longer calls `match`, `extract`, or `regelFaktKanonischLesen`. The extractor framework now owns a single private pipeline, `definitionAusfuehren`, which builds the frozen context, runs the matcher, runs the extractor, reads the observations, and runs the canonical parser. Both entries use it:

- `ausfuehren`, the existing explicit-primary and legacy path, calls it with `beobachtungenPflicht: false` and `faktMarkerVerboten: false`. Its behavior and its success shape are unchanged.
- `officialTruthExtractorEingefroreneAusfuehrung`, the new narrow server-only seam, calls it with both flags true.

The seam takes an already selected and frozen definition. It performs no registry lookup and no content-type reselection: it binds every support through the same `stuetzeBinden` the framework already uses, re-validates the definition with `definitionLesen`, requires the frozen `(policyId, policyVersion)` pin, checks the source set, the URL allowlist, and `definition.contentTypes` against the observed type, and only then executes. A content type outside the frozen allowlist blocks before the matcher runs.

Phase B is now provenance verification around that one call. It compares the fresh supports with the same-request proof before execution (`support_binding_mismatch`, `source_url_changed_since_evidence`, `source_changed_since_evidence`), calls the seam, then repeats the comparison against the framework-bound supports, which are the authoritative values. `OfficialTruthCompositionSperrgrund` now extends `OfficialTruthTrustedFactExtractorSperrgrund`, so no framework reason is translated or lost. The atom-marker guard (`atomKey`, `atomLocator`, `atomId` in the raw extraction) moved into the one pipeline, where it runs on the raw output before canonical parsing, exactly as before — but now in a single place.

A structural test asserts that the composition-policy source contains no `.match(`, no `.extract(`, no `regelFaktKanonischLesen`, no `officialTruthExtractorMedienTyp`, and no `OfficialTruthExtractorKontext`.

### CR-2 — source-attributed parsed observations are mandatory

`observedTargetValues` is gone. There is no caller-facing observation parameter anywhere: not on `officialTruthCompositionPhaseB`, not on the same-request dependency object, not in the request. Observations are produced only by the code-owned extractor's `extract()` return value and are validated by `beobachtungenLesen` inside the framework:

- the key set must be exactly `targetKey`, `sourceId`, `canonical`;
- `sourceId` must be one of the sources bound fresh in this execution, otherwise `source_not_allowlisted`;
- an absent, non-array, or empty list is `fact_incomplete`;
- more than 256 entries is `snapshot_bound_exceeded`.

`schrittGrund` only accepts the `observations` key when observations are required, so the explicit-primary path still rejects an extractor that returns one.

`zitatePruefen` now checks unconditionally, with no branch that can skip it:

| Order | Condition | Reason |
| --- | --- | --- |
| 1 | no observations at all | `fact_incomplete` |
| 2 | an observed target has no assignment | `policy_field_unassigned` |
| 3 | an assignment has no observation | `fact_incomplete` |
| 4 | an observed source is not named by that assignment | `duplicate_value` |
| 5 | the same source is observed twice for one target | `duplicate_value` |
| 6 | a source named by the assignment is missing | `fact_incomplete` |
| 7 | the canonical values for one target disagree | `conflicting_value` |

Rules 3 and 6 together give `equal_values` completeness; rule 7 gives `equal_values` equality. `single_source` is the degenerate case of one named source, so rules 4 to 6 still apply.

Required same-request integration tests, all in `official-truth-same-request-extraction-server.test.ts`:

1. conflicting per-source values block — `conflicting_value`;
2. an out-of-assignment source value blocks — `duplicate_value`;
3. `equal_values` with one source missing blocks — `fact_incomplete`;
4. `equal_values` agreement succeeds — `same_request_composition_bound`;
5. a missing and an empty observation list can never return `same_request_composition_bound` — `fact_incomplete` in both cases, with the extractor proven to have run.

### CR-3 — immutable fact inside the seal

The seam returns a deeply frozen result, so the canonical fact is already immutable when it leaves the one pipeline. Phase B then calls `tiefEinfrieren` on that exact object and asserts `tiefGefroren` before constructing the seal; a fact that is not deeply frozen blocks with `unexpected_fields`. Both helpers recurse without a depth cap and use a visited set, so a deep applicability tree is fully covered and a cycle terminates.

The seal binds that exact object. Its private state is now a single frozen view object, so `view()` returns the same frozen structure every time and exposes nothing else. Adversarial tests prove: top-level mutation of the sealed fact throws and does not change it; nested object and array mutation throws and does not change it (`branches.push` and `branches[0].id = …`); repeated `view()` returns the identical fact object; a structural lookalike and a JSON round-trip are rejected by `isOfficialTruthCompositionSeal` and `officialTruthCompositionSealView`; booleans and strings are rejected. No caller hash, witness, boolean, or bearer can replace the seal.

### Validation of the corrected head

Recorded on the correction tree before the documentation commit.

| Check | Result |
| --- | --- |
| `git diff --check` | Clean |
| `npm run check:operating-mode` | PASS |
| Targeted CR-1 / CR-2 / CR-3 suites | PASS — composition registry 16/16, same-request extraction 30/30, extractor registry 42/42 |
| `npm test` | PASS — 4630 tests, 770 suites, 0 fail |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors, 149 pre-existing warnings |
| `npm run build` | PASS — Next.js production build, no working-tree drift afterwards |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | PASS |

Task seed `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_TASK_2026-10-03.md` is byte-identical to its introducing commit `7957158b`. `OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY` and `OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` are both still `Object.freeze([])`. The branch diff against `main` touches only `lib/readiness/**` and the four `docs/OFFICIAL_TRUTH_COMPOSITION_POLICY_RUNTIME_FOUNDATION_1_*` files: no migration, no Supabase, no Auth or RLS, no route, no store, no provider, no model, no F8, no CH import, no launch or indexing change.

## Stop

Draft remains Draft. Ready was not set. Merge was not performed. No follow-up slice was started. Agent self-review is not Technical-Lead PASS.
