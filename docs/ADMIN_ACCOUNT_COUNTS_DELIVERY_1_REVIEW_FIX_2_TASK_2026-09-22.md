# Admin Account Counts Delivery 1 — Review-Fix 2 / Task Addendum v3

Date: 2026-09-22
Status: TL AUTHORIZED SAME-SESSION RESIDUAL R1 CORRECTION / NOT READY / NO LIVE ACTIVATION
Parents: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md` v1 and `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_REVIEW_FIX_1_TASK_2026-09-22.md` v2, both unchanged.
Binding independent TL re-review: https://github.com/Jetnity/jetnity/pull/553#pullrequestreview-5284045489
Reviewed product head: `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f`.
Accepted main / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`, mode NORMAL.
PR / branch: #553 / `feat/admin-account-counts-delivery-1`.
Agent: **Jetnity admin account counts delivery 1**, Generation **1**.
Existing session: **bc-3d009635-3ebd-40d6-b47e-dc8328cf309b**.
Required model: **cursor-grok-4.6-high-fast**, no Auto/substitution.

This is the immediate correction of the SAME delivery, not a new agent, product slice, auth redesign or Production approval. R2/R3/R4 implementation corrections on the reviewed head are accepted within the bounded re-review; preserve them. One P2 R1 root cause and its real-entrypoint regression remain. All parent restrictions remain except the single additional shared-file allowance below. All three tasks are TL-owned and immutable to the agent.

## 1. Reproduced defect / precise target

The new activation module independently captures `NEXT_PUBLIC_SUPABASE_URL`, whereas `lib/supabase/server.ts` has its own earlier module-captured `SUPABASE_URL`. Two copies of the environment value are not an invariant that the gate checks the effective client target.

The TL executed this no-network counterexample using the actual shared-server and delivery sources: import the shared server with a synthetic remote URL; change only the isolated test environment URL to loopback; then import the delivery graph and call the no-argument `loadAdminAccountCounts()`. With an authorized-role guard fixture and intercepted external SSR transport, the loader returns available and the actual shared factory uses its earlier remote capture. The required result is disabled before guard/cookies/client/RPC execution. Review5284045489 contains the exact method and qualifications.

This is NOT a current Production incident, browser-controlled override, demonstrated credential disclosure or real remote connection. Normal local and Production/Preview/default-off controls passed. The requirement remains effective-target containment in the supported local/test runtime, including differing import order/configuration capture.

## 2. One narrow shared-file allowance

The same agent may now additionally modify **`lib/supabase/server.ts` ONLY to add a pure, no-argument, read-only server-side accessor for its existing module-captured `SUPABASE_URL`**. A suitable name is `getServerSupabaseUrl(): string | undefined`.

Requirements:
- Return the SAME existing constant already used by `createServerComponentClient`, `createRouteHandlerClient` and `createServerActionClient`; do not re-read process.env in the accessor or maintain another capture.
- Existing client factories, environment validation and their URL/key/cookie/session behavior remain unchanged.
- No API-key accessor, logging, serialization, mutable setter, reconfiguration parameter, client-side import/export surface, new client factory, new dependency or new module registry.
- No changes to identity, role, capability, AAL, session, auth guard, cookies, RLS, generated types, SQL or remote configuration.
- The getter performs no network, cookie, client creation or authorization work.

The owned delivery activation must consume this actual shared-client configuration source instead of `ADMIN_ACCOUNT_COUNTS_MODULE_SUPABASE_URL` or any equivalent independently captured substitute. Keep the real runtime/default-off/hosted-marker/current-loopback checks. Missing or remote effective shared target must disable the path before the guard, cookie access, client factory or count RPC can run. The production loader remains no-argument; browser/query/host/header input must not enable anything.

This permits a configuration-observation helper, not a fundamental shared Auth/Session contract change. If another shared edit becomes necessary, report that exact boundary instead of widening this permission.

## 3. Persistent executable regressions

Keep tests in the already-owned `lib/admin/account-counts-delivery/` area and use existing dependencies/test tooling. Do not change package/lock/CI/global test configuration.

Exercise the ACTUAL exported `loadAdminAccountCounts()` and actual shared configuration source. Intercept only external dependencies or deliberately identified shared authorization fixtures; never replace the activation decision under test. Preserve the real shared client factory where testing its captured target and intercept its external SSR transport so no network or real account is touched. Prove tests would fail against the reviewed split-capture implementation rather than testing only a helper supplied `runtimeEnabled:false`.

