# Trip Workspace Information Architecture 2 — Handoff

Stand: 30 September 2026
For: ChatGPT / Technical Lead. An older head does not approve a later head.

## Open this

1. Draft PR #642 / issue #641
2. Task: `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_TASK_2026-09-30.md`
3. Report: `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_REPORT_2026-09-30.md`
4. Self-review: `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_SELF_REVIEW_2026-09-30.md`
5. Baseline: `docs/evidence/trip-workspace-information-architecture-2/audit-baseline.json`
6. After, bound to runtime `bc718c68ac498d8ba6ed9d6d83bfca0172aa715d`: `docs/evidence/trip-workspace-information-architecture-2/audit-after.json`
7. Screens: `docs/evidence/trip-workspace-information-architecture-2/screens/{baseline,after}/`

## Identity

- Agent: **Jetnity Trip Workspace information architecture 2**, Generation 1
- Session: https://cursor.com/agents/bc-d6c61c03-c9c0-45f4-8764-4fb9ff4b34bf
- `originalModelName`: `grok-4.7-high-fast`
- Baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`
- Task seed: `711ea1a0392d2a97f3d5ec00536abecb4cb32923`
- Audited runtime head: `bc718c68ac498d8ba6ed9d6d83bfca0172aa715d`
- Merge-base with `origin/main` at the runtime commit: `91ab08bb9163444fcbce4a5303c1522c5ad5498c`, 0 behind, 2 ahead
- This handoff lives in the docs/evidence commit whose parent is that runtime head. Re-fetch the branch tip before review. That tip does not change workspace components. CI and Preview must match the tip. Any new head invalidates the previous gates.
- `docs/ACTIVE_WORK_STATUS.md` on this branch names this writer while Draft #642 is open. The previous “no active product writer” sentence stays as the historical Preflight 3 persist.

## Changed files against main

Runtime and tests, all in `bc718c68`:

- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspaceModeNavigation.tsx`
- `components/trips/TripWorkspaceDomainNavigation.tsx`
- `lib/trips/workspace-mode.ts`
- `lib/trips/workspace-mode-2.test.ts`
- `scripts/trip-workspace-information-architecture-2-audit.mjs`

Docs seed, already in `711ea1a0`:

- `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_TASK_2026-09-30.md`

Docs and evidence, this commit only:

- `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_REPORT_2026-09-30.md`
- `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_SELF_REVIEW_2026-09-30.md`
- `docs/TRIP_WORKSPACE_INFORMATION_ARCHITECTURE_2_HANDOFF_2026-09-30.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/evidence/trip-workspace-information-architecture-2/`

## Look first

| Question | Where |
| --- | --- |
| Was the long page real? | Baseline overview at 1440: scroll 3197, plan and preparation inside the page |
| Was the dead column real? | Baseline flights at 1440: grid `555.672px 652.328px`, `toteFlaeche` true, plan still in the left column |
| Is Übersicht only the dashboard? | After overview: `planInUebersicht` false, `vorbereitungInUebersicht` false |
| Is the plan full width? | After plan: `planVolleBreite` true, `anordnung` `einspaltig` |
| Is Organisieren a rail plus one domain? | After flights from 1024 up: rail/domain grid, `toteFlaeche` false. Compact: one column, one sticky back |
| Did a mode change call a provider? | Every after `netz` list is empty, including `flug-suchen` |
| Does history restore? | `history-fluege`, `history-back-overview`, `history-forward-plan`, `reload-plan`, `deeplink-unterkunft`, `invalid-query` |
| Do #638 compact rules still hold? | 360 `flug-suchen`: return bottom 134, eyebrow 142, heading 162, `zurueckAnzahl` 1, `zurueckSticky` 1, `zurueckInDetail` 0 |

## Not done by Cursor

Ready, merge, provider contact, Production, a signed-in account pass, a physical device, and any follow-up slice.

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + IA + VISUAL + INTERACTION REVIEW.**
