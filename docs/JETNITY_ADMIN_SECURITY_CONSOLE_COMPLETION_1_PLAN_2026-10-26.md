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
Runtime: `grok-4.7-high-fast`.  
Session: https://cursor.com/agents/bc-9b7c74e9-fd6c-4732-a7ea-727620d8466e
