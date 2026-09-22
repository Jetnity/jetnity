# Admin Account Counts Delivery 1 — Binding Task v1

Date: 2026-09-22
Status: TL AUTHORIZED IMPLEMENTATION / LOCAL-ONLY ACTIVATION / PRODUCTION DISABLED / NOT READY
Cursor-Agent: **Jetnity admin account counts delivery 1**
Generation: **1 — NEW dedicated session**
Required model: **Cursor Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto/substitution.
Branch: `feat/admin-account-counts-delivery-1`
Verified baseline: `main@0d4c871867e7c4daac45af4a737cc032723863ae`, mode NORMAL.

## 1. Purpose and TL selection

The Product Owner asks for additional useful agents while the final continuity work is being reviewed. The old account-count dependency is now satisfied: #550 producer/local proof and #552 independent evidence are accepted and merged. A docs-only continuity branch is not a reason to serialize independent product implementation.

Build the actual application delivery path for the two accepted account measures: narrowly scoped local SQL RPC wrapper, user-session-bound server reader, strict response validation, and an accessible two-measure section on existing Admin home. This is implementation, not another inventory, not the rejected #549 unavailable-metric dashboard, and not a new analytics platform.

All new account-count functionality must be **default-off and hard-disabled in hosted/Production deployments in this slice**. No existing Production account data is read by the new path. No migration, hosted configuration change or live RPC activation is authorized. Local implementation and tests may proceed before the separate Production decision. Do not describe the result as live statistics or Production-ready activation.

Read JETNITY_START_HERE, AGENTS, the TL/Cursor and multi-agent standards, the latest #512 comments and the accepted #550/#552 code/evidence. Where #551 is still open, its corrected checkpoint lives on `docs/v1-continuity-refresh-3`; its content is continuity evidence, not a code dependency. This task supersedes the previous scheduling expectation that no new independent implementation would be commissioned before #551 closure, but DOES NOT authorize a second central-document writer or a merge during #551 final gating.

## 2. Verified source baseline / reuse

- #550 accepted product `b5bbe211bc82c16da34bc8f48b58f39920af5f5a`, TL PASS 5282850421, identical-tree merge `34686af3a12317d5eb40ab12056a1188298e04c6`, closure 5782888984.
- #552 accepted evidence `3bb98706cb70383f8e9dd41b7250009e1d99ebd1`, TL PASS 5283137155, merge/current baseline `0d4c871867e7c4daac45af4a737cc032723863ae`, closure 5783340076.
- Latest #552 post-merge receipt: CI 35777992016, Auth 106915977752 and Typecheck/Lint/Build 106915977838 SUCCESS; Production dpl_8tg95sUyqkVE6Hw96ra1smAvdbvZ READY. These are dated TL receipts; re-read available checks, never relabel as your test runs.
- Accepted producer: `scripts/db/admin-account-counts-1-candidate.sql`; function `jetnity_reporting.account_counts_v1()`; candidate SHA256 `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420`.
- Accepted fixture/runner/tests: `scripts/db/admin-account-counts-1-*`; reviewer evidence in `docs/evidence/admin-account-counts-independent-verification-1/`. All remain READ ONLY.
- Current home: `app/(admin)/admin/page.tsx`; `components/admin/home/AdminStatsStrip.tsx` displays trip aggregates, NOT registered accounts. Keep those trip tiles unchanged.
- Reuse `lib/auth/admin-guard.ts`, `lib/auth/roles.ts`, `lib/auth/admin-aal.ts`, `lib/supabase/server.ts`, existing Admin error components and repository test utilities. `konten-verwalten` is the existing capability; moderator+ and current AAL2. No new role/capability or auth helper edit.
- package.json currently pins Next 16.3.3 / React 19.2.8 / Node 22; use existing installed/lockfile versions. Do not use stale Next14 assumptions or upgrade dependencies.
- #549 rejected an overview consisting mostly of unavailable/imagined metrics. Do not resurrect it. Scope is ONLY the two now-accepted account measures and their actual delivery path.

## 3. Ownership

May add:
- `lib/admin/account-counts-delivery/*` — small scoped contract/parser, server-only activation predicate and reader, meaningful tests. One canonical application result contract owned by this agent.
- `components/admin/home/AdminAccountCounts.tsx` and, only if needed, a small same-prefix presentation component. Prefer server rendering; no second dashboard.
- `scripts/db/admin-account-counts-delivery-1-rpc.sql` — LOCAL/UNAPPLIED wrapper only, outside migration discovery.
- `scripts/db/admin-account-counts-delivery-1-local-proof.mjs` and optional same-prefix test — reuse accepted isolation helpers without editing them; local-only proof of this wrapper.
- `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_STATUS_2026-09-22.md`, `_HANDOFF_2026-09-22.md`, `_SELF_REVIEW_2026-09-22.md`.
- `docs/evidence/admin-account-counts-delivery-1/*` — small text/JSON and bounded local test evidence only.
May modify ONLY `app/(admin)/admin/page.tsx` to mount the new section behind the server-side gate, with no change to existing panels.

