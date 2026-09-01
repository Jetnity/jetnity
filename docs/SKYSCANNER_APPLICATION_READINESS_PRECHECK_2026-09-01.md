# Jetnity – Skyscanner Application Readiness Precheck

Stand: 1. September 2026  
Status: **INTERNAL PREPARATION ONLY / DO NOT SUBMIT / DO NOT CONTACT PROVIDER / GATE A UNAPPROVED**

Issue: #398  
Parent Product-Owner gate: #395  
Baseline: `main@f4cfa4c28668ad86c93152cff0f58e459bd5bed5`

## 1. Purpose

This is an internal readiness check for a possible future Skyscanner Travel API / Flights Live Prices application. It prepares truthful evidence and identifies missing inputs. It does **not** submit an application, contact Skyscanner, create an account, accept terms, request an API key, or authorize any provider/Production action.

The Product Owner has explicitly allowed internal checking/preparation only. External Gate A remains **UNAPPROVED**.

## 2. Current official Skyscanner access criteria

Official public source checked on 2026-09-01:

`https://www.partners.skyscanner.net/contact/travel-api`

The page currently states:

- Travel API is for commercial use only;
- selection targets established businesses with a large audience and alignment with Skyscanner's brand/values;
- access is not provided to students/non-commercial individuals;
- access is not provided to start-ups without a robust business plan and pre-developed product;
- access is not provided to low-traffic websites, with a published minimum of **100K monthly active users**;
- access is not provided to web-development agencies;
- partner selection remains case-by-case.

Additional official sources checked:

- `https://www.partners.skyscanner.net/product/travel-api`
- `https://developers.skyscanner.net/docs/getting-started/authentication`
- `https://developers.skyscanner.net/docs/flights-live-prices/quick-start`
- `https://developers.skyscanner.net/docs/flights-live-prices/tracking`

Public documentation is not binding commercial terms. Contract, DPA, licence/cache/redisplay, attribution and partner-specific rate-limit truth remains unknown until Skyscanner provides it.

## 3. Jetnity eligibility matrix

| Criterion | Current Jetnity evidence | Verdict |
| --- | --- | --- |
| Commercial product intent | Affiliate/referral/booking handoff and revenue attribution are explicit Phase-1 goals | **SUPPORTED** |
| Pre-developed product | Production-deployed product, Trip Workspace, Account/Traveller foundations, provider-neutral flight domain and offline Skyscanner adapter are already implemented | **SUPPORTED** |
| Robust product strategy | Binding three-phase strategy, V1 critical build order, Definition of Done and release gate exist | **SUPPORTED** |
| Robust external business plan | Product/monetisation strategy exists, but a formal provider-facing business plan with evidence-backed market/financial/traffic assumptions is not established by this precheck | **PARTIAL** |
| Large audience | No qualifying audience evidence is established by repository evidence | **NOT EVIDENCED** |
| >=100K MAU website | Current MAU is not proven in repository evidence and must never be guessed or fabricated | **NOT EVIDENCED / APPLICATION BLOCKER UNTIL PROVEN** |
| Public website readiness | Product is deployed, but public launch/indexing remains separately gated; pre-launch state must be described truthfully | **PARTIAL** |
| Brand/product alignment | Traveller-first comparison and trip intelligence are conceptually aligned; final acceptance is solely Skyscanner's decision | **PLAUSIBLE / EXTERNAL DECISION** |
| User-initiated search design | Jetnity's flight UX is designed around explicit traveller searches; automated provider calls remain prohibited | **SUPPORTED BY ARCHITECTURE** |
| Server-side credentials | Existing provider architecture requires server-only secrets | **SUPPORTED BY ARCHITECTURE** |
| Price freshness/revalidation | S5 Commercial Provenance and stale/recheck foundations exist; Skyscanner Refresh Prices can map into this only after contract/access | **SUPPORTED FOUNDATION** |
| Cost controls | S6-A repository foundation exists; Production S6 is intentionally unapplied and gated | **FOUNDATION ONLY / PRODUCTION GATED** |
| Observability | Provider S7 is closed | **SUPPORTED** |
| Cache/licence policy | S8 shared fail-closed hook exists; vendor-specific rights remain unknown | **FOUNDATION ONLY / CONTRACT REQUIRED** |
| Attribution | Phase-1 attribution foundation exists; Skyscanner documents Impact-based tracking | **SUPPORTED FOUNDATION / ONBOARDING REQUIRED** |
| PII-safe tracking | Jetnity architecture forbids sensitive traveller/document leakage; Skyscanner also prohibits PII in tracking parameters | **SUPPORTED BY DESIGN** |

## 4. Hard readiness verdict

### Current submission verdict: **NOT READY TO SUBMIT**

Reason:

> The published **100K MAU** condition is not currently satisfied by any evidence available to this Technical Lead. Jetnity must not claim that threshold unless it can be independently evidenced.

This conclusion does not say Jetnity is technically immature. The opposite is true: Jetnity has substantial pre-developed product and integration architecture. The blocker is **commercial access qualification**, not generic engineering readiness.

No application should be submitted merely to “try” while presenting invented traffic, projected traffic as current MAU, or ambiguous audience claims.

## 5. Truthful draft provider narrative — internal only

The following is a reusable internal draft, not a submission:

