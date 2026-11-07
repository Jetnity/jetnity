# Official Truth Pilot Target Guard 1
## TASK v1 — 2026-11-07

### 1. Goal, selection and ownership
Tracking #1148; parent #917; related #968/#1139. Root explicitly selects this finite code prerequisite after live reconstruction and independent release review. Main is `fd31251c0f63dbb8454337d1fd3b526f1893ea94`, tree `f0757bd65f9e218ff6339c6ac9762c51d21eabe6`; #1147 is merged with independently verified POST-MERGE PASS. Mode NORMAL. The existing last author is stopped; Cursor remains paused.

Branch: `fix/official-truth-pilot-target-guard-1-20261107`.
Single author: **Jetnity Official Truth Pilot Target Guard 1 — Codex Generation 1**. The root dispatch receipt binds the actual session, seed and immutable TASK blob before implementation. Only root may publish, Ready or merge. An immediate correction stays with this same author/session; every changed head requires full new gates.

Deliver an enforced Development target boundary in the existing pilot code. Do not build another generic framework or redo #968 configuration separation. This is independent preparation for step D, while the actual first critical step A remains blocked by its specific platform refusal. It is not a claim that the target database, browser, key or deployment has been accepted.

### 2. Verified defect and reusable seams
At the exact baseline:
- `request-server.ts` checks availability, then creates the shared SSR client and performs Auth/Trip calls without a pilot-specific target check.
- `database-server.ts` exposes save and reserve/recheck helpers that construct the shared SSR client directly.
- `evaluate-server.ts` checks pilot enablement but then loads authority, grant, source catalogue and source without a target contract.
- `lib/supabase/server.ts` captures the public URL at module initialization and already exposes read-only `getServerSupabaseUrl()`.
- `official-truth-source-catalog-server.ts` uses the current environment's public URL. Current and captured targets could differ.
- `lib/admin/account-counts-delivery/activation.ts` demonstrates checking the actual captured target as well as the process snapshot.

Current availability and enablement are false, contracts empty; no active production exploit is asserted. The gap matters before later activation.

Read the mandatory startup/operating/AGENTS/product/architecture/quality files and current checkpoint `TL-CHAT-ENTRY-20261107-V1`. Relevant original evidence:
- https://github.com/Jetnity/jetnity/issues/751#issuecomment-6705497685
- https://github.com/Jetnity/jetnity/issues/968#issuecomment-6695985766
- https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6690991614
- https://github.com/Jetnity/jetnity/issues/917#issuecomment-6164202501

### 3. Required behavior
1. Add one small server-only, non-overridable runtime predicate for the fixed known Development project `yfvbxvijcorffwxbxahl`. Reuse `getServerSupabaseUrl()`; never create a new client, inspect credentials or make a network request in this guard.
2. Admit only the exact canonical HTTPS Development project URL, consistently in the captured session factory and current `NEXT_PUBLIC_SUPABASE_URL`. Reject empty, malformed, Production `qscbgcdmivbbnzrcyegn`, foreign, loopback, look-alike host, credentials, port, path, query, fragment, whitespace and captured/current mismatch. The exact canonical spelling may be required; do not silently normalize a different destination into admission.
3. Require the code-owned intended Vercel Preview context, including `VERCEL=1`, `VERCEL_ENV=preview` and project `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`. Missing/custom/Production/local context fails closed. Verify current official system-environment semantics before implementation. This is a necessary target predicate, not activation or authentication authority.
4. The guard accepts no caller environment, URL, Request, token, flag, callback or override. No exported enabling factory/setter or request/header/query/localStorage selection. Use existing test module substitution outside the deploy graph.
5. Enforce it in the actual request path before the first pilot Auth/Trip call, in BOTH exported database helpers before constructing a client/RPC, and in the actual evaluator before authority/catalogue/source work and before the final recheck/publication. After awaited work, reject detected target drift before starting the next pilot operation or emitting a verified result. Keep checks at concrete side-effect boundaries without creating a second pipeline.
6. Preserve current response contracts/status categories; failed target checks produce the established unavailable/null result and no positive evaluation. Do not expose internal target URLs/IDs or configuration details in user-facing errors.
7. `applicationPilotAvailable()` and `applicationPilotEnabled()` remain hardcoded false, `contracts=[]` and all source/identity/extractor registries remain unchanged. Target matching alone never enables a real operation.
8. Shared Supabase browser/SSR/auth factories, ordinary account pages, generic route/proxy behavior, Source Catalogue APIs and key handling remain unchanged. Do not claim this gate stops ordinary non-pilot account-page requests. Later exact deployment/browser/key verification remains required.

