# Jetnity Admin Security Console Completion 1 — PLAN

**R109-A · 26 October 2026 · Cursor Generation 1**

## Goal

Complete the existing Security console read, recovery and local-blocklist journey. Authorization, ingestion, retention, capabilities and the security APIs stay frozen.

## Source-confirmed defects

- `SecurityWidget` accepted any array from `liste()` and could render malformed rows.
- Every read error, including 401/403, kept the previous rows on screen.
- `setInterval(refresh, 15000)` started another list read even while one was still in flight.
- Block and unblock had no subject lock, no captured intent, and reported the outcome through a disappearing toast. A transport failure was presented as a simple failure. A later list refresh could be mistaken for persistence proof.

## Owned shape

- `lib/admin/security/response-contract.ts` validates the bounded payload and applies an authoritative read: denial clears protected rows; a later disturbance or malformed 200 cannot restore them; only an accepted read can. Display text does not copy the server body.
- `lib/admin/security/operation-lifecycle.ts` records one operation per captured IP. The same subject cannot be started twice or in the opposite direction while pending. Settling A does not clear B. An older id cannot close a newer pending operation. `ok: true` is callback-accepted, not storage proof. A thrown fetch is unconfirmed, not proof of no write. Another attempt starts only from an explicit decision.
- `SecurityWidget` keeps latest-read ownership. The 15-second timer does not start a read while one is in flight, and a third overlapping read is refused. Settlement after unmount does not write state. Form and filter state are not rewritten by a settlement, and settlement does not move focus.
- `SecurityOperationStatus` plus `security-widget.module.css` hold the persistent subject feedback and long-text wrapping.
- Existing taxonomy, recorded-only copy, filter-versus-source empty states, and the independent 200-row notes stay.

## Explicitly untouched

`app/api/admin/security/**`, `lib/auth/**`, `lib/admin/ladezustand.ts`, shared error UI, taxonomy, package, workflows, global CSS, database, and sibling lanes.

## Verification

Focused node tests for the two new modules, the existing security widget regressions, a Playwright mount of the production component with synthetic fixtures and external requests aborted, then typecheck, lint, hygiene checks and production build.

## Session

Logical name: Jetnity Admin Security Console Completion 1 — Cursor Generation 1.  
Runtime: `grok-4.7-high-fast` (`originalModelName` from Cursor Cloud run-info, re-read 26 October 2026).  
Session: https://cursor.com/agents/bc-9b7c74e9-fd6c-4732-a7ea-727620d8466e

## R1 correction

Technical-Lead review of `c239bef1059453734070fbe22cf0a8aa6015e9e2` found two acceptance gaps. Both stay inside the owned client files. The frozen block route is unchanged.

### Denial covers the protected view

A current GET 401/403 already cleared rows. It left the operation book visible, so captured IPs, reasons and event-derived subjects stayed on screen. A POST 401/403 only latched writes and left the accepted rows and KPIs in place. "Schreibschutz aufheben" cleared that latch without a new read.

The correction:

- A current read denial and a current write denial both drop protected rows, KPIs and displayed operation subjects.
- The operation id counter is kept. An in-flight result cannot close a later operation for the same IP, and it does not start another list read.
- A write denial moves the read generation forward, so an older in-flight GET 200 cannot restore rows.
- Writes become available again only after a later accepted read.
- The recovery control is "Erneut lesen". It starts a list read and does not post. Form text and focus stay.

A write refusal and a missing read permission stay different messages. Neither message grants a privilege.

### Long text matches the frozen server

The block route stores any trimmed reason. The reader used to reject reason or detail text longer than 2000 characters, so one accepted write or one existing row made the whole list unreadable.

The reader now accepts a string of any length and still rejects a non-string, a bad row, a duplicate, a bad date and an array over 200. The view shows the first 2000 characters and states that the remainder is not visible. The manual reason field stops at 2000 characters, and `beginnVorgang` refuses a longer captured reason, so this console does not write a value it would then have to truncate. Existing longer rows still load, and Entfernen stays available.

## R2 correction

Technical-Lead review of `5fedc5a11b6054462dfcc3db1fa427aec5b032b1` found that `.zelle` wrapped IP and event-type cells at any character. At 320px and 390px, `203.0.113.51` occupied twelve visual lines. The horizontal region and keyboard action still worked. This correction does not change that access path.

Owned CSS and markup only:

- IP, event type, user id, time and blocklist IP use `.identitaet` (`white-space: nowrap`). The full token stays one line. The existing table region scrolls horizontally.
- Detail and reason keep `.detail`: bounded height, a 12rem to 24rem measure, and wrapping for long free text.
- No shared CSS, framework, server or taxonomy change. Main is not synchronized.
