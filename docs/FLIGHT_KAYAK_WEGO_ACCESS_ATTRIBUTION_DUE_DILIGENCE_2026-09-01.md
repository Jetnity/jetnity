# Jetnity – V1 Flight KAYAK / Wego Access & Attribution Due Diligence

Stand: 1. September 2026  
Status: **INTERNAL DUE DILIGENCE ONLY / NO PROVIDER SELECTED / NO CONTACT OR APPLICATION / NO RUNTIME CODING AUTHORIZED**

Issue: #407  
Parent Product-Owner gate: #395  
Baseline: `main@c789d2033563c4b1b598a005c85f15ef4f21915a`

## 1. Purpose

This checkpoint deepens the current Flight provider access review without opening any external gate.

Question:

> Does current public KAYAK/Wego evidence prove a provider-independent Jetnity runtime gap that should be built before provider access, or is V1 Step 2 now genuinely blocked on provider/commercial terms?

Hard boundary: nothing in this document authorizes signup, contact, terms acceptance, credentials, fees, Sandbox/live calls, Production S6, Commercial Provenance writer activation, provider runtime adapters, TW-8/TW-9 or Production activation.

## 2. Current official public KAYAK evidence

Reviewed official public material:

- `https://affiliates.kayak.com/apis`
- `https://affiliates.kayak.com/apis/flights`
- `https://affiliates.kayak.com/deeplinks`
- `https://affiliates.kayak.com/`

Confirmed public posture:

- KAYAK positions the Travel APIs for **startups and enterprises**.
- Flights Search advertises live pricing/availability, multiple providers/booking options and one-way/round-trip/multi-city support.
- Flights uses a two-step search model with additional/current results until search completion.
- The Affiliate Network monetises through clicks/bookings/ad revenue.
- Deeplinks preserve affiliate attribution; KAYAK states searches, clicks and bookings can be tied to the integration for reporting/revenue share.
- The partner application flow offers an option to request **free Sandbox API access**.
- KAYAK describes Sandbox data as safe/test-style data for prototyping.
- Production API keys remain approval-gated after use-case review.
- No public MAU minimum was found in the reviewed official pages.

Not established publicly:

- production qualification/traffic criteria;
- production API pricing or fees;
- concrete Flight Search rate limits;
- cache/redisplay TTL;
- raw result persistence/snapshot rights;
- exact Swiss-market production support under a partner contract;
- branding/disclosure obligations;
- detailed revenue-share/CPC/CPA terms;
- DPA/subprocessor/international-transfer terms.

Truth rule:

> `not publicly found` is not `not required` and not `free`.

## 3. Current official public Wego evidence

Reviewed official current Developer material:

- `https://developers.wego.com/docs/affiliate/get-started/`
- `https://developers.wego.com/docs/affiliate/guides/flights/`
- `https://developers.wego.com/docs/affiliate/guides/authentication/`
- `https://developers.wego.com/docs/affiliate/references/authentication/`
- `https://developers.wego.com/docs/affiliate/terms-of-service/`

Confirmed public posture:

- Affiliate Flights Search exposes live airfares.
- One-way, round-trip and multi-city are explicit; a trip can contain more than two legs.
- Search is session-based and results are polled incrementally.
- Wego recommends progressively longer polling intervals; polling is separate from the Search-call limit.
- Only real end-user travel searches are allowed; bots are prohibited.
- Only Wego deeplinks to Wego travel partners may be included in Affiliate search results.
- Published minimum Search-to-Click ratio is **5%**.
- Default rate limit is **50 Search calls/hour for a test key** and **500 Search calls/hour for a regular key**.
- Polling/results calls do not consume the published Search-call quota.
- The regular limit may be increased if the 5% Search-to-Click condition is maintained; Wego states limits may be reduced when it is not maintained.
- Credentials are server-side/client-credentials based; access tokens are intended to be acquired from the backend.
- Current Developer documentation says to **contact Wego for API credentials**.
- Affiliate participation requires registration/acceptance of Wego terms and approved Affiliate Websites.

### 3.1 Pricing conflict / unresolved truth

A separate official Wego company page currently indexed at:

`https://company.wego.com/api-overview/`

states:

- USD 1,000 annual access fee for all Wego APIs;
- a test API key may be provided for up to two weeks before purchase;
- a regular key requires the yearly fee plus a signed API Agreement.

However the current `developers.wego.com` Affiliate Get Started / Terms pages reviewed on 1 September 2026 do **not** repeat that price.

Therefore Jetnity must record:

> **Wego API price = UNCONFIRMED / conflicting official-public evidence.**

No budget assumption may be made from the older page. Price, test duration, payment/refund terms and current Affiliate API economics must be confirmed directly before any Product-Owner approval of spend.

## 4. Jetnity existing architecture against these requirements

### 4.1 Flight route/request truth

Already closed and integrated:

- provider-neutral ordered `legs[]`;
- 1–6 canonical Jetnity legs;
- one-way/return/multi-city on one explicit route model;
- canonical `stopPreference` preserved;
- ranking-only `context` excluded from provider transport input.

Conclusion: KAYAK/Wego multi-city evidence does **not** justify another route-contract slice.

### 4.2 S7 operational observability

`lib/provider-ops/observability.ts` already records payload-safe operational events such as:

