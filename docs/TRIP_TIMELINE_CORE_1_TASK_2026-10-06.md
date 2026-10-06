# Trip Timeline Core 1 — chronological operating day plan — Task

Date: 6 October 2026
Issue: #884
Repository: Jetnity/jetnity
Baseline: `main@fc2734ca60ae3c578fbcd414055fe983773d74d2`
Branch: `feat/trip-timeline-core-1`
Execution lane: Codex Desktop
Parallel-safe with #885/#886/#887 when this ownership boundary is respected.

## Objective

Turn the existing selected-day list in `TripWorkspacePlan` into Jetnity's first real operating timeline.

The immediate product defect is visible today: points can render in graph/list order such as 04:30 → 08:30 → 06:30 → 20:00. The day view must instead present known local times chronologically while preserving the canonical Trip graph unchanged.

This is the first implementation slice of the user-approved intelligent Reiseplan program. It establishes a stable presentation contract for later Timeline Intelligence and Connected Day Experience.

## Product doctrine

The Reiseplan is a central orientation surface of the Travel Operating System:
Planen → Entscheiden → Reisebereit sein → unterwegs orientiert bleiben.

This slice must make the day easier to understand without inventing travel truth.

## Binding reads

Before editing, re-read:
- live `origin/main`;
- operating mode;
- #751;
- #884 / Draft PR for this slice;
- Product Differentiation Doctrine;
- `components/trips/TripWorkspacePlan.tsx`;
- `lib/trips/timeline.ts`;
- `lib/trips/trip-plan-premium-experience-4.ts`;
- existing timeline/premium tests and relevant UI audit scripts;
- current `TripItem` contract in `types/trips.ts`.

Live evidence wins.

## Chronological truth contract

Create one pure presentation-order contract. Prefer a dedicated helper module rather than mutating the Trip graph.

1. `TripItem.startsAt` is a local wall-clock value documented as `HH:MM`; do not infer timezone or UTC.
2. Only canonical valid `HH:MM` values participate in chronological order.
3. Timed points render ascending by local clock.
4. Equal-time points are deterministic: existing `position` first, then stable `id` tie-break.
5. Points with no usable time render after all timed points in an explicit **flexible / without time** section.
6. Flexible points use existing `position`, then `id`; do not invent a clock.
7. A malformed legacy clock fails closed into the flexible/unknown-time group; it must not be normalized or presented as a valid time.
8. Never mutate or persist a reordered `tag.items` array.
9. Never change `position`, `dayId`, `stageId` or any stored item field merely for presentation.
10. Unplanned `ohneTag` items remain in their existing separate section.

## Day-part presentation

For timed items expose a deterministic visual grouping:
- **Morgen**: 00:00–11:59
- **Mittag**: 12:00–13:59
- **Nachmittag**: 14:00–17:59
- **Abend**: 18:00–23:59

Render only non-empty groups. These labels are presentation, not persisted truth.

The flexible block comes after all timed groups and must clearly communicate that its items have no fixed usable time.

## UI requirements

Upgrade the selected-day area into a calm, professional vertical timeline while preserving the existing day/stage navigation.

Required:
- chronologically ordered time points;
- clear time → type → title hierarchy;
- visible timeline rail/markers;
- subtle non-empty day-part headers;
- explicit flexible/no-time section;
- existing `Punkt hinzufügen` form intact;
- existing open/detail and delete actions intact;
- selected item state intact;
- price/booked/commercial semantics unchanged;
- no huge blank spacing proportional to hours;
- no claim such as “2h free”, “conflict”, “next”, “transfer missing”, “closed”, “weather” or “buffer” in this slice;
- smartphone first, but tablet/desktop equally professional;
- no horizontal page overflow at 360/390/768/1440 widths;
- keyboard/focus behavior must not regress.

Keep existing audit anchors unless a compatible replacement is proven:
`aria-label="Tagesplan"`, `data-tagesplan-modul="ein"`, day navigator markers.

Add narrow stable markers for the new timeline contract as useful, e.g. daypart/flexible groups, without encoding styling as truth.

## Required cases

Prove at least:
- 04:30, 08:30, 06:30, 20:00 renders 04:30, 06:30, 08:30, 20:00;
- arbitrary input array order produces same presentation order;
- equal times respect position then ID;
- null times come after all timed items;
- malformed legacy time is not treated as valid;
- all four day-parts map to the exact boundaries above;
- only non-empty daypart headers render;
- flexible section renders once and only when needed;
- no mutation of source day/items;
- deep links/open/delete still address original item IDs;
- no-time-only day remains useful;
- empty day remains useful;
- long titles/notes and 200% text do not create page overflow;
- Guest and Account with the same graph derive the same order.

## Allowed files

TASK is immutable:
- `docs/TRIP_TIMELINE_CORE_1_TASK_2026-10-06.md`

May create:
- `lib/trips/trip-timeline-core-1.ts`
- `lib/trips/trip-timeline-core-1.test.ts`
- `scripts/trip-timeline-core-1-audit.mjs`
- `docs/TRIP_TIMELINE_CORE_1_REPORT_2026-10-06.md`
- `docs/TRIP_TIMELINE_CORE_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_TIMELINE_CORE_1_SELF_REVIEW_2026-10-06.md`
- optional audit evidence under `docs/evidence/trip-timeline-core-1/**`

May modify only as needed:
- `components/trips/TripWorkspacePlan.tsx`
- `lib/trips/timeline.ts`
- `lib/trips/timeline.test.ts`
- `lib/trips/trip-plan-premium-experience-4.test.ts`

Do not edit other product/runtime files without STOP + TL approval.

## Non-scope

No conflict detection.
No free-time calculation.
No transfer-duration calculation.
No automatic buffer policy.
No “Als Nächstes” based on current time.
No drag/drop.
No map.
No weather.
No opening hours.
No cost aggregation.
No Change Impact.
No provider/API activation.
No DB/Supabase/schema migration.
No Official Truth/F8.
No global continuity edit.
No follow-up implementation.

## Checks

Run:
- new pure ordering tests;
- existing timeline + premium plan tests;
- relevant Trip Workspace focused tests;
- browser/render audit at 360, 390, 768 and 1440 if locally feasible;
- 200% text/responsive check where practical;
- typecheck, lint, Production build;
- relevant hygiene/mode checks;
- `git diff --check`.

Do not claim physical-device or authenticated E2E if not actually run.

## Delivery

Re-read remote main before STOP.
Commit + push authorized branch.
Report exact head, merge-base/ahead/behind, changed files, immutable TASK blob, exact tests/viewports, P0–P3 and Codex session/model evidence.

Classification:
- `TRIP_TIMELINE_CORE_1_READY`
or
- `TRIP_TIMELINE_CORE_1_NOT_READY`

Stay Draft. Do not Ready. Do not merge. Do not start Timeline Intelligence implementation.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
