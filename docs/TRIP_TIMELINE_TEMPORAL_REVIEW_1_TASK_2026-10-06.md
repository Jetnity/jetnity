# Trip Timeline temporal review 1 — binding task

Date: 6 October 2026
Issue: #895
Repository: Jetnity/jetnity
Baseline: `main@bbc48401176611af3e736a10f2973e92147aef29`
Branch: `feat/trip-timeline-temporal-review-1`
Logical writer: Trip Timeline temporal review 1 — Generation 1
Execution: Codex Desktop. Session/model are pending actual execution, never inferred.

## 1. Objective and authority

Implement one coherent first Timeline Intelligence runtime slice: temporal input projection, interval/partial-event handling, the four approved conflict outcomes, assessment coverage, and compact read-only feedback in the existing Reiseplan. This is not the complete Intelligence or Connected Day program.

User value: distinguish a supported schedule overlap from missing information without making a hotel stay block the whole day or inventing travel time. This implements the user-approved Planen → Entscheiden → Reisebereit sein direction; no claim of market uniqueness is made.

TL startup precheck: main above independently read; mode NORMAL; #751 has no active writer; open working PRs absent (historical drafts remain parked). Push CI `37524717115` SUCCESS; Production `dpl_C6N1H43ANSVLCxQUfeGNhZFEUCik` READY at exact main, jetnity.com, aliasError=null. #748 read after MATERIAL `5988971332`: only already-processed receipt `5989855107`, no newer MATERIAL returned. No hosted database inspection or change is part of this dispatch.

## 2. Technical-Lead Core/design reconciliation — completed before dispatch

Binding design: `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md`, blob `d1476919fa7563b80fed69cf4c27cadde6cd13ca`, accepted via merged #889. Its Handoff checklist is resolved for this bounded subset as follows. Unimplemented capabilities stay explicitly unsupported; this is not permission to guess them.

| Design requirement | Actual merged contract / bounded decision |
| --- | --- |
| Merged Core | #888 accepted head `b3b31b346cbedea41c02a162f628c0261c38fb06`, merge `46d780e1d4f8322effbf4137f84a0c2018eb05ae`, included in baseline. |
| Display groups/order | `lokalePlanzeit` and `tagesTimelineAbleiten` in `lib/trips/trip-timeline-core-1.ts`, blob `bbab86fb06074eda35a81b75b402621367879f31`. Exact HH:MM; minute/position/ID order; nonempty dayparts, flexible last. Reuse unchanged. This is display, not physical chronology. |
| Selected day vs full graph | `timelineAbleiten(...).tagesplan` is selected-day presentation; `gewaehlterTag` and original item references remain unchanged. `lib/trips/timeline.ts` blob `2399ff700fc68211f7a4a86826830066c4076f1d`. Evaluate the complete current Trip plus its canonical unplanned inventory, not the selected-day array alone. |
| Dates/identity | `types/trips.ts` blob `24fe7cf80087a6d87cfc465a76cff1c5470dad99`: explicit startsOn/startsAt/endsOn/endsAt, item/day/stage IDs and optional routeItinerary. No general timezone, offset, venue clock, attendance or per-item participant field. Extra caller properties cannot manufacture them. |
| Date assignment | dayId/dayDate are placement; Core does not prove an absent event date or physical location. Preserve explicit item/segment dates. Missing dates remain missing; a protected item/day mismatch is disclosed, not repaired. |
| Flight events | Use current canonical `routeFactsFuerPunkt` / route-itinerary readers, not title parsing or legacy summary when itinerary is available. Exact airport-local boundaries survive Date-Line reversal. Segment refs are itinerary-version/fingerprint plus canonical indices, not durable independent IDs. Do not double-count summary and segments. |
| Updates | Account `KontoArbeitsbereich` refreshes server props after writes (`router.refresh()`); Guest `GastArbeitsbereich` replaces Trip state with returned graph. New review derives from current props on each render; no independent persisted/async cache. Revision alone is not a sufficient invalidation key. |
| Navigation | Reuse Plan's existing `onPunktOeffnen(itemId)` and original IDs. Do not introduce query parameters, a timezone editor or auto-save. Missing/stale targets cannot remain actionable. |
| Attention/Readiness/Connected Day | Existing Attention/OfficialEvaluation/Readiness outputs are neither replaced nor treated as proof. This slice adds scoped temporal feedback only; booking/Preparation/map/cost integration remains with later #890-derived work. No duplicate global safety/ready score. |
| Unavailable positive facts | No live timezone/instant admission, external facts or numeric buffer policy is supplied. The pure evaluator can test explicitly qualified mathematical fixtures, but the live Trip adapter cannot synthesize those qualifiers. Reports must distinguish kernel capability from positive outcomes possible with today's Trip data. |

