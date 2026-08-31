# Provider Activation Readiness Precheck – Gate Matrix

Stand: 1. September 2026  
Status: **AUDIT GATE MATRIX / NO GATE CROSSED**  
Agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**

This audit crossed **no** Product-Owner gate. A later implementation slice may only proceed after the gates listed for that slice are explicitly approved.

---

## 1. Already satisfied (do not re-litigate as if missing)

| Gate | State | Evidence |
| --- | --- | --- |
| S5-A domain contract | on main | `lib/commercial-provenance/*` |
| S5-B persistence DDL / RLS / SQL writer | on main + Production | live SELECT: table exists |
| S5-B Production apply `S5B-G0-PO-MIG-01` | applied historically | apply verification 29 Aug + live table |
| Adapter Core transport | on main | `lib/server/providers/core/*` |
| Flight search Production hard-off | enforced | `providerOpsIstProduction` |
| Duffel live-token rejection | enforced | `istDuffelTestToken()` |
| TW-8 / TW-9 closed | blocked | revalidation + 0 commercial rows |

Satisfied foundation ≠ permission to activate a provider.

---

## 2. Product-Owner gates that remain closed

| ID | Gate | Needed before | This audit | Smallest later proof (F1) | Any Production/live path |
| --- | --- | --- | --- | --- | --- |
| PO-PROV-01 | Provider signup / dashboard account | any vendor credential | **not done** | **required** for Duffel test token if none exists | required |
| PO-PROV-02 | Contract / ToS / DPA acceptance | binding commercial or personal-data use | **not done** | test-mode ToS still needs explicit PO acknowledgement; full DPA before Production | required |
| PO-SEC-01 | Create/store API key or secret | any authenticated vendor call | **not done / secrets not read** | Preview-only `duffel_test_*` in server env | required |
| PO-PAY-01 | Paid or live vendor call | live inventory | **not done** | **not required** if official test mode is used and stays test-only | required |
| PO-ACT-01 | Production provider flag / `JETNITY_FLIGHT_AKTIV` in Production | Production search | **not done** | **forbidden** in F1 | required |
| PO-DB-01 | Supabase Production mutation | schema/RLS/role/write-gate change | **not done** (SELECT only) | **forbidden** in F1 | if persist/write-path |
| PO-WR-01 | `production_write_path_allocated=true` | S5-B Production persist | live **false** | **forbidden** in F1 | required for persisted Production snapshot |
| PO-WR-02 | Runtime/login principal for writer chain | SQL writer invoke | **not done** | **forbidden** in F1 | required for persist |
| PO-WR-03 | Application writer / backfill | rows in `trip_item_commercial_provenance` | 0 rows | **forbidden** in F1 | required for persist |
| PO-TW-01 | TW-8 runtime | commercial surface | **blocked** | **forbidden** | after real snapshots + read join |
| PO-TW-02 | TW-9 closure | polish/closure | **blocked** | **forbidden** | after TW-8 |
| PO-ER-01 | Requirements vendor / paid regulatory calls | official hard truth | factory `null` | **out of scope** | separate programme |
| PO-ID-01 | Auth/MFA/AAL or Traveller-model change | identity rewrite | **not done** | **forbidden** | only if separately approved |
| PO-PII-01 | Passport/MRZ/scan/biometric/health storage | sensitive vault | **not done** | **forbidden** | never for a quote proof |
| PO-COST-01 | Spend > approved limits / new recurring vendor cost | live scale | **not done** | test mode should be $0; still confirm | required |
| PO-PUB-01 | Public “provider live” claim | marketing/homepage | **not done** | **forbidden** | after truth-ready launch gates |

---

## 3. Technical gates that are *not* Product-Owner gates (but still bind Cursor)

| ID | Rule | F1 implication |
| --- | --- | --- |
| TL-01 | Cursor never Ready/merges | This PR stays Draft |
| TL-02 | Exact-head review required | Stop after this audit |
| TL-03 | No automatic follow-up slice | F1 is specified, not started |
| TL-04 | Live Evidence wins | Do not use stale “S5-B not on Production” |
| TL-05 | Client prices are not Commercial Truth | Nachweis + S5-A mint only |
| TL-06 | Fixtures cannot become `live_api` | Skyscanner foundation stays offline |
| TL-07 | E5 event mint ≠ commercial snapshot | Do not persist via flight-event writer |

---

## 4. Licensing / privacy / commercial gates by vendor

| Vendor | Public constraint | Gate before persist | Gate before Production |
| --- | --- | --- | --- |
| Duffel | Test = no spend (VERIFIED). Live = per-order + excess search (VERIFIED). Offer expiry short (VERIFIED). Persist-as-current-price **VENDOR-CONFIRMATION-REQUIRED** | Legal: may we store “quoted at T, stale after `expires_at`”? | DPA, live token, excess-search budget, kill-switch |
| Skyscanner | No cache/resell/repackage/redistribute (VERIFIED public article) | Persist likely **blocked** unless counsel/vendor exception | Partner agreement + attribution |
| Booking.com | No sandbox without Managed Affiliate contract (VERIFIED) | Contract first | Contract + attribution + market rules |
| Hotelbeds | Eval 50/day (VERIFIED). Content cache expectations VENDOR-CONFIRMATION-REQUIRED. Wholesale ranking must stay margin-neutral (VERIFIED Jetnity rule) | Eval ToS; no Production book | Certification + commercial agreement + mTLS for booking |
| Viator | Basic ≠ real-time (VERIFIED) | N/A for first quote proof | Full Access cert + content indexing rules |
| 12Go | API not public (VERIFIED/UNKNOWN) | Cannot design persist | Vendor API disclosure first |
| Amadeus | Self-Service closed 17 Jul 2026 (VERIFIED) | Enterprise commercial | Enterprise |

---

## 5. What a later F1 slice may request — and what it may not

**May request (still PO-approved, still not this audit):**

- Duffel *test* dashboard account if none exists
- Preview/dev server env: `DUFFEL_ACCESS_TOKEN=duffel_test_…`, `JETNITY_FLIGHT_AKTIV=true`, `VERCEL_ENV≠production`
- One or few official test-mode Offer Requests + optional GET offer
- Server-only search session + `FlugNachweis` + in-memory S5-A mint
- Secret-safe observability events

**Must not request as part of F1:**

- Live Duffel token
- Production flag
- Write-path allocation
- SQL writer / backfill
- TW-8/TW-9 UI
- Hotelbeds/Booking/Skyscanner signup “while we’re at it”
- Requirements vendor
- Public live claim

---

## 6. Residual Jetnity-side gaps that are *not* silent F1 blockers

These remain real programme gaps. F1 must not pretend they are closed. They do not, by themselves, forbid a Preview test-mode proof:

| Gap | Slice | Why F1 can proceed without closing it |
| --- | --- | --- |
| Persistent global cost guard | S6 | Official Duffel test mode is zero-spend; keep in-memory guard + tiny cap |
| Search observability persist | S7 | Emit in-process/secret-safe events; no new SaaS |
| License policy module | S8 | Default `no-store` + no Production persist |
| Full S4 regulatory ops | S4 | Out of commercial snapshot scope |
| Workspace provenance join | TW-8 | Explicitly out of F1 |

If F1 is redefined to include **Production persist**, then PO-WR-01/02/03, S6, and vendor persist licence become **hard blockers**.
