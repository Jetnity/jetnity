# Homepage confirmed route entry 1 — evidence notes

Date: 2026-09-22  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)

## What these images are

Two sets exist:

1. Earlier Chromium DevTools-emulated viewports against local `http://localhost:3000` (`homepage_*.webp`, `planen_*.webp`). Those showed initial/pending/error states only. Local `/api/search/places` returned `[]`, so live chip-add was not available there.
2. Hydrated controller evidence from `scripts/homepage-route-entry-1-hydrated.mjs`. Actual `StartzielForm` and `TripPlanner` were bundled; Next router/link and server actions were stubbed; `/api/search/places` was synthetic. These are **not** physical-device acceptance and **not** authenticated Production/Preview E2E.

| File | Observation |
| --- | --- |
| `r1_replace_keeps_pending_cusco.png` | Paris confirmed; pending Cusco kept after replace click; pending alert visible |
| `r1_remove_last_chip_keeps_pending.png` | Last chip removed; Cusco remains in the input |
| `r1_replace_target_and_delete_keeps_draft.png` | Replace-target switch / delete-while-replacing keeps the draft |
| `r2_swap_pending_cusco_becomes_primary.png` | After Nach-oben: primary input Cusco, extra Paris |
| `successful_chips_paris_rom_paris.png` | Ordered duplicate chips before handoff |
| `successful_duplicate_ordered_create.png` | Planner create with Paris/Rom/Paris + Zürich + dates |
| `keyboard_reorder_390.png` | Keyboard reorder at 390 |
| `layout_768_selected_chips.png` | 768 selected chips |
| `layout_1024_selected_chips.png` | 1024 selected chips |
| `layout_1440_selected_chips.png` | 1440 selected chips |
| `reflow_390_200pct.png` | 390 with `zoom: 2` |
| `hydrated-report.json` | 6 PASS machine report |

Harness screenshots do not load the Next font pipeline. Use them for controller state, not brand-font QA.

## Tests

`scripts/homepage-route-entry-1-verify.mjs`: 146 node:test pass / 0 fail, then hydrated 6 PASS on the working tree used for these captures.
