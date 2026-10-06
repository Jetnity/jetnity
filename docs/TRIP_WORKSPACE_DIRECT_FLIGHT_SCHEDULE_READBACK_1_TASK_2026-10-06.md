# Trip Workspace direct-flight schedule readback 1 — Task

Date: 6 October 2026
Issue: #874
Repository: Jetnity/jetnity
Baseline: `main@b16a250b95715418c125a92a2d407ba2ec3f89fa`
Branch: `fix/trip-workspace-direct-flight-schedule-readback-1`
Execution lane: Codex Desktop
Parallel-safe with #873/#875/#876 when this allowlist is respected.

## Objective

Close #871 F-03: a saved direct-flight itinerary keeps exact local departure/arrival dates and clocks, but the read-only `FlugRoute` presentation hides them because segment timing is currently rendered only inside non-direct connection details.

## Required behavior

- For a direct route with exactly one stored segment, show the exact stored local schedule in the normal read view.
- Reuse existing route facts and existing local date/time values only.
- Never infer UTC instants, duration, timezone conversion, or missing clocks.
- Preserve Date-Line truth: an arrival local date may be earlier than departure local date and must be displayed exactly as stored.
- If only one side/date/clock is known, display only what existing `segmentZeit` truthfully derives; do not fabricate.
- Existing multi-segment details behavior remains unchanged.
- No new expand/collapse requirement for direct flights; keep the UX compact, readable and mobile-safe.
- Route identity/coverage logic is outside this slice.

## Allowed files

TASK is immutable:
- `docs/TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_1_TASK_2026-10-06.md`

Modify:
- `components/trips/FlugRoute.tsx`

Create:
- `lib/trips/flug-route-readback.test.ts`
- `docs/TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_1_SELF_REVIEW_2026-10-06.md`

No existing shared test file may be edited; this preserves parallel safety.

## Required tests

Prove at least:
- normal direct flight exact local date+time readback;
- Date-Line earlier local arrival date shown exactly;
- missing optional clocks remain unknown/not invented;
- multi-segment rendering unchanged and still shows segment details;
- route with no segment facts does not invent a schedule;
- no duplicate schedule text.

Use static/render tests and, if practical, a narrow browser/render check.

## Non-scope

No editor behavior. No validation. No coverage association. No persistence/schema/DB/Supabase. No provider. No Official Truth/F8. No global continuity. No follow-up.

## Delivery

Run focused new test + relevant route/manual-flight tests, `git diff --check`, typecheck/lint if proportionate.
Commit + push. Report exact head, merge-base/ahead/behind, files, TASK blob, checks, Codex session/model evidence.

Classification:
- `TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_READY`
or
- `TRIP_WORKSPACE_DIRECT_FLIGHT_SCHEDULE_READBACK_NOT_READY`

Stay Draft. Do not Ready. Do not merge.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
