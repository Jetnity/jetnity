# Provider HBX Hotels — Contract Audit

Stand: 29. August 2026  
Status: **AUDIT EVIDENCE / DRAFT / NOT ACCEPTED / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Observed Cloud-Run-Titel: `Provider hbx audit`  
Cloud-Run: https://cursor.com/agents/bc-19d3e8fb-5b5a-4723-aa08-f0dab9abd983  
Task-Baseline: `69ef27b169780e41ba506a69acb15caafa645517`  
Merged `origin/main` für diesen Review-Fix: `085c95b22130232c5b5819ef8a4bcc302cc0f52b` (ADR-0199 / Provider Adapter Core integriert)  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/188  
Auftrag: `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`

> Docs/evidence only. Keine Runtime, kein Signup, kein API-Key, kein Secret, kein realer Call, kein Commercial-Provenance-Mint, keine Shared-Core-Edits, keine Production-Mutation.

> Agent-Self-Review ist kein PASS.

---

## 0. Methode

Primärquelle ist die öffentliche first-party HBX Group / Hotelbeds API-Dokumentation unter `developer.hotelbeds.com`, abgerufen am **29. August 2026**. Swagger/API-Reference für Hotel Booking API war hinter einem Cookie-Consent-Wall nicht lesbar. Hotel-spezifische Error-Seite `.../hotels/knowledge-base/errors/` lieferte **404**.

Drittanbieter-Blogs sind **keine** Authority. Sibling-APITUDE-Seiten (Activities/Transfers) werden nur als **shared-platform**-Evidence zitiert und ausdrücklich so markiert.

Unbekanntes bleibt `unknown`. Nichts wird erfunden.

---

## 1. Quelleninventar

| ID | Titel | URL | Abgerufen | Klasse |
| --- | --- | --- | --- | --- |
| S1 | Getting Started | https://developer.hotelbeds.com/documentation/getting-started/ | 2026-08-29 | first-party / hotels suite |
| S2 | Hotels API Suite | https://developer.hotelbeds.com/documentation/hotels/ | 2026-08-29 | first-party / hotels |
| S3 | Hotel Booking API | https://developer.hotelbeds.com/documentation/hotels/booking-api/ | 2026-08-29 | first-party / hotels |
| S4 | Workflow | https://developer.hotelbeds.com/documentation/hotels/booking-api/workflow/ | 2026-08-29 | first-party / hotels |
| S5 | Best practices | https://developer.hotelbeds.com/documentation/hotels/knowledge-base/best-practices/ | 2026-08-29 | first-party / hotels |
| S6 | Certification process | https://developer.hotelbeds.com/documentation/hotels/knowledge-base/certification-process/ | 2026-08-29 | first-party / hotels |
| S7 | Mutual Authentication | https://developer.hotelbeds.com/documentation/hotels/knowledge-base/mutual-authentication/ | 2026-08-29 | first-party / hotels |
| S8 | Hotel Content API | https://developer.hotelbeds.com/documentation/hotels/content-api/ | 2026-08-29 | first-party / hotels |
| S9 | How to use Content API | https://developer.hotelbeds.com/documentation/hotels/content-api/how-use-content-api/ | 2026-08-29 | first-party / hotels |
| S10 | Use of images | https://developer.hotelbeds.com/documentation/hotels/content-api/use-images/ | 2026-08-29 | first-party / hotels |
| S11 | Use of Rate Comments | https://developer.hotelbeds.com/documentation/hotels/content-api/use-rate-comments/ | 2026-08-29 | first-party / hotels |
| S12 | Categories & category group | https://developer.hotelbeds.com/documentation/hotels/content-api/categories-category-group/ | 2026-08-29 | first-party / hotels |
| S13 | Cache API operations | https://developer.hotelbeds.com/documentation/hotels/cache-api/operations/ | 2026-08-29 | first-party / hotels cache |
| S14 | API Errors | https://developer.hotelbeds.com/documentation/activities/knowledge-base/errors/ | 2026-08-29 | first-party / APITUDE shared; **nicht** hotels-spezifisch |
| S15 | Transfers Booking API Overview | https://developer.hotelbeds.com/documentation/transfers/booking-api/overview/ | 2026-08-29 | first-party / sibling suite hostname |
| S16 | Hotel Booking API Reference | https://developer.hotelbeds.com/documentation/hotels/booking-api/api-reference/ | 2026-08-29 | first-party, **nicht lesbar** (Cookie-Wall / „Loading …“) |
| S17 | Hotels knowledge-base errors | https://developer.hotelbeds.com/documentation/hotels/knowledge-base/errors/ | 2026-08-29 | **404** |
| S18 | API Suite homepage | https://developer.hotelbeds.com/ | 2026-08-29 | first-party / suite homepage |
| S19 | Pricing models | https://developer.hotelbeds.com/documentation/hotels/knowledge-base/pricing-models/ | 2026-08-29 | first-party / hotels |
| B1 | Demand API integration types | https://developers.booking.com/demand/docs/development-guide/application-flows | 2026-08-29 | first-party / Booking.com Demand API; **nicht** HBX; späterer Adapter, kein Erstziel |

