# Travelpayouts-Flugsuche – Vorschauauftrag vom 11.11.2026

## Auftrag und Ziel
Der Owner möchte eine professionelle, echte Flugsuche im vorhandenen Jetnity-Flugreiter, mit Ergebnissen auf Jetnity und sichtbarer Chrome-Vorschau. Der ursprüngliche Auftrag war eine private Vorschau; am 11.11.2026 hat der Owner die Veröffentlichung nach Prüfung der Sortierung ausdrücklich freigegeben. Eigener Worktree und Branch ab main 1254a8d; die M04-Arbeit anderer Chats bleibt unberührt.

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
Echte Flugangebote im bestehenden Flüge-Reiter in Chrome und auf dem getrennten HTTPS-Widget-Host nachgewiesen. Veröffentlichung vom Owner freigegeben; PR-, Preview- und Production-Nachweise werden im Release-Abschnitt geführt. Ohne den neuen öffentlichen Origin-Schalter bleibt der Booking-Handoff erhalten.

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

Getrennte Hosting-Konfiguration und offene Providergrenzen: [Widget-README](../widgets/travelpayouts/README.md). Offener Anbieterprüfpunkt bleibt die anbieterseitig fest gesetzte `citizenship: RU` trotz Schweizer Markt; die Wirkung auf Tarife ist nicht nachgewiesen. Dies ist kein aus Jetnity übermittelter Pass-/Kontowert. Die Vorschau behauptet keine eigenständige Flight Search API, Buchungsbestätigung oder automatische Rückübernahme eines Tickets in den Plan.


## Abschliessende Prüfung des finalen Stands

25 gezielte Tests bestanden, Typecheck und Production-Build erfolgreich. ESLint ohne Fehler; bestehende Repository-Warnungen bleiben ausserhalb dieser Änderung. Repository-Prüfungen für tote Dateien, Exporte, Abhängigkeiten, API-Schutz und Schemabezug bestanden; bestehende lokale Schemahinweise unverändert. `git diff --check` sauber.

Am finalen Build erneut echte Desktop- und Mobilangebote geladen: Wien liefert Vienna International Airport VIE; eine identische erneute Suche erstellt einen neuen Rahmen. Vergrössern/Verkleinern und Escape erhalten dasselbe iframe, sperren/entsperren das Hintergrundscrollen und bleiben in Jetnity. Mobil 390 px ohne horizontalen Überlauf, vergrösserter Dialog passt in den verfügbaren Bildschirm. Screenshots liegen ausserhalb des Repositorys unter `work/travelpayouts-preview-final/`.


## Textbereinigung nach Owner-Rückmeldung — 11.11.2026

Die drei ausdrücklich markierten Zusatztexte aus Suchmaske und Ergebnisfuss entfernt, einschliesslich nicht mehr verwendeter Stile und Icon-Import. Anbieterrahmen, Suchparameter und bestehende Einwilligungssteuerung unverändert. Chrome-Nachweis: alle drei Texte fehlen, echte Angebote laden, Dialog-Vergrösserung funktioniert. Build, Typecheck und gezielter ESLint erfolgreich. Lokale Vorschau, kein öffentlicher Rollout.

Präzisierung zum Anbieterfeld: In den beobachteten Suchanfragen stehen gleichzeitig `citizenship: RU`, `market_code: CH`, CHF und Deutsch. Der Wert stammt aus dem Anbieter-Widget und nicht aus Jetnity-Reisendenprofilen. Auswirkungen auf Tarife oder Anbieter sind nicht nachgewiesen; dies ist ein offener Prüfpunkt, keine belegte Fehlfunktion.

## Suchkalender und verankerte Auswahllisten — 11.11.2026

Owner-Rückmeldung: native Datumsauswahl zu klein, Reiseart und Reiseklasse öffnen in Chrome versetzt. Gemeinsame Komponenten unter `components/trips/organisieren/auswahl/` ersetzen die nativen Kalender in Hotel-, Travelpayouts- und Booking-Flugsuche. Zwei Monate am Desktop, ein Monat als mobiler Dialog, markierter Zeitraum, explizites Übernehmen/Abbrechen, Escape und Tastatursteuerung. Die Menüs für Reiseart und Reiseklasse verwenden die bereits vorhandene Radix-Abhängigkeit, verankern sich am Auslöser und berücksichtigen Bildschirmränder.

Die Kalendergrenzen folgen den Suchregeln: Hotels mindestens eine Nacht, maximal 90 Nächte und 730 Tage Suchhorizont; Flüge Rückreise auch am selben Tag, einfacher Flug ohne Rückreisedatum und 330 Tage Suchhorizont. Datenarithmetik verwendet UTC-Kalendertage. Suchänderungen bleiben transient und ändern keine Etappe, gespeicherte Reise oder Buchung. Keine Preisfarben ohne echte Kalenderpreisdaten.

Geprüft am Production-Build in Chrome:

