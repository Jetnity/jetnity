# Provider Viator Activities — Proposed Adapter Contract

Stand: 29. August 2026  
Status: **PROPOSED CONTRACT / NICHT IMPLEMENTIERT / NICHT FREIGEGEBEN**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Evidence: `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_2026-08-29.md`  
Muster: Skyscanner Flights offline foundation; Transport später über integriertes ADR-0199 `lib/server/providers/core/*` (`main @ 085c95b2`)

> Vorschlag für den kleinsten zukünftigen `activities`-Adapter. Keine Runtime in diesem Slice. Keine Shared-Core-Edits. Grobe Zielwahl ist bereits gesetzt: **Viator first, GetYourGuide später.** Das ist keine Production-Aktivierung. Offline-Foundation braucht keinen Shared-Core-Edit.

---

## 1. Zielklasse

**Angestrebte Viator-Klasse:** Partner API **v2 Full-access Affiliate**.

| Alternative | Warum nicht als Jetnity-Default |
| --- | --- |
| Basic-access Affiliate | Kein `/availability/check`. Für reine Content-Previews ausreichend; für day-specific Live-Quote zu schwach. Foundation darf Basic-Fixtures trotzdem parsen. |
| Full-access + Booking Affiliate | PCI, Zahlungsdaten, Cart-Hold/Book. Product-Owner-Sondergate. Kein Affiliate-Redirect-Modell. |
| Merchant | Jetnity wäre Merchant of Record: Invoice, Support, Markup, volle Booking-API. Eigenes Geschäftsmodell. |

Das ist die **Zugangsklasse** auf dem bereits akzeptierten ersten Activities-Target Viator. ADR-0078 bleibt die Domain-Architektur (`ActivityProvider`, Search ≠ Booking, kein Vendor-Lock). GetYourGuide bleibt späterer Kandidat, kein offenes PO-Wahl-Gate. Signup, Zugang, Vertrag, Credentials, paid calls, Production-Aktivierung und jedes Full+Booking-/Merchant-Modell bleiben getrennte PO-Gates.

Verkauf bleibt Redirect auf die unveränderte `productUrl`. Viator bleibt Merchant of Record.

---

## 2. Schichten — Domain, Shared Transport, Viator-Mapping

Drei getrennte Schichten. Keine zweite Transport-Abstraktion vorschlagen. Offline-Foundation ändert keinen Shared-Core.

| Schicht | Modul | Verantwortung |
| --- | --- | --- |
| Domain / Port | `lib/activities/*` | `ActivitySuchanfrage`, `ActivityOption`, `ActivityProvider.suchen()`, Nachweis, Ranking, Kill-Switch |
| Shared Server-Transport | `lib/server/providers/core/*` (ADR-0199) | Timeout, Retry, Rate-Limit, Redaction, Observability, `server-only` |
| Viator-spezifisch | später `lib/providers/viator/activities/*` | Mapping, Parser, Destination-Resolver, Attribution-Semantik, Locale-Fallback |

Inbound-Ops bleibt `lib/provider-ops`. Commercial Provenance bleibt `lib/commercial-provenance`; der Adapter mintet nicht.

Viator-Mapping (nicht in den Transport-Kern):

- Destination-Resolver über v2 `/destinations` (wöchentlicher Cache); `placeId`/`destinationName` → `destinationId` fail-closed
- Parser/Normalizer für v2 Product Summary / Product / optional Check
- `productCode` / `productOptionCode`
- `Accept-Language` nur aus belegter v2-Matrix; Jetnity-PL und andere ununterstützte Locales ⇒ dokumentierter Fallback, kein stilles PL an Viator
- `productUrl` byte-identisch + server-seitige Host-Allowlist
- Age-Band-Missing-Facts
- Error-/429-/503-Mapping auf den ADR-0199-Kern; kein paralleler HTTP-Client

Ein Domain-Typ-Loch, falls je bewiesen, ist ein eigener kleiner Slice — kein zweiter Transport-Kern und nicht Teil der ersten Foundation.

---

## 3. Evidence-Klassen

Strikte Trennung, analog Skyscanner `evidenceMode: 'fixture'`:

