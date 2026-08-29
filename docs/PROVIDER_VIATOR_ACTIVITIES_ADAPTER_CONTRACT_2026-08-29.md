# Provider Viator Activities — Proposed Adapter Contract

Stand: 29. August 2026  
Status: **PROPOSED CONTRACT / NICHT IMPLEMENTIERT / NICHT FREIGEGEBEN**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Evidence: `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_2026-08-29.md`  
Muster: Skyscanner Flights offline foundation auf `main @ 69ef27b1`

> Vorschlag für den kleinsten zukünftigen `activities`-Adapter, der **nach** Annahme in den bestehenden provider-neutralen Kern einhängt. Keine Runtime in diesem Slice. Keine Shared-Core-Edits. Keine Providerwahl.

---

## 1. Zielklasse

**Angestrebte Viator-Klasse:** Partner API **v2 Full-access Affiliate**.

| Alternative | Warum nicht als Jetnity-Default |
| --- | --- |
| Basic-access Affiliate | Kein `/availability/check`. Für reine Content-Previews ausreichend; für day-specific Live-Quote zu schwach. Foundation darf Basic-Fixtures trotzdem parsen. |
| Full-access + Booking Affiliate | PCI, Zahlungsdaten, Cart-Hold/Book. Product-Owner-Sondergate. Kein Affiliate-Redirect-Modell. |
| Merchant | Jetnity wäre Merchant of Record: Invoice, Support, Markup, volle Booking-API. Eigenes Geschäftsmodell. |

Das ist eine **Adapter-Zielklasse**, keine Freigabe, Viator statt GetYourGuide (ADR-0078) zu wählen.

Verkauf bleibt Redirect auf die unveränderte `productUrl`. Viator bleibt Merchant of Record.

---

## 2. Shared-Core vs Viator-spezifisch

Shared-Core **nicht in diesem Slice und nicht durch den ersten Foundation-Slice ändern**, sofern der Kern bereits die Naht bietet:

| Verantwortung | Modul heute | Bleibt provider-neutral |
| --- | --- | --- |
| Suchanfrage / Option / Timeslot | `lib/activities/domain.ts` | ja |
| Port | `lib/activities/provider.ts` `ActivityProvider.suchen()` | ja; erzeugt keine Deeplinks |
| Nachweis | `lib/activities/nachweis.ts` | ja; getrennt von Search |
| Kill-Switch / Production-Aus | `lib/activities/zustand.ts` + `lib/provider-ops` | ja |
| Ranking / Tageskontext / Konflikt | `lib/activities/ranking.ts` u. a. | ja; provisionsneutral |
| Commercial Provenance | `lib/commercial-provenance` | ja; Adapter mintet nicht |
| Konto-Übernahme | `lib/activities/konto-uebernahme.ts` | ja; nur identifiers |

Viator-spezifisch, später unter `lib/providers/viator/activities/` (Name erst im Implementation-Slice):

- Destination-Resolver `placeId`/`destinationName` → `destinationId` (fail-closed)
- Parser/Normalizer für v2 Product Summary / Product / optional Check
- `productCode` / `productOptionCode`
- `Accept-Language` + Währung ohne stille Conversion
- unveränderte `productUrl` als Attribution-Objekt
- Age-Band-Missing-Facts
- Error-/429-/503-Mapping
- Observability: Endpoint, `X-Unique-ID`, RateLimit-Header, kein Secret

Nicht in den Shared-Core ziehen: Viator-Schemas, destId, campaign-value, RRP/Net-Preisobjekte.

---

## 3. Evidence-Klassen

Strikte Trennung, analog Skyscanner `evidenceMode: 'fixture'`:

| Klasse | Herkunft | Darf werden |
| --- | --- | --- |
| `content_preview` | `/products/search` oder Fixture-Äquivalent | Titel, Beschreibung, Tags, Foto-URL, Review-**Summary**, optionales `fromPrice` mit `amountStatus` unbelegt/`unknown` |
| `schedule_hint` | `/availability/schedules/{product-code}` | Tagesfenster/RRP-Hinweis; **nicht** live availability |
| `live_check` | `/availability/check` nach echtem Server-Transport | Einzige Kandidat-Quelle für eine spätere `live_api`-Quote; eigener Gate; Basic-Accounts können das nicht |
| `affiliate_redirect` | unveränderte `productUrl` aus Live-API | Einzige Kandidat-Quelle für `affiliate.status = present` |
| `fixture` | Repo-JSON, Tests | **Nie** `live_api`, **nie** `persisted_snapshot`, **nie** Affiliate `present` |

Verboten:

