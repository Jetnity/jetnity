# V1 Manual Planner Text Reflow 1 — Status

Stand: 21. September 2026  
Status: **FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Generation 1 of **Jetnity V1 manual planner text reflow 1**. Reproduce the proven 390×844 / `html { font-size: 32px }` 13px overflow, then apply the smallest TripPlanner-local wrap so the manual form no longer causes that page scroll. `#524` pointer/create/validation behavior stays unchanged.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-manual-planner-text-reflow-1` |
| Issue | #527 |
| Draft PR | #528 |
| Assigned baseline main | `4278cd047b907b218fe64c122c4eed7dd61e0a7e` |
| Task seed | `84deca894270ef89fa5c61ba1ac7ea56175074a9` |
| Implementation SHA | `2a58559dfdd3586806629a4ac84fb752702f5aa6` |
| Agent | **Jetnity V1 manual planner text reflow 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-2d1117f4-c1b0-4307-852e-3609076509c2` |

Exact freeze SHA of this docs/evidence commit belongs in the PR comment.

Live main at freeze read: `origin/main` still `4278cd04`. Ahead/behind versus that main is recorded in the PR comment after push. No sibling merge/rebase.

## Reproduction (compiled CSS)

390×844, Chromium/140.0.7339.16, `html { font-size: 32px }`, synthetic guest, intercepted provider/model routes. `scrollX` was already 0 before and after an explicit reset.

| | Before (`2a58559d` source + pre-fix CSS) | After (`2a58559d` TripPlanner + compiled CSS) |
| --- | --- | --- |
| clientWidth | 390 | 390 |
| scrollWidth | 403 | 390 |
| pageOverflow | **13** | **0** |
| scrollX | 0 | 0 |
| `#feld-budget` left/right/width | 73 / 402.92 / 329.92 | 73 / 340.91 / 267.91 |
| budget label left/right/width | 73 / 402.92 / 329.92 | 73 / 340.91 / 267.91 |
| field grid width | 267.91 (children scrollWidth 330) | 267.91 (scrollWidth 268) |

Causal boxes after scrollX reset: label `Ungefähres Gesamtbudget` plus adjacent `(optional)` span formed one 329.92px sequence (`min-width: auto`, `overflow-wrap: normal`). Feld wrapper was already 267.91px. Date/number controls and short labels were already inside the track. Negative `sr-only` skip-link bounds were recorded and are **not** treated as a skip-link defect.

## Fix (TripPlanner only)

- `feldReflowClass`: `grid-cols-[minmax(0,1fr)]`, label `min-w-0 max-w-full break-words`, optional/pflicht span `inline-block`.
- Form/outer/field grid: `min-w-0` / `max-w-full`.
- No `feld.tsx` edit. Local `className` was sufficient.
- No page/body clipping, no smaller text, no hidden/truncated labels, no handler/state/create/gate/prefill change.

## 360 / 200% sibling residual (not this form)

At 360×800 / font-size 32px the **page** still reports 22px overflow. Budget/label/control rights stay at 340.91 (inside 360). The overflowing column is the `#524` pointer (`Schritt für Schritt planen`, `inline-flex`, right 379.86) plus the Reiseidee card (right 381.91). Allowed TripPlanner paths cannot shrink that sibling min-content. Concrete requested expansion if TL wants that page scroll closed: `components/trips/PlanenEinstiegNavigation.tsx` pointer wrap and/or `components/trips/Reiseidee.tsx` card `min-w-0`. **Not started.**

## Author gates (not TL PASS)

| Check | Result |
| --- | --- |
| Focused reflow / manual-entry / create-entry / mobile-a11y | 53 / 53 PASS |
| `npm test` | 3649 / 3649 PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | 0 errors / 138 pre-existing warnings |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | PASS |
| `npm run build` | PASS (local missing `.env` warning only) |

## Evidence

`docs/evidence/v1-manual-planner-text-reflow-1/`  
Browser: Chromium/140.0.7339.16. After capture `2026-09-21T19:59:45.914Z`. Simulation: synthetic guest + intercepted unavailable + `html { font-size: 32px }` where marked. First before budget/tab PNGs were taken before `scrollIntoView`; geometry in `audit-before.json` is the causal record. After budget PNGs are scrolled to `#feld-budget` with scrollX reset.

## Next step

**ChatGPT / Technical Lead** independent exact-head code and visual/interaction review. Cursor does not Ready, merge, or start a follow-up slice.
