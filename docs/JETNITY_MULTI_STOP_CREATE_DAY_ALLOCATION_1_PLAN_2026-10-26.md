# R109-T — Multi Stop Create Day Allocation 1 — PLAN

Date: 26 October 2026.

Writer: **Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-a0a82333-7855-4ba7-b641-39af97c78458  
Model: `grok-4.7-high-fast`. Not Auto.

Immutable TASK V1 blob `d52e6a8e15cd554e1410b88388491d6ffcab91f6`. Seed `09381574876196b4538272c28e05fceae63e87b2`. Baseline main `6ae344f4453b16514f9048083bb8b07396135fa2`. This PLAN records the source-confirmed shape. It does not edit the TASK.

## Goal

During create, Guest and Account can explicitly assign existing calendar days to confirmed destination occurrences. Without that choice, several destinations stay unassigned and one destination stays `single_destination`. The same pure mapping feeds the guest graph, the account day payload, and the frozen guest-to-account mapper.

## Source facts that fix the shape

- `createZieleGraph` previously left every multi-stop `dayStagePositions` entry null and every stage arrival/departure null. One destination still owns every day.
- `dayStageAssignmentModeAbleiten` already returns `explicit` when any valid positions exist and the stage count is greater than 1, `unassigned` when none exist, and `single_destination` when the count is 1. That file stays read-only.
- `reise_anlegen` already accepts `stage_position` and derives the mode. This lane does not add `dayAllocation` to `reiseNutzlastSchema` and does not change hosted SQL.
- `alsNutzlast` already copies `stageId` to `stage_position` when the mode allows it. `uebernahme.ts` stays read-only.
- Zod 3.25.76 validates array elements before `max` rejects the collection. `reiseAnlegen` and `gastreiseUebernehmen` therefore need a length preflight before `safeParse`. Package files stay with lane S.

## Allocation

`createDayPositions` builds one position or null per UTC calendar day from `reisetageBauen`. Claims are inclusive ranges bound to a 1-based occurrence index. Known positions must be nondecreasing once null days are ignored. Overlaps, foreign or decimal indexes, dates outside the interval, and more than 50 claims fail. Nothing is reordered or spread across the remaining days.

`tageszuordnungAngleichen` drops a claim when its occurrence key disappears or its dates leave the interval. It does not move those dates onto another key.

The planner stores claims by stable row key (`primary`, `handoff-N`, extra keys). Submit maps those keys to the current confirmed order. Opt-in off, or no claims, omits `dayAllocation`. One confirmed destination hides the control and clears claims.

`createZieleGraph` stamps arrival and departure only for a single destination. Multi-stop stage arrival and departure stay null. `dayStagePosition` on the graph is 1 only for a single destination, so a caller cannot paint one position onto every day, including gaps.

## Resource preflight

`rohEingabeBegrenzen` reads known collection lengths before item contents: stages 50, days 366, ungeplante and the day-item sum 1000 together, further destination ids 49, interests 12, allocation claims 50. The day loop stops at 366 containers because the day list is already capped; the item total stays 1000 so a valid day of 400 notes is not rejected. After the sum check, at most 1000 items are opened for `route_itinerary` (6 legs, 8 segments), including non-flight items. Missing keys are absent. Wrong types are malformed. The guard does not truncate, repair, or replace Zod.

`reiseAnlegen` and `gastreiseUebernehmen` call it before `safeParse`. `gastreiseAnlegen` calls it before storage checks. `reiseAusNutzlastAnlegen` calls the same function after `konto()` and before route mapping. That inner guard is defense. It is not the pre-parse claim, and `vorschlagUebernehmen` is outside that claim.

## UI and proof

`TripStageDayAllocation` shows remaining and unassigned counts, per-occurrence from/to dates, a live order alert, and reset that returns focus to the checkbox. Owner CSS keeps the block inside 320, 390, tablet, desktop, and 200% text. Mounted proof uses the real planner, synthetic places, project CSS, and blocked external origins. Account proof is the object passed to `reiseAnlegen`, not a hosted `reise_anlegen()` call.

## Out of scope

No `reise_aendern` assignment editing, no hosted migration, no package change, no global Zod claim, no guessed hotel nights or transfers, no new itinerary model.
