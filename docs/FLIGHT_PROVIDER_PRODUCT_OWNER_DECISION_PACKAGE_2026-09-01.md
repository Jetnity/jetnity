# Jetnity Phase 1 – First Flight Provider Product-Owner Decision Package

Stand: 1. September 2026  
Status: **DECISION PACKAGE / RECOMMENDATION ONLY / NO PROVIDER SELECTED / NO SIGNUP / NO SECRET / NO LIVE CALL / NO PRODUCTION ACTIVATION**

## 1. Binding position in the V1 critical path

This package belongs to **V1 Step 2 – First real Flight Provider + Commercial Truth** in `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`.

Repository Provider Readiness is already sufficiently complete for vendor-specific due diligence:

- S4 CLOSED;
- S5-A integrated;
- S5-B Production persistence exists but has 0 rows and no real writer login;
- S6-A repository foundation CLOSED, Production S6 still hard-off / unapplied;
- S7 CLOSED;
- S8 shared policy hook CLOSED;
- no real provider active.

TW-8 remains blocked until real Commercial Truth exists.

## 2. Product constraint

Jetnity Phase-1 flight search is intended to behave as a traveller-first comparison / aggregation experience, not as an OTA that silently becomes merchant-of-record or forces Jetnity into a full booking-servicing model.

The chosen first provider therefore must support:

1. real current flight-search evidence;
2. trustworthy price/provenance/freshness semantics;
3. safe booking/referral handoff;
4. measurable attribution;
5. server-side secret handling;
6. bounded cost/rate-limit operation;
7. no requirement to leak passport/document truth into ordinary flight search;
8. compatibility with Jetnity's provider-neutral Flight domain and TW-8 Commercial Truth model.

## 3. Candidate A – Skyscanner Flights Live Prices

### Product fit

**Strongest fit for Jetnity's intended aggregator model.**

Official Skyscanner documentation confirms:

- Flights Live Prices returns current flight prices from airline/inventory partners;
- search uses create + poll and supports up to 6 query legs;
- booking options expose provider deeplinks;
- Impact is used to track redirects and partner revenue/commission;
- booking deeplinks are mandatory to the commercial API model;
- Refresh Prices exists for revalidation; Skyscanner documents a 10-minute cache TTL for quick refreshes and new/fresher retrieval beyond that window;
- default Flights Live Pricing rate limits are documented as 100 create calls/second and 100 create calls/minute; poll defaults to 100/second and 500/minute, subject to partner-specific limits;
- live-search sessions must be user-generated with exact origin/destination/dates; automated Live Pricing calls are prohibited by the usage guidance;
- Skyscanner expects roughly 5–20% of user-generated live-pricing sessions to produce an end-user booking deeplink, depending on product/market;
- "Powered by Skyscanner" branding / logo rules and detailed pre-deeplink itinerary UX requirements apply;
- tracking parameters must not contain PII.

### Access risk

**Material current blocker / uncertainty.**

Skyscanner's current Travel API application page states that API access is commercial and selected case-by-case. It says access is generally for established businesses with a large audience and lists low-traffic websites below **100K monthly active users** among businesses they cannot give Travel API access to. It also says start-ups need a robust business plan and a pre-developed product.

Therefore Jetnity must **not assume API access is obtainable today**. The correct first action, if approved by the Product Owner, is commercial due diligence/application only—not implementation or activation.

### Existing Jetnity implementation readiness

Jetnity already has the offline Skyscanner adapter foundation integrated from PR #185:

- `lib/providers/skyscanner/flights/adapter.ts`
- `lib/providers/skyscanner/flights/contracts.ts`
- provider-neutral adapter contracts;
- malformed/missing-data fail-closed tests;
- no live execution mode, no API key, no trusted Commercial Truth minting.

The existing documented next technical slice—**only after provider gate/access**—is the real server-only create/poll transport boundary with timeout/retry/rate-limit handling, server secret injection and trusted response validation.

## 4. Candidate B – Duffel live Flights

### Product fit

**Technically mature but materially weaker fit for Jetnity's metasearch/referral model.**

Official Duffel documentation confirms:

- Duffel is designed around search-and-book / travel-agency flows;
- offers are bookable and generally expire quickly (often around 30 minutes);
- a single offer should be re-fetched before booking because price/service information can change;
- live mode and test mode are distinct;
- current public pricing lists USD 3 per confirmed flight order plus other optional fees;
- Duffel applies an excess-search model above a 1500:1 search-to-book ratio at USD 0.005 per excess search;
- Duffel explicitly states that this look-to-book requirement can make it unsuitable for use cases such as **metasearch engines or calendar search** when using Duffel's airline relationships;
- live payment/booking use requires organisation verification.

### Existing Jetnity implementation readiness

Jetnity has older Duffel search/mapping/factory code and test-mode support. It is intentionally hard-off for Production and historically treated as a data/development provider rather than a strategic business coupling.

This lowers implementation effort, but **implementation effort is not enough to justify a provider whose commercial operating model conflicts with Jetnity's intended product model**.

## 5. Comparative verdict

