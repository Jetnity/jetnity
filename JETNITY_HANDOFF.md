# Jetnity – Handoff und nächste Schritte

Stand: 20. August 2026

Diese Datei ist der kompakte Übergabepunkt für einen neuen Chat oder Cursor-Agenten. Für Details zusätzlich `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` sowie die Fach-Dokumentation unter `docs/` lesen.

## 1. Aktueller verbindlicher Stand

Phase 2.2 ist nach `main` gemergt und in Production verifiziert. Der Modellweg bleibt in Production deaktiviert.

**Phase 3.1 ist abgeschlossen und nach `main` gemergt.** Pull Request #19 wurde am 20. August 2026 per Squash Merge abgeschlossen. Aktueller Phase-3.1-Merge-Commit auf `main`:

`1ce99839d725d9e97597580909f068dd8af77b57`

Vercel hat diesen Commit anschließend automatisch als **Production Deployment `READY`** ausgerollt.

Phase 3.1 umfasst:

- interne, provider-unabhängige Flugdomäne mit schmalem `FlightProvider`-Interface
- Duffel Offer Requests als erster Daten-/Entwicklungsadapter
- deterministisches, provisionsneutrales Flugranking
- Flugsuche im Reise-Arbeitsbereich
- Übernahme eines Fluges als kommerzieller `trip_item` ohne erfundene `booking_url`
- lokale Airport-Basis aus OurAirports
- lokale Place-Basis aus GeoNames + Airport-Orten
- bestätigte Ortsauswahl auf Startseite und `/planen`
- serverseitige Kanonisierung von Modellorten; bei Mehrdeutigkeit wird nicht geraten
- Feldfehler-UX mit Inline-Meldungen, Scroll/Fokus auf den ersten Fehler und Accessibility
- kontrollierter Production-Rollout für Schema, Airports und Places

Amadeus Self-Service ist im aktiven V2-Code nicht angebunden. Der alte Cursor-Threadname mit „amadeus“ ist nur historisch und kein Architekturhinweis.

## 2. Production-Datenbank nach Phase 3.1

Supabase Production ist gesund. Der Phase-3.1-Rollout wurde vor dem Merge ausdrücklich freigegeben und verifiziert.

Angewendete Migrationen, exakt in dieser Reihenfolge:

1. `20260820100000_reise_anlegen_handelsfelder`
2. `20260820110000_airports_referenz`
3. `20260820120000_places_referenz`
4. `20260820130000_reise_aendern_places`

Aktueller Production-Stand:

- neueste Phase-3.1-Migration: `20260820130000_reise_aendern_places`
- **5 332 Airports** in `public.airports`
- **124 811 Places** in `public.places`
  - 105 914 Städte
  - 13 035 Regionen
  - 290 Inseln
  - 240 Länder
  - 5 332 Flughafen-Orte
- ZRH/GVA/BSL/LHR/LGW/JFK/EWR/DXB/BKK/HND/NRT vorhanden
- Bali, Thailand, Südtirol, Toskana, New York, Japan und Zürich/ZRH auffindbar
- `Test`, `Mordor`, `abcxyz` haben keinen exakten kanonischen Place-Treffer
- RLS auf `airports` und `places` aktiv
- `anon` und `authenticated` besitzen dort nur `SELECT`; keine schreibende Policy
- 3 bestehende `auth.users` und 3 `profiles` unverändert erhalten
- der temporär für den kontrollierten Datentransfer verwendete `http`-Extension-Pfad wurde wieder entfernt; `http` ist in Production nicht installiert

Die Referenzdaten stammen aus dem bereits geprüften Development-Bestand. Fachliche Quellen: OurAirports (Public Domain) und GeoNames (CC BY 4.0). Keine Live-Abfrage dieser Quellen pro Nutzersuche.

**Wichtig:** Der Modellweg bleibt in Production aus. Die Production-Flugsuche bleibt ebenfalls aus. Kein Duffel-Test- oder Live-Token gehört in Production.

## 3. Qualität und Sicherheitsstatus des Merge

Vor dem Merge war der aktuelle Stand vollständig grün:

- `npm test`: **852/852**
- Typecheck grün
- Lint grün
- Hygiene-Checks grün
- Production-Build grün
- GitHub CI grün
- Vercel Preview grün
- Production-Rollout verifiziert
- Vercel Production nach dem Squash Merge: `READY`

Der Production-Checker ist vollständig read-only. Im Phase-3.1-Production-Modus war der Migrationslauf auf `20260820130000` begrenzt, damit keine späteren Migrationen versehentlich mitlaufen.

## 4. Verbindliches Produktprinzip

Jetnity optimiert die **Gesamtreise**, nicht den isoliert billigsten Einzelbaustein.

Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung sollen gemeinsam bewertet und verständlich erklärt werden. Affiliate- oder Vermittlungsprovisionen dürfen das Ranking niemals manipulieren.

Für reale Änderungen gilt weiterhin:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

