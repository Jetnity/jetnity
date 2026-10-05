# Travel Safety & Disruption Intelligence – Foundation Architecture Audit

Stand: 23. August 2026  
Status: **Ist-Stand vor Safety-Implementierung, geprüft gegen aktuelles Repository auf `main`**

Dieses Audit ist die Phase-1-Voraussetzung aus `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`. Es beschreibt **nur belegten Code** – keine geplante Safety-Domäne.

Verbindliche Policies: `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`, `docs/PRODUCT_OWNER_PR34_TRAVEL_SAFETY_ADDENDUM.md`.

---

## 0. Executive summary

| Bereich | Ist-Stand | Safety-Relevanz |
| --- | --- | --- |
| Trip-Graph | Ein kanonischer `Trip`-Typ, Guest/Account-parität | Stabile IDs für Scope-Matching wiederverwenden |
| Route Truth (Foundation D) | `lib/route/*`, Itinerary in `trip_items.metadata` | **Einzige** Origin-/Transit-/Airport-Wahrheit – nicht duplizieren |
| Readiness (Foundation E) | Provider-neutral, fail-closed, Fingerprint v2 + Official off-v2 | **Blueprint** für Evidence/Freshness/Factory/API |
| Workspace | Übersicht + Bereichsstatus; **kein** `Jetzt wichtig` | Minimaler Dock: optionaler Prop + Übersicht-Slot |
| Safety-Code | **Nicht vorhanden** | Grünes Feld unter `lib/safety/` |
| DB für abgeleitete Official/Safety-Evaluations | **Nein** (nur User-Readiness persistiert) | Empfehlung: zunächst **keine** Safety-DB |

---

## 1. Trip Domain / Trip / trip_stages / trip_items / trip_days

### 1.1 Kanonischer Trip-Typ

| Symbol | Pfad | Rolle |
| --- | --- | --- |
| `Trip`, `TripStage`, `TripDay`, `TripItem`, `TripTraveller`, … | `types/trips.ts` | **Single application model** – Guest und Account |
| `Reisegraph` | `types/trips.ts` | Alias für `Trip` |
| `TripSummary` | `types/trips.ts` | Listenansicht ohne Graph |
| `CreateTripInput` | `types/trips.ts` | Formular /planen |
| `reiseLesen`, `PlanpunktFormular`, `ReiseNutzlast` | `lib/trips/schema.ts` | Runtime-Validierung (Zod-ähnlich) |
| `reiseAus`, `planpunktAus`, `etappeAus`, `alsNutzlast` | `lib/trips/abbildung.ts` | DB snake_case → camelCase |
| `reiseLaden`, `reisenLaden` | `lib/trips/daten.ts` | Account-Reads (RLS, kein Service Role) |
| `TRIP_GRAPH_SELECT_KANONISCH` | `lib/trips/foundation-e-select.ts` | Embedded Graph SELECT inkl. Traveller-Children |

Produktregel (Kommentar in `types/trips.ts`): **Eine Form** für Gast und Konto; Unterschied nur in der Kennung (`trip-<uuid>` lokal vs. DB-UUID).

### 1.2 Stabile IDs / Refs (Safety kann wiederverwenden)

| Entität | Account (DB) | Gast (localStorage) | Idempotenz / Client-Ref |
| --- | --- | --- | --- |
| Reise | `trips.id` (UUID) | `Trip.id` (typ. `trip-<uuid>`) | `trips.client_ref` / `Trip.clientRef` – unique `(user_id, client_ref)` |
| Etappe | `trip_stages.id` | `TripStage.id` | Position + `place_id` strukturiert |
| Tag | `trip_days.id` | `TripDay.id` | `dayIndex`, optional `dayDate` |
| Planpunkt | `trip_items.id` | `TripItem.id` | `stageId`, `dayId`, `position` |
| Reisender | `trip_travellers.id` | `TripTraveller.id` | **`clientRef`** (Pflicht für Logik/UI) |
| Staatsbürgerschaft | `trip_traveller_citizenships.id` | nested in `party` | `clientRef` |
| Dokument | `trip_traveller_documents.id` | nested in `party` | `clientRef` |
| Readiness (User) | `trip_readiness_items.id` | in `readinessItems[]` | **`clientRef`** (idempotent Guest/Account) |
| Readiness → Traveller | `trip_readiness_items.traveller_id` | `travellerClientRef` auf Item | Mapping in `lib/readiness/persistenz.ts` |
| Readiness → Item | `trip_readiness_items.trip_item_id` | `tripItemId` | FK auf `trip_items` |
| Route-Quelle | `trip_items.id` (flight) | gleich | `RouteFacts.sourceItemIds[]` |
| Flugroute-Fingerprint | abgeleitet | abgeleitet | `RouteFacts.fingerprint` (`route-v1\|…`) |
| Optimistic concurrency | `trips.revision`, `last_mutation_id` | auf `Trip` | Änderungsvorschläge invalidieren bei Drift |