This task is TL-owned and unchanged. READ ONLY: all central startup/handoff/status/checkpoint files owned by #551; all #550/#552 files; existing AdminStatsStrip/TimeSeries and navigation/indexing; shared auth/roles/AAL, Supabase client, migrations/config/schema/generated types, package/lock/CI, providers and operating-mode/governance. No new API route is needed: use a user-bound Server Component reader rather than adding a second HTTP surface. If a required shared change is outside this allowance, report the exact blocker, not a parallel substitute.

## 4. Fixed metric / transport contract

Keep producer `jetnity.admin-account-counts.v1` unchanged:
- present_registered_accounts: present auth.users rows, deleted_at IS NULL and is_anonymous IS FALSE;
- created_in_prior_30_days: subset of those rows whose original created_at is in [window_start, measured_at), exactly 720 hours;
- measured_at and window_start are the producer's database timestamps, not request time or browser time;
- definition_version is exactly the accepted version.
No target profile join. Accounts without profiles are included. Internal/test/unconfirmed/banned-profile rows remain included without a proven exclusion. NULL-created_at contributes only to present; future dates not in window. Anonymous conversion is original creation, not conversion time. Present authorised count is at least 1 because the caller is counted; window may genuinely be 0. This is not visitors, active users, humans, clean partner traffic, all-time registrations, bookings or revenue.

Wrapper name: `public.admin_account_counts_v1()`; **zero arguments**, STABLE, SECURITY INVOKER, pinned safe search_path, qualified call to the existing guarded private function. Do not add another SECURITY DEFINER, direct auth.users read, new role, client table grant, managed-auth policy or jetnity_internal grant. Explicitly revoke PUBLIC/anon/service_role and grant only intended authenticated EXECUTE in the LOCAL SQL. Keep schema exposure limited to this public wrapper; do not add the private schema to exposed schemas.

Wrapper output has the same five keys. Convert the two bigint values to canonical decimal TEXT for transport so JSON/JavaScript cannot silently round large counts; this is transport-only, not new counting semantics. No identifiers or extra producer fields. Only small fixed results.

Reader must use existing SSR/session-bound Supabase client, never service-role/Auth-admin/Management API/direct SQL credentials. Use a narrow local expected-RPC type extension where necessary; do not modify generated types as a claim that unapplied SQL already exists live. Validate exactly one row, known version, decimal nonnegative counts, present>=1, window<=present, valid explicit-zone timestamps and correct interval/order. Reject malformed, missing, multirow, unexpected-field or precision-losing numeric data. Preserve exact decimal counts for rendering. No Number coercion or `?? 0` fallback. Keep a single typed distinction among available, forbidden, unavailable and failed; disabled is a separate activation decision. Reuse existing error semantics, no raw DB/error/credential details in UI or logs.

## 5. Activation / security boundary — mandatory

Implement a server-only **local** activation predicate, default false. A suggested explicit name is `JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED` with exact value `true`. It must additionally require a genuine local development/test runtime, no Vercel/hosted deployment marker, and a strictly parsed loopback-only Supabase URL. Missing/unknown/Production/Preview/remote configuration is disabled, including when the flag is set. Host/forwarded headers, query strings and browser inputs must never enable it. Do not set this flag in any hosted project, CI or committed env file.

When disabled: render no new section, do not invoke the new reader/RPC, do not import fixture data into runtime, and leave existing Admin UX unchanged. No placeholder cards or fake numeric tiles are mounted in Production. The accepted producer and new wrapper stay unapplied on all remote projects. A future live rollout needs a separate TL-reviewed change/activation plan and PO Production approval; this task cannot accidentally become that rollout through one env toggle in Vercel.

When locally enabled: enforce the existing verified identity/current-AAL2/`konten-verwalten` contract and require an actual role-backed grant; break-glass shell access is not statistics access. Keep the inner SQL caller-exists/not-deleted/not-anonymous guard authoritative. No editable metadata authorization. Do not silently alter shared banned/disabled-account semantics; carry the existing helper-status observation into the later activation checklist.

Use request-bound data, no global/cross-user cache, no static prerender, no browser/localStorage persistence, no third-party tracking, no raw rows. One bounded RPC read; no unbounded polling or count scraping. Error/empty/denial never becomes successful zero. A missing function is unavailable, not empty traffic. Make server/client module boundaries and exception behaviour testable. Failure of this optional section must not remove the existing Admin panels.

## 6. UI outcome

A compact, accessible section alongside existing Admin operational panels, not a replacement for them: two account measures, exact as-of instant, 720-hour window, concise metric definitions and raw-account caveats. Clearly distinguish the current present total from creation-window subset. Use German copy consistent with Jetnity, responsive layout, proper headings and readable numbers on mobile. No claims of partner-ready reporting or traffic. No CSV/tracking/funnel charts/finance/Growth OS.

A success state must consume the validated reader result, not manually authored counters. Test-only fixtures may exercise visual states in an isolated test harness; they must never be a runtime fallback, a hosted public audit route or evidence of live data. Record precisely which UI assertions were rendered/component-tested and which were browser-tested. No claim of full authenticated PostgREST/browser E2E unless actually run against a disposable local stack.