Re-read these sources, START_HERE, operating standard, current Handoff/ACTIVE_WORK_STATUS durable pointers, mode, #751, #895 and the current PR before editing. If a new live change invalidates this mapping, STOP with the exact mismatch; do not build competing semantics.

## 3. Runtime contract

- One pure, deterministic temporal projection over the current graph. Preserve source fields, identity, source class and missing reasons. Never mutate/reorder the graph.
- Validate civil dates as real Gregorian YYYY-MM-DD and local clocks via the Core's strict HH:MM semantics. No permissive Date rollover, added Z, guessed offset, default duration or midnight endpoint.
- Separate occupied intervals, start-only/end-only commitments, explicit milestones, availability spans, flexible/date-only/unplanned items. Hotel nights and rental possession are availability, not continuous personal occupancy; a free-text note is not automatically a commitment.
- Preserve explicit cross-midnight end dates. An earlier end clock without an end date cannot imply tomorrow. Cross-airport Date-Line reversal alone is neither an invalid flight nor an overlap proof.
- Qualified instant arithmetic and finite correlated ambiguity follow design §§4–5. Validate nonempty, internally consistent assignments before universal/existential checks. No filtering away invalid combinations to obtain a positive answer. Estimates never yield proven conflict or proven disjointness.
- Civil-only comparison requires an independently established shared clock context, such as matching canonical airport identity. Same display day, stage, country, label, graph order or timezone of the device is insufficient. Current missing context yields not_evaluable, not a fabricated positive result.
- Outcomes: `proven_conflict`, `possible_conflict`, `no_proven_conflict`, `not_evaluable`. Use the exact predicates in design §5. Half-open intervals [start,end); touching is not occupied overlap. Missing end alone does not imply possible conflict with every later point.
- Pair results concern saved plan overlap, not guaranteed real-world attendance or a specific traveller. A booked flag does not prove timing or external confirmation.
- Compare relevant full-graph events, including adjacent-day occupation where actually provable, not only adjacent DOM rows. Deduplicate logical identity. Conflicting duplicate IDs or incomplete inventory prevent complete assessment.
- Coverage is independent: not_run/complete/partial/unavailable/error with honest evaluated/unevaluable counts and reasons. Zero findings never means safe, conflict-free or a free day.
- Recompute from all relevant current values, including clock-only changes, itinerary, membership and deletions even when revision is unchanged. Use deterministic input identity if retained in result; never log, persist or send personal snapshot hashes.
- Bound work and output using existing graph limits and explicit partial/error behavior on overload. Never silently drop events/pairs and then claim complete. Do not invent external operational constants.

## 4. Narrow product integration

Add one calm temporal-review component to TripWorkspacePlan without changing the Core layout/chronology contract.

- A small selected-day summary plus expandable details, human German copy and original item navigation.
- A supported possible conflict must identify its concrete missing evidence. Incomplete data can have one grouped explanation; no alarm on every flexible item.
- `no_proven_conflict` stays scoped to checked events; no green whole-trip clearance.
- With today's incomplete dates/zones, explicitly explain which information prevents a reliable comparison. Do not make up a route/timezone merely to show a demo warning.
- Empty/no-fixed-event state must remain useful and quiet. Existing add/delete/open/back/selection, price, booked, flight coverage and Preparation behavior remain intact.
- No new write action, auto-reorder, provider fetch, auto-search or localStorage/cache for derived results.
- Smartphone-first, at least 360/390/768/1440 px, keyboard/focus and 200% text; preserve existing audit anchors. No horizontal page overflow or duplicated misleading schedule labels.

