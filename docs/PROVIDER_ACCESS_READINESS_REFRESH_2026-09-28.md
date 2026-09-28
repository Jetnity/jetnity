# Jetnity — Provider Access Readiness Refresh

Date: 28 September 2026  
Status: **READ-ONLY REFRESH COMPLETE / A-KAYAK-INQUIRY-1 SENT / WAITING FOR KAYAK RESPONSE**

Task: `docs/PROVIDER_ACCESS_READINESS_REFRESH_TASK_2026-09-28.md`  
Task base: `main@d86aabbea373e47f5f7b8eda789aecfc31c39224`

## Follow-up — A-KAYAK-INQUIRY-1 executed

Product Owner approved the bounded inquiry and sent it from `info@jetnity.ch` to KAYAK's published `partnerships@kayak.com` contact.

Subject: `Jetnity – Pre-launch inquiry for KAYAK Flights API Sandbox access`

The sent message:
- describes Jetnity truthfully as a Switzerland-first pre-launch travel-planning platform;
- states interest in evaluating KAYAK for a possible long-term partnership;
- asks for Flights Sandbox eligibility and Production traffic/cost/rate-limit/cache/attribution/Swiss-market/privacy terms;
- does not claim a traffic threshold, public launch, existing provider relationship or Production access.

Not performed:
- no KAYAK public-form submission;
- no Terms/Privacy acceptance;
- no signup/account creation;
- no API key/secret;
- no Sandbox/live API call;
- no spend;
- no runtime adapter work;
- no Production activation or indexing change.

Current boundary: **WAITING FOR KAYAK RESPONSE**. The Technical Lead must review the full reply and any linked terms before any next external, contractual, credential, API or implementation step.

## 1. Executive conclusion

Jetnity's shared provider architecture is not the blocker. The current blocker remains **external provider access and provider-specific commercial/legal truth**.

Fresh official-public evidence makes **KAYAK the smallest responsible next access path to investigate**:

- KAYAK publicly describes its Travel API as suitable for startups and enterprises.
- Its public API flow explicitly offers a request for free Sandbox access.
- Flights API supports live fares, one-way, return and multi-city search in Production.
- The reviewed public API/application pages do not state a minimum MAU or unique-visitor threshold.
- Production access remains approval-gated and its important commercial/licence/privacy details are not public enough to build against safely.

However, the public KAYAK application form requires acceptance of KAYAK's Privacy Policy and Terms and Conditions. Those Terms are binding and state that a person acting for a legal entity represents authority to bind that entity. Therefore a full form submission is a Product-Owner/legal external gate and is **not** the smallest first action.

KAYAK also publishes `partnerships@kayak.com` as an alternative contact route. The smallest responsible next step is therefore a **single bounded pre-application/Sandbox inquiry**, without form submission or Terms acceptance, asking KAYAK to confirm pre-launch eligibility and the missing Production/commercial/licence facts.

No provider has been selected or activated by this refresh.

## 2. Live Jetnity truth used for this refresh

### Repository / runtime

- Live task base at start: `main@d86aabbea373e47f5f7b8eda789aecfc31c39224`.
- Push CI on that exact main: SUCCESS.
- Vercel Production is READY on that exact SHA and aliases `jetnity.com`.
- Mode: `NORMAL`.
- No current Cursor/runtime writer is authorized.
- Old Draft PRs #52/#50/#40/#39/#28 are historical/stale and thousands of commits behind current main.

### Supabase / provider activation

- Production project: `qscbgcdmivbbnzrcyegn`.
- Development branch: `yfvbxvijcorffwxbxahl`.
- Production account-erasure Edge Functions: 0; the Development-only deletion function remains isolated to Development.
- Production provider activation remains hard-off. No provider secret/live call was introduced by this task.

### Public/product/legal readiness

- `jetnity.com` is attached to the current READY Production deployment.
- Official PrivacyBee `/privacy` and `/impressum` were technically accepted on Production on 27 September; the imprint exposes the approved operator identity (Feirov Global Trading / EIU), public contact and UID through the vendor-owned legal surface.
- Public indexing remains intentionally disabled (`noindex, nofollow`; robots disallow-all).
- `/terms` remains unbuilt under Product-Owner/legal gate #587.
- PrivacyBee's Infomaniak legal-basis wording residual remains tracked in #585.
- Jetnity must not invent current MAU, unique visitors, searches, bookings, revenue, GMV, conversion, provider relationships or launch status for an application.

This is a credible **pre-developed pre-launch product**, not a public-traffic business. Provider outreach must describe it exactly that way.

