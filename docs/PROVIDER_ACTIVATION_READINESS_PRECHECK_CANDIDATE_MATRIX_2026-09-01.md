# Provider Activation Readiness Precheck – Candidate Matrix

Stand: 1. September 2026  
Status: **AUDIT COMPARISON / NO PROVIDER SELECTED FOR ACTIVATION**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**

Existing Jetnity code is an architecture-fit input, not a winner condition.

Evidence classes: **VERIFIED** · **INFERENCE** · **UNKNOWN** · **VENDOR-CONFIRMATION-REQUIRED**

---

## 1. Candidates evaluated

Commercial domains only (TW-8 needs a quote/availability snapshot):

| ID | Domain | Vendor | Why included |
| --- | --- | --- | --- |
| F-DUF | Flights | Duffel | Official self-serve test mode; offer revalidation; existing Jetnity port |
| F-SKY | Flights | Skyscanner Live Prices | Named historical live-target; fixture foundation on main |
| F-AMA | Flights | Amadeus | Realistic GDS alternative |
| H-BDC | Hotels | Booking.com Demand API | Hotel strategy preferred commercial partner |
| H-HBX | Hotels | Hotelbeds / HBX APItude | Official evaluation environment; strategy backup |
| A-VIA | Activities | Viator Affiliate API | Historical first activities target; self-serve Basic Access |
| A-GYG | Activities | GetYourGuide Partner API | Historical later activities candidate |
| M-12G | Mobility | 12Go | Historical first mobility target |
| X-REQ | Requirements | (none) | Explicitly compared and **disqualified** as first *commercial* path |

Rental-car standalone vendors were not ranked as first path: no search UI, factory `null`, lower first-trip leverage.

---

## 2. Criterion scores

Score: **H** high / **M** medium / **L** low / **F** fail-for-first-path / **U** unknown.  
Unless marked otherwise, scores are for a later **real Commercial Truth** snapshot (real/live prices), **not** for a sandbox integration harness.  
Duffel **test mode** is scored separately where it would otherwise be confused with Duffel **live**.

### 2.1 Traveller value / product unlock

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | H | Flight is usually the first high-stakes commercial decision; freshness is the hardest honest claim | INFERENCE |
| F-SKY | H | Same domain value; affiliate compare UX | INFERENCE |
| F-AMA | H | Same domain; Enterprise-only access now | VERIFIED access change |
| H-BDC / H-HBX | H | Hotel is the other core bookable stay; longer-lived trip item | INFERENCE |
| A-VIA / A-GYG | M | Useful, not required to prove Commercial Truth pipeline | INFERENCE |
| M-12G | L | Asia land transport; weak for Switzerland-first first trip | VERIFIED coverage posture + INFERENCE |
| X-REQ | F | Official/regulatory truth, not a commercial quote | VERIFIED |

### 2.2 Fit with current Jetnity architecture / reusable code

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | H | `FlugProvider`, Duffel adapter, ranking, client strip, konto adopt fail-closed already exist. Reuse is a *size* advantage, not a selection reason | VERIFIED |
| F-SKY | M | Neutral flight types + fixture normaliser exist; no live transport; cannot mint S5-A | VERIFIED |
| F-AMA | L | No port wiring; Enterprise portal only since 17 Jul 2026 | VERIFIED |
| H-BDC | M | `HotelProvider` + `HotelNachweis` exist; no adapter | VERIFIED |
| H-HBX | M | Same hotel ports; proposed contract not accepted; no adapter | VERIFIED |
| A-VIA / A-GYG | M | `ActivityProvider` + Nachweis; no adapter | VERIFIED |
| M-12G | L | Mobility port exists; ADR-0200 not accepted; no adapter | VERIFIED |

