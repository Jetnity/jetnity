# Jetnity – V1 Flight Metasearch Provider Alternatives Precheck

Stand: 1. September 2026  
Status: **INTERNAL DUE DILIGENCE ONLY / NO PROVIDER SELECTED / NO CONTACT OR APPLICATION / GATE A UNAPPROVED**

Issue: #400  
Parent gate: #395  
Baseline: `main@0d1c70cc9ffff6d350fed71f56721b6c6211e6d0`

## 1. Purpose

The Skyscanner application-readiness precheck proved that Jetnity's generic engineering foundations are not the immediate blocker; provider access is. This follow-up asks whether another current provider can preserve Jetnity's intended V1 model:

> real user-initiated flight comparison → current price/availability evidence → transparent provider provenance/freshness → redirect/referral to a booking provider → attribution/revenue measurement.

This is not permission to sign up, submit a form, accept terms, request credentials or call any provider.

## 2. Product-fit requirements

A preferred V1 provider should, as far as contract/access permits:

1. expose real/current flight search, not historical indicative prices;
2. support one-way, return and preferably multi-city;
3. expose enough segment/price/provider identity for Jetnity Commercial Truth;
4. support revalidation/polling/freshness semantics;
5. provide booking/deeplink handoff rather than forcing Jetnity to become the flight merchant/agency;
6. support affiliate/referral attribution and monetisation;
7. allow server-side credential handling and user-initiated search only;
8. have a plausible pre-launch/start-up access path;
9. have contract/licence/cache/redisplay terms that can be represented fail-closed in S8;
10. fit the existing S5/S6/S7/S8 + TW-8 architecture without inventing a second provider truth model.

## 3. Current shortlist

### A. KAYAK Affiliate Network – Flights Search API

Current public official evidence:

- `https://affiliates.kayak.com/apis`
- `https://affiliates.kayak.com/apis/flights`
- `https://affiliates.kayak.com/`
- `https://developers.kayak.com/`
- `https://affiliates.kayak.com/deeplinks`

Observed public posture on 2026-09-01:

- KAYAK describes its API platform as supporting **startups and enterprises**;
- Flights API advertises live pricing/availability, multi-city, multiple providers/booking options, rich itinerary/fare/baggage detail and a two-step search model with updates until completion;
- Affiliate Network supports API, deeplinks, widgets and whitelabel and monetisation through clicks/bookings/ad revenue;
- Deeplinks preserve attribution and can land on pre-filled results;
- an application is required for affiliate/API access;
- the public partner form offers the possibility to request **free Sandbox API access**;
- production keys follow use-case approval;
- no public 50K/100K MAU minimum was found in the reviewed official public pages.

Truth boundary:

> Absence of a published MAU minimum is **not** proof that KAYAK will approve Jetnity or that no private traffic/commercial criteria exist.

Jetnity fit: **VERY STRONG / access risk materially lower on public evidence than Skyscanner, but still approval-gated.**

Why it is strategically important:

- it preserves the metasearch/referral model;
- it could cover Flights and later Hotels/Cars through one affiliate ecosystem without forcing multi-provider breadth before V1;
- live fares + multiple booking options fit Commercial Provenance better than cached price feeds;
- affiliate monetisation is native to the product rather than added as an afterthought.

Open questions before any application:

- exact production qualification criteria;
- API pricing/cost model and rate limits;
- revenue-share/CPC/CPA terms;
- contractual cache/redisplay duration;
- whether raw search results may be persisted as Jetnity snapshots and for how long;
- required KAYAK branding/attribution;
- supported Swiss market/locale/currency behavior under partner agreement;
- exact production search/deeplink identifiers and revalidation contract;
- DPA/subprocessor/international-transfer terms.

### B. Wego Affiliate / Metasearch APIs

Current public official evidence:

- `https://developers.wego.com/`
- `https://developers.wego.com/docs/affiliate/get-started/`
- `https://developers.wego.com/docs/affiliate/guides/flights/`
- `https://developers.wego.com/docs/affiliate/guides/authentication/`
- `https://developers.wego.com/docs/affiliate/terms-of-service/`
- `https://developers.wego.com/docs/distribution/flight/api/flight-b-2-b-distribution-apis-v-3/`

Observed public posture on 2026-09-01:

