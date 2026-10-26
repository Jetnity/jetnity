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

## R1 addendum — 26 October 2026

Technical Lead CHANGES REQUIRED R1.1 on reviewed head `54a06423b80f7c33495f57efbcdda6f7ba31da18`. Immutable TASK V1 stays unchanged.

`reisetageBauen` still stops at 366 days. Create now refuses a longer interval before that cap is used. `zeitraumIstZuLang` uses the existing numeric boundary: a UTC day difference above `REISEDAUER_MAXIMUM` (365, the same value as `GRENZEN.reisedauerInTagen`). That is 366 inclusive calendar days allowed and 367 rejected. The creator sentence counts those included dates: `Eine Reise umfasst höchstens 366 Kalendertage, einschließlich Abreise und Rückreise.` The stored-reader sentence in `reiseSchema` stays `Eine Reise dauert höchstens 365 Tage`. No new duration number.

The check runs in `createDayPositions` before `reisetageBauen`, in `neueReiseSchema` on `endDate` before allocation parsing, in `createKontoTage`, and in `gastreiseAnlegen` after the resource preflight and before any storage call. `TripPlanner` shows that sentence on Rückreise (`#feld-ende` / field key `endDate`), moves focus there on submit, and returns before `gastreiseAnlegen` and `reiseAnlegen`. The allocation stand says the interval is longer than allowed and is neither shortened nor stored. It does not announce a truncated day count as the whole journey.

Valid 366-day trips stay complete, including no-opt-in unassigned days and a single destination. The same rejection applies to those shapes when the interval is 367 days. Leap cases stay on this predicate: 2024-01-01 through 2024-12-31 and 2024-02-29 through 2025-02-28 are accepted; 2024-01-01 through 2025-01-01 and 2023-03-01 through 2024-03-01 are rejected.

`lib/trips/aktionen.ts` was not edited for R1. Account rejection is the existing `neueReiseSchema` gate inside `reiseAnlegen`, before place confirmation and before `reiseAusNutzlastAnlegen`.

Historical control: Root authorized only the already-landed one-entry inventory update. The expected blob for the owned `lib/trips/aktionen.ts` may stay `e0c03d9ea5fc1200774727e4b790511684020c86` (previous `4833378894aeedb152e093912574a698a9701b33`). Every other pin, entry, and assertion stays. The audit script was not edited and was not weakened. This is not ownership of the historical-control file.

Integration: `origin/main` advanced through S to `68435f012f27f599a1092699f5635aa88312ea67`. S actual-main acceptance was still pending at this correction. This branch was not rebased or merged onto that main. Merge-base remains `6ae344f4453b16514f9048083bb8b07396135fa2`. Re-read on 26 October 2026 after the wording commit still shows that main and that merge-base.

## R1 supplementary disposition — `lib/trips/tage.ts`

`lib/trips/tage.ts` was outside the TASK's named ownership. The additive interval guard was edited in `c17257ad04ac8bb90e6136c7b3b3f7a50f7537f2` before it was proposed. Root has since authorized only that additive pure calendar-interval guard, the constants it needs, and the explanatory comment. `datumVerschieben`, `reisetageBauen`, `TAGE_MAXIMUM`, the stored-reader limit, and unrelated callers keep their behavior. This is not general ownership of calendar or duration editing. TASK V1 stays immutable.

The visible creator sentence was then aligned with the same number. A 366-day create is described as 366 days. A 367-day create says “höchstens 366 Kalendertage, einschließlich Abreise und Rückreise” and does not say “365 Tage”. Mounted evidence for that wording is `docs/evidence/multi-stop-create-day-allocation-1/mounted-6997f78f1475.json` on runtime `6997f78f1475169be07ff69a13c28ba917fdf1c6`, 10/10, hosted persistence not invoked.

## Integration onto accepted S main

Root accepted main `68435f012f27f599a1092699f5635aa88312ea67`, tree `9f05dce58c9ad800c324db014e98a8aeb5039481`. Re-read before the merge found that exact commit and no newer main. The integration is one `--no-ff` merge, `cdd2282ba5c82e492ce17cd0bc741d7fc4bfa58d`, parents `f30c838307fa86d1409a4954b443f1a48010b4ef` and the accepted main. R1, the creator sentence, and both narrow dispositions stay. `package.json` was not edited. The lock that came in with main installs ws 8.21.0 and source-map-js 1.2.2. Next 16.4.1, React 19.2.8, Zod 3.25.76, and Supabase stay at the accepted resolutions. The integrated mounted run is `docs/evidence/multi-stop-create-day-allocation-1/mounted-cdd2282ba5c8.json`, 10/10.