Das Modell schreibt niemals direkt in die Datenbank. Modellantworten sind untrusted input. Preise, Provider, Booking-URLs und External-Refs dürfen nicht aus dem Modell erfunden werden.

## 5. Nächster Produktblock

**Phase 3.2 / 3.2c Hotel Foundation ist in Arbeit** auf Branch `phase-3-2-hotel-foundation`, Draft-PR #22. Die Foundation und die provider-unabhängige Härtung sind integrationsbereit: Nachweis-Naht an Suchkontext gebunden, Such-Body vor Allokation begrenzt. Ein echter Hotelprovider ist noch nicht angebunden. Die verbindliche Reihenfolge steht in `docs/HOTEL_PROVIDER_STRATEGY.md`. Die Konto-Übernahme ist fail closed, bis ein `HotelNachweis` existiert.

Danach folgen Aktivitäten und Transfers. Nicht mehrere Provider gleichzeitig anbinden; schrittweise und produktorientiert vorgehen.

### Hotel-Prinzip

Jetnity soll vor der konkreten Hotelwahl zuerst bestimmen, **welches Viertel bzw. welche Gegend für genau diese Reise am sinnvollsten ist**.

Dabei sollen unter anderem berücksichtigt werden:

- tatsächliche Etappen und Tagesplanung
- Sehenswürdigkeiten/Aktivitäten
- Flughäfen/Bahnhöfe und Transfers
- Aufenthaltsdauer
- Budget
- Geh- und ÖV-Aufwand
- Ruhe/Nachtleben/Essen/Strand/Familie
- Sonderfälle wie die letzte Nacht vor einem frühen Flug

Erst danach wenige passende Hotels zeigen, z. B. Jetnity-Empfehlung, Best Value, beste Lage, ruhigere Alternative und Premium. Der Trade-off aus Preis, Lage, Zeit und Komfort muss erklärt werden. Provisionen dürfen weder Quartierwahl noch Ranking verzerren.

Start pragmatisch mit Affiliate/Deeplink oder passendem Anbieter; keine unnötige eigene Buchungsplattform bauen.

## 6. Duffel – separat nachholen

Duffel ist **kein Blocker mehr für Phase 3.1**.

Sobald Sandbox-/Testzugang vorliegt, die echte Preview-Verifikation separat durchführen. Nur Preview:

- `JETNITY_FLIGHT_AKTIV=true`
- `DUFFEL_ACCESS_TOKEN=duffel_test_...`

Niemals `NEXT_PUBLIC_*`, niemals Live-Token, niemals Production ohne eigene ausdrückliche Freigabe.

Der Adapter ist bewusst provider-neutral. Später können Skyscanner, Aviasales oder andere Search-Provider ergänzt/ersetzt werden, ohne UI, Ranking und Trip-Integration neu zu bauen.

## 7. Monetarisierung

Primärmodell: Affiliate- und Vermittlungsprovisionen; später passende Partnererlöse.

Die Grenze zwischen Free und Jetnity Pro wird **nicht** heute hart in einzelne Funktionen eingebaut. Vor der ersten echten Pro-Funktion entsteht eine zentrale Entitlement-/Feature-Access-Schicht. Billing/Stripe wird später daran angebunden. Funktionen müssen später zwischen Free, Pro, Limit und Promo verschiebbar sein, ohne verstreute Sonderlogik.

Details: `docs/MONETARISIERUNG.md`.

Starker Pro-Kandidat: automatische Überwachung gespeicherter Reisen, proaktive Hinweise auf Flug-/Hotel-/Provideränderungen, Folgenanalyse und mehrere optimierte Lösungen.

## 8. Travel Readiness

Geplant ist ein professioneller Reisebereitschafts-/Einreisebereich mit:

- Wohnsitz
- Reisepass-Nationalität bzw. ausstellendem Land
- optional mehreren Pässen und bevorzugtem Reisepass
- Visa/eVisa
- Transitregeln
- digitale Einreiseformulare
- Impf-/Gesundheits-Einreisevorgaben getrennt von bloßen Empfehlungen
- Passgültigkeit
- Weiter-/Rückflug und notwendige Dokumente
- Fristen und Erinnerungen relativ zu Reisedaten

Nicht das Sprachmodell als Rechts-/Einreisequelle verwenden. Später professionelle, aktuelle Quelle wie IATA Timatic bzw. offizielle Behörden prüfen. Quelle und Prüfzeitpunkt sichtbar machen. Minimalprinzip bei personenbezogenen Daten; zunächst keine Passnummern oder Scans ohne echten Funktionsbedarf.

Details: `docs/TRAVEL_READINESS.md`.

## 9. Gemeinsame Reiseplanung

Gemeinsame Reiseplanung für Paare, Familien und Gruppen bleibt als wichtiger zukünftiger Kern vorgemerkt. GitHub Issue #20 hält das Kollaborationsfundament fest.

Zielbild:

