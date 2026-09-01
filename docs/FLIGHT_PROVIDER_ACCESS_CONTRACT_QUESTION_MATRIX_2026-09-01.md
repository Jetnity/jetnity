# Jetnity – Flight Provider Access / Contract Question Matrix

Stand: 1. September 2026  
Status: **INTERNAL PREPARATION / NO PROVIDER CONTACT / NO PROVIDER SELECTED**

Issue: #410  
Parent Product-Owner gate: #395

Purpose: provide one provider-neutral checklist for KAYAK, Wego, Skyscanner or another future Flight provider. This matrix prevents Jetnity from treating missing contract facts as permission.

Truth rule:

> **Unknown commercial/licence/privacy term = fail closed.**

## 1. Access and qualification

| Question | Why Jetnity needs it | KAYAK public state | Wego public state | Required before |
| --- | --- | --- | --- | --- |
| Is Jetnity eligible at current traffic/product stage? | Avoid integration to an inaccessible provider. | Startup positioning public; exact production criteria private/unknown. | Contact/approval required; exact eligibility unknown. | Provider-specific Gate A recommendation |
| Minimum MAU/traffic/search volume? | Avoid false business claims and blocked production. | No public minimum found in reviewed material. | No general MAU floor found in reviewed current docs; 5% Search-to-Click is public. | Gate A / contract review |
| Sandbox/test access available? | Safe feasibility evaluation. | Public free Sandbox option in application flow. | Test key publicly referenced; current access/term details require confirmation. | Gate A |
| Test duration? | Planning and cost control. | Not publicly established. | Older official page says max two weeks; current Developer pages do not clearly restate it. **UNCONFIRMED**. | Before test activation |
| Production certification/review? | Know launch gate. | Production keys after use-case approval; details unknown. | Regular key/approval terms require confirmation. | Before C/E |

## 2. Pricing and economics

Questions for every provider:

1. Setup fee?
2. Annual/monthly platform fee?
3. Per-search/per-call fee?
4. Included quota?
5. Overage price?
6. Minimum commitment?
7. Revenue-share/CPC/CPA/booking commission formula?
8. Can commercial terms change during the contract?
9. Can referrals/searches be non-monetized?
10. Payout threshold/currency/method?
11. Taxes/VAT/withholding obligations for a Swiss partner?
12. Refund rights if access is withdrawn?
13. Suspension consequences?
14. Cost of Sandbox/test access?

Current evidence:

- KAYAK: public pages emphasize affiliate monetization and free Sandbox; production pricing/fees are not established publicly.
- Wego: older official company page states USD 1,000/year; current Developer Affiliate pages reviewed do not repeat the figure. Treat current price as **UNCONFIRMED**, not as budget truth.

No spend may be approved from public ambiguity.

## 3. API quota / operational controls

For each provider confirm:

- initial searches/hour;
- daily/monthly quota;
- polling/result-fetch accounting;
- retry accounting;
- 429/retry policy;
- burst limits;
- concurrency limits;
- timeout recommendations;
- rate-limit increase process;
- production kill/suspension rules;
- contractual Search-to-Click/Search-to-Book covenants;
- how those ratios are calculated;
- monitoring/reporting available to Jetnity.

Wego public evidence currently provides 50 Search calls/hour for test keys, 500/hour regular, polling excluded and >=5% Search-to-Click. These remain Wego-specific policy, not Jetnity generic constants.

## 4. Search and product semantics

Confirm:

- one-way support;
- round-trip support;
- multi-city maximum legs;
- passenger/child/infant semantics;
- cabin mapping;
- stop/nonstop support;
- nearby airport/flexible-date semantics;
- market/site/locale/currency rules;
- baggage and fee completeness;
- fare-family semantics;
- split-ticket/hacker-fare semantics;
- result completion/polling model;
- revalidation/refresh model before redirect;
- provider/OTA/airline identity requirements.

Jetnity must adapt vendor semantics into its own provider-neutral contract; it must not make vendor-specific fields the new Jetnity truth model.

## 5. Cache / persistence / redisplay

Require explicit answers for:

1. May raw responses be cached?
2. Cache TTL?
3. May normalized offers be cached?
4. May a user-selected fare be persisted in a Trip Workspace?
5. Which fields may persist: itinerary, provider, amount, currency, timestamps, identifiers, deeplink?
6. May historical price snapshots be shown?
7. Must price be revalidated before redirect?
8. Can results be reused across users/sessions?
9. Must cached data be deleted at contract termination?
10. Are logos/static reference datasets subject to different rights?

