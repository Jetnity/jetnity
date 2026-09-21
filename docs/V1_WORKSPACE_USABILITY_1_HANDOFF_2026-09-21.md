# V1 Workspace Usability 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead (code + actual before/after visual/interaction review).

## What to open

1. Draft PR #516 / issue #513  
2. Binding task `docs/V1_WORKSPACE_USABILITY_1_TASK_2026-09-21.md`  
3. STATUS / SELF_REVIEW with this prefix  
4. Before/after screens + metadata: `docs/evidence/v1-workspace-usability-1/`  
5. VUX-4 before reproduction: `docs/evidence/v1-workspace-usability-1/vux4-before-reproduction.json`  
6. VUX-4 after instrumentation: `docs/evidence/v1-workspace-usability-1/vux4-after-reproduction.json`  
7. After screens + bounds: `docs/evidence/v1-workspace-usability-1/audit-after.json`

Do not reopen closed audit #506. Its FINAL **5269760171** and post-merge **5764730610** remain the disposition source.

## Look-first screens

| Question | Before | After |
| --- | --- | --- |
| Phone first viewport, long title | `screens/before_complex-overview_390x844.png` | `screens/after_complex-overview_390x844.png` |
| Phone first viewport, short title | `screens/before_short-overview_390x844.png` | `screens/after_short-overview_390x844.png` |
| 1024 landscape header | `screens/before_complex-overview_1024x768.png` | `screens/after_complex-overview_1024x768.png` |
| Wide desktop still useful | `screens/before_complex-overview_1440x900.png` | `screens/after_complex-overview_1440x900.png` |
| Stage dates | `screens/before_complex-day_390x844.png` | `screens/after_complex-day_390x844.png` |
| Gap open from coverage control | `screens/before_complex-flights-from-top_390x844.png` | `screens/after_complex-flights-from-top_390x844.png` |

Every PNG has a sibling `.meta.json` with SHA, timestamp, viewport, browser, route, state and `synthetic-guest + intercepted-unavailable`.

## What changed

- **VUX-1:** compact guest banner, header spacing and secondary discard; 1024 no longer uses the `lg` two-column 5xl title. 1440/1920 keep the rich two-column header. Full title remains visible. Guest browser-only + account-transfer copy remains. Discard stays confirm + 44px.
- **VUX-2:** `etappenZeitraumAnzeigen` in `lib/trips/datum-anzeige.ts`; Plan stage line no longer joins raw ISO. Stored dates unchanged.
- **VUX-4:** reproduced leftover `scrollY` + CSS scroll-anchoring after compact overview hide. Open transition now disables overflow-anchor on the workspace main and snaps the non-sticky detail surface into view. Sticky back + domain heading measured in view. Search still explicit (`Flug suchen`).

## Live-main drift

Assigned baseline `19a91a25`. Observed later main `d3d42047` (#512 continuity). This writer did not rebase or merge main.

## Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.**  
No Ready, merge or follow-up by Cursor.
