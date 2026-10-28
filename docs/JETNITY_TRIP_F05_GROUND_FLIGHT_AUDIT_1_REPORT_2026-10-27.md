# F05 Ground-vs-Flight Audit 1 — REPORT

27 October 2026. Cursor Generation 1. Session https://cursor.com/agents/bc-3dd8760a-36a9-4040-9d07-49a295073e8c. `originalModelName=grok-4.7-high-fast`. Draft PR #1063. Issue #1061. Parent #1046.

## Status

Partially finished for author delivery. Independent Technical Lead review, hosted CI, Auth CI and Vercel Preview are not done. Not Ready. Not merged.

## Umgesetzt

TripAudit no longer turns an open flight segment into `Kein Flug für diesen Abschnitt im Plan` when one stored ground transfer proves the same stage-occurrence edge. The proof is the shared projection id and direction, exact canonical place ids, a validated date, the arrival stage id, and a recognized transfer mode. The flight finding becomes `unknown`: ground travel is stored, flight necessity is not established, and a user mark of booked is not a provider booking. The flight section stays partial. Ambiguous graphs withhold the flight gap instead of claiming either a missing flight or ground coverage. Real selected and user-booked flights stay flight evidence.

`lib/trips/flug-abdeckung.ts` was not edited. `open` there still means no flight item is bound.

## Dateien

- `lib/trips/trip-audit-v1/f05-ground-flight.ts`
- `lib/trips/trip-audit-v1/f05-ground-flight.test.ts`
- `lib/trips/trip-audit-v1/audit.ts`
- `lib/trips/trip-audit-v1/audit.test.ts` (purity scan now includes the helper)
- `docs/JETNITY_TRIP_F05_GROUND_FLIGHT_AUDIT_1_{PLAN,STATUS,HANDOFF,SELF_REVIEW,REPORT}_2026-10-27.md`

## Datenbank

No migration, no RLS, no type change, no Supabase call.

## Tests

Focused audit tests: 28 pass, 0 fail (`f05-ground-flight.test.ts` and `audit.test.ts`).

`npm run typecheck` pass. ESLint on the four audit files pass. `npm run build` pass, with the environment warning that no `.env` / `.env.local` exists here. `check:exports` 0 unused exports. `check:dead` 0 orphan modules.

Not run, and not claimed: Postgres 16, `db:rls`, `db:sicherheit`, `auth:pruefen`, GitHub App CI, Auth CI, Vercel Preview, a browser session.

## Security

No new route, secret, service role, or auth change. The audit remains an on-demand projection of the stored plan. Ground evidence does not copy provider, booking URL, or external ref into the report. The existing T06 scan still forbids those strings in the audit output.

## Kosten

No new runtime cost, provider call, or paid service.

## Traveller context

Checked. This slice does not read citizenship, residence, or travel documents, and it does not infer a flight from country. A country change alone does not create or remove the ground proof.

## Offene Risiken

- The flight workspace can still summarise an uncovered flight projection as `Noch kein Flug ausgewählt` while TripAudit has already accepted a rail. That is a follow-up only if the Technical Lead assigns it. It is not started.
- Fail-closed withholding is wider than the single matched edge when any transfer is unassigned or the two projections disagree on stage order.
- Hosted CI and Preview on this head are still the review gate. This local build is not that gate.

## Nächster Schritt

Technical Lead reviews the exact pushed head. Cursor stops. No Ready, no merge, no follow-up.
