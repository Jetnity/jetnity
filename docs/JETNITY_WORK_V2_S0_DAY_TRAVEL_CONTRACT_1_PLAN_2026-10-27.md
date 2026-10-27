# V2-S0 Travel Days and Transfers Contract 1 — PLAN

Date 27 October 2026. Tracking [#1047](https://github.com/Jetnity/jetnity/issues/1047). Parent [#1046](https://github.com/Jetnity/jetnity/issues/1046). Draft PR [#1051](https://github.com/Jetnity/jetnity/pull/1051).

Immutable task: `docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_TASK_V1_2026-10-27.md`. This file does not amend that task.

## Writer

Logical name and Cursor display name: **Jetnity V2 Travel Days and Transfers Contract 1 — Cursor Generation 1**. Renamed with Cursor Cloud `rename-chat`.

Session: `bc-9c414c5c-d492-49fc-b379-03654cc13242`  
https://cursor.com/agents/bc-9c414c5c-d492-49fc-b379-03654cc13242

Model metadata source: Cursor Cloud `run-info.originalModelName` = `grok-4.7-high-fast`. No Auto and no substitute. This is not the Activities writer on #1043.

The same identity was posted on the draft PR before the source trace: comment `6447196669`.

## Baseline checked before the trace

Fetched `origin/main` on 27 October 2026. It is `d31a16afdac5e97d4b02f4cb5824f5adc290577c`. This branch was `e6ddb58e5e90615ed7e408f739c107df688d3e1a`, 1 ahead and 0 behind. `.jetnity/operating-mode.json` on that main is `NORMAL` (`updatedAt` 2026-09-21).

[#751](https://github.com/Jetnity/jetnity/issues/751) was read open, updated `2026-10-27T15:37:53Z`. It names the same main, tree `df19ecca084c0ee9d4fc0b22314f2254f86e743a`, and this lane as the first source and architecture decision for F01 and N12, with no schema change. No drift. The trace continued.

## Scope that was executed

Read-only trace of the current Guest and Account day, stage, item, night, and save paths. The only writes are the five task-owned documents for 27 October 2026.

Questions:

1. What does a direct stage-duration edit do to 7 existing days whose `stageId` is null when the user enters 3 and 4?
2. Can those existing day ids be allocated in place, with no insert, no delete, and no invented stage dates, through an accepted Guest writer and an accepted Account writer?
3. What chronology and night contract should later slices implement for the 22-day Hinreise / transfer / Rückreise case?

## Out of scope

Product TypeScript, schema, SQL, Auth, CI, indexing, S1 lodging files, S2 preparation files, S3 guest navigation, and #1043 Activities. No hosted Supabase read. No private browser. No provider call. No follow-up slice. Draft only.