### 2.3 Ability to produce one server-side verified quote/availability snapshot

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF **live** | H | Offer Request + GET `/air/offers/{id}` + `expires_at` on **real** prices after account activation | VERIFIED public API + Help Centre (test ≠ live) |
| F-DUF **test** | F for *Commercial Truth* / H for *harness* | Official: sandbox prices **are not real, live prices**; Airways not realistic. May prove mechanics only. **Must not mint `live_api`** | VERIFIED Help Centre + test-mode docs |
| F-SKY | M | Live Prices create/poll returns live partner prices; persist may be forbidden | VERIFIED API + no-cache article |
| F-AMA | F | Self-Service decommissioned 17 Jul 2026; Enterprise contract required | VERIFIED https://developers.amadeus.com/ |
| H-BDC | M | Demand API can quote if partner access exists; **no sandbox without contract** | VERIFIED prerequisites |
| H-HBX **eval** | M for *Commercial Truth* / H for *harness* | Availability + CheckRate on `api.test.hotelbeds.com`; test bookings not real. Whether eval *rates* are market-real is **VENDOR-CONFIRMATION-REQUIRED** — not automatic `live_api` | VERIFIED getting-started; UNKNOWN rate realism |
| A-VIA Basic | M | `GET /availability/schedules/{product-code}` is allowed and is documented as real-time single-product schedule retrieval. `POST /availability/check` (booking-grade verify) is **denied**. Schedule quote ≠ booking-grade snapshot | VERIFIED https://docs.viator.com/partner-api/technical/ |
| A-GYG | L | Partner-gated API; snapshot possible only after access | VERIFIED api.getyourguide.com |
| M-12G | U | No public API contract to evaluate a snapshot | UNKNOWN / VENDOR-CONFIRMATION-REQUIRED |

### 2.4 Provenance / freshness / revalidation

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF live | H | `expires_at` typically 15–30 min; `price_changed` / `offer_expired` / `offer_no_longer_available` on **real** offers | VERIFIED |
| F-DUF test | H *mechanics* / F *truth* | Same error taxonomy, but prices are not live — revalidation proves plumbing, not market currency | VERIFIED |
| F-SKY | M | Session ~1h; public policy forbids cache/redistribute — snapshot-as-current-price is hostile to their terms | VERIFIED |
| H-HBX | H | `rateType=RECHECK` ⇒ mandatory CheckRate; BOOKABLE can book without recheck | VERIFIED |
| H-BDC | U | Pricing model documented for partners; exact persist/revalidation rules not independently verified here | VENDOR-CONFIRMATION-REQUIRED |
| Others | L/U | Insufficient public revalidation contract for a first proof | UNKNOWN |

### 2.5 Sandbox / test environment quality

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | H | Official test mode; `duffel_test_*`; no spend; Duffel Airways **not realistic** schedules/prices | VERIFIED |
| F-SKY | U | Partner access page returned Access Denied in this session; sandbox quality unknown | UNKNOWN |
| F-AMA | F | Self-service test portal gone | VERIFIED |
| H-BDC | F-for-now | Sandbox only after Managed Affiliate contract | VERIFIED |
| H-HBX | H | Self-register evaluation keys; 50 req/day; test bookings do not charge | VERIFIED |
| A-VIA | M | Basic keys self-serve; real-time **schedules** for one product; no booking-grade `/availability/check` | VERIFIED technical guide |
| A-GYG | L | Contact/partner gated | VERIFIED |
| M-12G | L | No public developer portal | VERIFIED third-party + affiliate pages |

### 2.6 API maturity / operational reliability

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | H | Public v2 docs; airline sandboxes outside Duffel control; Duffel Airways for reliability | VERIFIED |
| F-SKY | H | Same stack as skyscanner.net; create/poll latency variance documented | VERIFIED |
| H-HBX | H | Long-standing APItude; certification process documented | VERIFIED |
| H-BDC | H | Public OpenAPI; partner-only | VERIFIED |
| F-AMA | M | Mature Enterprise APIs; not self-serve | VERIFIED |
| A-VIA | M | Public OpenAPI; tiered access | VERIFIED |
| A-GYG / M-12G | U | Maturity not independently verified from a public spec | UNKNOWN |

### 2.7 Rate limits / failure behaviour

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | M | Docs example 60/60s; help centre live search 120/60s; 429 + `ratelimit-reset`; limits changeable | VERIFIED (two official numbers — treat as account-specific) |
| F-SKY | U | Partner-specific; contact AM if limits bind | VENDOR-CONFIRMATION-REQUIRED |
| H-HBX | M | Evaluation **50/day**; 403 when exceeded; production quotas after certification | VERIFIED |
| H-BDC | M | Public note: sandbox 50/min (secondary sources); production partner-specific | VENDOR-CONFIRMATION-REQUIRED for production |
| Others | U | — | UNKNOWN |