- domain;
- provider ID;
- operation (`search` / `evaluate` / `nachweis`);
- outcome;
- duration;
- result/drop counts;
- rate-limit hit;
- timestamp.

This is deliberately best-effort operational health telemetry. It has no durable business-attribution/session measurement contract and must not be repurposed to carry route, traveller, price, token or other sensitive payloads.

Conclusion: do **not** overload S7 with affiliate business analytics.

### 4.3 S5 Commercial Provenance

Jetnity already has Commercial Provenance fields for persisted trip-item truth including:

- affiliate partner ID;
- affiliate click ID;
- affiliate attribution reference.

Production persistence exists, but real runtime writer allocation remains separately closed/gated.

This is item/provenance truth after a commercial option becomes relevant. It is not a general Search-to-Click analytics ledger.

### 4.4 S8 usage-policy hook

`lib/provider-ops/usage-policy.ts` is already fail-closed for:

- cache class;
- persistence class;
- tri-state `attributionRequired`;
- display notice.

It intentionally does not claim vendor-specific contractual rights before reviewed terms exist.

The published Wego 5% Search-to-Click requirement is an **operational/commercial covenant**, not evidence that S8 should be widened now with a speculative universal ratio field. KAYAK's public pages do not expose an equivalent numeric covenant.

## 5. Search-to-Click measurement gap

Current repository evidence does show a real capability gap:

> Jetnity does not currently expose a durable provider-neutral business event ledger that can independently calculate Search-to-Click by provider/account/window.

But current public evidence does **not** yet prove the exact Jetnity persistence contract required:

- Wego calculates/enforces the ratio within its own API/account relationship; public docs do not require the Affiliate to send a separate Jetnity search-event ledger.
- KAYAK advertises Affiliate Portal attribution/reporting for search/click/booking, but public pages do not define the raw event/persistence requirements Jetnity must implement.
- provider contracts may define identifiers, retention, cookie/privacy requirements, reporting endpoints and attribution windows differently.
- adding a generic persistent business-event table now would lock privacy/retention/schema semantics before the provider contract is known.

## 6. Technical-Lead GO / NO-GO decision

### NO-GO: new runtime measurement framework before Gate A

Do **not** start a Cursor coding slice now for:

- a generic Search-to-Click database/table;
- click/session persistence;
- S7 business-event expansion;
- S8 numeric engagement covenants;
- KAYAK/Wego runtime adapter code;
- provider-specific redirect/click handlers.

Reason:

The need for eventual measurement is real, but the required **contract shape is not yet evidenced sufficiently**. Implementing persistence now risks duplication, wrong retention/privacy semantics and provider-specific assumptions hidden inside a generic layer.

### Existing foundations are sufficient for access diligence

Before Gate A, Jetnity already has enough generic foundation to evaluate either provider responsibly:

- multi-leg Flight request truth;
- provider transport/core seam;
- Cost Guard foundation;
- payload-safe operational observability;
- fail-closed usage policy;
- Commercial Provenance model with affiliate identifiers;
- provider activation hard-off.

Therefore V1 Step 2 is now genuinely constrained by provider access/commercial terms, not a missing generic Flight runtime contract.

## 7. Allowed internal work before Gate A

Still allowed:

1. prepare KAYAK application/Sandbox request answers without submitting;
2. prepare Wego registration/API inquiry answers without submitting;
3. map exact questions for rate limits, fee, attribution, cache, persistence, branding, DPA and Swiss market support;
4. draft expected adapter mappings from public schemas as documentation only;
5. keep provider shortlist/current gate documentation accurate.

Not allowed:

- external contact/application/registration;
- accepting terms;
- obtaining or storing secrets;
- paying fees;
- invoking Sandbox/live APIs;
- building provider-specific runtime transport;
- Production S6/writer/activation;
- pulling TW-8, Destination Essentials or another later V1 slice forward to avoid the dependency.

## 8. Current internal priority

Based on current public evidence only:

1. **KAYAK** — priority 1 for access due diligence; strong product/affiliate fit and explicit startup/Sandbox posture, but critical production terms remain private/unknown.
2. **Wego** — priority 2; exceptionally clear technical Affiliate model, but 5% Search-to-Click is a material operating covenant and current pricing has conflicting official-public evidence that must be resolved.
3. **Skyscanner** — strong long-term fit, current published 100K-MAU access blocker.
4. **Travelfusion** — sales-led fallback.
5. **Duffel** — technical fallback only unless Jetnity's neutral referral posture is explicitly changed.

This ordering is not a provider selection.

## 9. Next boundary

The next productive internal action is **application-readiness preparation**, not runtime coding.

The smallest future external decisions remain:

- `A-KAYAK`: submit only the KAYAK partner/Sandbox/API application;
- `A-WEGO`: submit only Wego registration/API contact and review the offered current terms;
- `A-SKYSCANNER`: submit only Skyscanner partner inquiry.

None of these automatically authorize Production S6, secrets, paid/live calls, Commercial Provenance writer allocation or activation.

**NO PROVIDER SELECTED. NO CONTACT. NO APPLICATION. NO TERMS ACCEPTED. NO FEE. NO SECRET. NO LIVE CALL. NO NEW RUNTIME FRAMEWORK. LIVE-EVIDENCE WINS.**