## 7. Verification

Run actual disposable PostgreSQL wrapper tests using the accepted candidate+fixture unchanged. Prefer major17 when locally available; major16 is acceptable if explicitly qualified. Local engine installation through ordinary approved package sources is allowed without cloud provisioning/service cost. No hosted Supabase access, personal data or remote defaults. Inspect reused process/cleanup controls before execution; strip credentials, use -X, private socket/directories, bounded processes, and stop only owned resources. A stopped/missing-system-cluster assumption is not a license to touch an unrelated cluster. Never import scripts/db/sql.mjs.

Verify real wrapper behaviour for moderator+/AAL2, user/creator, missing/wrong AAL, missing/deleted/anonymous subject including privileged profile, anon/service_role, direct table denial, unchanged private ACLs, string transport and exact match to inner counts/timestamps/version. Prove no args/new elevated owner and rollback of wrapper alone leaves accepted objects intact in the disposable fixture. Do not relabel mocks or source scans as SQL execution.

Application tests: disabled-by-default; hosted/Production/Preview/unknown/remote denied even flag=true; no new RPC while disabled; role-backed AAL2 gate before count query; forbidden versus absent producer versus network error; valid window0; invalid row shapes, counts/version/timestamps/window; >MAX_SAFE_INTEGER canonical string transport; no sensitive fields; display of exact database clock/caveats; no data leak to a second request/user; rejected fixtures cannot render numbers. Test the actual reader and renderer modules, not only source regex.

Run relevant existing auth/capability tests, typecheck/lint/build, API protection/schema-reference/exports/dead-code/dependency/operating-mode hygiene with current repository commands. Do not evade hygiene by editing its scripts or generated global schema. If the future local RPC name is blocked by schema-reference policy, return that precise TL blocker rather than claiming it is installed or weakening checks. Browser verification uses installed agent-browser/Playwright guidance when feasible; do not start a hosted authenticated session.

Evidence: exact source SHA/hash, actual engine, commands/exit codes, distinct SQL/application/static/UI assertion counts and limitations. Fresh exact-head CI/Auth/Preview after push are integration evidence only. No live statistics PASS. Freeze once; report later CI results in PR conversation rather than status-only commit churn.

## 8. Multi-Agent Suitability / sequencing

Decision: **MULTI_AGENT across independent lanes; SINGLE_AGENT inside this delivery path**.
- #551 `Jetnity V1 continuity refresh 3`, Generation1, session `bc-e268a98c-10c1-428f-94ae-99f3246f460a`, exclusively owns four central docs plus its deliverables. At preflight head cc1dc599c60adafe5491ecc6fe57417a4cb97b73 was observed; not TL-PASS/merged.
- This NEW agent exclusively owns this delivery code and its own evidence; no #551 file edits. It reuses only already-merged #550/#552 code. Completed builder/reviewer sessions must not be restarted for this work.
- Backend/parser/renderer share one new local transport/activation contract. Splitting them into competing writers now creates avoidable divergence; one implementer owns the whole bounded path. Independent exact-head review remains TL responsibility; a later specialist needs a separate read-only assignment, not an automatic new agent.
- #551 retains integration priority. This task may implement in parallel but **must not merge main, rebase, force-push or import #551** until TL separately binds an accepted sync SHA. Report main drift. TL reviews/merges #551 separately, then explicitly synchronizes and re-gates this PR. No new main merge during #551 final gating.
- Later central-doc updates are TL/#551 coordination, not this writer's responsibility. Current startup observations are dated pins, not an instruction to abandon this versioned task.

## 9. Limits, cost and STOP

P0: no incident asserted. P1 prevention: accidental hosted activation, unauthorized aggregate disclosure, credential fallback, client access widening. P2: precision, lifecycle/window/source truth and failure/denial handling; future trusted-postgres breadth remains a Production risk. P3: local-engine/version and UI/E2E evidence limitations.

This is ordinary scoped implementation under the user's request, not a new business model, launch condition or phase reorder. Preserve Switzerland-first, Flight-first/provider-later, jetnity.com without cutover, disabled TL automation and accepted OS/Grok limitations. No new infrastructure/plan upgrade/spend-limit increase, no paid external/model/provider call. Existing required Cursor-model usage is the only commissioned agent consumption; do not invent unlimited/free balance.

No Production/Development/Preview migration or SQL read/apply, no new migrations directory file, secrets, provider terms/contact, SMTP/legal/deletion/retention/identity work, money movement, public indexing/domain action, or parallel central-doc update. If local execution is blocked, report the exact missing capability and keep tests truthfully scoped.

Deliver STATUS/HANDOFF/SELF_REVIEW plus code/tests and a concise later activation checklist: new local wrapper, exact unchanged producer, required fresh Production metadata/owner/ACL check, shared banned-status issue, rollback and PO gate. Do not create another broad audit document.

**Do not mark Ready. Do not merge. Do not start any other agent or follow-up slice. STOP FOR INDEPENDENT TL EXACT-HEAD REVIEW.**