---

## 2. Vendor- und Produktidentität

HBX Group liefert die **Hotels API Suite** (APITUDE). Die Suite umfasst laut S2:

- Hotel Booking API — Suche, Buchung, Verwaltung
- Hotel Content API — statisches Portfolio (Bilder, Beschreibungen, Kategorien, Keywords)
- Hotel Cache API — Preise/Verfügbarkeit als Dateien
- CDS API — Change Discovery

Drei **gleichzeitig öffentliche** first-party Portfolio-Zahlen widersprechen sich. Keine wird als kanonische Portfolio-Wahrheit gewählt:

| Quelle | Belegter Wortlaut | Datum |
| --- | --- | --- |
| S18 API Suite homepage | **300,000** „Hotels worldwide“ | 2026-08-29 |
| S2 Hotels API Suite overview | „instant access to **250,000** hotels“ | 2026-08-29 |
| S9 How to use Content API | „approximately **173000** hotels“ für den initialen Content-Load | 2026-08-29 |

Das ist first-party **Dokumentations-Drift**, kein gemessener Katalog. Portfolio-Größe bleibt `unknown` / `vendor-confirmation-required`.

Es gibt **kein Shopping-Cart** in der aktuellen API; der Client verwaltet den Funnel selbst (S2).

---

## 3. Evaluation / Testzugang

Belegt in S1:

1. Registrierung auf dem Developer-Portal liefert eine ID plus **drei API-Keys** (Hotel, Activities, Transfers) und Zugang zur **Evaluation**-Umgebung.
2. Jeder Request braucht `Api-key` und `X-Signature`.
3. Test-Host: `https://api.test.hotelbeds.com`.
4. Test-Server sind „identical to our production servers“, aber Booking-Requests erzeugen **keine** echten Reservierungen und **keine** Kreditkartenbelastungen.
5. Registrierungs-Keys gelten **nur** für Evaluation. Quota: **50 Requests pro Tag**. Überschreitung → **403**.
6. Höhere Quota über „profile progression“ im Dashboard zur **Certification**-Umgebung.

Nicht belegt / `unknown`:

- ob Jetnity bereits ein Konto hat
- genaue Certification-Quota
- ob Evaluation-Keys Content API, Cache API und CDS einschließen
- konkrete Dashboard-Schritte der Progression
- ob Evaluation mTLS verlangt

Dieser Audit hat **kein** Konto eröffnet und **keinen** Key erzeugt.

---

## 4. Authentifizierung

### 4.1 Api-key + X-Signature

S1: `X-Signature` ist SHA256 in Hex über `apiKey + secret + aktueller Unix-Timestamp in Sekunden`.

Beispielstatus-Call:

`GET https://api.test.hotelbeds.com/hotel-api/1.0/status`  
Header: `Accept: application/json`, `Api-key`, `X-Signature`.

S14 (APITUDE shared): Signatur-Toleranz „few minutes“. 401 bei fehlendem Key oder fehlgeschlagener Signaturprüfung.

S14: Ein Key gilt nur für **eine** Suite (hotel / activities / transfers) **und** nur für **eine** Umgebung (LIVE oder TEST). Falsche Kombination → 403 „Access to this API has been disallowed“.

### 4.2 mTLS

S7: HBX „requiring a new security layer called Mutual TLS (mTLS) for all booking API integrations“. Betroffene Operationen: Hotel availability, CheckRate, Booking confirmation/list/detail/change/cancellation/reconfirmation.

Hosts:

- Production: `api-mtls.hotelbeds.com`
- Test: `api-mtls.test.hotelbeds.com`

