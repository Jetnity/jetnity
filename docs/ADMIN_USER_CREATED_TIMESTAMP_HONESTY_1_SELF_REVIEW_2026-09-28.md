# Admin user created timestamp honesty 1 — self-review

Stand: 28 September 2026
Role: implementation writer, not the independent reviewer.
The branch tip that contains this file is the delivery. It is not a Technical-Lead PASS.

## Attempts to refute the fix

1. `created_at = null` still becomes the page clock.
   Result: `profilErstellt(null)` is `null`. The page source no longer contains `new Date().toISOString()`. Refuted.
2. A null that reaches the table becomes 1 January 1970, because `new Date(null)` is the epoch.
   Result: the fixed cell uses the same `—` branch as `last_seen_at`. The rendered unknown row is `—`, and `after.json` records that this is not `01.01.1970, 01:00`. Refuted on the actual component.
3. A real timestamp loses de-CH formatting.
   Result: `2024-06-15T14:30:00.000Z` rendered `15.06.2024, 16:30` with `de-CH` medium date and short time in `Europe/Zurich`. Refuted for this timezone.
4. `last_seen_at` changed with the created-time cell.
   Result: the last-seen line is unchanged in the diff. The fixed render shows `01.07.2024, 10:00` for a real value and `—` for null. Refuted.
5. Opening the table rewrites the users URL, regressing #608.
   Result: with an empty confirmed search, the harness recorded zero `router.replace` calls after 700 ms. The search effect body was not edited. The #608 unit tests passed. The rendered #608 harness was not re-run in this environment. Not fully refuted at the old harness level.
6. Role or status actions run while painting creation time.
   Result: action stub calls stayed empty. Those handlers were not edited. Refuted for this render.
7. The error branch of the users page now looks like an empty list.
   Result: the page diff does not touch the `if (error)` return. Not re-executed against Supabase. Refuted only by diff.

## What this review does not prove

- A signed-in `/admin/users` session.
- A Production or Development profile whose `created_at` is actually null. No profile was read.
- The #608 browser harness (`scripts/admin-users-search-navigation-1-verify.mjs`). Playwright's Chromium cache is absent here, and that script was not modified to point at system Chrome.
- Exact-head CI, Auth configuration, or Vercel on the pushed head.

## Scope check

Runtime files: `app/(admin)/admin/users/page.tsx` mapper call, `components/admin/UsersTable.tsx` type and Erstellt cell, `lib/admin/profil-erstellt.ts`.
The helper exists so the mapper can be tested without executing the admin server page.
No search helper, users action, migration, generated schema, Security path, Payments path, package, workflow, or global continuity file was edited.

## Recommendation

Review the exact pushed head independently. Do not treat this self-review or the local 4036 tests as PASS. Cursor stays available for a head-bound fix in this same logical agent and will not start another slice.
