## Status

**AUTHOR COMPLETE / DRAFT / C1 IMPLEMENTATION ONLY**

Tracks Issue #122.

Cursor-Agent: `Account plattform audit vorbereitung 7`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead review is the next step. Production apply is a later Product-Owner gate after that review.

## What C1 implements

- Canonical SECURITY INVOKER delete RPC `party_loeschen(jsonb)`
- `travellerEntfernen` no longer uses `.from('trip_travellers').delete()`
- Database-enforced max 20 travellers per `(user_id, trip_id)`, including direct DML, incremental `party_schreiben`, and reparenting
- Cap serialization via `FOR NO KEY UPDATE` on the target trip, not a naked `count(*)`
- Child limits 8 citizenships / 12 documents now also on UPDATE/reparenting
- App-side incremental `partyUebernehmen` cap check plus DB backstop

## Strict non-scope

- No C2
- No authenticated table-DML `REVOKE`
- No RLS or ownership change
- No `SECURITY DEFINER`
- No Auth/MFA/AAL
- No AP-5/AP-6a/AP-7
- No passport number / scan / MRZ / biometric persistence
- No Provider / TW-8 / Search / Homepage / Native
- No Production apply by the author
- No Production test data

## Tests

Writable DB tests ran only against the rebased Supabase `develop` branch.

- Focused unit: 15/15
- `npm test`: 2387/2387
- Typecheck / Lint / Build / hygiene: pass
- `db:parallelitaet`: 11/11
- C1 `db:sicherheit` cases: 13/13
- Overall `db:sicherheit`: 217/248 because of pre-existing Admin-AAL2 JWT fixture gaps; no C1 case failed
- `20260828120000` applied on `develop` only
- Pre-stamp exact head `f46fae17`: Actions `33133248112` SUCCESS, Vercel `D6onnex5Amwn9x1JLp9PPi7L3hXZ` SUCCESS

## Stop

Independent Technical-Lead review. Not Ready. Do not merge. No C2. No Production apply by the author.
