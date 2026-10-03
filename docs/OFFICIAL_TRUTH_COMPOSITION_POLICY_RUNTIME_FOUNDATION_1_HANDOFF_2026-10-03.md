# Official Truth Composition Policy Runtime Foundation 1 — Handoff

Date: 3 October 2026
Issue: #802
Draft PR: #803
Branch: `feat/official-truth-composition-policy-runtime-foundation-1`
Baseline: `main@daf87a2abe510c3c93d9a9a975b3114aca9c065f`
Task seed: `7957158bb8cfb64013412541682372597ea6a3f9`
Runtime commit: `afa673d43d1bdbacf02f7054c3c6796dab604570`
Correction commit: `0c5ed000`
Session: https://cursor.com/agents/bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6
`originalModelName` of the first delivery: `grok-4.7-high-fast`
`originalModelName` of this correction: `claude-opus-5-thinking-high` — **Claude Opus 5 High**, under an explicit Product-Owner model-continuity exception because the Grok quota is exhausted. Same logical agent, same PR, same branch, Generation 1.

The review head is the branch tip that contains this handoff. Re-fetch it. Do not review the task-seed commit alone. Head `70b0bb37b30f63afd28a50d9cfde95d7ccb3ce54` is rejected and superseded.

## Where this stopped

The dormant composition-policy runtime foundation plus the three Technical-Lead corrections from PR comment `#5973512798` are on the draft PR and are waiting for an independent Technical-Lead exact-head review. Cursor did not mark Ready, did not merge, and did not open a follow-up slice.

## What the next reviewer must re-prove

1. Live `origin/main` is still `daf87a2abe510c3c93d9a9a975b3114aca9c065f`, or record the new SHA and decide whether this branch must be rebased before review.
2. `.jetnity/operating-mode.json` is still `NORMAL`.
3. Issue #751 still names this writer, and no #748 comment id is greater than `5971622750`.
4. No second Official Truth writer owns `lib/readiness/official-truth-composition-policy-registry.ts` or the same-request extraction files.
5. Both production registries are still empty frozen arrays.
6. Composed production input returns `composition_policy_unavailable` before retrieval.
7. Explicit-primary success shape is unchanged.
8. The seal check rejects a plain object and a JSON round-trip.
9. `regelKandidatAkzeptieren`, the store, Supabase, and F8 are untouched.
10. CR-1: the composition-policy module contains no matcher, extractor, or canonical-parser call, and the one seam performs no registry lookup and no content-type reselection.
11. CR-2: no exported function, dependency slot, or request field can supply or omit observations, and no success path skips the completeness, equality, conflict, and duplicate checks.
12. CR-3: the fact is deeply frozen before the seal is constructed, the seal binds that exact object, and the view exposes only it.

## What is intentionally absent

- a real composition policy;
- a real source extractor or government URL family;
- legal outcome or exemption semantics;
- the autonomous acceptance composer;
- a change to `condition_provenance_ambiguous` inside `regelKandidatAkzeptieren`;
- schema-1 persistence;
- F8;
- a database migration or Production apply.

## Injection boundary

`decideOfficialTruthSameRequestTrustedFactExtraction` accepts optional `compositionPolicies` and `compositionExtractors` so tests can exercise phase B. The live function does not pass them. A later route must not copy request JSON into those slots.

`officialTruthExtractorEingefroreneAusfuehrung` is the one server-only execution seam for an already frozen definition. It is exported so the composition layer can call it instead of building a second pipeline. No route calls it, and a later route must not forward a request body into its `definition` argument.

Observations have no injection boundary at all: they exist only as the return value of a code-owned `extract()`, and the framework rejects any observation naming a source that was not bound fresh in the same execution.

## Exact next step

Technical Lead reviews the exact branch tip independently. Agent self-review in the companion file is not PASS. If the head changes, the previous gate is void. Continuity files and Issue #751 stay with the Technical Lead.