> Jetnity is building a traveller-first trip intelligence and organisation platform with Switzerland as its first launch market. The product combines a structured Trip Workspace, route/transit truth, traveller context, travel-readiness logic and provider-neutral commercial comparison surfaces. Jetnity is not intended to become a merchant-of-record flight OTA in Phase 1; the flight experience is designed to help travellers compare real current options and continue to the relevant booking provider.
>
> The product is pre-developed and deployed in a controlled pre-launch environment. Jetnity already maintains a provider-neutral flight domain, Commercial Provenance/freshness contracts, provider observability, cost-control foundations and an offline Skyscanner adapter boundary. A future Skyscanner integration would use server-side credentials, user-initiated searches only, no automated bulk Live Pricing requests, PII-free tracking parameters, compliant booking deeplinks and explicit price refresh/recheck semantics.
>
> Jetnity's Phase-1 objective is to become production-ready for real travellers before a controlled Swiss launch, then expand based on measured product and commercial evidence.

Do **not** append claims about MAU, revenue, company size, awards, customers, conversion or launch dates unless independently true and evidenced at submission time.

## 6. Product-Owner inputs required before any future application

The following fields are not to be invented by an agent:

1. legal company/entity name;
2. legal form and jurisdiction;
3. registered business address if required;
4. provider-facing contact name/title;
5. provider-facing email/phone if required;
6. current website/domain to present to Skyscanner;
7. current **verified MAU** and evidence source;
8. current traffic geography/source mix;
9. current public-launch status;
10. evidence-backed traffic/growth history;
11. formal external business-plan summary where required;
12. commercial/revenue assumptions that the Product Owner is willing to disclose;
13. expected launch markets and timing where disclosure is appropriate;
14. any existing affiliate/provider relationships the Product Owner chooses to disclose.

Forecasts must be labelled forecasts. They can never substitute for current MAU when the provider asks for current traffic.

## 7. Integration evidence already available for a future application

If Gate A is later approved and the access criterion is genuinely met or Skyscanner changes its criteria, Jetnity can truthfully point to:

- provider-neutral Flight contracts;
- offline Skyscanner adapter foundation from PR #185/#186;
- server transport core foundation;
- S5 Commercial Provenance contract;
- Production S5-B persistence foundation with no active writer;
- S6-A persistent Cost Guard repository foundation, still hard-off in Production;
- S7 provider observability;
- S8 fail-closed cache/persistence/attribution policy hook;
- Trip Workspace foundations and future TW-8 integration seam;
- explicit user-initiated-search and no-PII boundaries;
- V1 release/readiness governance.

This is materially stronger than presenting only a product idea or mock-up.

## 8. Access-risk fallback recheck

Current official/public-source recheck on 2026-09-01 also found:

### Aviasales / Travelpayouts real-time Flight Search API

Official Help Center currently requires **50,000 MAU** for Search API access. Projects below the threshold, including pre-launch projects, are directed to the Data API instead.

The Data API uses cached historical search-price data (roughly 2–7 day storage depending on query) and is intended for informational/content use. It is **not equivalent to real current V1 Flight Commercial Truth**.

Sources:

- `https://support.travelpayouts.com/hc/en-us/articles/210995808-How-to-get-access-to-the-Aviasales-Search-API`
- `https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access`

### Kiwi.com API via Travelpayouts

Current Travelpayouts documentation states that a Project needs **50,000 MAU** for Kiwi.com API access.

Source:

- `https://support.travelpayouts.com/hc/en-us/articles/360019237899-Kiwi-com-affiliate-program-API`

### Consequence

Jetnity should not assume that swapping Skyscanner for another classic metasearch affiliate API removes the pre-launch access problem.

## 9. Current options — no option is automatically approved

### Option 1 — meet/evidence Skyscanner access threshold, then apply

Best strategic fit, but cannot unblock V1 engineering today without qualifying access.

### Option 2 — later approve a bounded Skyscanner access conversation/application

Only if the Product Owner explicitly opens Gate A. This may confirm whether any case-by-case path exists, but Jetnity must not assume an exception to the published 100K criterion.

### Option 3 — evaluate a startup-accessible live Flight provider even if its model is booking-oriented

Duffel remains the best-developed technical fallback currently known in the repository, but its search-to-book economics and booking-agency model conflict with Jetnity's preferred metasearch/referral posture. Any choice here is a genuine Product-Owner business-model decision, not an engineering shortcut.

### Option 4 — weaken the V1 Flight Commercial Truth requirement

**Not recommended.** Cached/indicative data, white-label-only search or generic referral links should not silently be reclassified as real current Commercial Truth. Any V1 exception would require an explicit Product-Owner decision and a corresponding update to the binding V1 release contract.

## 10. Technical-Lead recommendation

1. Keep **Skyscanner** as the preferred long-term/meta-search fit.
2. Do not submit an application while the 100K MAU criterion is not evidenced.
3. Do not fabricate traffic or use forecasts as current MAU.
4. Keep Gate A external engagement closed under the current Product-Owner instruction.
5. Treat V1 Step 2 as an **external-access blocker**, not as missing generic Jetnity engineering.
6. If the Product Owner wants V1 engineering to continue before Skyscanner eligibility, the next decision must explicitly choose between:
   - evaluating a startup-accessible live provider with a potentially different commercial model; or
   - approving a narrowly bounded V1 provider/Commercial-Truth exception.
7. Do not start TW-8 until real Commercial Truth exists.

## 11. Explicit non-actions

This precheck performs no:

- Skyscanner application or form submission;
- provider email/contact/support request;
- Travelpayouts/Kiwi/Duffel signup or application;
- contract/ToS/DPA acceptance;
- API key/secret creation or storage;
- paid/live provider call;
- Production S6 apply/runtime principal/HMAC/budget;
- Commercial Provenance writer allocation or write;
- TW-8/TW-9 runtime work;
- public launch/indexing action.

**CHECK ONLY. DO NOT SUBMIT. LIVE-EVIDENCE WINS. NO TRAFFIC CLAIM WITHOUT EVIDENCE.**
