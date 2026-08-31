# Provider Activation Readiness Precheck – Reuse Map

Stand: 1. September 2026  
Status: **AUDIT REUSE MAP / NO NEW ABSTRACTIONS PROPOSED AS RUNTIME**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Checkout: provider code identical to `main@ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b`

Legend: **LIVE** = exists on main · **STUB** = contract exists, runtime returns null/fail-closed · **MISSING** · **HISTORICAL DOC ONLY**

Reuse before add. A later proof slice must extend these seams, not invent a second provider stack.

---

## 1. Domain ports and factories

| Domain | Interface | Factory | Runtime | Kill-switch |
| --- | --- | --- | --- | --- |
| Flights | `lib/flights/provider.ts` `FlugProvider` | `duffelProviderAus()` `lib/flights/duffel/factory.ts` | **LIVE** adapter if non-prod + `JETNITY_FLIGHT_AKTIV` + `duffel_test_*` | `lib/flights/zustand.ts` + `providerOpsZustand()` |
| Hotels | `lib/hotels/provider.ts` | `hotelProviderAus()` | **STUB** always `null` | `JETNITY_HOTEL_AKTIV` |
| Activities | `lib/activities/provider.ts` | `activityProviderAus()` | **STUB** `null` | `JETNITY_ACTIVITY_AKTIV` |
| Mobility | `lib/mobility/provider.ts` | `mobilityProviderAus()` | **STUB** `null` | `JETNITY_MOBILITY_AKTIV` |
| Rental | `lib/rental-cars/provider.ts` | `rentalCarProviderAus()` | **STUB** `null` | `JETNITY_RENTAL_CAR_AKTIV` |
| Requirements | `lib/readiness/provider.ts` | `requirementsProviderAus()` | **STUB** `null` | `JETNITY_READINESS_AKTIV` |
| Safety | `lib/safety/provider.ts` | `safetyProviderAus()` | **STUB** `null` | no domain flag; no provider |
| Seasonal | `lib/seasonal/provider.ts` | `seasonalProviderAus()` | **STUB** `null` | no domain flag; no provider |

Shared production hard-off:

```21:35:lib/provider-ops/zustand.ts
export function providerOpsZustand(eingabe: {
  vercelEnv?: string
  flag?: string
  zugangVorhanden: boolean
}): ProviderOpsZustand {
  if (providerOpsIstProduction(eingabe.vercelEnv)) {
    return { aktiv: false, grund: 'production' }
  }
  // ...
}
```

Do not replace these factories. A first proof must remain behind `providerOpsZustand`.

---

## 2. Concrete adapters

| Adapter | Path | Transport | Commercial-promotable? |
| --- | --- | --- | --- |
| Duffel flights | `lib/flights/duffel/adapter.ts` `http.ts` `mapping.ts` | Real HTTP POST Offer Requests; Bearer; `duffel-version` | Yes **only** in non-prod with test token. Production rejected. Live tokens rejected by `istDuffelTestToken()` |
| Skyscanner flights | `lib/providers/skyscanner/flights/*` | Fixtures only | **No** — `evidenceMode: 'fixture'`; no `sourceKind`/`persistenz` |
| Shared outbound core | `lib/server/providers/core/*` | Injectable executor (timeout, body cap, retry) | No vendor bound. Duffel does **not** use it yet (ADR-0199 later migration) |
| HBX / Booking.com / Viator / GYG / 12Go | — | — | **MISSING** runtime |

Historical-only contracts (do not treat as accepted architecture):

- `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md` — proposed
- `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md` / `docs/ADR_0200_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md` — **not accepted**
- Viator contract audit docs — audit only

---

## 3. Nachweis / server evidence

| Contract | Path | `*AusUmgebung()` | Adopt path |
| --- | --- | --- | --- |
| `FlugNachweis` | `lib/flights/nachweis.ts` | **STUB** `null` — comment: no search-context store | `flugKontoUebernahmePruefen()` fail-closed without nachweis+suche |
| `HotelNachweis` | `lib/hotels/nachweis.ts` | **STUB** `null` | same pattern |
| `ActivityNachweis` | `lib/activities/nachweis.ts` | **STUB** `null` | same pattern |
| `MobilityNachweis` | `lib/mobility/nachweis.ts` | **STUB** `null` | account path is manual intake, not provider adopt |
| `RentalCarNachweis` | `lib/rental-cars/nachweis.ts` | **STUB** `null` | manual intake |

Test-only `*NachweisAusKatalog()` doubles exist. Guest flight persist strips trade fields (`lib/flights/nutzlast.ts`).

