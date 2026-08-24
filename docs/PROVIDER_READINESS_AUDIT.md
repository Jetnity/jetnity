# Jetnity – Provider-Readiness Audit

Stand: 24. August 2026  
Status: **AUDIT-PASS; PR #45 von Product Owner auf `main` gemergt (`f92e0c9e`); keine Provider- oder S2-Freigabe**  
Branch zum Review: `audit/provider-readiness`  
Merge-Commit: `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5`  
Auftrag: `docs/PROVIDER_READINESS_AUDIT_TASK.md`  
Geprüfter Head: aktueller Branch-Head nach diesem Audit  
Basis: `origin/main` @ `e4f4cca7` plus Task-Commit `f53bafcf`

## 0. Verdict

Jetnity ist **provider-neutral weit fortgeschritten**, aber **nicht bereit, echte Reise-Provider zu aktivieren**.

Die Foundation-Ports, Kill Switches, fail-closed Factories und die Trennung von Route-/Traveller-/Official-/Safety-/Seasonal-Truth sind real und getestet. Fehlende konkrete Adapter sind **kein Defekt** – sie sind die verbindliche Reihenfolge aus `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`.

Was vor der Providerphase auf Jetnity-Seite noch fehlt, ist die **operative und kommerzielle Vertrauensschicht**: serverseitiger Nachweis für persistierte Angebote, persistenter Kosten-/Rate-Schutz, Timeout-/Kill-Switch-Parität, Provenance/Freshness an kommerziellen Optionen und ehrliche Observability.

Dieses Dokument inventarisiert den verifizierten Ist-Stand. Es aktiviert keinen Provider, legt keine Secrets an, erzeugt keine Kosten und ändert keine Runtime.

Audit-PASS bedeutet nur: alle Pflichtdomänen untersucht, Matrix vollständig, Befunde belegt, Shared Contract nur dort vorgeschlagen, wo er fachlich sinnvoll ist, Implementierungsslices priorisiert.

---

## 1. Methode und Pflichtquellen

Gelesen und gegen den tatsächlichen Code geprüft:

- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/PRODUCT_OWNER_PR34_PROVIDER_READINESS_ADDENDUM.md`
- Fachdokumente: `docs/FLUEGE.md` (falls vorhanden), `docs/HOTELS.md`, `docs/HOTEL_PROVIDER_STRATEGY.md`, `docs/ACTIVITIES.md`, `docs/MOBILITY.md`, `docs/RENTAL_CARS.md`, `docs/TRAVEL_READINESS.md`, `docs/TRAVEL_SAFETY_DISRUPTION.md`, `docs/TRAVEL_TIMING_SEASONAL.md` und zugehörige Policies
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`, `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
- Domain-Code unter `lib/flights/`, `lib/hotels/`, `lib/activities/`, `lib/mobility/`, `lib/rental-cars/`, `lib/readiness/`, `lib/safety/`, `lib/seasonal/`
- API-Routen unter `app/api/{flights,hotels,activities,mobility,rental-cars,readiness,safety,seasonal}/`
- Vergleichsmuster: `lib/modell/kontingent.ts`, `lib/rollout/befund.ts`, `lib/route/*`

Widersprüche zwischen Chat, Handoff und Code werden unten benannt. Es gilt der verifizierte Repository-Stand.

---

## 2. Dokumentierte Widersprüche

| Quelle | Behauptung | Verifizierter Stand |
| --- | --- | --- |
| `JETNITY_HANDOFF.md` / `ROADMAP.md` auf diesem Branch vor diesem Audit | Seasonal ist Draft-PR #38 und wartet auf Merge | Seasonal ist auf `main` gemergt (`ee988bbe`). `docs/ACTIVE_WORK_STATUS.md` und Production-Integration `docs/PR38_PRODUCTION_INTEGRATION.md` sind aktueller. |
| `docs/PRODUCT_OWNER_PR34_PROVIDER_READINESS_ADDENDUM.md` | Safety/Seasonal Foundations noch zu bauen | Beide Foundations existieren im Code; Factories bleiben `null`. |
| `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md` §5 | Seasonal nur auf Draft-PR #38 | Code liegt auf `main` / diesem Branch unter `lib/seasonal/`. |
| `docs/HOTELS.md` §6 | Rooms/Children kommen aus dem Graph | Gilt für Konto-Übernahme (`HOTEL_SUCHE_STANDARD_BELEGUNG`). Die Suche akzeptiert weiterhin Client-`rooms`/`children`. |
| ADR-0109 | Readiness-Timeout wird toleriert | Engine fängt Throws; ein explizites `AbortSignal`/Timeout wie Safety/Seasonal fehlt. Route `maxDuration = 10` ist die einzige harte Grenze. |

Diese Audit-Dokumente und der Handoff-Update auf diesem Branch korrigieren den operativen Stand. Ältere Addenda bleiben historische Entscheidungen.

---

## 3. Gemeinsame Stärken

Über alle acht Pflichtdomänen:

1. **Provider-neutrale Ports** existieren. UI, Ranking und Trip-Graph sprechen Jetnity-Typen, nicht Anbieter-SDKs.
2. **Factories sind fail-closed.** `hotelProviderAus()`, `activityProviderAus()`, `mobilityProviderAus()`, `rentalCarProviderAus()`, `requirementsProviderAus()`, `safetyProviderAus()`, `seasonalProviderAus()` geben `null` zurück. Flights erlaubt nur Duffel-Test-Tokens und ist in Production hart aus.
3. **Search und Booking sind getrennt.** `booking_url` wird bei Übernahme auf `null` gesetzt. Keine Deeplinks aus Provider-Rohdaten.
4. **Browser/LLM setzen keine Official-/Safety-/Seasonal-Truth.** Zod droppt unbekannte Keys; Engines voiden injizierte Felder.
5. **Route Truth bleibt zentral.** Readiness, Safety und Seasonal lesen `routeFactsAusGraph`. Foundation D wird nicht dupliziert.
6. **Citizenship wird nicht global erzwungen.** Readiness sendet Credentials, weil Official Truth davon abhängt. Safety nutzt Citizenship nur intern bei `travellerDependent`. Seasonal schließt Citizenship aus dem Port aus.
7. **Contract-Tests mit Doubles** existieren in jeder Foundation. Kein produktiver Fake-Preis, keine erfundene Visa-/Safety-/Seasonal-Aussage.

---

## 4. Gemeinsame Lücken vor der Providerphase

Diese Lücken gelten **unabhängig vom konkreten Anbieter**. Sie müssen auf Jetnity-Seite geschlossen werden, bevor ein echter Adapter Kosten oder persistierte Truth erzeugen darf.

| ID | Lücke | Schwere | Evidence |
| --- | --- | --- | --- |
| PR-P0-01 | Flug-Kontoübernahme persistiert eine Browser-`FlugOption` ohne serverseitigen Nachweis | **P0** | `lib/flights/schema.ts` `flugKontoUebernahmeSchema` enthält `option: flugOptionSchema`. `lib/flights/aktionen.ts` schreibt `price_amount`, `provider`, `external_ref` aus dieser Option. Hotels tun das nicht: `lib/hotels/aktionen.ts` akzeptiert nur IDs und verlangt `HotelNachweis`. |
| PR-P0-02 | In-Memory-IP-Limits sind kein globaler Kostenschutz | **P0** für bezahlte Production-Aktivierung | Alle Domain-`rate-limit.ts` leben im Prozess und sagen das ausdrücklich. `lib/modell/kontingent.ts` existiert bereits als DB-Muster, weil Vercel beliebig viele Instanzen startet. Policy §7 verlangt globalen Schutz vor produktiver Aktivierung. |
| PR-P1-01 | Keine Provider-Telemetrie / kein Admin-Health-Signal | **P1** | `ARCHITECTURE.md` §10: nur Konsolen-Logging. `lib/admin/**` kennt keine Provider-Health. `lib/rollout/befund.ts` prüft nur den Flight-Kill-Switch, nicht Live-Zustände. |
| PR-P1-02 | Kommerzielle Optionen haben keine Provenance/Freshness | **P1** | `FlugOption` hat kein `retrievedAt` / `freshUntil` (`lib/flights/domain.ts`). Hotels/Activities analog. Persistierter Preis kann unbegrenzt als aktuell erscheinen. |
| PR-P1-03 | Request-Härtung und Failure-HTTP sind nicht einheitlich | **P1** | Hotels/Activities/Readiness/Safety/Seasonal begrenzen Body und setzen `Retry-After`. Flights liest `req.json()` ungeprüft (`app/api/flights/search/route.ts`). Mobility/Rental-Timeout liefert HTTP 504, Hotels/Flights 200 + Status. |
| PR-P1-04 | Mobility- und Rental-Nachweis sind Stubs, nicht der Hotel-Vertrag | **P1** | `lib/mobility/nachweis.ts`, `lib/rental-cars/nachweis.ts` haben kein async `nachweisen({ optionId, kontext })`. Übernahme bleibt fail-closed – richtig für jetzt, unzureichend vor Adapter. |
| PR-P1-05 | Readiness-Port ohne Timeout/`AbortSignal`/Kill-Switch | **P1** | `RequirementsProvider.evaluate` hat kein Signal (`lib/readiness/provider.ts`). Safety/Seasonal haben 4 s + `AbortSignal`. Kein `JETNITY_READINESS_AKTIV`. |
| PR-P1-06 | Safety-API setzt `party: []` | **P1** | `lib/safety/auswerten.ts` `tripAusSafetyAnfrage`. Traveller-abhängige Facts können über die öffentliche API nie auflösen. Engine selbst unterstützt Party, wenn sie gesetzt ist. |
| PR-P1-07 | Mobility-Suche startet automatisch beim Bereichsbesuch | **P1** | `components/trips/MobilitaetBereich.tsx` `useEffect` feuert `mobilitySucheVomClient` bei jedem Mount. Mit späterem bezahlten Adapter erzeugt jeder Workspace-Besuch Kosten. |
| PR-P1-08 | Flugsuche sendet `currency` nicht an Duffel | **P1** | `FlugSuchanfrage.currency` existiert; `anfrageKoerper()` in `lib/flights/duffel/adapter.ts` sendet nur slices/passengers/cabin/max_connections. Antwortwährung kommt ungeprüft aus `total_currency`. |
| PR-P1-09 | Öffentliche Search-/Evaluate-Routen sind unauthentifiziert | **P1** | Bewusst für Guest. Wird mit bezahltem Provider zur Missbrauchsfläche. IP-Limit reicht nicht (PR-P0-02). |

P0 bedeutet: eine Provideraktivierung wäre **jetzt** truth- oder kostenkritisch falsch. P1 muss vor der echten Providerphase geschlossen werden. Fehlende konkrete Adapter sind **kein** P0.

---

## 5. Domäne: Flights

### Ist-Zustand

Einziger Domain mit konkretem Development-Adapter.

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/flights/provider.ts` `FlugProvider` | ready |
| Adapter | `lib/flights/duffel/adapter.ts` | Development/Test only |
| Mapping | `lib/flights/duffel/mapping.ts` | fail-closed, partial/invalid |
| Factory | `lib/flights/duffel/factory.ts` `duffelProviderAus()` | server-only |
| Kill Switch | `lib/flights/zustand.ts` | Production hart aus; nur `duffel_test_` |
| Suche | `lib/flights/suche.ts`, `app/api/flights/search/route.ts` | geschlossen, kein Proxy |
| Ranking | `lib/flights/ranking.ts` | deterministisch, provisionsneutral |
| Übernahme | `lib/flights/aktionen.ts`, `lib/flights/uebernahme.ts` | **ohne Nachweis** |
| Route Truth | `lib/route/itinerary.ts` + Airport-Referenz | Browser-Surface wird nicht Evidence |
| Rate Limit | `lib/flights/rate-limit.ts` | 8/10 min, 24/Tag, In-Memory, IP |

### Request-Grenze

Der Browser sendet Legs, Passagierzahlen, Kabine, Stopp-Präferenz, Währung und Ranking-Kontext. An Duffel gehen nur IATA, Datum, Passagier**typen** (keine Namen, kein DOB) und Kabine. PII-Minimierung ist getestet (`lib/flights/duffel/adapter.test.ts`).

Schwächen: keine Locale; UI setzt children/infants auf 0; Client-IATA kann aus Ortsnamen geraten werden; Währung verlässt Jetnity nicht.

### Response-/Truth-Grenze

`FlugOption` ist die interne Suchwahrheit, nicht Route Truth. Mapping verwirft unlesbare Angebote. Client-Sicht streicht Tokens und Score.

Persistenz ist die Lücke: Zod prüft Form, nicht Herkunft. Ein manipuliertes Browser-Angebot kann Preis, Zeiten und `externalRef` in `trip_items` schreiben. Hotels haben diese Grenze mit `HotelNachweis` bereits gezogen (ADR-0075). Flights nicht.

### Failure

Timeout, 401→unavailable, malformed→invalid, partial und rate_limited sind orchestriert und getestet. `Retry-After` fehlt. Kein Offer-Dedup. Nach Provider-Down akzeptiert die Übernahme weiter die Browseroption.

### Kosten / Cache / Security / Observability

Kein Result-Cache (`cache: 'no-store'`). Keine Attribution-/Lizenzschicht. Secret bleibt server-only; Token erscheint nicht in Fehlern. Keine Metriken, kein Admin-Health, keine Kostentelemetrie.

### Bewertung

Architektur-ready für Development-Suche. **Nicht ready** für kommerzielle Persistenz oder Production. Höchste Jetnity-seitige Lücke aller Domänen.

---

## 6. Domäne: Hotels / Accommodation

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/hotels/provider.ts` `HotelProvider` | ready |
| Factory | `lib/hotels/factory.ts` | bewusst `null` |
| Nachweis | `lib/hotels/nachweis.ts` `HotelNachweis` | Vertrag ready, Umgebung `null` |
| Kontext | `lib/hotels/quartier-kontext.ts` | server-autoritativ aus Reisegraph |
| Option-Schema | `lib/hotels/schema.ts` `hotelOptionSchema` | ready |
| Mapping-Modul | — | missing (erst mit echtem Anbieter) |
| Strategie | `docs/HOTEL_PROVIDER_STRATEGY.md` | Booking.com → HBX → Expedia; Zugang unbestätigt |

### Stärken

Tiefste kommerzielle Pipeline: Quartierlogik, Graph-Kontext, Nachweis an Ziel/Daten/Belegung/Währung gebunden, Body-Cap, `Retry-After`, Client-Leak-Scan, Konto-Übernahme nur mit IDs. Search und Affiliate bleiben getrennt.

### Lücken

Kein Adapter – erwartet. Kein Mapping, bis ein echter Vertrag gewählt ist. Suche akzeptiert Client-`rooms`/`children`, Übernahme nutzt Graph-Defaults. Ranking verwendet Neutralwert 0,5 für unbekannte Signale (Activities vermeiden das bewusst, ADR-0079). `provider`/`externalRef` bleiben in der Client-Sicht.

### Bewertung

**Höchste kommerzielle Contract-Reife.** Sobald Zugang und Product-Owner-Gates existieren, ist Hotels der beste erste kommerzielle Integrationskandidat – **nach** Shared Cost Guard und Observability.

---

## 7. Domäne: Activities / Tickets

### Ist-Zustand

Spiegel der Hotelnaht, tages- und zeitgebunden.

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/activities/provider.ts` `ActivityProvider` | ready |
| Factory | `lib/activities/factory.ts` | `null` |
| Nachweis | `lib/activities/nachweis.ts` | Vertrag ready, bindet Timeslot, Umgebung `null` |
| Tageskontext | `lib/activities/tageskontext.ts` | aus Reisegraph |
| Konflikt | `lib/activities/konflikt.ts` | fehlende Zeiten ≠ frei |
| Ranking | `lib/activities/ranking.ts` | ohne Neutralwert 0,5 |

### Bewertung

Nahe Hotels. Kein Anbieter verbindlich gewählt (GYG ist historische Idee, kein aktueller Vertrag). Timezone bleibt bewusst unbelegt. Dieselbe operative Schicht wie Hotels fehlt (globaler Cost Guard, Telemetrie, Cache/Lizenz-Hooks).

---

## 8. Domäne: Mobility / Transfers / Train / Bus / Ferry

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/mobility/provider.ts` `MobilityProvider` | ready |
| Factory | `lib/mobility/factory.ts` | `null` |
| Nachweis | `lib/mobility/nachweis.ts` | **Stub**, immer fail-closed |
| Persistenz | Migration `20260821120000_trip_items_mobility.sql` | manuell, Evidence `user` |
| Abdeckung | `lib/mobility/kanten.ts` | getrennt von der Suche, fail-closed |
| Suche | `lib/mobility/suche.ts` | Client-Payload ≈ Provider-Request |
| UI | `components/trips/MobilitaetBereich.tsx` | Auto-Suche beim Mount |

### Lücken

Die Suchanfrage wird nicht server-seitig aus dem Reisegraph abgeleitet. `MobilityOption` hat kein Zod-Mapping-Schema. Ranking bekommt keinen Kantenkontext. Timeout-HTTP ist 504 statt 200+Status. Auto-Suche wäre mit Live-Adapter ein Kostenleck.

Manuelle Erfassung und Abdeckungslogik sind bewusst konservativ und bleiben die ehrliche UX, solange kein Provider existiert.

### Bewertung

Foundation-ready für manuelle Wahrheit. **Nicht ready** für Provider-Offers. Nachweis muss auf das Hotel-/Activity-Muster angehoben werden, bevor ein Adapter persistieren darf.

---

## 9. Domäne: Rental Cars

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/rental-cars/provider.ts` `RentalCarProvider` | ready |
| Factory | `lib/rental-cars/factory.ts` | `null` |
| Nachweis | `lib/rental-cars/nachweis.ts` | Stub, immer fail-closed |
| Preiswahrheit | `preisIstGesamt`, `vergleichbareGesamtpreise()` | ready |
| UI | `components/trips/MietwagenBereich.tsx` | keine Auto-Suche, ehrlich unavailable |
| Persistenz | Migration `20260821200000` | manuell, keine Fahrer-/Zahlungs-PII |

### Stärken

Klarste kommerziellen Invarianten (One-way, Zeitraum ≠ Routenabdeckung, Best Value nur bei vergleichbaren Gesamtpreisen). Keine erratenen Pickup-Facts. Privacy-by-design.

### Lücken

Kein Suchformular, kein Option-Zod, Stub-Nachweis. Das ist für die Foundation korrekt. Vor einem Adapter braucht es Such-UX **und** Hotel-artigen Nachweis.

### Bewertung

Domain-Truth ready, Provider-Naht nur skelettiert.

---

## 10. Domäne: Travel Requirements / Readiness

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/readiness/provider.ts` `RequirementsProvider` | ready, inkl. Multi-Citizenship/Documents |
| Factory | `requirementsProviderAus()` | `null` |
| Trust Gate | `lib/readiness/official.ts` | Provider + checkedAt + Authority/RuleRef |
| Engine | `lib/readiness/engine.ts` | fail-closed, conflict → `recheck_needed` |
| API | `POST /api/readiness/requirements` | 8 KB, Rate Limit, `no-store` |
| Persistenz | `trip_readiness_items` nur User-Evidence | Official bleibt compute-on-read |

### Stärken

Credential-Modell ist provider-ready für einen späteren Timatic- oder gleichwertigen Adapter. Sensitive Felder (Passnummer, MRZ, Biometrie) werden abgewiesen. Legacy-`official` bleibt immer `unknown`. User-Readiness kann Official nicht setzen.

### Lücken

Kein explizites Timeout/`AbortSignal`. Kein Domain-Kill-Switch. 8 KB können Multi-Traveller-Payloads früher begrenzen als Safety/Seasonal (24 KB). Keine License-/Display-Regeln für lizenzierte Regulatory-Quellen.

### Bewertung

Truth-Contract ready. Operative Schicht vor Regulatory-Provider unvollständig.

---

## 11. Domäne: Safety & Disruption

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/safety/provider.ts` `SafetyProvider` | ready, `AbortSignal` |
| Factory | `safetyProviderAus()` | `null` |
| Engine | `lib/safety/engine.ts` | 4 s Timeout, Fact-Cap 40, `seasonal_pattern` verworfen |
| API | `POST /api/safety/evaluate` | 24 KB, Rate Limit, `no-store` |
| Provider-Request | `lib/safety/kontext.ts` | traveller-neutral (Länder/Airports/Places/Daten) |

### Stärken

Getrennte Ebenen (Fact, Freshness, Relevanz, Impact, Präsentation). `checked_empty` ist keine Entwarnung. Conflicts bleiben `recheck_needed`. Citizenship geht nicht an den Provider.

### Lücken

API-Rekonstruktion setzt `party: []`. Traveller-abhängige Facts sind damit über den HTTP-Pfad tot, obwohl die Engine sie kann. Kein Cache, keine Lizenzregeln für Government-Feeds, keine Telemetrie.

### Bewertung

Foundation-ready. API-Party ist der einzige fachliche P1 vor einem Advisory-Provider.

---

## 12. Domäne: Travel Timing & Seasonal

### Ist-Zustand

| Baustein | Pfad | Stand |
| --- | --- | --- |
| Port | `lib/seasonal/provider.ts` `SeasonalProvider` | ready, Stages + Route-Kontakte |
| Factory | `seasonalProviderAus()` | `null` |
| Engine | `lib/seasonal/engine.ts` | 4 s Timeout, Acute → `rejected_acute` |
| Freshness | `lib/seasonal/evidence.ts` | ohne `freshUntil` kein `current` |
| API | `POST /api/seasonal/evaluate` | 24 KB, Citizenship-Felder werden ignoriert |

### Stärken

Bidirektionale Trennung zu Safety ist im Code belegt, nicht nur dokumentiert. Provider-Request ist traveller-neutral und getestet (`lib/seasonal/provider-anfrage.test.ts`). Recurring Windows inkl. Jahreswechsel sind Foundation-Vertrag.

`party: []` in `tripAusSeasonalAnfrage` ist hier **kein** P1, weil Seasonal traveller-neutral bleiben muss.

### Bewertung

Foundation-ready. Dieselben operativen P1 wie Safety (Cost Guard, Observability, License-Hooks). Kein Climate-Adapter – erwartet.

---

## 13. Cross-Domain

### Was nicht mehrfach modelliert werden darf

| Konzept | Kanonische Quelle | Provider darf |
| --- | --- | --- |
| Route / Segment / Stage / Transit | `lib/route/*`, `routeFactsAusGraph` | nur lesen / scopen, nicht überschreiben |
| Traveller / Citizenship / Documents | Foundation E Child-Tabellen / Guest-gleiche Form | Readiness bewerten; nicht erfinden |
| User Readiness | `trip_readiness_items` `evidence: 'user'` | nicht in Official umdeuten |
| Official Readiness | `evaluations[]` compute-on-read | nur mit Trust Gate |
| Safety | `lib/safety/` Evaluations | keine Seasonal-Muster als Warnung |
| Seasonal | `lib/seasonal/` Evaluations | keine akuten Events |
| Offer / Preis | Domain-Option + später Nachweis | Snapshot, kein stilles Überschreiben persistierter Items |
| Booking | `booking_status` nutzerbestätigt (ADR-0089) | kein automatisches „gebucht“ |
| Currency | Trip-Währung + Option.currency | nicht still mischen |

Providerdaten werden heute **nicht** in den Reisegraph zurückgeschrieben, außer der Nutzer übernimmt eine Option. Safety/Seasonal/Readiness bleiben compute-on-read und mutieren die Reise nicht.

### Workspace-Naht

`TripWorkspace` kann optionale Evaluations entgegennehmen. Der Produktionspfad übergibt sie nicht; es gilt der lokale fail-closed Fallback. Das ist ein Workspace-/Orchestrierungs-Thema, kein Provider-Adapter. Schwere: **P2** für diesen Audit, **P1** für den späteren Workspace-Block.

---

## 14. Weitere externe Datenabhängigkeiten

Policy §5 verlangt die Inventarisierung über die acht Kernbereiche hinaus.

| Abhängigkeit | Ist | Port? | Bemerkung |
| --- | --- | --- | --- |
| Airport-Referenz | OurAirports-Import, `public.airports` | nein, Dump | ADR-0066; kein Live-Geocoding |
| Places / Geo | GeoNames-Dumps | nein, Dump | ADR-0067; kein Geocoding-Proxy |
| LLM-Reisevorschlag | OpenAI Responses API | ja, mit DB-Kontingent | anderes Kostenregime; Production aus |
| Routing / Wegezeiten | bewusst `null` | **missing** | Hotels/Activities erfinden keine Walk-Times |
| POI / Öffnungszeiten | nicht vorhanden | **missing** | Activities erfinden keine Öffnungszeiten |
| Live-Schedule / Disruption Feed | Safety-Port kann Events tragen | Adapter missing | nicht mit Seasonal mischen |
| Preis-/Verfügbarkeitsmonitoring | nicht vorhanden | **missing** | später, nach Nachweis + Freshness |
| Affiliate / Booking Partner | bewusst getrennt, unverbunden | missing | eigener Vertrag, nicht Search-Port |

Diese zusätzlichen Ports sind **kein** aktueller Aktivierungsblocker. Sie dürfen nicht improvisiert werden, wenn Hotels „echte Wegezeiten“ oder Activities „echte Öffnungszeiten“ brauchen.

---

## 15. Proaktive Risiken (nicht nur Checkliste)

1. **Flights ist der gefährlichste Live-Pfad.** Es ist die einzige Domäne, die Provider-ähnliche kommerzielle Fakten aus dem Browser persistieren kann, sobald Preview-Suche an ist. Hotels haben das bereits als inakzeptabel behandelt.
2. **Acht kopierte Rate-Limiter werden divergieren.** Flights, Hotels, Activities, Mobility, Rental, Readiness, Safety, Seasonal haben fast denselben In-Memory-Zähler. Ein Shared Operational Contract verhindert, dass der erste bezahlte Adapter den schwächsten Limit erbt.
3. **Mobility Auto-Search ist ein stilles Kostenleck.** Rental Cars macht das bewusst nicht. Dieselbe Disziplin muss vor einem Mobility-Adapter gelten.
4. **Admin Slice B darf Provider-Health nicht pauschal grün machen.** Es gibt heute keine Messwerte, die `provider unavailable`, `no results`, `partial` und internen Fehler operational unterscheiden – nur API-Status-Strings ohne Persistenz.
5. **Currency-Mismatch ist eine Truth-Falle.** Eine CHF-Reise kann Duffel-USD-Preise als vergleichbar anzeigen. Das ist keine UX-Kleinigkeit.
6. **Dokumentationsdrift war real.** Handoff/Roadmap hingen an PR #38, während Seasonal bereits auf `main` lag. Provider-Readiness darf sich nicht auf veraltete Statuszeilen stützen.

---

## 16. Was dieser Audit ausdrücklich nicht behauptet

- Kein Anbieter ist gewählt oder verworfen.
- Kein Vertrag, Secret oder Preis ist verifiziert.
- Audit-PASS ist keine Implementierungsfreigabe.
- Fehlende Adapter sind keine Qualitätsmängel der Foundations.
- Account AP-1 und Admin Slice A werden nicht berührt.
- Kanonische Route-/Traveller-/Readiness-/Safety-/Seasonal-Truth bleibt unverändert.

---

## 17. Deliverable-Index

| Datei | Inhalt |
| --- | --- |
| `docs/PROVIDER_READINESS_MATRIX.md` | Domäne × Dimension, `ready` / `partial` / `missing` / `blocked` |
| `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md` | minimaler gemeinsamer Operationsvertrag |
| `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` | priorisierte, konfliktarme Slices |
| `docs/ACTIVE_WORK_STATUS.md` | Live-Handoff dieses Blocks |

Unabhängiger Review: `docs/PR45_TECHNICAL_LEAD_REVIEW.md`. Bevorzugter nächster Block nach eigenem Auftrag: PR-S1, dann `FlugNachweis`.

**Nächster Schritt:** Product Owner entscheidet über einen neuen Implementierungsauftrag. Keine Runtime-Implementierung in PR #45. PR bleibt Draft.
