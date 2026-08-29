# Provider HBX Hotels — Proposed Adapter Contract

Stand: 29. August 2026  
Status: **PROPOSED / NOT ACCEPTED / AUDIT PREP ONLY**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Gilt nur zusammen mit `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`

> Kein Runtime-Code. Kein Shared-Core-Edit. Kein Commercial-Provenance-Mint. Keine Produktentscheidung.

Dieses Dokument definiert den **kleinsten späteren** HBX-`accommodations`-Adapter, der an den bestehenden Jetnity-Hotelport und — sobald akzeptiert — an einen provider-neutralen Adapter-Core andocken kann. Es aktiviert nichts.

---

## 1. Zielnaht

```
Jetnity HotelSuchanfrage
  → shared accommodations request (future core, not yet accepted)
    → HBX adapter
      → Content catalog lookup (batch, never realtime)
      → Availability transport (future server-only)
      → fail-closed parser / normalizer
    → shared accommodations offer (future core)
  → HotelOption + HotelProviderTreffer
```

Getrennte Nähte, die dieser Adapter **nicht** verschmilzt:

| Naht | Heute | HBX-Rolle |
| --- | --- | --- |
| `HotelProvider.suchen()` | existiert, Factory `null` | späterer Search-Port |
| `HotelNachweis` | Umgebung `null` | eigene Bestätigung; nicht in `suchen()` |
| Commercial Provenance | S5-A Vertrag; S5-B nicht Production | nur zukünftiger Live-Transport darf `live_api`-Kandidat erzeugen |
| Affiliate / Booking | `booking_url` immer `null` | HBX Booking/Voucher bleibt extra gegatet |
| Quartier / Ranking / UI | Jetnity-owned | kein HBX-Leak |

Provider-ID, falls später gewählt: `hotelbeds` (bereits in Commercial-Provenance-Tests als Beispiel-ID). Anzeigename „HBX Group / Hotelbeds“. Kein zweiter Alias als zweite Provider-Identität.

---

## 2. Shared Core vs HBX Adapter

### 2.1 Gehört in den späteren shared accommodations core

Nur das, was Skyscanner-Flights bereits für Flüge zeigt und was `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md` als Operationsvertrag vorschlägt. **Nicht in diesem Slice bauen.**

- provider-neutrales Accommodations-Request/Offer
- `evidenceMode: 'fixture' | 'live_transport'` — Live-Transport existiert erst mit echtem Serverpfad
- Fixture-Result **ohne** `sourceKind`, `persistenz`, `akteur`, `freshUntil`, `availability`, `affiliate`
- fail-closed Pflichtfelder: property id, offer id, currency, amount, retrievedAt
- Failure-Taxonomie kompatibel zu `HotelProviderFehler`: `timeout | unavailable | invalid | error` plus Mapping auf `rate_limited`
- kein UniversalOffer, keine HBX-Typen im Core

### 2.2 Gehört nur in den HBX-Adapter

- `Api-key` + `X-Signature` Factory
- Environment-Host-Wahl (`api.test` / mTLS-test / später live)
- Hotel-Code-Auflösung aus Jetnity-Ort → gecachtem Content-Katalog
- Availability-Request-Builder (`stay`, `occupancies`, `hotels.hotel[]`, optional Filter)
- opaque `rateKey`-Transport
- `rateType` RECHECK/BOOKABLE
- `net` / `sellingRate` / `hotelMandatory` / taxes / cancellation
- `sourceMarket` nur wenn der Markt des Endkunden belegt ist
- Content-Batch-Client (eigene spätere Slice)
- CheckRate/Booking/Voucher (eigene Gates, nicht Search-Foundation)

### 2.3 Gehört weder in Core noch in den ersten Adapter

- Jetnity-eigene Hotelbuchung
- erfundene Deeplinks
- realtime Content API
- Cache API / CDS
- Production-Keys
- Commercial-Provenance-Write
- UI, Ranking, Quartierlogik

---

## 3. Mapping-Vertrag Availability → Jetnity

Zieltyp bleibt `HotelOption`. Fehlende Evidence bleibt `null` / `unknown`, nie erfunden.