Api-key + X-Signature bleiben zusätzlich nötig. Private Keys darf HBX nie anfordern. Nach Zuordnung eines Zertifikats zu einem Key verliert dieser Key den Non-mTLS-Zugang nach **X Tagen (Default 14)**. Ein Key darf mit höchstens zwei Zertifikaten verbunden sein. Ein Key mit nur einem Zertifikat kann nicht vom Zertifikat gelöst werden.

Payment-Endpunkte: S7 sagt, mTLS gilt **nicht** für Payment; weiter `api-secure.hotelbeds.com`.

S7 gilt für **alle** Booking-API-Integrationen, ausdrücklich inklusive Hotel Availability und CheckRate, nicht nur Confirmation.

**Fail-closed Host-Regel:** Availability / CheckRate / Booking dürfen **nicht** still einen Non-mTLS-Host nutzen, wenn mTLS erforderlich ist. Dokumentierte mTLS-Hosts: Test `api-mtls.test.hotelbeds.com`, Production `api-mtls.hotelbeds.com`. Zusätzlich bleiben `Api-key` + `X-Signature` Pflicht.

Ob Evaluation **ohne** Zertifikat weiter non-mTLS `api.test.hotelbeds.com` nutzen darf: **nicht abschließend belegt**. S1 zeigt den non-mTLS-Test-Host; S7 verlangt mTLS für dieselben Operationen. Status: `unknown / vendor-confirmation-required`. Zukünftiger TEST-Transport muss fail-closed bleiben, bis Zertifikat/Umgebung tatsächlich aufgelöst sind. Dieses Audit erzeugt keine Zertifikate und keine Private Keys.

---

## 5. Umgebungstrennung

| Umgebung | Was belegt ist | Host, soweit belegt |
| --- | --- | --- |
| Evaluation / TEST | S1: Registrierungs-Keys, 50 req/Tag, keine echten Bookings | `api.test.hotelbeds.com`; mTLS-Test `api-mtls.test.hotelbeds.com` |
| Certification | S1: Dashboard-Progression, „better quotas“ | Host **unknown** |
| LIVE | S6: eigene Live-Keys nach Certification; Live-Booking ist real und kostenpflichtig | Sibling S15: `api.hotelbeds.com`. Hotels-Getting-Started nennt diesen Host **nicht**. Hotels-mTLS: `api-mtls.hotelbeds.com`. Non-mTLS-Live-Host für Hotels bleibt `unknown` ohne S16. |
| Cache TEST/LIVE | S13: getrennte Environments; LIVE über `aif2.hotelbeds.com`; IP-Freischaltung | nicht Teil des ersten Adapters |

Keys sind nicht zwischen TEST und LIVE übertragbar (S14).

---

## 6. Hotel Booking API — Availability / Search

S3: Booking API ist die **Haupt-Hotel-API**. Drei Methoden: Hotels (Availability), CheckRates, Bookings.

S4 Workflow, belegt:

1. Availability mit `stay.checkIn` / `stay.checkOut`, `occupancies[]` (`rooms`, `adults`, `children`) und einer Liste von **Hotel-Codes**.
2. Antwort enthält Hotels mit Rooms und Rates. Jede Rate hat einen **`rateKey`**.
3. `rateType` ist `RECHECK` oder `BOOKABLE`.
4. `RECHECK` → CheckRate, danach buchen. `BOOKABLE` → direkt buchbar.
5. `rateKey` ist der eindeutige Rate-Identifier.

Availability-Beispielhost in S4: `POST https://api.test.hotelbeds.com/hotel-api/1.0/hotels` wird nicht als vollständige URL im JSON-Block gezeigt; CheckRate und Booking nutzen `/hotel-api/1.0/checkrates` und `/hotel-api/1.0/bookings`. Certification S6 nennt Availability als `/hotels`.

S6: Availability braucht mindestens Check-in, Check-out, **anzufragende Hotels**, Zimmer- und Passagierzahlen. Maximal **2000 Hotels pro Availability-Call**. Alle Zimmer einer späteren Buchung müssen in **derselben** Availability stehen.

S5: Availability nach CheckRate/Booking **nicht** wiederholen. Ein Booking braucht genau **eine** Availability, optional **eine** CheckRate, **eine** Booking.

S3: Preise der Booking API sind „final“ und enthalten Supplements/Discounts. Cancellation Fees können schon in Availability stehen. Flexible-Date-Suche ist erwähnt; genaue Request-Felder: `unknown` (S16 unlesbar).

### 6.1 Location-Modi

