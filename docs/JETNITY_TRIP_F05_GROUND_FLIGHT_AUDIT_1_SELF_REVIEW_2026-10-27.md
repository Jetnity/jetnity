# F05 Ground-vs-Flight Audit 1 — SELF REVIEW

27 October 2026. Author review only. This is not an independent Technical Lead PASS.

## Checked

- The ground finding is reachable only from `f05AdjustFlightKnownGap` returning `ground`.
- Place equality is exact and requires non-empty ids without whitespace. Names, country codes, coordinates and provider fields are not read as evidence.
- `booked` on the mobility edge is accepted only together with `istGebucht` and `bookingSource === 'user'`. The flight section's booked count is not incremented for that rail.
- Flight section coverage cannot become `complete` solely because a rail replaced a gap: the replacement is state `unknown`, which forces `partial`.
- A selected or user-booked flight with a proven ZRH → BKK itinerary stays a flight count. It is not rewritten as a ground finding.
- Lodging findings on the synthetic trip are unchanged by adding the rail. Time still comes from `tripZeitpruefung`.
- Guest override and account `ohneTag` produce the same report. Frozen input is unchanged.
- Existing audit tests T01–T10 and R1 still pass, including the source scan that forbids network, storage, clock and provider imports in the audit runtime. The new helper is included in that scan.
- `check:exports` and `check:dead` report no new unused export or orphan module.

## Limitations I am not calling a pass

- Fail-closed `withhold` removes a definitive `Kein Flug` row when a transfer is unassigned anywhere, when stage `position` order disagrees with array order, or when a directed place pair repeats and any twin is no longer open. That can hide a still-true "no flight stored" statement in those ambiguous graphs. The replacement is `unknown`, which matches the task's fail-closed rule, and it is broader than the single matched edge.
- A transfer must carry the arrival stage id (`connection` destination, `outbound` destination, or `return` origin stage). A rail stored on the departure stage of a connection is withheld even when place ids and date match. That is deliberate and stricter than `mobilitaetsAbdeckung`.
- Stage ids that contain `:` cannot be parsed from `connection:from:to` and fail closed.
- `lib/mobility/kanten.ts` can still mark an edge `selected` from city names. The audit does not trust that status. The mobility section itself is unchanged, so the mobility summary can still say ausgewählt for a name-only transfer while the flight audit refuses ground coverage.
- No hosted CI, Auth job, Preview, Postgres 16, or browser click-through was observed. Static markup of `TripAuditFinding` shows `Unbekannt`, the rail title, and not `Planungslücke` / `Kein Flug`.
- Local `npm run build` succeeded with the pre-existing setup warning that no `.env` file is in this environment.

## Scope held

No change to `flug-abdeckung.ts`, `kanten.ts`, timeline, workspace plan, packages, workflows, SQL, Auth, RLS, secrets, or `docs/ACTIVE_WORK_STATUS.md`.
