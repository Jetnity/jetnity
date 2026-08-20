# Jetnity – Handoff und nächste Schritte

Stand: 20. August 2026

Diese Datei ist der kompakte Übergabepunkt für einen neuen Chat, neuen Cursor-Agenten oder eine spätere Fortsetzung. Sie ergänzt `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` und die Fach-Dokumentation unter `docs/`.

## 1. Aktueller Stand

Phase 2.2 ist nach `main` gemergt (PR #18, `76f21929`) und in Production verifiziert. Der Modellweg bleibt in Production aus.

Phase 3.1 – Flight Foundation – ist fachlich abgeschlossen und der zugehörige Supabase-Production-Rollout wurde am 20. August 2026 erfolgreich verifiziert. PR #19 bleibt bis zur finalen GitHub-Freigabe Draft. Duffel Flights API ist der erste Daten-/Entwicklungsadapter; die echte Sandbox-Verifikation ist nachgelagert und kein Merge-Blocker. Amadeus Self-Service wurde am 17. Juli 2026 eingestellt und ist im aktiven V2-Code nicht mehr angebunden – auch nicht als Airport-Fallback. Die Autocomplete liest nur `public.airports`; die Ortsauswahl liest nur `public.places`. Production-Flugsuche bleibt aus. Keine eigene Flugbuchung.

Verbindlicher Ablauf der Änderung (Phase 2.2, unverändert):

`vertrauenswürdige Reise → Änderungswunsch → strukturierte Operationen → deterministische Anwendung → Vorher/Nachher → ausdrückliche Bestätigung → atomisches Speichern`

- Das Modell schreibt nicht in die Datenbank und erhält keine SQL-Rechte
- Modellantworten sind untrusted input
- Preise, Provider, Booking-URLs und External-Refs kommen nicht aus dem Modell
- Ein übernommener kommerzieller Flug bleibt gegen Sprach-/Modelloperationen vollständig gesperrt (Inhalt, Termin, Zuordnung)
- `trip_days.stage_id` ordnet Tage einer Etappe zu, auch ohne Kalenderdaten
- `trips.revision` / `last_mutation_id` tragen optimistische Concurrency und Idempotenz
- Account: `public.reise_aendern()`, SECURITY INVOKER, RLS, atomisch
- Gast: derselbe fachliche Ablauf im LocalStorage
- Gemeinsames Modellkontingent mit `reisevorschlag` (38 Aufrufe / USD 3 pro Tag)

Phase 3.1 ergänzt:

- interne Flugdomäne und schmales `FlightProvider`-Interface
- Duffel Offer Requests als erster Adapter (nur Test-Token)
- deterministisches, provisionsneutrales Ranking
- Flugsuche im Reise-Arbeitsbereich
- Übernahme als kommerzieller `trip_item` ohne `booking_url`
- lokale Flughafenbasis aus OurAirports, ohne Provider- und ohne Live-Abfrage
- lokale Ortsbasis aus GeoNames (CC BY 4.0) plus Flughafen-Zeilen; Startseite und `/planen` speichern nur bestätigte Orte
- serverseitige Kanonisierung auch für Modellorte; bei Mehrdeutigkeit wird nicht geraten
- verbesserte Formularfehler-UX mit Feldmeldung, Scroll/Fokus und Accessibility

Entscheidungen: ADR-0057 bis ADR-0061 (Phase 2.2), ADR-0062 bis ADR-0069 (Phase 3.1). Fachlich: `docs/REISEN.md`, `docs/FLUEGE.md`, `docs/FLUGHAFEN.md`, `docs/ORTE.md`, `docs/MODELL.md`, `docs/DATENBANK.md`, `docs/PRODUCTION_ROLLOUT.md`.

## 2. Production-Rollouts am 20. August 2026

### 2.1 V2-Basis / Phase 2.2

Vor dem GitHub-Merge von Phase 2.2 wurde Supabase Production kontrolliert auf den bereits auf dem Development-Branch getesteten V2-Datenbankstand gebracht.

Die wichtigen Kontodaten wurden getrennt von der alten Creator-/Media-/Blog-Struktur behandelt. Ergebnis:

- 3 `auth.users` erhalten
- 3 `profiles` erhalten und weiterhin mit den 3 Auth-Konten verknüpft
- keine verwaisten Profile
- alte Creator-/Blog-/Media-/Session-Altlasten entfernt
- Reisetabellen (`trips`, `trip_stages`, `trip_days`, `trip_items`) vorhanden
- Production gesund

Der Stand endete zunächst bei `20260820080000_reise_tage_eindeutig_aufgeschoben`.

### 2.2 Phase 3.1 – Airports und Places

Nach ausdrücklicher Nutzerfreigabe wurde der dokumentierte Phase-3.1-Rollout ausgeführt und verifiziert.

Angewendete Production-Migrationen, exakt in dieser Reihenfolge:

1. `20260820100000_reise_anlegen_handelsfelder`
2. `20260820110000_airports_referenz`
3. `20260820120000_places_referenz`
4. `20260820130000_reise_aendern_places`

Ergebnis:

- neueste Production-Migration: `20260820130000_reise_aendern_places`
- 5 332 Airports in `public.airports`
- 124 811 Places in `public.places`
  - 105 914 Städte
  - 13 035 Regionen
  - 290 Inseln
  - 240 Länder
  - 5 332 Flughafen-Orte
- Pflicht-Airports ZRH/GVA/BSL/LHR/LGW/JFK/EWR/DXB/BKK/HND/NRT vorhanden
- Bali, Thailand, Südtirol, Toskana, New York, Japan, Zürich/ZRH in der lokalen Ortsbasis auffindbar
- `Test`, `Mordor`, `abcxyz` haben keinen exakten kanonischen Place-Treffer
- RLS auf `airports` und `places` aktiv
- `anon` und `authenticated` besitzen dort nur `SELECT`; keine schreibende Policy
- 3 `auth.users` und 3 `profiles` unverändert erhalten
- der für den kontrollierten Datentransfer temporär verwendete `http`-Extension-Pfad wurde danach wieder entfernt; `http` ist in Production nicht installiert
- Supabase Production nach dem Rollout `ACTIVE_HEALTHY`

Die Referenzdaten wurden aus dem bereits geprüften Development-Bestand übernommen. Die fachlichen Quellen bleiben OurAirports (Public Domain) und GeoNames (CC BY 4.0); es gibt weiterhin keine Live-Abfrage dieser Quellen bei einer Nutzersuche.

Wichtig: **Der Modellweg bleibt in Production deaktiviert. Die Production-Flugsuche bleibt ebenfalls aus. Duffel wird erst separat nach Sandbox-Zugang verifiziert.**

## 3. Produktprinzip, das alle nächsten Phasen leitet

Jetnity soll nicht nur mehr Funktionen anbieten, sondern bessere Reiseentscheidungen treffen.

Die Kernoptimierung ist die **Gesamtreise**, nicht der isoliert billigste Flug oder das billigste Hotel. Jetnity soll Preis, Zeit, Komfort, Lage, Verbindungen, Transfers, Tagesplanung, Folgekosten und Reibung gemeinsam bewerten und verständlich begründen.

Monetarisierung darf die Empfehlung niemals verzerren. Affiliate- oder Vermittlungsprovisionen sind Einnahmequellen, aber Jetnity muss weiterhin die beste Nutzeroption empfehlen, nicht die margenstärkste.

Jetnity soll außerdem reale Änderungen als Kettenereignis verstehen. Beispiel: Wird ein Flug um einen Tag verschoben, analysiert Jetnity die Folgen für Hotelnächte, Aktivitäten, Transfers, Anschlussverbindungen, Budget und Reisezeit und bereitet einen Anpassungsvorschlag vor. Externe Änderungen dürfen niemals still andere Reiseelemente verändern.

Verbindlicher Ablauf:

`Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen`

Die manuelle Grundfunktion kann Teil des kostenlosen Kerns sein; automatische Überwachung, proaktive Warnungen und fortlaufende Reiseoptimierung sind ein starker Kandidat für Jetnity Pro.

## 4. Nächster Entwicklungsschritt

Phase 3.1 ist fachlich und auf Datenbankebene in Production vorbereitet/verifiziert. Vor dem nächsten Produktblock wird PR #19 final auf GitHub freigegeben und nach ausdrücklicher Nutzerfreigabe nach `main` gemergt. Danach folgen Hotels, dann Aktivitäten, dann Transfers. Parallel die Gesamtoptimierung und reaktive Folgenanalyse als Jetnity-DNA erhalten.

Die Duffel-Sandbox-Verifikation wird separat nachgeholt, sobald Testzugang vorliegt; sie blockiert den Merge nicht. Production-Flugsuche bleibt bis zu einer eigenen späteren Freigabe aus.

Kein weiterer Production-Eingriff ohne ausdrückliche Freigabe.

## 5. Phase 3 – echte Reiseprodukte und Monetarisierung

Nicht alle Provider gleichzeitig anbinden. Schrittweise und produktorientiert vorgehen.

### 5.1 Flüge zuerst · Phase 3.1

Erste echte Produktintegration: Flüge.

Umgesetzt:

- reale Verbindungen in die Planung einbeziehen
- Zeit, Stopps, Abflug-/Ankunftszeiten und Preis bewerten
- keine reine Preisrangliste
- Search-Provider und Affiliate-/Booking-Provider getrennt
- Duffel als erster Datenadapter, nicht als strategische Bindung
- provider-unabhängige Airport- und Place-Basis

Später möglich ohne Rewrite von UI, Scoring und Trip-Integration: Skyscanner, Aviasales oder ein anderer Metasuch-Provider.

Nicht in Phase 3.1: eigene Buchung, Production-Aktivierung der Flugsuche, Hotels, Aktivitäten, Transfers.

### 5.2 Hotels danach

Hotels erst integrieren, wenn die Flug-/Reiseproduktbasis stabil ist.

Jetnity soll nicht nur den billigsten Zimmerpreis sehen, sondern vor allem:

- Lage zur tatsächlichen Tagesplanung
- Transferzeit und Transferkosten
- Qualität/Komfort
- Stornierbarkeit und relevante Bedingungen
- Gesamtwirkung auf die Reise

Vor der konkreten Hotelwahl soll Jetnity zuerst bestimmen, **welches Viertel bzw. welche Gegend für genau diese Reise am sinnvollsten ist**. Danach werden wenige passende Hotels empfohlen und der Trade-off aus Preis, Lage, Zeit und Komfort erklärt. Provisionen dürfen dieses Ranking nicht verzerren.

Start pragmatisch mit Affiliate/Deeplink oder einem passenden Anbieter; keine unnötige Buchungsplattform selbst bauen.

### 5.3 Aktivitäten danach

GetYourGuide ist ein Kandidat für Aktivitäten.

Aktivitäten sollen nicht als willkürliche Liste erscheinen, sondern in den vorhandenen Tagesplan passen und Zeit, Lage, Öffnungszeiten, Dauer und Transfers berücksichtigen.

### 5.4 Transfers / Bahn / Bus / Fähre

Danach die Lücken zwischen den Etappen und Aktivitäten mit realen Transferoptionen schließen. Besonders wichtig für Inselreisen, Roadtrips und Multi-City-Reisen.

## 6. Jetnitys eigentlicher Wettbewerbsvorteil

Sobald echte Produktdaten verfügbar sind, muss Jetnity die Reise **gesamtoptimieren**.

Beispiel:

Ein Flug ist CHF 80 billiger, landet aber sehr spät, verursacht einen teuren Transfer und kostet praktisch einen Urlaubstag. Ein etwas teurerer Flug kann für die Gesamtreise klar besser sein.

Jetnity soll deshalb Optionen anhand der gesamten Konsequenzen bewerten:

- Preis
- Reisezeit
- Anzahl und Qualität der Verbindungen
- Ankunfts-/Abflugzeiten
- Komfort
- Lage
- Transferaufwand
- Transferkosten
- verlorene oder gewonnene Urlaubstage
- Passung zum Tagesplan
- Folgekosten
- Stress/Reibung

Die Empfehlung soll die wichtigsten Trade-offs in verständlicher Sprache erklären.

**Keine Provision darf diese Rangfolge manipulieren.**

## 7. Monetarisierungsprinzip

Primärmodell:

- Affiliate
- Vermittlungsprovisionen
- später weitere Partnererlöse, wenn sie zur Nutzerreise passen

Die zentrale Reiseplanung sollte zum Launch nicht hinter einer harten Bezahlschranke verschwinden. Der Nutzer soll den Kernnutzen kennenlernen.

Ein mögliches Premium-Modell kann später Mehrwert bieten, insbesondere:

- automatische Überwachung gespeicherter Reisen
- proaktive Hinweise auf Flug-/Hotel-/Provideränderungen
- automatische Folgenanalyse auf die gesamte Reise
- mehrere optimierte Lösungsvorschläge nach Kosten, Zeit, Komfort und Reibung
- erweiterte Kollaboration, Dokumente und Offline-Funktionen

Die Grenze zwischen Free und Pro wird nicht jetzt hart in einzelne Funktionen eingebaut. Vor der ersten echten Pro-Funktion entsteht eine zentrale Entitlement-/Feature-Access-Schicht; Billing wird später daran angebunden. Details: `docs/MONETARISIERUNG.md`.

Nicht pro einzelne Änderung abrechnen. Jetnity Pro soll einen dauerhaften Begleit- und Schutzwert bieten.

## 8. Danach: Phase 4 – Launch-Reife

Erst wenn Erstellen, Ändern und die wichtigsten Produktintegrationen stabil sind, kommt der vollständige Launch-Pass.

Dazu gehören mindestens:

- Security-Endprüfung
- RLS/Auth/Permissions erneut vollständig prüfen
- DSG/CH-DSG und – bei EU-Zielgruppe – DSGVO sauber abdecken
- rechtliche Texte nur mit ausdrücklicher Freigabe, nicht automatisch erfinden
- Monitoring und Fehlertracking
- Kostenmonitoring und harte Ausgabengrenzen
- Performance und Ladezeiten
- echte iPhone-/Android-Gerätetests zusätzlich zu WebKit/Chromium
- Accessibility
- SEO
- Analytics
- Affiliate-Tracking und Attribution
- Produktionsfreigabe des Modellwegs
- kontrollierte öffentliche Beta

Vor Production-Aktivierung des Modellwegs ist zusätzlich die Aufbewahrungsfrist für `public.model_usage` verbindlich festzulegen.

Die geplante Travel-Readiness-Funktion (Pass/Nationalität, Visa, Transit, Einreiseformulare, Impf-/Gesundheitsvorgaben, Fristen und Checkliste) wird aufgebaut, sobald Reisegraph, reale Orte/Länder, Flugdaten/Transit und die nötigen Profilangaben stabil sind. Details: `docs/TRAVEL_READINESS.md`.

Gemeinsame Reiseplanung für Paare, Familien und Gruppen wird nach stabiler Phase-3-Kernbasis, aber vor Phase 4/Launch, als Kollaborationsfundament eingeführt. GitHub Issue #20 hält Rollen, Einladungen, RLS, Versions-/Konfliktstrategie und Realtime-Vorbereitung fest.

## 9. Architektur- und Qualitätsregeln für alle nächsten Arbeiten

- Cursor setzt große Implementierungsaufträge um; ChatGPT steuert mit Produkt, Architektur, Security, Kosten und Review.
- Größere Aufgabe: analysieren → entscheiden → implementieren → relevante Tests → Build/CI → Dokumentation → PR.
- Ursachen beheben, nicht Symptome verstecken.
- Keine Demos oder Wegwerfarchitektur als Produktionsbasis.
- Keine neuen wiederkehrenden Kosten oder materiell neue Architektur-/Produkt-/Businessentscheidungen ohne ausdrückliche Freigabe.
- Kostenrahmen Infrastruktur: maximal USD 100/Monat; darüber vorher fragen.
- Dev/Test und Preview dürfen autonom genutzt werden; Production bleibt kontrolliert.
- Keine destruktiven Production-Datenaktionen, riskanten direkten Production-DB-Eingriffe, DNS-/Domainänderungen oder neue Production-Secrets ohne ausdrückliche Freigabe.
- Keine Secrets in Chat, Logs, Screenshots oder Commits.
- Relevante DB-Migrationen zuerst Development; Production nur über getesteten, dokumentierten Weg.
- Security/RLS/Auth/Tests/Mobile/Accessibility/Performance/Loading/Error States/Permissions/Kostenkontrollen nicht aus Spargründen überspringen.
- Starke Modelle dort einsetzen, wo sie messbar mehr Qualität bringen; effiziente Modelle für Routinearbeit. Qualität pro Token optimieren, nicht blind Kosten minimieren.

## 10. Offene Punkte nach Phase 3.1

Diese Punkte blockieren den Phase-3.1-Merge nicht, müssen aber im Projektgedächtnis bleiben:

- `public.model_usage`: Aufbewahrungsfrist noch offen; vor Production-Freigabe des Modellwegs entscheiden.
- Reload während einer noch nicht übernommenen Vorschau verwirft sie bewusst nach ADR-0050.
- Der Router arbeitet mit Mustern und kann ungewöhnliche Formulierungen falsch einordnen; manueller Modell-Stift bleibt möglich.
- Preview-Tests sind keine Lasttests.
- Production-Modellaktivierung bleibt eine eigene Freigabe.
- Production-Flugsuche bleibt eine eigene Freigabe. Duffel-Sandbox-Verifikation ist nachgelagert und kein Merge-Blocker.
- Duffel-Angebots-IDs sind kurzlebig; die Reise speichert eine Momentaufnahme, keinen live buchbaren Offer.
- Das In-Memory-Rate-Limit gilt je Serverless-Instanz und muss vor Production-Aktivierung der Flugsuche durch eine geeignete globale Schranke ersetzt/ergänzt werden.
- Duffel Self-Service / Test deckt nicht den gesamten Markt; die UI darf das nicht als „bester Preis im Internet“ verkaufen.
- GeoNames-Anzeigenamen können vom im Deutschen gebräuchlichen Namen abweichen (z. B. Südtirol); Such-Keywords funktionieren, Anzeige-Lokalisierung/Aliase kommen später.
- Gleichnamige Orte bleiben absichtlich disambiguiert; bei Mehrdeutigkeit darf Jetnity nicht raten.
- Die neuen optionalen FKs `trips.origin_place_id` und `trip_stages.place_id` haben laut Supabase Performance Advisor noch keine eigenen Covering-Indizes. Das ist bei aktuellem Bestand kein Release-Blocker und wird in einem späteren Performance-Pass geprüft.
- Formularfehler unter `/planen`, auf der Startseite (Ortssuche) und in den Auth-Formularen sitzen am Feld. Workspace „Punkt hinzufügen“ und `/auth/update-password` können beim späteren UI-/Launch-Pass dieselbe Feldhülle erhalten.
- In Supabase Production existiert ein historischer Cron-Job, der stündlich `public.sync_creator_profile_core()` aufruft, obwohl die Funktion nach der Legacy-Bereinigung nicht mehr existiert. Das erzeugt nur Logfehler, gehört nicht zu Phase 3.1 und muss in einem eigenen, ausdrücklich freigegebenen Production-Cleanup entfernt werden.

## 11. Sofortiger Startpunkt im nächsten Chat

Phase 3.1 ist fachlich abgeschlossen und der Production-Datenbankrollout ist grün. PR #19 bleibt bis zur finalen GitHub-Freigabe Draft. Als nächstes: finalen PR-Stand prüfen, `Mark Ready` nur nach Nutzerfreigabe, danach Merge zu `main` ebenfalls nur nach ausdrücklicher Nutzerfreigabe und anschließend Vercel Production verifizieren.

**Duffel-Sandbox ist nachgelagerte Provider-Verifikation.** Sie blockiert Phase 3.1 und den Merge nicht. Production bleibt `JETNITY_FLIGHT_AKTIV` aus; kein Duffel-Token in Production.

Hotels, Aktivitäten und Transfers nicht beginnen, bevor PR #19 sauber abgeschlossen und Production nach dem GitHub-Merge verifiziert ist.

Benötigte Preview-Credentials nur für die spätere Duffel-Verifikation (nicht Production):

- `JETNITY_FLIGHT_AKTIV=true`
- `DUFFEL_ACCESS_TOKEN` mit Präfix `duffel_test_`

Niemals `NEXT_PUBLIC_*`, niemals Live-Token, niemals Production ohne Freigabe.