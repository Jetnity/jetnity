# Jetnity – KAYAK Flight Application Readiness (NO SUBMIT)

Stand: 1. September 2026  
Status: **INTERNAL PREPARATION ONLY / NOT SUBMITTED / NO CONTACT / NO TERMS ACCEPTED**

Issue: #410  
Parent Product-Owner gate: #395 / `A-KAYAK` **UNAPPROVED**  
Baseline: `main@3f470aab38c1ce048d0574a9d06634208dca5b37`

## 1. Purpose

Prepare truthful answers for the current public KAYAK Affiliate Network / Travel API partner form without submitting the form, contacting KAYAK, accepting Terms/Privacy, obtaining credentials or invoking Sandbox/Production APIs.

Current official public form fields reviewed on 1 September 2026:

1. Full name
2. Business email
3. Company name
4. Website link
5. Tell us about your project
6. Would you like free access to the Sandbox APIs?
7. Privacy Policy / Terms acceptance checkbox
8. Submit

Official public sources:

- `https://affiliates.kayak.com/apis`
- `https://affiliates.kayak.com/apis/flights`
- `https://affiliates.kayak.com/deeplinks`
- `https://affiliates.kayak.com/`

## 2. Current Jetnity applicant truth

| Form/input | Prepared value | Truth state |
| --- | --- | --- |
| Full name | **PRODUCT OWNER INPUT REQUIRED** | No applicant/person name is established as provider-application truth in the repository. |
| Business email | Candidate: `info@jetnity.ch` | Repository legal audit only proves this address is displayed as a general footer contact. **PRODUCT OWNER CONFIRMATION REQUIRED** before using it for a contractual/provider application. |
| Company name | `Jetnity` is the product/brand name | Legal operator/company identity, legal form, commercial register, UID and registered seat are **PRODUCT OWNER + LEGAL INPUT REQUIRED**. Do not falsely represent `Jetnity` as a GmbH/AG/company if not established. |
| Website link | Candidate product domain: `https://jetnity.ch` | Product vision establishes `jetnity.ch` / `jetnity.com` as intended domains. Public reachability/production launch status was not established in this readiness run. **PRODUCT OWNER CONFIRMATION REQUIRED** for the application URL. |
| Sandbox | Prepared answer: **Yes, if Gate A-KAYAK is later approved** | KAYAK publicly offers free Sandbox access inside the application flow. Selecting it in a submitted form remains external action and is not approved now. |
| Terms / Privacy acceptance | **DO NOT ACCEPT** | Acceptance is a Product-Owner/legal external gate. |
| Submit | **DO NOT SUBMIT** | `A-KAYAK` remains UNAPPROVED. |

## 3. Product description – prepared answer

### Recommended concise English draft

> Jetnity is a Switzerland-first intelligent travel planning platform built around one unified trip workspace. It helps travellers structure a complete trip, understand what is still missing, compare relevant travel options and make a small number of transparent, well-explained decisions instead of using isolated search tools. For flights, Jetnity has a provider-neutral search architecture supporting one-way, round-trip and multi-city itineraries with ordered route legs. We are evaluating KAYAK Flights API as a potential metasearch and referral source so users can compare live flight options while Jetnity preserves provider provenance, price freshness and neutral recommendation logic. Jetnity does not intend to rank an option more highly merely because it pays more commission. We would initially use Sandbox access for technical evaluation; any production integration would follow only after KAYAK approval and review of the applicable commercial, privacy, attribution, cache and display terms.

This draft may be edited for length once the live form character limit is known. It must not be submitted without Product-Owner approval.

## 4. Additional business/use-case facts likely relevant in partner review

### Repository-evidenced

- Product: intelligent end-to-end travel planning platform, not a single isolated flight search.
- Market strategy: **Switzerland first**, international later.
- Currency/user posture: Switzerland-first includes CHF and Swiss users.
- Intended domains: `jetnity.ch`, `jetnity.com`.
- Planned internationalization: German, English, French, Italian, Spanish, Portuguese and Polish.
- Business model: travel intermediation / affiliate and API commissions are intended revenue sources.
- Flight architecture: provider-neutral and multi-provider capable; one-way, return and multi-city supported through ordered 1–6 route legs.
- Product truth rule: provider commission must not manipulate Jetnity recommendation/ranking.
- Real Flight provider state: **none selected or active**.
- KAYAK state: internal due-diligence priority only; no contact/application/credentials.
- Production provider activation: hard-off.