- Fixture- oder Testkatalog → `sourceKind: live_api` oder `persisted_snapshot`
- Client-`productUrl` als Attribution
- LLM/User als Provider-Hard-Truth
- `partnerNetPrice` als Kundenpreis
- Search-`fromPrice` als Current Quote ohne Check

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
  productUrl             optional https URL; fixture URLs are not attribution
```

Fail-closed Normalizer (Skyscanner-analog):

- unbekanntes `schema` → leere Trefferliste, nicht throw-as-success
- leerer `productCode` → drop
- Preis ohne Währung oder nicht-finite/negativ → drop price, nicht drop product unless `live_check` requires both
- `live_check` ohne `retrievedAt` oder ohne belegte `available` → drop
- `productUrl` nur `https:`; jede Mutation verboten; Fixture-URL setzt kein Affiliate-present
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

Zukünftige optionale Naht, **nicht** im Shared-Core dieses Audits:

```text
ActivityAffiliateHinweis {
  providerId: 'viator'
  externalRef: productCode
  productUrl: https URL
  attributionIntact: true  // fail-closed if URL rewritten
  evidenceMode: 'live_api' | never fixture
}
```

`trip_items.booking_url` bleibt `null`, bis ein späterer gegateter Slice serverseitig nachgewiesene Attribution erlaubt.

---

## 6. Destination- und Traveller-Vertrag

### Destination

Ohne belegte Abbildung `Jetnity-Ziel → destinationId` ist die Suche `unavailable` oder `empty` nach ehrlichem Grund, nicht eine geratene Stadt.

Resolver ist Viator-spezifisch. Er darf `destinationName` nicht fuzzy als Wahrheit verkaufen. Unmapped `placeId` → kein Call.

Taxonomie-Endpoint (`/destinations` vs P9 `/v1/taxonomy/destinations`) bleibt `VIA-UNK-06` und wird erst nach TL/PO-Klarstand verdrahtet.

### Traveller

- Affiliate-Suche braucht **keine** Staatsbürgerschaft, keinen Pass, keine MRZ.
- `participants` bleibt die Jetnity-Anfrage.
- `paxMix` nur wenn Age-Bands progressiv erhoben wurden.
- Fehlt Age-Band: kein `live_check`; Preview darf existieren, Live-Quote nicht.
- Kein Default-`ADULT` für die ganze Gruppe.
- Booking-Questions (Passport etc.) nicht implementieren.

---

## 7. Zukünftiger Server-Transport (nicht dieser Slice, nicht die erste Foundation)

Wenn — und nur wenn — ein späterer Task Keys in einer nicht-öffentlichen Server-Umgebung erlaubt:

1. Secret nur server-side
2. Base URL default Sandbox; Production-Host extra PO-Gate
3. Header: `exp-api-key`, `Accept-Language`, `Accept: application/json;version=2.0`
4. Timeout: zunächst Jetnity-Activities 12s fail-closed; 120s nicht still übernehmen
5. 429/503 nach P2 lesen (`Retry-After` vs Exponential Backoff)
6. Kein Client als Provider-Proxy
7. Kill-Switch `JETNITY_ACTIVITY_AKTIV` + Factory-null + Production-Aus bleiben
8. Cost Guard vor jedem Preview-Live; persistenter Guard vor Production (bestehende Policy)
9. Observability ohne Secret/PII: endpoint, status, latency, `X-Unique-ID`, rate-limit remaining
10. Parser toleriert additive Felder (P2 backward-compatible rule)

`/availability/check` erst nach Klärung `VIA-UNK-07` und nur auf Auswahl/Nachweis, nie als Search-Bulk.

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

1. Dieser Audit — Draft, TL-Review
2. Product-Owner: darf Viator als **erster Activities-Kandidat** verfolgt werden? (ADR-0078 unberührt bis dahin)
3. Offline Adapter Foundation (eigener Task, Vorschlag separat)
4. Shared-core nur, wenn die Foundation eine nachweislich fehlende Naht braucht — eigener Slice
5. Sandbox-Key + Partner Qualification — PO; keine Calls vorher
6. Preview live search behind flags — Cost Guard
7. `/availability/check` + Nachweis — extra Gate nach `VIA-UNK-07`
8. Attribution-URL in UI / optional `booking_url` — extra Gate
9. Production — bestehendes PROVIDER-ACTIVATION-GATE; S5-B Apply und TW-8 bleiben getrennt

Kein Gate überspringen. Foundation allein öffnet TW-8 nicht.

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
- GetYourGuide-Vergleichsimplementation
- Shared-Core-Umbau
- Commercial-Provenance-Mint
