# Provider Activation Readiness Precheck – Recommendation

Stand: 1. September 2026  
Status: **RANKED RECOMMENDATION / NOT AN ACTIVATION / NOT A PROVIDER LOCK-IN**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**

This is a recommendation for the **first real provider *path***: domain + proof vendor + bounds.  
It is **not** a Production activation, **not** a public live claim, and **not** a decision that Duffel is Jetnity’s product architecture.

---

## 1. Verdict

**Preferred first path:** **Flights**, using **Duffel official test mode** as the first *proof vendor*.

**Purpose of that path:** prove one server-side provider-backed commercial quote snapshot (search → server evidence → S5-A mint) without opening TW-8 and without Production writes.

**Runner-up:** **Hotels**, using **Hotelbeds/HBX evaluation environment** (`api.test.hotelbeds.com`).

**Third, conditional:** **Flights / Skyscanner Live Prices**, ephemeral/`no-store` only, after partner access and a written persist/cache exception or an explicit “never persist” design.

**First path is not:** Activities, Mobility/12Go, Rental, Requirements/Safety/Seasonal, Amadeus Self-Service, Booking.com Demand API *right now*, or Duffel **live**.

---

## 2. Why Flights first (domain)

Jetnity’s north star is a connected trip, not an isolated search engine. The first *commercial* proof should teach the TW-8-hard lesson: a price is only true with provenance, freshness, and revalidation.

Flights do that better than any other domain we can reach without a new contract:

- Offer identity + short `expires_at` + explicit `price_changed` / `offer_expired` semantics are publicly documented (Duffel).
- A stale flight price is the most damaging fake-commercial-truth failure mode.
- Passenger *counts* already exist; no citizenship/document collection is required.
- Entry Requirements stay untouched (E5-B3C is event mint, not a quote).

Hotels are equally important for a complete trip. They lose the “first” slot only because Booking.com cannot be sandboxed without a Managed Affiliate contract, and a Hotelbeds-first slice must also build a new adapter — a larger proof.

Activities/mobility do not unlock Commercial Truth or TW-8 as honestly, and 12Go fails Switzerland-first.

---

## 3. Why Duffel test mode as proof vendor (independent of existing code)

Selection reasons that do **not** depend on “we already have an adapter”:

1. **Official zero-spend sandbox** — test tokens `duffel_test_*`; “no danger of spending any money or booking flights you don’t want” (duffel.com test-mode docs).
2. **Revalidation contract** — GET single offer; `expires_at` typically 15–30 minutes; typed expiry/price-change errors.
3. **Access reality in 2026** — Amadeus Self-Service was decommissioned 17 July 2026. A self-serve flight sandbox is no longer the default GDS path.
4. **Skyscanner persist conflict** — public partner policy forbids caching/redistributing data. That fights S5-B “store a snapshot” unless legal carves ephemeral-only.
5. **Booking.com gated** — Demand API sandbox requires Managed Affiliate + contract *before* any key.
6. **Viator Basic** cannot produce real-time availability.
7. **12Go** has no public API and is not Switzerland-first.

Honesty about test data: Duffel Airways (IATA `ZZ`) is **not** realistic Swiss schedule/price evidence. F1 proves the **truth pipeline**, not CHF ZRH–LHR market quotes.

### Why existing Duffel code is allowed to matter — only as slice size

The adapter is a **reuse** input required by the task (“reuse before add”). It makes F1 smaller (Nachweis + session + mint) instead of “write a flight adapter from scratch”.  
If the adapter did not exist, the *vendor* recommendation could still be Duffel test mode; the *slice* would be larger.  
If a vendor with a better official sandbox and revalidation existed and Duffel did not, Duffel would not win on code archaeology.

ADR-0062 already says Duffel is the first **development** adapter, not the product architecture. This recommendation does not change that.

---

## 4. Runner-up: Hotelbeds/HBX evaluation

**Why strong:**

- Official self-register evaluation keys; 50 requests/day; test bookings do not charge or reserve (developer.hotelbeds.com getting-started).
- CheckRate when `rateType=RECHECK` — a real revalidation seam.
- Hotel strategy already names HBX as technical backup if Booking.com access is slow.
- Switzerland hotel inventory is a core trip need (INFERENCE).

**Why not first:**

- No Jetnity hotel adapter — F1 would become “design + implement HBX mapping + Nachweis + mint”.
- Wholesale/net rates: ranking must stay margin-neutral (vision / hotel strategy).
- Contract is proposed, not accepted.
- Content-API store-and-refresh expectations need vendor confirmation.
- Booking.com remains the preferred *later* commercial hotel partner **if** Managed Affiliate access is granted.

