# Provider Viator Activities — Contract Audit Evidence

Stand: 29. August 2026  
Status: **AUDIT EVIDENCE ONLY / KEINE IMPLEMENTIERUNG / KEINE PRODUCTION-AKTIVIERUNG**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Auftrag: `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Evidence-Abruf: 29. August 2026, first-party HTML, keine API-Calls, kein Signup, keine Keys

> Dieses Dokument rekonstruiert den **aktuellen offiziellen Viator-Partner-API-Vertrag** für affiliate-artige Tours/Activities. Die grobe Zielwahl ist bereits gesetzt: **Viator first, GetYourGuide später**. Das ist keine Production-Aktivierung, kein Signup und kein Credential-Gate. ADR-0078 bleibt die Domain-Architektur (`ActivityProvider`, Search ≠ Booking), nicht ein offenes PO-Wahl-Gate.

> Agent-Self-Review ist kein PASS. Kein Ready. Kein Merge. Kein Folgeslice.

---

## 1. Primärquellen

Aktuelle first-party Dokumentation, abgerufen am 29. August 2026. Keine Drittblogs, keine erfundenen Schemas.

| # | Titel | URL | Letztes dokumentiertes Update in der Quelle | Rolle |
| --- | --- | --- | --- | --- |
| P1 | Partner-API documentation home | https://docs.viator.com/partner-api/ | kein datiertes Changelog auf der Home; beschreibt Merchant vs Affiliate | Kategoriegrenze |
| P2 | Viator Partner API (2.0) | https://docs.viator.com/partner-api/technical/ | **18 Aug 2026** (Rate Limiting präzisiert) | **Primärvertrag** |
| P3 | Viator API Documentation & Specification – Affiliate Partners (1.0) | https://docs.viator.com/partner-api/affiliate/technical/ | **26 May 2022** (Review authenticity) | Historische VBA-/Content-Affiliate-Spezifikation, nicht der aktuelle v2-Vertrag |
| P4 | Viator API Documentation & Specification – Merchant Partners (1.0.0) | https://docs.viator.com/partner-api/merchant/technical/ | Merchant-Spezifikation; verweist VBAs auf P3 | Kontrast Merchant-of-Record |
| P5 | Travel commerce solutions | https://partnerresources.viator.com/travel-commerce/ | undatiert; Partner Qualification genannt | Affiliate- vs Merchant-Produkt |
| P6 | Technical Guide – Viator Partner API | https://partnerresources.viator.com/travel-commerce/technical-guide/ | undatiert; verweist auf P2 für Endpoint-Zugang | Business-/Onboarding-Überblick |
| P7 | Viator API Certification | https://partnerresources.viator.com/travel-commerce/certification/ | **15 Jul 2025** | Zertifizierung, Usage-Rules, Full+Booking vs Merchant |
| P8 | Affiliate Attribution: How It Works | https://partnerresources.viator.com/travel-commerce/affiliate-attribution/ | undatiert; Cookie **30 Tage** | Attribution / `productUrl` |
| P9 | Golden Path \| Basic Access Affiliate Partners | https://partnerresources.viator.com/travel-commerce/golden-path/ | undatiert | Kleinste Affiliate-on-demand-Integration; ältere Production-URL-Beispiele sind Drift |
| P10 | Managing product availability data | https://partnerresources.viator.com/travel-commerce/managing-product-availability-data/ | undatiert | `/availability/check` nach Datum + Passenger-Mix, vor bookable items |
| P11 | Front-End Guide for API Partners | https://partnerresources.viator.com/travel-commerce/front-end/ | 17 Mar 2021 | SRP vs PDP; Essential Product Information |
| P12 | Affiliate attribution guidance (Partner Resource Center) | https://partnerresources.viator.com/blog/attribution/ | first-party Attribution-Hinweis | `rel="sponsored"` / Tracking-Parameter intakt |

Support-Kontakt in P2/P3/P6/P8: `affiliateapi@tripadvisor.com`. Kein Kontakt aufgenommen.

Nicht als Primärquelle verwendet: inoffizielle SDKs, erfundene OpenAPI-Kopien. P12 ist first-party Attribution-Guidance, kein Drittblog.

---

## 2. Zwei Spezifikationslinien — nicht vermischen

Es gibt **zwei first-party API-Linien**. Jetnity darf sie nicht zu einem Schema zusammenziehen.

### 2.1 Partner API v2 — Current Truth

P2 ist die aktuelle technische Spezifikation. Titel: **Viator Partner API (2.0)**. Pflichtheader:

- `exp-api-key`
- `Accept-Language`
- `Accept: application/json;version=2.0` — ohne Versionsparameter antwortet die API mit HTTP 400 `INVALID_HEADER_VALUE`

Umgebungen laut P2 Testing:

| Umgebung | Base URL | Erlaubte Nutzung |
| --- | --- | --- |
| Sandbox | `https://api.sandbox.viator.com` | **All testing must be done in Sandbox** |
| Production | `https://api.viator.com` | **Production endpoints are for live bookings only and must not be used for testing under any circumstances** |

