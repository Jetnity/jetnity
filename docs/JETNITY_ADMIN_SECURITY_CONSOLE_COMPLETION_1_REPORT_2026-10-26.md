# Jetnity Admin Security Console Completion 1 — REPORT

**26 October 2026 · Cursor Generation 1 · R1**

## What changed

The Security console still reads `/api/admin/security/list` and posts block and unblock to the existing routes. A 200 becomes current data only after every displayed event and blocklist field passes `pruefeSecurityListenAntwort`. Unknown event types stay visible and are not reclassified.

A current GET 401/403 clears protected rows, KPIs and displayed blocklist operations. A current POST 401/403 does the same and uses a write-refusal message, not the read-permission message. The operation id counter is not reset. An older in-flight GET, and the later result of an operation that started before the denial, cannot put rows or operation text back and cannot send the write again. Only a list read started after that denial, and then accepted, restores rows and enables writes. "Erneut lesen" starts that read. It does not post and it does not grant a permission. Form values and focus stay put.

The reviewed contract rejected reason or detail text longer than 2000 characters. The frozen block route accepts any trimmed reason, so a 2001-character reason could be stored and then make the next list unreadable. That rejection is removed for strings. Non-strings, bad rows, duplicate ids or trimmed IPs, invalid dates and arrays longer than 200 are still rejected. The view shows the first 2000 characters and says the rest is not visible in this view. The reason field and `beginnVorgang` stop at 2000 characters. An already stored longer value still loads, and its removal action stays available.

The 15-second timer does not start a list read while one is in flight. A third overlapping read is refused. Settlement after unmount does not write state. Recorded-only copy, filter-versus-period empty text, taxonomy and the independent 200-row notes remain.

## Preserved failure

On `c239bef1059453734070fbe22cf0a8aa6015e9e2`, a denied GET left the previous operation book visible, a POST 401/403 left accepted rows in place, and "Schreibschutz aufheben" only cleared a local latch. `detailOderNull` rejected `SECURITY_DETAIL_MAX + 1`. Those are the R1 defects. The mounted cases below keep the original malformed, duplicate, date, oversized-array and ordering counterexamples and add the denial and long-text cases.

## Verification

Focused unit tests for the response contract, operation lifecycle, refresh order, filter honesty, coverage truth and taxonomy: 35 passed.

Mounted production component, project CSS, synthetic fixtures, Playwright Chromium, external requests aborted (`example.com` blocked): 17 cases passed.

- valid → 401 → 503 → accepted recovery
- valid → 403 → malformed 200
- malformed 200 keeps the accepted snapshot
- oversized 201, empty period, filter-empty and 200-row bound
- old success after denial, old denial after newer success
- slow read across 45 seconds
- duplicate add, add/remove conflict
- independent subjects, focus and filter retention, explicit retry without a silent resend
- write 403 hides rows and operation text; "Erneut lesen" does not post; form and focus stay; no silent resend
- operation started from a visible event, then current GET 403; the later POST 200 does not restore rows or start a read
- POST 401, then an older pending GET 200, does not restore rows
- denial → accepted recovery → new same-IP operation → the old POST 200 leaves the new operation pending
- manual add of a 2000-character reason round-trips in the follow-up list with removal enabled
- an existing 4000-character detail and reason stay readable, show the truncation note, hide the tail, and keep removal enabled
- keyboard details/focus, 320/390/768/1280 and 200% text
- unmount ignores a late settlement

Evidence: `docs/evidence/admin-security-console-completion-1/report.json`.

`npm test`: 7255 passed, 5 skipped, 11 failed. All 11 failures are local PostgreSQL 16 proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED` because local PostgreSQL binaries are absent). This session has no PostgreSQL server binaries. Those tests do not import this slice.

`tsc --noEmit` passed. The production build also ran TypeScript and passed. `npm run lint` passed with 0 errors and 178 existing warnings. One warning is `Date.now()` in `SecurityWidget` during render; that clock read was already how the 24-hour KPIs were calculated. Hygiene checks `check:dead`, `check:exports`, `check:deps`, `check:api-schutz` and `check:schema-bezug` passed. `npm run build` passed (Next.js 16.4.1). Setup check warned that no `.env` file is present. No migration ran.

Node `v22.23.4`.

## Limits

No signed-in admin, no physical device, no hosted database, no production mutation. A callback and a bounded list are not storage proof. Preview and CI for this tip were not observed in this session.
