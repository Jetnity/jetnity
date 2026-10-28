# F05 Ground-vs-Flight Audit 1 — PLAN

27 October 2026. Immutable task: `docs/JETNITY_TRIP_F05_GROUND_FLIGHT_AUDIT_1_TASK_V1_2026-10-27.md`. Tracking #1061. Draft PR #1063. This file records the plan that was posted on the PR before implementation.

## Session

- Logical name: `Jetnity V2 F05 Ground Connection Flight Audit 1 — Cursor Generation 1`
- Session: `bc-3dd8760a-36a9-4040-9d07-49a295073e8c`
- URL: https://cursor.com/agents/bc-3dd8760a-36a9-4040-9d07-49a295073e8c
- `originalModelName`: `grok-4.7-high-fast` (re-read after `rename-chat`; not Auto)
- Branch: `fix/v2-f05-ground-flight-audit-1`
- Verified seed head: `0fc3ea726ba4b6b298c926e45c2add7831067046`
- `origin/main` and merge-base at start: `a9b7a45b88347da3cac92965e2c544ec5e1bca67`
- Ahead/behind at start: 1 / 0. Diff was only the immutable task.
- Mode: `NORMAL`

## Decision

Reconcile inside `lib/trips/trip-audit-v1` only. Do not edit `lib/trips/flug-abdeckung.ts`.

`flugAbdeckung` status `open` remains the truthful statement that no stored flight is bound. The false obligatory sentence `Kein Flug für diesen Abschnitt im Plan` is emitted only by `tripAuditV1`. Changing the flight projection would relabel a rail as flight coverage for every workspace consumer. `lib/mobility/kanten.ts` stays read-only. Its name fallback is not used as proof.

## Rule

For an open, dated flight segment, emit the ground finding only when the flight and mobility projections share the same section ids, and one mobility edge matches that id and direction, canonical place ids, validated date, destination stage id, and one `transfer` item whose `mobilityMode` is `rail`, `bus`, `ferry` or `transfer`. User `booked` is accepted only when `istGebucht` and `bookingSource === 'user'`.

That finding is state `unknown`, not `known_gap`. The flight section stays `partial`. Flight selected/booked counts stay flight counts.

Anything ambiguous withholds the flight `known_gap` without claiming ground coverage: unassigned flight or transfer, projection-id mismatch (including position order versus array order), repeated directed place pair once any twin is no longer open, duplicate or unknown mode, null or wrong stage, reversed places, airport alias, null date, or a conflicting flight. A clean open edge with no ground item keeps today's flight gap.

## Out of scope

No provider, SQL, Auth, RLS, package, workflow, `ACTIVE_WORK_STATUS`, N12 timeline/UI, or `kanten.ts` edit. No Ready and no merge.
