# Trip Workspace Manual Flight Route Completion 1 — Handoff

Date: 5 October 2026 · Issue #836 · Draft PR #837
Status: **DRAFT / STOP FOR INDEPENDENT EXACT-HEAD REVIEW**

## Review identity

- Branch: `fix/trip-workspace-manual-flight-route-1`.
- Exact baseline and merge-base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`.
- Immutable task seed: `e5ae8e54040c69d38c37e57d740e973982355446`.
- Implementation/tests: `9fea3e8284d6d291b809ebc5a9deafaafad25d40`.
- Final delivery consists of that implementation plus a docs-only commit containing these three deliverables. Resolve the exact current PR head and compare it with the final PR-body receipt before review. Expected final graph: main 0 ahead / branch 3 ahead, including task seed; no behind commits.
- Task blob is unchanged: `5cd20b05aff41754d62d43c70a269eb4b7cd8c4f`.
- Codex Desktop session `01a10975-730b-79d2-8bc0-fb664cf20085`: recorded `gpt-6-astra`, `xhigh`. One Generation-1 writer; no Cursor/subagent/replacement.

## Exact changed-file manifest against baseline

1. `components/trips/FlugBestand.tsx`
2. `components/trips/GastArbeitsbereich.tsx`
3. `components/trips/KontoArbeitsbereich.tsx`
4. `components/trips/TripWorkspace.tsx`
5. `lib/trips/aktionen.ts`
6. `lib/trips/gastspeicher.ts`
7. `lib/trips/schema.ts`
8. `lib/trips/flug-manuell.ts` — the one new bounded helper
9. `lib/trips/flug-manuell.test.ts` — the one new narrowly scoped test file
10. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_TASK_2026-10-05.md` — immutable seed addition
11. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_REPORT_2026-10-05.md`
12. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_HANDOFF_2026-10-05.md`
13. `docs/TRIP_WORKSPACE_MANUAL_FLIGHT_ROUTE_COMPLETION_1_SELF_REVIEW_2026-10-05.md`

No route-domain/airport-reader file, migration, API, generated DB type, dependency, global governance file or #839 file changes.

## Reviewer focus

The account boundary is the actual `flugRouteManuellSetzen` server action: strict validation before `konto()`, exact trip/item lookup, all-airport resolution, reference-only canonical fields, five-field write, repeated manual guards, metadata compare-and-set, returned-row requirement and sanitized failure. Ownership still comes from RLS. No arbitrary client metadata update path was added.

The guest path uses the same strict input, exact-one target, IATA-only null-country itinerary and existing graph persistence. Review preservation tests for both day and undated items and unchanged route chronology behavior. A guest unknown-but-well-formed IATA may persist as a draft code; account requires every code to exist in airport references.

Review UI save/cancel and prefill through all three callback layers. Larger legacy routes are explicitly blocked from silent truncation. Optional missing times remain null. No dates/airports are inferred from trip/stage/free text. Booking controls do not live inside the route form.

## Evidence and remaining limitation

See REPORT for commands and browser results. The 36 new tests and all 937 focused tests pass. Typecheck, lint (149 existing warnings), all required hygiene/operating-mode checks and production build pass. Browser verifies keyboard flows, storage-failure retention, persistence and widths 280–1280.

**Local `npm test` is not green:** 5,246 pass / 4 fail / 0 skipped. Four unchanged Official Truth disposable-PostgreSQL tests require `/usr/lib/postgresql/16/bin/initdb`, absent on this Mac. Independent review must inspect the final-head Linux/PostgreSQL CI result or rerun in that environment. Do not equate the mocked account transport proof with hosted RLS/trigger acceptance. No hosted DB was touched.

Before acceptance, reread main/mode/#751/new #748 evidence and both PRs, prove task identity, final changed files/merge-base/ahead-behind, and inspect review threads on the exact delivered head. #839 was file-disjoint at the writer's last read; #837 had no review threads then. Historical sections of #751 do not override its current writer section.

**The writer stops here.** Keep #837 Draft. No Ready, merge, production action, U02/U03/B01 or follow-up is authorized by this handoff.
