# Official Truth same-request composition context capture 1 — binding task

Date: 6 October 2026
Issue: #896
Repository: Jetnity/jetnity
Baseline: `main@bbc48401176611af3e736a10f2973e92147aef29`
Branch: `feat/official-truth-composition-context-capture-1`
Logical writer: Official Truth same-request composition context capture 1 — Generation 1
Execution: Codex Desktop. Record the actual session/model at execution; do not invent it.

## 1. Objective and non-authority boundary

Implement a bounded composition-only continuation of #863 section 12 step 2 after merged #891. Preserve the actual Phase A selection and Phase B fact/seal/citation context in the same controlled execution before the outer `{status, seal}` projection discards those values.

This captures in-process execution context. It is NOT `CapturedGlobalExecution` authority, global-cell admission, original-observation/validity/accepted-origin issuance, a complete producer, an immutable artifact release, receipt emission, storage or F8. A context built through existing injected test seams never becomes live authority.

Ordinary pre-F8 runtime work is authorized for this bounded task. All Production DB, retention, identity, source/provider activation and acceptance gates remain untouched.

## 2. Live Technical-Lead precheck and architectural mapping

Baseline ref independently verified; mode NORMAL; no active writer before dispatch. Push CI `37524717115` SUCCESS and Production `dpl_C6N1H43ANSVLCxQUfeGNhZFEUCik` READY on baseline, jetnity.com, aliasError=null. #748 returned no newer MATERIAL beyond the already-processed marker/receipt. No hosted Supabase read or apply was performed for this task.

Binding architecture: `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_IMPLEMENTATION_DESIGN_1_2026-10-06.md`, blob `ff9cee94890afab29c1df6383c0a4a5e95ab76e3`, especially §§3,6,12; retain #855/#861 byte/authority contracts and #880 dormancy.

Observed seams:
- #891 is merged: server-owned retrieval captures actual validated initial requestUrl independently of final canonicalUrl. Its closed extractor projection remains separate. Preserve it unchanged.
- `official-truth-composition-policy-registry.ts`, blob `2a698a80bcb81f3a123272903b45375c8e9fb183`: Phase A supplies a unique selected extractor/policy pair; Phase B executes that pair, validates source-attributed observations/citations, freezes the fact, creates its genuine module-private seal and returns checked provenance plus selected scalar identities.
- `officialTruthCompositionSealView(seal).fact` is the actual seal-bound object. A copied fact or a new seal is not the same execution.
- `official-truth-same-request-extraction-server.ts`, blob `7cb94835117539505429b3e8a3b1dde86402ed7e`: orchestrator owns the pre-HTTP phase, the single proof-registry replay, ordered support retrievals and post-HTTP Phase B. The existing composed outer result only exposes status/seal, discarding the rest.
- #880 `runOfficialTruthGlobalProduction()` remains fixed blocked/custody_missing. This task does not change it or install an issuer/resolver.

Chosen scope: retain only this actual composed execution context privately. Primary selected-definition capture, executable release/artifact pins, full global/non-personal qualification, original-origin resolution and eventual receipt production remain separate unmet prerequisites. Do not name this completion of all #863 step 2.

## 3. Startup

Read START_HERE, operating standard/current Handoff/ACTIVE_WORK_STATUS durable pointers, live mode, #751, #741, #896/current PR, immutable TASK, merged #855/#861/#863/#880/#891 and the actual relevant code/tests at remote main. Confirm no concurrent writer owns these paths. If a new incompatible contract/head appears, STOP with precise evidence.

## 4. Required internal capture

At actual successful Phase A, before the first support retrieval, retain:
- exact validated phase-A input kind/type and ordered source/content/URL bindings;
- complete validated extractor and policy registry snapshots used to prove selection, not merely the winner;
- the selected freeze/pair and its complete assignments;
- the exact validated executable references actually used by Phase B, privately in memory;
- the existing frozen proof-registry snapshot and non-personal structural scope/support/review binding values needed to associate the execution, without retaining raw research envelopes/proposals/auth objects.

During the already-existing support loop retain the actual per-support initial requestUrl from #891 and the narrow verified retrieval identity/MIME/hash/completion fields. Do not add raw response text/bytes, headers, cookies, DNS/IP or redirect chains to capture.

After the actual successful Phase B checks retain:
- the genuine returned seal by identity;
- the exact fact reference from its seal view, not a structuredClone of that fact;
- complete checked provenance/citations, not only the reduced identity string or a caller-supplied list;
- the selected IDs/versions and their agreement with Phase A;
- binding to the exact outward result of this invocation.

Capture only after all applicable existing execution/binding checks succeed. Partial stages stay private and are discarded on failure; there is no partial success projection. Keep typed data deeply immutable and actual executable references private. Never clone/stringify functions to invent a stable implementation identity.

## 5. Encapsulation and lifecycle