- affiliate Flights Search exposes live airfare search through a search-session + polling flow;
- results can expose multiple fares from OTAs/airlines;
- Wego deep links are used for provider handoff;
- affiliate terms describe commission from qualifying exit clicks;
- API use must represent real end-user searches, not bots;
- published policy requires Search-to-Click ratio of at least **5%**;
- published default search limits are 50/hour for a test key and 500/hour for a regular key, with higher limits potentially available when the Search-to-Click condition is maintained;
- server-side/client-secret handling is supported through client-credentials authentication;
- public flight documentation includes CHF and relevant Jetnity languages among supported currencies/locales;
- no public MAU minimum was found in the reviewed affiliate documentation.

Registration boundary:

The affiliate Terms state that participation requires submitting the secure registration form and accepting the agreement. That external action is currently prohibited by Product Owner instruction.

Jetnity fit: **VERY STRONG / technically close to Jetnity's intended search→redirect model.**

Open questions before any registration:

- whether API access is automatically available after affiliate registration or separately approved;
- production/commercial qualification beyond the public terms;
- exact commission economics for Swiss/DACH traffic;
- data/cache/redisplay/persistence rights;
- provider logos/branding/disclosures;
- DPA/privacy/international transfer terms;
- whether the 5% Search-to-Click requirement is measured per product, locale or total account;
- contractual consequences of temporarily falling below ratio during launch;
- production request limits and escalation path.

### C. Skyscanner Flights Live Prices

Current state from the prior precheck:

- best-known strategic/metasearch fit;
- real Live Prices + polling/refresh/deeplink/Impact attribution fit Jetnity well;
- Jetnity already has an integrated offline Skyscanner adapter foundation;
- however Skyscanner currently publishes a **100K monthly active users** minimum for low-traffic websites on its Travel API application page;
- Jetnity has no repository evidence proving that threshold.

Jetnity fit: **VERY STRONG PRODUCT FIT / HIGH CURRENT ACCESS RISK.**

### D. Duffel Flights / Duffel Links

Current official evidence:

- `https://duffel.com/docs`
- `https://duffel.com/docs/api/overview/flights-key-concepts`
- `https://duffel.com/pricing`
- `https://duffel.com/links`
- `https://duffel.com/services-agreement`

Observed:

- very accessible developer/test path;
- real live offers exist in live mode and can be re-read before booking;
- pricing currently includes $3/order and an excess-search fee above a 1500:1 search-to-book ratio;
- Duffel's core flow is search **and book**, not affiliate metasearch redirect;
- Duffel Links can be branded and monetised via markups, currently documented at $99/month in its Help Center;
- Duffel Links' service agreement states the sale contract is between the Duffel customer and traveller; Duffel is not the seller/merchant of record for that sale.

Consequence:

> Duffel could unblock live Flight Commercial Truth technically, but using it as the V1 booking path would materially move Jetnity toward being a travel seller/booking business rather than the intended neutral comparison/referral product.

Jetnity fit: **STRONG TECHNICAL FALLBACK / WEAK STRATEGIC FIT WITHOUT EXPLICIT BUSINESS-MODEL DECISION.**

No agent may activate Duffel merely because it is easy to access.

## 4. Secondary providers reviewed

### Travelport TripServices Flights

Official current docs expose production/pre-production REST/JSON flight search with GDS/NDC content and OAuth. If a company is not already a Travelport customer, the official Getting Started guide directs it to a Sales Inquiry and credentials are provisioned after onboarding.

Verdict: **technically capable, contract/provisioning-gated, primarily travel-seller infrastructure; not a no-contact immediate V1 unblocker.**

### Amadeus

Amadeus Self-Service was decommissioned on **17 July 2026**; archived Amadeus developer repositories and current industry reporting confirm the shutdown. Enterprise APIs remain a request/contract path.

Verdict: **Self-Service unavailable; Enterprise externally gated.**

### Travelfusion tfFlight API

Official current material describes a global flight aggregation API used by agents, metas and corporate enterprises, with hundreds of LCC/NDC/FSC sources. Customer registration is reviewed by sales and asks for company/booking-volume/commercial information; API use is governed by a signed licence/fee agreement.

Verdict: **strong metasearch/content fit, but sales/contract gated and not an immediate internal coding path. Worth future commercial due diligence if KAYAK/Wego access fails.**

### AirGateway

Official current material offers real-time NDC shopping for 35+ airlines. Public API pricing currently shows roughly €100/month plus a one-time €2,500 implementation fee for the direct API, with a 1:2000 look-to-book rule. The API onboarding form asks for an IATA number and production requires certification.