## 3. Current provider matrix

| Provider | Affiliate/referral access | Sandbox/Test | Production/live access | Current public qualification/economics | Jetnity fit now |
| --- | --- | --- | --- | --- | --- |
| **KAYAK** | Affiliate Network offers deeplinks, widgets, whitelabel and APIs with click/booking/ad monetisation. | Public API form allows requesting **free Sandbox API access** with test-style data. | Use case must be approved as a full affiliate integration before Production API keys. | Reviewed current API pages state “startups and enterprises”; no numeric traffic threshold is stated there. Production price/rate-limit/cache/licence/DPA terms remain insufficiently public. | **Best current access diligence path.** Strong referral/metasearch fit; unknown Production terms must be obtained before coding real transport. |
| **Skyscanner** | Affiliate programme supports widgets, banners and text links. | No equivalent open API Sandbox path established by this refresh. | Travel API is case-by-case for established businesses. | Travel API rejects low-traffic sites below **100K MAU**. Affiliate programme requires a complete HTTPS site and **>5,000 unique visitors/month**. | **Long-term strong fit, currently traffic-blocked.** Do not apply with invented/projection traffic. |
| **Wego** | Affiliate API is a referral/metasearch handoff to Wego travel partners. | Test key: public company page says up to two weeks; current developer docs publish 50 searches/hour for test keys. | Regular key: 500 searches/hour by default; 5% Search-to-Click covenant. | Official company page still states **USD 1,000 annual API fee**, signed API Agreement and no refund after payment. Current Affiliate Terms auto-renew yearly and treat referred search users as Wego customers, with Wego owning information generated by such users. | **Technically good but commercial/privacy risk is material.** Not the first gate while KAYAK has a no-fee Sandbox inquiry path. |
| **Duffel** | Not primarily a referral/metasearch affiliate product; it is a search-to-order airline retailing API. | Self-service test mode is available, but test schedules/prices are not reliable real Commercial Truth. | Live prices require account activation. | Public pricing: USD 3/order; Managed Content 1% of order value; USD 2/paid ancillary; excess search fee above 1500:1 at USD 0.005/excess search. | **Viable technical fallback, wrong first business model.** Would pull Jetnity toward transactional booking/agency responsibilities. |
| **Travelfusion** | Supports metas/search engines as customers, but its core Flight API is transactional Search & Book. | Test/onboarding is sales-led; no open self-service Sandbox route established. | Registration, signed licence agreement and sales onboarding; fees are contract-defined. | Current public material requires agreement with Travelfusion and says API use is subject to fees in the licence agreement. | **Serious enterprise fallback, but not the smallest pre-launch access path.** |
| **Amadeus (extra check)** | Not added to the active shortlist. | Historical Self-Service was previously startup-friendly. | Current Amadeus portal states the Self-Service portal was decommissioned on **17 July** and now exposes Enterprise API access. | Enterprise access is request/consultant-led. | **No longer a stronger startup-access alternative than KAYAK/Duffel.** |

## 4. Official public evidence — refreshed 28 September 2026

### KAYAK

Reviewed:

- https://affiliates.kayak.com/apis
- https://affiliates.kayak.com/apis/flights
- https://affiliates.kayak.com/deeplinks
- https://affiliates.kayak.com/
- https://www.kayak.com/terms-of-use
- https://www.kayak.com/privacy

Current public facts:

- Travel APIs: Flights, Hotels, Cars, Travel Data and Ads.
- Public description: built for startups and enterprises.
- API application: business/use-case details, website, optional free Sandbox request.
- Sandbox: safe/test-style data for prototyping.
- Production keys: only after use-case approval/full affiliate integration.
- Flights: one-way, round-trip and multi-city; multiple providers; live fares/availability in the real API.
- Deeplinks: affiliate attribution ties clicks/searches/bookings to the integration.
- Application form requires Privacy Policy + Terms acceptance.
- Email alternative is published: `partnerships@kayak.com`.

Still not established publicly enough for Jetnity Production:

- numeric Production qualification/traffic threshold;
- Production API fee/pricing;
- exact Flights rate limits;
- cache/persistence/redisplay rights and TTL;
- branding/display obligations;
- exact revenue share/CPC/CPA terms;
- Swiss-market contractual scope;
- controller/processor roles, DPA/subprocessor/transfer terms;
- attribution identifiers/windows for the intended API flow.

### Skyscanner

Reviewed:

- https://www.partners.skyscanner.net/product/travel-api
- https://www.partners.skyscanner.net/contact/travel-api
- https://www.partners.skyscanner.net/product/affiliates

Current public facts:

