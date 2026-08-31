# Provider Activation Readiness Precheck – Evidence / Live Reconstruction

Stand: 1. September 2026  
Status: **AUDIT EVIDENCE / NO PROVIDER ACTIVATION / NO SECRETS CREATED / NO PAID CALLS / NO PRODUCTION WRITES**  
Logical agent: **`Jetnity provider activation readiness precheck 1`**  
Generation: **1**  
Cursor session: `bc-d1b4e6bb-c952-4242-ba57-384783bc23ea`  
Issue: #351  
Draft-PR: #354  
Branch: `audit/provider-activation-readiness-precheck-2026-09-01`  
Task: `docs/PROVIDER_ACTIVATION_READINESS_PRECHECK_TASK_2026-09-01.md`

> Live Evidence wins. Persisted does not mean provider-proven. Existing adapter code does not select a provider.

## 0. Evidence classes

| Class | Meaning |
| --- | --- |
| **VERIFIED** | Observed in this session from live GitHub/CI/Vercel, current checkout, official public vendor pages, or a read-only Production SELECT |
| **INFERENCE** | Reasonable reading of verified facts; not independently proven |
| **UNKNOWN** | Not established in this session |
| **VENDOR-CONFIRMATION-REQUIRED** | Public pages are insufficient; a vendor/legal/commercial answer is required before activation |
| **HISTORICAL / SUPERSEDED** | Older docs still in-repo that contradict later live evidence |

No vendor signup, contract, secret creation, paid/live provider call, Production mutation, writer allocation, TW-8/TW-9 runtime, or adapter implementation was performed.

---

## 1. Live repository / GitHub

| Fact | Value | Class |
| --- | --- | --- |
| `origin/main` | `ebd08ec07134f1ad4d3f6d68a694be4ff189fa5b` — `Close Entry Requirements E5-B3C continuity (#350)` | VERIFIED |
| Task baseline | same SHA | VERIFIED |
| Pre-agent branch head | `e28f48f6791cc824f91d2f94a94375a74336dba9` | VERIFIED |
| Merge-base | exact `origin/main` | VERIFIED |
| Pre-agent compare | 3 ahead / 0 behind; docs-only TL setup | VERIFIED |
| Issue #351 | OPEN | VERIFIED |
| Draft-PR #354 | OPEN, Draft, MERGEABLE | VERIFIED |
| Competing implementation PRs | none | VERIFIED |
| Stale open drafts | #52, #50, #40, #39, #28 — historical docs/features, not this stream | VERIFIED |
| Other open issues | #294 Entry Requirements target (do not auto-start); #236 Strategy Register; #110 Homepage Hero; #20 Collaboration | VERIFIED |
| TW-8 audit PR #302 | CLOSED / not merged; recovery #303 MERGED | VERIFIED |
| S5-B authoring PR #182 | CLOSED / not merged; recovery #183 MERGED (earlier) | VERIFIED |

This audit adds only versioned docs on the existing branch. `docs/ACTIVE_WORK_STATUS.md` and `JETNITY_START_HERE.md` were not edited.

---

## 2. CI / Vercel

| Fact | Value | Class |
| --- | --- | --- |
| Main CI #1552 / Run `33443161594` | SUCCESS on exact `ebd08ec…` | VERIFIED |
| Main CI #1550 / Run `33442405068` | SUCCESS on E5-B3C runtime merge `8663fded…` | VERIFIED |
| Vercel Production deployment for `ebd08ec…` | GitHub deployment `6190234319`, state **success** (2026-08-31T21:48:26Z) | VERIFIED |
| Branch CI #1553 / Run `33445465681` | SUCCESS on pre-agent head `e28f48f6…` | VERIFIED |
| Branch Vercel Preview | READY on pre-agent head (PR comment / GitHub Vercel SUCCESS) | VERIFIED |
| Runtime behaviour of this branch vs main | identical; only TL setup docs differ | VERIFIED |