| Klasse | Herkunft | Darf werden |
| --- | --- | --- |
| `content_preview` | `/products/search` oder `/products/{product-code}` oder Fixture-Äquivalent | Titel, Beschreibung, Tags, Foto-URL, Review-**Summary**, optionales `fromPrice` mit `amountStatus` unbelegt/`unknown`. Authenticated HTTP macht das **nicht** zur Current Quote / `live_api`. |
| `schedule_hint` | `/availability/schedules/{product-code}` | cached/schedule price hint; **nicht** current availability/quote |
| `live_check` | gültiger Full-access `/availability/check` für **user-selected date + gültiges paxMix** | Einzige Kandidat-Quelle für Real-time Price/Availability Commercial Truth / spätere `live_api`; Basic kann das nicht; kein Bulk/Kalender; keine erfundene TTL; Redirect-Checkout kann abweichen |
| `affiliate_redirect` | unveränderte `productUrl` aus Live-API, Host auf server-Allowlist | Einzige Kandidat-Quelle für `affiliate.status = present` |
| `fixture` | Repo-JSON, Tests | **Nie** `live_api`, **nie** `persisted_snapshot`, **nie** Affiliate `present` |

Verboten:

- Fixture- oder Testkatalog → `sourceKind: live_api` oder `persisted_snapshot`
- Client-`productUrl` als Attribution
- LLM/User als Provider-Hard-Truth
- `partnerNetPrice` als Kundenpreis
- Search-`fromPrice` oder Product-Detail-Preis als Current Quote ohne gültigen Check
- Authenticated Transport allein als `live_api`

`ActivityOption.preis` aus Preview/`fromPrice` bleibt darstellbar nur wenn die UI nicht „verbindlich verfügbar“ behauptet. S5-A-Composition ohne `retrievedAt` bleibt erlaubt; das mintet keine Persistenz.

---

## 4. Vorgeschlagene Viator-normalisierte Nutzlast

Jetnity-eigenes Schema, nicht das Roh-JSON der API. Rohformen dürfen den Workspace nicht erreichen.

```text
schema: jetnity.viator.activities.normalized.v1
evidenceMode: fixture | content_preview | schedule_hint | live_check
retrievedAt: ISO-8601 | absent when fixture
products[]:
  productCode            required
  productOptionCode      optional
  title                  required
  description            optional
  destinationIds[]       optional
  durationMinutes        optional
  timeslot               optional, never invented
  pricing:
    amount               finite >= 0 or absent
    currency             ISO-4217 or absent
    priceRole            rrp_from | rrp_check | unknown
  reviews:
    combinedAverage      optional
    totalReviews         optional
    // no review body in v1 foundation
  cancellation:
    stornierbar          boolean | unknown
    policyType           STANDARD | custom | ALL_SALES_FINAL | unknown
  geo                    optional lat/lon
  productUrl             optional; https + allowlisted host later; fixture URLs are not attribution
```

Diese `normalized.v1`-Form ist **search/preview only**. Sie beansprucht keine zertifizierte Product Detail Page und keine Redirect-Aktivierung.

Späteres `product_detail`-Gate (nicht Foundation): title, images, description, inclusions, exclusions, additionalInfo, cancellationPolicy, languageGuides, itinerary, ticketInfo, logistics.start/end sowie option-level language-guide/logistics, bevor PDP-UI oder Affiliate-Redirect live geht. Review-Volltexte / `viatorUniqueContent` bleiben separat verboten.

Fail-closed Normalizer (Skyscanner-analog):

- unbekanntes `schema` → leere Trefferliste, nicht throw-as-success
- leerer `productCode` → drop
- Preis ohne Währung oder nicht-finite/negativ → drop price, nicht drop product unless `live_check` requires both
- `live_check` ohne `retrievedAt` oder ohne belegte `available` → drop
- `productUrl`: `https:` **und** Host auf server-seitig konfigurierter Viator-/Whitelabel-Allowlist; unbekannter Host ⇒ keine Attribution, kein Redirect; Tracking-Parameter nicht umschreiben; Allowlist nicht aus Client-Daten; Fixture-URL setzt kein Affiliate-present
- Timeslot nur wenn Start-Datum und lokale Zeit belegt

---

## 5. Mapping auf Jetnity-Domäne

