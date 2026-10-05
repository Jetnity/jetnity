# Provider Activation Readiness Precheck – Recommendation

Stand: 1. September 2026  
Status: **RANKED FUTURE PROVIDER PATH / NOT IMMEDIATE IMPLEMENTATION / NOT AN ACTIVATION**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Review-fix for TL #5072115941

This is a ranked recommendation for the **first real Commercial Truth provider path** *after* Provider Readiness S4/S6/S7/S8 (or an explicit new Product-Owner sequencing decision).  
It is **not** permission to start that path now.  
It is **not** a Production activation, **not** a public live claim, and **not** a Duffel architecture lock-in.

---

## 1. Verdict

### Immediate next implementation (Binding Build Order)

**Provider Readiness S6 – Persistent Cost Guard**, as a new later versioned task. Residual S4 items remain open and must not be forgotten. See the Next Slice doc.

This precheck does **not** start S6.

### First *real* Commercial Truth path (later, after S4/S6/S7/S8)

**Preferred:** **Flights**, using a **live/real-price** vendor (Duffel *live* or Skyscanner Live Prices — partner/ToS/DPA still open).  
**Not preferred as real truth:** Duffel **test mode** / Duffel Airways.

**Runner-up later hotel path:** Booking.com Demand API **if** Managed Affiliate access exists; otherwise Hotelbeds/HBX **live** (evaluation environment is not automatically `live_api` truth).

**Third, conditional:** Skyscanner Live Prices if persist can be ephemeral/`no-store` under written licence.

**Not first Commercial Truth path:** Activities (including Viator Basic), Mobility/12Go, Rental, Requirements, Amadeus Self-Service, Duffel sandbox mint.

### Optional sandbox harness (not Commercial Truth)

Duffel official test mode remains a useful **integration-pipeline** candidate (transport / Nachweis mechanics / expiry handling).  
It must **not** mint S5-A `live_api`.  
It is **not** the immediate next slice unless Product Owner explicitly approves `PO-SEQ-01`. This audit does not infer that exception.

---

## 2. Why Flights first for *real* Commercial Truth (domain)

The first *commercial* proof that may satisfy the real-snapshot gate should teach the TW-8-hard lesson with **real prices**: a quote is only true with provenance, freshness, and revalidation.

- Live flight offers have short, explicit expiry and revalidation semantics (Duffel live GET offer; Skyscanner session).
- A stale flight price is the most damaging fake-commercial-truth failure.
- Passenger *counts* suffice; no citizenship/document collection.
- Entry Requirements stay untouched.

Hotels remain the other core bookable stay. They are runner-up because Booking.com cannot even sandbox without a contract, and Hotelbeds needs a new adapter plus confirmation that eval/live inventory is real market truth.

Activities (Viator included) are useful later, not the first Commercial Truth unlock.

---

## 3. Why Duffel *test mode* is not the real-truth vendor

Official Duffel Help Centre: sandbox/test-mode prices **are not real, live prices**.  
Official test-mode docs: Duffel Airways schedules and prices are **not realistic**.

S5-A `live_api` is provider truth eligible for `current`. Minting a sandbox quote as `live_api` would silently weaken S5-A. **Forbidden.**

Independent reasons Duffel *test* is still a good **harness** (not a truth source):

1. Official zero-spend sandbox (`duffel_test_*`).
2. Revalidation *mechanics* (GET offer, `expires_at`, typed errors) can be exercised without claiming market truth.
3. Amadeus Self-Service is gone (17 Jul 2026).
4. Existing adapter shrinks a **harness** slice — reuse, not selection of live truth.

ADR-0062 still applies: Duffel is the first **development** adapter, not the product architecture.

---

## 4. Why not “Duffel because code exists” for the live path

The later live-path ranking prefers **Flights as a domain**. The live vendor (Duffel live vs Skyscanner) remains **open** until partner, licence, and cost gates are answered. Existing Duffel code does not win that live choice.

---

