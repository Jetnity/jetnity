# Trip Timeline Core 1 — handoff

Issue #884 / Draft PR #888 / `feat/trip-timeline-core-1`.
Classification: **TRIP_TIMELINE_CORE_1_READY** for independent review only.

## Review anchors

- Binding TASK blob remains `2f7dcd635d3e78bc85c4c62be9dae4ff4b0c1567`.
- Latest fetched main and merge-base: `fc2734ca60ae3c578fbcd414055fe983773d74d2`.
- Final exact head/ahead/behind are in the delivery receipt. Re-read remote references before accepting; do not treat this snapshot as permanent live truth.
- `TRIP_TIMELINE_CORE_1_REPORT_2026-10-06.md` describes implementation, tests and explicit gaps.
- `docs/evidence/trip-timeline-core-1/audit.json` binds actual audited source bytes by SHA-256. Its `headAtRun` is the pre-commit task seed, not an implementation SHA.

## Contract consumed by later slices

`timelineAbleiten(reise, ohneTag, aktiverTag).tagesplan` is an array of nonempty `TagesTimelineGruppe` objects with `id`, `titel` and `punkte`. Each point contains the original `punkt: TripItem` reference and validated `zeit: string | null`. The canonical `gewaehlterTag` and `gewaehlterTag.items` are unchanged.

`lokalePlanzeit` accepts only exact local `HH:MM`. No UTC/zone inference. `tagesTimelineAbleiten` sorts valid local times, then position and ID; flexible entries follow all timed entries. Daypart boundaries are 12:00/14:00/18:00. Group labels are presentation only, not stored truth. Malformed legacy time remains in the source and is rendered as flexible, never normalized.

Day/stage selection, URL handling, detail selection, prices and booking facts keep their existing owners. Actions always pass original IDs. Unplanned points stay separate. No provider/DB/Auth/API/schema changes, new costs or dependencies.

## Reproduction

1. `npm ci`
2. `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/*test.ts`
3. `npm run typecheck && npm run lint && npm run build`
4. `JETNITY_UI_AUDIT=1 npm start -- --hostname 127.0.0.1 --port 3488`
5. `AUDIT_BASE=http://127.0.0.1:3488 node --import tsx scripts/trip-timeline-core-1-audit.mjs`

The audit uses installed Chrome by default; `AUDIT_CHROME` can provide an executable path. It writes only approved evidence and temporary callback-harness files, then cleans the temporary harness. No authenticated E2E or physical-device claim. Four existing full-suite PostgreSQL tests need the Linux PostgreSQL 16 binary path; failure is reproduced on unchanged main. The old premium browser script's line-563 order assertion contradicts this TASK; all its other checks pass, and the new audit proves the replacement chronology.

## Review boundaries

No conflicts, free-time estimates, transfer durations, buffers, next-up, map, weather, opening hours, costs, Change Impact or drag/drop. #889/#890 must reconcile their future contracts against the merged implementation. #891 paths remain untouched. No follow-up is authorized here.

Session `01a1124b-f76e-7103-9688-40167b5529b2`; `gpt-6-astra` / `xhigh` from local session metadata.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft; do not mark Ready or merge.
