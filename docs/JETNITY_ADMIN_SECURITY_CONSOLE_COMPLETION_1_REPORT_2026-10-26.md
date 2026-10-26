# Jetnity Admin Security Console Completion 1 — REPORT

**26 October 2026 · Cursor Generation 1**

## What changed

The Security console still reads `/api/admin/security/list` and posts block and unblock to the existing routes. A 200 becomes current data only after every displayed event and blocklist field passes `pruefeSecurityListenAntwort`. Unknown event types stay visible and are not reclassified.

A current 401 or 403 clears protected rows and KPIs and disables writes. A later 503 or malformed 200 does not restore the cleared rows. Only a later accepted read restores them. A malformed 200 after an accepted read keeps that accepted snapshot and does not replace it with an empty list or with the bad payload. Operator text does not copy the server body.

The 15-second timer does not start a list read while one is in flight. A third overlapping read is refused. An older settlement does not write state. Settlement after unmount does not write state.

Block and unblock capture the trimmed IP and, for an add, the reason at click time. The same IP cannot be started twice or in the opposite direction while that operation is pending. Another IP stays untouched. `ok: true` stays a callback, not proof the bounded list contains the row. A thrown fetch stays unconfirmed, not proof that nothing was written. Another send happens only from "Vorgang erneut senden" or a new explicit action. A write 401/403 disables further writes until "Schreibschutz aufheben", which does not send by itself.

Recorded-only copy, filter-versus-period empty text, taxonomy and the independent 200-row notes remain.

## Verification

Focused unit tests for the response contract, operation lifecycle, refresh order, filter honesty, coverage truth and taxonomy: 32 passed.

Mounted production component, project CSS, synthetic fixtures, Playwright Chromium, external requests aborted (`example.com` blocked): 12 cases passed, including valid→401→503→accepted recovery, valid→403→malformed 200, snapshot kept on malformed 200, oversized 201, empty and filter-empty and 200-row bounds, old success after denial, old denial after newer success, a slow read across 45 seconds, duplicate add, add/remove conflict, independent subjects, focus and filter retention, explicit retry without a silent resend, write denial, keyboard details/focus, 320/390/768/1280 and 200% text, and unmount. Evidence: `docs/evidence/admin-security-console-completion-1/report.json`.

`npm test`: 7252 passed, 5 skipped, 11 failed. All 11 failures are local PostgreSQL 16 proofs (`initdb` ENOENT or local-proof connection refusal). This session has no PostgreSQL server binaries. Those tests do not import this slice.

`tsc --noEmit` passed. `npm run lint` passed with 0 errors and 178 existing warnings. One warning is `Date.now()` in `SecurityWidget` during render; that clock read was already how the 24-hour KPIs were calculated. Hygiene checks `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` and `check:schema-bezug` passed. `npm run build` passed (Next.js 16.4.1). Setup check warned that no `.env` file is present. No migration ran.

## Limits

No signed-in admin, no physical device, no hosted database, no production mutation. A callback and a bounded list are not storage proof. Preview and CI for this tip were not observed in this session.