## 5. Required tests and evidence

At least: qualified overlapping/disjoint/touching intervals; equal starts and start-only anchors; missing end; valid midnight interval; missing end date; Date-Line flight without offsets; bounded ambiguity preserving correlations; estimate-only evidence; invalid calendar/clock; same airport vs same-name/different airport; no shared clock; hotel/rental availability; free-text notes; flexible/unplanned items; duplicate/conflicting IDs; nonadjacent overlapping events; full versus partial inventory; source graph immutability; stable results under input permutations; clock-only edit with unchanged revision; deleted/moved item; Guest/Account same graph parity; blocked extra caller qualifiers; zero network and derived writes.

Use synthetic data only. Positive pure-kernel fixtures are not real provider/traveller evidence. Test the real Trip adapter separately and show its honest unavailable states. Browser checks must exercise actual component navigation and newly rendered coverage, not only a disconnected mock view.

Run focused new tests, existing Core/timeline/premium/navigation tests, broader Trip/Route tests, typecheck, lint, production build, existing hygiene/mode checks and git diff --check. Keep assertions active; distinguish local environment failures from product failures and remote CI. Audit scripts may only receive narrow justified selector/contract adaptations, never removed checks or a green exit on failure.

## 6. Exact file ownership

Immutable TASK:
- `docs/TRIP_TIMELINE_TEMPORAL_REVIEW_1_TASK_2026-10-06.md`

May create:
- `lib/trips/trip-timeline-temporal-review-1.ts`
- `lib/trips/trip-timeline-temporal-review-1.test.ts`
- `components/trips/TripTimelineZeitpruefung.tsx`
- `scripts/trip-timeline-temporal-review-1-audit.mjs`
- `docs/TRIP_TIMELINE_TEMPORAL_REVIEW_1_REPORT_2026-10-06.md`
- `docs/TRIP_TIMELINE_TEMPORAL_REVIEW_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_TIMELINE_TEMPORAL_REVIEW_1_SELF_REVIEW_2026-10-06.md`
- synthetic sanitized evidence only under `docs/evidence/trip-timeline-temporal-review-1/**`

May modify:
- `components/trips/TripWorkspacePlan.tsx` (narrow review integration only)
- `lib/trips/trip-timeline-core-1.test.ts`
- `lib/trips/trip-plan-premium-experience-4.test.ts`
- `scripts/trip-timeline-core-1-audit.mjs`
- `scripts/trip-plan-premium-experience-4-audit.mjs`
- `scripts/trip-workspace-contextual-navigation-1-audit.mjs`

The existing tests/audits above may change only when the new visible review requires a targeted assertion/selector adaptation; report every such change. No new dependency. Any additional path requires STOP and TL scope approval.

## 7. Hard exclusions and parallel boundary

No schema/DB/Supabase, Auth/RLS, provider/API/model/network activation, timezone lookup or inferred offset, migration, global Attention/Readiness rewrite, Official Truth/F8, transfer/buffer/free-time/next-up logic, map/weather/hours/cost/Change Impact, graph mutations, global continuity edits or follow-up. #896 owns disjoint Official Truth server code; neither writer may edit the other's paths or use unpublished output.

## 8. Delivery

Commit and push this authorized branch; no routine PO approval needed. Re-read remote main before STOP; report exact remote head, merge-base/ahead/behind, changed paths, immutable TASK blob, actual tests/viewports/coverage gaps, P0–P3 and actual Codex session/model/effort. The final documents must match final verified results; no stale NOT_READY block left as current truth.

Classification: `TRIP_TIMELINE_TEMPORAL_REVIEW_1_READY` or `TRIP_TIMELINE_TEMPORAL_REVIEW_1_NOT_READY`.

PR remains Draft. No Ready, merge, agent dispatch or automatic follow-up. Any scope failure is CHANGES REQUIRED in the same logical session.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