Required controls:
1. Shared server loaded with synthetic remote target, then environment changed to loopback before delivery import: disabled, zero guard/cookie/client/RPC calls.
2. Genuine local shared target and local runtime: one role-backed authorized path, one bounded wrapper RPC, expected validated values.
3. Production/Preview/hosted/default-off/unknown/missing/remote runtime states: disabled and zero dependent calls even with the local flag or leftover synthetic argument.
4. Inverse and stale-capture cases: process and shared target must both meet the local-only contract; a later mutation cannot widen access. Missing effective target remains disabled.
5. Existing role denial, break-glass, lookup/AAL failure, throwing guard/client/RPC, unavailable producer and malformed response semantics remain correct.
6. Exercise the ACTUAL default `AdminAccountCounts` component's load/containment wiring and resulting disabled/failed rendering with controlled dependencies, not just `AdminAccountCountsAnsicht` given a prepared result or the standalone containment helper. Distinguish component rendering from authenticated browser/PostgREST E2E.

No remote/hosted Supabase calls, auth sessions, secrets or personal data. Synthetic endpoints/keys are test-only and must not be committed as runtime fallback/configuration. A full local PostgREST/browser run remains unclaimed unless actually executed safely.

## 4. Preserve accepted work / evidence cleanup

R2 parser, R3 reference classification and R4 structured semantics must not be re-designed in this correction. The v2-authorized checker remains bounded reference inventory, not SQL semantic validation or proof of installation. Keep the accepted producer/bootstrap/wrapper/proofs and prior sibling files byte-for-byte unless a concrete regression is reported to TL; no SQL change is requested.

Within the SAME owned evidence update:
- Correct `hashes.json.reviewFixAddendum` to **`e726b1ac0adc5f34b04d01316156887574dad5bc`**, not the stored `...34d04...` variant.
- Reconcile the self-review's `3 of the26` wording with actual current assertion categories. Do not conflate injected-helper tests, actual loader/default component tests, source/catalog assertions, SQL execution or browser E2E.
- Keep the 24 wrapper checks classified as 15 SQL + 6 catalog including the executed no-argument rejection + 2 source + 1 Node cleanup. Unchanged historical transcripts remain dated evidence, not a claim of new execution.
- Record this R1 correction, actual shared-file delta, commands, outcomes, source integrity and remaining limits in the existing STATUS/HANDOFF/SELF_REVIEW. No additional broad report or central-doc respin.

TL evidence for reviewed dcf7bfee: 44 targeted assertions (37 application/module-loader + 7 checker); 42 matched expected outcomes and 2 failed assertions reflect the SAME R1 defect. These are independent no-network application/checker checks, not the author's 30 delivery/3887 full-suite tests, a SQL run, React/browser execution or a Production test. Preserve PostgreSQL16.15 versus Production17.6 qualification and the missing authenticated PostgREST/browser E2E.

## 5. Verification / sequencing / STOP

Decision SINGLE_AGENT: one same-session fix, one narrow shared configuration getter, owned activation/entrypoint tests and evidence. No second writer, new generation/session, branch or PR. Completed #550/#552/#551 sessions must not restart.

Re-run meaningful delivery/actual-loader/default-component regressions, existing shared SSR/auth/capability tests and the required full suite/typecheck/lint/build/hygiene checks. The new shared delta must be reviewed for effects on all existing client factories. Local SQL may be safely rerun using the unchanged disposable harness; distinguish any reused dated proof from a new execution. Fresh exact-head CI/Auth/Vercel are required; they do not themselves establish local SQL or browser PASS.

Main is already synchronized at ff054f76. No main merge/rebase/force/reset/cherry-pick; report unexpected drift. Freeze ONE corrected head after this whole package and post later CI receipts in the PR conversation rather than evidence-only commit churn. Every new head invalidates prior exact-head acceptance gates.

No Production/Development/Preview database query/apply/migration/RPC activation, hosted flags/configuration, new privileges, secrets/providers/paid calls, tracking, money, launch/domain/indexing, plan upgrade, new infrastructure or budget change. Preserve Switzerland-first, Flight-first/provider-later, three-phase order, jetnity.com without cutover, disabled TL automation and accepted OS/Grok limitations.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TL EXACT-HEAD RE-REVIEW.**
