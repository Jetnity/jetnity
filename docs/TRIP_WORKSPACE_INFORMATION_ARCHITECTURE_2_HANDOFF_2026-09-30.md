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
- Merge-base with `origin/main` at the runtime commit: `91ab08bb9163444fcbce4a5303c1522c5ad5498c`, 0 behind, 2 ahead. The evidence commit is 3 ahead. The remote-observation note is one docs commit after that.
- Evidence commit `cb666be2a01bca394624e0e98c11af0045ddb434` sits on the runtime head. The note after it does not change workspace components. Re-fetch the branch tip before review. CI and Preview must match that tip. Any new head invalidates the previous gates.
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

Docs and evidence, in `cb666be2`. The following note only updates the report, this handoff and `docs/ACTIVE_WORK_STATUS.md`:

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

## Remote observation

Read after `cb666be2a01bca394624e0e98c11af0045ddb434` was pushed. This is not a Technical-Lead PASS. A later head needs its own read.

- GitHub Actions `36726836194`: Auth-Konfiguration gegen config.toml pass; Typecheck, Lint & Build pass in 3m2s.
- Vercel commit status success, “Deployment has completed”. Inspector: https://vercel.com/jetnity-e1b93c82/jetnity-app/RKPbLLotFWDmpHD8MrLTQcnWYjr8
- Preview deployment `6761504763` success: https://jetnity-h65f07jtd-jetnity-e1b93c82.vercel.app
- This browser session did not open that Preview.

## Not done by Cursor

Ready, merge, provider contact, Production, a signed-in account pass, a physical device, and any follow-up slice.

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + IA + VISUAL + INTERACTION REVIEW.**
