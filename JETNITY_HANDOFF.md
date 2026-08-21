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

Phase 3.3 wurde als Pull Request #24 per Squash Merge abgeschlossen. Die Production-Aktivitätensuche bleibt hart deaktiviert.

Der Kontinuitätsstandard wurde als Pull Request #25 gemergt. Er verändert keine Produktlogik, macht aber Dokumentation/Übergabe verbindlich.

Parallel liegt Draft-PR #27 für die Trip-Workspace Mobile-UX Iteration 1. Dieser Stand ist nicht auf `main` und nicht in Production.

## 2. Verbindlicher Produktkern

Jetnity optimiert die **Gesamtreise**, nicht isoliert den billigsten Einzelbaustein.

Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung sollen gemeinsam bewertet und verständlich erklärt werden.

Affiliate-/Vermittlungsprovisionen oder der Providername dürfen die fachliche Rangfolge niemals manipulieren.

Für Änderungen an einer bestehenden Reise gilt:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

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

## 6a. Querschnitt – Trip Workspace Mobile UX Iteration 1

**In Arbeit auf Draft-PR #27. Nicht gemergt. Keine Production-Änderung.**

Branch: `ux-trip-workspace-mobile-iteration-1`

Auftrag: `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_1.md`

Vercel Preview: https://jetnity-app-git-ux-trip-workspace-mobil-c58bb6-jetnity-e1b93c82.vercel.app

Technischer Stand der Iteration:

- `npm test`: **1014/1014**
- Typecheck, Lint, Hygiene und Production-Build grün
- GitHub CI grün
- Vercel Preview grün
- Trip-Workspace-Audit (WebKit + Chromium): **178 Kombinationen, 0 Fehler**
- Activities-Regression-Audit: **184 Kombinationen, 0 Fehler**

Was sich auf Mobile geändert hat:

- kompakter Reisekopf statt großem Hero
- klebende Bereichsnavigation: Übersicht, Plan, Flüge, Unterkunft, Aktivitäten
- Default ist die Übersicht mit ehrlichen Statuszeilen aus dem Reisegraphen
- auf schmalen Viewports ist nur der aktive Bereich sichtbar
- `Reise ändern` ist eine kompakte Aktion in der Übersicht
- der Tagesplan ist ein eigener Hauptbereich mit horizontaler Tagesleiste
- Plan und Aktivitäten teilen dieselbe Tagesauswahl
- Hotel- und Aktivitätssuche starten auf Mobile erst beim ersten Besuch des Bereichs

Was bewusst für Iteration 2 offen bleibt:

- Deep Link / URL für den aktiven Bereich
- Feinschliff nach echtem iPhone-Feedback
- kein Desktop-Redesign, keine Provideranbindung

Provider und Production sind unverändert aus. Keine Migration, keine neuen Secrets.

Nächster Schritt: Nutzer prüft die Vercel Preview auf einem echten iPhone und gibt Produktfeedback. Danach Iteration 2 oder Freigabe zum Merge.

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

- professionelle Architektur
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
2. `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und `docs/PRODUCT_QUALITY_STANDARD.md` lesen.
3. Aktuellen `main`-/PR-/CI-Stand prüfen.
4. Phase 3.3 nicht erneut bauen: sie ist fertig und auf `main`.
5. Phase 3.4 ist der nächste Hauptblock, aber der erste echte Hoteladapter wartet primär auf Booking.com-Zugang.
6. Solange der Zugang fehlt, nur konkrete produktnahe Qualitätsverbesserungen oder andere ausdrücklich freigegebene provider-unabhängige Arbeiten durchführen.
7. Draft-PR #27 (Trip Workspace Mobile UX Iteration 1) bleibt Draft, bis Preview und iPhone-Feedback vorliegen. Nicht mergen.
8. Keine Production-Aktivierung und keine Secrets ohne separate ausdrückliche Freigabe.
