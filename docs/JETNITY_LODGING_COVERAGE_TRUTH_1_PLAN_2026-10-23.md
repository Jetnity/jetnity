# Jetnity Lodging Coverage Truth 1 — PLAN

**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

## Session ACK (before material code)

| Fact | Value |
|---|---|
| Logical name | Jetnity Lodging Coverage Truth 1 — Cursor Generation 1 |
| Session | https://cursor.com/agents/bc-398f20b4-a2c0-4c54-bcc6-177bea4c1a3e |
| Session id | `bc-398f20b4-a2c0-4c54-bcc6-177bea4c1a3e` |
| Requested model | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual model | `originalModelName=grok-4.7-high-fast` from this run's identity. Not Auto. No fallback. |
| UI title | Renamed with the supported chat-title tool to the exact logical name. Read-back title matches. |
| Mode | `.jetnity/operating-mode.json` re-read: `NORMAL`. |
| Seed | `385d6974d82a19e4ebddf28891f004241783c789` |
| Seed tree | `48fa54fe784a405dbf88b8f0f7be7c097d748396` |
| Merge-base / `origin/main` at ACK | `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de` (1 ahead / 0 behind, task-only) |
| Immutable TASK blob | `5d424fd82ae5334aca79e999e3078101b8b4e44b` — not edited |
| Ownership | [6374412389](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6374412389). This lane is B / PR #983 only. |
| Newest #751 | 6374412389, then precheck 6374289422. |
| Newest #748 | 6373407485. P1 #968 remains separate. No cleanup, secret, or browser action. |

## Goal

Make the existing accommodation panel show the canonical unknown summary and qualified gaps, and drive the booking badge and action from the stored item booking status.

## Cause

`unterkunftAbdeckung` already returns `bekannt=true`, numeric totals, stay `status: 'unknown'`, and summary `Unterkunftsstand noch unklar` for a known trip with an undated, invalid, or reversed stay. `UnterkunftBestand` replaces that summary with `covered von total Nächten abgedeckt` whenever the totals are numbers, prints gap rows as `N Nächte fehlen`, and uses coverage `status` for the seal and the booking callback. An undated stay is always coverage `unknown`, so a stored `booked` item offers `Als gebucht markieren` and `(itemId, true)`.

## Change

Only `components/trips/UnterkunftBestand.tsx`.

1. If any stay has coverage status `unknown`, the heading is the canonical `zusammenfassung`. Otherwise keep the existing numeric heading when totals are known, and the canonical summary when they are not.
2. While any stay is coverage-unknown, gap rows keep the canonical date span and night count, but say `N Nacht/Nächte noch nicht als fehlend bestimmbar` and use the existing unknown seal (`Noch nicht vollständig bestimmbar`). Known gaps stay `Nacht fehlt` / `Nächte fehlen` with the open seal.
3. Badge and action use `istGebucht(item)`: booked → seal `Gebucht`, label `Buchung korrigieren`, callback `(item.id, false)`; unconfirmed → seal `Ausgewählt`, label `Als gebucht markieren`, callback `(item.id, true)`. Missing-date lines stay. No provider, payment, or invented coverage claim.

No evaluator, booking-helper, schema, action, or type edit. Traveller citizenship and documents do not change this result; none are read.

## Tests

New `lib/trips/lodging-coverage-truth-1.test.ts` renders with `renderToStaticMarkup` and invokes the real button `onClick` through the existing isolated render harness. Cases: booked and unconfirmed unknown dates; invalid and reversed dates; mixed dated plus undated, including full dated coverage that must not become `N von N`; known partial, full, empty, and out-of-period; absent callback; exact id and boolean. The new test must fail on the seed panel and pass after the change. Existing accommodation, manual-accommodation, and booking tests stay unchanged and green.

## Non-goals

No branch sync, Ready, merge, follow-up, hosted database, Auth, provider, secret, personal browser, or dependency change. Global continuity files stay untouched.
