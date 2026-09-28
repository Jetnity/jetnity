# Admin user created timestamp honesty 1 — status

Stand: 28 September 2026
Status: **IMPLEMENTED / DRAFT / STOPPED FOR INDEPENDENT TECHNICAL-LEAD CODE + RENDER REVIEW**

## Identity

- Logical agent: **Jetnity admin user created timestamp honesty 1**, Generation 1.
- Session: https://cursor.com/agents/bc-decff300-3d45-499e-9b41-8c26cc8116ce
- `originalModelName=grok-4.7-high-fast`. Dispatch required Grok 4.7 High Fast. Not Auto.
- Issue #615. Draft PR #616. Branch `fix/admin-user-created-timestamp-honesty-1`.
- Baseline `main@135558c485baf7de844056d81190824eed3ad84e`. Re-read during this session: `origin/main` is still that SHA. This branch was 0 behind it before the implementation commits.
- Parallel writer: Draft PR #614, branch `fix/admin-security-filter-honesty-1`. No shared file. This slice did not edit Security or Payments paths.

## What changed

- `profilErstellt` keeps `null` and `undefined` as `null`. It does not substitute `new Date().toISOString()`.
- The users page mapper calls that function.
- `UserRow.created_at` is `string | null`. A missing value renders `—`. A real value still uses `Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' })`.
- `last_seen_at`, search/debounce/pagination/Back-Forward, role/status actions, and the page's empty-versus-error branch are unchanged.

## Checks

| Check | Result |
| --- | --- |
| Focused mapper/display tests | 4 pass |
| Users search/navigation unit tests | 8 pass, inside the full suite |
| Rendered UsersTable, synthetic rows | Baseline invented `29.09.2026, 00:31`. Fixed null cell is `—`. Real timestamp is `15.06.2024, 16:30`. |
| `npm test` | 4036 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 144 warnings. The four `any` warnings in the users page and table are pre-existing and were not edited. |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | pass. Schema check still prints the existing local/unapplied `admin_account_counts_v1` note. |
| `npm run build` | pass. `check:setup` warned that this workspace has no `.env` / `.env.local`. |

`npm ci` was not re-run. The existing install was used.

## Boundaries held

No DB migration, `NOT NULL`, backfill, Production read or write, Auth/RLS, package, lockfile, workflow, or global continuity edit. `docs/ACTIVE_WORK_STATUS.md` was not updated; this task forbids that write.

## Stop

Cursor does not Ready, merge, or start another slice.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD CODE + RENDER REVIEW.**