In den **gelesenenen** Hotels-Booking-Seiten ist nur die Suche über **explizite Hotel-Codes** belegt. Destination-Code- oder Geolocation-Availability ist in S3/S4/S6 **nicht** als Request-Beispiel belegt. Content API liefert Destinations/Zones (S8). Cache-File-Spec erwähnt Destination Codes für XML-Feed — das ist Cache, nicht Booking API.

**Destination-/Geo-Availability bleibt `unknown`**, bis S16 oder ein anderes first-party Hotels-Booking-Dokument gelesen werden kann.

### 6.2 Belegte Availability-Response-Felder (S4)

Hotel: `code`, `name`, `exclusiveDeal`, `categoryCode`, `categoryName`, `destinationCode`, `destinationName`, `zoneCode`, `zoneName`, `latitude`, `longitude`, `minRate`, `maxRate`, `currency`.

Room: `code`, `name`.

Rate: `rateKey`, `rateClass`, `rateType`, `net`, optional `sellingRate`, optional `hotelMandatory`, `allotment`, `paymentType` (`AT_WEB` im Beispiel), `packaging`, `boardCode`, `boardName`, `cancellationPolicies[]` (`amount`, `from`), `taxes.taxes[]` (`included`, `amount`, `currency`, `type`), `taxes.allIncluded`, `rooms`, `adults`, `children`.

S6 zeigt zusätzlich optionale Filter: room include, keywords, accommodations (`HOTEL`/`HOSTEL`), boards, Tripadvisor-Reviews, `filter.maxHotels/minRate/maxRate/minCategory/maxCategory/paymentType/maxRatesPerRoom/packaging/hotelPackage/maxRooms/contract`, `sourceMarket`, `dailyRate`, Kinder-`paxes[].age`.

---

## 7. Content API — Trennung

S8: Booking API liefert bewusst nur **dynamische** Fakten (Preis, Verfügbarkeit, Cancellation). Statisches (Adresse, Bilder, Beschreibung, Facilities) kommt aus Content API.

S9 harte Regel:

> Content API darf **nicht** realtime für statische Infos verwendet werden. Das kann Credentials blockieren.

Vorgeschriebener Betrieb: Batch-Load in eine **eigene** Datenbank, danach Differenzen über `lastUpdateTime` (S9 empfiehlt täglich; S6 empfiehlt mindestens wöchentlich).

Hotels-Operation: bis **1000** Hotels pro Request (`from`/`to`). Initial-Load-Beispiel: `GET https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?fields=all&language=ENG&from=1&to=1000`.

S9 nennt Production-Plan **4 QPS** für den initialen Content-Load. Sprachen sind textabhängig; Languages-Operation listet gültige Codes. `ENG` und `ENGCAS` kommen in Beispielen vor.

Content ist für Certification **empfohlen, nicht zwingend** (S6 §5). Für Availability über Hotel-Codes ist ein Hotel-Code-Katalog praktisch notwendig (S4, S9).

S8 Complementary Operations liefern **Board Types** als Masterdaten zum `boardCode` der Booking API. Breakfast-/Verpflegungswahrheit kommt aus diesem gecachten Katalog (oder einer ausdrücklich first-party-verifizierten Mapping-Evidence), nicht aus einer geratenen Code-Liste. Kein realtime Content-Lookup.

Hotel-Detail darf für neu entstandene Hotels nach dem letzten Batch genutzt werden (S6).

---

## 8. CheckRates / Booking — nur Grenze

Dieser Audit implementiert **keine** Buchung. Die Semantik ist nur Trust-Grenze.

S3/S4/S5/S6:

- CheckRate nur bei `rateType=RECHECK`, außer extra RateComments für `BOOKABLE`.
- CheckRate-Limit laut Certification: bis **10** Rates pro Call. Best Practice S5: **lieber eine** Rate; mehrere Keys können den ganzen Call killen; RECHECK und BOOKABLE nicht mischen.
- CheckRate und Booking nicht parallel. Erst 200, dann Confirmation.
- `rateKey` **nicht parsen**. Format kann sich ändern. Nur kopieren.
- Booking-Confirmation-Timeout **mindestens 60 Sekunden**.
- HTTP 400: Request falsch, nicht identisch wiederholen.
- HTTP 500: Produkt nicht mehr verfügbar; Funnel von Availability neu starten; nicht denselben Request wiederholen.
- Live-Booking ist real. NRF/non-refundable Live-Tests sind verboten, weil Storno kostenpflichtig ist (S6 §6).

