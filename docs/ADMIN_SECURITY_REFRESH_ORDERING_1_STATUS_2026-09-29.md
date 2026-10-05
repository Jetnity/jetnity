# Admin Security Refresh Ordering 1 — STATUS

Stand: 29. September 2026
Issue: #619
Draft PR: #620
Branch: `fix/admin-security-refresh-ordering-1`
Baseline: `main@6b267186bd8f8261b76583cc3a20af4ddc4fbf89`
Writer: **Jetnity admin security refresh ordering 1**, Generation 1
Session: https://cursor.com/agents/bc-793ea096-8fef-4cc6-967e-79aca80c981f
Model: `grok-4.7-high-fast` (dispatch: Grok 4.7 High Fast, not Auto)

## Status

Implementation and local validation are complete on this branch. The review target is the branch tip that contains this status. That is not a PASS, Ready or merge.

## What changed

`SecurityWidget` gives each list read an increasing identity. After a newer read has started, an older success or failure cannot publish data, error or loading state.

- The 15-second poll, manual refresh, and the refresh after a successful block or unblock still call the same `refresh`.
- A current failure still keeps already shown data and says the update failed.
- #614 filter wording and #618 200-row bound notices are unchanged.
- Block and unblock request bodies are unchanged.

## Evidence

`docs/evidence/admin-security-refresh-ordering-1/`

Baseline `before.json`: on the unguarded widget, resolving B then A let `synthetic-older-read` replace `synthetic-newer-read`. No POST.

Fixed `after.json`: newer success, newer failure, loading, one extra poll tick, manual refresh, current-failure stale data, filter miss, both bound notices, synthetic block and unblock. No Production write.

## Validation

| Check | Result |
| --- | --- |
| `lib/admin/security/refresh-reihenfolge.test.ts` | 3 pass |
| `lib/admin/security/filter-ehrlichkeit.test.ts` | 5 pass |
| refresh-ordering actual-widget harness | pass |
| #614 actual-widget harness | pass |
| #618 actual-widget harness | pass |
| `npm test` | 4040 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 144 warnings, none added by this slice |
| `check:dead` `check:exports` `check:deps` `check:api-schutz` `check:schema-bezug` `check:operating-mode` | pass |
| `npm run build` | pass; `check:setup` warned that no `.env` / `.env.local` is present |

`npm ci` was not re-run. Database and Auth checks were not run because this slice does not change them.

## Boundaries held

No list, block or unblock route edit. No SQL, Auth, RLS, enforcement, ingestion, retention, users, payments, package, workflow or global-continuity edit. No overlap with PR #616 (`fd73e7e`, users created-at only). `origin/main` was re-read at `6b267186` before STOP and this branch was 0 behind it.

## Next step

Independent ChatGPT / Technical Lead code and interaction review of this exact branch tip. Cursor does not Ready, merge, or start a follow-up.
