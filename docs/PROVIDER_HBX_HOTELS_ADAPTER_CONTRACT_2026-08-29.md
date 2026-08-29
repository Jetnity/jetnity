# Provider HBX Hotels — Proposed Adapter Contract

Stand: 29. August 2026  
Status: **PROPOSED / NOT ACCEPTED / AUDIT PREP ONLY**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Gilt nur zusammen mit `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`

> Kein Runtime-Code. Kein Shared-Core-Edit. Kein Commercial-Provenance-Mint. Keine Produktentscheidung.

Dieses Dokument definiert den **kleinsten späteren** HBX-Hotels-Adapter gegen den bestehenden Hotel-Port und den **bereits integrierten** Server-Transport-Kern (ADR-0199). Es aktiviert nichts. HBX ist das erste konkrete Hotels-Adapter-Ziel; Booking.com Demand und Expedia Rapid bleiben später. Kein Booking-/Voucher-/Merchant-Pivot.

---

## 1. Zielnaht

```
HotelSuchanfrage / HotelProvider          (lib/hotels/*)
  → HBX adapter                           (future lib/providers/hotelbeds/hotels/*)
      → offline foundation: fixtures only; no shared-core edit
      → future HTTP: lib/server/providers/core/* (ADR-0199)
      → HBX host/signature/mTLS/retry override / parser
  → HotelOption + HotelProviderTreffer
```

Ein neuer „shared accommodations core“ ist **kein** Prerequisite. Nur wenn ein späterer Slice ein konkretes typed Domain-Loch in `lib/hotels` beweist, darf das separat gegatet werden.

Getrennte Nähte, die dieser Adapter **nicht** verschmilzt:

| Naht | Heute | HBX-Rolle |
| --- | --- | --- |
| `HotelProvider.suchen()` | existiert, Factory `null` | späterer Search-Port |
| `HotelNachweis` | Umgebung `null` | eigene Bestätigung; nicht in `suchen()` |
| Commercial Provenance | S5-A Vertrag; S5-B Persistenz-Foundation Production-verifiziert; Runtime-Write-Pfad geschlossen | nur zukünftiger Live-Transport darf `live_api`-Kandidat erzeugen; `persisted_snapshot` braucht allokierten Runtime-Write plus echte Provider-Antwort |
| Affiliate / Booking | `booking_url` immer `null` | HBX Booking/Voucher bleibt extra gegatet |
| Quartier / Ranking / UI | Jetnity-owned | kein HBX-Leak |

Provider-ID, falls später gewählt: `hotelbeds` (bereits in Commercial-Provenance-Tests als Beispiel-ID). Anzeigename „HBX Group / Hotelbeds“. Kein zweiter Alias als zweite Provider-Identität.

---

## 2. Hotel-Domain vs Shared Transport Core vs HBX Adapter

### 2.1 Bereits vorhanden — nicht neu erfinden

- Hotel-Domain/Port: `lib/hotels/domain.ts`, `lib/hotels/provider.ts`
- Shared Server-Transport: `lib/server/providers/core/*` (ADR-0199, integriert). Timeout/Retry/Redaction/HTTP. **Kein** zweiter generischer Transport-Core.
- Offline-Foundation mappt Fixtures direkt auf `HotelOption`. Keine Shared-Core-Edits.

### 2.2 Gehört nur in den HBX-Adapter

- `Api-key` + `X-Signature` Factory
- Fail-closed Host: Booking-API-Operationen (Availability/CheckRate/Booking) nur auf dokumentierten mTLS-Hosts, sobald mTLS erforderlich ist. Kein stiller Fallback auf `api.test.hotelbeds.com`. Evaluation/non-mTLS bleibt `unknown` (Audit U4) und blockiert TEST-Transport bis Auflösung.
- Explizite Retry-Policy: `retry5xx=false` für Availability/CheckRate/Booking. 400/500 nicht unverändert wiederholen (S5). Shared-Core-Default `retry5xx !== false` darf nicht erben.
- Explizites serverseitiges Pricing-Modell aus der kommerziellen Beziehung (`net` | `commissionable` | `unknown`)
- Hotel-Code-Auflösung aus Jetnity-Ort → gecachtem Content-Katalog
- Availability-Request-Builder (`stay`, `occupancies`, `hotels.hotel[]`, optional Filter)
- opaque `rateKey`-Transport
- `rateType` RECHECK/BOOKABLE
- `net` / `sellingRate` / `hotelMandatory` / taxes / cancellation nur nach Modellregel
- gecachter Boards-Katalog für `fruehstueckEnthalten`
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
| `fruehstueckEnthalten` | gecachter HBX Boards-Katalog (S8) oder ausdrücklich first-party-verifizierte Mapping-Evidence | unbekannter/ungemappter `boardCode` → `null`. Nicht `BB/HB/FB/AI` hardcoden. Kein realtime Content. |
| `zimmerName` | `room.name` | sonst `room.code` oder `null` |

`HotelSuchanfrage.destinationPlaceId` ist Jetnity-Ort, kein HBX-Destination-Code. Übersetzung nur über gecachten Katalog. Ohne Mapping: `unavailable` / `empty`, keine Fake-Hotels.

Occupancy: Jetnity `rooms/adults/children` 1:1. Wenn `children > 0` und Alter fehlt: fail-closed `invalid`. Default-Suche mit `children=0` braucht keine Alter.

`sourceMarket`: nur setzen, wenn der Markt des **Endkunden** belegt ist. Nicht aus erster Staatsbürgerschaft, nicht aus Trip-Währung, nicht aus Locale.

