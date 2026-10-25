# R107-D — Admin User Directory Completion 1 — REPORT

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime `grok-4.7-high-fast`.

## Implemented

The existing Admin user directory is a validated read. The page still calls `requireAdminPage({ surface: 'users', capability: 'konten-verwalten' })` before any query. A denial redirects to `/unauthorized?grund=forbidden` and is not caught. Invalid URL values never open the server client.

The inbound parser accepts one scalar `q` up to 200 trimmed characters, a canonical page from 1 to 5000, and exact `isRole` / `isAccountStatus` tokens. Repeated values, non-strings, an empty page, `page=5001`, `Admin`, and any other non-canonical role or status are invalid. Recovery drops the invalid keys, keeps the valid search and filters, keeps foreign keys, and returns to page 1.

A valid read selects `user_id, email, display_name, role, status, created_at, last_seen_at`, orders by `created_at` descending then `user_id` ascending, and ranges one page of 20. Text search still calls `textSuchfilter`. That helper does not escape `%` or `_`. Count `0` stays empty. A missing, fractional, or non-finite count stays unknown. Null data without an error is a read error, not an empty directory.

The table keeps the #608 search machine: 400 ms debounce, no mount reset, late own acknowledgement, Back/Forward, and page clicks on the committed query. Role and status commit immediately. An operation is owned from `router.replace` until the URL is acknowledged and a later `readAttempt` matches, or until a newer draft, navigation, Back/Forward, or unmount supersedes it. Rows from the previous query stay labeled until that settlement. The same-query retry calls `router.refresh()` once, disables the button, and ends when a new render of the same query arrives or when 8000 ms pass without one. The same error re-enables a later retry. A timeout does not claim success.

Pager and recovery destinations stay in 1…5000. Count 100001 remains visible. Its real span of 5001 pages is described. The last linked page is 5000. Page 5000 with an unknown count and 20 rows has no next link.

Dates use `de-CH` medium/short. Null, empty, and invalid timestamps render `Nicht verfügbar`. The row mapping still uses `profilErstellt(r?.created_at)` and `last_seen_at ?? null`.

`editable`, `changeRole`, `toggleBan`, and `assignable` are unchanged. Self rows and peer rows at or above the actor stay closed. Read controls do not call the role or status actions.

D-EX1 updates only the Admin Users assertion in `lib/next/request-api-compat.test.ts` and the table-formatter assertion in `lib/admin/profil-erstellt.test.ts`. `lib/admin/profil-erstellt.ts` is untouched.

## Files

Product and tests:

- `app/(admin)/admin/users/page.tsx`
- `components/admin/UsersTable.tsx`
- `lib/admin/users-search-navigation.ts`
- `lib/admin/users-search-navigation.test.ts`
- `lib/admin/users-directory-query.ts`
- `lib/admin/users-directory-query.test.ts`
- `lib/admin/users-directory-presentation.ts`
- `lib/admin/users-directory-presentation.test.ts`
- `lib/admin/users-directory-read.test.ts`
- `lib/next/request-api-compat.test.ts`
- `lib/admin/profil-erstellt.test.ts`

Proof:

- `scripts/admin-user-directory-completion-1/verify.mjs`
- `docs/evidence/admin-user-directory-completion-1/**`

Not created: `components/admin/users/UsersDirectory.tsx`.

Unchanged: TASK, PLAN, `actions.ts`, `lib/auth/**`, `profil-erstellt.ts`, `ladezustand.ts`, `Ladezustand.tsx`, `datenbank-lesen.ts`, `suchfilter.ts`, package, lockfile, workflows, operating mode, and global continuity.

## Database

No migration, RLS, grant, or generated-type change. The read uses the existing `profiles` select under the existing `konten-verwalten` guard.

## Tests and build

Focused directory, navigation, provenance, request-compat, and role tests: 68 pass, 0 fail, exit 0.

Mounted production `UsersTable` with the lane router stub and project CSS: 35/35, exit 0, on product commit `56bb915e78a55857132c5fe02384b8a64f2b81b8`. Widths 320, 360, 390, 768, and 1280. At 320 the root font is 32 px and the directory root does not scroll horizontally. Keyboard reach covers search, both selects, the pager, and retry. Reduced motion on the settled error adds no infinite animation inside the directory.

`npm run typecheck` exit 0. `npm run lint` exit 0, 0 errors, 181 warnings. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. `npm run build` exit 0. `/admin/users` remains dynamic. `check:setup` warned that this environment has no `.env` file and still exited 0.

`npm test` exit 1: 7192 tests, 7176 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL proofs: missing `initdb`, `local_proof_connection_override_forbidden` because `SUPABASE_PROJECT_REF` is set, or an explicit `NOT_VERIFIED` for missing local binaries. They are not directory failures. The 5 skips are the existing conditional browser, layout, and native-PostgreSQL skips. Names and errors are in `gates.json`.

## Security and cost

The guard and the action expressions are unchanged. Invalid parameters do not reach `from('profiles')`. No new dependency, secret, provider, payment, or monthly cost. No Production DB, Auth, AAL, or RLS action.

## Open

Native App, Auth, and Vercel still have to be read on the review head. This report does not claim them. P2 and P3 below stay outside the lane.