**Missing seam for any first snapshot:** a server-side search-context / offer-session store that `FlugNachweis` (or hotel equivalent) can confirm against. Browser `optionId` alone is not Commercial Truth.

---

## 4. Commercial Provenance S5-A / S5-B

| Piece | Path | Reuse rule |
| --- | --- | --- |
| Domain / prüfen / freshness / currency / trust | `lib/commercial-provenance/*` | Mint only via these types. No parallel quote model |
| Mint | `commercialSnapshotFuerPersistenzMinten` in `persistenz.ts` | In-memory mint is allowed without write allocation |
| SQL writer | `jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)` | Do **not** call until write path allocated |
| Gate | `jetnity_internal.commercial_write_runtime_gate.production_write_path_allocated` | live **false** |
| App writer | — | **MISSING** |
| Workspace read join | `lib/trips/abbildung.ts` | **MISSING** — still legacy `price_amount` |

`FlugOption` deliberately excludes `retrievedAt` / freshness (`lib/flights/domain.ts`). Provenance lives in S5-A, not in the flight domain object. Client search responses strip `retrievedAt` (`lib/flights/suche.ts`).

Do not confuse with `lib/flight-event-provenance/*` (E5-B3 event instants). That is not a commercial quote.

---

## 5. Cost guard / ops / observability / license

| Hook | Path | Ready for first proof? |
| --- | --- | --- |
| Cost-guard interface | `lib/provider-ops/cost-guard.ts` | Yes — extend, do not replace |
| In-memory impl | `providerOpsInMemoryCostGuard()` | Sufficient for Preview test-mode only. S6 still missing |
| Flight limits | `lib/flights/rate-limit.ts` | 8/10min, 24/day in-memory |
| Outcomes / HTTP | `lib/provider-ops/outcome.ts` `anfrage.ts` | Reuse |
| Kill-switch | `providerOpsZustand` | Must stay Production-off |
| Observability | `providerOpsEvent()` | Contract LIVE; **not emitted** from search (S7) |
| Cache | domain `no-store` headers | Default deny. No S8 license module |

For a zero-spend test-mode proof, S6/S7/S8 are **not** automatic blockers, but the slice must keep `no-store`, emit at least a secret-safe event, and fail closed on cost-guard errors.

---

## 6. Trip Workspace commercial seams

| Seam | Current | First-proof rule |
| --- | --- | --- |
| Search UI | ephemeral client options, no persist as current price | Keep ephemeral |
| Account adopt | fail-closed (`flugNachweisAusUmgebung` null) | Do not open user-facing adopt as “bookable live” |
| Guest persist | strips flight trade fields | Keep |
| Workspace cards | `TripWorkspacePlan.tsx` / `FlugKarte.tsx` / `abbildung.ts` | Do **not** join provenance or claim current quote |
| TW-8 / TW-9 | blocked | Out of scope |

---

## 7. Entry Requirements / server-only

| Boundary | State |
| --- | --- |
| Requirements API | `app/api/readiness/requirements/route.ts` — fail-closed |
| Flight search API | `app/api/flights/search/route.ts` — only live commercial search route |
| Adopt API routes | **MISSING** — server actions only |
| `import 'server-only'` | factories, Duffel, adapter core, provenance mint |
| Client trust | IDs only for adopt; no secrets; no client `retrievedAt` |

---

## 8. Dead / duplicate / do-not-rebuild

| Item | Action |
| --- | --- |
| Second universal provider framework | **do not build** — Adapter Core already exists |
| New Nachweis style | **do not invent** — use `FlugNachweis` / `HotelNachweis` |
| Wire Skyscanner fixtures into S5-A | **forbidden** by foundation task |
| Migrate Duffel onto Adapter Core in the first proof | **not required**; later gated slice |
| `lib/rental/` or `lib/requirements/` | do not create; use `rental-cars` / `readiness` |
| Treat 12Go/HBX/Viator docs as accepted ADRs | **no** |

---

## 9. Smallest reuse path for a later proof

If a later authorised slice proves one server-side snapshot:

1. Keep `duffelAdapter` + `flugZustand` (or a hotel factory still `null` until a real hotel adapter exists).
2. Add a **server-only** search-session/offer store (missing seam).
3. Implement `flugNachweisAusUmgebung()` against that store (+ optional GET-offer revalidation).
4. Mint S5-A via existing `commercialSnapshotFuerPersistenzMinten`.
5. Do **not** call the SQL writer, allocate the write path, or join Workspace.

That is reuse. A Hotelbeds-first path would additionally require a new adapter/mapping — larger, not smaller.
