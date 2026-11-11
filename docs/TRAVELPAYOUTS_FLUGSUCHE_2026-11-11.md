# Travelpayouts-Flugsuche – Vorschauauftrag vom 11.11.2026

## Auftrag und Ziel
Der Owner möchte eine professionelle, echte Flugsuche im vorhandenen Jetnity-Flugreiter, mit Ergebnissen auf Jetnity und sichtbarer Chrome-Vorschau. Dieser Auftrag veröffentlicht die neue Funktion nicht in Production. Eigener Worktree und Branch ab main 1254a8d; die M04-Arbeit anderer Chats bleibt unberührt.

## Umsetzungsplan
- Offizielles White Label Web vom Typ Widget im Jetnity-Travelpayouts-Konto konfigurieren: Deutsch, CHF, Jetnity-Farben. Hotel-Popunder und Referral-Werbung ausschalten. Nur öffentliche Widget-ID; keine Search API und kein API-Token.
- Bestehende `components/trips/organisieren/Flugsuche.tsx` und eng begrenzte Provider-Dateien unter `lib/providers/travelpayouts/` verwenden. Native Suchvorbereitung liest bestätigte Flughafenreferenzen, Reisetermine und Reisendenanzahl. Hin-/Rückflug und Gabelflug werden gegen die tatsächliche Anbieteranzeige geprüft.
- Ergebnisse bleiben im unveränderten offiziellen Widget; keine gecachten Data-API-Preise als Live-Angebote, kein Ergebnis-Scraping, keine erfundenen Ticketkarten. Ein isoliertes Einbettungsdokument soll fremdes JavaScript vom Reisegraphen und angemeldeten Konto trennen. Fehler, Laden und leere echte Suche sind verschiedene Zustände.
- Keine Datenbank-/RLS-/Auth-/Schemaänderungen; kein automatischer Buchungsstatus durch einen Such- oder Buchungsklick. Kein neues kostenpflichtiges Produkt und keine Abhängigkeit. Kein privater Reiseinhalt oder Budget an Travelpayouts.
- Öffentliche Einbettung: strenge Parameterprüfung, kontrollierte Scriptquelle, Frame-Sandbox, CMP-Ablehnung/Widerruf beachten. Provider-Redirect erst bei bewusster Angebotsauswahl. Keine ungeprüften Links aus Eingaben.
- Prüfungen: Datum/Jahr, Route, Belegung, Parameter, Origin-/Nachrichtengrenze, Ablehnung/Widerruf, unveränderter Reisegraph; reale Desktop-/mobile Browseranzeige; TypeScript, Lint, Production-Build und fünf Hygieneprüfungen. Physische iPhone-Abnahme bleibt separat.

## Verifizierte Grundlage
- https://support.travelpayouts.com/hc/en-us/articles/26857907357458-Setting-up-a-White-Label-with-Widget-type
- https://support.travelpayouts.com/hc/en-us/articles/115003710648-Links-to-the-White-Label-with-a-completed-search-form
- Eigenes Widget im Konto angelegt und gelesen: 24468; Marker 804084, Website https://jetnity.com/reisen, Projekt Jetnity, Deutsch/CHF. Jetnity-Grün, Hotel-Popunder und Referral-Werbung ausgeschaltet. Keine API-Schlüssel erzeugt.

## Status
Echte Flugangebote im bestehenden Flüge-Reiter in der lokalen Chrome-Vorschau nachgewiesen. Keine Produktionsveröffentlichung. Production bleibt ohne den neuen öffentlichen Origin-Schalter beim bestehenden Booking-Handoff.

## Umsetzung

- Native Jetnity-Suche mit Flughafen-Autocomplete, Hin-/Rückflug, einfachem Flug, Gabelflug, Economy/Business und getrennten Erwachsenen-/Kinder-/Babyzahlen. Relevante Änderungen des Reisegraphen verwerfen den transienten Suchzustand; Suche und Anbieterwahl ändern keine Reise oder Buchungsbestätigung.
- Hinflug aus Herkunft und erster Etappe, Rückflug bei Gabelflug aus der letzten Etappe. Daten aus der Reise, vollständige Validierung, explizites Suchen. Erneutes Suchen mit identischen Eingaben startet ebenfalls einen neuen Rahmen. Änderungen am Formular kennzeichnen noch angezeigte ältere Ergebnisse.
- Offizielle Ergebnisse mit Preisen, Zeiten, Gepäck, Umstiegen, Filtern, Sortierung, Flugdetails und mehreren Buchungsanbietern. Native Vergrösserung im Dialog bewahrt denselben Rahmen. Bestehender Booking-Fallback in einer separaten Komponente unverändert erhalten.
- Während des mobilen Tests gefundene Suchschwäche korrigiert: deutsche Stadtnamen wie Wien/München/Genf werden vor dem bestehenden Katalogabruf übersetzt. Keine automatisch erfundenen Flughafenreferenzen; die Nutzerauswahl bleibt erforderlich.
- Eigenständiges Widget-Dokument mit separatem Ursprung unter `widgets/travelpayouts/`. Keine neue Abhängigkeit, Datenbankänderung oder zusätzlich angelegte bezahlte Infrastruktur.

