# Provider Activation Readiness Precheck – Smallest Next Slice (F1)

Stand: 1. September 2026  
Status: **SPECIFICATION ONLY / DO NOT START IN THIS TASK**  
Proposed later name: **Provider Flight Test Snapshot Proof F1**  
Proposed later agent: *not assigned*  
This document does **not** authorise implementation.

---

## 1. Objective

Authorise later, after Product-Owner gates, **one** Preview/dev-only slice that:

1. performs official **Duffel test-mode** Offer Request(s);
2. keeps the result in a **server-only** search session;
3. implements `flugNachweisAusUmgebung()` against that session (plus optional GET-offer revalidation);
4. mints **one** S5-A commercial snapshot **in memory**;
5. proves tamper / stale / unavailable / currency-mismatch fail-closed.

Success = one server-side provider-backed snapshot payload that could *later* be persisted.  
Success ≠ TW-8, ≠ Production persist, ≠ live Duffel, ≠ public “flights are live”.

---

## 2. Input and identity / trust boundary

**Allowed input (server-authoritative):**

- `tripId` of a trip the caller may read (account session) **or** a Technical-Lead/test harness that never accepts browser prices;
- search fields already on `FlugSuchanfrage`: legs (IATA+date), passenger *counts*, cabin, stop preference, currency, optional trip date context;
- `optionId` only as a pointer into the **server** session.

**Forbidden input:**

- browser `priceAmount` / `priceCurrency` / `externalRef` / `retrievedAt` as truth;
- names, dates of birth, passport/MRZ, citizenships, emails beyond auth;
- live Duffel tokens;
- client-set `sourceKind`.

**Identity:** existing user session for a trip-scoped harness *or* a server-only test route protected like other non-public tools.  
Do not invent a new principal. Do not allocate `jetnity_commercial_runtime` login.

Guest path stays fail-closed for commercial persist.

---

## 3. Provider call boundary

| Item | Rule |
| --- | --- |
| Vendor | Duffel test mode only |
| Token | `DUFFEL_ACCESS_TOKEN` matching `istDuffelTestToken()` |
| Flag | `JETNITY_FLIGHT_AKTIV` true in Preview/dev only |
| Production | `providerOpsZustand` must remain `grund: 'production'` |
| Endpoint (search) | existing `duffelAdapter.suchen` → Offer Request |
| Endpoint (optional revalidate) | GET `/air/offers/{id}` mapped fail-closed; new mapping must not leak raw payload to the client |
| Transport | Reuse Duffel HTTP for this slice. Do **not** migrate onto Adapter Core here |
| Paid/live | Forbidden |
| Booking / order / payment | Forbidden |

Call budget: in-memory flight cost guard plus an F1-specific hard cap (recommend ≤ 20 Offer Requests / day / environment). Stop on 429 using `ratelimit-reset`.

---

## 4. Normalised output contract

Reuse, do not replace:

- `FlugProviderTreffer` / `FlugOption` for search;
- `FlugNachweisErgebnis` for confirmation;
- `CommercialProvenance` via `commercialSnapshotFuerPersistenzMinten` for the snapshot.

Minimum mint fields (fail-closed if missing):

- domain `flights`
- `sourceKind: 'live_api'` **only** from the server-observed Duffel test response (not fixtures)
- actor `provider_adapter` / system — never `user` / `assistant` / `llm`
- amount + currency from the nachgewiesen option
- `retrievedAt` from the existing server observation (`treffer.retrievedAt`), not from the client
- `freshUntil` derived from Duffel `expires_at` if present and valid; else `null` and freshness `unknown` — **do not invent**
- currency match vs requested currency (`matched` / `mismatch` / `unknown`)
- persistenz `ephemeral`
- affiliate `unknown` unless independently evidenced (it will not be)

Client search responses continue to strip `retrievedAt`.

---

## 5. Provenance / freshness

| Event | Result |
| --- | --- |
| Session missing / option unknown | `unbekannt` / unavailable — no mint |
| Context drift (legs/pax/cabin/currency) | `geaendert` or `invalid` |
| `expires_at` in the past | `abgelaufen` — no current mint |
| GET offer `price_changed` | `geaendert` — do not mint old price as current |
| GET offer `offer_no_longer_available` / `offer_expired` | `abgelaufen` / unavailable |
| Provider down / timeout | `unavailable` / `error` — empty ≠ error |
| Fixture / Skyscanner offline result | must not be mintable as `live_api` |

Persisted Workspace prices remain legacy and untrusted.

---

## 6. Commercial persistence boundary

**F1 persist policy: `forbidden` / `no-store`.**

- Mint in memory (and in test assertions).
- Do **not** call `trip_item_commercial_provenance_schreiben`.
- Do **not** set `production_write_path_allocated`.
- Do **not** write `trip_items.price_amount` from this mint.
- Do **not** join provenance in `abbildung.ts`.