---

## 3. Supabase Production — read-only, this session

Documented Production project: `qscbgcdmivbbnzrcyegn`.

A SELECT-only Management API query was executed against that exact project. No INSERT/UPDATE/DELETE/DDL/grant/role change.

| Fact | Live value 2026-08-31 | Class |
| --- | --- | --- |
| `public.trip_item_commercial_provenance` | exists | VERIFIED |
| `jetnity_internal.commercial_write_runtime_gate` | exists | VERIFIED |
| `production_write_path_allocated` | **false** | VERIFIED |
| `trip_item_commercial_provenance` rowcount | **0** | VERIFIED |
| `public.trip_item_flight_event_provenance` | **absent** (`to_regclass` null) | VERIFIED |
| `jetnity_internal.flight_event_write_runtime_gate` | **absent** | VERIFIED |

This confirms current continuity: S5-B persistence foundation is applied and empty; Production Flight Event Provenance remains unapplied; no real commercial snapshot exists.

Honesty note: the Cloud Agent environment’s `SUPABASE_PROJECT_REF` / `NEXT_PUBLIC_SUPABASE_URL` do **not** match documented Production. That environment project lacks the S5-B relation. It was not treated as Production truth. Production was queried by the documented project ref only.

---

## 4. Binding build order vs live

`docs/JETNITY_BINDING_BUILD_ORDER.md` §4 (27 Aug) still says S5-B is Draft-PR #182 / not on Production, then “S4/S6–S8, danach echte Provider”.

| Claim in §4 | Live | Class |
| --- | --- | --- |
| S5-A on main | yes | VERIFIED |
| S5-B Draft #182, not on Production | **SUPERSEDED** — schema applied; write path closed; 0 rows | VERIFIED |
| S4 then echte Provider | S4-R1 (Requirements truth-ops) merged 31 Aug; factory still `null`. Full S4/S6/S7/S8 not complete | VERIFIED |
| Echte Provider after S4–S8 | **Still binding.** No later Product-Owner decision authorises skipping remaining S4/S6/S7/S8. The TW-8 audit named a later programme *direction*; it does **not** supersede §4. A sandbox harness before those slices would need an **explicit new PO sequence decision** (`PO-SEQ-01`). This audit does **not** infer that exception. Immediate next implementation under §4: **S6 Persistent Cost Guard** (not started here) | VERIFIED order text + VERIFIED remaining gaps |

