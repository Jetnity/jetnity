# Provider Readiness Final Recheck – Provider Candidates

Stand: 1. September 2026  
Status: **CURRENT OFFICIAL-SOURCE COMPARISON / NO PROVIDER SELECTED / NO SIGNUP / NO ACTIVATION**

Issue: #386

## 1. Decision context

Jetnity Phase 1 needs one real Commercial Truth path. The product mandate is currently aggregator-first: search/compare intelligently, then hand off to a booking partner where appropriate rather than becoming a full OTA by default.

Therefore vendor fit is evaluated not only by API quality but also by commercial-model fit, freshness/revalidation, attribution, cost control, privacy minimization and ability to remain provider-neutral.

## 2. Current Flight candidates

### Candidate A — Skyscanner Flights Live Prices

**Current recommendation: preferred candidate for Product-Owner commercial due diligence. Not selected or approved.**

Official evidence checked 1 Sep 2026:

- Flights Live Prices retrieves current prices from airline/inventory partners on search;
- create/poll search workflow;
- Refresh Prices can retrieve the most up-to-date available price for a selected itinerary;
- API responses include booking deeplinks;
- Skyscanner documents affiliate traffic tracking through Impact and commission sharing;
- deeplinks may carry bounded tracking parameters;
- Skyscanner explicitly warns not to put PII such as email addresses into tracking parameters;
- usage guidelines require clear carrier/agent/price comparison presentation and controlled deeplink UX.

Official references:

- `https://developers.skyscanner.net/docs/flights-live-prices/quick-start`
- `https://developers.skyscanner.net/docs/flights-live-prices/refresh-prices`
- `https://developers.skyscanner.net/docs/flights-live-prices/tracking`
- `https://developers.skyscanner.net/docs/flights-live-prices/booking-types`
- `https://developers.skyscanner.net/docs/getting-started/usage-guidelines`

#### Why it fits Jetnity well

- native compare/redirect model aligns with Jetnity's aggregator strategy;
- Impact tracking maps naturally to Phase-1 affiliate/revenue attribution;
- deeplink handoff avoids prematurely turning Jetnity into the merchant/booking engine;
- Refresh Prices maps well to Jetnity Commercial Provenance freshness/revalidation truth;
- booking-type/self-transfer metadata is useful for Jetnity's route/travel-risk presentation.

#### Open gates / unknowns

- actual partner/API access approval;
- account-specific quota/rate limits;
- commercial commission terms;
- exact licence for any server-side quote snapshot retention;
- cache/persist/redisplay rules applicable to Jetnity's intended surfaces;
- DPA/subprocessor/data-transfer terms;
- attribution/display requirements beyond public usage guidance.

Until those are written/verified, S8 policy remains fail-closed for persistence rights.

### Candidate B — Duffel live

**Current recommendation: strong technical alternative; second for commercial due diligence under Jetnity's aggregator-first model. Not selected or approved.**

Official evidence checked 1 Sep 2026:

- test/sandbox prices are explicitly not real/live;
- real/live prices require account activation;
- live/test identity is explicit in Duffel resources;
- offers typically expire within about 30 minutes and expose `expires_at`;
- `GET` single offer is recommended to obtain up-to-date offer information and may show changed prices;
- current public pricing: $3 per confirmed order, 1% Managed Content order value, $2 paid ancillary, $0.005 per excess search above 1500 searches per order, plus 2% FX when conversion is needed;
- Duffel is fundamentally designed around search **and booking/order creation**.

Official references:

- `https://help.duffel.com/hc/en-gb/articles/4410085835282-Are-the-flight-prices-in-test-mode-sandbox-real`
- `https://duffel.com/pricing`
- `https://duffel.com/docs/api/offers/get-offers`
- `https://duffel.com/docs/api/orders`

#### Why it remains attractive

- excellent expiry/revalidation semantics for Jetnity truth architecture;
- existing Jetnity development adapter reduces implementation size;
- public cost model is relatively transparent;
- server-side offer IDs and live/test separation are useful operationally.