Jetnity S8 remains fail-closed until reviewed vendor terms establish these rights.

## 6. Attribution / clicks / cookies

Confirm:

- required partner/affiliate ID;
- search/session ID;
- click ID;
- attribution reference;
- attribution window;
- first/last-touch rule;
- cross-device treatment;
- cookie use and lifetime;
- local-storage/device-ID use;
- consent/disclosure requirements;
- server-side attribution support;
- reporting/export APIs or portal;
- booking/conversion callback/webhook availability;
- rules when multiple Jetnity providers are shown;
- whether Jetnity may maintain its own business event ledger and for how long.

Do not overload S7 operational observability with these fields.

## 7. Display / ranking / competition

Jetnity requires answers to:

1. Required provider/affiliate attribution wording?
2. Mandatory logos/brand placement?
3. Price disclaimer requirements?
4. May Jetnity show results from multiple metasearch providers on one comparison surface?
5. May results be deduplicated across providers?
6. May Jetnity rank using total trip value, duration, stop count and friction rather than provider commission?
7. Are sponsored/paid placements required to be distinguished?
8. Can provider commission ever constrain display ordering?
9. Can Jetnity explain that a more expensive option may be recommended because it saves meaningful travel time?
10. Are direct airline/OTA names allowed alongside provider attribution?

Binding Jetnity principle: provider compensation must never silently become recommendation truth.

## 8. Privacy / data protection

Before any live integration establish:

- roles: independent controllers / joint controllers / controller-processor / other;
- DPA/data sharing agreement availability;
- purpose limitation;
- required search data fields;
- IP/device/network data processing;
- whether stable Jetnity user IDs are required;
- cookie/device identifier behavior;
- data residency;
- subprocessors;
- CH/EEA international transfers and safeguards;
- retention;
- deletion;
- data-subject access/export obligations;
- breach notification/cooperation;
- children's traveller data implications;
- whether provider terms claim ownership/control over end-user-generated information.

Wego is currently **LEGAL/PRIVACY HOLD** because its public Affiliate Terms state referred search users are Wego customers and that Wego will own information generated by such users. Exact impact on API integration requires legal review.

## 9. Contract hierarchy / lifecycle

For every provider obtain:

- Affiliate Terms;
- API Agreement;
- DPA/data-sharing agreement;
- pricing schedule;
- acceptable-use policy;
- branding guidelines;
- technical production requirements;
- SLA/support terms;
- suspension rights;
- termination rights;
- renewal rules;
- amendment rights;
- post-termination data/brand removal obligations;
- governing law/jurisdiction;
- liability/indemnity terms.

If multiple documents conflict, record which contract controls. Do not infer precedence except where the provider terms explicitly state it.

## 10. Switzerland-first readiness

Confirm:

- Switzerland supported as market/site origin;
- CHF prices supported;
- German, French and Italian localization supported as needed;
- Swiss consumer/data-protection implications;
- EEA scaling path;
- payout to Swiss entity/account;
- tax/VAT documentation;
- Swiss/EEA DPA/transfer provisions;
- support contact/time zone.

## 11. Jetnity gate mapping

### Gate A – external access only

May authorize only:

- application/contact/registration;
- receiving terms/documentation;
- requesting Sandbox/test access if explicitly included.

Does **not** authorize:

- Production S6;
- provider secret storage/use;
- real/paid call;
- Commercial Provenance runtime writer;
- production activation.

### Gate B – Production Cost Guard

Requires actual provider quota/economic truth before >0 budget/policy.

### Gate C – first bounded real/paid call

Requires selected provider, access, reviewed terms, secret handling and Cost Guard.

### Gate D – Commercial Provenance writer

Requires actual provider attribution/persistence contract.

### Gate E – Production activation

Requires complete technical, legal/privacy, commercial and release evidence.

## 12. Current conclusion

- KAYAK: strongest current access-diligence candidate; application can be prepared but not submitted.
- Wego: technically strong but **LEGAL/PRIVACY HOLD** before submission recommendation.
- Skyscanner: strong long-term product fit; public 100K-MAU threshold remains a current obstacle.
- No provider is selected.
- No generic runtime framework is justified merely to avoid provider access/contract dependency.

**LIVE EVIDENCE WINS. UNKNOWN TERMS FAIL CLOSED. NO CONTACT OR SUBMISSION WITHOUT EXPLICIT PRODUCT-OWNER APPROVAL.**
