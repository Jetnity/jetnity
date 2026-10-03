# Official Truth Composition Policy Runtime Foundation 1 — Handoff

Date: 3 October 2026
Issue: #802
Draft PR: #803
Branch: `feat/official-truth-composition-policy-runtime-foundation-1`
Baseline: `main@daf87a2abe510c3c93d9a9a975b3114aca9c065f`
Task seed: `7957158bb8cfb64013412541682372597ea6a3f9`
Runtime commit: `afa673d43d1bdbacf02f7054c3c6796dab604570`
Session: https://cursor.com/agents/bc-7a7df0ce-96f0-4949-99b6-0674046a2ce6
`originalModelName`: `grok-4.7-high-fast`

The review head is the branch tip that contains this handoff. Re-fetch it. Do not review the task-seed commit alone.

## Where this stopped

The dormant composition-policy runtime foundation is on the draft PR and is waiting for an independent Technical-Lead exact-head review. Cursor did not mark Ready, did not merge, and did not open a follow-up slice.

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

## Exact next step

Technical Lead reviews the exact branch tip independently. Agent self-review in the companion file is not PASS. If the head changes, the previous gate is void. Continuity files and Issue #751 stay with the Technical Lead.