**Safety sollte referenzieren:** `trip.id`, `stage.id`, `day.id`, `item.id`, `traveller.clientRef` (nicht nur Slot-Nummer), `placeId` (`geonames:…` / `airport:IATA`), IATA aus Route-Segmenten.

### 1.3 Destinations, countries, places, dates

**Reisekopf (`trips` / `Trip`):**

- `origin`, `originPlaceId`, `startDate`, `endDate`, `travellers`, `currency`, `budgetAmount`
- `stages[]`: `name`, `countryCode` (ISO-2 oder null), `placeId`, `latitude`, `longitude`, `arrivalDate`, `departureDate`
- `days[]`: `stageId`, `dayIndex`, `dayDate`, `title`, nested `items[]`
- `ohneTag[]`: ungeplante Planpunkte

**Orte (`lib/places/domain.ts`):**

- `Ort`: `id` = `{source}:{sourceId}` (z. B. `geonames:1650535`, `airport:ZRH`)
- `ortId()`, `istOrtId()` – Validierung
- Kanonisierung: `lib/places/kanon.ts` (`reiseMitKanonischenOrten`, `etappeMitOrt`)

**Länder-Trust-Grenze:**

- Etappen-`countryCode`: strukturiert, aber Stage **ohne** Code zählt als `unknownCountryStages` (`lib/readiness/kontext.ts`)
- Route-Länder: **nur** aus Flight-Itinerary + `public.airports` – nicht aus Freitext (`docs/ROUTE_TRANSIT_INTELLIGENCE.md`)

**Daten:**

- Reisedaten optional (Tage existieren vor Kalenderdaten)
- Item-Zeiten: `startsOn`/`endsOn` (Datum), `startsAt`/`endsAt` (Ortszeit `HH:MM`, ohne TZ)

### 1.4 Guest vs Account persistence

| Aspekt | Guest | Account |
| --- | --- | --- |
| Speicher | `localStorage` `jetnity:reise:v3` (+ Warteschlange v3) | Supabase `trips` + Kinder |
| Modul | `lib/trips/gastspeicher.ts` | `lib/trips/daten.ts`, RPCs |
| Anlegen | `gastreiseAnlegen`, `gastreiseSpeichern` | `public.reise_anlegen()` via `lib/trips/anlegen.ts` |
| Ändern | `operationenAnwenden` + Gast-Mutationen | `public.reise_aendern()` |
| Readiness | `lib/readiness/gast.ts` | `lib/readiness/aktionen.ts` (Server Action, Fingerprint serverseitig) |
| Party (Foundation E) | `lib/readiness/reisende-gast.ts` | `party_schreiben` RPC + `lib/readiness/reisende-aktionen.ts` |
| Übernahme | `lib/trips/uebernahme.ts` → Graph, dann Party, dann Readiness (nicht atomar über alles) | — |
| UI | `components/trips/GastArbeitsbereich.tsx` | `components/trips/KontoArbeitsbereich.tsx` |
| Quelle-Anzeige | `TripSource = 'guest' \| 'account'` | |

Route-Itinerary Gast: in `TripItem.routeItinerary`; Account: `trip_items.metadata.routeItinerary` (`lib/route/metadata.ts`).

### 1.5 DB-Schema (Referenz)

Migrationen: `supabase/migrations/20260817120000_reiseschema.sql` (Kern), spätere für Route, Mobility, Rental, Readiness, Traveller.

