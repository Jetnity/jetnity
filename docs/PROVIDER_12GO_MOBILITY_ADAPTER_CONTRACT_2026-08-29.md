# Provider 12Go – vorgeschlagener Mobility-Adapter-Vertrag

Stand: 29. August 2026  
Status: **CONTRACT PREP ONLY / NICHT AKZEPTIERT / KEINE RUNTIME / KEIN SHARED-CORE-EDIT**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Task: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Evidence: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`  
Vorgeschlagener ADR: `docs/ADR_0199_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md` (**nicht angenommen**)

Dieser Vertrag definiert die **kleinste spätere** 12Go-Mobility-Naht, die an den vorhandenen Jetnity-Mobility-Port und – sobald akzeptiert – an den shared Provider-Adapter-Core anschließen kann. Er implementiert nichts.

---

## 0. Harte Grenzen

1. Keine Runtime-Datei in diesem Slice.
2. Kein Shared-Core-Edit (`lib/provider-ops`, `lib/commercial-provenance`, `lib/mobility/*` bleiben unverändert).
3. Kein Signup, kein API-Approval-Request, kein Secret, kein realer Call.
4. Kein Commercial-Provenance-Mint. Fixture/Test/Affiliate-Link ≠ `live_api` ≠ `persisted_snapshot`.
5. `rental_cars` bleibt eigene Jetnity Commercial Domain. 12Go-About nennt „Car rent“; das wird **nicht** in diesen Adapter gefaltet.
6. 12Go-Flights bleiben außerhalb. Jetnity-Flights sind Duffel/Skyscanner-Domäne.
7. Daytrips, Tours, Rail Passes, Helicopters: **out of adapter**, bis ein eigener, gegateter Vertrag existiert.
8. TW-8 bleibt geschlossen.

---

## 1. Jetnity bleibt SoT

| Schicht | Owner | 12Go-Rolle |
| --- | --- | --- |
| Trip-Graph, Stages, `trip_items.kind=transfer` | Jetnity | keine |
| `MobilitySuchanfrage` / `MobilityOption` / Ranking | Jetnity `lib/mobility` | Adapter normalisiert **hinein**, leaket 12Go-Rohformen nicht nach außen |
| `MobilityNachweis` | Jetnity | späterer Server-Nachweis; Umgebung heute `null` |
| Commercial Provenance | Jetnity S5-A/S5-B | nur späterer live Server-Transport darf eine `live_api`-Kandidatquote erzeugen; S5-B-Write extra gegatet |
| Route Truth / Bewegungskanten | Jetnity, traveller-neutral | 12Go-Fahrplan ist Anbieterfakt, keine Anschlussgarantie |
| Traveller-Credentials / Citizenships | Jetnity | 12Go darf keine Visa-/Eligibility-Wahrheit setzen |
| Rental Cars | Jetnity `lib/rental-cars` | **nicht dieser Adapter** |
| Flights | Jetnity `lib/flights` / Skyscanner-Foundation | **nicht dieser Adapter** |
| Booking/Payment | 12Go auf 12Go-Sites | Jetnity redirected; nimmt kein Ticketgeld |

`MobilityProvider.suchen()` bleibt schmal und erzeugt **keine** Booking-URL in der Domäne (bestehender Kommentar in `lib/mobility/provider.ts`). Affiliate/Deeplink ist eine getrennte spätere Verantwortlichkeit.

---

## 2. Shared-Core vs. 12Go-spezifisch

### 2.1 Shared / bereits vorhanden – nicht in diesem Slice ändern

| Verantwortlichkeit | Ort heute | Später |
| --- | --- | --- |
| Mobility-Domäne | `lib/mobility/domain.ts` | unverändert wiederverwenden |
| Provider-Port | `MobilityProvider` | 12Go implementiert den Port, ändert ihn nicht |
| Nachweis-Port | `MobilityNachweis` | eigener 12Go-Nachweis **nach** Live-Transport |
| Kill Switch | `JETNITY_MOBILITY_AKTIV` + Production hart aus | unverändert |
| Request-Härtung / Failure-Taxonomie / Cost Guard | `lib/provider-ops` | Shared-Core, erst nach Accept |
| Commercial Provenance | `lib/commercial-provenance` | provider-neutral; Domain `mobility` |
| Neutraler Flight-Adapter-Schnitt | `lib/providers/flights/*` | **Vorbild**, kein Copy der Flight-Typen nach Mobility |

### 2.2 Vorgeschlagene spätere 12Go-Dateien (nicht anlegen in diesem Slice)

Analog Skyscanner, erst nach eigenem Implementation-Task:

```text
lib/providers/twelve-go/mobility/contracts.ts   # Jetnity-owned normalized 12Go-Sicht
lib/providers/twelve-go/mobility/adapter.ts     # offline Fixture-Normalizer zuerst
lib/providers/twelve-go/mobility/mapping.ts     # Mode-/Slug-Mapping, fail-closed
# transport.ts / auth.ts erst mit genehmigtem API-Vertrag und server-only Secrets
```

Vorgeschlagene Jetnity-`providerId`: `twelve_go`  
Begründung: stabil, kein führendes Digit, nicht 12Gos internes Partner-ID-Format (das ist **UNKNOWN**).

Kein Import von 12Go-Typen in `lib/commercial-provenance/*` oder `lib/mobility/domain.ts`.

---

## 3. Mapping-Grenzen

### 3.1 Transportarten

Öffentlich genannt (Affiliate FAQ E-AFF-01, Reseller FAQ E-RES-01, About E-CON-01, Terms E-CON-03):

| 12Go-öffentlich | Jetnity `MobilityMode` | Regel |
| --- | --- | --- |
| train / trains | `rail` | erlaubt |
| bus / buses | `bus` | erlaubt |
| ferry / ferries | `ferry` | erlaubt |
| van / vans / minivan | `transfer` | erlaubt; nicht eigener Mode |
| taxi / taxis | `transfer` | erlaubt |
| airport transfers / shuttle services | `transfer` | erlaubt, wenn als Point-to-point belegt |
| flights | **nicht mappen** | Flights-Domain |
| car rent | **nicht mappen** | Rental-Domain; Inventar **UNKNOWN** |
| rail passes | **nicht mappen** | kein Bewegungskanten-Ticket |
| daytrips / tours | **nicht mappen** | Activity/Out-of-scope |
| helicopters | **nicht mappen** | kein Jetnity-Mode; `UNKNOWN` bis Extra-Vertrag |

Unbekannte 12Go-Typen → verwerfen, nicht raten. `partial=true`, wenn gültige Optionen übrig bleiben.

### 3.2 Suche / Fahrplan (öffentlich) vs. API (UNKNOWN)

Öffentlich (FAQ E-CON-04):

- Eingabe: Origin-Name, Destination-Name, Reisedatum, Passagierzahl; optional Return.
- Ausgabe: Verbindungen nach Abfahrt und Transportart; Operator, Klasse, Transitzeit.
- Nicht jeder angezeigte Trip hat einen Buy-Button → nicht buchbar.
- Interline / mehrere Modi auf einer Plattform (About) ≠ Jetnity-Anschlussgarantie.

API-Request/Response, Pagination, Filter, Roundtrip-Encoding, kombinierte Legs: **UNKNOWN**.

Jetnity-Anfrage bleibt `MobilitySuchanfrage`. Fehlende 12Go-Location-ID → Adapter darf nicht erfinden; Suche fail-closed oder ehrlich `unavailable`/`invalid`.

### 3.3 Identifiers

| Fakt | Öffentlich | Adapter-Regel |
| --- | --- | --- |
| Affiliate partner ID | nach Approval im Dashboard | Server-only, nie Client-Env |
| Sub-ID | „am Ende der Links“ | Jetnity darf eine eigene Attribution setzen; **Parametername UNKNOWN** |
| Booking ID | nach Confirmed Booking | nicht vor Buchung als `externalRef` erfinden |
| Operator name | UI/FAQ | `operatorName` nur wenn belegt |
| Connection / train number | FAQ erwähnt Zugbuchung | `connectionRef` nur wenn belegt |
| API trip/service/offer IDs | **UNKNOWN** | Fixture darf keine erfundenen Produktions-IDs als Live-Refs ausgeben |

`externalRef` ist provider-scoped (ADR-0168). Ohne belegte 12Go-Ref: Option verwerfen. Slug allein (`bangkok/chiang-mai`) ist **keine** Offer-Identität.

### 3.4 Orte

Öffentlich beobachtet (Homepage E-CON-05, keine Suche ausgelöst):

```text
/{locale}/travel/{origin-slug}/{destination-slug}
/{locale}/travel/{country-or-place-slug}
```

Beispiele (href, nicht als Fahrplan-Truth): `/en/travel/amphawa/bangkok`, `/en/travel/alanya-hotel-transfer/antalya-airport`.

Taxonomie (Station vs. Stadt vs. Flughafen vs. Hotel-Transfer), Aliase, Place-IDs, Koordinaten: **UNKNOWN**.  
Jetnity `originPlaceId` / `destinationPlaceId` bleiben Jetnity-Places **ohne FK-Zwang**. 12Go-Slugs dürfen optional als Anzeige-/Deeplink-Hint liegen, nicht als Place-SoT.

### 3.5 Zeit / Zone

- FAQ und Terms sprechen von geplanten Abfahrten in der Operator-Lokalzeit.
- Encoding (Offset, IANA, naive local, Datum-only): **UNKNOWN**.
- 12Go haftet nicht für knappe Anschlüsse (Terms 2.7). FAQ rät konsumseitig u. a. 5 Stunden vor Anschlussflug bei Fähre/Wetter – das ist **kein** Jetnity-Regelwert.
- Jetnity berechnet keine „knapp/genug“-Umstiege aus 12Go-Daten (bestehende Mobility-Foundation).

### 3.6 Preis / Währung / Fees

Öffentlich:

- Preise ändern sich zwischen Suche und Payment (Terms 1.5).
- 12Go kann Service-/Convenience-/Cross-border-Fees erheben; oft nicht erstattbar (Terms 4.2, 6.1).
- Affiliate-Payout-Währungen sind dokumentiert (THB/USD/EUR/…); das ist **nicht** die Quote-Währung der Tickets.
- Reseller-Deposit: THB, USD, EUR (E-RES-01).

API-Währungsfeld, Minor-Units, Fee-Breakdown, Conversion: **UNKNOWN**.  
Adapter: keine stille Conversion. `requestedCurrency != quotedCurrency` → mismatch, kein Erfinden. Fehlender Betrag oder fehlende Währung → Option verwerfen oder `preis=null` plus keine Current-Quote.

### 3.7 Verfügbarkeit

Öffentlich (FAQ):

- Sitze auf der Checkout-Seite.
- Bus: Maximum im System.
- Fähre: oft mehr Sitze als angezeigt.
- Thai-Train: Quota, nicht Live-Railway; „0“ heißt 0.
- Fehlender Buy-Button: nicht buchbar.

S5-A zertifiziert kein `available`. Fehlende Evidence bleibt `unknown`. Fixture darf kein `available=true` erfinden.

### 3.8 Deeplink / Attribution

Öffentlich:

- Unique partner ID in Cookies, 30 Tage, last-click (E-AFF-01, E-AFF-02).
- Sub-ID zur Kanaltrennung.
- Tools: deep-links, search form, timetable, banners, white label, data feeds, API.
- iframe **verboten** (E-BLOG-02).
- Cookie stuffing verboten (E-AFF-02).
- PPC Brand Bidding verboten.
- Consumer Terms verbieten Deep-Link/Framing ohne Erlaubnis und Bots/Scrapers (E-CON-03 §9.3).

Parameter-Namen (`?z=`, `?ref=`, …): **UNKNOWN**.  
Späterer Builder: nur `https:` Hosts `12go.asia` / `12go.com` (und später schriftlich freigegebene White-Label-Hosts). Malformed → `null`, nicht raten.  
Ein gültiger Fixture-Deeplink ist **keine** Affiliate-Evidence (`affiliateStatus` bleibt `unknown`, bis ein echter Partner-Click plus Tracking-Beleg existiert).

### 3.9 Booking vs. Reseller

| Pfad | Wer bucht / zahlt | Jetnity-Empfehlung |
| --- | --- | --- |
| Affiliate + Redirect | Endkunde auf 12Go; 12Go Intermediär zum Supplier | **Default** für diesen Adapter |
| White Label | weiter 12Go-gehostet | kein Trip-Workspace-Ersatz |
| Reseller-Portal | Agent bucht; Deposit; extra Top-up | **nicht** Consumer-Adapter; eigenes PO-Gate, falls je |
| API „searching and booking Tickets“ (Terms-Definition) | **UNKNOWN** | Wenn Booking/Payment enthalten: extra PO-Gates (Payments, Secrets, Verträge) |

Affiliate Terms: keine Provision bei „redirect inventory sales, when booking is completed on an operator website“. Das darf Jetnity nicht als gebuchte Jetnity-Wahrheit oder sichere Commission behandeln.

12Go bestätigt Buchungen oft nicht instant (Terms 2.3). Ein Redirect ist kein `booked`.

### 3.10 Auth / Environments / Quotas / Errors

Alles **UNKNOWN**, bis 12Go nach Approval vertrauliche Bedingungen mitteilt. Dieser Vertrag erfindet keine Header, keine OAuth-/API-Key-Form, kein Sandbox-Host, keine 429-Semantik.

Zukünftiger Transport (erst nach Docs):

- server-only;
- Timeout an `MOBILITY_SUCHE_GRENZEN.timeoutMs` (12 s) oder strenger dokumentierter Provider-Wert;
- kein `process.env` im Client;
- Provider-Fehler mappen auf vorhandenes `MobilityProviderFehler`: `timeout | unavailable | invalid | error`;
- Rate-Limit über Shared-Core, nicht als 12Go-Rate-Limit-Wahrheit erfinden.

### 3.11 Localization

Öffentlich viele UI-Sprachen und Anzeige-Währungen (Privacy-Chrome E-PRI-02). Welche Locale/Currency die API akzeptiert: **UNKNOWN**.  
Jetnity sendet später nur belegte Locale/Currency; sonst Default-`unknown`/fail-closed, kein stilles THB.

### 3.12 Storno / Terms

Supplier Product Terms steuern Change/Cancel/Refund. Antrag in der Regel ≥ 24 h vor Abfahrt; viele Produkte non-refundable; 12Go-Servicefees oft earned (Terms §6).  
`stornierbar` in `MobilityOption` nur bei belegtem Providerfakt, sonst `null`. Jetnity erfindet keine Flex-Tarife.

---

## 4. Offline-Fixtures – erlaubte vs. verbotene Fakten

Fixtures sind **Test-Evidence**, analog `FlightProviderFixtureSearchResult.evidenceMode = 'fixture'`.

### 4.1 Erlaubt (aus öffentlichem Vertrag ableitbar)

- `providerId: 'twelve_go'`
- `evidenceMode: 'fixture'`
- `mode`: nur `rail | bus | ferry | transfer`
- Anzeige-Origin/Destination als Slug- oder Namensstrings, klar als Fixture gekennzeichnet
- `https://12go.asia/en/travel/{origin}/{destination}` als **nicht-attributierter** Beispiel-Deeplink (ohne erfundene Partner-Query)
- `retrievedAt` nur als Fixture-Timestamp in Tests, **ohne** `sourceKind`
- explizit fehlende Felder als `null` / weggelassen

### 4.2 Verboten

- `sourceKind: 'live_api' | 'persisted_snapshot'`
- `persistenz: 'snapshot'`
- `availability: 'available'` oder erfundenes Seat-Count
- erfundene API-Feldnamen (`trip_id`, `vehclass`, …)
- erfundene Partner-Query (`?affiliate=`, `?subid=`), solange der Parameter **UNKNOWN** ist
- Flights, rental, rail pass, tour, helicopter als Mobility-Option
- Passport-/MRZ-/Gender-Pflicht als Jetnity-Hard-Requirement
- Affiliate-Status `present` allein wegen eines Fixture-Links

### 4.3 Vorgeschlagene Jetnity-owned Normalized-Form (kein 12Go-Schema)

Kein Anspruch, 12Gos API zu beschreiben:

```text
schema: 'jetnity.twelve-go.mobility.normalized.v1'
offers[]:
  offerRef          # Pflicht, Fixture-lokal, nicht als Production-Ref wiederverwenden
  mode              # rail|bus|ferry|transfer
  originName
  destinationName
  originSlug?       # optional, öffentlich beobachtetes URL-Muster
  destinationSlug?
  departureLocal?   # nur wenn Fixture ihn setzt; Zone UNKNOWN
  arrivalLocal?
  durationMinutes?
  changes?
  operatorName?
  connectionRef?
  amount?           # ohne amount keine Quote
  currency?         # ISO-4217; sonst verwerfen
  deeplink?         # https 12go.asia|12go.com, ohne erfundene Tracking-Query
  retrievedAt       # Fixture-clock
```

Felder, die 12Go-API vermutlich hat und die wir **nicht** spezifizieren: **UNKNOWN**.

---

## 5. Zukünftiger Server-Transport (nicht dieser Slice)

Reihenfolge, sobald PO + 12Go-Approval + offizielle vertrauliche Docs vorliegen:

1. **Secret-Injektion** nur Server, kein `NEXT_PUBLIC_`.
2. **Parser** fail-closed gegen das dann vorliegende offizielle Schema; unbekanntes Feld ignorieren, fehlendes Pflichtfeld verwerfen.
3. **Normalizer** → Jetnity `MobilityOption` + getrenntes Deeplink-Objekt.
4. **Multimodal mapping** nach §3.1.
5. **Deeplink attribution** mit dokumentiertem Partner-ID- und Sub-ID-Parameter; Cookie-Truth bleibt 12Go-seitig.
6. **Observability**: Latency, HTTP-Klasse, mapped error, **kein** PII, kein Secret, keine vollständigen Karten-/Passdaten.
7. **Error mapping** auf `MobilityProviderFehler` / Suchstatus `timeout|unavailable|invalid|error|partial|empty`. Empty ≠ Error.
8. **Kein Trusted-Live-Constructor**, bevor der Transport existiert (Skyscanner-Vorbild).

Commercial-Provenance: nur der live Server-Pfad darf eine S5-A-Kandidatquote mit `sourceKind=live_api` und `actor=provider_adapter` erzeugen. Fixture-Normalizer hat diese Funktion nicht. Persistenz bleibt S5-B / Production-Apply extra gegatet.

---

## 6. Traveller Context

Relevant, aber minimieren:

- 12Go Privacy Policy sammelt für Identity u. a. DOB, Passport/ID, Gender, Nationality (E-PRI-02).
- FAQ: Zug/Flug brauchen Reisepassnummer und Geschlecht; Kinder-DOB für Preis.
- Jetnity wertet **keine** 12Go-Ticketregeln als Visa-/Transit-/Eligibility-Truth.
- Mehrere Staatsbürgerschaften/Dokumente bleiben Jetnity-seitig 1:n; kein `documents[0]` an 12Go.
- Progressive Facts: zuerst Origin/Destination/Datum/Reisendenzahl. Dokumente nur, wenn ein späterer offizieller API-/Checkout-Vertrag sie für einen konkreten Mode verlangt **und** ein PO-Gate für sensible Dokumentweitergabe gilt.
- Route Truth bleibt traveller-neutral und wiederverwendbar.

---

## 7. Aktivierungs-Gates (keiner in diesem Slice geschlossen)

| Gate | Wofür |
| --- | --- |
| Unabhängiger TL-Review dieses Audits | Docs mergen, nicht aktivieren |
| Shared Adapter Core accepted | Falls der Implementation-Task ihn voraussetzt |
| PO: Affiliate-Enrollment ja/nein | Kostenlos, aber Antrag + Approval; **kein Agent-Signup** |
| PO: API-Antrag ja/nein | Nur bei etablierter Website + 12Go-Consent; confidential docs danach |
| PO: Secrets / paid calls / Live | Besonderes Product-Owner-Gate |
| Cost Guard persistent | Vor bezahlter/Production-Suche |
| S5-B Production-Apply | Nur wenn Quotes persistiert werden sollen; TW-8 weiter extra |
| Legal: Affiliate Terms + Consumer Terms + Privacy | Besonders Datenweitergabe an 12Go |
| Nicht: Reseller, White-Label-Cutover, iframe, Scraping | |

---

## 8. Empfohlener kleinster Folgeschnitt

Nicht gestartet. Siehe `docs/PROVIDER_12GO_MOBILITY_ADAPTER_IMPLEMENTATION_TASK_PROPOSAL_2026-08-29.md`.

Offline-Foundation nach Skyscanner-Muster: Jetnity-owned Normalized Contract + Fixture-Normalizer + Tests, die beweisen, dass Fixture-Output keine `sourceKind`/`persistenz`/`freshUntil`/`availability`/`affiliate`-Truth trägt. **Kein** Live-Transport.
