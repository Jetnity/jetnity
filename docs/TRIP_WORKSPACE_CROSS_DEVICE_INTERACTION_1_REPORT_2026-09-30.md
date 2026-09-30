# Trip Workspace Cross-Device Interaction 1 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #637
Draft PR: #638
Branch: `fix/trip-workspace-cross-device-interaction-1`
Baseline: `main@20bf11b0cf24460cf01d9dfe487b89bbfe555191`
Rejected head: `b09957c6ae39f84a7eb557dde48313a57af73dd9`
Integrated main: `ea6253d603e57cd19395cef951faabc75cb8ab3a` (merge-base, 0 behind)
Product head measured for the R1 after pass: `3264a2ef18f81c84c5d059eabc178e2b2358f263`
Agent: **Jetnity Trip Workspace cross-device interaction 1**, Generation 1
Session: https://cursor.com/agents/bc-5a2210fe-59cf-44e2-8994-2217e427ff58
`originalModelName`: `grok-4.7-high-fast`

## 1. What was already closed

#506 is the closed visual audit. #513 / #516 repaired first-screen hierarchy, localized dates, and the compact open/return scroll snap. Neither placed the desktop work surface in the detail column. This slice does not reopen them.

## 2. Reproduced defect

On the seed component tree, overview and detail share one desktop grid. Flight, stay, activity and mobility work mounted after that grid. At 1024 and wider, `Flug suchen` left the search heading about 2900px down the document, outside the viewport, below the split. Scroll position stayed near the detail, so the traveller had to hunt for the new surface.

Baseline JSON: `docs/evidence/trip-workspace-cross-device-interaction-1/audit-baseline.json`
Captured `2026-09-30T10:25:17.699Z` at git `cb47156a13f2981b12e553d014ec00ccd71b2227`. `TripWorkspace.tsx` was not in that dirty list. The harness and the layout helper were untracked. The rendered workspace was still the baseline component.

## 3. Repair

One arrangement, shared by every domain:

- Below 1024px the workspace stays one column. Opening a domain hides the overview and keeps the existing return bar.
- From 1024px, overview and the active domain sit side by side. Detail, existing items and explicit search are the right column.
- Search widens that column. 1024–1279 uses a 0.34 / 0.66 split. From 1280px search uses 0.40 / 0.60. Neither split is `grid-cols-2`.
- Flight and mobility fields use `auto-fit` with a 16rem minimum, so a narrow column stacks instead of squeezing two fields.
- A mouse click does not move focus into the search field. Keyboard activation focuses the first field.
- Escape closes the domain and restores the invoking control. Reveal scrolling uses `behavior: 'instant'` so the global smooth-scroll rule cannot leave the correction half-finished.
- Opening a gap still does not mount or run search. Search stays behind the explicit control.
- R1: the reveal target is the domain eyebrow plus the heading. The scroll offset is the measured bottom of the sticky header and, when it touches that header, the compact return bar, plus 8px of clearance. It is not a fixed 72px or 96px guess. A second measurement runs after the first scroll, because the return bar can pin only once the page moves.

## 4. After measurements

After JSON: `docs/evidence/trip-workspace-cross-device-interaction-1/audit-after.json`
R1 product SHA `3264a2ef18f81c84c5d059eabc178e2b2358f263`, captured `2026-09-30T11:42:49.862Z`. Dirty set was empty at capture. Chromium via Playwright. Synthetic guest trip. Provider routes intercepted with an unavailable payload. No live provider call.

The earlier after file on `2fc4d8a7` is replaced by this pass. Baseline evidence stays historical.

`Jetzt wichtig` → `Flug suchen`. On 360 and 390 the sticky return ends at y=134. The domain line `Flüge` starts at y=142 and the heading `Verbindungen für diese Reise` at y=162, both in view, with the first field below the heading.

| Viewport | Baseline heading top / in view / below split | R1 heading top / eyebrow top / identity below chrome / in column / below split |
| --- | --- | --- |
| 360×800 | 954 / no / yes | 162 / 142 / yes / yes / no |
| 390×844 | 954 / no / yes | 162 / 142 / yes / yes / no |
| 768×1024 | 862 / yes / yes | 862 / 842 / yes / yes / no |
| 1024×768 | 2974 / no / yes | 101 / 81 / yes / yes / no |
| 1280×800 | 2902 / no / yes | 101 / 81 / yes / yes / no |
| 1440×900 | 2902 / no / yes | 754 / 734 / yes / yes / no |
| 1920×1080 | 2902 / no / yes | 754 / 734 / yes / yes / no |

No measured step had horizontal overflow.

Accommodation, activities and mobility keep a visible domain or work heading below the measured chrome. Item-detail headings intersect on every required viewport. Keyboard search focuses an input. Escape closes the domain and returns focus to the invoking control. Mouse search leaves focus on `body`.

At 1440×900 and 1920×1080 the detail title stays in view together with the search heading. At 1024×768 and 1280×800 the search heading sits just under the site header because the column is taller than the screen. The surface remains the right column. On 360 and 390 the sticky return and the search identity share the viewport. The in-card detail title does not, because the existing flight list sits between that title and the search heading.

## 5. Gates run here

| Check | Result |
| --- | --- |
| focused detail / workspace / interaction tests | 68/68 pass |
| `npm test` | 4064/4064 pass |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 145 existing warnings |
| `npm run build` | pass |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:operating-mode` | pass |

CI, Auth configuration and Vercel Preview are not claimed from this local run. They belong to the pushed head.

## 6. Boundaries

No provider activation, no search-contract change, no booking or route truth change, no Supabase/Auth/RLS/schema change, no payment, no #626, no dependency or lockfile change, no homepage or Admin redesign, no token rebrand. Guest and account both render `TripWorkspace` with the same search slots. The browser pass is the guest route. No signed-in account session was opened.

`components/trips/MietwagenBereich.tsx` still uses viewport `sm:grid-cols-2`. It is outside this slice's allowlist. A narrow rental form can still squeeze. That is a follow-up only if the Technical Lead opens one.

## 7. Stop

Cursor does not mark Ready, does not merge, and does not start a follow-up slice.
Independent main-chat Technical Lead review is code, visual and interaction, on the exact pushed head.