## Tatsächliche Browsernachweise

- Desktop Chrome, 1440 × 1000: Zürich ZRH → Bangkok BKK am 15.11.2026 und Phuket HKT → Zürich ZRH am 06.12.2026, 2 Erwachsene, Economy. Im echten Provider-Request genau diese zwei Richtungen, Daten und Belegung, Währung CHF und eigener Marker 804084 bestätigt. Echte verfügbare Angebote mit Flugzeiten und mehreren Airlines sichtbar.
- Mobile Chrome-Emulation, 390 × 844: echte Suche ZRH → VIE am 15.11.2026 mit 2 Erwachsenen, 1 Kind, 1 Baby und Business; Provider-Request entspricht exakt diesen Angaben. Originalangebote und mobile Filter vorhanden. Kein horizontaler Seitenüberlauf. Keine Behauptung eines physischen iPhone-Tests.
- Angebotsdetails geöffnet; „Buchen“ im offiziellen Widget öffnete `ch.gotogate.com` in einem neuen Tab. Jetnity blieb geöffnet. Keine Buchung ausgelöst; gespeicherter Reiseentwurf blieb bytegleich.
- Direktflugfilter änderte die Ergebnisliste; der Anbieter zeigte wegen fehlender exakter Gabelflugtreffer ausdrücklich gelockerte Alternativen. Das ist Providerverhalten, keine Jetnity-Direktfluggarantie.
- Während aktiver Ergebnisse explizite CMP-Ablehnung simuliert: iframe entfernt, Datenschutzhinweis. Anschliessend verschwundener CMP blieb auch nach erneutem Laden blockierend.
- Bootstrap-Readiness wird nicht als abgeschlossene Suche ausgegeben. Anbieterinhalt wird nicht in Jetnity kopiert oder als eigene Angebotsdaten gespeichert.

## Vorschau und technische Übergabe

Lokale Vorschau: `http://127.0.0.1:3982/vorschau` (Next Production-Build auf 3980, unabhängiger Widget-Host 3990). Der lokale Vorschau-Wrapper erstellt nur einen eigenen Browser-Entwurf und überschreibt keine andere Reise. Die Flughafensuche nutzt dort den öffentlichen bestehenden Jetnity-Katalog. Keine angemeldete Production-Reise bearbeitet.

Getrennte Hosting-Konfiguration und offene Providergrenzen: [Widget-README](../widgets/travelpayouts/README.md). Vor einem späteren Rollout insbesondere die anbieterseitig fest gesetzte `citizenship: RU` trotz Schweizer Markt klären. Dies ist kein aus Jetnity übermittelter Pass-/Kontowert. Die Vorschau behauptet keine eigenständige Flight Search API, Buchungsbestätigung oder automatische Rückübernahme eines Tickets in den Plan.


## Abschliessende Prüfung des finalen Stands

25 gezielte Tests bestanden, Typecheck und Production-Build erfolgreich. ESLint ohne Fehler; bestehende Repository-Warnungen bleiben ausserhalb dieser Änderung. Repository-Prüfungen für tote Dateien, Exporte, Abhängigkeiten, API-Schutz und Schemabezug bestanden; bestehende lokale Schemahinweise unverändert. `git diff --check` sauber.

Am finalen Build erneut echte Desktop- und Mobilangebote geladen: Wien liefert Vienna International Airport VIE; eine identische erneute Suche erstellt einen neuen Rahmen. Vergrössern/Verkleinern und Escape erhalten dasselbe iframe, sperren/entsperren das Hintergrundscrollen und bleiben in Jetnity. Mobil 390 px ohne horizontalen Überlauf, vergrösserter Dialog passt in den verfügbaren Bildschirm. Screenshots liegen ausserhalb des Repositorys unter `work/travelpayouts-preview-final/`.
