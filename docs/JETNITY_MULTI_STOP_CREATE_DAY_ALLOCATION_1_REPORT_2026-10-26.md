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

`npm run build` exit 0 on the R1 tree after `zeitraumDauer` was made private. Setup check passed, then the Next.js production build completed and listed the existing routes, including `/planen`. The same run had `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` at exit 0. `npm run typecheck` exit 0. `npm run lint` exit 0, 0 errors, 180 warnings. `check:dead` exit 0.

## R1.1 — over-limit interval

Reviewed head `54a06423` accepted 2026-11-01 through 2027-11-02, built 366 positions ending 2027-11-01, and the planner said the journey remained 366 days. Guest create then failed in the existing reader. Nothing was stored.

`zeitraumIstZuLang` now runs before `reisetageBauen` on the create mapping, before `neueReiseSchema` builds an allocation, before `createKontoTage`, and before guest storage. The planner shows `Eine Reise umfasst höchstens 366 Kalendertage, einschließlich Abreise und Rückreise.` on the return date, focuses `#feld-ende`, and does not dispatch a writer. A valid 366-day create still says the journey remains 366 days. The stored-reader sentence stays `Eine Reise dauert höchstens 365 Tage`. The stand text does not count a truncated interval.

Wording proof: runtime `6997f78f1475169be07ff69a13c28ba917fdf1c6`, evidence `docs/evidence/multi-stop-create-day-allocation-1/mounted-6997f78f1475.json`, 10/10. The 367-day field text is the 366-calendar-day sentence. The 366-day guest graph still stores 366 days and shows no return-date error. `npm run typecheck` and `check:exports` exited 0 on that commit. `lib/trips/tage.ts` was outside named ownership and was edited before the proposal; Root authorized only the additive guard, constants, and comment.

Mounted proof on runtime `c17257ad04ac8bb90e6136c7b3b3f7a50f7537f2`, evidence `docs/evidence/multi-stop-create-day-allocation-1/mounted-c17257ad04ac.json`: 10/10 pass, external requests empty, `hostedPersistence: not invoked`. The previous six cases still pass, including keyboard 3/4/7, partial 3+11, contradiction focus, reorder/reset, account occurrences, and overflow 0 at 320/390/768/1280 and at 200% text. Added cases: 367-day guest rejection with empty storage and focus on `#feld-ende`; 367-day account submit with zero `reiseAnlegen` calls; 366-day guest graph stored as 366 days ending 2027-11-01 with 3 assigned and 363 unassigned; 366-day account payload keeps `endDate` `2027-11-01`.

Focused Node tests also cover leap boundaries: 2024-01-01..2024-12-31 and 2024-02-29..2025-02-28 accepted at 366 days; 2024-01-01..2025-01-01 and 2023-03-01..2024-03-01 rejected. Single-destination and no-opt-in 366 stay valid. The same shapes at 367 return `ZEITRAUM_ZU_LANG` and no positions. Guest storage size stays 0 after the rejected write.

`npm run typecheck` exit 0. `npm run lint` exit 0, 0 errors, 180 warnings. `check:dead` exit 0. `check:exports` failed once because `zeitraumDauer` was exported without an outside caller; it is now private. `check:deps`, `check:api-schutz`, and `check:schema-bezug` are recorded with the production build below after that visibility fix. `lib/security/next-16-3-8-security-upgrade-1.test.ts` passed. The full `npm test` suite was not re-run; the earlier PostgreSQL 16 failures remain an environment limit. `aktionen.ts` and the historical-control file were not edited in R1.

`origin/main` re-read: `68435f012f27f599a1092699f5635aa88312ea67`. Merge-base `6ae344f4453b16514f9048083bb8b07396135fa2`. Not rebased.

## Integration

Accepted main `68435f012f27f599a1092699f5635aa88312ea67` was merged with `--no-ff` as `cdd2282ba5c82e492ce17cd0bc741d7fc4bfa58d`. The product diff against that main is the owned create path plus the one authorized action-blob inventory entry. `npm ci` used that lock and did not rewrite it. Installed: ws 8.21.0, source-map-js 1.2.2, zod 3.25.76, next 16.4.1, react 19.2.8, `@supabase/supabase-js` 2.57.2. Node v22.23.4.

On that install: 311 focused tests passed. Mounted harness 10/10, evidence `docs/evidence/multi-stop-create-day-allocation-1/mounted-cdd2282ba5c8.json`. Typecheck, lint (0 errors, 180 warnings), five hygiene checks, and the production build exited 0. `npm test` exit 1: 7279 tests, 7263 pass, 11 fail, 5 skipped. All 11 failures are local PostgreSQL 16 proofs.

## Boundaries

No hosted SQL, migration, Auth, RLS, provider, payment, package, or global continuity edit. No new duration contract. No Ready. No merge. No follow-up slice.