Generierte Typen: `types/supabase.ts` – Tabellen `trips`, `trip_stages`, `trip_days`, `trip_items`, `trip_readiness_items`, `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`, `airports`, `places`.

---

## 2. Flight Route / Foundation D Route Facts

### 2.1 Speicherung und Berechnung

| Symbol | Pfad | Rolle |
| --- | --- | --- |
| `FlugRouteItinerary`, `RouteFacts`, `RouteSegment`, `RouteVerbindung`, `RoutePunkt` | `lib/route/domain.ts` | Provider-neutrale Domain |
| `ROUTE_FACTS_VERSION` | `lib/route/domain.ts` | `'route-v1'` |
| `routeFactsAusGraph`, `routeFactsFuerPunkt` | `lib/route/ableitung.ts` | **Kanonische Ableitung** aus persistierten Flight-Itineraries |
| `routeFactsAusReise` | `lib/readiness/kontext.ts` | Readiness-Naht (delegiert an `routeFactsAusGraph`) |
| `itineraryAusMetadata`, `metadataAusItinerary` | `lib/route/metadata.ts` | DB-Persistenz in `trip_items.metadata` |
| `flug_route_itinerary_metadata()` | `supabase/migrations/20260822130000_reise_anlegen_route_itinerary.sql` | SQL-Validierung + Airport-Truth |
| `flughafenReferenzLesen`, `iatasAusOption` | `lib/route/flughafen-lesen.ts` | Batch-Lookup `public.airports` |
| `flugRoutenAusReise`, `eindeutigeFlugRoute` | `lib/route/persistenz.ts` | Matching bei Übernahme |
| `routeNachziehen` / Recovery | `lib/route/nachziehen.ts` | Fail-closed Nachzug |

**Trust boundary:** Titel, Notizen, Ortsnamen, Place-IDs sind **keine** Route-Quelle (`lib/route/ableitung.ts`, `docs/ROUTE_TRANSIT_INTELLIGENCE.md`).

### 2.2 Airport / Transit / Country Facts

- Segment-Punkte: `airportCode`, `countryCode`, `city`, `country` (Anzeige aus Referenz)
- `RouteFacts.transitCountryCodes`, `destinationCountryCodes`
- `RouteFacts.connections[]`: Umstiege inkl. `airportChange`, `durationMinutes`
- Referenzkarte: `FlughafenReferenzKarte` aus `public.airports`

### 2.3 Fingerprint / Freshness (Route)

| Symbol | Pfad | Format |
| --- | --- | --- |
| `routeFingerprintAus`, `pfadAusSegmenten` | `lib/route/fingerprint.ts` | `route-v1\|IATA:CC>IATA:CC>…` (sortierte Flüge) |
| Einbezug in Readiness | `lib/readiness/fingerprint.ts` | Felder `orig`, `tr`, `route` in v2-Fingerprint |

Route-Fingerprint ist **deterministisch**, enthält **keine** Städte/Anzeigenamen.

### 2.4 Tests

- `lib/route/ableitung.test.ts`
- `lib/route/fingerprint` (via readiness/kontext tests)
- `lib/route/persistenz.test.ts`
- `lib/route/kanonisieren.test.ts`
- `lib/route/nachziehen.test.ts`

---

## 3. Hotel / Activities / Mobility / Rental-Car references

### 3.1 Verknüpfung mit stages / places / days

Alle Planpunkte hängen an `trip_items` mit optional `stage_id`, `day_id` (`TripItem.stageId`, `dayId`).

| Kind | Stage/Day | Strukturierte Geo/Ort-Felder | Title-only Risiko |
| --- | --- | --- | --- |
| `stay` | `stageId`, `dayId` | Indirekt über Etappe (`placeId`, lat/lon) | Titel oft Hotelname |
| `activity` | `stageId`, `dayId` (Pflicht in `activityReisegraphPruefen`) | Provider-Option: `locationName`, `punkt` – im Item meist Titel | Ja, wenn manuell |
| `transfer` | `stageId`, `dayId` | `originPlaceId`, `destinationPlaceId`, `originName`, `destinationName`, `mobilityMode`, `connectionRef`, `mobilityChanges`, `mobilityEvidence` | Namen ohne placeId möglich |
| `rental_car` | `stageId`, `dayId` | Wie Transfer + `rentalSupplier`, `vehicleClass`, `transmission`, `rentalEvidence` | Namen ohne placeId möglich |
| `flight` | `stageId`, `dayId` | **`routeItinerary`** in metadata – strukturierte Route | Titel nicht Route-Quelle |

