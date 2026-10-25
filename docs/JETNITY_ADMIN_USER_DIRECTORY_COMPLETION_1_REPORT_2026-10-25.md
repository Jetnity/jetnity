# R107-D — Admin User Directory Completion 1 — REPORT

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime `grok-4.7-high-fast`.

## Correction for review head d29a6213

### R2 — delayed search acknowledgement versus a newer role or status

`commitFilters` no longer executes `setOwnSearchAcks([])`. The role or status replace is still built from the committed query, still snaps the field to that committed query, and still goes through `dispatchNavigate`. The older search href remains in `ownSearchAcks`.

When that older `?page=1&q=anna` address is committed, the acknowledgement is still own. The field stays empty. The open operation remains the newer filter, so the phase stays unsettled and the status stays on the previous query. The queued filter is then committed. Only that landing becomes Aktuelle Ergebnisse.

`role-keeps-delayed-search-ownership` selects Rolle `operator`. `status-keeps-delayed-search-ownership` selects Status `pending`. Each case delays commits, types `anna`, selects the filter, commits the `anna` replace while the filter stays queued, and then commits the filter. Neither case drops a queued replace. Final addresses are `page=1&role=operator` and `page=1&status=pending`, both with an empty field and zero action calls.

`clearFilters` is unchanged. `clear-supersedes-delayed-search` still commits the delayed `anna` replace before the clear. `goto` still clears acknowledgements on a page change. External and native Back/Forward cases stayed green.

## Earlier correction, still in force

Reviewed head `43aafe56` was corrected in `fb3f13cf` and independently accepted for its three findings:

- Retry uses validated query identity. Literal href matching stays strict.
- Clear keeps an in-flight search acknowledgement and still dispatches when the clear target is the current URL.
- Keyboard proof presses Tab and Enter.

## Unchanged product rules

Guard, select, order, page size 20, mutation expressions, the 1…5000 ceiling, the 8000 ms lease, and the #608 debounce/history cases stay as in the accepted plan. D-EX1 remains the two assertion files only. Unknown stored role and status still display as the default role and `active`.

## Gates on this correction

Focused tests 69/69 after `5575794c`. Mounted 44/44 on that commit, dirty empty at capture. `npm run typecheck` exit 0. `npm run lint` exit 0, 181 warnings, 0 errors. Hygiene checks exit 0. `npm run build` exit 0, compiled in 4.2s, `/admin/users` dynamic. `npm test` exit 1 with the 11 local PostgreSQL failures listed in `gates.json`.

## Main-sync 1

No product, test, runner, harness, screenshot, dependency, or configuration file changed for the sync. The merge commit is `b83477489864ed357f27c7bd1bd8d8b5ee92484c`, tree `4e9032f5c455ed54074eef379d491e349a33c0a0`. Retained evidence still names its original execution heads. The 44-case receipt and the 69 focused results were not rerun. The two repository-wide client-factory tests are not input-identical, because they see 14 incoming non-test TS/TSX paths. The fresh native App run is their integrated-tree gate.

## Database, security, cost

No migration, RLS, grant, Auth, or provider change. No new dependency or monthly cost. Role and status mutation functions were not edited.