- Travel API is commercial and case-by-case.
- Travel API minimum: **100K monthly active users** for websites; startups without robust business plans and pre-developed products are also excluded.
- Affiliate programme is a separate path and requires:
  - complete working website;
  - HTTPS;
  - traffic above 5,000 unique visitors/month;
  - current travel content;
  - good UX;
  - site must not book tickets for customers.
- Affiliate tools are widgets, banners and text links.
- Widgets can be used without affiliate signup, but then no commission is earned.

Conclusion:

Jetnity's pre-developed product condition has improved materially, but no truthful evidence establishes either traffic threshold. Skyscanner remains blocked now.

### Wego

Reviewed:

- https://developers.wego.com/docs/affiliate/get-started/
- https://developers.wego.com/docs/affiliate/guides/flights/
- https://developers.wego.com/docs/affiliate/guides/authentication/
- https://developers.wego.com/docs/affiliate/terms-of-service/
- https://company.wego.com/api-overview/

Current public facts:

- live flight fares; one-way/return/multi-city;
- search session + polling;
- credentials kept private/backend-side;
- 5% minimum Search-to-Click ratio;
- 50 Search calls/hour test key; 500/hour regular key by default;
- real end-user searches only, no bots;
- only Wego deeplinks to Wego partners in Affiliate results;
- API credentials require contact;
- company page states USD 1,000/year, up to two-week test key, signed API Agreement and no refund after payment;
- Affiliate Terms: initial one-year term, recurring one-year renewal, 30-day end-of-term notice;
- referred travel-search users are considered Wego customers and Wego states it owns information generated by them;
- Wego may vary referral commercial terms and some referrals may be non-monetized.

Conclusion:

The old September concern is not stale; it remains materially current. Do not spend or accept these terms without dedicated PO/legal review.

### Duffel

Reviewed:

- https://duffel.com/docs/api/overview/test-mode
- https://help.duffel.com/hc/en-gb/articles/4410085835282-Are-the-flight-prices-in-test-mode-sandbox-real
- https://duffel.com/pricing
- https://duffel.com/docs/api/offer-requests

Current public facts:

- test mode uses separate test tokens and is safe from real bookings/spend;
- sandbox schedules/prices are not reliable real/live prices;
- real live prices require account activation;
- one-way/return are represented through slices, and the API returns bookable offers;
- current public fees include USD 3/order, 1% Managed Content, USD 2/paid ancillary and an excess-search fee above 1500:1.

Conclusion:

Duffel can unblock technical booking-engine development, but it is not equivalent to Jetnity's desired neutral referral/metasearch relationship.

### Travelfusion

Reviewed:

- https://corporate.travelfusion.com/resources/xml-api
- https://corporate.travelfusion.com/products-services/tf-flight-api
- https://www.travelfusion.com/terms

Current public facts:

- Direct Connect XML/API supports broad airline/NDC content and real-time search/book;
- registration is the first onboarding step;
- API use is subject to fees in a signed licence agreement;
- current product is explicitly sold to agents, metas, corporate and e-commerce travel sites;
- integration remains sales/contact-led.

Conclusion:

Commercially serious, but not a faster/no-commitment access path than KAYAK.

### Amadeus — extra candidate check

Reviewed:

- https://developers.amadeus.com/
- current Enterprise portal landing page
- retained developer documentation surfaced by search

Current live landing-page fact:

- Amadeus states its Self-Service portal was decommissioned on 17 July and the current site is the Enterprise API Portal.

The older Self-Service pricing/startup material may remain indexed, but it must not be used as current proof of a newly available self-service signup route.

Conclusion:

Do not add Amadeus as the sixth active candidate in this decision package.

## 5. Jetnity application-readiness truth

### Strong evidence Jetnity can truthfully present

- working Production domain: `https://jetnity.com`;
- deployed pre-developed product, not merely an idea;
- Switzerland-first positioning;
- provider-neutral Flight architecture;
- one-way/round-trip/multi-city route model;
- Trip Workspace, Account/Traveller foundations and production-grade security/governance work;
- provider-neutral Commercial Provenance, Cost Guard foundations, observability and fail-closed usage-policy architecture;
- official privacy and imprint surfaces;
- legal operator identity is available from the official imprint;
- explicit plan to prototype in Sandbox before any Production activation.

### Evidence Jetnity must **not** claim yet

- public launch;
- meaningful public traffic;
- 5,000 monthly unique visitors;
- 100,000 MAU;
- current booking/conversion metrics;
- current affiliate revenue;
- an existing live Flight provider;
- Production API credentials;
- provider approval;
- completed public Terms/AGB page.