| Jetnity-Feld | HBX-Quelle | Fail-closed Regel |
| --- | --- | --- |
| `provider` | konstant `hotelbeds` | |
| `externalRef` | `String(hotel.code)` | fehlt oder nicht numerisch/positiv → drop |
| Offer-Neben-ID | `rateKey` als opaque `providerOfferId` | leer → drop. Nicht parsen. |
| `id` | Jetnity-seitig, nie HBX-roh | |
| `name` | `hotel.name` | leer → drop |
| `punkt` | `latitude`/`longitude` | unparseable → Option ohne Koordinate nur wenn später erlaubt; **erste Foundation: drop**, weil Quartier-Fit sonst lügt |
| `quartierName` | nicht aus HBX | `null` |
| `adresse` | nur Content-Katalog | sonst `null` |
| `sterne` | Content `simpleCode` 1–5 oder Availability `categoryCode` nur nach gemapptem Katalog | ungemappt → `null`, nicht aus `"4EST"` raten |
| `bewertung` / `bewertungenAnzahl` | nur wenn Tripadvisor-Filter-Response später belegt | sonst `null` |
| `preisGesamt` | siehe §4 | ungültig → drop |
| `preisProNacht` | `preisGesamt / Nächte` nur bei belegtem Stay | Nächte unbekannt → drop |
| `preisWaehrung` | `hotel.currency` ISO-4217 | fehlt/ungültig → drop |
| `steuernEnthalten` | `taxes.allIncluded` wenn vorhanden | sonst `null` |
| `stornierbar` | `cancellationPolicies` | leere Liste → `null`, nicht `true` |
| `stornierungBis` | frühestes `from` | Destination-Offset behalten; nicht in Kundenzeit umrechnen |
| `fruehstueckEnthalten` | `boardCode` in `{BB, HB, FB, AI}` → true; `RO` → false; sonst `null` | nicht aus Board-Namen raten |
| `zimmerName` | `room.name` | sonst `room.code` oder `null` |

`HotelSuchanfrage.destinationPlaceId` ist Jetnity-Ort, kein HBX-Destination-Code. Übersetzung nur über gecachten Katalog. Ohne Mapping: `unavailable` / `empty`, keine Fake-Hotels.

Occupancy: Jetnity `rooms/adults/children` 1:1. Wenn `children > 0` und Alter fehlt: fail-closed `invalid`. Default-Suche mit `children=0` braucht keine Alter.

`sourceMarket`: nur setzen, wenn der Markt des **Endkunden** belegt ist. Nicht aus erster Staatsbürgerschaft, nicht aus Trip-Währung, nicht aus Locale.

---

## 4. Preisregel

Reihenfolge, fail-closed:

1. Wenn `sellingRate` belegt und parseable ≥ 0: das ist der Anzeige-/Vergleichspreis.
2. Sonst wenn `net` belegt und parseable ≥ 0: `net` darf **nur** als interner B2B-Netto-Kandidat normalisiert werden, nicht automatisch als Consumer-Preis. Ohne spätere Commercial-Regel bleibt die Option für Jetnity-UI **unzulässig** (`drop` oder eigener Status `unknown` — erste Foundation: **drop**).
3. `hotelMandatory=true` ohne respektierte `sellingRate`: drop.
4. `packaging=true`: drop, solange Jetnity keine Paketbuchung hat.
5. Keine stillen FX. `requestedCurrency != hotel.currency` → Currency-Mismatch, keine Conversion.
6. Request-Währung ist `unknown` (Audit U2). Adapter darf keine Währung „an HBX senden“, die nicht first-party belegt ist.

Taxes: `included`/`allIncluded` nur durchreichen, nie nachrechnen.

---

## 5. Fixture-Shape

Schema analog Skyscanner. Fixtures sind Testdaten, keine Provider-Wahrheit.

```text
schema: 'jetnity.hbx.hotels.availability.normalized.v1'
```

Vorgeschlagene Fixture-Felder (normiert, nicht das Roh-JSON der API):

```ts
type HbxHotelsNormalizedAvailabilityFixture = {
  schema: 'jetnity.hbx.hotels.availability.normalized.v1'
  offers: Array<{
    hotelCode: string
    hotelName: string
    latitude: number
    longitude: number
    currency: string
    net: number | null
    sellingRate: number | null
    hotelMandatory: boolean | null
    taxesAllIncluded: boolean | null
    rateKey: string
    rateType: 'RECHECK' | 'BOOKABLE'
    roomCode: string
    roomName: string | null
    boardCode: string
    packaging: boolean
    paymentType: 'AT_WEB' | 'AT_HOTEL' | string
    cancellationFrom: string | null
    cancellationAmount: number | null
    retrievedAt: string
  }>
}
```