### 2.8 Pricing / expected call or platform costs

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | H for *test proof* | Test mode: official “no danger of spending money”. Live: $3/order + 1% managed content + $2 ancillary + $0.005 excess search over 1500:1 + 2% FX | VERIFIED |
| F-SKY | U | Affiliate model; no public per-search fee table found | VENDOR-CONFIRMATION-REQUIRED |
| H-HBX | H for *eval proof* | Evaluation free with 50/day. Production = wholesale margin, not a public per-call fee | VERIFIED eval / VENDOR-CONFIRMATION-REQUIRED prod |
| H-BDC | U | No public Demand API price list | VENDOR-CONFIRMATION-REQUIRED |
| F-AMA | L | Enterprise pricing | VENDOR-CONFIRMATION-REQUIRED |
| A-VIA | H for access | No API access fee; commission on referred bookings | VERIFIED partner FAQ |
| A-GYG / M-12G | U | Commission programmes exist; API cost unknown | VENDOR-CONFIRMATION-REQUIRED |

### 2.9 Affiliate / commission / commercial model

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | M | Booking-capable NDC; Jetnity separates search vs booking; live cost is per *order*, so search-only can hit excess-search fees | VERIFIED |
| F-SKY | H | Affiliate/redirect native to Jetnity aggregator model | INFERENCE + VERIFIED API deeplinks |
| H-BDC | H | Managed Affiliate / redirect fits hotel strategy | VERIFIED strategy + Demand API purpose |
| H-HBX | M | Wholesale/net rates; Jetnity must not rank by margin (vision §7) | VERIFIED model + VERIFIED Jetnity rule |
| A-VIA | H | Standard affiliate commission, 30-day cookie (Basic/Full) | VERIFIED |
| A-GYG | M | Affiliate/widgets; API gated | VERIFIED |
| M-12G | M | Affiliate/reseller commissions publicly marketed | VERIFIED marketing pages |

### 2.10 Storage / caching / attribution / licensing

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | M | Offer is short-lived; storing “quoted at T” vs “current price” is a terms question | VENDOR-CONFIRMATION-REQUIRED |
| F-SKY | F-for-persist | Public partner article: no cache, resell, repackage, redistribute | VERIFIED |
| H-HBX | M | Cache API *encourages* inventory cache; Content API expected to be stored and refreshed (secondary/cert docs). First proof should still `no-store` dynamic rates | VERIFIED Cache API purpose / VENDOR-CONFIRMATION-REQUIRED for Content cadence |
| H-BDC | U | Attribution/licensing partner-specific | VENDOR-CONFIRMATION-REQUIRED |
| A-VIA | M | Unique content/reviews must not be search-indexed (public partner posture) | INFERENCE from public partner materials |
| Others | U | — | VENDOR-CONFIRMATION-REQUIRED |

### 2.11 Privacy / DPA / subprocessors / residency

All vendors: **VENDOR-CONFIRMATION-REQUIRED** before any Production activation or personal-data sharing.

First proof should send **no traveller identity**, only route/date/counts/currency. That keeps DPA exposure minimal (INFERENCE from Jetnity current flight request shape — VERIFIED in code).

Duffel/Hotelbeds/Booking public sites describe company locations (UK / Spain / NL) but subprocessors and SCCs were not reviewed here.

### 2.12 Secret management / Production activation

| ID | Notes | Class |
| --- | --- | --- |
| All | Server-only secrets; never `NEXT_PUBLIC_*`; Production flag remains off until a separate PO gate | VERIFIED Jetnity policy |
| F-DUF | Test token prefix already enforced in code | VERIFIED |
| H-HBX | API key + shared secret + timestamp signature; mTLS documented for later booking | VERIFIED |
| H-BDC | Bearer + `X-Affiliate-Id` after contract | VERIFIED |

### 2.13 Observability / kill-switch / cost-control

Jetnity-side: S1 kill-switch + in-memory cost guard LIVE; S6/S7 missing (VERIFIED).  
Vendor-side: Duffel and HBX publish failure/quota behaviour (VERIFIED). Others partner-specific (UNKNOWN).

A first proof must stay Preview/dev, Production hard-off, and reuse `providerOpsZustand`.

### 2.14 Vendor lock-in / provider-neutral abstraction

All commercial candidates can sit behind existing `*Provider` ports (VERIFIED).  
Lock-in risk is **lowest** when the first slice is a proof behind the existing port, not a new universal layer.

Duffel-as-architecture is already forbidden by ADR-0062 (VERIFIED).  
Hotelbeds-as-architecture is already forbidden by hotel strategy (VERIFIED).