S11: Availability liefert oft nur `rateCommentsId`. Voller Kommentar entsteht erst durch Content-Lookup **oder** CheckRate (`rateComments`). Certification verlangt, dass Rate Comments dem Endkunden **vor** Confirmation gezeigt werden, falls genutzt.

S6 Opaque Rates (`packaging=true`): nur erlaubt, wenn der Hotelpreis mit anderen Produkten kombiniert ist und nicht isoliert bestimmbar.

S6 Source Market: Preise nur für den tatsächlich angefragten Markt verwenden. UK-`sourceMarket` darf nicht an einen ES-Markt ausgeliefert werden.

S6 Selling Rate: `hotelMandatory` soll respektiert werden; HBX darf das rechtlich nur „empfehlen“, sonst Exclusions.

Voucher (S6 §4) ist für **bestätigte** Reservierungen Pflicht und verlangt u. a. Hotelbeds-Referenz, Holder, Room/Board, Rate Comments, und die Zahlungsformel „Payable through XXX, acting as agent…“. Preis auf dem Voucher soll **nicht** gezeigt werden.

Das ist ein **B2B-Booking-/Agentur-Modell**, kein Search/Look/Redirect.

---

## 9. Quotas, Rate Limits, Errors

| Fakt | Quelle | Status |
| --- | --- | --- |
| Evaluation 50 req/Tag → 403 | S1 | belegt |
| APITUDE HTTP 429 „Too Many Requests, check the used quota“ | S14 | shared-platform; hotels-eigene Error-Seite 404 |
| Content Production 4 QPS | S9 | belegt für Content-Load |
| Cache 429 concurrent | S13 | Cache only |
| Certification/Live Hotel-Booking-QPS | — | `unknown` |
| Hotels-spezifische Application-Error-Codes | S16/S17 | `unknown` |
| Signatur-Toleranz wenige Minuten | S14 | shared-platform |
| GZIP wird in Certification geprüft | S6 §1 | belegt |
| Accept-Encoding: gzip in Workflow-Beispielen | S4 | belegt |

---

## 10. Währung, Preis, Steuern, Storno, Verfügbarkeit

Belegt:

- `net` ist der Netto-B2B-Preis als String-Decimal (S4).
- S19 unterscheidet zwei **Pricing-Modelle**, die der Sales Manager zuordnet — nicht die Response-Shape:
  - **Net:** Preise sind netto. `sellingRate` erscheint nur wenn `hotelMandatory=true` und muss dann respektiert werden; sonst darf der Integrator eigenen Markup auf `net` setzen.
  - **Commissionable:** Commission steckt in `sellingRate`; Preise sind final; `sellingRate` ist unabhängig von `hotelMandatory` zu nutzen. `commission` / `dailyNet` vs `dailySellingRate` hängen vom Modell ab.
- Das Jetnity-seitige Modell darf **nicht** aus Feldpräsenz, Locale oder Citizenship geraten werden. Bis die kommerzielle Beziehung das Modell belegt, bleibt Display-Preisrolle `unknown`.
- Hotel-`currency` (S4 Beispiel `USD`).
- Steuern können `included=true` sein; `type=TAXESANDFEES`; `allIncluded` (S4).
- S3: Booking-API-Preise sind final inkl. Supplements/Discounts.
- Cancellation `amount` + `from` mit Offset. **Destination-Zeit, nicht Kunden-Lokalzeit** (S6 §3.8).
- `allotment` ist Restkontingent, keine Jetnity-Availability-Wahrheit ohne Kontext.
- `paymentType` mindestens `AT_WEB` und `AT_HOTEL` (S4, S6 Filter).
- CheckRate-Beispiel S11 zeigt zusätzlich `commission`, `commissionVAT`, `commissionPCT` — nur dort belegt, nicht in S4-Availability.

Nicht belegt / `unknown`:

- wie die **Request-Währung** gesetzt wird; Availability-Beispiele enthalten kein `currency`-Feld
- ob `net` jemals an Endkunden gezeigt werden darf
- vollständige Tax-Typen
- Freshness-TTL / `freshUntil`
- ob Availability ohne CheckRate für `RECHECK` als aktuelle Verfügbarkeit gelten darf — dokumentiert: **nein, nicht zum Buchen**

---

## 11. Identifiers

