# UX V1 U1-A3 header density — handoff

**28 October 2026. STOP for independent Technical Lead review.**

## Identity

- Session name: Jetnity UX V1 Header Density Correction 1 — Cursor Generation 1
- originalModelName: `grok-4.7-high-fast`
- bcId: `bc-7fd58f05-dda1-453a-acf4-0ae3afd382c0`
- URL: https://cursor.com/agents/bc-7fd58f05-dda1-453a-acf4-0ae3afd382c0
- Branch: `fix/ux-v1-u1a3-header-density-1`
- Parent: `5b1b65e8db247de17466f8f02eb466222de08310`
- Merge-base / accepted main: `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`
- Tracking: #1075. Draft PR #1077. Parent UX U0 #1064.
- Parallel writer: #1076 / `bc-c363f33c-f1e2-46a4-b33c-3888008e64a0` owns `TripWorkspace.tsx`, `TripWorkspaceModeNavigation.tsx`, `lib/trips/ux-u1a-shell-1.ts`.

## What changed

Owned density only. Full title, route, dates, save truth, traveller/budget disclosure, help sentences, 44px Reise ändern, and aria/focus/Escape behavior stay. No new trip action, no provider call, no percent.

## Evidence

- `docs/evidence/ux-v1-u1a3-header-density-1/before.json`
- `docs/evidence/ux-v1-u1a3-header-density-1/after.json`
- `docs/evidence/ux-v1-u1a3-header-density-1/delta.json`
- Guest 390×844: heading 639→572, attention 739→632, first row 833→725.
- Guest 1440×1000: heading 645→529, attention 745→589, first row 758→602.
- Button height 44px at root 16 and 88px at root 32. Overflow 0. Keyboard Enter opens the edit surface and Escape returns focus. No passive provider URL.

## Residuals the next reviewer should keep

- Navbar, page padding, Meine Reisen, and the full guest notice are outside this write set. They still set a floor.
- At 390×844 the Jetzt wichtig header is in the first viewport. The first attention row still starts under the fixed bottom nav (parallel #1076, currently more than one row). This slice did not edit that nav.
- 280px and root 32px still place the overview below the first viewport. The long title stays fully visible and is not clamped.
- The audit client does not pass `kopfzeile`. Discard/delete in the harness is a sibling under the card, so the slot's own padding change is not the measured delta.
- Not claimed: native zoom 200%, physical keyboard, safe-area hardware, VoiceOver, Work A01–A16, Production y coordinates.

## Next step

Technical Lead reviews this exact head. CHANGES REQUIRED stay in this same session. A new head invalidates this gate. Cursor does not Ready, merge, or start U1-B / U3-A / U4.

Preserved holds: #917, #985, #982, #968, #748, #1073, DiscoverCars #1059, Trip.com #1056, prelaunch noindex, USD 100/month. No SQL, Auth, secret, provider, payment, or launch change.
