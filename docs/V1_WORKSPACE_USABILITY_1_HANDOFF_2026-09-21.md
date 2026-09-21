# V1 Workspace Usability 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead (code + actual before/after visual/interaction review of the **new** head).

## What to open

1. Draft PR #516 / issue #513  
2. Binding task `docs/V1_WORKSPACE_USABILITY_1_TASK_2026-09-21.md`  
3. TL CHANGES REQUIRED on `4b5f34f9` (VUX-R1 / VUX-R2)  
4. STATUS / SELF_REVIEW with this prefix  
5. Before/after screens: `docs/evidence/v1-workspace-usability-1/`  
6. VUX-R2 interaction: `docs/evidence/v1-workspace-usability-1/vux-r2-interaction.json`  
7. R2 screens: `screens/r2_complex-r2-scrolled-search_390x844.png`, `screens/r2_complex-r2-rapid-close_390x844.png`

Do not reopen closed audit #506. Old-head gates on `4b5f34f9` do not approve a changed head.

## Look-first for this review fix

| Question | Evidence |
| --- | --- |
| Impossible days no longer roll forward | `lib/trips/datum-anzeige.test.ts` (`2026-02-29` / `2026-02-30` / `2026-04-31` → null; `2024-02-29` kept) |
| Manual scroll + parent update + explicit search | `vux-r2-interaction.json`: open 433 → manual 1038 → update 1038 → search 1038 |
| Rapid close before deferred work | `screens/r2_complex-r2-rapid-close_390x844.png` + overview heading wait |
| First-open hierarchy still accepted | existing `after_complex-overview_390x844.png` / `after_complex-flights-from-top_390x844.png` (not recaptured) |

## What changed in this review fix

- **VUX-R1:** calendar round-trip in `tagLesen` used only by `etappenZeitraumAnzeigen`. Existing `datumKurz` / `zeitraumKurz` unchanged.
- **VUX-R2:** open-transition-only scroll; stable ref; cancel rAF/timeout on close/unmount/effect teardown. Overflow-anchor + first-open snap kept.

## Live-main drift

Assigned baseline `19a91a25`. Re-read `origin/main` = `66af1539` (#517). Not rebased.

## Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.**  
No Ready, merge or follow-up by Cursor.
