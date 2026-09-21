# V1 Visual UX & Device Audit 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead (visual/product). Optional later challenge: existing **Jetnity Product & UX Explorer** (do not create or wake a bot).

## What to open

1. Draft PR #506  
2. `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_REPORT_2026-09-21.md`  
3. `docs/evidence/v1-visual-ux-device-audit-1/screens/`  
4. `docs/evidence/v1-visual-ux-device-audit-1/manifest.json`

Product SHA for every screen: **`9f386d10816d7adcdaf2fcd6d3732e64f952fb50`**. Local URL was `http://localhost:3000`, not a moving Preview alias.

## Look-first screens (pairs)

| Question | Phone | Desktop |
| --- | --- | --- |
| Homepage first glance | `home_initial_390.png` / `home_initial_360.png` | `home_initial_1440.png` |
| Menu | `home_menu-open-from-top_390.png` | n/a (`md` bar) |
| Planen | `planen_initial_390.png` + `planen_validation_390.png` | `planen_initial_1440.png` |
| Guest empty / with draft | `reisen_empty-guest_390.png` / `reisen_simple-guest_390.png` | `reisen_empty-guest_1440.png` |
| Workspace first viewport | `workspace_complex-overview_390.png` | `workspace_complex-overview_1440.png` |
| Coverage gap | `workspace_complex-flights-from-top_390.png` | `workspace_complex-flights_1440.png` |
| Tagesplan dates | `workspace_complex-day_390.png` | `workspace_complex-day_1440.png` |
| Landscape tablet hero | — | `home_initial_1024.png` |
| Tablet workspace | `workspace_complex-overview_768.png` | — |

## Findings to decide

VUX-1 P1 phone first viewport · VUX-2 P1 ISO dates · VUX-3 P1 “bestimmbar” copy · VUX-4 P2 gap-open scroll · VUX-5 P2 essentials repetition · VUX-6 P2 360 hero · VUX-7 P2 planen idea-first · VUX-8 P3 1024 mock card.

Proposed later scopes A/B/C are in the report. This writer implements none.

## Do not

- Treat login as an Account/Admin visual pass  
- Treat viewport Chrome as iPhone/Safari  
- Redesign the hero under issue #110  
- Close TW-8/TW-9 from this evidence  
- Recapture against newer main without saying the SHA changed (live main moved via merged #494 docs/harness only)  
- Ready or merge from Cursor  

## Exact next actor

Technical Lead independent visual review → PASS / CHANGES (docs) / repair-task authoring. Cursor stops.