- Owner, Editor, Viewer
- sichere Einladung per Link/E-Mail
- gemeinsamer Reisegraph
- keine stillen Überschreibungen bei parallelen Änderungen
- vorhandene Revision/Concurrency als Basis
- RLS serverseitig über Mitgliedschaften/Rollen
- Supabase Realtime später für Live-Aktualisierung
- Gast-Reise zunächst persönlicher Draft; echte Kollaboration zuerst mit Konten
- später Vorschläge, Likes/Votes, Gruppenbudget und Änderungsverlauf

Nicht als breites soziales Netzwerk bauen, sondern als Zusammenarbeit an einer konkreten Reise.

## 10. Offene Punkte nach Phase 3.1

Diese Punkte sind bekannt und müssen im Projektgedächtnis bleiben:

- `public.model_usage`: Aufbewahrungsfrist vor Production-Freigabe des Modellwegs festlegen
- Reload verwirft eine noch nicht übernommene Vorschau bewusst
- Router kann ungewöhnliche Formulierungen falsch einordnen; manueller Modell-Stift bleibt möglich
- Preview-Tests sind keine Lasttests
- Production-Modellaktivierung bleibt eine eigene Freigabe
- Production-Flugsuche bleibt eine eigene Freigabe
- Duffel-Angebots-IDs sind kurzlebig; Reise speichert Momentaufnahme, keinen live buchbaren Offer
- aktuelles Flight-Rate-Limit ist In-Memory je Serverless-Instanz; vor Production-Aktivierung globalen/gespeicherten Schutz ergänzen
- Duffel Test deckt nicht den gesamten Markt; UI darf nicht „bester Preis im Internet“ behaupten
- GeoNames-Anzeigenamen können von gebräuchlichen deutschen Namen abweichen; Aliase/Lokalisierung später
- gleichnamige Orte bleiben absichtlich disambiguiert; bei Mehrdeutigkeit nicht raten
- `trips.origin_place_id` und `trip_stages.place_id` haben laut Performance Advisor noch keine eigenen Covering-Indizes; späterer Performance-Pass
- Workspace „Punkt hinzufügen“ und `/auth/update-password` können beim späteren UI-/Launch-Pass dieselbe Feldhülle wie die neuen Formularfehler bekommen
- in Supabase Production existiert ein historischer Cron-Job für `public.sync_creator_profile_core()`, obwohl die Funktion nach Legacy-Bereinigung nicht mehr existiert; erzeugt nur Logfehler und muss in einem **separaten, ausdrücklich freigegebenen Production-Cleanup** entfernt werden

## 11. Arbeits- und Sicherheitsregeln

- Cursor setzt große Implementierungsaufträge um; ChatGPT steuert Produkt, Architektur, Security, Kosten und Review
- größere Aufgabe: analysieren → entscheiden → implementieren → Tests → Build/CI → Dokumentation → PR
- Ursachen beheben, nicht Symptome verstecken
- keine Demo-/Wegwerfarchitektur als Produktionsbasis
- keine neuen wiederkehrenden Kosten oder materiell neue Architektur-/Businessentscheidung ohne Freigabe
- Infrastrukturkosten maximal USD 100/Monat; darüber vorher fragen
- Dev/Test/Preview dürfen genutzt werden; Production bleibt kontrolliert
- keine destruktiven Production-Datenaktionen, riskanten direkten Production-DB-Eingriffe, DNS-/Domainänderungen oder neuen Production-Secrets ohne ausdrückliche Freigabe
- keine Secrets in Chat, Logs, Screenshots oder Commits
- relevante DB-Migrationen zuerst Development; Production nur über getesteten, dokumentierten Weg
- Security/RLS/Auth/Mobile/Accessibility/Performance/Loading/Error States/Permissions/Kostenkontrollen nicht überspringen

## 12. Sofortiger Startpunkt für den nächsten Agenten

1. Phase 3.2c-Härtung auf `phase-3-2-hotel-foundation` / Draft-PR #22 ist der aktuelle Hotelstand. Nächste Freigabe: Zugang für Booking.com Demand API oder HBX-Backup plus `HotelNachweis`, nicht Production. Siehe `docs/HOTEL_PROVIDER_STRATEGY.md`.
2. Nicht mehr an PR #19 weiterarbeiten – er ist gemergt und abgeschlossen.
3. Die Hotel-/Quartierlogik aus Abschnitt 5 und `JETNITY_VISION.md` verbindlich erhalten.
4. Duffel-Sandbox separat nachholen, sobald Zugang eintrifft; sie blockiert Hotels nicht.
5. Production-Flugsuche, Production-Hotelsuche und Modellweg bleiben aus, bis sie jeweils separat freigegeben werden.
6. Den historischen Supabase-Cronjob nicht nebenbei entfernen; dafür eigene Production-Freigabe einholen.
7. Hotels/weitere Provider nicht provisionsgetrieben ranken.
8. Keinen Hotelprovider anbinden, bevor eine gesonderte Entscheidung vorliegt.

Damit ist Phase 3.1 vollständig abgeschlossen, gemergt, in Supabase Production vorbereitet/verifiziert und als Vercel Production Deployment ausgerollt.