#### Why it is second for current commercial fit

Jetnity does not currently need to become a full flight booking merchant. Duffel's product and economics are centered on search-to-order flows, while Skyscanner's documented deeplink/affiliate model is closer to Jetnity's current aggregator mandate.

This is a product-fit ranking, not a quality judgment against Duffel.

#### Open gates / unknowns

- account activation/live access;
- exact terms for quote snapshot persistence/redisplay;
- DPA/subprocessors/data transfers;
- whether Jetnity would use Duffel only for search or later also for booking;
- search-to-book economics if Jetnity remains redirect-first;
- live token and paid-call approval.

## 3. Flight recommendation

### Recommended next PO diligence order

1. **Skyscanner Flights Live Prices** — ask/verify partner eligibility, API access, commercial terms, quota, DPA, cache/persistence/redisplay/attribution conditions.
2. **Duffel live** — retain as technical alternative and compare if Skyscanner access/terms are unavailable or incompatible.

This is **not provider selection**. It identifies the most efficient next commercial diligence order.

A Product-Owner decision is still required before any signup, contract acceptance, secret allocation or live call.

## 4. Hotels after Flights

### Booking.com Demand API

Current official evidence:

- supports content-only, search/look/redirect and full booking integration models;
- sandbox/testing requires Managed Affiliate Partner access, Partner Centre and API credentials (`Authorization` bearer token + `X-Affiliate-Id`).

This remains a strong fit for Jetnity's later hotel path if Managed Affiliate access is available.

Official references:

- `https://developers.booking.com/demand/docs`
- `https://developers.booking.com/demand/docs/getting-started/try-out-the-api`
- `https://developers.booking.com/demand/docs/development-guide/authentication`

### HBX / Hotelbeds

Current official evidence:

- official test endpoint exists;
- registration credentials initially target evaluation environment;
- evaluation quota = 50 requests/day;
- availability returns rates;
- `rateType=RECHECK` requires CheckRate for updated availability/pricing;
- certification is required for proper Production workflow.

Official references:

- `https://developer.hotelbeds.com/documentation/getting-started/`
- `https://developer.hotelbeds.com/documentation/hotels/booking-api/`
- `https://developer.hotelbeds.com/documentation/hotels/knowledge-base/certification-process/`

HBX remains a strong technical fallback/evaluation provider, but evaluation environment data must not automatically be promoted to Production `live_api` truth.

## 5. Activities after core Commercial Truth

### Viator

Official Partner API currently documents content, pricing, availability schedules, real-time calls and booking/post-booking capabilities.

Official reference:

- `https://docs.viator.com/partner-api/`

Viator remains a viable later Activities provider, but Activities should not displace the first Flight Commercial Truth path.

## 6. Disqualified as first current path

- Duffel sandbox as `live_api`: forbidden; official prices are not live.
- Amadeus Self-Service: historical path no longer preferred; enterprise-only commercial path would add access friction.
- 12Go: not a Switzerland-first first provider and public API contract remains insufficient for a first controlled proof.
- Requirements provider: Official Truth domain, not the first Commercial Truth path.
- Rental Cars: lower Phase-1 leverage than Flights/Hotels and current product path is less mature.

## 7. Privacy minimum for first provider

First Flight search integration should send only what the selected API actually requires, bounded to fields such as:

- route/origin/destination;
- dates;
- passenger counts/types or ages only where required;
- cabin;
- market/locale;
- requested currency.

Do not send:

- passport/document numbers;
- citizenship unless a selected provider has a separately justified requirement (not expected for ordinary search);
- traveller names/emails for search;
- raw Trip titles;
- user IDs in affiliate tracking;
- health/biometric data.

Tracking IDs must be opaque bounded references, never PII.

## 8. Final candidate verdict

> **Flights first. Skyscanner first for commercial due diligence; Duffel live as strong technical alternative. No provider is selected or activated by this audit.**
