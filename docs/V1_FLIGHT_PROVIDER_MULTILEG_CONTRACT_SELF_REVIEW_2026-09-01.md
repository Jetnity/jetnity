# V1 Flight Provider Multi-Leg Contract – Self-Review

Stand: 1. September 2026  
Status: **CURSOR SELF-REVIEW / GENERATION 1 / NOT AN INDEPENDENT TECHNICAL-LEAD REVIEW**  
Role: Cursor implementation agent under ChatGPT Technical Lead  
Issue: #402  
Draft-PR: #403  
Binding: `docs/V1_FLIGHT_PROVIDER_MULTILEG_CONTRACT_RECONCILIATION_TASK_2026-09-01.md`

This is not a Technical-Lead PASS and does not authorize Ready or merge.

## Call-site evidence before coding

| Surface | Finding |
| --- | --- |
| `lib/flights/domain.ts` `FlugSuchanfrage.legs[]` | Canonical product search, ordered, 1–6 |
| `lib/flights/schema.ts` `flugSuchanfrageSchema` | Owns IATA/date/passenger/cabin/currency/1–6 validation |
| `lib/flights/provider.ts` `FlugProvider.suchen` | Already accepts canonical `FlugSuchanfrage` |
| `lib/flights/duffel/adapter.ts` | Already maps every ordered leg into Duffel slices |
| `lib/providers/flights/domain.ts` `FlightProviderSearchRequest` | **Zero runtime callers** before this slice; previously origin/destination/`returnDate` |
| `lib/providers/skyscanner/flights/adapter.ts` | Consumes only fixture **response** types |

Decision: reconcile the unused request type and add one mapping function. Do not add a third `FlightProvider`, registry, fan-out or Duffel rewrite.

## What was implemented

1. `FlightProviderSearchRequest` is now ordered `legs[]` (`originIata`, `destinationIata`, `date`).
2. Removed `returnDate` and top-level origin/destination/departureDate.
3. Passenger/cabin/currency are projections of canonical truth (`cabin` uses `FlugKabine`).
4. `flightProviderSearchRequestAus()` maps a validated `FlugSuchanfrage` plus external `{ market, locale }`.
5. Ranking-`context` and `stopPreference` are not copied.
6. No second 1–6 validator. Seven legs remain rejected by `flugSuchanfrageSchema`.
7. Skyscanner fixture normalizer and Duffel runtime are untouched.

## Invariants checked in review

- 1 leg = one-way; 2 legs stay two explicit legs for both return-like and multi-city.
- 3–6 legs keep caller order; disconnected legs are not rewritten.
- Canonical max 6 is representable through `flugSuchanfrageLesen`.
- Request JSON keys cannot include `context`, `returnDate` or `stopPreference`.
- `market`/`locale` are injected, never derived from trip ranking dates.
- Skyscanner `evidenceMode` remains `'fixture'`; no trusted/live constructor added.

## Non-scope proof

Unchanged by this slice:

- no KAYAK/Wego/Skyscanner/Duffel provider selection, application, terms or contact;
- no API key, secret, network, sandbox, paid or live call;
- no Duffel adapter/runtime edit;
- no Skyscanner response-normalization edit;
- no Production S6, Commercial Provenance writer/persistence, Supabase/DB/Auth;
- no TW-8/TW-9, Destination Essentials / #394;
- no public launch, indexing, payment or native-app change.

## Local gates recorded on `3d544fa6`

| Gate | Outcome |
| --- | --- |
| Focused contract tests | **10/10 pass** |
| `lib/flights/**` + Skyscanner adapter tests | **137/137 pass** |
| `npm test` | **3122/3122 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors** (137 pre-existing warnings) |
| `npm run build` | **pass** |

Changed-file review vs `347c129b`: only the provider-neutral request/mapper/tests plus continuity docs. Duffel, Skyscanner, Supabase and API routes untouched.

## Residual / next

Independent Technical-Lead Exact-Head review. Cursor stops after this exact-head handoff. No follow-up slice.