| Identifier | Rolle | Regel |
| --- | --- | --- |
| `hotels.hotels[].code` | HBX Hotel-Code, numerisch | Property-Schlüssel. Content-gemappt. |
| `rooms[].code` | Room-Type z. B. `DBL.ST` | nicht allein buchbar |
| `rateKey` | einzigartige Rate | **opaque**; Jetnity darf ihn nicht zerlegen |
| `rateCommentsId` | `incoming\|code\|rateCodes` (S11) | nur Content-Lookup |
| `destinationCode` / `zoneCode` | Location-Codes | Content-beschrieben |
| `categoryCode` | Kategorie inkl. Sterne/Keys | S12: `simpleCode` 1–5 Hilfswert |
| `boardCode` | Verpflegung `RO`/`BB`/… | |
| Booking-Referenz | nach Confirmation | nur Booking-Pfad |
| GIATA | Cache-File-Spec | Booking-Availability-Beispiele zeigen ihn nicht |

`rateKey` ist **kein** stabiler Property-Schlüssel und kein Refresh-Schlüssel im Sinne von S5-A `externalRef` ohne zusätzliche Property-Bindung. Für Jetnity-Search ist `hotel.code` + Stay + Occupancy + Board/Room die stabile Property-Identität; `rateKey` ist die **ephemere Offer-Identität**.

---

## 12. Zeit / Freshness

Kein offizielles Availability-TTL gefunden. `RECHECK` bedeutet: Availability-Preis/Verfügbarkeit ist **nicht** als buchungsfrisch behauptet. `BOOKABLE` wird als aktuell genug zum direkten Buchen beschrieben.

Cancellation-`from` trägt Offset. Check-in/Check-out in Beispielen `YYYY-MM-DD`.

S9 `lastUpdateTime` gilt nur für **Content**, nicht für Rates.

Jetnity darf aus Availability **kein** `freshUntil` erfinden. Fehlende Freshness = `unknown`.

---

## 13. Lokalisierung

Content: `language=` Query; Languages-Operation ist die Authority für gültige Codes (S8, S9). Texte sind sprachabhängig.

Booking-Availability-Beispiele setzen **kein** `language`. Ob Availability-Namen lokalisiert sind: `unknown`.

`sourceMarket` ist **kein** UI-Locale. Es ist der Markt des Endkunden für die Preisbildung (S6). Falscher Markt ist ein Certification-/Commercial-Fehler.

---

## 14. Content / Bilder

S10: Content liefert nur den **Pfad**, nicht die volle URL.

Basis: `https://photos.hotelbeds.com/giata/`

| Prefix | Breite |
| --- | ---: |
| *(none)* | 320 |
| `small/` | 74 |
| `medium/` | 117 |
| `bigger/` | 800 |
| `xl/` | 1024 |
| `xxl/` | 2048 |
| `original/` | variabel |

Nicht jede Größe existiert. Fehlende Größe → HTTP 403 `AccessDenied`.

Bilder gehören **nicht** in Commercial Provenance.

---

## 15. Attribution / Commercial Model

Belegt ist ein **Wholesale-/Agentur-Modell**:

- Netto an den Integrator, optional Selling Rate / Mandatory Rate
- Payment `AT_WEB` (prepaid) oder `AT_HOTEL`
- Voucher-Text „acting as agent for the service operating company“
- Certification verlangt Workflow-URL, Commercial Decisions, ggf. Payment Information
- Live-Testbuchung kann echte Stornokosten erzeugen
- Transfers-Certification (nicht Hotels) erwähnt Commercial Agreement; für **Hotels** ist ein Vertrag in S6 nicht wörtlich als Voraussetzung genannt, aber Live-Keys, Voucher und echte Bookings implizieren eine kommerzielle Beziehung. Status: `unknown / vendor-confirmation-required`

**Nicht belegt in HBX-Hotels-Docs:** Affiliate-Deeplink, Redirect-Look-to-Book, öffentliche Consumer-Attribution, Impact-Links.

Akzeptiertes Erstziel dieses Workstreams: **HBX/Hotelbeds ist der erste konkrete Hotels-Adapter** (Foundation/Evaluation). Booking.com Demand und Expedia Rapid bleiben **spätere** Adapter. Dieser Audit schreibt `docs/HOTEL_PROVIDER_STRATEGY.md` nicht um (Isolation).

B1 belegt separat, dass Booking.com Demand **Search → Look → Redirect** dokumentiert. Das ist Vergleichs-Evidence für das Jetnity-Aggregator-/Redirect-Modell, **keine** neue Product-Owner-Wahl und keine Demotion von HBX zum Backup.

