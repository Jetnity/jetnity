# Changed-path manifest — V1 Guest Active Draft Preservation 1

Exclusive runtime:

- `lib/trips/gastspeicher.ts`
- `lib/trips/create-entry.ts`
- `components/trips/PlanenCreateGate.tsx`
- `components/trips/TripPlanner.tsx`
- `components/trips/Reiseidee.tsx`

Tests:

- `lib/trips/gastspeicher.test.ts`
- `lib/trips/create-entry.test.ts`
- `lib/trips/guest-active-draft-preservation.test.ts`

Smallest required expansion (fixture only, no adoption runtime):

- `lib/trips/uebernahme.test.ts` — simulate explicit correction instead of create-over-invalid

Own docs / evidence:

- `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_{TASK,STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md`
- `docs/evidence/v1-guest-active-draft-preservation-1/**`

Not touched: types/trips, schema/mappers/readiness/credentials, `uebernahme.ts`, `GastreiseBruecke.tsx`, account graph (#531), Auth, SQL, package/lockfile, global continuity files.
