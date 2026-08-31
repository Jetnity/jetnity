# ChatGPT / Technical Lead – Entry Requirements E5-B3A Review

Stand: 31. August 2026  
Status: **TECHNICAL-LEAD PASS ON REVIEWED AGENT HEAD / REPOSITORY-ONLY / NO PRODUCTION APPLY / FINAL INTEGRATION GATES REQUIRED**

## 1. Slice

Issue: **#338 – Entry Requirements E5-B3A – server-owned flight event provenance persistence foundation**  
Draft PR: **#340**  
Branch: `feat/entry-requirements-flight-event-provenance-e5b3a-2026-08-31`  
Agent: **`Jetnity entry requirements event provenance persistence 1`**, Generation 1  
Session: `bc-e7a50347-1c66-4cd1-bbd2-979b89590a40`

Baseline main: `3df9af4d6c3da750d50777706bce03589007a58a`.

## 2. Review history

Initial agent head:
`79dda7593bb9fbb20c36dc54348920e994da6823`

Technical Lead found one material P2: `provider_belegt=true` could be persisted while `external_ref` was nullable. That did not satisfy the required concrete provider-source provenance.

Same agent/session received `CHANGES REQUIRED`.

Runtime/security fix commit:
`f918dc0ed58b4962389a860d5a1b6bf74513cd1b`

Final agent + delivery-doc head reviewed independently:
`d37b600f67537f4ccb816182009b6018a39f82a3`

Verdict on that exact head:
**PASS / no open P0-P1-P2 findings.**

## 3. Corrected invariant

E5-B3A now requires a concrete provider-source reference:

- `external_ref` is `NOT NULL`;
- trimmed value must be nonblank and at most 200 characters;
- `provider_belegt=true` is structurally coupled to this reference;
- the writer rejects missing/blank `external_ref` before any snapshot deletion;
- `occurrence_event_ref` remains a Jetnity-internal occurrence identity and is not treated as provider evidence.

## 4. Security / truth review

Independently reviewed and accepted:

- dedicated `public.trip_item_flight_event_provenance` relation beside owner-writable `trip_items`;
- no use of `trip_items.metadata` as trusted provenance;
- no Commercial-Provenance field overloading;
- exact Item × Leg × Segment × `departure|arrival` identity;
- local wall clock, provider-observed timezone and absolute instant remain separate facts;
- no SQL timezone/DST resolver and no appending `Z` to local wall-clock values;
- authenticated owner gets SELECT only; no direct authenticated/anon write;
- private `jetnity_internal` SECURITY-DEFINER writer with `search_path=''`;
- dedicated NOLOGIN roles; no execute grant to anon/authenticated/service_role;
- runtime gate defaults closed/unallocated;
- complete validation before atomic current-snapshot DELETE+INSERT;
- client `eventRef`, `trusted` and `providerProven` claims cannot establish provenance;
- `flugNachweisAusUmgebung()` remains `null`;
- `requirementsProviderAus()` remains `null`;
- no Flight/Route/Readiness/API/Workspace runtime integration;
- generated Supabase types do not pretend the unapplied relation is live.

Binding rule remains:

> **Persisted does not mean provider-proven.**

## 5. Exact-head gates on reviewed agent head

For `d37b600f67537f4ccb816182009b6018a39f82a3`:

- GitHub CI #1522 / Run `33427796712`: **SUCCESS**;
- Auth configuration: **SUCCESS**;
- Typecheck/Lint/Tests/Hygiene/Production Build: **SUCCESS**;
- Vercel Preview: **READY / SUCCESS**;
- GitHub review threads: **0**;
- Vercel unresolved feedback: **0**;
- branch: **0 behind**, merge-base exact `main@3df9af4d...`;
- PR remained Draft / open / unmerged / mergeable.

## 6. Production-live verification

Supabase Production project `qscbgcdmivbbnzrcyegn` was checked read-only after the final agent delivery.

Confirmed absent on Production:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

Therefore this remains a **repository-only persistence foundation**. No Production migration, RLS/grant/role/function change, runtime principal, writer activation or backfill occurred.

## 7. P3 / later mandatory gates

Not merge blockers for this repository-only slice, but mandatory before later Production/runtime activation:

1. The migration has not yet been executed against a disposable PostgreSQL/Supabase test environment. Live apply semantics must be verified before any Production apply.
2. SQL intentionally validates timezone only syntactically and does not re-resolve local wall clock ↔ instant. A future trusted mint must reuse E5-B1R timezone validation and E5-B2A fail-closed instant resolution.
3. Production apply, Production RLS/roles/functions, runtime-principal allocation, real application writes and any backfill remain explicit Product-Owner gates.

## 8. Integration rule

This PASS was bound to `d37b600f67537f4ccb816182009b6018a39f82a3`.

The Technical Lead may add only TL-owned review/continuity documentation after that head. Any such new head must receive fresh exact-head CI/Vercel/thread/drift gates before Ready/Merge.

No Production apply. No E5-B3B or other follow-up automatically.