TW-8 revalidation (merged via #303) named a later step outside TW (first real provider path + server-proven snapshot). That is **not** TW-8 unlock, **not** Production activation, and **not** permission to treat Duffel sandbox prices as `live_api` or to skip S4/S6/S7/S8.

---

## 5. Provider-readiness / adapter continuity

| Slice | Live on main | Class |
| --- | --- | --- |
| S1 Shared Ops | yes — `lib/provider-ops/*`; in-memory cost guard | VERIFIED |
| S2 FlugNachweis contract | yes — type + konto wiring; `flugNachweisAusUmgebung() = null` | VERIFIED |
| S3 Mobility/Rental Nachweis contracts | yes — async contracts; factories `null` | VERIFIED |
| S4 Truth-domain ops | **partial** — S4-R1 readiness timeout/kill-switch/freshness merged; no regulatory vendor | VERIFIED |
| S5-A | yes — `lib/commercial-provenance/*` | VERIFIED |
| S5-B | schema + mint helpers + SQL writer; **no app writer**; Production write gate false; 0 rows | VERIFIED this session |
| S6 persistent cost guard | missing | VERIFIED |
| S7 observability emit/persist | event type only; not wired from search | VERIFIED |
| S8 license/cache policy module | missing beyond default `no-store` | VERIFIED |
| Adapter Core ADR-0199 | `lib/server/providers/core/*` transport only; no bound live vendor | VERIFIED |
| Duffel flight adapter | real HTTP Offer Request path; Production hard-off; test-token prefix required | VERIFIED |
| Skyscanner flight foundation | fixture-only; cannot mint `live_api` / persist | VERIFIED |
| HBX / Viator / 12Go runtime | **absent** — contract/audit docs only; ADR-0200 12Go **not accepted** | VERIFIED |
| Hotel/Activity/Mobility/Rental factories | always `null` | VERIFIED |
| `requirementsProviderAus()` / `safetyProviderAus()` / `seasonalProviderAus()` | `null` | VERIFIED |

Stale docs that still say “S5-B not started” or “S5-B Draft #182 not on Production” are HISTORICAL / SUPERSEDED. Canonical newer evidence: ADR-0198 in `DECISIONS.md`, S5-B apply verification 29 Aug, this session’s Production SELECT.

---

## 6. E5-B3C / Entry Requirements

| Fact | Value | Class |
| --- | --- | --- |
| E5-B3C | CLOSED & POST-MERGE VERIFIED via #349 / closure #350 | VERIFIED |
| What it is | server-only, DB-free Flight **Event** persistence *payload mint* | VERIFIED |
| What it is not | commercial quote, S5-B writer, Requirements vendor | VERIFIED |
| `flugNachweisAusUmgebung()` | still `null` | VERIFIED |
| `requirementsProviderAus()` | still `null` | VERIFIED |
| Production Flight Event Provenance | unapplied (live `to_regclass` null) | VERIFIED this session |

Do not treat E5-B3C as a commercial snapshot path.

---

## 7. TW-8 / TW-9

| Gate | Live | Class |
| --- | --- | --- |
| TW-8 start | **BLOCKED** | VERIFIED (merged revalidation #303 + this Production SELECT) |
| TW-9 start | **BLOCKED** | VERIFIED |
| Why | no allocated write path; no app writer; 0 commercial rows; no workspace provenance join; no real provider snapshot | VERIFIED |
| Workspace prices | legacy `trip_items.price_amount` via `lib/trips/abbildung.ts` | VERIFIED |

This precheck must not silently unlock TW-8/TW-9.

---

## 8. Account / Traveller dependencies

| Dependency | Needed for first commercial *quote* snapshot? | Class |
| --- | --- | --- |
| Trip graph + ownership | yes | VERIFIED |
| Foundation E multi-citizenship/document model | exists on Production; **not required** to quote a flight/hotel | VERIFIED |
| AP-7 registry UI / materialization | no | VERIFIED |
| Passport/MRZ/biometrics | **no — must not be collected** for a quote proof | VERIFIED policy |
| Entry Requirements vendor | no | VERIFIED |
| Passenger *counts* for flight search | yes (already on `FlugSuchanfrage`) | VERIFIED |
| Traveller-neutral Route Truth | keep reusable; do not bind a quote to one citizenship | VERIFIED policy |

Flight search today is PII-poor (counts, IATA, dates, cabin, currency). First snapshot must stay that way.

---

## 9. Product-Owner selection state

No PO decision selects Duffel, Skyscanner, Booking.com, HBX, Viator, GYG, or 12Go as **the** first live/production provider.

| Domain | Existing decision | Activation? |
| --- | --- | --- |
| Flights (dev) | Duffel = first **development** adapter (ADR-0062) | Production hard-off |
| Flights (live target, historical TL) | Skyscanner named as first live/server transport *target* | fixture-only; not activated |
| Hotels | Booking.com first **if** Managed Affiliate access; HBX backup (`HOTEL_PROVIDER_STRATEGY.md`) | factory `null` |
| Activities | Viator first specialised *target*; GYG later | no adapter |
| Mobility | 12Go first specialised *target*; ADR-0200 not accepted | no adapter |
| Requirements | no vendor | factory `null` |

---

## 10. Official / public vendor evidence used

Fetched or confirmed in this session (no credentials, no calls to vendor APIs):

| Source | Used for |
| --- | --- |
| https://duffel.com/docs/api/overview/test-mode | Test tokens `duffel_test_`; zero-spend sandbox; Duffel Airways not realistic |
| https://help.duffel.com/hc/en-gb/articles/4410085835282-Are-the-flight-prices-in-test-mode-sandbox-real | Sandbox/test-mode prices **are not real, live prices** |
| https://duffel.com/pricing | $3/order; 1% managed content; $2 ancillary; 1500:1 excess search $0.005; 2% FX |
| https://duffel.com/docs/api/offers | `expires_at` typically ~30 min; GET single offer revalidation |
| https://duffel.com/docs/api/overview/response-handling | 429 + `ratelimit-*`; `offer_expired` / `price_changed` / `offer_no_longer_available` |
| https://help.duffel.com/hc/en-gb/articles/10229200096786-What-is-the-API-rate-limit | Live search default 120/60s (help centre) |
| https://developers.skyscanner.net/docs/flights-live-prices/overview | create/poll; session ~1h |
| https://skyscannerpartnersupport.zendesk.com/hc/en-us/articles/4687322610845-Why-Skyscanner-does-not-allow-partners-to-cache-resell-repackage-or-redistribute-data | Public no-cache / no-redistribute policy |
| https://developers.booking.com/demand/docs/getting-started/prerequisites | Managed Affiliate + contract required before sandbox |
| https://developer.hotelbeds.com/documentation/getting-started/ | Self-register evaluation keys; `api.test.hotelbeds.com`; 50 req/day; test bookings not real |
| https://developer.hotelbeds.com/documentation/hotels/booking-api/workflow/ | Availability + CheckRate when `rateType=RECHECK` |
| https://developers.amadeus.com/ | Self-Service portal decommissioned 17 July 2026; Enterprise only |
| https://docs.viator.com/partner-api/technical/ | Basic: `/availability/schedules/{product-code}` allowed (real-time single-product schedules); `/availability/check` denied (booking-grade verify) |
| https://partnerresources.viator.com/travel-commerce/levels-of-access/ | Marketing table says “Get availability & pricing in real time” is Full-only — **do not use as the technical disqualifier**; endpoint matrix wins |
| https://api.getyourguide.com/ | Partner account required; not self-serve |
| 12Go public affiliate/reseller pages | API not publicly documented; contact-required |

DPA/subprocessor/data-residency schedules were **not** accepted or downloaded. They remain VENDOR-CONFIRMATION-REQUIRED.

---

## 11. Review-fix 2026-09-01 (TL #5072115941)

Rejected head: `43bb98762ed00bc0293e5b4df5566a4e25c3d865`. This section records corrections; live Production SELECT was not re-run in the review-fix (previous session SELECT + TL independent recheck both showed write path false / 0 rows).

| Finding | Correction |
| --- | --- |
| P1 sandbox ≠ `live_api` | Duffel test prices are not real/live. No S5-A `live_api` mint from sandbox. Pipeline harness ≠ Commercial Truth gate. |
| P1 Binding Build Order | S4/S6/S7/S8 remain required. Immediate next = S6, not a provider proof. `PO-SEQ-01` not inferred. |
| P1/P2 process memory | Cross-request in-memory session removed. One-invocation harness or a separately gated durable store. |
| P2 Viator Basic | Schedules endpoint is real-time; `/availability/check` is not Basic. Ranking not flipped to Activities-first. |

## 12. Explicitly not verified

- Whether a Duffel test token already exists in Vercel Preview (secret values were not read)
- Current Production Vercel runtime logs
- Byte-identical `reise_anlegen` source between repo and Production (known S5-B residual)
- Vendor contract terms beyond public pages
- Real Switzerland inventory quality for any live vendor
- Whether Booking.com would accept Jetnity as Managed Affiliate
- Whether Skyscanner would permit an ephemeral server-side snapshot under their no-cache policy