## 6. Risk snapshot

This severity snapshot distinguishes **current incidents** from **pre-launch gates**.

### P0 — immediate ship/runtime incident

**None found in this reconstruction.**

Current `main` CI is green, current Vercel Production is READY on exact main, and no provider/Production mutation occurred during this refresh.

### P1 — launch-critical/open gate

1. **#395 — no real Flight provider access / Commercial Truth provider.**
   - Blocks the intended real Flight comparison value proposition.
   - Generic provider engineering is already sufficient; external access is the missing dependency.

2. **#587 — public Terms/AGB path absent.**
   - `/terms` remains unbuilt and is a legal launch gate.
   - This should not be disguised by hand-written legal text.

3. **#592 — Production account-erasure activation.**
   - Development proof is closed 11/11. Historical task-creation state in this refresh: Production Edge Function and graph-cascade activation were still gated. Later on 28 September 2026 the Technical Lead applied and verified `20260928123859_reise_graph_kaskade_tiefe`. Function deployment remains gated. This refresh did not apply the migration.
   - This is a pre-launch/privacy capability gate, not a current Production incident.

### P2 — material pre-launch residual

1. **#585 — PrivacyBee Infomaniak legal-basis wording.**
2. Provider-specific Production pricing/licence/cache/DPA/attribution terms remain unknown.
3. Wego's current contract/data-ownership posture is a material risk if Wego is reconsidered.
4. Public indexing is intentionally off; it must stay off until the separate launch gate.

### P3 — housekeeping / no current runtime effect

- historical open Drafts #52/#50/#40/#39/#28 remain stale and must not be mistaken for active work;
- old provider-readiness documents remain useful historical evidence but are superseded where this report records newer public facts.

## 7. Exact first unfinished step

The exact first unfinished productive step is **not another provider runtime coding slice**.

It is:

> Obtain Product-Owner approval for one bounded KAYAK pre-application/Sandbox inquiry, sent without submitting the public application form and without accepting KAYAK Terms.

Why this is the smallest step:

- KAYAK is the only reviewed metasearch/referral candidate that currently advertises startup API use and a free Sandbox request without publishing a numeric traffic threshold.
- A direct inquiry avoids falsely presenting public traffic.
- It avoids immediately binding Jetnity through the form's Terms checkbox.
- It can determine whether Jetnity's pre-launch status is acceptable before consuming application goodwill.
- It can obtain the provider-specific facts required before any adapter/runtime work.

## 8. Product-Owner decision package — A-KAYAK-INQUIRY-1

### Decision requested

Authorize exactly **one non-binding provider inquiry** to KAYAK's published partnership contact.

### Authorized scope if approved

The inquiry may state only truthful current facts:

- Jetnity is a Switzerland-first, pre-launch travel-planning platform;
- `https://jetnity.com` is the current product website;
- the product is pre-developed and provider-neutral;
- Jetnity is evaluating the KAYAK Flights API;
- Jetnity wants **Sandbox/evaluation access first**, not Production activation;
- current public traffic is not represented as meeting any threshold.

Ask KAYAK to confirm:

1. whether a pre-launch startup may receive Flights API Sandbox access;
2. whether any current MAU/traffic requirement applies to Sandbox or Production;
3. current Production API pricing/fees and commercial model;
4. Flights search/rate limits and any Search-to-Click requirement;
5. cache, persistence, redisplay and price-freshness rules;
6. attribution, deeplink and branding obligations;
7. Swiss-market support;
8. DPA/controller/processor/subprocessor/international-transfer position;
9. whether separate Affiliate/API terms apply beyond the public KAYAK website Terms.

### Still **not** authorized by A-KAYAK-INQUIRY-1

- submitting the KAYAK public form;
- accepting KAYAK Terms/Privacy on behalf of Jetnity;
- creating an affiliate/API account;
- requesting or storing API secrets;
- invoking Sandbox or Production;
- paying any fee;
- implementing a KAYAK runtime adapter;
- Production Cost Guard/S6 activation;
- Commercial Provenance writer activation;
- public launch/indexing.

### Recommended decision

**Approve A-KAYAK-INQUIRY-1 only.**

Do not approve Wego spend, Duffel business-model change, Travelfusion sales onboarding, Skyscanner application, KAYAK form/Terms acceptance, credentials or live calls in the same decision.

## 9. Stop boundary

The bounded inquiry has been sent. Work now stops until KAYAK responds. No signup, form submission, Terms acceptance, credential creation, API call, spend, runtime implementation or Production activation follows automatically.