Normalizer-Ausgang, erste Foundation:

```ts
type AccommodationsFixtureSearchResult = {
  providerId: 'hotelbeds'
  evidenceMode: 'fixture'
  options: HotelOption[] // oder shared offer, dann Mapping
}
```

Verboten auf diesem Result: `sourceKind`, `persistenz`, `akteur`, `freshUntil`, `availability`, `affiliate`, `live_api`, `persisted_snapshot`.

---

## 6. Fail-closed Validation

Drop der einzelnen Offer, nicht der ganzen Suche, wenn ein Feld fehlt. `partial=true`, wenn mindestens eine gültige Option bleibt und mindestens eine verworfen wurde. Alle ungültig → leere `options`, nicht `ok` mit Fake-Daten.

Pflicht pro Offer:

- `hotelCode`, `hotelName`, `rateKey`
- gültige Koordinaten in der ersten Foundation
- gültige ISO-Währung
- gültiger Consumer-Preis nach §4
- `retrievedAt` gültiges ISO-Timestamp
- `packaging !== true`
- `rateKey` wird nicht zerlegt; nur Länge/Non-empty

Ungültige Fixture-`schema` → leeres Fixture-Result, kein Throw in den Commercial-Pfad.

---

## 7. Commercial-Truth-Sperre

| Evidence | Darf `live_api`? | Darf `persisted_snapshot`? |
| --- | --- | --- |
| Handgeschriebene / Testdateien-Fixture | nein | nein |
| Evaluation-Key, 50/Tag, TEST-Host | nein | nein |
| Certification-Umgebung | nein | nein |
| Authentifizierte LIVE-Availability ohne CheckRate bei `RECHECK` | nein | nein |
| Authentifizierte LIVE-Availability `BOOKABLE` | nur als **Kandidat** nach S5-A, nicht automatisch persistieren | nur über S5-B Write-Authority nach eigenem Gate |
| CheckRate 200 auf LIVE | Kandidat, Freshness weiter `unknown` ohne TTL | dasselbe Gate |
| Booking-Bestätigung | eigenes Booking-Produkt, nicht Search-Truth | eigenes Gate |

Mechanische Sperre analog Skyscanner:

1. Foundation-Modul hat **keinen** trusted/live Constructor.
2. Kein `process.env`, kein HTTP-Client, kein Secret.
3. Fixture-Result-Typ ist strukturell unvereinbar mit `commercialQuellePruefen` / Persistenz-Mint (kein `sourceKind`).
4. Tests beweisen: Fixture-Output enthält keine Truth-Felder und kann nicht als Quote übergeben werden, ohne neuen Server-Code.
5. Selbst späterer TEST-Transport setzt `evidenceMode` nie auf einen Wert, der S5-A `live_api` erlaubt. `live_api` nur bei LIVE-Host + LIVE-Key + serverseitig verifizierter Antwort.

Evaluation/TEST-Buchungen sind bei HBX „nicht real“. Für Jetnity bleiben sie trotzdem **keine** Production-Commercial-Truth.

---

## 8. Zukünftige Server-Komponenten

Erst nach eigenem Implementation-Task. Hier nur Vertrag.

### 8.1 Credential / Signature Factory

Server-only. Nie `NEXT_PUBLIC_*`.

Eingabe: `apiKey`, `secret`, `nowSeconds`.  
Ausgang: Header `Api-key`, `X-Signature = hex(sha256(apiKey + secret + nowSeconds))`.  
Kein Secret in Logs. Timestamp-Drift > wenige Minuten → 401; Factory selbst rechnet nicht „nach“.

mTLS-Zertifikat/Private Key: eigenes Secret-Bundle, eigener Host. Association-Cutover 14 Tage ist ein Ops-Gate, kein Search-Default.

### 8.2 Transport

| Call | Methode / Pfad | Wann |
| --- | --- | --- |
| Status | `GET /hotel-api/1.0/status` | health, nicht Truth |
| Availability | `POST /hotel-api/1.0/hotels` | Search |
| CheckRate | `POST /hotel-api/1.0/checkrates` | nur `RECHECK` oder explizite RateComments; nicht für jedes Resultat |
| Content hotels | `GET /hotel-content-api/1.0/hotels` | nur Batch-Job |
| Booking | `POST /hotel-api/1.0/bookings` | **nicht** im ersten Adapter |