- Prefer an orchestrator-owned closure and module-private WeakMap/identity association. No global array, persistent registry, request/session string key or durable cache.
- No exported generic setter, DTO-to-trust factory, attach-context API, caller capture callback or new dependency injection on the live entry.
- A narrow read/consume seam, if needed for the next reviewed internal stage, must validate exact registered result identity and genuine associated seal; unknown, forged, cloned, serialized/reloaded and cross-attached objects fail closed. Prefer one-shot consumption with removal; repeat consumption cannot reuse captured execution.
- Such a read seam exposes only bounded non-executable context data and exact fact/seal associations, never the private executable references or an authority token. Its return is internal execution evidence, not proof of original issuance or global admission.
- Retain exact private references at capture rather than re-reading current catalogs/registries later. Concurrent invocations must not share or overwrite context. No re-selection after observed MIME/output.
- Failed/aborted paths have no accessible capture. Weak identity ownership must allow garbage collection when unconsumed results are dropped. No TTL, retention period, cleanup job or database decision is introduced.
- The original legacy/public result shapes remain exactly unchanged, including primary material, blocked results and composed `{status, seal}`. Do not add the context as enumerable output fields, serialize it into a response, log it or forward it to a model.
- If a capture prerequisite is not available, do not fabricate it. Preserve existing legacy execution semantics while making the new private capture unavailable. It cannot be used to claim a producer success.

## 6. Invariants that must remain unchanged

One authority read/reference time/catalog read as already defined; no new I/O. Existing owner/current AAL2/role-only bootstrap, F7 public witness shape, source/SSRF/DNS/redirect/size/time/content-identity checks and strict extraction schemas remain unchanged.

The original source observation/validity/accepted-origin closure does not exist merely because current execution was captured. No Evidence acceptance call may backfill it. Existing test fixtures may exercise semantic reconstruction, but do not create a new live acceptance path.

Keep production extractor and composition-policy registries empty. Do not register a source/profile/extractor/policy or invoke real government/provider/model endpoints. No new schema-2 integration; preserve existing legacy/schema-1 behavior and unsupported-carrier guards. Preserve #855/#861 historical byte contracts. Do not substitute a Git SHA, hash of function text, static id/version or this capture object for a missing executable artifact pin.

## 7. Required adversarial tests

Use synthetic offline runs through the actual current composition/extraction algorithms, not only hand-built success objects.

At least:
1. Phase A capture precedes every HTTP test-double invocation; full validated registry set retained, no second catalog lookup.
2. Phase B uses the same frozen selected pair and assignments; later changes to input registries cannot replace it.
3. Actual final-only requestUrl/canonicalUrl pairs and multi-support proof order survive capture.
4. Captured fact is strictly equal to the genuine seal-view fact; cloned fact/recreated seal cannot substitute.
5. Complete checked citation rows retained; equal-values conflicts, missing/duplicate/foreign supports or citations fail without publishing capture.
6. Wrong result paired with a genuine seal, Object.create/prototype clone, structuredClone/JSON replay and fabricated IDs cannot resolve the capture.
7. Interleaved concurrent runs never exchange scope, fact, seal, initial URLs or citations.
8. Failure/throw/abort after partial work leaks no capture; consumed or dropped context is not an enumerable permanent cache.
9. No raw snapshot/body, research/model/proposal/auth/user/session/secret/transport payload escapes into context view or public result.
10. Primary and blocked outward shapes stay byte/key-compatible; composed outward keys remain exactly status/seal.
11. Production registries/root remain empty/blocked; no acceptance/store/DB/F8 bridge appears.
12. Import fences remain explicit finite lists. Test-only instrumentation may inspect private invariants, but cannot create a new production issuer or injected success authority.

Do not claim all original-origin or executable-pin prerequisites proven by these tests. Report those as still missing.

## 8. File allowlist

Immutable TASK:
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_TASK_2026-10-06.md`

May modify:
- `lib/readiness/official-truth-same-request-extraction-server.ts`
- `lib/readiness/official-truth-same-request-extraction-server.test.ts`
- `lib/readiness/official-truth-composition-policy-registry.test.ts` (only needed regressions/finite import-fence reconciliation; no relaxation)
- `lib/readiness/official-truth-content-identity-r2.test.ts` (only narrow compatibility regression if needed)

May create:
- `lib/readiness/official-truth-same-request-composition-context-capture.test.ts`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_SELF_REVIEW_2026-10-06.md`

Use the existing orchestrator and already-exported seal view; do not create a second composition framework or change registry runtime. No other path without STOP and TL authorization. #895 owns disjoint Trip UI/runtime/tests and must not be consumed as unpublished input.

## 9. Verification and delivery

Run the new capture tests, full same-request extraction and composition registry suites, retrieval/R2 regressions, dormant #880 foundation/v3/issuer guards, broad relevant Official Truth tests, typecheck, lint, production build, hygiene/mode and git diff --check. Preserve all tests. Local PostgreSQL/build environment limitations must be disclosed, not hidden as skips or inherited green. Remote exact-head CI/Auth/Vercel are independent gates after push.

Demonstrate zero new live HTTP/provider/model calls, DB/Supabase access, acceptance/store writes, registration and activation. No SQL/migration/RLS/Auth changes, no receipts/custody-binding emission, no persistent retention choice and no Production data mutation.

Commit/push only this branch, then re-read remote main and report exact head, merge-base/ahead/behind, changed files, immutable TASK blob, actual checks/counts, remaining prerequisites, P0–P3 and actual Codex session/model/effort. Final report/handoff/self-review must describe final verified state accurately without self-referential commit hashes.

Classification: `OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_READY` or `OFFICIAL_TRUTH_SAME_REQUEST_COMPOSITION_CONTEXT_CAPTURE_1_NOT_READY`.

PR stays Draft. No Ready, merge, Cursor dispatch, receipt emission or automatic follow-up.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