Postman-Collections existieren getrennt für: Basic-access Affiliate, Full-access Affiliate, Full-access + Booking Affiliate, Merchant.

### 2.2 Affiliate Partners spec 1.0 — historische VBA-Linie

P3 beschreibt **Viator Branded Affiliates (VBAs)** mit älteren Pfaden (`/search/products`, `/product`, `webURL`, Legacy-`apiKey` Query). Letztes Update **26 May 2022**. P4 verweist VBAs ausdrücklich auf P3.

Diese Linie ist Evidence, dass Affiliate-Verkauf **Redirect auf viator.com** ist. Sie ist **nicht** der zukünftige Jetnity-Adaptervertrag.

### 2.3 Dokumentwiderspruch, Lesart 2026-08-29

P9 Golden Path zeigt ein älteres Beispiel gegen `https://api.viator.com/partner/products/search`. **Aktueller v2-Vertrag (P2/P6):** All testing must be done in Sandbox; Production endpoints are for live bookings only. `VIA-UNK-01` ist **Dokumentationsdrift / non-blocking**. Ältere Production-URL-Beispiele autorisieren keinen Production-Test. Sandbox fail-closed ist der Binding-Testvertrag.

P2 Localization: `zh-TW`, `zh-CN`, `ko`/`ko-KR` sind **merchant partners only**. P8 Attribution: Affiliates hätten Zugang zu allen gelisteten Sprachen inklusive zh/ko. **Nicht geraten.** Offen als `VIA-UNK-02`.

P1/P2: Cookie gilt „until the cookie expires“. P8: Attribution **30 days**. Beide Aussagen stehen. Jetnity darf keine andere Laufzeit erfinden.

---

## 3. Affiliate vs Merchant — harte Fähigkeitsgrenze

Rekonstruiert aus P1, P2, P5, P7. Vier Zugangsklassen in P2:

| Klasse | Merchant of Record | Verkaufsort | Transaktionale Booking-Endpoints | Jetnity-Lesart dieses Audits |
| --- | --- | --- | --- | --- |
| Basic-access Affiliate | Viator | Redirect viator.com | nein | Kleinste Content-/Preview-Integration (P9) |
| Full-access Affiliate | Viator | Redirect viator.com | nein; inkl. Whitelabel | Content + Schedules + Real-time `/availability/check` + Reviews |
| Full-access + Booking Affiliate | **Viator bleibt MoR**; Partner übermittelt Zahlungsdaten PCI-konform | Booking über Cart-API | Cart hold/book/cancel/amend; **nicht** `/bookings/hold` oder `/bookings/book` | Kein Affiliate-Redirect-Modell; Payment-/PCI-Gate |
| Merchant | **Partner ist MoR** | Checkout auf Partnerseite | alle Booking-Endpoints inkl. `/bookings/hold` + `/bookings/book` | Invoice, Support, Markup; Product-Owner-Sondergate |

P5 Affiliate API, wörtlich:

- Traffic is redirected to Viator to complete transaction
- Viator is merchant of record
- Viator handles customer service
- Partner earns a commission every time a product is booked

P5 Merchant API, wörtlich:

- Transaction occurs on partner's website
- Partner is merchant of record
- Partner handles customer service
- Partner can markup or discount pricing

P2 Full-access Affiliate: Zugang zu **allen nicht-transaktionalen** Endpoints; **keine** Booking-, Hold- oder Cancellation-Endpoints. P2 Full-access + Booking: zusätzlich Cart-Booking. P2 Merchant: alle Endpoints. P7: Full+Booking-Partner dürfen `/bookings/hold` und `/bookings/book` **nicht** nutzen; sie müssen `/bookings/cart/hold` vor `/bookings/cart/book` implementieren.

**Empfohlene Zugangsklasse auf dem bereits akzeptierten Target Viator:** Full-access Affiliate auf v2, **ohne** Full+Booking und **ohne** Merchant. Begründung in `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_CONTRACT_2026-08-29.md`. Signup, Zugang, Vertrag, Credentials, paid calls, Production-Aktivierung und jedes Full+Booking-/Merchant-Modell bleiben getrennte PO-Gates. Die grobe Wahl „Viator first“ wird nicht erneut geöffnet.

---

## 4. Endpoint-Zugang (P2, Stand der Tabelle in P2)

