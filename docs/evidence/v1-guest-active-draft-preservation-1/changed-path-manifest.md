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

Account files on this branch (`lib/trips/daten.ts`, `foundation-e-select.ts`, `account-graph-read.ts` and #531 docs) arrived only via the authorized merge of main `65db24b6`. They were not edited in this session.

GP-R4 adds no new runtime files. Occupancy/gate/create-entry gain `belegt_ohne_kennung` only.

Not touched by this writer: types/trips, schema/mappers/readiness/credentials, `uebernahme.ts`, `GastreiseBruecke.tsx`, `GastCreateLink.tsx`, #534 homepage, Auth, SQL, package/lockfile, global continuity files.
