# Admin Users Search Navigation 1 — Task

Version: 1.0 — 2026-09-28
Issue: #607
Branch: `fix/admin-users-search-navigation-1`
Baseline: `main@46b35d9808dc8929fae6adf96aef3572249bf2f8`
Logical Cursor agent: **Jetnity admin users search navigation 1**, Generation 1
Model: **Grok 4.7 High Fast**; never Auto, never substitute.

## Authority and stop boundary
This Work chat executes exactly ONE slice delegated by the Product Owner. The normal ChatGPT main chat remains the overall Technical Lead/priority owner. Cursor is sole runtime writer. Work performs independent review and TL-only Ready/Merge after PASS. No next slice follows completion. Same-session fixes, no second runtime writer.

Read AGENTS.md and canonical governance, continuity, design and independent-review requirements. Live evidence wins. Existing special PO gates remain. If scope needs new data/permission/shared contracts, stop and report.

## Live reconstruction and candidate decision
At dispatch preparation main is #606 merge `46b35d9808dc8929fae6adf96aef3572249bf2f8`; CI 36476538615 SUCCESS, Production dpl_CKb9yA2UjF6QFKZvHMEwPQ6ELncD READY exact SHA. #606 was only reconciliation; Admin F palette shipped #545 and must not be rebuilt. Current continuity is delivery snapshot with a live-state rule; #606 is closed by TL comment 5877586836.

Open PRs are historical drafts #52/#50/#40/#39/#28. Open issues before #607: #585/#440/#395/#294/#236/#20. No relevant overlapping branch/writer was found. Cursor session inventory shows the prior reconciliation complete and no running overlapping writer. Another Work chat with this request was interrupted before tool or write work. Recheck live before writing; do not resume stale drafts.

Candidate order checked:
1. Admin E is genuinely absent: user list reads profiles only, trips remain owner-scoped, no minimised Support Trip RPC. Audit E requires a Privacy/RLS/Account/Trip shared contract; no authorization here to grant cross-user trip visibility.
2. AP-8 is genuinely absent: account settings has security/export/erasure, profiles is identity only, trip-scoped preferences already exist. Canonical AP-8 requires Profile/Identity decision and persistence/Production gates; no authorization here.
3. Bounded fallback selected because an existing Admin flow is demonstrably wrong. Already built #547 SEO status, AP-7 registry, AP-10 bookings and account-count local proof are not duplicates to build. More optional `folgt` labels alone are not useful work.

## Problem and initial evidence
`components/admin/UsersTable.tsx` search effect runs on initial mount and always sets page=1 after 400 ms. Work independently executed the exact unchanged effect body from main:
- initial `/admin/users?q=anna&page=3&source=support`
- no user interaction
- actual router.replace `/admin/users?q=anna&page=1&source=support`
- expected no navigation.
This is bounded source-effect evidence, NOT browser or signed-in proof. q initializes local state once, so later authoritative URL/query changes are not reflected reliably. Cursor must reproduce the initial defect with the ACTUAL rendered component before fixing, and preserve before/after evidence. If not reproducible, stop rather than invent a change.

## Scope ownership
Runtime allowed:
- `components/admin/UsersTable.tsx`
- one small focused `lib/admin/users-search-navigation.ts` helper only if necessary (avoid framework/abstraction growth)
Tests/evidence allowed:
- focused `lib/admin/users-search-navigation*.test.ts`
- focused actual-component harness/verification script `scripts/admin-users-search-navigation-1*.mjs`
- `docs/evidence/admin-users-search-navigation-1/**`
- task/report/self-review/handoff/status files `docs/ADMIN_USERS_SEARCH_NAVIGATION_1_*_2026-09-28.md`
Continuity allowed, minimal scoped additions only: JETNITY_START_HERE.md, docs/ACTIVE_WORK_STATUS.md, docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md. Use delivery-time snapshot plus live-PR-state rule so merged PR does not remain a false current writer. Record final TL closure as PR evidence; do not create a follow-up docs slice.

Do NOT edit server users page/actions, auth/roles/capabilities, Supabase/migrations, CI/config/dependencies/lockfiles, unrelated components or governance. Ask Work via report if an essential scope adjustment is needed; do not silently expand.

## Required behavior
- Opening/reloading any valid existing users page/query never automatically resets page or rewrites the URL.
- Browser Back/Forward or authoritative URL query changes synchronize the input without stale debounce overriding the navigation.
- Only an actual edited filter (normalized value different from committed filter) resets to page 1 after existing 400 ms debounce. Empty clears q; whitespace-equivalent edits do not reset current page.
- Preserve unrelated query params. Encode special characters safely using existing URLSearchParams semantics.
- Pagination must preserve the applied filter, change to the requested valid page, and not be undone by a pending search timer. Define a simple deterministic interaction for pending text plus page click; keep input/results consistent and test it.
- A later edit cancels an earlier timer. External navigation and unmount cancel stale timers. Avoid duplicate replacements and update loops, including StrictMode.
- Existing server authorization, user data set, role/status actions and their behavior stay unchanged. No real user role/status mutation in testing.

## Verification and evidence
First demonstrate red behavior on baseline using actual UsersTable with synthetic rows only and boundary stubs for Next router/params/actions. Then repeat on fix: deep link page 3, reload/remount, genuine edit, clear, whitespace no-op, punctuation/Unicode, pagination, Back/Forward, URL query+page changes, edit followed by external navigation before timeout, edit followed by page click, rapid edits, unmount cleanup. Distinguish actual-component harness from real Next signed-in E2E. Do not claim signed-in/physical-device/Production acceptance without performing it. Include desktop/mobile visual sanity and console errors; no secret or real user data.

Run relevant tests, typecheck/lint/build and required repository checks. Use existing tooling, no dependency additions. Full required CI/Auth and Vercel are TL exact-head gates; a previous green head is not acceptance. No bypass, no forced green, no provider calls or credentials printed.

## Delivery
Push focused implementation and evidence to this branch and existing Draft PR. Update PR around final behavior and validation. Persist session URL/id, exact model proof, baseline/head, allowed/changed paths, commands/results, before/after, limitations, self-review and handoff. Do not preclaim TL PASS/merge. Stop at commit/push/Draft review; Cursor never Ready/merges. Work reviews independently and sends findings to the same session. After TL integration, confirm stopped/no further writes. Main ChatGPT selects anything later.

## Hard non-scope
No Admin F rebuild, Admin E/AP-8 implementation, new APIs/data contracts/permissions, DB/Auth/RLS/Production mutation, provider contact/terms/DPA/signup/credentials/API calls, spend, payment live, indexing/launch, real account mutations, telemetry/PII, dependency or CI changes, fabricated provider tests, broad cleanup or additional slice.