**Reisegraph-Prüfer (Server-Trust):**

- Hotels: `lib/hotels/reisegraph.ts` – `hotelReisegraphPruefen`, `hotelZielKennungAus(stage)`
- Activities: `lib/activities/reisegraph.ts` – `activityReisegraphPruefen`
- Mobility-Kanten: `lib/mobility/kanten.ts` – `mobilitaetsAbdeckung` (Origin ↔ Etappen ↔ Flüge/Transfers)
- Rental: `lib/rental-cars/bestand.ts`, `lib/rental-cars/zeitraum.ts`

### 3.2 Domain-Hilfen (Geo-Kontext für Suche, nicht Trip-Persistenz)

- `lib/hotels/domain.ts` – `GeoPunkt`, `hotelZielKennungAus`, `QuartierSuchkontext`
- `lib/activities/domain.ts` – `GeoPunkt`, `activityZielKennungAus`, `ActivityTimeslot`
- `lib/rental-cars/domain.ts` – `pickupPlaceId`, `dropoffPlaceId`, …
- `lib/mobility/domain.ts` – Suchanfrage normalisiert

Evidence-Felder auf Items: `mobilityEvidence`, `rentalEvidence` – derzeit nur `'user'` (`types/trips.ts`).

---

## 4. Readiness / Traveller Context (Foundation E)

### 4.1 Evidence / Freshness / Fingerprint-Muster

**Zwei getrennte Wahrheiten** (`lib/readiness/domain.ts`):

1. **Official** – Provider/Engine only; Browser nie `required`/`not_required`
2. **User** – `trip_readiness_items` / Gast-Array; `evidence: 'user'`

| Konzept | Typen / Symbole | Pfad |
| --- | --- | --- |
| User-Fingerprint | `READINESS_FINGERPRINT_VERSION = 'v2'`, `readinessFingerprint()` | `lib/readiness/fingerprint.ts` |
| User stale | `ReadinessCurrentness`, `fingerprintAktuell()` | `lib/readiness/status.ts`, `fingerprint.ts` |
| Official Evaluation | `OfficialEvaluation`, `OfficialEvidence` | `lib/readiness/official.ts` |
| Official Freshness | `OfficialFreshness`, `officialFrische()` | `lib/readiness/official.ts` |
| Official Fingerprint | `officialFingerprint()` | `lib/readiness/engine.ts` (`off-v2\|…`) |
| Document fingerprint | `documentFingerprintTeil()`, `travellerCredentialFingerprint()` | `lib/readiness/traveller-kontext.ts` |
| Reisekontext | `readinessReisekontext()`, `routeFingerprintFelder()` | `lib/readiness/kontext.ts` |
| Abgeleitete Checks | `readinessChecksAbleiten()` | `lib/readiness/ableitung.ts` |
| Ansicht | `readinessAnsicht()` | `lib/readiness/status.ts` |

**Unknown / unavailable / stale:**

- Official: `OfficialResult`, `OfficialStatus`, `OfficialFreshness` – u. a. `unknown`, `unavailable`, `insufficient_context`, `stale`, `recheck_needed`, `provider_unavailable`, `source_temporarily_unavailable`
- User: `ReadinessCurrentness` – `current`, `stale`, `not_applicable`
- Trust: `officialEvidenceVertrauenswuerdig()` – Provider + checkedAt + authority/ruleReference; HTTPS sourceUrl optional but validated

### 4.2 Provider factory / kill switch / fail-closed API

| Symbol | Pfad | Verhalten |
| --- | --- | --- |
| `RequirementsProvider`, `requirementsProviderAus()` | `lib/readiness/provider.ts` | **Immer `null`** in Production/Preview |
| `requirementsEvaluationsPruefen`, `officialRequirementsPruefen` | `lib/readiness/anforderungen.ts` | Fail-closed → `unknown` / `unavailable` |
| `requirementsAuswerten`, `requirementsFuerReise` | `lib/readiness/engine.ts` | Engine + injizierbarer Provider (Tests) |
| POST `/api/readiness/requirements` | `app/api/readiness/requirements/route.ts` | Rate limit, Zod, Body cap, `dynamic = force-dynamic`, keine Fake-Regeln |