---

## 5. Third: Skyscanner Live Prices (conditional)

**Why still relevant:**

- Historical TL live-target; fixture foundation on main; affiliate/redirect fits Jetnity.
- Strong consumer CH/EU coverage (INFERENCE).

**Why not first:**

- No live transport; fixtures cannot mint `live_api`.
- Partner access not verified (developers access page denied in this session).
- Public no-cache policy is a persist disqualifier until counsel/vendor says otherwise.

A Skyscanner-first path would also be a *larger* slice (create/poll transport + secrets + legal).

---

## 6. Architectural advantages / disadvantages

### Preferred path (Flights / Duffel test)

**Advantages**

- Reuses `FlugProvider`, search route, kill-switch, test-token gate, S5-A types.
- Closes the real missing seam (`FlugNachweis` + search-session store) that already blocks honest adopt.
- Teaches stale/tamper/unavailable in the domain that needs it most.
- Leaves hotel/activity/mobility ports untouched.

**Disadvantages**

- Test inventory is synthetic (Duffel Airways).
- Live Duffel economics (per-order + excess search) are a later cost risk — not a test-mode cost.
- Path-dependence risk: people may treat “F1 used Duffel” as “Duffel is the live provider”. The docs must keep saying it is not.
- Duffel HTTP is not yet on Adapter Core (duplicate transport). F1 must not silently migrate that.

### Runner-up (Hotels / HBX eval)

**Advantages**

- Real hotel evaluation inventory (more realistic than Duffel Airways).
- Aligns with documented hotel backup strategy.
- Forces hotel adapter quality early.

**Disadvantages**

- Larger first slice; higher chance of inventing hotel mapping before a signed contract.
- Wholesale model can tempt margin-ranked UX.
- Does not reuse a working search adapter.

---

## 7. Commercial / security / privacy concerns

| Concern | Handling |
| --- | --- |
| Client-trusted price | Forbidden. Browser sends IDs only. |
| Persisted ≠ current | Any mint is `quoted at retrievedAt`, stale after vendor expiry; never “aktueller Preis”. |
| Production write | Keep `production_write_path_allocated=false`. F1 does not persist. |
| Secrets | Server-only; test prefix only; do not read existing secrets in audit. |
| PII | No name/passport/MRZ. Counts + IATA + dates + cabin + currency only. |
| DPA | Required before Production or any personal data. Not required to *specify* F1; required before live. |
| Excess search (live) | Later live economics. F1 is test-only. |
| Affiliate distortion | Ranking remains provider-neutral. |
| E5 confusion | Do not write flight-event provenance as a commercial quote. |

---

## 8. Unknowns that must be answered before *activation* (not before this audit ends)

1. Does a Duffel test token already exist in Preview? (secrets not read)
2. May Jetnity store a Duffel offer as a timestamped stale snapshot under Duffel ToS? (VENDOR-CONFIRMATION-REQUIRED) — F1 avoids this by not persisting.
3. Will Booking.com accept Jetnity as Managed Affiliate, and on what attribution/cache terms?
4. Will Skyscanner permit ephemeral server-side sessions vs any disk persist?
5. Hotelbeds evaluation ToS + Content API storage cadence + CH inventory quality in eval.
6. DPA/subprocessors/residency for whichever vendor later goes live.
7. Live Duffel vs Skyscanner vs Booking as the *production* commercial partner — **explicitly not decided here**.

---

## 9. What would change the ranking

- Written Skyscanner permission for timestamped internal snapshots **and** issued partner keys → F-SKY could contest first *live* path; still not a reason to skip a cheaper test-mode pipeline proof.
- Booking.com Managed Affiliate access granted → H-BDC becomes the preferred *hotel* path; still after or beside a flight pipeline proof, not a reason to open TW-8.
- Duffel test mode shown to be unusable (account denied, Airways insufficient for the mint contract) → switch F1 vendor to **H-HBX evaluation**, not to Duffel live.

---

## 10. Distinctiveness test

Does this make Jetnity more useful, or merely bigger?

**More useful:** the product can finally tell the truth about a commercial option — “quoted, when, by whom, still valid?” — which is the missing load-bearing piece under TW-8 and under user trust.

**Merely bigger (rejected):** adding 12Go, Viator widgets, or a second search UI before one honest snapshot exists.

---

## 11. Explicit non-decisions

- Not selecting Duffel as the only future flight provider.
- Not selecting Hotelbeds over Booking.com as the hotel *business* partner.
- Not opening TW-8/TW-9.
- Not allocating a writer.
- Not starting F1 in this task.