- Desktop 1440 × 1000, kleiner Desktop 1024 × 768 und 720 × 600: Kalender bleibt im Bildschirm, Auswahllisten öffnen am jeweiligen Feld. Reiseartwechsel blendet Rückflug passend aus/ein; Reiseklasse per Maus und Tastatur auswählbar.
- Mobile Chrome-Emulation 390 × 844: Kalender als untere Ansicht, Monatswechsel und Auswahl funktionieren, kein horizontaler Überlauf. Kein physischer iPhone-Test behauptet.
- Übernehmen ändert beide Suchdaten; Abbrechen und Escape verwerfen den Entwurf und stellen den Fokus wieder her. Pfeiltasten bewegen den Tag. Hotel-Abreise am Anreisetag ist deaktiviert; eine Nacht ist auswählbar.
- Echte Flugsuche übergibt ZRH–BKK am 16.11.2026 und HKT–ZRH am 07.12.2026; Originalangebote erscheinen. Hotelrahmen übernimmt die geprüfte Anreise 15.11.2026 und Abreise 16.11.2026. Der gespeicherte Reiseentwurf bleibt bytegleich.
- 20 gezielte Tests erfolgreich, darunter fünf neue Kalenderfälle für Schaltjahr, Jahreswechsel, Sommerzeit, Grenzen und ungültige Daten. Typecheck, gezielter ESLint, Production-Build und alle fünf Hygieneprüfungen erfolgreich. Bestehende Hinweise zu lokalen, nicht angewendeten RPCs unverändert. Keine neuen Abhängigkeiten, Kosten, Datenbank- oder Berechtigungsänderungen.

Bildnachweise der Vorschau ausserhalb des Repositorys: `work/travelpayouts-calendar-final/`. Weiterhin lokale Vorschau; kein Push, Merge oder öffentlicher Rollout. Die oben dokumentierte anbieterseitige RU-Frage bleibt vor Veröffentlichung offen.


## Freigegebene Veröffentlichung und Sortierung — 11.11.2026

Der Owner hat die Veröffentlichung ausdrücklich beauftragt und zusätzlich die Sortierung wie bei Skyscanner angefragt. Im unveränderten offiziellen Widget wurden mit echten ZRH–BKK/BKK–ZRH-Angeboten geprüft:

- „Empfohlen zuerst“ ist die Voreinstellung.
- „Am günstigsten zuerst“ stellt die günstigeren Angebote vor die teureren; die tatsächliche Reihenfolge wurde nach Auswahl abgelesen.
- „Reisedauer“ stellt die kürzeren Verbindungen vor die längeren. „Am schnellsten“ und „kürzeste Reisedauer“ sind hierfür dieselbe Auswahl.
- Weitere Originaloptionen: Abflugzeit, Ankunftszeit, Zwischenstopp-Dauer und Bewertung. Keine selbst erfundenen Skyscanner-Kacheln oder Rankings.

Der separate statische Vercel-Host `jetnity-flight-widget` (Projekt `prj_SrFRWKBWs8rzO5VrHVxhXKicQAqr`) ist unter `https://jetnity-flight-widget.vercel.app` erreichbar. Echte Ergebnisse laden über HTTPS; keine neuen Zugangsdaten oder Datenbankänderungen. Die Jetnity-App wird erst durch die öffentliche Origin-Konfiguration und ihren Neubau aktiviert. Bestehende Infrastruktur, kein zusätzliches bezahltes Produkt; übliche Hosting-Nutzung bleibt bestehen.

Die RU-Frage bleibt offen und ist nicht als behoben dargestellt. Der dokumentierte Test hat korrekte Route, Daten, Personen, Reiseklasse, deutschen Markttext und CHF-Angebote nachgewiesen; es wird keine Tarifgleichheit für alle Staatsangehörigkeiten behauptet.

## Release-Prüfung und CSS-Korrektur — 11.11.2026

PR #1187 ist zur Veröffentlichung freigegeben. Die geschützte Vercel-App-Vorschau mit getrenntem HTTPS-Widget zeigte echte Gabelflugangebote ZRH–BKK/HKT–ZRH und funktionierende Preis-/Dauersortierung. Suchkalender und am Feld verankerte Reiseartauswahl ebenfalls geprüft; der gespeicherte Gastentwurf blieb bytegleich. Production ist noch nicht umgestellt.

Gesamt-CI 43024295820 auf `87cf42e` scheiterte an zwei Ursachen: neue CSS-Imports direkt in Client-Komponenten brachen fünf bestehende Node/Workspace-Testdateien; separat überschritt der bestehende M04-Nativtest sein 240-Sekunden-Budget. Letzteres ist auch in Main-CI 42955908361 auf `1254a8d` vorhanden. Diese Ursachen werden nicht miteinander vermischt.

Die neuen Kalender-/Auswahl- und Flugstile werden jetzt wie die übrigen Reisebereich-Stile im vorhandenen `app/(public)/reisen/[tripId]/layout.tsx` geladen. Keine Testausnahmen oder CSS-Mocks hinzugefügt. Alle 97 Tests der fünf zuvor betroffenen Workspace-Testdateien bestehen. Die unabhängige M04-Recovery bleibt unverändert; erforderliche Prüfungen werden weder umgangen noch abgeschwächt.

Nach der Korrektur bestehen Production-Build, Typecheck, gezielter ESLint, Diff-Check und alle fünf Hygieneprüfungen. Der neu gebaute Kalender wurde in sichtbarem Chrome erneut geöffnet: Gestaltung wird über das Layout geladen, weisser Dialog mit 760 px Desktopbreite und fester Bildschirmposition. Keine Abhängigkeiten oder Testbedingungen geändert.