| Criterion | Skyscanner Live Prices | Duffel live |
| --- | --- | --- |
| Jetnity aggregator/referral fit | **Strong** | **Weak–medium** |
| Real live price search | Yes | Yes |
| Booking/referral deeplinks | **Native commercial model** | Primarily search-and-book / agency model |
| Affiliate/revenue attribution | **Impact-based and documented** | Booking economics rather than classic metasearch attribution |
| Refresh/revalidation semantics | **Explicit Refresh Prices** | Offer re-fetch before booking |
| Multi-city | Up to 6 legs | Supported through slices |
| Search economics for metasearch | Usage/click-quality requirements; partner-specific | **1500:1 look-to-book + excess-search fee; Duffel flags metasearch concern** |
| Current access certainty | **Low / gated by partner acceptance; 100K MAU criterion is a major risk** | Higher technical accessibility, live verification required |
| Existing Jetnity foundation | **Already integrated offline adapter foundation** | Older working test/development adapter exists |
| Strategic match | **Best** | Fallback only if business model is consciously changed |

## 6. Technical-Lead recommendation

### Recommendation A — preferred

**Skyscanner Flights Live Prices should remain Jetnity's preferred first Flight Commercial Truth provider.**

Reason: it best matches Jetnity's product model—comparison, current prices, provider deeplinks, refresh semantics and affiliate attribution—without requiring Jetnity to become a flight-booking/servicing OTA.

### But do not select/activate it yet

Because Skyscanner's published partner acceptance criteria create a real access risk, the immediate Product-Owner decision should be limited to:

> **Approve Skyscanner commercial due diligence / partnership application as Jetnity's first provider-access attempt.**

This is not approval for API keys, secrets, paid/live calls, Production S6, writer allocation, persistence, TW-8 or Production activation.

### Duffel posture

Do **not** activate Duffel live merely because existing Jetnity code makes it easier. Keep Duffel as a technical fallback while the business-model mismatch is unresolved.

If Skyscanner declines or cannot offer appropriate terms/access, the next action should be a fresh provider shortlist/reconciliation for a metasearch/referral-compatible live flight source rather than silently turning Jetnity into a Duffel booking agency.

## 7. Product-Owner gates

The following are separate gates and must never be inferred from a generic "weiter":

### Gate A – provider due diligence / external engagement

Approve contacting/applying to Skyscanner Partnerships for Travel API / Flights Live Prices access and obtaining commercial, licence, DPA, cache/redisplay, attribution and rate-limit terms.

**Current status: UNAPPROVED.**

### Gate B – Production S6

Approve Production Cost Guard migration/runtime principal, HMAC pseudonymisation secret, runtime transport binding and a bounded >0 provider budget.

**Current status: UNAPPROVED.**

### Gate C – provider secret + first real call

Approve storing the live provider credential server-side and making the first bounded real provider call after Gate A/B and Technical-Lead implementation review.

**Current status: UNAPPROVED.**

### Gate D – Commercial Provenance runtime writer

Approve allocation of the Production writer/login path and persistence of trusted provider Commercial Truth.

**Current status: UNAPPROVED.**

### Gate E – Production provider activation

Approve final Production activation only after exact-head code review, CI, Vercel, cost/security/privacy checks and real quote/freshness validation.

**Current status: UNAPPROVED.**

## 8. Questions that must be answered during Skyscanner due diligence

1. Will Jetnity be accepted despite current audience/traffic stage, given the pre-developed product and business plan?
2. Exact commercial model / revenue share and any minimum-volume commitments.
3. Switzerland market availability and permitted launch geographies.
4. Contract/DPA/subprocessor/international-transfer terms.
5. Exact rights for caching, persistence, redisplay and historical Commercial Truth snapshots.
6. Required Skyscanner branding placement and UX review process.
7. Rules for ranking, filtering and combining prices/providers.
8. Deeplink validity, attribution requirements and Impact onboarding.
9. Partner-specific rate limits and expected click-through/look-to-book quality.
10. Whether Jetnity may retain non-price itinerary metadata after live-session expiry and for how long.
11. Refresh Prices usage constraints and acceptable stale/recheck presentation.
12. Any restriction on Jetnity's own recommendation/ranking layer over Skyscanner-supplied results.
13. Any fees, deposits, minimum revenue, traffic or launch obligations not published in public docs.

## 9. Safe next action

No runtime Cursor slice should start from this package.

If Product Owner approves **Gate A only**, Technical Lead may proceed with Skyscanner partnership/application due diligence and persist the returned terms. All later gates remain explicitly closed.

If Gate A is not approved, stop at this decision package.

## 10. Official public evidence checked on 2026-09-01

- Skyscanner API Authentication / API-key application guidance
- Skyscanner Travel API partner application / acceptance criteria
- Skyscanner Flights Live Prices Quick Start / Overview / Query object
- Skyscanner Flights Live Prices Refresh Prices
- Skyscanner Flights Live Prices Tracking
- Skyscanner API Usage Guidelines
- Skyscanner API Rate Limits and FAQ
- Duffel Flights Offers / Offer Requests documentation
- Duffel Pricing
- Duffel search-limit/look-to-book help documentation
- Duffel live/test and organisation-verification documentation

Public documentation is not a substitute for signed commercial terms. Vendor-specific licence/DPA/cache/redisplay truth remains **unknown until the provider supplies binding terms**.