---

## 4. Preisregel

Das serverseitige HBX-Pricing-Modell kommt aus der **kommerziellen Beziehung** (S19), nie aus Client-Input, Citizenship, Locale oder Response-Shape.

Zulässige Modellwerte: `net` | `commissionable` | `unknown`.

1. Modell `unknown`: kein Consumer-Display-Preis. Fixtures dürfen `net`/`sellingRate`/`commission`-Shapes parsen; Display-Eligibility bleibt `unknown`/gegatet. Erste Foundation mintet keinen Anzeigepreis.
2. Modell `commissionable`: Anzeige-/Vergleichspreis ist `sellingRate` (final, unabhängig von `hotelMandatory`). Fehlt `sellingRate` → drop. `net` ist nicht der Consumer-Preis.
3. Modell `net`: `net` ist B2B-Netto, kein Consumer-Preis ohne erlaubte Markup-Regel. `sellingRate` ist Display nur wenn `hotelMandatory=true` (muss respektiert werden). Consumer-Preis aus `net` ohne diese Regel: verboten.
4. Modell nicht aus Feldpräsenz schließen (`sellingRate` oder `commission` vorhanden ≠ Commissionable).
5. `hotelMandatory=true` ohne respektierte `sellingRate`: drop.
6. `packaging=true`: drop, solange Jetnity keine Paketbuchung hat.
7. Keine stillen FX. `requestedCurrency != hotel.currency` → Currency-Mismatch, keine Conversion.
8. Request-Währung ist `unknown` (Audit U2). Adapter darf keine Währung „an HBX senden“, die nicht first-party belegt ist.

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
  options: HotelOption[]
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
- gültiger Preis nach §4 (bei Modell `unknown`: kein Display-Preis; Shape-Tests ohne Consumer-Mint erlaubt)
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
| Authentifizierte LIVE-Availability `BOOKABLE` | nur als **Kandidat** nach S5-A, nicht automatisch persistieren | Persistenz-Tabelle existiert; Write nur nach allokiertem Runtime-Principal/`production_write_path_allocated=true` plus echter Provider-Antwort |
| CheckRate 200 auf LIVE | Kandidat, Freshness weiter `unknown` ohne TTL | dasselbe Runtime-Write-Gate |
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

mTLS-Zertifikat/Private Key: eigenes Secret-Bundle. Dieses Audit erzeugt keines.

Availability / CheckRate / Booking: nur `api-mtls.test.hotelbeds.com` bzw. `api-mtls.hotelbeds.com`, sobald mTLS erforderlich ist (S7). **Kein** stiller Non-mTLS-Host. Evaluation ohne aufgelöstes Zertifikat/Umgebung: Transport bleibt fail-closed (`unknown`, Audit U4). Association-Cutover 14 Tage ist ein Ops-Gate.

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

HTTP läuft über ADR-0199. HBX **muss** die Shared-Core-Defaults überschreiben: `retry5xx=false` für Availability/CheckRate/Booking. S5: 400 oder 500 nicht unverändert erneut senden; 500 = Produkt weg, Funnel von Availability neu. Dieselbe Rate/`rateKey` nicht retryen. 401 → `invalid`/`unavailable`. 403 Quota/Key → `rate_limited` oder `unavailable`. 429 → `rate_limited` + `Retry-After` wenn vorhanden (kein automatisches 500-Retry). Timeout → `timeout`. Booking bleibt außerhalb der Foundation.

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
| G1 | Offline fixture foundation gegen bestehenden `HotelProvider` — Shared-Core-Edits nicht nötig | TL |
| G2 | TEST-Transport über ADR-0199: fail-closed mTLS, `retry5xx=false`, kein Mint | TL + Cost-Guard |
| G3 | Evaluation-Konto / Keys / Zertifikat — **nicht** durch Agenten | PO + Vendor |
| G4 | Content-Batch + Boards-/Hotel-Katalog | eigener Slice; keine Production-DB ohne PO |
| G5 | Explizites S19-Pricing-Modell aus der kommerziellen Beziehung | PO + Vendor |
| G6 | Consumer-facing Production-Aktivierung von HBX im Aggregator-/Redirect-Modell | PO / Commercial — **nicht** Booking-Pivot |
| G7 | Certification, Voucher, Live-Keys, Commercial Agreement — nur falls Booking-Produkt später extra autorisiert | PO + Vendor |
| G8 | S5-A Live-Quote-Kandidat | nur LIVE + echter Transport |
| G9 | S5-B Runtime-Write | Persistenz-Foundation ist bereits Production-verifiziert (`20260829140000`). Offen: Runtime-Principal, `production_write_path_allocated=true`, realer Provider-Snapshot. |
| G10 | Production-Hotelsuche / `JETNITY_HOTEL_AKTIV` | bestehendes Hotel-Production-Gate |

TW-8 bleibt hinter S5 **und** realer Commercial Provenance (echter Provider-Snapshot, nicht nur angewendete Persistenz-DDL). Dieser Contract öffnet TW-8 nicht. S5-B Production-Apply der Foundation ist **kein** offenes Gate mehr.

---

## 10. Bewusste Nicht-Ziele der ersten Foundation

- HTTP, Keys, mTLS, Signup
- CheckRate, Booking, Voucher, Reconfirmation
- Content-Datenbank
- Cache API, CDS
- `sourceKind` / Persistenz
- UI
- Booking.com- oder Expedia-Adapter
- Änderung von `lib/hotels/*`, `lib/server/providers/core/*` oder `lib/commercial-provenance/*`
