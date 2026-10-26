# R109-T — Multi Stop Create Day Allocation 1 — REPORT

Date: 26 October 2026.

Writer: **Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-a0a82333-7855-4ba7-b641-39af97c78458  
Model: `grok-4.7-high-fast`. Not Auto.

## What changed

`createDayPositions` is the one mapping for Guest and Account. Claims are inclusive calendar ranges on a 1-based occurrence. `createZieleGraph` keeps multi-stop arrival and departure null and puts a day position only on the days the claim covers. `createKontoTage` writes those positions to `stage_position`. The guest graph stores the same index as `stageId`. `alsNutzlast` was not edited; the path test shows it emits the same positions.

The planner keeps claims on stable row keys. Submit maps keys to the current confirmed order. Opt-in off, or no claims, omits `dayAllocation`. `dayAllocation` is not part of `reiseNutzlastSchema`.

`rohEingabeBegrenzen` runs before `safeParse` in `reiseAnlegen` and `gastreiseUebernehmen`, before guest storage in `gastreiseAnlegen`, and after `konto()` in `reiseAusNutzlastAnlegen`. Lengths are read before item contents. The day list is capped at 366. The sum of day items plus `ungeplante` is capped at 1000. After that, at most 1000 items are opened for `route_itinerary`, including non-flight items. The guard does not replace Zod.

The server-action inventory hash for `lib/trips/aktionen.ts` was updated in `scripts/next-16-4-1-security-patch-p1/historical-control.json`. No other control field moved. That file was not on the owned list. The update records the authorized body change so the drift check stays meaningful.

## Proof

Node 22.23.4. Playwright 1.55.0 against `/opt/google/chrome/chrome`. External origins aborted. Synthetic places only.

Mounted harness, final run, 6/6 pass, overflow 0 at 320, 390, 768, 1280, and at 320 and 1280 with a 32px root font:

- keyboard origin, 3/4/7, guest graph stays 14 days, timeline and activity context, arrival null
- first 3 days assigned, 11 unassigned
- day-1 Phuket against a later Bangkok claim focuses the field and does not store
- reorder keeps the claim on the row key, shows the order alert, reset returns focus to the checkbox
- account submit sends occurrences 1, 2, 3 and does not write guest storage

Focused tests passed: create-day assignment, input bounds, guest/account path, create-stages, day-stage truth, gastspeicher, schema, uebernahme (with the server-only register).

`npm test`: 7276 tests, 7259 pass, 12 fail, 5 skipped, exit 1. Eleven failures are local PostgreSQL 16 missing (`initdb` ENOENT, `NOT_VERIFIED`, or `local_proof_connection_override_forbidden`). The twelfth was server-action inventory drift from `aktionen.ts`. After the hash update, `lib/security/next-16-3-8-security-upgrade-1.test.ts` passes. The full suite was not re-run after that one-file hash change.

`npm run typecheck` exit 0. `npm run lint` exit 0, 0 errors, 181 existing warnings; the new planner warning was removed by adjusting claims during render instead of in an effect. Hygiene `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` exit 0.

Early mounted layout runs overflowed (95px at 320, then 21px, then 30px at 320 with 32px text) because a date-input rule stretched the checkbox and the date control's intrinsic width exceeded the narrow column. The final CSS limits that rule to `input[type=date]`, uses `appearance: none`, and keeps the block on `minmax(0, 1fr)`.

## Production build

`npm run build` exit 0. Setup check passed, then the Next.js production build completed and listed the existing routes, including `/planen`.

## Boundaries

No hosted SQL, migration, Auth, RLS, provider, payment, package, or global continuity edit. No Ready. No merge. No follow-up slice.