### 2.15 Effect on TW-8 / TW-9

Any real snapshot is a *prerequisite*, not an unlock.  
A persisted Production row still would not open TW-8 without write-path allocation, app writer, and Workspace read/freshness UI (VERIFIED TW-8 revalidation + this session’s rowcount 0).

Best TW-8 *pipeline mechanics* teacher (not truth): a vendor with explicit expiry + revalidation (Duffel test or HBX eval), **without** minting `live_api`.  
Best TW-8 *Commercial Truth* teacher: a **live** flight (or later hotel) quote after S4–S8.

### 2.16 Effect on Entry Requirements / Traveller truth

None of the commercial candidates should write official entry-requirement truth.  
Do not bind a quote to one citizenship. Do not send documents outbound.

X-REQ would affect Entry Requirements but is the wrong first path for Commercial Truth.

### 2.17 Switzerland-first / later international

| ID | Score | Notes | Class |
| --- | --- | --- | --- |
| F-DUF | M | Live NDC coverage is broadly international (INFERENCE). **Test mode uses Duffel Airways — not realistic CH routes/prices** (VERIFIED) |
| F-SKY | H | Strong CH/EU consumer coverage (INFERENCE from product presence) |
| H-BDC / H-HBX | H | Strong CH hotel inventory expected (INFERENCE) |
| A-VIA / A-GYG | M | CH city activities exist (INFERENCE) |
| M-12G | F | Public positioning is Asia land transport; not a Switzerland-first first path | VERIFIED marketing + INFERENCE |
| F-AMA | H | GDS CH coverage historically strong; access is Enterprise | INFERENCE + VERIFIED access |

---

## 3. Disqualifiers for *first* path

| Candidate | Disqualifier | Class |
| --- | --- | --- |
| F-AMA | Self-Service portal decommissioned 17 Jul 2026 | VERIFIED |
| A-VIA Basic as *booking-grade* first snapshot | Cannot call `/availability/check`; schedule retrieval is not booking-grade verification | VERIFIED technical guide |
| A-VIA Basic as *no real-time data at all* | **Withdrawn** — `/availability/schedules/{product-code}` is allowed | VERIFIED |
| H-BDC *now* | Cannot obtain sandbox without Managed Affiliate contract — this audit cannot start that | VERIFIED |
| M-12G | No public API + Switzerland-first fail | VERIFIED / INFERENCE |
| X-REQ | Not commercial | VERIFIED |
| F-SKY persist | Public no-cache/no-redistribute policy conflicts with S5-B “store a quote” unless legal says ephemeral-only is allowed | VERIFIED policy + VENDOR-CONFIRMATION-REQUIRED exception |
| Skyscanner fixtures | Explicitly non-promotable to `live_api` | VERIFIED code/task |
| Duffel **test** as `live_api` / current Commercial Truth | Sandbox prices are not real/live (Help Centre); Airways not realistic | VERIFIED |
| Duffel live token today | Jetnity rejects non-`duffel_test_` tokens; Production hard-off | VERIFIED |

---

## 4. Compact ranking input (not the decision)

| Rank input | Candidate | Independent (non-code) reasons | Code-reuse (secondary) |
| --- | --- | --- | --- |
| Immediate next (not a vendor) | **S6 Persistent Cost Guard** | Binding Build Order §4; serial activation gate | Existing `ProviderOpsCostGuard` port |
| 1 later *real* Commercial Truth | Flights / **live** vendor (Duffel live or Skyscanner) | Real prices required for `live_api`; flight freshness is TW-8-hard | Ports exist; live transport/partner still gated |
| 2 later hotel | H-BDC if access; else H-HBX **live** | Hotel strategy; eval ≠ automatic live truth | Ports only |
| 3 later / conditional | F-SKY ephemeral-only | Affiliate + no-cache persist conflict | Fixture foundation only |
| Later activities | A-VIA Full (booking-grade `/availability/check`) | Basic can fetch schedules, not booking-grade verify | Ports only |
| Harness only (not truth) | F-DUF **test** / H-HBX **eval** | Zero-spend mechanics; **must not mint `live_api`** | Duffel adapter exists |
| out | F-AMA SS, M-12G first, X-REQ, sandbox-as-`live_api` | See disqualifiers | — |

This ranking is **not** the immediate next implementation. It applies after S4/S6/S7/S8 or after explicit `PO-SEQ-01` (not inferred).
