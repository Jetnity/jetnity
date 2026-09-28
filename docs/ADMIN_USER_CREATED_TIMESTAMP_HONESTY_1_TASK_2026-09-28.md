# Jetnity – Admin User Created Timestamp Honesty 1 – TASK v1

Stand: 28. September 2026
Issue: #615
Branch: `fix/admin-user-created-timestamp-honesty-1`
Canonical baseline: `main@135558c485baf7de844056d81190824eed3ad84e`

## 1. Objective

Fix a bounded Admin user-list truth defect: a missing/nullable profile creation timestamp must not be shown as the current page-render time.

Current mapping in `app/(admin)/admin/users/page.tsx`:
`created_at: r?.created_at ?? new Date().toISOString()`

The schema/type contract permits `created_at: string | null`. If null arrives, the UI invents a recent creation time.

Unknown stays unknown.

## 2. Parallel boundary

Active parallel PR #614 owns Admin Security filter honesty.

This slice must not touch:
- SecurityWidget / security copy / security routes;
- Payments paths;
- any #614-owned file.

No collision with #614 is expected.

## 3. Required reading

Before editing:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ADMIN_ACCOUNT_UNGATED_RESIDUAL_PRECHECK_1_REPORT_2026-09-28.md`
5. PR #610 TL FINAL PASS review `5345097798`
6. `app/(admin)/admin/users/page.tsx`
7. `components/admin/UsersTable.tsx`
8. current generated Supabase type / migration truth for `profiles.created_at`
9. current #608 users-search/navigation closure and tests.

Re-fetch current main/open PRs/active writers before material work.

## 4. Acceptance cases

1. Server mapper receives `created_at = null` → passes `null`, never `new Date().toISOString()`.
2. `UserRow.created_at` type reflects `string | null`.
3. UsersTable renders `—` (or equivalent explicit unknown) for null creation time.
4. Valid creation timestamp retains existing `de-CH` date/time formatting.
5. `last_seen_at` behavior remains unchanged.
6. Search/debounce/pagination/native Back/Forward logic from #608 remains byte-stable except where TypeScript type plumbing makes a strictly necessary local expression change.
7. Role/status edit actions remain unchanged.
8. Empty-vs-error behavior on the page remains unchanged.
9. No DB migration, `NOT NULL`, data backfill or Production mutation.
10. No Auth/RLS/capability change.

## 5. Evidence

Use synthetic rows only. Do not read or mutate Production profiles merely to prove a nullable path.

Before/after evidence must show:
- baseline null mapping would produce page-render time;
- fixed mapper preserves null;
- actual UsersTable rendering shows unknown marker for null and formatted de-CH output for a real timestamp.

If a component harness is used, state its limitations. Do not claim signed-in Admin Production E2E.

## 6. Exclusive write ownership

Allowed runtime writes:
- `app/(admin)/admin/users/page.tsx` — mapper only;
- `components/admin/UsersTable.tsx` — `UserRow.created_at` type + creation-time display only.

Optional:
- one narrow pure helper/test if necessary;
- focused audit/test script using existing tooling.

Allowed slice docs/evidence:
- `docs/ADMIN_USER_CREATED_TIMESTAMP_HONESTY_1_TASK_2026-09-28.md`
- STATUS / HANDOFF / SELF_REVIEW with the same prefix
- `docs/evidence/admin-user-created-timestamp-honesty-1/`

Do NOT edit:
- users search/navigation helper or its logic;
- users actions;
- migrations / generated schema;
- Security or Payments paths;
- package/lockfile/workflows;
- global continuity files from Cursor.

If correct implementation requires a forbidden path, STOP and report instead of expanding.

## 7. Hard boundaries

No:
- DB/Auth/RLS/Production mutation;
- real profile writes;
- provider/payment/spend;
- security ingestion;
- public indexing/launch;
- new dependency;
- C1/C2 implementation;
- follow-up slice.

## 8. Validation

At minimum:
- focused mapper/display tests;
- existing users search/navigation tests;
- actual-component or equivalent rendered proof for null + valid timestamp;
- full repository-required tests;
- typecheck;
- lint;
- Admin API protection;
- schema/dead/export/dependency hygiene;
- Production build.

Before STOP:
- re-read live main;
- confirm branch ahead/behind and no collision with #614;
- exact diff self-review;
- document evidence limitations.

Exact-head CI/Auth/Vercel remain Technical-Lead gates.

## 9. Agent contract

Logical agent: **Jetnity admin user created timestamp honesty 1**
Generation: **1**
Required model: **Grok 4.7 High Fast**
No Auto / no substitution.

Cursor is sole runtime writer for this slice.
Cursor does not Ready, merge, or start another slice.
Review fixes stay in the same logical agent/session.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + RENDER REVIEW.**
