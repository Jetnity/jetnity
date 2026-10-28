# F05 Ground-vs-Flight Audit 1 — HANDOFF

27 October 2026. For the next reviewer or the same Cursor session if R1 is requested.

## Read first

1. Immutable task `docs/JETNITY_TRIP_F05_GROUND_FLIGHT_AUDIT_1_TASK_V1_2026-10-27.md`
2. This branch tip, not the seed `0fc3ea726ba4b6b298c926e45c2add7831067046`
3. `lib/trips/trip-audit-v1/f05-ground-flight.ts` and the flight section of `audit.ts`
4. `docs/JETNITY_TRIP_F05_GROUND_FLIGHT_AUDIT_1_SELF_REVIEW_2026-10-27.md`

Session that must receive any R1: `bc-3dd8760a-36a9-4040-9d07-49a295073e8c`. Display name `Jetnity V2 F05 Ground Connection Flight Audit 1 — Cursor Generation 1`. Model `grok-4.7-high-fast`.

## Behaviour a reviewer should see

On a synthetic Zürich → Florenz → Rom trip, a stored rail Florenz → Rom with canonical place ids, date `2026-09-15` and `stageId` of the arrival stage removes only that flight `known_gap`. The finding state is `unknown`, title `Bodenverbindung geplant, Flugbedarf nicht belegt`. Outbound and return flight gaps remain. The flight section stays `partial` and still counts `0` selected and `0` booked flights. The mobility section counts the rail as selected, or as user-marked booked only when `bookingStatus === 'booked'` and `bookingSource === 'user'`.

Name-only matches, airport aliases, reversed places, null mode, null or departure-stage ids, duplicate rails, a repeated Florenz → Rom pair, and a same-date unbound flight do not produce that ground title. Where the ground evidence is ambiguous, the flight gap is withheld as `flight_obligation_not_established` instead of being declared a missing flight.

## Do not treat as done

- Workspace copy from `flugAbdeckung` can still say `Noch kein Flug ausgewählt` when a rail covers the edge. That projection was left unchanged on purpose. A later slice would be required if the flight card, not only TripAudit, must stop implying a flight is missing. Do not start that slice from this handoff.
- `flugAbdeckung` walks stages in array order. `mobilitaetsAbdeckung` sorts by `position`. When those orders differ, F05 withholds flight `known_gap` rows instead of aligning the projections. Persisted trips are normally position-sorted. A hand-built graph is fail-closed, not repaired here.
- Hosted GitHub App CI, Auth CI and Vercel Preview belong to the pushed head. This session did not see them finish.
- No Ready, no merge, no Production check, no provider call.

## Ownership

Exclusive edits are the audit files and these F05 docs. N12 PR #1062 still owns timeline and `TripWorkspacePlan.tsx`. `docs/ACTIVE_WORK_STATUS.md` was not touched.