Verdict: **booking/agency-oriented and creates cost/accreditation gates; not preferred for Jetnity V1 metasearch.**

### PKFARE

Official current material offers 600+ bookable airlines through a B2B Flight API. Buyer workflow is registration → profile → approval → agreement → purchase and is oriented to OTAs, wholesalers, agencies and TMCs.

Verdict: **bookable B2B supply, externally/commercially gated; weaker match than KAYAK/Wego for referral metasearch.**

## 5. Current comparison

| Provider | Real live search | Metasearch/referral fit | Public MAU gate found | Public pre-production path | External approval/contact needed | Current TL posture |
| --- | --- | --- | --- | --- | --- | --- |
| **KAYAK** | yes | **very strong** | **none found** | Sandbox can be requested | yes | **Priority 1 internal due diligence** |
| **Wego** | yes | **very strong** | **none found** | test key documented | registration/agreement required | **Priority 2 internal due diligence** |
| **Skyscanner** | yes | **very strong** | **100K MAU published** | partner access only | yes | long-term preferred, current access blocker |
| **Duffel** | yes | weak for referral / strong for booking | no MAU gate | self-service test path | live activation/verification later | technical fallback only |
| Travelfusion | yes | strong | none found | sales-led | yes | future due diligence |
| Travelport | yes | booking/travel-seller | none found | provisioned pre-prod | yes | not immediate |
| AirGateway | yes | booking/agency | no MAU gate seen | sandbox after validation | yes + IATA/cost | low priority |
| PKFARE | yes | booking/B2B | no MAU gate seen | approval workflow | yes | low priority |

`none found` means only that no MAU threshold was found in the official public pages reviewed. It is **not** a promise of approval.

## 6. Revised Technical-Lead recommendation

The earlier practical assumption that Skyscanner-or-Duffel were the only serious Step-2 choices is now superseded by current public evidence.

Recommended ordering for **internal preparation only**:

1. **KAYAK Affiliate Network Flights API** — strongest combination of explicit start-up positioning, live prices, multi-provider comparison, redirect/affiliate monetisation and no published MAU floor found in current public materials.
2. **Wego Affiliate/Metasearch API** — very strong architecture fit with live search/polling/deeplinks/commission and explicit real-user search policy; 5% Search-to-Click operating constraint needs modelling.
3. **Skyscanner** — remains excellent technically and strategically, but 100K MAU is a current published access blocker unless Jetnity can truthfully evidence it or Skyscanner changes/waives the criterion.
4. **Travelfusion** — credible sales-led meta/search alternative if KAYAK/Wego are unavailable.
5. **Duffel** — technical fallback only if Product Owner explicitly accepts a booking/seller-model change or a bounded exception.

This is **not provider selection**. It is the queue for future access due diligence.

## 7. What can be built now?

### Allowed now

- repository documentation and evidence;
- provider-independent review of existing flight search/Commercial Provenance contracts;
- truthful application-readiness drafts;
- cost/rate-limit modelling from public information;
- mapping tables from public schemas to Jetnity domain **without creating speculative runtime adapters**.

### Not responsible now

- a KAYAK/Wego runtime adapter before access/terms are known;
- speculative provider abstractions beyond existing generic ports;
- TW-8 before real Commercial Truth;
- changing Jetnity into an OTA to exploit Duffel;
- applying/registering/contacting any provider without Product Owner permission.

## 8. Next Product-Owner gate when external action is eventually allowed

The smallest future external gate should be separated by provider:

- **A-KAYAK:** approve submission of the KAYAK partner/Sandbox-access request only;
- **A-WEGO:** approve Wego affiliate registration/terms review only;
- **A-SKYSCANNER:** approve Skyscanner partner/application inquiry only;
- no Gate A automatically authorizes Production S6, secrets, live calls, persistence writer or activation.

Current Product Owner instruction keeps **all external A-gates closed**.

## 9. Hard stop

After this internal precheck, no provider-specific runtime coding is justified until either:

1. Product Owner explicitly authorizes one external access/application path; or
2. new live evidence reveals a genuinely open, contract-compatible provider path that requires no external acceptance action.

Destination Essentials/TW-8/other later V1 steps must not be pulled forward merely to avoid this gate.

**NO PROVIDER SELECTED. NOTHING SUBMITTED. NO CONTACT. NO SECRET. NO LIVE CALL. LIVE-EVIDENCE WINS.**