| Viator normalisiert | `ActivityOption` | Regel |
| --- | --- | --- |
| `productCode` | `externalRef` | provider-scoped; `provider = 'viator'` nur bei echtem Adapter, nicht in Fixtures als Hard-Truth-Akteur |
| `productOptionCode` | nicht in `ActivityOption` heute | später `providerOfferId` auf Provenance-Ebene, nicht S5-A-Refresh-Key |
| `title` / `description` | gleich | keine Übersetzung erfinden |
| `durationMinutes` | `dauerMinuten` | nur wenn Quelle trägt |
| timeslot | `timeslot` | Kalendertag der Anfrage; mehrtägig bleibt konflikt-`unbekannt` |
| `pricing.amount/currency` | `preis` / `preisWaehrung` | beide oder keines; Role bestimmt Truth-Satz |
| review summary | `bewertung` / `bewertungenAnzahl` | Summary only |
| cancellation | `stornierbar` | `unknown` ohne Policy; Flag `FREE_CANCELLATION` allein reicht nicht |
| tags | `kategorien`/`tags` | Roh-IDs nicht in die UI |
| `productUrl` | **nicht** `ActivityOption` | eigene Attribution-Naht |

`ActivityProvider` bleibt schmal: `suchen()` liefert Optionen. Kein Booking. Kein Deeplink im Port (ADR-0078).

Zukünftige optionale Naht, **nicht** in ADR-0199 und nicht in der ersten Foundation:

```text
ActivityAffiliateHinweis {
  providerId: 'viator'
  externalRef: productCode
  productUrl: https URL on server allowlist
  attributionIntact: true  // fail-closed if URL rewritten or host unknown
  evidenceMode: 'live_api' | never fixture
}
```

`trip_items.booking_url` bleibt `null`, bis ein späterer gegateter Slice serverseitig nachgewiesene Attribution erlaubt.

---

## 6. Destination- und Traveller-Vertrag

### Destination

Ohne belegte Abbildung `Jetnity-Ziel → destinationId` ist die Suche `unavailable` oder `empty` nach ehrlichem Grund, nicht eine geratene Stadt.

Resolver ist Viator-spezifisch über v2 **`/destinations`** (Basic/Full/Full+Booking/Merchant; wöchentlicher Cache). Er darf `destinationName` nicht fuzzy als Wahrheit verkaufen. Unmapped `placeId` → kein Call.

Älteres Golden-Path `/v1/taxonomy/destinations` ist historische Evidence, kein v2-Blocker.

### Traveller

- Affiliate-Suche braucht **keine** Staatsbürgerschaft, keinen Pass, keine MRZ.
- `participants` bleibt die Jetnity-Anfrage.
- `paxMix` nur wenn Age-Bands progressiv erhoben wurden.
- Fehlt Age-Band: kein `live_check`; Preview darf existieren, Live-Quote nicht.
- Kein Default-`ADULT` für die ganze Gruppe.
- Booking-Questions (Passport etc.) nicht implementieren.

### Locale

Nie eine nicht unterstützte `Accept-Language` senden. Jetnity-PL liegt außerhalb der belegten v2-Affiliate-Matrix ⇒ dokumentierter unterstützter Fallback/Content-Language-State; kein Claim, Viator habe Polnisch geliefert. Kein stilles Machine-Translation-Claim; `translationInfo` bewahren.

---

## 7. Zukünftiger Server-Transport (nicht dieser Slice, nicht die erste Foundation)

Wenn — und nur wenn — ein späterer Task Keys in einer nicht-öffentlichen Server-Umgebung erlaubt:

1. HTTP **nur** über `lib/server/providers/core/*` (ADR-0199): Timeout, Retry, Rate-Limit, Redaction, Observability. Kein zweiter Fetch/Retry-Stack.
2. Secret nur server-side; nie in Observer/Errors
3. Base URL default Sandbox; Production-Host extra PO-Gate. Ältere Golden-Path-Production-URLs autorisieren keinen Test.
4. Header: `exp-api-key`, `Accept-Language` nur aus belegter v2-Matrix, `Accept: application/json;version=2.0`
5. Timeout: zunächst Jetnity-Activities 12s fail-closed über den Kern; 120s nicht still übernehmen
6. 429/503 über ADR-0199 + P2 (`Retry-After` vs Exponential Backoff)
7. Kein Client als Provider-Proxy
8. Kill-Switch `JETNITY_ACTIVITY_AKTIV` + Factory-null + Production-Aus bleiben
9. Cost Guard vor jedem Preview-Live; persistenter Guard vor Production (bestehende Policy)
10. Parser toleriert additive Felder (P2 backward-compatible rule)

`/products/search` und `/products/{product-code}` bleiben `content_preview`, auch hinter authenticated Transport.

