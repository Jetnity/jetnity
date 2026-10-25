# R107-D — Admin User Directory Completion 1 — REPORT

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime `grok-4.7-high-fast`.

## Correction for review head 43aafe56

### D-R1.1 — default-page retry

`retry` no longer requires the live URL text to equal a rebuilt `page=1` href. It accepts the click only when `decideUsersDirectoryRead` returns a query and that query key equals the failed read. An omitted page, a trimmed ` 1 `, and an explicit `page=1` are the same valid query. Repeated parameters, non-scalars, `page=5001`, and `page=nope` stay invalid and do not refresh. The lease, draft, and open-navigation guards still return before refresh.

Mounted receipts on `fb3f13cf`: `retry-omitted-page`, `retry-q-without-page`, `retry-padded-page`, and `retry-explicit-page` each record `refreshCalls: 1`. `retry-repeated-page-rejected` shows the invalid-address copy and zero refresh calls.

### D-R1.2 — clear versus a delayed search

`clearFilters` no longer drops `ownSearchAcks` and no longer returns early when a clear of the current URL still has an own replace in flight. The clear is dispatched behind that replace. `clear-supersedes-delayed-search` delays commits, types `anna`, clicks Filter löschen, then commits the queued `anna` replace. The field stays empty, the status stays on the previous query, and the operation does not settle. The next queued commit is the clear, and only that landing becomes Aktuelle Ergebnisse on page 1. The test does not drop the pending `anna` replace.

External URL changes and native Back/Forward still replace the field from the address. Those existing cases stayed green.

### D-R1.3 — keyboard

`keyboard-tab-and-activation` focuses the heading, then presses Tab. The page-1 sequence is search, Rolle, Status, Filter löschen, Nächste Seite. Disabled Erste Seite and Vorherige Seite are not focused. Enter on Nächste Seite sets `page=2`. After the error fixture, Tab skips disabled Nächste Seite and Enter on Erneut versuchen records one refresh. `css-error-layout` keeps the 390 px overflow screenshot and labels the old focus enumeration as retired.

## Unchanged product rules

Guard, select, order, page size 20, mutation expressions, the 1…5000 ceiling, the 8000 ms lease, and the #608 debounce/history cases stay as in the accepted plan. D-EX1 remains the two assertion files only. Unknown stored role and status still display as the default role and `active`.

## Gates on this correction

Focused tests 69/69. Mounted 42/42. `npm run typecheck` exit 0. `npm run lint` exit 0, 181 warnings, 0 errors. Hygiene checks exit 0. `npm run build` exit 0. `npm test` exit 1 with the 11 local PostgreSQL failures listed in `gates.json`.

## Database, security, cost

No migration, RLS, grant, Auth, or provider change. No new dependency or monthly cost.
