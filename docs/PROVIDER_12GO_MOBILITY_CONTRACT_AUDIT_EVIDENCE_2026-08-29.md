# Provider 12Go Mobility – First-Party Evidence Log

Stand: 29. August 2026  
Status: **AUDIT EVIDENCE ONLY / KEIN SIGNUP / KEIN API-CALL / KEIN SECRET**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Observed Cursor run title: `12Go mobility adapter audit`  
Cloud-Run: https://cursor.com/agents/bc-0266753e-bd4f-4c88-9330-5ebe1fb87b88  
Exact Run-ID: `bc-0266753e-bd4f-4c88-9330-5ebe1fb87b88`  
Task: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_TASK_2026-08-29.md`

> Nur öffentlich erreichbare First-Party-Seiten. HTTP GET ohne Login, ohne Registrierung, ohne API-Key, ohne bezahlten Call. Kein Scraping von Suchergebnissen. Kein Partner-Dashboard.

> Drittquellen (Wikipedia, Parse.bot, inoffizielle GitHub-SDKs, App-Store-Fließtext) sind **keine** Vertragsquelle und werden hier nicht als 12Go-API-Wahrheit verwendet.

## 1. Abrufprotokoll

Alle Abrufe am **2026-08-29** zwischen ca. `15:47Z` und `15:48Z`, User-Agent `JetnityContractAudit/1.0 (docs-only; no signup)`.

| ID | URL | Title / beobachteter Titel | HTTP | Fetched-at (UTC) | Klasse |
| --- | --- | --- | --- | --- | --- |
| E-AFF-01 | https://agent.12go.asia/en | 12Go Travel Affiliate Program: Earn Commission on Bookings | 200 | 2026-08-29T15:47:21Z | Affiliate-Programm, öffentlich |
| E-AFF-02 | https://agent.12go.asia/agreement | 12Go Affiliate Program | 200 | 2026-08-29T15:47:22Z | Affiliate Terms, öffentlich; Version date **16 July 2025** |
| E-CON-01 | https://12go.asia/en/about | About / Multimodal Travel (kein `<title>` im ersten 200 KB-Schnitt) | 200 | 2026-08-29T15:47:24Z | Consumer About |
| E-CON-02 | https://12go.com/en/about | About auf `12go.com` | 200 | 2026-08-29T15:47:29Z | Consumer About, zweite kanonische Domain |
| E-CON-03 | https://12go.asia/en/terms | TERMS OF USE | 200 | 2026-08-29T15:47:26Z | Consumer Terms |
| E-CON-04 | https://12go.asia/en/FAQ | Frequently Asked Questions | 200 | 2026-08-29T15:47:27Z | Consumer FAQ |
| E-CON-05 | https://12go.asia/en | 12Go: Book Trains, Buses, Ferries, Transfers & Flights | 200 | 2026-08-29T15:47:36Z | Homepage / öffentliche URL-Muster |
| E-CON-06 | https://12go.com/en | 12Go - Train, Bus, Ferry, Transfer & Flight Cheap Tickets Online | 200 | 2026-08-29T15:47:38Z | Homepage `.com` |
| E-PRI-01 | https://12go.asia/en/privacy | — | **404** | 2026-08-29T15:47:30Z | Nicht kanonisch |
| E-PRI-02 | https://12go.asia/en/privacy-policy | #12GO PRIVACY POLICY | 200 | 2026-08-29T15:48:40Z | Privacy Policy |
| E-PRI-03 | https://12go.com/en/privacy-policy | #12GO PRIVACY POLICY | 200 | 2026-08-29T15:48:40Z | Privacy Policy, zweite Domain |
| E-RES-01 | https://reseller.12go.asia/ | 12Go Reseller Program \| Travel Agent Portal | 200 | 2026-08-29T15:47:31Z | Reseller, getrennt vom Affiliate |
| E-BLOG-01 | https://blog.12go.asia/12go-white-label/ | 12Go White Label | 200 | 2026-08-29T15:47:32Z | Affiliate-Blog, White Label |
| E-BLOG-02 | https://blog.12go.asia/allowed-types-of-traffic-12go-terms-and-rules/ | Allowed Types of Traffic: 12Go Terms and Rules | 200 | 2026-08-29T15:47:34Z | Affiliate-Traffic-Regeln |
| E-BLOG-03 | https://blog.12go.asia/category/integration/ | Integration Archives | observed via search; nicht als API-Spec verwendet | Affiliate-Blog-Index |
| E-SUP-01 | https://12go.asia/en/support | Support | 200 | 2026-08-29T15:48:40Z | Support-Hub, kein API-Vertrag |

Nicht abgerufen, weil Login/Signup oder Partner-Dashboard:

- `https://agent.12go.asia/` Login/Register-Formulare wurden nicht abgeschickt.
- `https://agent.12go.asia/whitelabel/` erfordert Affiliate-Account.
- Reseller-Register/Login nicht abgeschickt.
- Kein `op.12go.asia` Operator-Portal (About nennt es; Zugang **UNKNOWN / approval-gated**).

