# V1 Flight Provider Multi-Leg Contract – Self-Review

Stand: 1. September 2026  
Status: **CURSOR SELF-REVIEW / GENERATION 1 / CR-1 FIX / NOT AN INDEPENDENT TECHNICAL-LEAD REVIEW**  
Role: Cursor implementation agent under ChatGPT Technical Lead  
Logical agent: **`Jetnity V1 flight provider multileg contract 1`**  
Generation: **1**  
Session: `bc-b592d931-3ecb-4cec-b250-ab19a19930b1`  
Issue: #402  
Draft-PR: #403  
Rejected head: `3d544fa653c0f31f3447f1f24208492732f0286a`  
Binding review: **CHANGES REQUIRED `5078055105`**  
Binding: `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`

This is not a Technical-Lead PASS and does not authorize Ready or merge.

## Call-site evidence

| Surface | Finding |
| --- | --- |
| `lib/flights/domain.ts` `FlugSuchanfrage.legs[]` | Canonical product search, ordered, 1–6 |
| `lib/flights/domain.ts` `stopPreference` | Canonical `FlugStoppPraeferenz`: `any` / `nonstop` / `at_most_one` |
| `lib/flights/duffel/adapter.ts` | Maps `nonstop` → `max_connections=0`, `at_most_one` → `max_connections=1` — **provider-search constraint** |
| `lib/flights/provider.ts` `FlugProvider.suchen` | Already accepts canonical `FlugSuchanfrage` including `stopPreference` |
| Ranking `context` | Explicitly does not change the provider result set |

CR-1 correction: the first implementation dropped `stopPreference` as “product filtering”. That is wrong against accepted Duffel runtime truth and would silently broaden a nonstop / at-most-one search on any future adapter using this seam.

## What was implemented / corrected

1. `FlightProviderSearchRequest` remains ordered `legs[]` (`originIata`, `destinationIata`, `date`).
2. No `returnDate` and no top-level origin/destination/departureDate.
3. Passenger/cabin/currency stay projections of canonical truth.
4. `stopPreference` is now a required canonical `FlugStoppPraeferenz` on the shared request.
5. `flightProviderSearchRequestAus()` copies `stopPreference` losslessly and still drops ranking-`context`.
6. No Duffel `max_connections` translation on this seam.
7. No second 1–6 validator. Seven legs remain rejected by `flugSuchanfrageSchema`.
8. Skyscanner fixture normalizer and Duffel runtime remain untouched.

## Invariants checked in review

- 1 / 2 / 3–6 ordered legs unchanged from the accepted multi-leg work.
- Canonical max 6 through `flugSuchanfrageLesen`; 7 legs rejected by the product schema.
- `stopPreference` preserved for `any`, `nonstop` and `at_most_one`.
- Request keys include `stopPreference` and exclude `context` / `returnDate` / `max_connections`.
- `market`/`locale` are injected, never derived from trip ranking dates.
- Skyscanner `evidenceMode` remains `'fixture'`; no trusted/live constructor added.

## Non-scope proof

Unchanged by this CR-1 fix:

- no KAYAK/Wego/Skyscanner/Duffel provider selection, application, terms or contact;
- no API key, secret, network, sandbox, paid or live call;
- no Duffel adapter/runtime edit;
- no Skyscanner response-normalization edit;
- no Production S6, Commercial Provenance writer/persistence, Supabase/DB/Auth;
- no TW-8/TW-9, Destination Essentials / #394;
- no public launch, indexing, payment or native-app change.

Gates on rejected head `3d544fa6` are invalid. Fresh local gates on review-fix `8c26ea87`: contract 11/11, flights+Skyscanner 137/137, `npm test` 3123/3123, typecheck pass, lint 0 errors, production build pass. Exact-head handoff: `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_CR1_HANDOFF_2026-09-01.md`.

## Residual / next

Independent Technical-Lead Exact-Head re-review of the new head. Cursor stops after corrected implementation, fresh gates and exact-head handoff. No follow-up slice.
