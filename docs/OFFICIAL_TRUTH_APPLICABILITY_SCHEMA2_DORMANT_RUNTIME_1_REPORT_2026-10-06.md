# Applicability schema 2 dormant runtime foundation 1 — Report

Date: 6 October 2026
Issue: #856 · Draft PR: #857
Status: **IMPLEMENTED / DORMANT / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

## Identity and scope

- Logical writer: **Jetnity Official Truth applicability schema 2 dormant runtime foundation 1**, Generation 1.
- Session: `01a10e1c-6994-73e0-ac3b-f5e2031f49c7`.
- Actual session metadata: `model=gpt-6-astra`, `effort=xhigh`.
- Branch: `feat/official-truth-applicability-schema2-dormant-runtime-1`.
- Main / merge-base: `7fb95414db6b7e4de12bea0df29b2c771081b9d4`.
- Immutable TASK seed: `f4105039a0ae04a91d02b9e72d6401ff547333ae`.
- Immutable TASK blob, verified again before delivery: `54f58f8d7018efb6188e40087ece0516f4b43697`.
- Binding architecture: merged #851, `OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_ACTIVITY_STAY_ARCHITECTURE_1_2026-10-05.md`.
- Dispatch: PR #857 comment `6004064336`.

The delivery commit containing this report follows the immutable TASK seed. The final remote SHA, ahead/behind, GitHub run and Vercel deployment are reported by the post-push readback in the delivery message/receipt. This committed document records local validation; it does not predict remote CI or claim Technical-Lead approval.

## Implemented behavior

`regulierungsKontextLesen(raw, 2)` explicitly selects the new context contract. Calls without that argument retain the v1 reader. Separate v2 applicability parsing/evaluation and fingerprints preserve the existing boolean operators, normalization, branch conflict and otherwise semantics. Shared old atomic predicates retain their old meanings. The v2 evaluator validates the whole context and derived candidate bounds before a logical short circuit can conceal a conflict.

The four activity characteristics are independent, accept only explicit `user_asserted` provenance and remain unknown when missing. Raw assertion bounds precede deduplication. Contrary assertions conflict. Purpose, employment, profile and model output supply no inferred assertion.

Planned stay distinguishes arrival, dated/unknown/open-ended departure and direct declarations. Strict Gregorian ordinal arithmetic uses no timestamp, timezone or DST conversion. Direct declarations require exact unit/counting compatibility; dates derive only explicitly named day conventions. Months remain direct assertions. Declaration/date conflicts use the declaration's own convention before any predicate runs. Zero days is confined to exit-exclusive context quantities. Open-ended stays remain unknown. Bounds and duration-gap precedence are explicit.

National-passport evaluation combines selected document type, positive recorded citizenship, the exact related-citizenship link and the explicit assertion. Known false limbs dominate missing facts. Issuer and ordinary document class remain independent. National-ID/refugee/laissez-passer conflicts are rejected before evaluation.

`eventDeadlineV2Auswerten` is a separate pure contract. It accepts only the closed extension-application/current-stay-permission-expiry vocabulary and an explicit observation. Strict UTC instant strings yield open for T < E and closed for T >= E. Civil-date expiry remains a precision gap. Missing permission, expiry and observation have separate gaps. No clock, filing event or lawful-stay conclusion is created.

The canonical fact reader accepts v2 only through the additional explicit `{schema:2, jurisdictionCountryCode}` parsing contract. Its existing four-argument overload, `RegelFakt` union and all acceptance/registry callers retain legacy/v1 behavior. The new `RegelFaktV2` union contains exactly `requirement_effect`, `visa_options`, `stay_limit` and `temporal_rule`. Exact-key parsing preserves applicability, quantities, grant events, deadlines, authority and discretion. This explicit parser argument is not an extractor pin or acceptance authority.

Plain-data preflight rejects accessors without invoking them, cycles, symbols, prototype keys, non-JSON values, personal identifiers and unauthorized provenance. It bounds values, containers, UTF-8 serialization and raw expression collections before normalization. V2 uses ASCII-key canonical JSON and distinct `rule-applicability:v2`, `official-temporal:v2`, `official-rule-fact:v2` domains plus a separate support-free structure key.

## Store and acceptance proof

The store detects a schema-2 carrier at the direct input, `trustedRuleFact` or `kandidat.proposal` entry before acceptance, payload construction, dependency access, environment/client loading, time or transport. It returns **`schema2_not_persistable`**. A second persistability guard prevents a future catch-all from treating a v2 carrier as legacy.