**Sicherheitsmuster API:**

- `readinessAnfrageErlaubt()` – `lib/readiness/rate-limit.ts` (In-Memory, 20/10min, 80/Tag)
- `readinessAnforderungAnfrageSchema` – `lib/readiness/schema.ts`
- `readinessHttpHeader()` – `cache-control: private, no-store` (`lib/readiness/anfrage.ts`)
- Content-Type + Content-Length checks vor Parse

**Flug-Vorbild für Feature Gate:** `lib/flights/zustand.ts` – Production hard off, explizites `JETNITY_FLIGHT_AKTIV`, Test-Token only.

### 4.3 Official Evidence server-only

- Requirements-API liefert `OfficialEvaluation[]` – **nicht** in Trip-Graph persistiert
- UI: `TripWorkspace` optional `officialEvaluations?: OfficialEvaluation[]`
- `KontoArbeitsbereich` übergibt **keine** Evaluations (lokaler Fallback `requirementsLokalFuerReise`)
- Audit-Harness kann Evaluations injizieren: `TripWorkspaceAuditClient` + sessionStorage
- User-Readiness: Fingerprint **serverseitig** in `readinessItemBauen` / `readinessSetzen` – Client setzt keinen Fingerprint

### 4.4 Traveller Context (DB)

- `trip_travellers` + `trip_traveller_citizenships` + `trip_traveller_documents`
- Atomarer Write: `public.party_schreiben(jsonb)` (Migration `20260822160000`)
- `lib/readiness/party.ts` – `travellerSlots`, `fehlendeFaktenFuerReise`
- Safety: nur bei **fachlich traveller-abhängigem** Hinweis einbeziehen (Policy)

### 4.5 Persistenz abgeleiteter Evaluations (Readiness)

| Was | Persistiert? | Tabelle / Ort |
| --- | --- | --- |
| User-Vorbereitungsstand | **Ja** | `trip_readiness_items` + Gast `readinessItems` |
| Official Requirements | **Nein** | Ephemeral: API-Antwort / optional UI-Prop |
| Engine-Fingerprint auf Official | In `OfficialEvidence.contextFingerprint` | Pro Evaluation, nicht in DB |

---

## 5. Trip Workspace / Übersicht / Priorisierung

### 5.1 Workspace-Komponenten

| Komponente | Pfad | Rolle |
| --- | --- | --- |
| `TripWorkspace` | `components/trips/TripWorkspace.tsx` | Shell: Mobile-Tabs, Desktop-Layout |
| `TripWorkspaceUebersicht` | `components/trips/TripWorkspaceUebersicht.tsx` | Übersicht: Bereichsstatus-Karten |
| `TripWorkspaceNavigation` | `components/trips/TripWorkspaceNavigation.tsx` | Tab-Navigation |
| `TripWorkspaceKopf` | `components/trips/TripWorkspaceKopf.tsx` | Kopfzeile |
| `TripWorkspacePlan` | `components/trips/TripWorkspacePlan.tsx` | Eingebetteter Tagesplan |
| `Reisevorbereitung` | `components/trips/Reisevorbereitung.tsx` | Readiness-Block in Übersicht |
| Bereichs-Suche | `FlugSuche`, `HotelBereich`, `AktivitaetenBereich`, `MobilitaetBereich` | Lazy-Mount auf Mobile |

**Arbeitsbereich-Logik:** `lib/trips/arbeitsbereich.ts`

- `ARBEITSBEREICHE`: `uebersicht`, `fluege`, `unterkunft`, `aktivitaeten`, `mobilitaet`
- `bereichStatus()` – kompakte Statuszeilen (Flug inkl. Route-Text via `routeFactsAusGraph`)
- `planStatus()`, `planpunkteSammeln()`

### 5.2 Warning / Priority surfaces (heute)

