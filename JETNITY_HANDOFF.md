# Jetnity – Handoff und nächste Schritte

Stand: 21. August 2026

Diese Datei ist der kompakte operative Übergabepunkt für einen neuen Chat oder Coding Agent. Für Details zusätzlich lesen:

- `JETNITY_VISION.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- relevante Fach-Dokumente unter `docs/`

Der Nutzer muss bereits dokumentierte Projektentscheidungen, offene Keys oder den bisherigen Fortschritt nicht erneut erklären. Wenn Kontext fehlt, zuerst Repository und aktuellen PR-/CI-Stand prüfen.

## 1. Aktueller `main`-Stand

Phase 3.3 ist abgeschlossen und nach `main` gemergt.

Wichtige aktuelle Merge-Commits:

- Phase 3.1 Flight Foundation: `1ce99839d725d9e97597580909f068dd8af77b57`
- Phase 3.2 / 3.2c Hotel Foundation: `a5f39a29b2469aab24756bb59c248362d31e173c`
- Produktqualitätsstandard: `b8254783789bce0707ce2d35e8525ef5cdfb9743`
- Phase 3.3 / 3.3b / 3.3c Activities Foundation: `2fa0f16a43ebb41c9e453013c38a6eb4979b00ce`
- Kontinuitätsstandard: `29c0caabd49a563c051a7d8c9bdd3a3c3f016752`
- Trip Workspace Mobile UX Iteration 1–3: `70e471b00c7505356fe13f8185b204200c4bb781`

Phase 3.3 wurde als Pull Request #24 per Squash Merge abgeschlossen. Die Production-Aktivitätensuche bleibt hart deaktiviert.

Der Kontinuitätsstandard wurde als Pull Request #25 gemergt. Er verändert keine Produktlogik, macht aber Dokumentation/Übergabe verbindlich.

PR #27 (Trip Workspace Mobile UX Iteration 1–3) und PR #29 (Trip Coverage & Booking Status) sind nach `main` gemergt. Basis dieses Stands ist `211872c1`.

**Tatsächlicher Production-Stand:** Die Booking-Status-Migration `20260821100000` ist am 21. August 2026 nach ausdrücklicher Nutzerfreigabe auf Production angewendet.

**Playbook-Grenze:** `docs/PRODUCTION_ROLLOUT.md` stoppt automatische Production-Läufe weiterhin bei `20260820130000`. Das ist eine Guardrail gegen unbeabsichtigtes Nachziehen späterer Dateien, kein Gegenbeweis zum realen Production-Stand. `20260821120000_trip_items_mobility` bleibt Development-only.

Der aktuelle Produktblock ist **Foundation A – Mobilität & Transfers** auf Draft-PR #30, Branch `feat/mobility-transfers-foundation`. **PR bleibt Draft, nicht mergen.** Die Mobilitätsmigration `20260821120000` darf nur auf Development angewendet werden, nicht auf Production. Kein Provider, keine Fake-Fahrpläne, keine Production-Aktivierung. Phase 3.4 bleibt extern blockiert.

## 2. Verbindlicher Produktkern

Jetnity optimiert die **Gesamtreise**, nicht isoliert den billigsten Einzelbaustein.

Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung sollen gemeinsam bewertet und verständlich erklärt werden.

Jetnity ist **kein Bündel einzelner Suchmaschinen**. Flug, Unterkunft, Aktivitäten, Transfers, Tagesplan, Budget, Reisende und Präferenzen sollen um denselben Reisegraphen herum zusammenarbeiten. Vorhandener Reisekontext soll wiederverwendet werden, statt den Nutzer dieselben Daten mehrfach eingeben oder Zusammenhänge selbst prüfen zu lassen.

Verbindliches Nutzerziel: Jetnity soll so viel sinnvolle Arbeit, Suchaufwand, Doppelarbeit, Entscheidungsstress und organisatorische Reibung wie möglich abnehmen. Nutzerbindung soll aus realem Nutzen, Vertrauen, Zeitersparnis und geringerem Reisestress entstehen – nicht aus Dark Patterns.

Die **erste vollständig mit Jetnity geplante und begleitete Reise** ist ein zentraler Produkttest. Der Nutzer soll spätestens dabei deutlich erleben, wie viel Arbeit Jetnity ihm abnimmt, und Jetnity bei der nächsten Reise als selbstverständlichen Ausgangspunkt wählen wollen.

Affiliate-/Vermittlungsprovisionen oder der Providername dürfen die fachliche Rangfolge niemals manipulieren.

Für Änderungen an einer bestehenden Reise gilt:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

Langfristig soll Jetnity vor und während der Reise mitdenken: offene Flugabschnitte/Hotelnächte, Buchungsstatus, Konflikte, Provider-Änderungen und nächste sinnvolle Schritte erkennen und verständlich erklären. Dabei niemals Live-Fakten erfinden oder wichtige Buchungsänderungen still durchführen.

Modellantworten sind untrusted input. Das Modell schreibt nicht direkt in die Datenbank und darf Preise, Provider, Booking-URLs oder External-Refs nicht erfinden.

## 3. Phase 3.1 – Flight Foundation

Abgeschlossen und auf `main`.

Umfasst:

- provider-neutrale Flugdomäne
- schmale `FlightProvider`-Naht
- Duffel Offer Requests als erster Adapter
- deterministisches, provisionsneutrales Ranking
- geschlossene Jetnity-Flugsuche
- Flight-Übernahme als kommerzieller `trip_item`
- lokale Airport-Basis aus OurAirports
- lokale Place-Basis aus GeoNames + Airport-Orten
- bestätigte Ortsauswahl und serverseitige Kanonisierung

Production-Flugsuche bleibt aus.

Duffel-Testzugang wird separat nachgeholt. Nur Preview:

- `JETNITY_FLIGHT_AKTIV=true`
- `DUFFEL_ACCESS_TOKEN=duffel_test_...`

Nie `NEXT_PUBLIC_*`, nie Token committen oder in Logs/Screenshots zeigen. Production bleibt separat freigabepflichtig.

## 4. Phase 3.2 – Hotel Foundation

Abgeschlossen und auf `main`.

Umfasst:

- provider-neutrale Hotel-Domäne
- Quartier-/Gegendlogik vor Hotelwahl
- Suchpipeline und geschlossene `/api/hotels/search`
- deterministisches, provisionsneutrales Quartier- und Hotelranking
- serverseitiger `HotelNachweis`
- Nachweis an Ziel, Zeitraum, Belegung und Währung gebunden
- Browser sendet für kommerzielle Konto-Übernahme nur Kennungen
- serverseitiger Reisegraph als Vertrauensquelle
- harter Request-Body-Cap vor großer Allokation
- Speicherung auf bestehendem `trip_items.kind = stay`
- keine neue Migration für diese Foundation

Ein echter Hotelprovider ist **noch nicht angebunden**.

Production-Hotelsuche bleibt aus.

Providerstrategie: `docs/HOTEL_PROVIDER_STRATEGY.md`.

Verbindliche Integrationsreihenfolge:

1. Booking.com Demand API – bevorzugt, sofern Managed Affiliate Partner Zugang erteilt wird
2. HBX / Hotelbeds – technischer Backup-Weg
3. Expedia Rapid – späterer Kandidat
4. mehrere Quellen erst bei nachweisbarem Produkt-/Coverage-Nutzen

### Hotel-Prinzip

Jetnity bestimmt zuerst, welches Viertel bzw. welche Gegend für die konkrete Reise am sinnvollsten ist.

Danach werden wenige passende Hotels gezeigt, z. B.:

- Jetnity-Empfehlung
- Best Value
- beste Lage
- ruhigere Alternative
- Premium

Trade-offs aus Preis, Lage, Zeit und Komfort müssen verständlich erklärt werden. Provisionen dürfen weder Quartierwahl noch Hotelranking verzerren.

## 5. Phase 3.3 – Activities Foundation

**Abgeschlossen, gemergt und Production-deployt.**

Pull Request #24, Merge-Commit:

`2fa0f16a43ebb41c9e453013c38a6eb4979b00ce`

Umfasst:

- provider-neutrale Activity-Domäne
- geschlossene `POST /api/activities/search`
- Tageskontext aus dem Reisegraphen
- deterministisches, provisionsneutrales Ranking
- explizite Zeit-/Konfliktlogik
- unbekannte Zeit-/Nähe-/Öffnungsfakten werden nicht erfunden
- serverseitige `ActivityNachweis`-Naht
- Konto-Übernahme fail closed, solange kein echter Nachweis existiert
- Browser sendet bei kommerzieller Übernahme nur Kennungen
- Speicherung auf bestehendem `trip_items.kind = activity`
- keine Datenbankmigration nötig
- Activities-Bereich im bestehenden Trip Workspace
- Abort-/Race-Verhalten bei schnellem Tagwechsel geprüft
- interne Audit-Seite in Production fail closed

Qualitätsstand vor Merge:

- `npm test`: **1001/1001**
- Typecheck grün
- Lint grün
- Hygiene grün
- Production-Build grün
- GitHub CI grün
- Vercel Preview grün
- WebKit + Chromium Activities-Audit: **184 Kombinationen, 0 Fehler**
- 13 Zustände × 7 Viewports × 2 Engines plus Interaktions-/Race-Prüfungen

Ein echter Activity-Provider ist **noch nicht angebunden**.

Production-Aktivitätensuche bleibt aus.

### Aktivitäts-Prinzip

Eine Aktivität ist dann gut, wenn sie zur konkreten Reise und zum konkreten Reisetag passt.

Berücksichtigen, soweit belastbar vorhanden:

- Etappe und Zielort
- konkreter Reisetag
- vorhandene Tagespunkte/Uhrzeiten
- Interessen und Reisetempo
- Budget und Teilnehmerzahl
- Qualität/Stornierbarkeit nur als Provider-Fakt

Nicht erfinden:

- Öffnungszeiten
- Wegezeiten
- Nähe nur wegen derselben Stadt
- minutengenaue Lücken ohne echte Uhrzeit

## 6. Nächster Hauptblock – Phase 3.4

**Status: WARTET / EXTERN BLOCKIERT.**

Phase 3.4 bleibt der **erste echte Hotel-Suchadapter**.

Primärer Blocker: Booking.com Demand API / Managed Affiliate Partner Zugang bzw. API-Key. Backup: HBX / Hotelbeds.

Solange dieser Zugang fehlt:

- keinen Fake-Booking-Adapter bauen
- keine simulierten Preise/Verfügbarkeiten im Produktweg
- Production-Hotelsuche nicht aktivieren
- Phase 3.4 nicht künstlich als erledigt markieren

Sobald Zugang vorliegt, zuerst nur Preview:

1. echten `HotelProvider` implementieren
2. Provider-Rohdaten in das neutrale Jetnity-Modell normalisieren
3. Preise, Verfügbarkeit, Stornierung und relevante Fakten serverseitig verifizieren
4. echten `HotelNachweis` anbinden
5. Search und Affiliate-/Redirect-Verantwortung getrennt halten
6. Quartier-/Hotelranking weiterhin provisionsneutral halten
7. echte Hotelkarten im Trip Workspace anzeigen
8. Error/Timeout/Rate-Limit/Provider-Ausfall abdecken
9. Preview-End-to-End-Test mit echten Ergebnissen
10. Mobile-/Browser-Audit durchführen
11. Production weiterhin aus lassen, bis separat freigegeben

Wenn Booking.com-Zugang nicht zeitnah möglich ist, HBX / Hotelbeds als dokumentierten Backup-Weg prüfen.

## 6a. Querschnitt – Trip Workspace Mobile UX Iteration 1–3

**Auf `main` gemergt** als Pull Request #27, Merge-Commit `70e471b00c7505356fe13f8185b204200c4bb781`.

Keine Production-Datenbankänderung. Provider-Suchen bleiben aus.

## 6b. Querschnitt – Trip Coverage & Booking Status

**Auf `main` gemergt** als Pull Request #29, Merge-Commit `211872c1aad0e002d81f5ea1fb2d7eef4490d4b7`. Der echte iPhone-Retest nach dem Visibility-Fix ist bestanden. Die Production-Booking-Migration ist nach ausdrücklicher Nutzerfreigabe angewendet und verifiziert. Provider-Suchen/Kill-Switches bleiben unverändert.

Branch: `feat/trip-coverage-booking-status`

Hauptauftrag: `docs/CURSOR_TRIP_COVERAGE_BOOKING_STATUS_TASK.md`

Real-Device-Fixauftrag: `docs/CURSOR_PR29_TAB_VISIBILITY_FIX.md`

Der frühere Trip-Workspace-Audit mit **274 Kombinationen, 0 Fehler** hat die iPhone-Regression nicht gefunden, weil er nur das `hidden`-Attribut prüfte. Nach dem Fix: **278 Kombinationen, 0 Fehler**, inklusive Wechselketten auf 390/430 px (WebKit + Chromium). Activities-Regression: **184 Kombinationen, 0 Fehler**. Local `npm test` **1059/1059**. Typecheck, Lint, Hygiene und Production-Build grün. GitHub CI und Vercel Preview für den Visibility-Fix SUCCESS.

### Visibility-Fix (iPhone-Stack)

Ursache: inaktive gemountete Wrapper trugen HTML `hidden` und gleichzeitig Tailwind `grid`. Author-CSS `display: grid` überstimmt `[hidden] { display: none }`. Zusätzlich setzt React 18 `inert={true}` nicht ins DOM.

Umsetzung:

- ein einheitlicher Wrapper `BereichHuelle` mit `data-arbeitsbereich`
- verborgene Bereiche tragen nur die Klasse `hidden`, niemals `grid`/`flex`/`block`
- `inert` wird per `setAttribute` gesetzt
- besuchte Bereiche bleiben eingehängt, nehmen aber kein Layout mehr ein

Der automatisierte Audit prüft nach jeder Sequenz `getComputedStyle` und die Layoutbox, nicht nur das Attribut. Der anschließende Test auf einem echten iPhone hat die zuvor gemeldete Vermischung bei Tabwechseln nicht mehr reproduziert; die Wechsel funktionieren sauber.

Was dieser Block baut:

- ehrliche Flug- und Unterkunftsabdeckung aus dem echten Reisegraphen
- explizites `Als gebucht markieren` / `Buchung korrigieren` für Flug- und Stay-Planpunkte
- kompakte Statuszeilen in der Übersicht
- Bestand/Abdeckung oberhalb der bestehenden Suche
- persistenter, provider-neutraler Buchungsstatus auf `trip_items` (ADR-0089)

Was dieser Block ausdrücklich nicht baut:

- Provider-Buchungsbestätigung
- Production-Provider-Aktivierung oder Änderung bestehender Provider-Kill-Switches
- Collaboration / PR #28
- Redesign von Startseite, `Meine Reisen` oder Reise-Erstellung

Production-Migrationsstand für PR #29:

- Migration `20260821100000_trip_items_booking_status` am 21. August 2026 nach ausdrücklicher Nutzerfreigabe von Development nach Production übernommen
- Spalten `booking_status`, `booking_source`, `booking_confirmed_at` auf Production vorhanden
- `booking_status` ist `NOT NULL DEFAULT 'unconfirmed'`
- vier Booking-CHECK-Constraints auf Production vorhanden
- `reise_anlegen(jsonb)` schreibt die drei Booking-Felder
- bestehende Production-Zeilen wurden als `unconfirmed` übernommen
- Verifikationsabfrage nach Migration: **0 ungültige Booking-Zeilen**

Nächster Schritt nach PR #29: nicht erneut bauen. Foundation A liegt auf Draft-PR #30.

## 6c. Foundation A – Mobilität & Transfers

**In Arbeit auf Draft-PR #30.** Branch `feat/mobility-transfers-foundation`. Auftrag: `docs/CURSOR_MOBILITY_TRANSFERS_FOUNDATION_TASK.md`. Fachdoku: `docs/MOBILITY.md`. ADRs: ADR-0090, ADR-0091.

Lokaler Nachweis 21. August 2026:

- `npm test` **1100/1100**
- Typecheck, Lint, Hygiene und Production-Build grün
- Development-Migration `20260821120000` angewendet; `db:typen --pruefen`, `db:rechte`, `db:rls`, `db:sicherheit` **169/169**
- Trip-Workspace-Audit: **358 Kombinationen, 0 Fehler** (WebKit + Chromium, fünf Hauptbereiche)
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- Historischer Development-Transfer bleibt ohne Modus und `unconfirmed`

Was dieser Block baut:

- `kind=transfer` als gemeinsamer persistenter Mobilitäts-Planpunkt
- optionale strukturierte Spalten auf `trip_items`, nicht JSON und nicht 1:1-Tabelle
- konservative Reisegraph-Abdeckung (`Bewegungskante`): Transfer nur bei Start + Ziel + Datum; gleichdatiger Flug ohne strukturierte Route bleibt `unknown`, nicht `covered_by_flight`
- manueller Buchungsstatus für Transfers
- manuelle Erfassung als Nutzerangabe
- geschlossene `POST /api/mobility/search`, Factory/Nachweis fail closed
- ein Workspace-Bereich „Mobilität“ in der bestehenden Fünfer-Navigation

Was dieser Block ausdrücklich nicht baut:

- Providerauswahl oder -anbindung
- Fake-Preise, Fahrpläne, Verfügbarkeiten
- Production-Migration oder Production-Suche
- Mietwagen, Kreuzfahrten, Hotelprovider (Phase 3.4)
- Redesign von Startseite, `Meine Reisen` oder Reise-Erstellung

Migration `20260821120000_trip_items_mobility.sql` nur Development. Kill Switch `JETNITY_MOBILITY_AKTIV` ist kein Provider-Secret. PR bleibt Draft.

## 7. Provider-unabhängiger Foundation-Track während Phase 3.4 wartet

Die Wartezeit auf externe Providerzugänge wird nicht nur für optische Optimierungen genutzt. Jetnity baut den fehlenden **provider-unabhängigen Reise-Unterbau** bis zu dem Punkt, an dem später nur noch echte Provider/Nachweise angeschlossen werden müssen.

Reihenfolge:

### A. Mobilität & Transfers Foundation

**In Arbeit auf Draft-PR #30.** Gemeinsames Reisegraph-Modell für Bahn, Bus, Fähre und Transfer. Ziel: Start/Ziel, Station/Hafen, Abfahrt/Ankunft, Dauer, Status und Anschlussbeziehungen zu Flug, Unterkunft und Tagesplan verstehen. Noch keine Fake-Suche und kein erfundener Fahrplan. Details in Abschnitt 6c und [docs/MOBILITY.md](docs/MOBILITY.md).

### B. Mietwagen Foundation

Separates Modell für:

- Abholort und Rückgabeort
- Abhol-/Rückgabezeit
- Fahrer-/Reisendenbezug
- Fahrzeugklasse bzw. Anforderungen
- Preis/Flexibilität nur als verifizierbare Provider-Fakten
- Zusammenhang mit Etappen, Unterkünften und anderen Transfers

### C. Travel Readiness & Dokumente Foundation

Zuerst Status/Checklisten/Referenzen für Dinge wie:

- Einreise-/Visumthemen
- Reisepass-/Dokumentstatus
- Versicherungen
- Tickets/Buchungsbestätigungen
- wichtige Vorbereitungen vor Abreise

Ein echter Tresor für Pass-/Identitätsdokumente wird **nicht nebenbei** gebaut. Dafür braucht es später eine separate Security-/Verschlüsselungsentscheidung und explizite Freigabe.

### D. Gesamt-Abdeckung erweitern

Die zentrale Reiseübersicht soll danach provider-neutral erkennen können, welche wichtigen Bestandteile der Reise abgedeckt, offen oder noch nicht bestimmbar sind – nicht nur Flüge und Hotelnächte, sondern auch Mobilität/Mietwagen/Reisevorbereitung, soweit belastbare Daten vorhanden sind.

### Kreuzfahrten

Kreuzfahrten werden bewusst **noch nicht als eigene große Foundation** gebaut. Das Reisegraph-Modell soll mehrtägige Reisebausteine später zulassen, aber Kabinen-/Tarif-/Deck-/Routenlogik wird erst bei echtem Produktbedarf und Providerzugang umgesetzt.

Während dieses Foundation-Tracks sind weiterhin konkrete Design-/UX-/Performance-/Accessibility-Verbesserungen erlaubt, aber sie verdrängen den funktionalen Unterbau nicht ohne Grund.

## 8. Danach geplante Reihenfolge

### Phase 3.5 – erster echter Activity-Provider

Genau einen Provider integrieren, serverseitigen Nachweis anbinden, echten Preview-Weg verifizieren; Production zunächst aus. Wenn der erforderliche Zugang noch fehlt, bleibt auch diese Providerphase extern blockiert, ohne Fake-Integration.

### Phase 3.6 – Transfers / echte Mobilitätsprovider

Die unter Abschnitt 7 vorbereitete Mobilitäts-/Transfer-Foundation erhält erst dann echte Provider-/Fahrplandaten. Keine breite Transportplattform auf Vorrat.

### Phase 4 – Launch-Reife

Unter anderem:

- zentrale Free-/Pro-Entitlement-Schicht vor erster echten Pro-Funktion
- Monetarisierung/Affiliate-Flüsse
- globale/gespeicherte Rate-Limits vor Production kommerzieller Suchen
- Security/RLS/Auth-Finalisierung
- Performance-Pass
- reale Hardware-/Browser-Verifikation
- Monitoring/Observability
- kontrollierte Production-Rollouts

## 9. Production-Datenbank

Supabase Production Projekt:

`qscbgcdmivbbnzrcyegn`

Region: `eu-central-2`.

Bekannter bestätigter Referenzdatenstand nach Phase 3.1:

- 5 332 Airports
- 124 811 Places
- RLS auf `airports` und `places` aktiv
- `anon` und `authenticated` dort nur `SELECT`

Angewendete relevante Migrationen:

1. `20260820100000_reise_anlegen_handelsfelder`
2. `20260820110000_airports_referenz`
3. `20260820120000_places_referenz`
4. `20260820130000_reise_aendern_places`
5. `20260821100000_trip_items_booking_status` – am 21. August 2026 nach ausdrücklicher Nutzerfreigabe auf Production angewendet und verifiziert

Phase 3.2 und 3.3 benötigten für ihre Foundations keine neue Production-Migration.

Booking-Status-Production-Verifikation nach Migration:

- drei neue Spalten vorhanden
- vier CHECK-Constraints vorhanden
- `reise_anlegen(jsonb)` enthält die Booking-Felder
- bestehende Zeilen standardmäßig `unconfirmed`
- 0 ungültige Booking-Zeilen

Keine riskante Production-DB-Aktion ohne ausdrückliche Freigabe.

## 10. Offene externe Abhängigkeiten

Diese Punkte dürfen nicht aus der Dokumentation verschwinden, bis sie nachweislich erledigt sind:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX / Hotelbeds als Hotel-Backup
- Duffel Sandbox-/Testtoken für echte Preview-Verifikation
- Duffel Production-Zugang später separat
- erster echter Activity-Provider und Zugang
- echte Bahn-/Bus-/Fähre-/Transfer-/Mietwagenprovider erst nach dem provider-unabhängigen Foundation-Track

## 11. Bekannte technische Punkte / Schulden

- Flight-/Hotel-/Activity-Rate-Limits sind vor Production-Aktivierung auf globalen/gespeicherten Schutz zu härten, soweit aktuell In-Memory
- Duffel Offer IDs sind kurzlebig; gespeicherte Reise ist eine Momentaufnahme, kein dauerhaft live buchbares Offer
- GeoNames-Anzeigenamen können von gebräuchlichen deutschen Namen abweichen
- gleichnamige Orte bleiben absichtlich disambiguiert; bei Mehrdeutigkeit nicht raten
- `trips.origin_place_id` und `trip_stages.place_id` haben laut Performance Advisor noch keine eigenen Covering-Indizes; späterer Performance-Pass
- historischer Production-Cron-Job referenziert `public.sync_creator_profile_core()`, obwohl die Legacy-Funktion nicht mehr existiert; erzeugt Logfehler und darf nur in einem separaten ausdrücklich freigegebenen Production-Cleanup entfernt werden
- Production-Modellweg, Production-Flugsuche, Production-Hotelsuche und Production-Aktivitätensuche benötigen jeweils eigene Freigaben

## 12. Verbindliche Qualitäts- und Arbeitsregeln

Cursor ist Hauptentwickler für größere Implementierungsaufgaben. ChatGPT steuert Produkt, Architektur, Security, Kosten und Review.

Größere Aufgabe:

`analysieren → entscheiden → implementieren → Tests → Build/CI → UI-/Security-Review → Dokumentation → PR → Freigabe → Merge`

Verbindlich:

- `JETNITY_VISION.md` als Produkt-Nordstern lesen und schützen
- professionelle Architektur
- ein zusammenhängendes Reisesystem statt isolierter Suchprodukte
- maximale sinnvolle Nutzerentlastung und Stressreduktion
- mobile-first
- Design-/UX-Qualität
- Geschwindigkeit
- Navigation
- Sucherlebnis
- verständliche Empfehlungen
- Accessibility
- echte/verifizierte Reisedaten
- keine Fake-Daten im Produktweg
- Security by default
- keine Secrets im Client/Git/Chat/Logs
- keine unnötigen Libraries/Microservices/Multi-Provider-Abstraktionen
- Infrastrukturkosten weiterhin kontrolliert; bei relevanter Überschreitung des vereinbarten Budgets zuerst fragen
- Production bleibt kontrolliert

Eine Phase ist erst fertig, wenn Dokumentation und Handoff dem tatsächlichen Stand entsprechen.

## 13. Sofortiger Startpunkt für einen neuen Agenten

1. `docs/CONTINUITY_STANDARD.md` lesen.
2. `JETNITY_VISION.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und `docs/PRODUCT_QUALITY_STANDARD.md` lesen.
3. Aktuellen `main`-/PR-/CI-Stand prüfen.
4. Phase 3.3 nicht erneut bauen: sie ist fertig und auf `main`.
5. PR #27 nicht erneut bauen: Trip Workspace Mobile UX Iteration 1–3 ist auf `main`.
6. PR #29 nicht erneut bauen: Coverage/Booking Status ist auf `main`.
7. Foundation A liegt auf Draft-PR #30. **Nicht mergen.** Keine Production-Migration, keine Production-Provider-Aktivierung.
8. Phase 3.4 bleibt der nächste echte Provider-Hauptblock, **wartet extern** auf Booking.com bzw. alternativ HBX/Hotelbeds.
9. Nach Review/Merge von PR #30 entscheidet die Roadmap den nächsten Foundation-Schritt (Mietwagen, Travel Readiness oder ein inzwischen verfügbarer Providerzugang) – nicht automatisch einen Mobilitätsprovider.
10. Keine Fake-Providerdaten, keine Production-Provider-Aktivierung und keine Secrets ohne separate ausdrückliche Freigabe.