Eight store tests cover all four carriers in unconditional and branched forms, including the three entry routes. Dependency getters throw if touched; the transport counter remains zero. Existing schema-1 refusal (`applicability_not_persistable`) and genuine legacy success tests still pass. `regelKandidatAkzeptieren` has no implementation change and remains the only acceptance constructor. Existing composed-branch and support/provenance restrictions remain intact.

## V1 compatibility proof

The original applicability source prefix is byte-identical to main after accounting only for the context-reader rename needed for dispatch and six private parameter type annotations omitting `schema`. No v1 function body or canonical serializer changed. The old temporal source is byte-identical after excluding the added imports. All existing focused tests remain, including context, negative provenance, otherwise, expression bounds, relative temporal, legacy claims and schema-1 store refusal.

Two hashes computed using the original main reader are now fixed golden assertions:

- Unconditional: `rule-applicability:v1:f3fda302d62b9d4ef17b85da8ba209841c0a7b8f8d01c14ac5599c83fdea320d`.
- Existing normalized branch vector: `rule-applicability:v1:72a112fc7b579a965fc3cc466d7071062cf9e4f084ad35d64a285899dc7c1972`.

## Local validation

| Check | Result |
| --- | --- |
| Four allowed focused test files | 117 tests passed, 0 failed, 0 skipped |
| Full `npm test` | 5,418 tests / 806 suites; all passed, 0 failed, 0 skipped |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS: 0 errors, 144 existing warnings; none in changed files |
| `npm run build` including setup prebuild | PASS; setup reports the absent local `.env` as a warning |
| `check:dead`, `check:exports`, `check:deps` | PASS |
| `check:api-schutz`, `check:schema-bezug` | PASS; existing schema-reference classifications unchanged |
| `git diff --check` | PASS |
| Operating mode | Live `NORMAL`; delivery gate runs on committed diff before push |

Tests ran with Node 22.23.3 and the unchanged dependency lock. Full/focused final runs used the existing local Linux validation image with networking disabled because existing regression tests require PostgreSQL 16 at a Linux-specific path. These unchanged tests create disposable local fixtures; no Development/Production database or Supabase action occurred. An initial full run omitted `.git` from the disposable copy and failed two repository-integrity tests; the corrected full run included `.git` and passed all 5,418. The initial sandbox build could not open the existing tsx IPC socket; the authorized rerun passed. No test was changed or skipped to bypass those environment constraints.

Lock SHA-256: `8dead8237adef171588abd088e25f9be2472a7458121e4198cacd8ece224a7da`.

## Live reconstruction before delivery

Main still equals the binding baseline. Mode remains `NORMAL`. #751 explicitly authorizes this writer alongside file-disjoint docs writers #859 and #861; their live changed-file lists contain only their own TASK paths. #748 has no new comments beyond the previously inspected material/triage state (latest processed MATERIAL `5988971332`, triage `5989855107`). #856 and the #857 dispatch are unchanged; #857 is open and Draft. No overlapping active writer was found.

## Exact changed files relative to main

1. `lib/readiness/regulierungs-anwendbarkeit.ts`
2. `lib/readiness/regulierungs-anwendbarkeit.test.ts`
3. `lib/readiness/temporal.ts`
4. `lib/readiness/e4-temporal-rules.test.ts`
5. `lib/readiness/rule-claims.ts`
6. `lib/readiness/rule-claims.test.ts`
7. `lib/readiness/official-truth-store-server.ts`
8. `lib/readiness/official-truth-store-server.test.ts`
9. `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_TASK_2026-10-06.md` — unchanged from seed; addition relative to main.
10. `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_REPORT_2026-10-06.md`
11. `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_HANDOFF_2026-10-06.md`
12. `docs/OFFICIAL_TRUTH_APPLICABILITY_SCHEMA2_DORMANT_RUNTIME_1_SELF_REVIEW_2026-10-06.md`

## Remaining boundaries

No known unresolved in-scope implementation defect was found in self-review. Independent review remains required. These APIs are dormant: no producer, binder, extractor/policy registration, provider/UI/B01 path, accepted Evidence/Rule, F8 or persistence is enabled. A country argument represents a future trusted binding; the pure parser/evaluator cannot authenticate that caller or construct the binding. No runtime source-family readiness follows from these tests.

No serialized JSON ingestion endpoint was added. Object readers cannot recover duplicate textual JSON keys already discarded by an upstream JSON parser; any future byte-ingestion boundary must reject duplicates before object construction. Date-only expiry and unrepresented source conditions remain fail-closed. No result cache or personal-context persistence exists.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** PR remains Draft; no Ready, merge or follow-up slice.
