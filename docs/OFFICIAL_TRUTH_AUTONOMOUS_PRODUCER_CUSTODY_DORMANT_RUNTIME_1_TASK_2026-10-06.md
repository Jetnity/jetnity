# Official Truth autonomous producer custody dormant runtime foundation 1 — Task

Date: 6 October 2026
Issue: #876
Repository: Jetnity/jetnity
Baseline: `main@b16a250b95715418c125a92a2d407ba2ec3f89fa`
Branch: `feat/official-truth-autonomous-producer-custody-dormant-runtime-1`
Execution lane: Codex Desktop
Parallel-safe with #873/#874/#875.

## Objective

Implement only step 1 of accepted #863 section 12: a dormant, pure, fail-closed producer/custody runtime foundation.

This slice creates reusable exact value/codecs/equality/selection/private-stage primitives and synthetic conformance tests. It must NOT create a live autonomous producer, retrieval, accepted Evidence, persistence or F8 authority.

## Binding inputs

Re-read live main/mode/#751/#741/#876 and merged #855/#857/#859/#861/#863.
Treat accepted #863 design as binding, especially sections 3, 8, 10, 11 and 12.

## Required foundation

Implement only what is necessary to prove these contracts offline/pure:

1. strict historical value/codecs for #855 receipt-related autonomous provenance values and the separate #861 custody dependency artifacts without changing accepted byte contracts;
2. exact pin/type/version/equality checks and fail-closed unknown-version handling;
3. pure global-cell admission value validation — no live selector/catalog/DB authority;
4. pure accepted-custody value validation — no live resolver or Evidence acceptance;
5. pure deterministic support-selection over synthetic already-qualified snapshots;
6. pure global/non-personal representation qualification predicates over supplied synthetic immutable observations — no network;
7. pure safe proposal-null autonomous review material construction;
8. private invocation/stage membership skeleton using closure-private identity / non-exported issuance, proving forged/cloned/cross-invocation/post-close handles fail;
9. shared/narrow v3 identity core only if needed to prove byte/key compatibility; existing public v3 behavior and golden vectors must remain byte-identical;
10. pure in-memory bundle projection skeleton may exist only if all inputs are synthetic already-complete values; it must not be a public DTO-to-trust constructor and must not persist;
11. default production/live roots or resolvers, if any symbol is needed, return a fixed blocked/unavailable result and perform zero I/O.

First producer scope remains legacy/v1 only. Schema-2 carriers are rejected/fail-closed; do not cast them into v1.

## Candidate file allowlist

TASK is immutable:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_1_TASK_2026-10-06.md`

May create only as needed:
- `lib/readiness/official-truth-global-cell-admission-server.ts`
- `lib/readiness/official-truth-evidence-metadata-custody-server.ts`
- `lib/readiness/official-truth-support-selection-server.ts`
- `lib/readiness/official-truth-global-representation-qualification.ts`
- `lib/readiness/official-truth-autonomous-review-material-server.ts`
- `lib/readiness/official-truth-autonomous-provenance-record.ts`
- `lib/readiness/official-truth-autonomous-provenance-artifact.ts`
- `lib/readiness/official-truth-autonomous-provenance-record-server.ts`
- `lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts`

May modify only if the shared v3 core is strictly required:
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`

Create delivery docs:
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_1_REPORT_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_1_HANDOFF_2026-10-06.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_1_SELF_REVIEW_2026-10-06.md`

No other path.

## Mandatory adversarial coverage

Implement synthetic/offline tests covering at least the applicable foundation subset of #863 C01–C29:
- forged/cast/clone/cross-invocation/post-close handle rejection;
- caller IDs/pins cannot mint a live handle;
- same hash/different context rejected;
- proposal non-null rejected and v3 compatibility retained;
- duplicate/missing/ambiguous support selection fails;
- personal/trip/request/session fields or hashes rejected;
- unknown schema/artifact version fails closed;
- v1/v2 confusion fails;
- custody binding mismatch fails;
- byte/codec conformance to accepted #855/#861 fixtures;
- boundary/closure limits where pure foundation owns them;
- no function can turn persisted/historical bytes into live execution authority.

## Explicit zero-I/O assertions

Tests must demonstrate the dormant foundation performs:
- zero HTTP;
- zero DB/Supabase;
- zero Evidence acceptance;
- zero Rule acceptance;
- zero store writes;
- zero provider/model calls;
- zero source/content/profile/extractor/policy registration.

Do not import or call live store acceptance constructors from the foundation.

## Hard non-scope

No real global-cell release/corpus integration.
No original observation issuer.
No source/content registration.
No retrieval or redirect/DNS logic.
No extractor/composition registry activation.
No accepted Evidence.
No Rule/F8.
No SQL/migration/RPC/RLS/Supabase.
No retention/lifecycle decision.
No Auth/AAL/background identity.
No Production activation.
No global continuity edit.
No follow-up.

## Checks

Run new foundation tests plus existing review-fingerprint/golden tests and relevant Official Truth guard tests.
Run typecheck/lint and full relevant suite if practical.
Run `git diff --check`.
Report exact zero-I/O evidence and whether any candidate files were unnecessary and omitted.

## Delivery

Re-read current remote main before STOP. Commit + push.
Report exact head, merge-base/ahead/behind, changed files, immutable TASK blob, exact tests, P0–P3, and Codex session/model evidence.

Classification:
- `AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_FOUNDATION_READY`
or
- `AUTONOMOUS_PRODUCER_CUSTODY_DORMANT_RUNTIME_FOUNDATION_NOT_READY`

Stay Draft. Do not Ready. Do not merge. Do not start same-request integration.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
