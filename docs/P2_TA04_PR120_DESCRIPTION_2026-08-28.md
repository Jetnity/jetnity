## Status

**AUTHOR COMPLETE / DRAFT / AUDIT + SECURITY ARCHITECTURE ONLY**

Tracks Issue #119.

Cursor-Agent: `Account plattform audit vorbereitung 6`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead review is the next step.

## What this Gate 0 established

Live Production (`qscbgcdmivbbnzrcyegn`) independently re-read on 2026-08-28:

- `authenticated` has `SELECT`, `INSERT`, `UPDATE`, `DELETE` on `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`
- `anon` / `public` have no table grants
- owner-RLS is `user_id = auth.uid()`
- composite FKs bind children to the same `(traveller_id, trip_id, user_id)` graph
- child limits fire **after INSERT only**
- there is **no** DB cap of 20 travellers
- `party_schreiben(jsonb)` is **SECURITY INVOKER** and itself inserts/updates/deletes those tables

Caller inventory (search-locked by `lib/readiness/p2-ta04-write-path-inventory.test.ts`):

- **current runtime delete:** `travellerEntfernen` → `.from('trip_travellers').delete()`
- **current runtime write:** `travellerSetzen` / `partyUebernehmen` → `rpc('party_schreiben')`
- **no app/lib/component writer** for the two child tables
- Guest→Account uses `partyUebernehmen`, not table DML
- no Service-Role product path on these tables

Therefore:

- no proven cross-user **P0**
- P2-TA-04 remains a **P2 write-contract / integrity** finding
- direct DML is required today by the INVOKER RPC **and** by the current delete path
- it is **not** a supported product contract for child writes (ADR-0119)
- a blind `REVOKE` would break `party_schreiben` and `travellerEntfernen`

## Recommendation (not implemented)

**Option C – staged fail-closed.**

1. **C1** later: canonical delete RPC + DB party-cap-20 + child-limit on UPDATE. No REVOKE, no DEFINER.
2. **C2** later, separate Product-Owner gate: DEFINER write RPCs + `REVOKE` table DML, keep `SELECT`.

Gate 0 itself needs no activation approval. Any later GRANT/REVOKE, RLS, SECURITY DEFINER/INVOKER, schema or Production apply needs explicit Product-Owner approval **before** execution.

## Strict non-scope (kept)

No runtime, migration, schema, GRANT/REVOKE, RLS, SECURITY DEFINER/INVOKER, Production data, Supabase branch, Auth/MFA/AAL, AP-5/AP-6a/AP-7, provider/TW-8/search/homepage/public/native change.

## Reviewer starting points

- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_STATUS_2026-08-28.md`
- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_HANDOFF_2026-08-28.md`
- ADR-0180 in `DECISIONS.md`
- `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_LIVE_EVIDENCE_2026-08-28.md`
