# V2-S0 Travel Days and Transfers Contract 1 — DECISION

Date 27 October 2026. Tracking [#1047](https://github.com/Jetnity/jetnity/issues/1047). Parent [#1046](https://github.com/Jetnity/jetnity/issues/1046).

This is a source contract. It does not change runtime behaviour. It binds later implementation of F01 and N12. Lodging code stays with [#1048](https://github.com/Jetnity/jetnity/issues/1048).

Traveller context: day order, stage assignment, and night intervals are properties of the trip graph. They do not depend on citizenship, residence, or travel-document choice. This contract collects none of those facts.

## Decisions

1. **Stage duration remains an insert or delete.** `etappe_dauer` and `dauer_aendern` change how many day rows exist. They do not redistribute existing day ids. A later UI must keep that meaning.
2. **7 unassigned days plus requested lengths 3 and 4 are 14 days.** The original 7 ids stay, with `stageId` null. Seven new ids are appended and assigned. The trip end moves. Stage arrival and departure are rewritten from the new rows. That is the current editor. It is a duration change. It is not the 7-day allocation the create path already knows.
3. **Allocating existing day ids after create is not available on either accepted writer today.** Guest has no operation that sets `stageId` on an existing day. Account `public.reise_aendern` can update `trip_days.stage_id` for ids that stay in the payload, and it does not update `trips.day_stage_assignment_mode`. **Account assignment is ACCOUNT BLOCKED** until an owner-gated RPC change derives that mode in the same transaction. No SQL is issued here.
4. **Chronology is `dayIndex`, then day id.** A day may carry travel and a destination stay together. There is no exclusive day-role enum. Null `stageId` plus a flight or transfer item is planned travel. Null `stageId` with no travel item and no stay item is undecided. Day 1 is not an outbound day, and the last day is not a return day, unless the user has actually placed that travel.
5. **N dated days with known bounds have N−1 overnight intervals.** A travel label, a null stage, or a stage name does not cover a night. The current lodging reader does not yet implement that full classification. [#1048](https://github.com/Jetnity/jetnity/issues/1048) owns the reader change. This slice does not edit it.

## F01 — what the editor does

`ReiseAenderungManuell` starts from `basis.days.length`. In stage mode it adds `requestedDays - daysAlreadyOnThatStageId` for every edited stage. Days with `stageId === null` count as zero on every stage. `manuellerEntwurf` turns each non-zero difference into `etappe_dauer`. `etappeDauer` in `lib/reiseaenderung/anwenden.ts` inserts that many new days after the stage’s last assigned day, or deletes days from the end of that stage.

Synthetic proof, Guest and Account, mode `unassigned`, days `2026-06-01` through `2026-06-07`, stages Bangkok and Chiang Mai, request 3 and 4, duration 14:

| Result | Guest | Account preview graph |
| --- | --- | --- |
| Operations | `etappe_dauer` +3, `etappe_dauer` +4 | same |
| Day rows | 14 | 14 |
| Original 7 ids | kept, `stageId` null | kept, `stageId` null |
| New ids | 3× Bangkok, 4× Chiang Mai | same ids in the `reise_aendern` payload |
| End date | `2026-06-14` | `2026-06-14` |
| Stage dates after apply | Bangkok `2026-06-08`–`2026-06-10`, Chiang Mai `2026-06-11`–`2026-06-14` | same graph, then payload |
| `dayStageAssignmentMode` | `explicit`, because `reiseLesen` recomputes from any set `stageId` | stays `unassigned` |
| Payload key `day_stage_assignment_mode` | guest storage has no RPC payload | absent |

The stage dates are produced by `reindex`. The user did not enter 8–14 June as stage bounds. Those dates describe only the appended rows. The original week stays unassigned. Calling this “assign the existing week as 3+4” would be a false description of the current function.

Repeating 3 and 4 when those counts are already stored returns `Es gibt noch keine Änderung.` The graph stays 7 days. Raising an already assigned 3+4 to 6+8 inserts +3 and +4, keeps the original 7 ids, and yields 14 days. That second case is a real duration edit.

`tageEtappenZuordnen` does not fill `unassigned` or `explicit`. It still proportionally fills only a persisted `legacy_fallback`. New requests must not be given that mode. This decision does not use proportional fill as a repair.

## 7→7 and 7→14

| Case | Day count | Ids | Meaning |
| --- | --- | --- | --- |
| Create-time `createDayPositions` for 3 then 4 across 7 existing calendar days | 7 | the days `reisetageBauen` already produced | Accepted initial allocation. Mode `explicit`. Proven again: positions `[1,1,1,2,2,2,2]`. |
| Edit, days already on those stages, request 3 and 4 again | 7 | unchanged | No operation. |
| Edit, 7 days with null `stageId`, request 3 and 4 | 14 | original 7 plus 7 new | Current duration edit. |
| Edit, assigned 3+4, request 6+8 | 14 | original 7 plus 7 new | Current duration edit, explicit lengthening. |

Create allocation and edit duration answer different questions. Create-time assignment of 3 days then 4 days on an existing 7-day calendar stays 7 days. The direct editor, given those 7 days with null `stageId` and requested lengths 3 and 4, grows the trip to 14 days. R109 recorded a separate case: a trip that is already 14 days long, with those days assigned 3 then 4 then 7, stays 14 days rather than becoming 28, and duration editing must not be relabelled as distributing existing days (`docs/JETNITY_MULTI_STOP_CREATE_DAY_ALLOCATION_1_TASK_V1_2026-10-26.md`). S0 confirms that split still holds on main `d31a16afdac5e97d4b02f4cb5824f5adc290577c` and adds the unassigned-edit arithmetic above.

A later editor can offer two separate actions:

- **Dauer ändern** — today’s insert and delete, with the preview showing the resulting day count before save.
- **Vorhandene Tage zuordnen** — sets `stageId` on ids that already exist.

The second action is specified below. It is not implemented.

## Allocating existing day ids

Required save shape:

- Same day ids, same `dayIndex`, same `dayDate`, same trip `startDate` and `endDate`.
- `stageId` may change to an existing stage of this trip, or stay null.
- No day insert, no day delete, no new stage, no stage delete.
- Stage `arrivalDate` and `departureDate` stay as already stored. Assignment must not invent them. One calendar day of a stage is not a hotel interval.
- Booked and commercial items keep `dayId`, `stageId`, schedule, price, provider, and booking fields.
- Partial assignment stays partial. Null days are not filled by proportion or by “the rest of the trip”.
- Known assignments follow stage occurrence order when null days are ignored. A contradiction is rejected. This is the same order rule as `createDayPositions`.
- Revision and `lastMutationId` move once, through the existing idempotent writers.

### Guest

`gastreiseAendern` only applies `Modelloperation` values. The operation set has no “set stage on this day”. `tag_hinzufuegen` and `etappe_dauer` create rows. `reiseLesen` would recompute mode from resulting positions if a graph with updated `stageId` values were stored, so Guest does not need a new column or a new RPC for assignment alone.

There is still no accepted Guest function that writes that graph. A later Guest-only slice can add one local mutation that patches `stageId`, skips `reindex`, and saves through the current storage and revision checks. That slice is not this PR. It must not be wired to Account.

### Account — ACCOUNT BLOCKED

`public.reise_aendern` (last replaced in `supabase/migrations/20260820130000_reise_aendern_places.sql`) updates `trip_days.stage_id` for an id that already exists and deletes only ids missing from the payload. It also writes stage `arrival_date` and `departure_date` from the payload. It never mentions `day_stage_assignment_mode`. That column is derived only inside `public.reise_anlegen` (`20260827010000_reise_anlegen_zero_stage_fail_closed.sql` and the later commercial-provenance replace, which keeps the same derivation).

`aenderungAlsNutzlast` does not send the mode. `manuelleAenderungUebernehmen` recomputes the closed manual subset and does not accept a client replacement graph. The free-text path is the same operation list.

So the RPC can physically store new `stage_id` values, and the accepted product writers will not send an allocation. If a caller did send one, the mode column would stay at its previous value. The synthetic Account preview already shows that split for the current 7→14 duration edit: new rows carry stage ids, the in-memory mode stays `unassigned`, and the payload omits the mode. Shipping assignment on top of that RPC would persist the same split.

**Stop.** Account post-create assignment needs an owner-gated change to the existing SECURITY INVOKER RPC, or one new SECURITY INVOKER RPC, in a later slice:

- Same owner, same `basis_revision`, same `last_mutation_id` idempotency, no service role.
- After the day rows are written, set `day_stage_assignment_mode` on the server with the create derivation: one stage → `single_destination`; several stages and at least one non-null `trip_days.stage_id` → `explicit`; several stages and all null → `unassigned`.
- Never mint `legacy_fallback`. Never fill remaining null days.
- Do not update price, provider, booking, or commercial provenance columns.
- A pure assignment payload must not change day ids, day dates, day indexes, or stage arrival and departure.

Until that gate is accepted and implemented, Account writes of this kind stay blocked. This PR does not add the migration.

Guest→Account takeover is unchanged. A Guest graph that already has explicit positions at create still goes through `reise_anlegen`. A Guest graph edited only in the browser after create is not given a new Account assignment path here.

## N12 chronology

The 22-day story is a requirement. It was not reproduced as an Account trip, and this slice did not open a private account.

Canonical order is ascending `dayIndex`, then day `id`. `dayDate` is the calendar label and the overnight bound. It is not a second sort. `reindex` already forces dates from `startDate` when a start date exists; a later chronology view uses the stored index order.

A day has a set of facts, not one role:

| Fact on that day | Reading |
| --- | --- |
| Flight or transfer item | Planned travel. Show it. |
| Stay or activity item | Planned stay or activity. Show it. |
| Both | Mixed day. Show both, in item `position` order. |
| `stageId` set | That day belongs to that stage occurrence. |
| `stageId` null and a flight or transfer is present | Planned travel whose destination stage is still undecided. |
| `stageId` null and no flight, transfer, or stay | Undecided. |
| `title` text | The user’s own label. It is not parsed into outbound, transfer, return, or a hotel night. |

Hinreise and Rückreise are the user’s travel items. They are not inferred from “first day” or “last day”. A transfer between destinations is a transfer item on the day the user chooses. The same day may also keep a stay.

Cross-midnight: one item may have `startsOn` on an existing day and `endsOn` on a later existing day, with `startsAt` and `endsAt` as local `HH:MM` and no zone. The chronology may show that leg on each existing date it touches. The item keeps one `dayId`. No second day row is created. If `endsOn` is not already a trip day, the end stays an item fact and the trip is not lengthened. Unknown zone stays unknown.

A structured flag such as `outbound` with no item and no stage is not representable. `TripDay` stores `id`, `stageId`, `dayIndex`, `dayDate`, `title`, and `items`. Adding a role column would be schema work for Account and is inside the same owner gate as any new persisted field. This decision does not add it. Users designate travel by the items they already can store (`flight`, `transfer`, `stay`, `activity`, `note`). A note is not a travel event and does not cover a night.

Booked items stay booked only when `bookingStatus` is already `booked` and the source is `user`. Nothing in this contract confirms a provider booking.

## Nights

For a trip whose `startDate` and `endDate` are known and whose day rows are exactly the inclusive calendar from start through end, there are N day rows and N−1 overnight intervals: `[dayDate_i, dayDate_{i+1})`. If either bound is missing, or the day dates do not form that sequence, coverage is unknown. Unknown is not zero.

Each interval is one of:

1. **Booked stay** — a `stay` item with `bookingStatus = booked` whose half-open `[startsOn, endsOn)` covers the night.
2. **Chosen stay** — the same with an unconfirmed stay.
3. **Explicit travel-night** — a user-authored `flight` or `transfer` whose known local start and end cover that night. A title, a stage name, or a null stage does not qualify. This category is not in the current reader.
4. **Unresolved** — anything else.

A travel-night is not accommodation. Overlapping stays still merge. Commercial confirmation still comes only from stored booking fields.

Current `unterkunftAbdeckung` differs, and the difference is why [#1048](https://github.com/Jetnity/jetnity/issues/1048) exists:

- Stages with null dates, two stages, 22 days `2026-06-01`–`2026-06-22`, three travel items and no stay: `bekannt` true, `naechteGesamt` 21, `naechteAbgedeckt` 0. The trip-level fallback matches N−1. The travel items do not reduce the gap. `reiseLesen` accepts this graph and leaves the mode `unassigned`.
- The same trip with stage bounds Bangkok `2026-06-02`–`2026-06-10` and Chiang Mai `2026-06-11`–`2026-06-21`: `naechteGesamt` 18. The union of those half-open stage intervals drops the night of 1 June, the night of 10 June, and the night of 21 June. That is the current stage-interval reader. The N−1 contract says those nights remain part of the trip when the day rows exist. S1 changes the reader. S0 does not.

## 22-day acceptance scenarios

Synthetic calendar `2026-06-01` … `2026-06-22`, `dayIndex` 1…22, two stages, all `stageId` null, stage dates null. Not an Account fixture and not a private trip.

1. Day 1 carries a flight `22:10`–next day `14:40`. Day count stays 22. The leg is visible on the existing dates it touches. It does not create a day and does not cover a hotel night.
2. Day 11 carries a transfer on that date and may also carry a stay or activity. Both remain. The transfer does not assign a stage and does not mark the surrounding nights as accommodated.
3. Day 22 carries a return flight because the user placed it. Removing the item leaves an undecided last day.
4. Assigning existing ids of days 2–10 to the first stage and days 12–21 to the second, leaving days 1, 11, and 22 null, keeps 22 ids, the same dates, and null stage dates. Guest: no current operation. Account: ACCOUNT BLOCKED.
5. Entering stage lengths 3 and 4 against 7 unassigned days is scenario F01, result 14, and must not be used as the implementation of scenario 4.

## Rejected alternatives

- Treating the stage-length fields as a redistribution of existing days. That would make a real lengthening impossible to express and would hide the 14-day result.
- Running `reindex` after assignment. The proof shows it writes stage dates onto the newly inserted days.
- Proportional `legacy_fallback` for a current unassigned trip.
- Inferring outbound from day 1, return from the last day, or a hotel from a stage length.
- Creating a flight or stay item in order to store a label.
- Calling today’s `reise_aendern` with a hand-built graph and leaving the mode stale.
- A second client `UPDATE` of `day_stage_assignment_mode` outside the trip RPC.
- A new day-role column in this PR.

## Path ownership

| Path | This slice |
| --- | --- |
| `components/trips/ReiseAenderungManuell.tsx` | Read. Later UI honesty for Dauer vs Zuordnen. Not edited. |
| `lib/reiseaenderung/direct/entwurf.ts`, `anwenden.ts`, `nutzlast.ts`, `aktionen.ts`, `direct/gast.ts`, `direct/speichern.ts` | Read. Not edited. |
| `lib/trips/gastspeicher.ts` `gastreiseAendern` | Read. Guest mutation seam. Not edited. |
| `lib/trips/create-day-assignment.ts` | Read. Create-only allocation. Not edited. |
| `lib/trips/zuordnung.ts`, `lib/trips/day-stage-assignment.ts`, `lib/trips/schema.ts` `reiseLesen` | Read. Not edited. |
| `lib/trips/naechte-abdeckung.ts` | Read. Owned for change by #1048. Not edited. |
| `supabase/migrations/20260820130000_reise_aendern_places.sql` | Read. Account write primitive. Not edited. |
| `supabase/migrations/20260827010000_reise_anlegen_zero_stage_fail_closed.sql` | Read. Create-time mode derivation. Not edited. |
| S1 lodging and hotel audit files, S2 traveller/header/preparation, S3 guest CTA/nav, #1043 Activities | Not edited. |
| `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ARCHITECTURE.md` | Not edited. Parallel writers share the first file. Promotion of this decision into the global ADR list is a later Technical Lead documentation step. |

## Unknowns

- Hosted Production catalog was not read (#917). Source shows `reise_aendern` does not set the mode column. Historical Gate B documents say the column reached Production earlier. This decision does not re-certify that catalog.
- N12 was not opened as a real Account trip.
- No mounted browser and no private session. #748 stays suspended.
- Whether a later owner accepts the RPC gate is open. Until then, Account assignment stays blocked.