- **Kein** implementierter Block `Jetzt wichtig`, `Warnungen` oder zentrale Priorisierungs-Engine
- Readiness: offene/stale Checks in `Reisevorbereitung` (`readinessZusammenfassungText`, `data-readiness-currentness`)
- Policy-Docs fordern künftige Integration: `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`, `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- Gast-Hinweis: optional `hinweis` Prop (Browser-only Entwurf)

### 5.3 Audit harness

| Artefakt | Pfad |
| --- | --- |
| Audit-Seite | `app/(public)/ui-audit/trip-workspace/page.tsx` |
| Audit-Client | `components/trips/TripWorkspaceAuditClient.tsx` |
| Playwright-Script | `scripts/trip-workspace-ui-audit.mjs` |
| SessionStorage-Key | `jetnity:ui-audit:workspace` |

Harness injiziert Trip-Fixtures + optional `officialEvaluations` – **nicht** im Produktions-localStorage.

---

## 6. Provider factories / Feature gates / API security patterns

### 6.1 Factory-Übersicht (`lib/`)

| Domäne | Factory | Datei | Default |
| --- | --- | --- | --- |
| Readiness/Requirements | `requirementsProviderAus()` | `lib/readiness/provider.ts` | `null` |
| Hotels | `hotelProviderAus()` | `lib/hotels/factory.ts` | `null` |
| Activities | `activityProviderAus()` | `lib/activities/factory.ts` | `null` |
| Mobility | `mobilityProviderAus()` | `lib/mobility/factory.ts` | `null` |
| Rental cars | `rentalCarProviderAus()` | `lib/rental-cars/factory.ts` | `null` |
| Flights | `duffelProviderAus()` | `lib/flights/duffel/factory.ts` | null unless test env + gate |

### 6.2 Test doubles

- Readiness: `RequirementsProvider` injizierbar in `requirementsEvaluationsPruefen(anfrage, provider?)` – siehe `lib/readiness/engine.test.ts` (`testProvider`)
- Route: `lib/route/fixtures.ts`
- Reise-Fixtures: `lib/reiseaenderung/fixtures/reise.ts` (`beispielreise`)
- Flights: `lib/flights/fixtures/optionen.ts`, `lib/flights/duffel/fixtures/`
- UI-Audit: inline Fixtures in `scripts/trip-workspace-ui-audit.mjs`

### 6.3 API-Muster (Referenz für Safety-Route)

| Muster | Beispiel |
| --- | --- |
| `export const dynamic = 'force-dynamic'` | readiness + flights routes |
| Zod `safeParse` | `readinessAnforderungAnfrageSchema` |
| Rate limiting | domain-specific (`lib/readiness/rate-limit.ts`, `lib/flights/rate-limit.ts`, hotels, …) |
| `cache-control: no-store` / `private, no-store` | API responses |
| Body size cap before parse | `readinessBegrenztLesen` |
| Fail-closed empty official on error | requirements route always returns `official` shape |
| Server-only imports | `'server-only'` on factories, `lib/trips/daten.ts` |
| DB read empty vs error | `lib/api/datenbank-lesen.ts` + `lib/admin/ladezustand.ts` (ADR-0037/0040) |

### 6.4 Nachweis-Muster (Provider-Evidence vor Persistenz)

- Hotels: `lib/hotels/nachweis.ts` – `HotelNachweis`, Fehlerarten `unavailable`, `abgelaufen`, …
- Activities: `lib/activities/nachweis.ts` (analog)
- Pattern: Search schmal, **Nachweis** bestätigt Option gegen Kontext vor Trip-Write

---

## 7. Existing External Evidence / Freshness models

### 7.1 Geteilte Typen?

**Kein** domänenübergreifender `Evidence`-Basistyp im Code. Nächste Verwandte:

| Domäne | Kern-Typ | Pfad |
| --- | --- | --- |
| Readiness Official | `OfficialEvidence`, `OfficialEvaluation` | `lib/readiness/official.ts` |
| Readiness User | `TripReadinessItem`, `ReadinessEvidence = 'user'` | `types/trips.ts` |
| Route | `RouteFacts`, `RouteQuelle` | `lib/route/domain.ts` |
| Hotel/Activity Nachweis | `HotelNachweisErgebnis`, … | `lib/hotels/nachweis.ts` |
| Item booking | `bookingSource: 'user'` | `types/trips.ts` |

**Safety sollte** ein eigenes Modell unter `lib/safety/` führen und **Freshness-/Trust-Hilfen** an Readiness/Official orientieren, nicht copy-pasten vermischen.

### 7.2 Stale / unknown / unavailable

Siehe §4.1 – Readiness ist das reifste Muster:

- Context change → fingerprint mismatch → `stale`
- Missing facts → `insufficient_context` + `missingFacts[]`
- No provider → `provider_unavailable`
- Provider down → `source_temporarily_unavailable`
- Time validity → `validUntil` / `recheck_needed` in `officialFrische()`

---

## 8. Reevaluation bei Trip-Änderungen

### 8.1 Bestehende Mechanismen

| Trigger | Mechanismus |
| --- | --- |
| Graph-Änderung (Account) | `public.reise_aendern()` – revision++, `last_mutation_id` |
| Graph-Änderung (Gast) | `gastspeicher` + `reiseaenderung/anwenden.ts` |
| User-Readiness stale | Neuberechnung `readinessFingerprint()` vs. gespeichertes `contextFingerprint` bei `readinessAnsicht()` |
| Official stale | `officialFrische()` vergleicht `storedFingerprint` vs. `currentFingerprint` (`officialFingerprint()`) |
| Route-Änderung | Ändert `RouteFacts.fingerprint` → propagiert in Readiness v2 (`orig`, `tr`, `route`) |
| Traveller-Änderung | Citizenship/document fingerprints in Readiness v2 |
| Item booking change | Item-Felder in ticket/booking confirmation fingerprints |

**Safety-Reevaluation (empfohlenes Muster):**

1. Bei jeder Evaluation Trip-Graph **frisch** laden (Account) oder aus Prop (Guest)
2. Deterministischen **`safetyContextFingerprint(trip)`** bilden (Trip-Daten + Route-Fingerprint + relevante Item-IDs/Zeiten – **keine** Provider-Rohdaten)
3. Externe Events cachen/ephemeral halten mit `checkedAt`, `validUntil`, event-id
4. Stale wenn: Trip-Fingerprint drift **oder** Event-Freshness abgelaufen **oder** Provider unavailable
5. **Kein** silent carry-over: wie `officialFrische()` und User-Readiness

### 8.2 Wo Cross-Domain-Impact andockt

| Anker | Nutzen für Safety Impact |
| --- | --- |
| `readinessReisekontext()` | Destination countries, dates, booked items, route |
| `routeFactsAusGraph()` | Airports, transit countries, segments |
| `planpunkteSammeln()` | Alle Items inkl. `ohneTag` |
| `bereichStatus()` | Workspace-Statuszeilen pro Bereich |
| `flugAbdeckung()`, `unterkunftAbdeckung()`, `mobilitaetsAbdeckung()`, `mietwagenBestand()` | Welche Domänen betroffen sind |
| `trip_stages` + `placeId` + lat/lon | Regionales Matching (mit Scope-Disziplin) |
| `Reisevorbereitung` / Readiness | **Separate** Truth – nicht vermischen |

Policy (`docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md` §6): Cross-Domain als **Impact-Hinweis**, keine automatische Graph-Mutation.

---

## 9. Minimal Workspace integration (ohne Workspace-Rewrite)

**Empfohlener Dock-Point (spiegelt Readiness):**

1. **`lib/safety/status.ts`** (neu) – `safetyAnsicht(trip, evaluations?)` → Summary + Items
2. **`TripWorkspace` neuer optionaler Prop** – `safetyEvaluations?: SafetyEvaluation[]` (parallel zu `officialEvaluations`)
3. **Neue Präsentationskomponente** – z. B. `ReiseSicherheit.tsx`, eingehängt in `TripWorkspaceUebersicht` **oberhalb oder unterhalb** von `vorbereitung` (Readiness) – **kein** eigener Tab in Phase 1
4. **Audit** – `TripWorkspaceAuditClient` Payload um `safetyEvaluations` erweitern; Fixtures im UI-Audit-Script
5. **Kein** `Jetzt wichtig`-Aggregator in Foundation – nur klar benannter Block „Sicherheit & Störungen“ mit semantischen Stufen (Policy §4)

Spätere intelligente Priorisierung konsumiert dann `SafetyEvaluation[]` + Readiness summary + `bereichStatus` – Foundation liefert nur **strukturierte Inputs**.

---

## 10. Empfehlung: DB-Persistenz für Safety Foundation?

### Kurzantwort: **Nein** – nicht in der provider-neutralen Foundation-Phase.

### Begründung (an bestehenden Mustern)

| Argument | Beleg im Repo |
| --- | --- |
| Official Readiness wird **nicht** in DB gespeichert | Nur API/Prop; Engine compute-on-read |
| Route Facts werden **abgeleitet**, nicht materialisiert | `routeFactsAusGraph`, Itinerary in metadata |
| Persistiert wird nur **User-Intent** mit Fingerprint | `trip_readiness_items.context_fingerprint` |
| Provider off → fail-closed ohne Cache-Lügen | `requirementsProviderAus() === null` |
| Freshness/Zeitabhängigkeit | Events veralten schnell; DB-Snapshots ohne TTL/Revocation-Modell riskieren Schein-Aktualität |
| Kosten/Lizenz | Policy: keine Provider-Kosten in Foundation; Caching externer Warnungen kann Lizenz/Freshness-Risiko erhöhen |

### Wann DB später sinnvoll werden könnte

- Nutzer-**Acknowledgement** („zur Kenntnis genommen“) mit Audit-Trail
- Rate-Limit-/Kosten-cache für **rohe** Provider-Payloads (server-only, TTL, nicht UI-Truth)
- Production-Monitoring von Provider-Freshness

Dann: eigene Tabelle analog `trip_readiness_items` (**User-State**, nicht Official-Truth) oder server-only cache table **ohne** RLS-Exposure an Client.

---

## 11. Test file patterns (Referenz für `lib/safety/`)

| Domäne | Pfad-Muster |
| --- | --- |
| Readiness (umfassend) | `lib/readiness/*.test.ts` – besonders `engine.test.ts`, `fingerprint.test.ts`, `status.test.ts`, `kontext.test.ts`, `truth.test.ts` |
| Route | `lib/route/*.test.ts` |
| Trip workspace IA | `lib/trips/arbeitsbereich.test.ts` |
| Reisegraph fixtures | `lib/reiseaenderung/fixtures/reise.ts` |
| API | `lib/readiness/anfrage.test.ts` |
| UI audit (E2E) | `scripts/trip-workspace-ui-audit.mjs` |
| Provider adapter | `lib/flights/duffel/adapter.test.ts` |

**Safety Foundation sollte mindestens:** Domain + Fingerprint + Evaluation + fail-closed API + Status-Merge Tests analog Readiness; UI-Audit-Fixture für „kein Provider → unavailable, kein Fake-Warning“.

---

## 12. Offene Ist-Abweichungen / Risiken für Safety

1. **`Jetzt wichtig` existiert nicht** – Priorisierung ist dokumentiert, nicht implementiert.
2. **Activities/Stays** oft title-only im Graph – Safety-Geo muss Scope-Disziplin einhalten (`insufficient_context` statt Raten).
3. **Etappen ohne `countryCode`** – zählen als unknown (`unknownCountryStages`).
4. **Guest Readiness/Party** nicht atomar mit Graph bei Account-Migration – Safety darf nicht still auf unvollständigen Graph vertrauen nach Teilmigration.
5. **Kein Safety-Code** – alles Grünfeld unter `lib/safety/` + optional `app/api/safety/…`.

---

## 13. Nächster Implementierungsschritt (nach Audit)

1. Branch `feat/travel-safety-disruption-intelligence` von `main`
2. `lib/safety/domain.ts`, `provider.ts` (`safetyProviderAus() → null`), `fingerprint.ts`, `kontext.ts` (wraps `routeFactsAusGraph` + `readinessReisekontext`, no duplicate route truth)
3. `app/api/safety/evaluate/route.ts` – fail-closed, rate limit, zod, no-store (Mirror requirements route)
4. `ReiseSicherheit.tsx` + optional `TripWorkspace` prop
5. Tests + UI-Audit-Erweiterung mit Test-Double Provider

**Nicht:** Production-Migration, echter Provider, `Jetzt wichtig`-Aggregator, LLM-Truth.
