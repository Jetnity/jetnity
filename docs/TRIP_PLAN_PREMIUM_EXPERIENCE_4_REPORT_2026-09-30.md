# Jetnity Trip Plan Premium Experience 4 — Report

Stand: 30 September 2026
Status: **R1 CORRECTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #662
Draft PR: #663
Branch: `feat/trip-plan-premium-experience-4`
Baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
`origin/main` re-fetched in this session: still `2530020dbc6797b17d64c064ca5474cf90804272`. This branch is 0 behind that main.
R1 runtime: `f64b27f3d1a6c8a65267db3f113c7e489b888a56`
Earlier runtime: `01aaa9ab9c20b6e05e9ebf1d4aedb440b1ae3907`
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
- At 200% text the add form uses tighter padding and wrapping actions so the page does not overflow.
- R1, exact head `967be7d8`: the counter no longer sits between the previous and next buttons. `Tag X von Y` and the selected date/stage are each one `nowrap` line. If a line is wider than the panel, that line scrolls. It does not break into single characters. Phone day chips use `nowrap` and `w-max` inside the horizontal strip. Previous and next stay at least 44px, at the edges on a phone and centered from 768px.

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
| 200% at 360 | root font 32px, form open, no page overflow, inputs at least 16px, counter and date each one line, day chips one label line and at least 88px wide |
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

The earlier matrix at `fa493ee5` passed overflow only. Technical-Lead R1 on `967be7d8` rejected that 200% navigator as unreadable.

R1 re-run `2026-09-30T23:11:36.924Z`. JSON sha `f64b27f3d1a6c8a65267db3f113c7e489b888a56`. Result **PASS**, `fehler` empty, `konsole` empty, 26 steps. The audit now fails if the counter or date wraps, or if a phone day chip label wraps or is under 44px. At 200% a chip must also be at least 88px wide. A direct measure on the 360/200% navigator showed `Tag 1 von 2` at 212×40 and `Do., 01. Okt. · Kyoto` at 212×40, both `nowrap`. The page `scrollWidth` stayed 360.

## 6. Exact-head remote

Read on 30 September 2026 for `9655a32a1d5bcd6cfde8474ccff92adc81444e9d`. That commit records the R1 audit of runtime `f64b27f3`. It does not change the navigator again. This is an observation, not a Technical-Lead PASS. Checks on `967be7d8`, `fe11f75e`, and the seed Vercel comment do not approve it. `origin/main` was fetched again before this record and is still `2530020dbc6797b17d64c064ca5474cf90804272`.

| Check | Result |
| --- | --- |
| GitHub Actions `36789940392` | success, head `9655a32a1d5bcd6cfde8474ccff92adc81444e9d` |
| Auth-Konfiguration gegen config.toml, job `110140214309` | success |
| Typecheck, Lint & Build, job `110140214020` | success |
| Vercel commit status | success, “Deployment has completed” |
| Vercel inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/971JJQz7W2y4xdNb8udG4FmLucK3 |
| Preview deployment | success, `6772206034`, https://jetnity-hosjh4f1n-jetnity-e1b93c82.vercel.app |

A later sentence that only records this table does not inherit these checks.

Historical read for `fe11f75e85b6a2c2b0c090aff2fc30471e01d5f2`. It does not approve `9655a32a`:

| Check | Result |
| --- | --- |
| GitHub Actions `36786320959` | success, head `fe11f75e85b6a2c2b0c090aff2fc30471e01d5f2` |
| Auth-Konfiguration gegen config.toml, job `110128463008` | success |
| Typecheck, Lint & Build, job `110128462902` | success |
| Vercel commit status | success, “Deployment has completed” |
| Vercel inspector | https://vercel.com/jetnity-e1b93c82/jetnity-app/S1mo1G85U8kcYfz8jt2ESr7wNPdX |
| Preview deployment | success, `6771642993`, https://jetnity-6mtnrgivm-jetnity-e1b93c82.vercel.app |
| GitHub review threads | none |
| GitHub reviews | none |

Checks on earlier heads, including the seed Vercel comment, do not approve `fe11f75e`.

## 7. Not claimed

No physical device. No signed-in account shell beyond the audit route. No Production, provider, payment, Auth, schema, package, navbar, footer, favicon, or homepage change. Items are not reordered by clock. The selected day is not stored in the URL.

Cursor does not mark Ready and does not merge.