HBX Hotel Booking API ist ein **Buchungs- und Inventory-API** (Availability → optional CheckRate → Booking/Voucher). Jetnity bleibt aggregator-/redirect-first: ein HBX-Adapter darf Availability/Content nutzen; er darf **nicht** still Booking/Voucher/Merchant oder einen erfundenen Deeplink einführen. Ob HBX jemals consumer-facing Production in diesem Modell aktiviert wird, bleibt ein separates Commercial-/Product-Gate.

---

## 16. Certification / Go-Live

S6: nach Entwicklung `apitude@hotelbeds.com` mit Workflow, Commercial Decisions, URL, ggf. Login, Payment-Info, Sprach-Guide, Hinweis falls andere Supplier gemischt sind.

Prüffelder: Technical (inkl. GZIP), Workflow, Availability/CheckRate/Confirmation, Voucher, Content, Live environment.

Live-Proof: eine echte LIVE-Buchung 6 Monate voraus, 2 Erwachsene / 2 Kinder, **kein** NRF; danach stornieren, sonst Belastung.

Non-breaking changes müssen verkraftet werden: neue Felder, neue Endpoints, neue optionale Request-Parameter, Feldreihenfolge, String-Längen.

Kein Go-Live ohne Certification. Kein Certification-Request aus diesem Audit.

---

## 17. Jetnity-Ist und Mapping-Grenze

Bereits auf `main`:

- provider-neutrale Hoteldomäne `lib/hotels/domain.ts` (`HotelSuchanfrage`, `HotelOption`)
- Port `HotelProvider.suchen()` — bucht nicht, erzeugt keine Deeplinks
- `HotelNachweis` an Ziel/Zeitraum/Belegung/Währung; Umgebung `null`
- Factory `hotelProviderAus()` = `null`
- Commercial Provenance S5-A; S5-B Persistenz-Foundation auf dieser Baseline Production-verifiziert (`20260829140000_trip_item_commercial_provenance`, owner-readable RLS, privilegierte Write-Authority). Runtime-Provider-Write-Pfad bleibt geschlossen (`production_write_path_allocated=false`). Kein realer Provider-Snapshot. TW-8 geschlossen.
- Skyscanner-Flights-Foundation als Vorbild: fixture-only, kein `live_api`-Mint
- **ADR-0199** Provider Adapter Core integriert auf `main` (`lib/server/providers/core/*`, Checkpoint `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md`). Das ist der akzeptierte provider-neutrale **Transport**-Kern, kein UniversalProvider und keine Hotel-Fachwahrheit.

Drei getrennte Nähte:

1. Hotel-Domain/Port: `lib/hotels/*` (`HotelSuchanfrage`, `HotelOption`, `HotelProvider`)
2. Shared Server-Transport: `lib/server/providers/core/*` — nur für späteren HTTP
3. HBX-Adapter: isolierter zukünftiger Ordner, z. B. `lib/providers/hotelbeds/hotels/*`

Die Offline-Foundation braucht **keine** Shared-Core-Edits. Späterer HTTP-Transport **muss** den integrierten Server-Kern konsumieren und HBX-500-Semantik (S5) explizit übersteuern (`retry5xx=false`). Ein zweiter generischer Transport-/„shared accommodations core“ ist **kein** Prerequisite.

HBX darf **nicht** in `HotelOption`, UI oder `lib/commercial-provenance` leaken.

Suchadapter ≠ Booking-Partner bleibt verbindlich (ADR-0070, ADR-0075).

---

## 18. Traveller Context

Relevant:

- `sourceMarket` ist der Markt des **Endkunden**, nicht die Staatsbürgerschaft. Mehrere Citizenships dürfen nicht still zu einem Market werden.
- Kinder: wenn `children > 0`, verlangt S6 das **Alter**. Jetnity-Default `children=0` bleibt ehrlich, solange die Reise keine Kinderfelder trägt.
- Booking-Pax-Namen sind PII und nur im späteren Booking-Pfad nötig. Search/Availability braucht sie nicht.

Nicht relevant für Availability-Suche: Visa, Dokumente, MRZ, Biometrie. Keine Eligibility aus Hotelraten erfinden.

---

## 19. Offene Unknowns