## 5. Runner-up: Hotels

**Booking.com Demand API** remains the preferred *commercial* hotel partner **if** Managed Affiliate access is granted (hotel strategy). It cannot be the first proof now: no sandbox without contract.

**Hotelbeds/HBX** remains the technical backup. Evaluation keys and CheckRate are useful for a **later harness**, not automatic `live_api` truth. Evaluation ToS / whether eval rates are market-real remains VENDOR-CONFIRMATION-REQUIRED.

---

## 6. Viator (corrected; ranking not flipped)

**Previous error:** treating Viator Basic as having no real-time availability.

**Corrected official technical evidence** (`docs.viator.com` Partner API technical guide):

| Endpoint | Basic Access | Meaning |
| --- | --- | --- |
| `GET /availability/schedules/{product-code}` | **allowed** | Real-time **schedule** retrieval for a single selected product, including availability/pricing schedule data |
| `POST /availability/check` | **denied** | Booking-grade **verification** of availability and pricing immediately before book/hold |

Marketing “Get availability & pricing in real time: X” on the access-level page is **not** used as the technical disqualifier. The endpoint matrix wins.

**Re-rank result:** Viator Basic is **no longer disqualified** from producing a *schedule-level* real-time quote. It **remains disqualified** as the first *Commercial Truth / booking-grade* snapshot path, because `/availability/check` is the documented primary booking-workflow verifier and Basic cannot call it. Activities also remain lower trip-criticality than flights/hotels. **Preferred first real path stays Flights.**

---

## 7. Architectural advantages / disadvantages

### Later Flights / live vendor

**Advantages:** hardest freshness problem; existing `FlugProvider` / Nachweis contract; S5-A types ready.  
**Disadvantages:** live secrets, paid-call economics (Duffel excess search / Skyscanner partner), persist licence.

### Duffel test harness (not truth)

**Advantages:** zero-spend; existing adapter; mechanical expiry tests.  
**Disadvantages:** not real prices; path-dependence risk if people treat it as Commercial Truth — this doc forbids that.

### Hotels / HBX eval

**Advantages:** official eval keys; CheckRate seam.  
**Disadvantages:** new adapter; eval ≠ proven `live_api`; wholesale ranking temptation.

---

## 8. Commercial / security / privacy

| Concern | Handling |
| --- | --- |
| Sandbox as `live_api` | Forbidden |
| Client-trusted price | Forbidden |
| Process memory as Nachweis store | Forbidden |
| Binding order skip | Forbidden without `PO-SEQ-01` |
| Production write | Keep allocated **false** |
| PII | Counts + IATA + dates + cabin + currency only |
| DPA | Before live/personal data |

---

## 9. Unknowns before *live* activation

1. Duffel live vs Skyscanner as production flight partner  
2. Persist licence for timestamped stale snapshots  
3. Booking.com Managed Affiliate acceptance  
4. Hotelbeds eval vs live rate realism  
5. Preview token presence (secrets not read)  
6. DPA/subprocessors for the chosen live vendor  

---

## 10. What would change the ranking

- Written Skyscanner persist exception + keys → F-SKY contests first *live* flight path (still after S4–S8).  
- Booking.com access → preferred later hotel path (still not TW-8).  
- Explicit `PO-SEQ-01` → a HARNESS-S may precede remaining readiness slices; it still cannot mint `live_api`.  
- New S5-A sandbox sourceKind ADR → only then could test data be typed without pretending it is `live_api`.

---

## 11. Distinctiveness

**Useful:** one honest *real* quote path after Jetnity-side readiness.  
**Merely bigger (rejected):** sandbox mint as “we have Commercial Truth”; 12Go first; Viator widgets before flights; TW-8 chrome.

---

## 12. Explicit non-decisions

- Not selecting Duffel as the only future flight provider.  
- Not treating test mode as live truth.  
- Not inferring `PO-SEQ-01`.  
- Not starting S6, HARNESS-S, C1, or TW-8 in this task.