`/availability/check` nur nach **Full-access-Freigabe**, nur nach user-selected date + gültigem paxMix, nie als Search-Bulk/Kalender. Basic-Accounts können das nicht.

Booking-/Payment-Endpoints: dauerhaft außerhalb dieses Affiliate-Vertrags.

---

## 8. Offline-Fixtures der ersten späteren Foundation

Wie Skyscanner:

- statische JSON-Fixtures im Repo
- `evidenceMode: 'fixture'`
- Tests: kein `sourceKind`, kein `persistenz`, kein `freshUntil`, kein Affiliate-present
- malformed amount/currency/id/URL werden verworfen
- keine `process.env`, kein HTTP-Client, kein Trusted-Live-Konstruktor

Realistic fixture contents (synthetisch, nicht von einer Live-API):

- ein Produkt mit Option + RRP-from + https-`productUrl`
- ein Produkt ohne Preis
- ein Produkt mit ungültiger URL
- ein Produkt mit negativem Preis
- ein mehrtägiges Fenster

Keine echten Partner-PIDs aus P8/P9-Beispielen als Jetnity-Attribution kopieren.

---

## 9. Activation Gates (Reihenfolge)

Bereits gesetzt — **nicht erneut fragen**:

- Grobe Zielwahl: **Viator ist das akzeptierte erste spezialisierte Activities-Target**; GetYourGuide später. Current-State: `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md` §9 auf `origin/main`. ADR-0078 bleibt Domain-Architektur, kein zweites PO-Wahl-Gate Viator-vs-GYG.
- S5-B-Persistenz: Production-Migration `20260829140000_trip_item_commercial_provenance` ist **angewendet und verifiziert**. Kein Re-Apply. `production_write_path_allocated` bleibt `false`.

Noch offen:

1. Dieser Audit — TL Exact-Head-Re-Review
2. Offline Adapter Foundation = **search/preview only** (eigener Task, Proposal separat; startet nicht aus #189; kein Shared-Core-Edit)
3. Partner Qualification / Signup / Sandbox-Zugang / Vertrag — PO
4. Credentials / paid calls — PO
5. Full-access-Freigabe (nicht: ob Full-access `/availability/check` rufen darf)
6. Preview live search behind flags — Cost Guard; bleibt `content_preview`, nicht `live_api`
7. `/availability/check` + Nachweis — extra Gate nach Full-access; date + gültiges paxMix
8. `product_detail`-Normalisierung + zertifizierte Essential Product Information — extra Gate vor PDP/Redirect
9. Attribution-URL in UI / optional `booking_url` — extra Gate; Host-Allowlist; `rel="sponsored"`; `campaign-value` non-PII
10. Production-Aktivierung — bestehendes PROVIDER-ACTIVATION-GATE
11. Provider-Runtime-Write-Path / Principal-Allokation + echte Provider-Antwort + trusted S5-B-Write — extra Gate
12. Full+Booking oder Merchant — extra PO-Gate; nicht Teil dieses Affiliate-Vertrags

TW-8 bleibt geschlossen, solange keine echte Provider Commercial Provenance existiert. Foundation, Fixtures und das bereits angewendete S5-B-Schema öffnen TW-8 nicht.

---

## 10. Error-Mapping (zukünftig)

| Viator | Jetnity `ActivityProviderFehler` / Suchstatus |
| --- | --- |
| 401/403 | `unavailable` |
| 404 / tour not found | gültige Leere oder `invalid` je nach Kontext; nie als 500-Fehler der Reise |
| 429 endpoint | `rate_limited` + `Retry-After` |
| 429 overall cap | `rate_limited` + backoff |
| 503 | `unavailable` / transient `error` |
| timeout | `timeout` |
| schema fail | `invalid` / Treffer drop (`partial`) |

Leere Trefferliste ≠ Transportfehler.

---

## 11. Was der Vertrag bewusst nicht enthält

- Merchant-/Cart-Booking
- Katalog-Vollingestion
- Review-Volltexte / `viatorUniqueContent`
- Währungsumrechnung
- Widgets/Banners
- GetYourGuide-Adapter oder erneute grobe Providerwahl
- Zweiten Transport-Kern neben ADR-0199
- Shared-Core-Umbau in der Foundation
- Commercial-Provenance-Mint
- S5-B-Persistenz erneut anwenden
- Zertifizierte PDP/Redirect aus der minimalen Search-Form