| ID | Unknown | Warum es blockiert |
| --- | --- | --- |
| U1 | Destination-/Geo-Availability-Request | S16 unlesbar; nur Hotel-Code-Suche belegt |
| U2 | Request-Währung | kein Feld in gelesenen Availability-Beispielen |
| U3 | Hotels-Live-Host ohne mTLS | nur Sibling S15 / mTLS S7 |
| U4 | Evaluation vs mTLS-Pflicht | S1 und S7 spannungsvoll |
| U5 | Hotels-spezifische Error-Codes | S17 404 |
| U6 | Certification/Live QPS | nicht öffentlich beziffert |
| U7 | Portfolio 173k vs 250k vs 300k | drei widersprüchliche first-party Zahlen; keine kanonisch |
| U8 | Official Availability-TTL | nicht gefunden |
| U9 | Ob und wann `net` consumer-sichtbar sein darf | Commercial/Legal; hängt am S19-Modell |
| U10 | Ob Jetnity ein HBX-Konto/Vertrag hat | nicht geprüft, nicht eröffnet |
| U11 | Cache/CDS-Notwendigkeit für ersten Search-Adapter | bewusst später |
| U12 | Booking-API-`language` | nicht in gelesenen Beispielen |
| U13 | Welches S19-Pricing-Modell (Net vs Commissionable) Jetnity zugeordnet bekommt | vendor/commercial confirmation |

---

## 20. Risiken

| ID | Risiko | Schwere |
| --- | --- | --- |
| HBX-R1 | HBX ist Booking-API, nicht Affiliate-Redirect. Certification/Go-Live impliziert Voucher + echte Buchung. | **high** / Produkt |
| HBX-R2 | Evaluation/TEST-Antwort als `live_api` oder `persisted_snapshot` zu minten wäre ein Truth-Bruch. | **high** / Truth |
| HBX-R3 | `rateKey` zu parsen oder als dauerhafte Property-ID zu nutzen. | **high** / Contract |
| HBX-R4 | Content API realtime → Credential-Block. | **high** / Ops |
| HBX-R5 | `sourceMarket` aus einer Citizenship erfinden. | **high** / Commercial + Traveller |
| HBX-R6 | `net` als Endkundenpreis ohne Selling-Rate-Regel. | **high** / Commercial |
| HBX-R7 | `RECHECK`-Availability als frische Buchungswahrheit. | **high** / Freshness |
| HBX-R8 | Live-Testbuchung mit NRF / ohne Cancel → echte Kosten. | **high** / Cost |
| HBX-R9 | mTLS-Cutover nach Cert-Association (14 Tage). | **medium** / Ops |
| HBX-R10 | Opaque/`packaging` Rates isoliert anzeigen. | **medium** / Certification |
| HBX-R11 | Storno-Zeiten in Kunden-Lokalzeit interpretieren. | **medium** / Truth |
| HBX-R12 | Shared-Core oder `HotelProvider` HBX-spezifisch aufblasen. | **medium** / Architektur |
| HBX-R13 | HBX still zum Booking-/Voucher-/Merchant-Produkt machen oder Booking.com/Expedia als neues Erstziel wählen. | **high** / Produkt |
| HBX-R14 | Shared-Core-Default `retry5xx` auf HBX-500 anwenden (S5: nicht unverändert wiederholen). | **high** / Integration |
| HBX-R15 | Breakfast aus geratenen `BB/HB/FB/AI`-Listen statt Boards-Katalog. | **medium** / Truth |

---

## 21. Empfehlung

1. Diesen Audit als **Gate-0-Evidence** reviewen. Nicht implementieren.
2. **HBX/Hotelbeds bleibt das bereits gewählte erste konkrete Hotels-Adapter-Ziel** (offline Foundation, danach Evaluation). Booking.com Demand und Expedia Rapid bleiben spätere Adapter. B1 ist nur Redirect-Modell-Evidence, keine neue PO-Auswahl und keine Demotion von HBX.
3. Jetnity bleibt aggregator-/redirect-first. Kein HBX-Booking-/Voucher-/Merchant-Pivot ist autorisiert. Ob HBX consumer-facing Production in diesem Modell je aktiviert wird, ist ein **separates** Commercial-/Product-Gate.
4. Nächster erlaubter Slice, falls TL ihn separat vergibt: **offline fixture foundation** gegen `HotelProvider`/`HotelOption`. Kein Key, kein Netz, kein Booking, kein Content-Batch, kein mTLS, kein Mint, keine Shared-Core-Edits.
5. Späterer HTTP-Transport konsumiert ADR-0199, mit fail-closed mTLS und `retry5xx=false` für Booking-API-500. CheckRate, Booking, Voucher, Certification, Live-Keys, Commercial Agreement und Production bleiben **eigene Gates**.
