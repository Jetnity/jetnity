# Jetnity Trip Plan Premium Experience 4 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #662
Draft PR: #663
Branch: `feat/trip-plan-premium-experience-4`
Baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
`origin/main` re-fetched in this session: still `2530020dbc6797b17d64c064ca5474cf90804272`. This branch is 0 behind that main.
Audited runtime: `01aaa9ab9c20b6e05e9ebf1d4aedb440b1ae3907`
Agent: **Jetnity Trip Plan premium experience 4**, Generation 1
Session: https://cursor.com/agents/bc-057a244a-5a54-43b2-8c6f-182dcc32598e
`originalModelName`: `grok-4.7-high-fast`

Required model Grok 4.7 High Fast was the session model. No Auto substitution.

This file is the delivery record. It is not a Technical-Lead PASS, Ready, or merge.

## 1. What changed

Presentation of Reiseplan only. `timelineAbleiten`, day order, stage assignment, `onTagWechseln`, add/delete, item detail, the mode URL, and the no-provider first paint stay.

- Phone, below 768px: a compact navigator shows the active day, `Tag X von Y`, and previous/next controls. Each stage keeps a one-row snap strip inside the same panel, so a later stage is directly selectable and the days do not wrap into a wall.
- From 768px to 1023px the day index is a 4-column grid. From 1024px it is a 7-column grid. Both stay grouped by stage, with the stage name and date range. The phone strips are hidden at those widths.
- The selected day, its heading, `Punkt hinzufügen`, the form, the empty line, and the items share one panel. The day grid sits under that panel as the index.
- An empty day is one line: `Noch nichts an diesem Tag.`
- Items stay in stored order and read as a timeline. A clock is shown only when `startsAt` exists. Flight price keeps the existing amount and `zum Auswahlzeitpunkt`. No status, route, booking, or score was added.
- At 200% text the add form uses tighter padding, wrapping actions, and chips that can break inside the 360px page.

`TripWorkspace.tsx` was not edited. The selected day remains component state. Reload, Back, and Forward still return to the canonical first day. That is the existing contract, not a new URL day parameter.

## 2. What was measured

Production-like Chrome, `next start` on `http://127.0.0.1:3456`, `JETNITY_UI_AUDIT=1`. Provider and assistant routes intercepted. Synthetic trip only.

Evidence: `docs/evidence/trip-plan-premium-experience-4/audit.json`
The Product Owner device addendum on PR #663, comment `5920702000`, is included. The Technical Lead parallel-safety note `5920594564` is respected: `TripWorkspace.tsx` was not edited.

First PASS `2026-09-30T22:27:59.148Z` on runtime `01aaa9ab`. The device-matrix re-run is recorded in section 5 after the audit script commit. The server was a fresh Next.js 16.3.8 production build of `01aaa9ab`. Phone 360, phone 390, tablet 768, and desktop 1440 interaction flows stay in the same script. A failure is listed in `fehler`.

| Surface | Result |
| --- | --- |
| 360×800 and 390×844 | navigator, `Tag 1 von 32`, no page overflow, no raster, two one-row strips (21 and 11 days, row span 0), empty day 24px, zero provider calls |
| 768×1024 | two 4-column grids, no phone strip |
| 1024×768, 1440×900, 1920×1080 | two 7-column grids, no phone strip |
| 200% at 360 | root font 32px, form open, no page overflow, inputs at least 16px, empty day 96px |
| Reduced motion at 390 | reduced motion active, `scroll-behavior: auto` |
| Shapes 1, 7, 14, 21 | `Tag 1 von N` at 390 and 1440; a one-day trip disables both ends |
| Day 16 | titles `Tsukiji Outer Market`, `Freier Nachmittag`, `Flug nach Osaka`; times `09:00` and `18:40` only; price truth present |
| Day 22 / 32 | Osaka empty day; last day disables next and stays visible |
| Form | blank title shows `Ein Titel ist nötig`; Abbrechen closes the form |
| Delete | control at least 44px; the audit stub leaves the item in place |
| Detail | opens `item-morgen` and keeps `ansicht=plan` |
| History | reload, Back, and Forward restore Reiseplan at `Tag 1 von 32` and keep `spur=bleibt` on the entry path |
| Focus | Tab from the plan heading shows a focus ring |

## 3. Local gates on this runtime

| Gate | Result |
| --- | --- |
| Focused helper and source contract | 6 pass, 0 fail |
| `npm test` | 4107 pass, 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | exit 0, 148 warnings, 0 errors. `TripWorkspacePlan.tsx` has no warning. The day-change form reset is render-time, so the earlier `set-state-in-effect` warning on that reset is gone. |
| `npm run build` | pass, Next.js 16.3.8 |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | 0 unused |
| `check:api-schutz` | 12 admin routes |
| `check:schema-bezug` | exit 0. Existing note: local/unapplied `admin_account_counts_v1`. Not part of this slice. |
| `check:operating-mode` | PASS |
| `check:setup` | exit 0. Warning: no `.env` / `.env.local` in this environment. |

## 4. Parallel safety

`origin/main` was fetched before this record and is still the baseline. No integration commit was required. `docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` were not edited. They are not owned by this slice.

## 5. Device matrix

Presentation rule, same product truth:

- Below 768px: navigator and one-row stage strips. This covers 320, 360, 375, 390, 412 and 430.
- 768px to 1023px: 4-column stage grids. This covers 768, 820, and a landscape phone at 844×390.
- From 1024px: at most 7 columns. This covers 1024, 1280, 1440, 1728 and 1920.

125% and 150% are CSS `zoom` on `documentElement` at 1440×900. The root font stays 16px. The grids stay at 7 columns and the page does not overflow.

Matrix re-run `2026-09-30T22:33:50.508Z`. JSON sha `fa493ee5c8e2c859bb5ada3c6a1c38556b16ae13`. Result **PASS**, `fehler` empty, `konsole` empty, 26 recorded steps. That commit adds the audit script only. Runtime remains `01aaa9ab`. A later docs commit does not change the measured page.

## 6. Exact-head remote

Not read yet for the tip that contains the device-matrix audit. Checks on an earlier head, including any Building or Ready comment from the seed push, do not approve this delivery.

## 6. Not claimed

No physical device. No signed-in account shell beyond the audit route. No Production, provider, payment, Auth, schema, package, navbar, footer, favicon, or homepage change. Items are not reordered by clock. The selected day is not stored in the URL.

Cursor does not mark Ready and does not merge.