Pflicht-Header: `Accept: application/json`, `Accept-Encoding: gzip`, bei POST `Content-Type: application/json`.

Timeouts: Search bleibt in Jetnity-Hotelgrenze (heute 12 s). Booking-Confirmation später ≥ 60 s — irrelevanter Search-Slice.

Kein Retry auf 400. 500 Availability/CheckRate → Funnel neu, nicht dieselbe Rate. 401 → `invalid`/`unavailable`. 403 Quota/Key → `rate_limited` oder `unavailable`. 429 → `rate_limited` + `Retry-After` wenn vorhanden. 5xx/timeout → `error`/`timeout`.

Availability: eine Call-Serie, möglichst alle gemappten Hotel-Codes, max 2000. Nicht nach CheckRate/Booking wiederholen.

### 8.3 Parser / Normalizer

Akzeptiert nur JSON. Unbekanntes Feld ignorieren (non-breaking). Bekanntes Pflichtfeld fehlt → drop. `rateKey` opaque kopieren.

### 8.4 Deeplink / Booking

Kein Deeplink in first-party Hotels-Docs. `booking_url` bleibt `null`. Booking/Voucher/Holder-PII sind ein anderes Produkt.

`HotelNachweis` für HBX, falls später: serverseitig Rate gegen denselben Kontext erneut belegen. Bei `RECHECK` ist CheckRate die natürliche Nachweisoperation — **nicht** in der Search-Foundation.

### 8.5 Observability

Erlaubt: `providerId`, environment (`evaluation|certification|live`), operation (`availability|checkrates|content_batch`), HTTP-Status, latency, hotel-count requested/returned, dropped-offer-count, `partial`, quota-class.

Verboten: apiKey, secret, signature, raw rateKey in Info-Logs (höchstens hash), Pax-Namen, Karten, vollständige Roh-Payload.

### 8.6 Error-Mapping

| HBX / HTTP | Jetnity |
| --- | --- |
| 401 signature/key | `unavailable` oder `invalid` — kein Secret-Leak in Message |
| 403 evaluation quota / wrong key-env | `rate_limited` bzw. `unavailable` |
| 429 | `rate_limited` |
| 400 malformed | `invalid` |
| 500 product gone | Search: `error` / leer; Nachweis: `abgelaufen` oder `geaendert` |
| timeout | `timeout` |
| leere Hotel-Liste | `empty` — Aussage, kein Fehler |
| Content realtime temptation | nicht aufrufen |

Nutzertexte bleiben Jetnity-owned, nicht HBX-roh.

---

## 9. Aktivierungs-Gates

Keine implizite Kette. Jedes Gate ist ein eigener Auftrag.

| Gate | Inhalt | Wer |
| --- | --- | --- |
| G0 | Dieser Audit / Contract | TL Review, Draft |
| G1 | Shared accommodations core akzeptiert **oder** bewusste Entscheidung, bestehenden `HotelProvider` als einzige Naht zu nutzen | TL / ggf. PO bei Produktänderung |
| G2 | Offline fixture foundation | normaler TL-Slice, analog Skyscanner |
| G3 | Evaluation-Konto / Keys — **nicht** durch Agenten | PO |
| G4 | Server-Transport TEST, kein Mint, Production hart aus | TL + Cost-Guard-Review |
| G5 | Content-Batch + Katalog-Persistenz | eigener Slice; keine Production-DB ohne PO |
| G6 | Product Owner: HBX nur Search-Backup vs. Booking-Produkt | PO |
| G7 | Certification, Voucher, Live-Keys, mTLS, Commercial Agreement | PO + Vendor |
| G8 | S5-A Live-Quote-Kandidat | nur LIVE + echter Transport |
| G9 | S5-B Persistenz-Write | bestehendes S5-B Production-Gate |
| G10 | Production-Hotelsuche / `JETNITY_HOTEL_AKTIV` | bestehendes Hotel-Production-Gate |

TW-8 bleibt hinter S5 **und** realer Commercial Provenance. Dieser Contract öffnet TW-8 nicht.

---

## 10. Bewusste Nicht-Ziele der ersten Foundation

- HTTP, Keys, mTLS, Signup
- CheckRate, Booking, Voucher, Reconfirmation
- Content-Datenbank
- Cache API, CDS
- `sourceKind` / Persistenz
- UI
- Booking.com-Adapter
- Änderung von `lib/hotels/*` oder `lib/commercial-provenance/*` außer später explizit gegateten Mapping-Dateien
