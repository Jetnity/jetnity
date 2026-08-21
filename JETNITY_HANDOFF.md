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

PR #27 (Trip Workspace Mobile UX Iteration 1–3) ist nach `main` gemergt. Der aktuelle Produktblock **Trip Coverage & Booking Status** liegt auf Draft-PR #29, Branch `feat/trip-coverage-booking-status`. **Nicht mergen. Nichts in Production aktivieren oder migrieren.**

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

## 6. Nächster Produktblock – Phase 3.4

**Erster echter Hotel-Suchadapter.**

Primärer Blocker: Booking.com Demand API / Managed Affiliate Partner Zugang bzw. API-Key.

Solange dieser Zugang fehlt:

- keinen Fake-Booking-Adapter bauen
- keine simulierten Preise/Verfügbarkeiten im Produktweg
- Production-Hotelsuche nicht aktivieren

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

**Umgesetzt auf Draft-PR #29. Visibility-Fix für den iPhone-Tab-Stack ist auf dem Branch. Nicht mergen, bis ein erneuter iPhone-Test bestätigt. Keine Production-Migration, kein Production-Kill-Switch.**

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

Der automatisierte Audit prüft nach jeder Sequenz `getComputedStyle` und die Layoutbox, nicht nur das Attribut. Ein erneuter Test auf echtem iPhone steht noch aus.

Was dieser Block baut:

- ehrliche Flug- und Unterkunftsabdeckung aus dem echten Reisegraphen
- explizites `Als gebucht markieren` / `Buchung korrigieren` für Flug- und Stay-Planpunkte
- kompakte Statuszeilen in der Übersicht
- Bestand/Abdeckung oberhalb der bestehenden Suche
- persistenter, provider-neutraler Buchungsstatus auf `trip_items` (ADR-0089)

Was dieser Block ausdrücklich nicht baut:

- Provider-Buchungsbestätigung
- Production-Migration oder Production-Aktivierung
- Collaboration / PR #28
- Redesign von Startseite, `Meine Reisen` oder Reise-Erstellung

Nächster Schritt auf PR #29:

1. neue Preview auf echtem iPhone prüfen (`Flüge → Unterkunft` und die anderen Wechselketten)
2. erst danach `Mark Ready` erwägen
3. PR bleibt Draft, nicht mergen

## 7. Arbeiten während wir auf Booking.com warten

Es ist ausdrücklich sinnvoll, konkrete Probleme der echten Jetnity-Website parallel zu verbessern.

Erlaubte, gut abgegrenzte Arbeiten:

- Design-/UX-Probleme aus realer Nutzung
- Mobile-UX
- Navigation
- Sucherlebnis
- Performance
- Loading-/Empty-/Error-Zustände
- Accessibility
- verständlichere Texte und Empfehlungen
- konkrete sichtbare Qualitätsmängel

Solche Arbeiten sollen anhand echter Beobachtungen/Screenshots priorisiert werden. Keine spekulativen Großumbauten und keine Fake-Providerintegration.

## 8. Danach geplante Reihenfolge

### Phase 3.5 – erster echter Activity-Provider

Genau einen Provider integrieren, serverseitigen Nachweis anbinden, echten Preview-Weg verifizieren; Production zunächst aus.

### Phase 3.6 – Transfers

Nur produktorientiert und auf Basis echter Reisebedürfnisse. Keine breite Transportplattform auf Vorrat.

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

Angewendete Phase-3.1-Migrationen:

1. `20260820100000_reise_anlegen_handelsfelder`
2. `20260820110000_airports_referenz`
3. `20260820120000_places_referenz`
4. `20260820130000_reise_aendern_places`

Phase 3.2 und 3.3 benötigten für ihre Foundations keine neue Production-Migration.

Die Booking-Status-Migration aus PR #29 ist Development-only und **nicht** auf Production angewendet.

Keine riskante Production-DB-Aktion ohne ausdrückliche Freigabe.

## 10. Offene externe Abhängigkeiten

Diese Punkte dürfen nicht aus der Dokumentation verschwinden, bis sie nachweislich erledigt sind:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX / Hotelbeds als Hotel-Backup
- Duffel Sandbox-/Testtoken für echte Preview-Verifikation
- Duffel Production-Zugang später separat
- erster echter Activity-Provider und Zugang

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
6. Draft-PR #29 bleibt Draft. Der Tab-Visibility-Fix liegt auf dem Branch; vor Freigabe den erneuten iPhone-Test aus `docs/CURSOR_PR29_TAB_VISIBILITY_FIX.md` prüfen.
7. Nach sauberem Abschluss des Querschnittsblocks ist Phase 3.4 der nächste Hauptblock; der erste echte Hoteladapter wartet primär auf Booking.com-Zugang.
8. Solange der Zugang fehlt, nur konkrete produktnahe Qualitätsverbesserungen oder andere ausdrücklich freigegebene provider-unabhängige Arbeiten durchführen.
9. Keine Production-Aktivierung und keine Secrets ohne separate ausdrückliche Freigabe.