A later **F2** (separate versioned task) may persist if and only if: persist licence is confirmed, write path is PO-allocated, and TW-8 is still not silently opened.

---

## 7. Write-authority requirements

| Authority | F1 |
| --- | --- |
| SQL DEFINER writer | must remain uninvoked |
| `jetnity_commercial_writer` / runtime login | must remain unallocated |
| Service role as writer | forbidden |
| Browser as writer | forbidden |

---

## 8. Cost guard

- Reuse `ProviderOpsCostGuard` / `lib/flights/rate-limit.ts`.
- Fail closed on guard errors.
- Add an environment-level F1 daily cap.
- S6 persistent guard is **not** in F1.
- No new paid SaaS.

---

## 9. Timeout / retry / kill-switch

- Keep `FLUG_SUCHE_GRENZEN.timeoutMs` (12s) unless a measured test-mode need is documented.
- No unbounded retry. At most one retry on transport failure; never retry `offer_expired`.
- Honour 429 / `Retry-After` / `ratelimit-reset`.
- Kill-switch: Production off; flag off; missing/invalid token → `ohne-zugang`.
- AbortSignal already used by Duffel adapter — keep.

---

## 10. Observability (no sensitive payloads)

Emit `providerOpsEvent()` (or equivalent secret-safe event) with:

- domain, outcome, latency bucket, environment (`test`), kill-switch grund
- **not** token, offer payload, passenger counts beyond a boolean “in range”, raw Duffel body, trip title

S7 persistence is out of scope. Logs must not print secrets.

---

## 11. Cache / license / persist policy

- HTTP `private, no-store` on any new response.
- No Redis/CDN of offers.
- Session TTL = min(vendor `expires_at`, 30 minutes, process lifetime). Memory or existing server store only — **no new Production table**.
- Attribution: none claimed.
- License: F1 does not redistribute offers outside the authenticated session.

---

## 12. Test strategy

Must include automated tests for:

| Case | Expect |
| --- | --- |
| Tampered price / currency / ref on adopt | fail-closed, no mint |
| Unknown `optionId` | `unbekannt` |
| Expired `expires_at` | `abgelaufen` |
| Context drift | `geaendert` / `invalid` |
| Provider timeout / 5xx | `unavailable` or `error`, distinguishable from empty |
| Rate limit | `rate_limited` |
| Fixture/Skyscanner object passed to mint | reject |
| Live token / Production env | adapter stays `null` |
| Client body cannot carry `retrievedAt` into mint | already true; keep |
| Empty search vs error | not the same status |

Optional Preview manual: one ZRH–LHR (or Duffel Airways documented pair) test-mode search, one Nachweis, one mint assertion. **Not** a Real-Device TW-8 acceptance.

TypeScript, unit tests, hygiene, production build must stay green. No `db:*` Production apply.

---

## 13. Product-Owner gates that must be approved *before* F1 starts

From `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_GATE_MATRIX_2026-09-01.md`:

- **PO-PROV-01** Duffel test account (if no token exists)
- **PO-PROV-02** acknowledgement of Duffel test-mode ToS (not a live commercial contract)
- **PO-SEC-01** store `duffel_test_*` in Preview/dev server env only
- Explicit written confirmation: **no** PO-PAY-01, PO-ACT-01, PO-DB-01, PO-WR-*, PO-TW-*, PO-PII-01, PO-PUB-01

If any of those closed gates is requested inside F1, the slice is out of bounds and must stop.

---

## 14. Explicit non-scope

- Provider adapter rewrite or second flight vendor
- Adapter Core migration of Duffel HTTP
- Hotelbeds/Booking/Skyscanner/Viator/12Go implementation
- S6 / S7 / S8 programme slices
- S5-B write-path allocation or SQL invoke
- TW-8 / TW-9 runtime or Workspace price join
- Entry Requirements vendor or E5 Production apply
- Account registry / traveller document collection
- Booking, order, payment, affiliate claim
- Public or Production flight search
- Automatic F2

---

## 15. Why this is the smallest safe proof

Smaller rejected alternatives:

| Alternative | Why rejected |
| --- | --- |
| Docs-only “we have an adapter” | Not a snapshot |
| Fixture mint | Forbidden; not provider-backed |
| Production persist in the same slice | Crosses write-path + licence gates |
| Hotelbeds adapter + mint | Larger; new mapping + secrets + contract surface |
| User-visible TW-8 price card | Unlocks commercial UI without a programme |
| Live Duffel | Paid/live gate; excess-search economics |

F1 is the smallest slice that still satisfies the task: **one real server-side provider-backed snapshot**, later-authorisable, without pretending TW-8 is open.

---

## 16. Suggested later task header (do not open)

- Issue: new, after TL review of #351 / #354
- Branch: `feat/provider-flight-test-snapshot-proof-f1-2026-09-01` (example only)
- Baseline: then-current `main`, not this audit head
- Logical agent: new generation, not this session