### 4. Scope
Allowed paths:
- `lib/readiness/official-truth-ch-de-application-pilot-1/target-server.ts` (new)
- `lib/readiness/official-truth-ch-de-application-pilot-1/target.test.ts` (new; meaningful independent-call/negative-effect coverage)
- existing `request-server.ts`, `database-server.ts`, `evaluate-server.ts`
- existing `application.test.ts` only as necessary to supply the same external target port in its isolated test fixture while preserving every existing semantic assertion
- `docs/OFFICIAL_TRUTH_PILOT_TARGET_GUARD_1_HANDOFF_2026-11-07.md`
- concise append-only updates to `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`.

This root-owned TASK is immutable. Further paths require root scope amendment before editing. No packages/workflows/timeouts changed.

### 5. Acceptance and verification
- Positive synthetic environment demonstrates the real guard accepts exactly the intended preview/dev pair; no live request or credential is used.
- Adversaries cover every target/context class above and both mismatch directions (captured Production/current Dev, captured Dev/current Production), missing captured URL, and later environment drift.
- Execute actual request/database/evaluator modules under existing isolated fixtures. Prove blocked requests return existing errors and downstream client construction/Auth/Trip/RPC/catalogue/source counters remain zero. Direct helper calls must also refuse; endpoint-only validation is insufficient.
- With a test-only target-positive port, all existing current-request application semantics still run; source/authority/grant/freshness/unknown handling is not weakened. Preserve actual canonical acceptance tests in the existing suite.
- Prove late target change yields no verified output and no subsequent pilot-side effect after the detected drift. Do not claim that a completed prior action can be undone.
- Actual shipped hard-off remains intact even when the synthetic target matches.
- Focused source/guard/request/database/application tests, real TypeScript and focused lint where available; exact-head full existing CI/Auth/hygiene/build, Preview and independent root full-diff review remain required. Partial mirror is not a full checkout/build PASS.
- Root rechecks main/drift/threads and actual-main CI/Production after any normal merge. No optional repeated broad tests after sufficient evidence unless a concrete risk requires it.

### 6. Exclusions and preserved gates
No hosted SQL, Stage1 readback, migration/apply, real Auth/session/account/Trip records, RLS/roles/grants, environment change/decryption/credential copy, source call/admission or activation. No code inspection/copy/integration from held #1131/#1135/#985/#937/#913, and no alternate access path for any denied operation. Existing support is SENT; no new message.

Stage1 remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**; actual new ledger ID unknown. Stage2 remains **NOT_ATTEMPTED** and may not be applied unchanged even after future readback. #1139 effective target installation remains open; #1142 local candidate is already complete. #1143/#1145/#1147 stay completed and are reused without rebuilding. No source pin/window change, persistent-store activation, provider/model/payment/indexing/launch action or new recurring cost.

### 7. Handoff and STOP
Record exact author/session, baseline/seed/TASK blob, changed paths/blobs, meaningful commands/results and limits, P0/P1/P2/P3 disposition and the exact next gate. Existing inherited risks are not downgraded. Distinguish implemented guard from actual target/browser/key/DB acceptance and from the full #917/#741 product.

**do not mark Ready; do not merge; do not start a follow-up slice.**
Return to root for independent review and STOP.
