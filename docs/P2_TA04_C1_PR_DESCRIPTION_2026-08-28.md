## Status

**REVIEW-FIX / DRAFT / C1 IMPLEMENTATION + VERSION RECONCILE**

Tracks Issue #122.

Cursor-Agent: `Account plattform audit vorbereitung 7`

This PR stays Draft. It is **not** Ready and must **not** be merged by the author. Independent Technical-Lead re-review is the next step after this same-slice rename/docs reconciliation.

Production C1 is already **APPLIED and live-verified** by Technical Lead under the existing Product-Owner C1 approval. Canonical Production/repo migration version is `20260828015304`. This review-fix does **not** re-apply Production or mutate Supabase `develop`.

## What C1 implements

- Canonical SECURITY INVOKER delete RPC `party_loeschen(jsonb)`
- `travellerEntfernen` no longer uses `.from('trip_travellers').delete()`
- Database-enforced max 20 travellers per `(user_id, trip_id)`, including direct DML, incremental `party_schreiben`, and reparenting
- Cap serialization via `FOR NO KEY UPDATE` on the target trip, not a naked `count(*)`
- Child limits 8 citizenships / 12 documents now also on UPDATE/reparenting
- App-side incremental `partyUebernehmen` cap check plus DB backstop

## Migration version truth

- Canonical Production/repo file: `supabase/migrations/20260828015304_traveller_write_contract_integrity.sql`
- SQL body is functionally identical to the already reviewed/applied C1 SQL
- Historical/develop-only author evidence: the same C1 SQL was applied earlier on Supabase `develop` as `20260828120000`. That develop history is not silently rewritten.

## Strict non-scope

- No C2
- No authenticated table-DML `REVOKE`
- No RLS or ownership change
- No `SECURITY DEFINER`
- No Auth/MFA/AAL
- No AP-5/AP-6a/AP-7
- No passport number / scan / MRZ / biometric persistence
- No Provider / TW-8 / Search / Homepage / Native
- No Production re-apply in this review-fix
- No develop rebase/reset/re-apply
- No Production test data

## Tests

Writable DB tests ran only against the rebased Supabase `develop` branch.

- Focused unit: 15/15
- `npm test`: 2387/2387
- Typecheck / Lint / Build / hygiene: pass
- `db:parallelitaet`: 11/11
- C1 `db:sicherheit` cases: 13/13
- Overall `db:sicherheit`: 217/248 because of pre-existing Admin-AAL2 JWT fixture gaps; no C1 case failed
- Historical/develop-only apply: `20260828120000` on `develop`
- Production live: `20260828015304` applied and verified by Technical Lead
- Pre-stamp exact head `f46fae17`: Actions `33133248112` SUCCESS, Vercel `D6onnex5Amwn9x1JLp9PPi7L3hXZ` SUCCESS

## Stop

Independent Technical-Lead re-review. Not Ready. Do not merge. No C2. No AP-5. Do not mutate Supabase again in this fix.
