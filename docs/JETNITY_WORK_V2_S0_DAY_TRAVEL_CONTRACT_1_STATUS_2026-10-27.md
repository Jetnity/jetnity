# V2-S0 Travel Days and Transfers Contract 1 — STATUS

Date 27 October 2026. Draft [#1051](https://github.com/Jetnity/jetnity/pull/1051). Tracking [#1047](https://github.com/Jetnity/jetnity/issues/1047).

**Status: design-only. Stopped for independent Technical Lead R2.** This memo does not fulfill the user requirement. The product still has no post-create assignment of existing day ids and no stored Hinreise / Rückreise / transfer-day labels. **ACCOUNT BLOCKED** remains. No day-role field, no RPC, no SQL, no runtime change. Not Ready. Not merged. No follow-up slice started.

R1 on `daebe8ed097cb378343bd589799f7af06d3bb011` (review `5671375305`) required one factual correction. The decision no longer treats R109’s already-14-day example as a 7-day create. Create-time 3 then 4 on 7 days stays 7. The direct editor on 7 unassigned days grows to 14. This correction does not sync `main`.

## Writer

Jetnity V2 Travel Days and Transfers Contract 1 — Cursor Generation 1.  
Session `bc-9c414c5c-d492-49fc-b379-03654cc13242`.  
`run-info.originalModelName` `grok-4.7-high-fast`.

## Baseline

Live `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`, tree `df19ecca084c0ee9d4fc0b22314f2254f86e743a`, mode `NORMAL`. Seed `e6ddb58e5e90615ed7e408f739c107df688d3e1a` was 1 ahead and 0 behind before this delivery. [#751](https://github.com/Jetnity/jetnity/issues/751) matched that main at `2026-10-27T15:37:53Z`. No drift stop.

## Findings in force

- F01: unassigned 7 days and stage lengths 3+4 become 14 days via `etappe_dauer` +3 and +4. Original ids remain. Stage dates are rewritten onto the new rows.
- Create-time 3+4 on 7 days stays 7. That path is `createDayPositions` plus `reise_anlegen`, not the editor.
- Post-create allocation of existing day ids has no Guest operation and no Account mode update. **ACCOUNT BLOCKED.** Owner-gated RPC only. No SQL in this PR.
- N12 chronology is `dayIndex` plus additive items. Nights are N−1 when bounds are known. Travel does not cover a hotel night. The lodging reader change belongs to #1048.

## Evidence

Synthetic script, not committed: `/opt/cursor/artifacts/s0-synthetic-proof.log` on the writer machine. Focused tests: 44 pass, 0 fail (`day-stage-truth-contract`, `multi-stop-create-day-allocation-1/pfad`, `anwenden`). No mounted browser. No hosted database. Full `npm test`, typecheck, lint, and production build were not run; this commit is documentation.

## Shared files left untouched

`docs/ACTIVE_WORK_STATUS.md` stays as on the seed. Four lanes would collide there, and the immutable task allowlist does not include it. Continuity for this lane is this status file plus the handoff.

## Next actor

Independent Technical Lead, exact head of this draft. Cursor does not Ready and does not merge.
