# Official Truth Applicability Canonical Wiring Runtime 1 — Report

Date: 3 October 2026
Issue: #798
Draft PR: #799
Branch: `feat/official-truth-applicability-canonical-wiring-1`
Baseline: `main@e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`
Task: `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_1_TASK_2026-10-03.md`
Task seed: `44fdc9cd` is not the review head.
Previous review head `ab4a240c05230d4417c19a45dbba629a1f8e3a89` is not the review head after R1.
Provenance correction: `3e2655f67a40af9c2a7fe59afa57e9e5ec63ab3a`
Binding plan: `docs/OFFICIAL_TRUTH_APPLICABILITY_CANONICAL_WIRING_AUDIT_1_2026-10-03.md`
Logical agent: **Jetnity Official Truth applicability canonical wiring runtime 1**
Generation: **1**
Session: https://cursor.com/agents/bc-2b43f956-a705-4f8a-84c4-38c38645e965
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge.

The review head is the branch tip that contains this report. A commit cannot name its own SHA. Re-fetch before review.

Implementation order on this branch, both commits required in one PR:

1. `37be473d` — accepted-claim store loss-prevention guard, plus the new `RegelClaimFehler` members, while the old readers still rejected schema 1.
2. `ef0f4d4c` — `regelFaktLesen` widened through the existing applicability fact-shape readers, with the tests.

## R1 — branch and atom support binding

`regelKandidatAkzeptieren` now checks schema-1 branch and atom citations after `regelFaktLesen` and before it builds `AkzeptierteRegelClaim`.

The claim's re-proven `supportVersionIds` are the only Evidence versions a branch or atom may cite. The check does not invent or substitute an id.

For every schema-1 branched requirement effect and every branched schema-1 visa option:

- every branch `supportVersionIds` is non-empty
- every branch id is in the claim supports
- the union of the branch ids equals the claim supports
- an atomic `supportVersionIds`, when present, is non-empty and a subset of its containing branch
- nested `all`, `any`, and `not` are walked in operand order
- `otherwise` has no atom tree; its branch citation is still checked

`explicit_primary_statement` schema-1 branches require exactly one accepted support. Every branch cites that id. An atom may omit ids and inherit that support, or cite exactly that id.

`composed_from_multiple_primary_sources` schema-1 branches return `condition_provenance_ambiguous` before a claim exists. This slice does not invent a composition policy. Legacy composed facts stay on the previous acceptance path. Schema-1 unconditional facts have no embedded citations and keep the existing claim-support binding.

Foreign branch ids, empty branch citations, a branch union that omits a claim support, a foreign atom id, and an atom id that sits in the claim but outside its branch are `support_mismatch`.

A valid explicit schema-1 claim still stops in the store as `applicability_not_persistable` with zero RPC calls.

## What was implemented

`regelFaktLesen` remains the single canonical Rule-fact semantic parser. `regelFaktKanonischLesen` and `regelKandidatAkzeptieren` still delegate only to it. Acceptance reads `trustedRuleFact` through that function. There is no extractor-only parser and no second acceptance constructor.

`lib/readiness/rule-claims.ts` is the only new production importer of `regulierungs-anwendbarkeit`. It imports the two fact-shape readers and their fact types:

- `regulierungsAnwendbarkeitWirkungLesen`
- `regulierungsAnwendbarkeitVisaOptionLesen`
- `AnforderungswirkungFakt`
- `VisaOptionenFakt`
- `RegulierungsLesefehler`

`RegelAnforderungswirkung` aliases `AnforderungswirkungFakt`. `RegelVisaOptionen` aliases `VisaOptionenFakt`. `RegelVisaOption` stays the legacy three-key option. The applicability module does not import `rule-claims.ts`.

Requirement effect goes through `regulierungsAnwendbarkeitWirkungLesen`. Visa options keep the existing `requirementType !== 'visa'` gate, then go through `regulierungsAnwendbarkeitVisaOptionLesen`. The other six fact kinds stay on their current readers.

Every schema-1 fact, including an unconditional requirement effect and an all-unconditional visa-options fact, parses in memory and is refused by the store as `applicability_not_persistable` before `transportAus`, client construction, `claimPayload`, `faktSpalten`, and the RPC. `store_not_configured` does not mask that refusal.

Legacy successful facts and their store payloads stay on the existing columns. A legacy flat `effect: 'conditional'` fails closed as `legacy_conditional_without_payload`. The reader's `auswertung` object is dropped. The claim error is only the reason.

`OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY` remains `Object.freeze([])`. Extractor and same-request compatibility are test seams only. The live same-request path still calls `officialTruthTrustedFactExtrahieren`.

## Store narrowing

The store file does not import the applicability module. Persistable facts are a private `Exclude` of `RegelFakt`:

- requirement effect is persistable only when it has `effect` and has neither `schema` nor `applicability`
- visa options are persistable only when the parent has no `schema` and no option has `applicability`
- the other six kinds stay persistable

`faktSpalten` accepts only that narrowed type. The writer returns `{ ok: false, reason: 'applicability_not_persistable' }` when the accepted claim does not narrow. There is no throw-based guard.

## Deliberate mappings

- `context_conflict` is a `RegulierungsLesefehler` that the fact readers do not return, because acceptance does not call `regulierungsKontextLesen`. `faktGrund` maps it to `invalid_fact` so it cannot appear on `RegelClaimFehler`.
- `node_bound_exceeded` is in that same passthrough switch. Depth, branch, and operand bounds have dedicated parser tests. `node_bound_exceeded` does not have a separate runtime case in this slice.
- Acceptance does not import `regulierungsKontextLesen`, `regulierungsWirkungAuswerten`, `regulierungsVisaOptionAuswerten`, `regulierungsAusdruckAuswerten`, or `regelAnwendbarkeitFingerprint`.
- Accepted claims do not carry `rule-applicability:v1` or `reg-eval-ctx:v1`.

## Boundary

No edit to `lib/readiness/regulierungs-anwendbarkeit.ts`, `lib/readiness/official-truth-trusted-fact-extractor-registry.ts`, or `lib/readiness/official-truth-same-request-extraction-server.ts`. No route, UI, provider, model, migration, database apply, CH import, or F8. The task seed is unchanged. `.jetnity/operating-mode.json` is unchanged. `docs/ACTIVE_WORK_STATUS.md` is unchanged; the handoff is the continuity record, matching foundation slice #794.

`requirementsProviderAus()` is untouched. No new running cost. No provider activation.

## Gates

R1 re-review of `3e2655f67a40af9c2a7fe59afa57e9e5ec63ab3a`, 3 October 2026, before this documentation commit. Exact-head GitHub CI and Vercel belong to the pushed tip. The previous review head `ab4a240c` is not this tip.

- Focused parser, store, applicability importer, extractor, same-request, and rule-claim SQL schema tests: 115 pass / 0 fail / 9 suites. Exit 0. The throwaway PostgreSQL proof inside the store file ran.
- `npm test`: 4597 pass / 0 fail / 768 suites. Exit 0.
- `npm run typecheck` (`next typegen && tsc -p tsconfig.json --noEmit`): exit 0.
- `npm run lint`: exit 0, 148 problems (0 errors, 148 warnings). Those warnings are pre-existing and outside this slice.
- `npm run build`: exit 0. Next.js 16.3.8 (Turbopack). Compiled successfully. 25 static pages.
- `npm run check:operating-mode`: PASS.
- `npm run check:dead`: exit 0. 646 start points, 1300 reachable modules, 0 unreached.
- `npm run check:exports`: exit 0. 1041 files, 0 exports without a caller.
- `npm run check:deps`: exit 0. 11 dependencies, 0 unused.
- `npm run check:api-schutz`: exit 0. 12 admin routes, all use `requireAdminApi()`.
- `npm run check:schema-bezug`: exit 0. Unchanged LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, `official_truth_store_accepted_v1`. This slice added none.
- `git diff --check`: exit 0.
- No new file under `supabase/migrations`. Diff against baseline has no `supabase/**`, `app/**`, or `components/**` change.
- Production extractor registry source is still `Object.freeze([])`.

`origin/main` at the R1 pre-documentation fetch: `e6c2ae309a9d4e419fbbb38719969d5d40abb5ab`. The provenance correction was 0 behind that pin. No remote database was contacted. Nothing was applied. Local PostgreSQL 16 binaries on the agent VM let the existing throwaway `initdb` proof run. The system cluster was not started.

## Security, database, cost

Schema-1 facts stay in memory. They do not reach the store RPC. Legacy payloads stay on the existing columns. No service role change, no secret, no new route, no traveller evaluation in acceptance, no new running cost.

## Risks

All schema-1 facts, including unconditional ones, are non-persistable until an applicability-aware schema exists. That is the binding persistence decision. A later slice would need its own task, its own migration gate, and Product-Owner approval before any production apply.

`node_bound_exceeded` is wired through `faktGrund` and is not separately exercised here.

## Next step

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge and does not start a follow-up slice.