### PRODUCT OWNER INPUT REQUIRED

Do not invent or approximate any of these:

- legal entity/operator name;
- legal form;
- commercial-register number / Swiss UID;
- registered/business address;
- applicant/full name and job title;
- exact business email authorized for partner contracts;
- current MAU, sessions, searches or page views;
- launch date / current public traffic state;
- revenue or GMV;
- forecast traffic, searches, clicks or bookings;
- funding/investment status;
- employee/team size;
- existing affiliate conversion metrics;
- banking/tax/payment information;
- any claimed airline/OTA partnership.

## 5. Sandbox readiness position

KAYAK publicly states:

- Sandbox can be requested in the application flow at no charge;
- Sandbox uses safe/test-style data for prototyping;
- production access remains subject to use-case approval and production API keys.

Jetnity Technical-Lead position:

> If `A-KAYAK` is later explicitly approved, request Sandbox first. Do not request or activate production credentials in the same implied decision.

Sandbox objective would be limited to contract/mapping verification and integration feasibility. It would not authorize public launch, paid/live production calls, Production S6, Commercial Provenance writer activation or TW-8.

## 6. Questions that must be answered by KAYAK before production recommendation

1. Is Jetnity eligible for KAYAK Affiliate Network / Flights API production access at its current stage and Switzerland-first launch posture?
2. Are there minimum traffic, MAU, search, click or conversion thresholds not stated on the public pages?
3. What production Flight Search rate limits/quotas apply initially and how are they increased?
4. Is Flights API access free, revenue-share funded, setup-fee based, usage-fee based or subject to another commercial model?
5. What exact click/booking/revenue-share model applies to Jetnity?
6. What identifiers are required for search/click/booking attribution?
7. Does KAYAK require first-party or third-party cookies, local storage, device identifiers or other client-side tracking?
8. What attribution window and last-/first-click rules apply?
9. What search/result data may Jetnity cache and for how long?
10. What offer/search data may Jetnity persist as a user-selected trip snapshot?
11. May Jetnity store normalized provider/price/provenance data without storing raw KAYAK payloads?
12. Are there redisplay/freshness requirements for prices and booking options?
13. What KAYAK/provider branding, logo, attribution or disclosure is mandatory in Flight results?
14. May Jetnity rank results using its own neutral trip-level logic as long as factual provider/price truth is preserved?
15. Are there restrictions on combining KAYAK results with results from other metasearch providers on the same Jetnity surface?
16. Are Switzerland, CHF, German/French/Italian and later EU/EEA markets supported under the intended integration?
17. What DPA/controller/processor relationship applies?
18. Which subprocessors/regions/international-transfer mechanisms apply to Swiss and EEA users?
19. What data retention/deletion obligations apply to search and attribution data?
20. What are the termination, suspension, key-rotation and data-removal obligations?
21. Are API terms distinct from Affiliate Network Terms, and which terms control in case of conflict?
22. What production certification/review evidence is required before launch?

## 7. Technical mapping readiness – no implementation authorization

KAYAK public Flight capabilities align with Jetnity's closed generic Flight request seam:

- one-way: representable;
- round-trip: representable as ordered legs;
- multi-city: representable as ordered legs;
- live fares: Commercial Truth candidate only after actual access/terms;
- multiple providers/booking options: fits Jetnity's provider-normalisation goal;
- two-step updates: future adapter concern, not a new generic foundation requirement.

No KAYAK runtime adapter should be built before `A-KAYAK` produces real account/terms/documentation evidence.

## 8. Submission checklist – all must be explicit before external action

- [ ] Product Owner approved `A-KAYAK` submission.
- [ ] Full applicant name approved.
- [ ] Legal applicant/operator identity approved.
- [ ] Business email approved.
- [ ] Website URL confirmed as the intended application URL.
- [ ] Traffic/MAU answers truthful and evidenced if requested.
- [ ] Project description reviewed.
- [ ] Sandbox request scope confirmed.
- [ ] Current KAYAK Privacy Policy reviewed.
- [ ] Current KAYAK Terms applicable to the form reviewed.
- [ ] No fee/payment is implied by submission without separate approval.
- [ ] No production secret/live-call decision is bundled with application approval.

Until all relevant boxes are satisfied:

**READY FOR INTERNAL REVIEW ONLY — NOT READY TO SUBMIT.**