## 2. Was öffentlich belegt ist vs. UNKNOWN

| Thema | Öffentlich belegt | UNKNOWN / approval-gated / vertraulich |
| --- | --- | --- |
| Rechtsträger | 12Go Asia Pte. Ltd.; 12Go Thailand Co., Ltd.; 12Go Europe Ltd. (Zahlungen) | Interne Konzern-/Travelier-Verträge |
| Sites | `https://12go.asia`, `https://12go.com` (Affiliate Terms Definition) | Weitere Produktions-Hosts |
| Affiliate-Enrollment | Kostenlos bewerben; Freigabe per E-Mail; Website nicht zwingend; Social möglich | Annahme-Kriterien, SLA, Ablehnungsgründe |
| API-Zugang | Nur nach Kontakt + etabliertem Website + **prior consent**; zusätzliche **confidential conditions** | Endpunkte, Auth, Environments, Quotas, Rate Limits, Error-Codes, Payload-Felder |
| Data feeds | Als „more complex solution“ genannt | Format, Felder, Lizenz, Refresh |
| Deep-links | Unique partner ID; 30-Tage last-click Cookie; Sub-ID am Ende der Links | Parameter-Namen, Encoding, Pflichtfelder, Signatur |
| Search form / timetable / banners | Als No-Code-Tools genannt | Embed-Snippet, erlaubte Hosts, Felder |
| White Label | `*.12go.asia` oder CNAME `whitelabel.12go.asia` | Advanced Settings, Filtervertrag |
| iframe | **verboten** (Traffic-Regeln) | — |
| Scraping / Bots | Consumer Terms verbieten Bots/Scrapers | — |
| Modi | Train, bus, ferry, van, taxi, flights; About zusätzlich daytrips, car rent; Terms zusätzlich helicopters, shuttle, rail passes | Exakte API-Enum, Cabin/Class-Taxonomie |
| Suche | Origin, destination, date, passengers; Sortierung Departure + Transportart | Request-Schema, Pagination, Filter |
| Orte | Öffentliche Slug-URLs `/{locale}/travel/{origin}/{destination}` | Station-IDs, Place-Graph, Aliase, Zeitzonen-IDs |
| Preise | Ändern sich; Checkout-Preis gilt; Service-/Convenience-Fees möglich | Währungsfeld im API, Fee-Breakdown, Conversion |
| Verfügbarkeit | Checkout zeigt Sitze; Bahn-TH-Quota ≠ Live-Railway; fehlender Buy-Button = nicht buchbar | Availability-Enum, Hold/Reserve |
| Buchung | 12Go ist Intermediär; Vertrag Endkunde↔Supplier; Affiliate leitet weiter, 12Go zahlt/bucht | API-Booking-Felder, Merchant-of-Record im API-Pfad |
| Reseller | Eigenes Portal; Agent bucht; Deposit THB/USD/EUR | Jetnity-Pfad: **nicht** der vorgeschlagene Consumer-Adapter |
| Storno | Supplier Product Terms; Antrag i. d. R. ≥ 24 h vor Abfahrt; 12Go-Servicefees oft nicht erstattbar | Pro-Operator-Regeln als API-Feld |
| Locales | Viele UI-Locales beobachtet (Privacy-Chrome) | Welche Locales die API akzeptiert |
| Auth API | — | **UNKNOWN** |
| Sandbox | — | **UNKNOWN** |

## 3. Bewusst nicht als Evidence verwendet

- Parse.bot „12go Train API“ — ausdrücklich inoffizieller Wrapper.
- `tmvrus/remote-api-sdk` — Operator-Inbound-SDK, kein Affiliate-Outbound-Vertrag.
- Wikipedia / Pressemitteilungen zu Travelier/Bookaway — Kontext, kein Integrationsvertrag.
- Apple-App-Store-Beschreibung — Marketing, nicht First-Party-Webvertrag.

## 4. Methode

1. Öffentliche First-Party-URLs per HTTP GET gelesen.
2. Affiliate Terms vollständig gelesen (Version 16 July 2025).
3. Consumer Terms, FAQ, About, Privacy Policy, Reseller-Landing, White-Label- und Traffic-Blog gelesen.
4. Homepage-HTML nur auf öffentliche `href="/en/travel/..."`-Muster geprüft; **keine** Ticket-Suche ausgelöst, **keine** Ergebnisse als Fahrplan-Truth gespeichert.
5. Alles, was hinter Login, Approval oder Confidential Conditions liegt, bleibt `UNKNOWN`.