| Endpoint | Basic Aff. | Full Aff. | Full+Booking Aff. | Merchant |
| --- | --- | --- | --- | --- |
| `/products/modified-since` | ❌ | ✅ | ✅ | ✅ |
| `/products/bulk` | ❌ | ✅ | ✅ | ✅ |
| `/products/{product-code}` | ✅ | ✅ | ✅ | ✅ |
| `/products/tags` | ✅ | ✅ | ✅ | ✅ |
| `/products/booking-questions` | ❌ | ❌ | ✅ | ✅ |
| `/products/search` | ✅ | ✅ | ✅ | ✅ |
| `/products/recommendations` | ❌ | ✅ | ✅ | ✅ |
| `/attractions/search` | ✅ | ✅ | ✅ | ✅ |
| `/attractions/{attraction-id}` | ✅ | ✅ | ✅ | ✅ |
| `/availability/check` | ❌ | ✅ | ✅ | ✅ |
| `/availability/schedules/{product-code}` | ✅ | ✅ | ✅ | ✅ |
| `/availability/schedules/bulk` | ❌ | ✅ | ✅ | ✅ |
| `/availability/schedules/modified-since` | ❌ | ✅ | ✅ | ✅ |
| `/bookings/cart/hold` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/cart/book` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/hold` | ❌ | ❌ | ❌ | ✅ |
| `/bookings/book` | ❌ | ❌ | ❌ | ✅ |
| `/bookings/status` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/cancel-reasons` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/{booking-reference}/cancel-quote` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/{booking-reference}/cancel` | ❌ | ❌ | ✅ | ✅ |
| `/bookings/modified-since` | ✅ | ✅ | ✅ | ✅ |
| `/bookings/modified-since/acknowledge` | ❌ | ❌ | ✅ | ✅ |
| `/amendment/*` | ❌ | ❌ | ✅ | ✅ |
| `/v1/checkoutsessions/{sessionToken}/paymentaccounts` | ❌ | ❌ | ✅ | ❌ |
| `/search/freetext` | ✅ | ✅ | ✅ | ✅ |
| `/destinations` | ✅ | ✅ | ✅ | ✅ |
| `/locations/bulk` | ✅ | ✅ | ✅ | ✅ |
| `/exchange-rates` | ✅ | ✅ | ✅ | ✅ |
| `/reviews/product` | ❌ | ✅ | ✅ | ✅ |
| `/suppliers/search/product-codes` | ❌ | ✅ | ✅ | ✅ |

P2 Update 11 Sep 2025: `/bookings/modified-since` ist für **alle** Partnerklassen geöffnet. Das ist ein **Lesepfad für Booking-Events**, kein Recht, Buchungen anzulegen. Basic/Full Affiliates, die nie selbst buchen, haben in diesem Audit **keinen belegten Nutzen** für diesen Endpoint. Nicht in den zukünftigen Affiliate-Adapter aufnehmen, solange keine eigene Evidence für affiliate-taugliche Event-Semantik vorliegt (`VIA-UNK-03`).

**Für Affiliate-style Jetnity ausdrücklich nicht erforderlich und nicht zu implementieren:**

- `/bookings/cart/hold`, `/bookings/cart/book`
- `/bookings/hold`, `/bookings/book`
- Cancel-/Amendment-/Payment-Endpoints
- `/products/booking-questions` (nur Full+Booking/Merchant)

P3 VBA: „Affiliate partners do not manage any aspect of the booking process.“ Redirect-Feld dort: `webURL`. In v2: `productUrl`.

---

## 5. Zugang / Onboarding

Belegt:

- P5: alle Partner unterliegen **Partner Qualification**.
- P2 Support: Onboarding über `affiliateapi@tripadvisor.com`. Merchant-Sites müssen vor Go-live zertifiziert werden.
- P6: Endpoint-Zugang hängt von Partnerklasse ab.
- P7: vor Launch muss Viator jede Zertifizierungsanforderung prüfen; Forms an `affiliateapi@tripadvisor.com`. Usage-Rules sind verbindlich; Abweichung braucht vorherige Freigabe.
- P9: Basic-Affiliate-Key wird im Account unter Tools → Affiliate API erzeugt, **nach E-Mail-Verifikation**.

Nicht belegt und deshalb unbekannt:

- ob Jetnity bereits qualifiziert oder abgelehnt ist
- konkrete Commission-Sätze
- Vertragstexte, Cookie-/Datenverarbeitungszusätze, Kosten
- ob Full-access ohne gesonderte Freigabe aus einem Basic-Account gehoben werden kann (`VIA-UNK-04`)

**Dieser Slice hat kein Signup, keinen Key und keinen Sandbox-Call ausgeführt.**

---

## 6. Authentifizierung

P2/P3:

| Mechanismus | Status | Transport |
| --- | --- | --- |
| Header `exp-api-key` | aktuell | jeder Call |
| Query `apiKey` | Legacy, nur P3; P3 rät zur Migration | URI |

P2: eine Organisation hat **einen** Key; Sprache ist nicht mehr key-gebunden, sondern `Accept-Language` pro Call.

Dokumentationsbeispiele enthalten Platzhalter-UUIDs. Sie sind **keine** Jetnity-Secrets und dürfen nicht als Zugang behandelt werden.

Zukünftiger Jetnity-Transport: server-only, kein `NEXT_PUBLIC_*`, kein Client-Bundle. Nicht in diesem Slice.

---

## 7. Suche / Discovery

P2 `/products/search` (Basic und Full):

- Pflicht: `filtering`, `currency`
- Optional: `sorting`, `pagination`, Query `campaign-value`, `target-lander`
- **Nicht** für Katalog-Ingestion; dafür `/products/modified-since` (Full+)
- „At present, only active products are returned“
- Filterbeispiel in P2: `destination`, `tags`, `flags` (`LIKELY_TO_SELL_OUT`, `FREE_CANCELLATION`), Preisband, `startDate`/`endDate`, `includeAutomaticTranslations`, `confirmationType`, `durationInMinutes`, `rating`
- Sort-Beispiel: `TRAVELER_RATING` / `PRICE`
- P9 Preview-Felder: title, thumbnail, short description, average rating, review count, price
- Zusatz: `/search/freetext`, `/products/{product-code}`, `/attractions/*`, `/destinations`, `/products/tags`

Destination in v2 ist eine **Viator-`destinationId`** (String/Number, z. B. `"732"`, `"77"` für USA). Das ist **nicht** Jetnitys `placeId`. Mapping ist Viator-spezifisch und heute unbelegt (`VIA-UNK-05`).

P6 Technical Guide dokumentiert `/destinations` für Basic, Full, Full+Booking und Merchant; Destination-Daten wöchentlich cachen. P9 nennt zusätzlich älteres `/v1/taxonomy/destinations`. `VIA-UNK-06` ist **reklassifiziert**: aktueller v2-Adapter nutzt `/destinations`. Legacy-Golden-Path-Taxonomie bleibt historische Evidence, kein Blocker, solange ein Live-Account nichts anderes beweist.

---

## 8. Verfügbarkeit, Preis, Traveller-Kombinationen

### 8.1 Schedules (Basic: nur single-product; Full: auch bulk/modified-since)

- Preis in **Supplier-Währung**
- Identifiers: `productCode` + `productOptionCode` + Season + `daysOfWeek` + `startTime` + `unavailableDates`
- `summary.fromPrice` basiert auf **RRP**
- P2 wörtlich: **affiliate partners must sell at this price**; Merchant setzen eigene Preise, außer sie verkaufen zum RRP
- Leeres `bookableItems` ⇒ Produkt inaktiv / nicht buchbar
- Schedules **dürfen nicht** als endgültige Verfügbarkeit vor Booking behandelt werden. P2: immer `/availability/check` für den finalen Check. Basic **kann** `/availability/check` nicht.

### 8.2 Real-time `/availability/check` (Full-access Affiliate, Full+Booking, Merchant — nicht Basic)

Request: `productCode`, `travelDate`, `currency`, `paxMix[]` (`ageBand` + `numberOfTravelers`); optional `productOptionCode`, `startTime`.

Response: `currency`, `productCode`, `travelDate`, `bookableItems[]` mit `available`, `lineItems` (RRP, `partnerNetPrice`, `bookingFee`, `partnerTotalPrice`).

P6 markiert `/availability/check` ausdrücklich für **Full-access Affiliates**. P10: erst nach gewähltem Travel-Date + Passenger-Mix; in der Regel unmittelbar bevor bookable items (Optionen/Startzeiten) gezeigt werden; nicht für Bulk/Kalender-Ingestion.

`VIA-UNK-07` ist **resolved** für Full-access-Affiliate-Semantik. Offenes Gate: ob Jetnity **Full-access** genehmigt bekommt — nicht, ob ein Full-access-Affiliate den Endpoint rufen darf. Basic bleibt ohne Check. Redirect-Checkout kann danach abweichen; keine erfundene Freshness-TTL.

P2 Booking-Workflow (Merchant/Full+Booking): Check-Währung für Invoice ist eine von **GBP, EUR, USD, CAD, AUD**. Das ist Invoice-Währung, nicht automatisch Anzeige-Währung.

### 8.3 Age bands

P2: `ADULT`, `CHILD`, `INFANT`, `YOUTH`, `SENIOR`, `TRAVELER` (nur Unit-Pricing). Ranges sind **supplier-defined**, keine Defaults. Ein einziges Adult-Band 18–99 schließt Kinder und >99 aus.

Jetnity `ActivitySuchanfrage` hat nur `participants: number`. Ein stilles „alle sind ADULT“ wäre erfunden.

### 8.4 Booking questions / Pass / Citizenship

`/products/booking-questions` ist für Basic/Full Affiliate **gesperrt**. Der Katalog (P2 Beispiel) enthält u. a. `PASSPORT_NATIONALITY`, `PASSPORT_PASSPORT_NO`, `PASSPORT_EXPIRY`, `DATE_OF_BIRTH`, Height/Weight. Das betrifft **Merchant/Full+Booking-Checkout**, nicht den Affiliate-Redirect.

Traveller-Context-Prüfung dieses Audits: **Staatsbürgerschaft/Dokumente sind für Affiliate-Suche/Redirect nicht erforderlich und dürfen nicht erhoben werden.** Altersband kann Live-Preis ändern; das ist Missing-Facts, kein Shadow-Identity-Modell.

---

## 9. Identifiers

| Viator-Feld | Bedeutung | Jetnity-Naht |
| --- | --- | --- |
| `productCode` | Produkt, z. B. `5010SYDNEY`, `92457P4` | Kandidat für `externalRef` (provider-scoped) |
| `productOptionCode` | Variante / Tour Grade, z. B. `TG1`, `48HOUR`, `DEFAULT` | Kandidat für `providerOfferId`; nicht Refresh-Schlüssel nach ADR-0168 |
| `destinationId` / filter `destination` | Viator-Taxonomie COUNTRY/REGION/CITY | Nicht Jetnity-`placeId` |
| `attractionId` / historisch `seoId` (P3) | Attraction | Optional, nicht Trip-Item-Identität |
| `productUrl` | Affiliate-Redirect, nur Affiliate-Antworten | Getrennte Attribution-Naht, nicht `ActivityOption` |

P2: `DEFAULT` productOptionCodes werden nicht mehr weggelassen; Weglassen bleibt rückwärtskompatibel, wird aber nicht empfohlen.

`externalRef` bleibt provider-scoped (`viator` + `productCode`). Fixture darf keine Live-Identität behaupten.

---

## 10. Währungen

P2 `/products/search` `currency` (Stand P2 inkl. Update 4 Feb 2025):

`AED ARS AUD BRL CAD CHF CLP CNY COP DKK EUR FJD GBP HKD IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PEN PHP PLN RUB SEK SGD THB TRY TWD USD VND ZAR`

P3 Affiliate-v1-Liste ist kürzer und **veraltet** gegenüber v2.

P2 harte Truth-Kante: *The currency you display to your users may not be the currency they see when they click through to the viator.com site. Instead, they will see the default currency for the locale from which they are accessing the site.*

Jetnity S5-A: keine stille Conversion; `requestedCurrency != quotedCurrency` ohne Conversion-Evidence = mismatch. `/exchange-rates` hat `expiry`; Conversion ohne belegten Kurs bleibt verboten.

Ingested schedule pricing ist Supplier-Währung. Search-`fromPrice` ist in der Request-Währung denominiert, aber **kein** Live-Quote für eine konkrete Pax-Mischung.

---

## 11. Storno / Terms

P2 Cancellation-API-Abschnitt gilt ausdrücklich nur für **Full Access + Booking und Merchant**.

Product-Content enthält `cancellationPolicy` (`STANDARD` ≈ 24h full refund / 100% Penalty darunter; etwa 85% der Produkte; plus custom / all-sales-final). Affiliates dürfen diese Policy **anzeigen**, nicht über API stornieren.

P2: Merchant können Kunden andere Terms geben, werden aber nach Viator-Policy invoiced. Für Affiliates irrelevant, weil Viator MoR ist.

P3 `/support/terms` existiert in der VBA-Linie; in P2-Access-Tabelle nicht als v2-Endpoint geführt. Nicht als v2-Vertrag behaupten (`VIA-UNK-08`).

`FREE_CANCELLATION` ist ein Search-Flag, kein Beweis für Jetnity-`stornierbar=true` ohne Policy-Objekt.

---

## 12. Photos / Reviews / Unique Content

P2 Product-Content: Images (Supplier + Traveler), Review-Summary, optional `/reviews/product` (nicht Basic). Reviews werden täglich aggregiert. Review-Authentizität: nur Booking-Kunden auf Viator; Tripadvisor-Reviews eigene Moderation.

**Protecting unique content (P2, Zertifizierung):**

- Review-Volltexte und `viatorUniqueContent` dürfen **nicht** im indexierbaren Page-Source stehen
- Pflichtmuster: externer JS-Load + `robots.txt` Disallow
- Unique Content nur wenn für den Account enabled

Jetnity Production ist derzeit `noindex`. Das **ersetzt nicht** die Viator-Zertifizierungsregel, sobald Inhalte gerendert werden. Empfehlung: Review-Volltexte und `viatorUniqueContent` in der ersten Affiliate-Foundation weglassen.

P9: Traveler photos empfohlen, nicht Pflicht.

P7/P11 Essential Product Information vor Booking/Redirect-PDP: title, images, description, inclusions, exclusions, additionalInfo, cancellationPolicy, languageGuides, itinerary, ticketInfo, logistics.start, logistics.end — plus option-level language-guide/logistics, wo zutreffend. Die erste offline Search-Foundation ist **search/preview only** und beansprucht keine zertifizierte PDP/Redirect-Aktivierung. Ein späteres `product_detail`-Gate muss diese Felder erhalten, bevor Product-Detail-UI oder Affiliate-Redirect live geht. Review-Volltexte / `viatorUniqueContent` bleiben separat verboten.

---

## 13. Affiliate-URL / Tracking

P2 `productUrl` (nur Affiliate-Antworten):

- vollständige URL, **nicht verändern** (Tracking-Parameter byte-identisch erhalten)
- enthält Attribution (`pid`, `mcid`, `medium=api`, Version)
- `campaign-value` ≤ 200 Zeichen, nicht-alphanumerisch URL-encoden; P8 rät alphanumerisch + Bindestrich; nur bounded non-PII opaque/campaign token; nie E-Mail, Reisendenname, Pass, Roh-Trip-Titel oder sensible IDs; über den unterstützten API-Request-Parameter senden, damit Viator die attribuierte URL zurückgibt
- Default: conversion-optimierte Affiliate-Landingpage; `target-lander=NONE` landet auf Standard-PDP
- Whitelabel: custom domain statt viator.com — nur **server-seitig konfigurierte Allowlist** Viator-eigener oder vertraglich freigegebener Hosts; unbekanntes `https:`-Host ⇒ Attribution/Deeplink ablehnen, nicht redirecten; Allowlist nicht aus Browser-/Client-Daten
- `https:` allein reicht nicht
- spätere UI: Affiliate-Anchors `rel="sponsored"` plus übliche External-Link-Härtung, ohne die Viator-URL zu mutieren (P12)

P8:

- Cookie-Attribution **30 Tage**
- Tools: Links, Widgets, Banners, Affiliate API
- Parameter nach dem ersten Hop dürfen aus der URL verschwinden; Cookie bleibt, bis Cache geleert wird
- Kaputte Parameter = Provisionsverlust

P3 Äquivalent: `webURL`. Nicht in den v2-Adapter mischen.

Fixture-`productUrl` ist **keine** Affiliate-Evidence (analog Skyscanner-Fixture-Deeplinks).

---

## 14. Rate / Errors / Timeouts

P2 Rate limiting, Update **18 Aug 2026**:

- je Endpoint, rolling **10-second** window, Account- nicht Key-bezogen
- zusätzlicher Overall-Cap über alle Endpoints **und** je Source-IP
- Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- HTTP 429 mit Headers + `Retry-After` = Endpoint-Allowance
- HTTP 429 ohne Headers/Body = Overall-Cap → Exponential Backoff ab 10s
- HTTP 503 + `Retry-After` (typisch 60s) = gemeinsamer Endpoint-Traffic-Cap, kein Partner-Limit
- Duplicate-booking 429 von `/bookings/book` nicht retryen — für Affiliate-Adapter irrelevant

P3 historische Zahl: 150 req / 10s beim Pre-cache. P2 macht die Allowance endpoint-spezifisch; Beispiel 429 zeigt `RateLimit-Limit: 150`. Konkrete Limits sind account-spezifisch und **ohne Key unbelegt** (`VIA-UNK-09`).

P2 Timeout-Empfehlung: **120s**, begründet mit Booking/Supplier-Systemen. Jetnity Activities-Suche hat heute **12s**. Das ist eine zukünftige Mapping-Entscheidung, kein stilles Anheben in diesem Slice.

HTTP, die P2 listet: 400, 401, 403, 404, 405, 406, 429, 500, 503. Bekannte Codes: `INVALID_HEADER_VALUE`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`. P3 zusätzlich u. a. `TOUR_GONE`, `TOUR_NOT_FOUND`, `UNKNOWN_ERROR`.

Tracking: `X-Unique-ID` / `trackingId` in Support-Anfragen.

Gzip über `Accept-Encoding`.

---

## 15. Localization

P2 `Accept-Language` Pflicht. Alle v2-Partner: en(+Varianten), da, nl, no, es(+LATAM), sv, fr, it, de, pt, ja. Merchant zusätzlich zh-TW, zh-CN, ko. P8 widerspricht teilweise (`VIA-UNK-02`).

**Jetnity-Locale-Regel:** nie eine nicht unterstützte `Accept-Language` senden. Jetnity-PL (und jede andere Locale außerhalb der belegten v2-Matrix) ⇒ dokumentierter unterstützter Fallback/Content-Language-State; kein Claim, Viator habe Polnisch geliefert. Kein stilles Machine-Translation-Claim; `translationInfo` bewahren, wenn vorhanden.

P3 `translationLevel` 0 / 80 / 90 / 100; Machine-translated (80) default aus, Freigabe durch Account Manager. P2 nutzt `translationInfo.containsMachineTranslatedText`. Machine-translated Content nicht still als menschliche Übersetzung ausgeben.

---

## 16. Freshness / Update

P2 empfohlene Maximalfrequenzen (häufiger kann Abschaltung bedeuten):

| Endpoint | Cadence |
| --- | --- |
| `/products/modified-since` | 15–30 min nach Erstingestion |
| `/availability/schedules/modified-since` | 15–30 min |
| `/bookings/modified-since` | 5–10 min (Merchant, um Supplier-Cancel-Mails zu stoppen); sonst stündlich |
| `/destinations`, `/attractions/search`, `/products/tags`, `/products/recommendations`, `/reviews/product`, `/suppliers/search/product-codes` | wöchentlich |
| `/products/booking-questions`, `/bookings/cancel-reasons`, `/locations/bulk` | monatlich |
| `/exchange-rates` | täglich; plus on-demand bei expiry |
| `/reviews/product` on-demand | wenn `totalReviews` sich ändert; max 30/min |
| `/bookings/status` | nicht öfter als alle 3 min |

P3 on-demand Cache-TTL **< 24h** für Taxonomy/Search/Product.

P2: Schedule-Ingestion-Strategie ist **Merchant-Zertifizierungsanforderung**. Affiliates auf Golden-Path (Search on demand, kein Full-Ingest) haben eine andere Last. Jetnity soll **kein** Full-Catalog-Ingest in der ersten Foundation bauen.

Reviews: daily batch. Schedules veralten; deshalb `/availability/check`. Authenticated `/products/search` und `/products/{product-code}` sind **Content/Search-Evidence**, nicht Current Commercial Quote nur weil der Transport live HTTP ist. Search-`fromPrice` und Schedules haben **keine** offizielle Real-time-Garantie → Jetnity `unknown` / `content_preview` / `schedule_hint`, nicht `live_api`. Nur ein gültiger Full-access-`/availability/check` für gewähltes Datum + gültiges Pax-Mix ist Kandidat für Real-time Price/Availability Commercial Truth; danach keine erfundene TTL; Redirect-Checkout kann abweichen.

---

## 17. Kommerzielle / Attribution-Pflichten

Belegt:

- Affiliates verkaufen zum RRP (P2 schedules summary)
- `productUrl` unverändert lassen (P2/P8)
- Unique Content nicht indexieren (P2/P7)
- Usage-Rules; Abweichung nur mit Onboarding-Freigabe (P7)
- Certification vor Production, zumindest Merchant; Affiliate-Launch-Zertifizierungsumfang nicht vollständig öffentlich (`VIA-UNK-10`)
- Commission periodisch; Satz nicht öffentlich (`VIA-UNK-11`)
- P9: eigenes „things to do“-Vertical, Destination-Pages, Redirect zur Viator-PDP
- P2: Versionierung global; Deprecated-Versionen mindestens 12 Monate; additive Felder gelten als backward-compatible — Parser müssen unbekannte Properties tolerieren

Nicht belegt: konkrete Legal-/Datenschutz-Zusätze, Paid-Call-Preise der API selbst, ob Search-Calls kostenpflichtig sind (`VIA-UNK-12`).

---

## 18. Jetnity-Ist gegen diesen Vertrag

Gelesen, nicht geändert:

- `lib/activities/*` — Domain, `ActivityProvider`, Factory `null`, Nachweis `null`, Production hart aus
- `docs/ACTIVITIES.md`, ADR-0078–0086
- `lib/providers/flights/domain.ts`, `lib/providers/skyscanner/flights/*` — Muster für offline Fixture-Foundation
- `lib/commercial-provenance/*` — `live_api` / `persisted_snapshot` / Affiliate-Evidence
- `lib/provider-ops` — Kill-Switch-Form bereits von Activities genutzt
- `lib/server/providers/core/*` — integrierter ADR-0199 Server-Transport (nach Merge von `origin/main @ 085c95b2`); zukünftiger Viator-HTTP nutzt diesen Kern, nicht eine zweite Transport-Abstraktion

Befund:

| Jetnity heute | Viator-Vertrag | Lücke |
| --- | --- | --- |
| `ActivityProvider.suchen()` existiert, Factory `null` | v2 Search vorhanden | kein Adapter |
| `ActivityOption` ohne Booking-/Affiliate-URL | `productUrl` nur Affiliate | bewusst getrennte Naht (ADR-0078) |
| `participants` als Zahl | `paxMix` Age-Bands | Missing-facts |
| `destinationPlaceId` | `destinationId` | kein Resolver |
| 12s Timeout, 40 Angebote | 120s Empfehlung, Rate-Limits account-spezifisch | späteres Mapping |
| `booking_url` immer `null` | Redirect-URL | bleibt null bis gegateter Attribution-Slice |
| kein `live_api`-Mint im Activities-Pfad | nur gültiger Full-access-`/availability/check` ist Real-time-Quote-Kandidat; Search/Detail/Schedules nicht | Fixture darf nicht minten |
| Test-Vokabular `providerId: 'viator'` in Commercial-Provenance-Tests | kein Adapter | nur Fixture-String, keine Integration |

Shared-Core-Edits sind in diesem Slice **verboten** und wurden nicht vorgenommen. Offline-Foundation braucht keinen Shared-Core-Edit. Zukünftiger HTTP-Transport hängt an `lib/server/providers/core/*` (ADR-0199). Ein späterer Domain-Typ-Loch, falls je bewiesen, ist ein eigener kleiner Slice — kein zweiter Transport-Kern.

---

## 19. Offene Unknowns

Resolved in Review-Fix `5464086082` (nicht mehr blocker):

| ID | Lesart |
| --- | --- |
| VIA-UNK-01 | Dokumentationsdrift. Binding: alle Tests in Sandbox; Production-Endpoints nur live. Ältere P9-Production-URL autorisiert keinen Test. |
| VIA-UNK-06 | v2-Adapter nutzt `/destinations` (P6, wöchentlicher Cache). `/v1/taxonomy/destinations` ist historische Golden-Path-Evidence. |
| VIA-UNK-07 | Full-access Affiliates dürfen `/availability/check` nach Datum + gültigem Pax-Mix, vor bookable items. Basic nicht. Offenes Gate = Jetnity Full-access-Freigabe. |

Weiter offen:

| ID | Unknown | Warum es blockt |
| --- | --- | --- |
| VIA-UNK-02 | Affiliate-Sprachen zh/ko | Locale-Matrix |
| VIA-UNK-03 | Nutzen von `/bookings/modified-since` für Non-Booking-Affiliates | Scope-Creep-Risiko |
| VIA-UNK-04 | Weg Basic → Full ohne neuen Vertrag | Adapter darf Check nicht voraussetzen, bis Full-access belegt ist |
| VIA-UNK-05 | Mapping Jetnity-`placeId` → Viator-`destinationId` | ohne Map keine ehrliche Suche |
| VIA-UNK-08 | v2-Äquivalent zu P3 `/support/terms` | Legal-Link |
| VIA-UNK-09 | Konkrete Rate-Allowances | Cost Guard |
| VIA-UNK-10 | Affiliate- vs Merchant-Zertifizierungsumfang | Launch-Gate |
| VIA-UNK-11 | Commission-Satz | Business-Case, kein Adapterblocker |
| VIA-UNK-12 | Ob Search-Calls paid sind | Cost-Guard vor Preview-Live |

---

## 20. Risiken

1. **Merchant/Full+Booking still mitbauen** würde Payments, PCI, MoR und PO-Gates auslösen.
2. **Schedule-`fromPrice` als Live-Preis** verletzt P2 und S5-A.
3. **`productUrl` mutieren** oder auf unbekannten `https:`-Host redirecten macht Jetnity zur beliebigen Redirect-Fläche. Allowlist server-seitig.
4. **Alle Traveller = ADULT** erfindet Eligibility/Preis.
5. **Review-Volltexte indexieren** verletzt Zertifizierung.
6. **Anzeige-Währung ≠ Viator-Checkout-Währung** ohne ehrlichen Hinweis.
7. **Full-Catalog-Ingest** ohne Zertifizierungs-/Rate-Plan.
8. **Fixture → `live_api`/`persisted_snapshot`** analog zum Skyscanner-Trust-Boundary.
9. Erneutes PO-Wahl-Gate Viator-vs-GetYourGuide trotz gesetzter Zielwahl. ADR-0078 bleibt Domain-Architektur, kein Vendor-Lock.

---

## 21. Traveller-Context-Prüfung

| Frage | Antwort |
| --- | --- |
| Traveller-spezifisch? | Nur Teilnehmerzahl und später optionales Age-Band für Live-Preis. |
| Citizenship/Dokumente ändern Affiliate-Suche? | **Nein** nach belegtem Affiliate-Vertrag. Nicht erheben. |
| Mehrere Age-Bands? | Ja, sobald Live-Check genutzt wird. Progressive disclosure. Kein Default-Adult. |
| Shadow-Identity? | Verboten. Booking-Questions inkl. Passport bleiben Viator-Checkout. |

---

## 22. Was dieser Audit nicht ist

- keine Runtime, keine Shared-Core-Änderung
- keine Credentials, keine Calls, kein Commercial-Provenance-Mint
- keine Production-/Supabase-/Vercel-Mutation
- keine Production-Aktivierung und kein Credential-/Signup-Schritt; Viator bleibt first target, nicht exklusiver Endzustand
- kein TW-8, keine Provider-Aktivierung
