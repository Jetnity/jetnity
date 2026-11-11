# Stay22 mit dem Reiseplan verbinden — 11.11.2026

## Auftrag und Ausgangspunkt

Owner-Auftrag: bestätigte Vorschläge für Etappenwahl, Suche nahe Reiseorten, gemeinsame Kartenmarkierungen, sichtbare Filter und bessere Karten-/Listenbedienung professionell umsetzen. Bestehende lokale Vorschau auf `feat/stay22-hotelsuche`, Ausgangspunkt `e5280c3`; isolierter Worktree. Kein Eingriff in parallele M04-/CI-Arbeit. Anbieter-API weiterhin geschlossen, keine synthetischen Hotelangebote.

## Umsetzungsplan

- `Hotelsuche`, `Stay22Ergebnisse` und begrenzte Stay22-URL-Erzeugung erweitern: schnelle Etappenwahl, Suchentwürfe je Etappe während der geöffneten Ansicht, überprüfte Filter, Karten-/Listenansicht und vergrösserte Anzeige.
- Fachlicher Kontext in eigenem reinen Modul: vorhandene Etappenkoordinaten und strukturierte Ortsreferenzen aus zugeordneten Planpunkten. Freie Titel/Notizen sind keine geografische Quelle. Nur nahe Etappen werden als zusätzliche Kartenanker verwendet; unbekannte Positionen bleiben unbekannt.
- Reiseplan-Handoff über geprüfte, navigationsbezogene Ortsreferenz und Etappe; Stay22 erhält keine interne Reise-/Punkt-ID. Bestehende Kontextnavigation zu Aktivitäten/Verbindungen bleibt erhalten. Vor-/Zurück und gelöschte Referenzen prüfen.
- Keine Reiseänderung durch eine Suche. Keine Migration, neue API, Abhängigkeit oder bezahlte Infrastruktur. Bestehende Ortsauflösung für kanonische Ortsreferenzen; manuelle Umgebungssuche als expliziter Suchtext an Stay22, niemals als bestätigter Ort gespeichert.
- POIs auf dem Anbieterrahmen nur mit bekannten Koordinaten, begrenzter Anzahl und öffentlichen/generischen Labels; keine Notizen, Buchungsdaten oder Rücklinks mit Reise-IDs. Nur nach ausdrücklichem Suchstart und unter bestehendem CMP-Vertrag.
- Preisfilter erst aktivieren, wenn Einheit und Währung praktisch belegt sind. Keine Bestpreis-/Sortierbehauptung und keine unbestätigten Provider-Overrides.
- Tests: Kontext-/URL-Vertrag, Fremd-/gelöschte Referenzen, Stale-Entfernung, Entwurfswechsel, unveränderter Reisegraph, Tastatur/Vergrösserung, echte Klickbarkeit mobil, reale Anbieteranzeige getrennt von kontrollierten Tests. Danach TypeScript, Lint, Hygiene, Production-Build und unabhängige Prüfung.

## Status

Umsetzung lokal fertig und Production-Build erfolgreich. Keine Veröffentlichung aus diesem Dokument ableiten. Physischer iPhone-Test sowie Stay22-Verifikation/Auszahlungsdaten bleiben offene externe Punkte des bisherigen Standes.

## Umgesetzt

- Schnelle Etappenleiste mit dem tatsächlichen Aufenthaltszeitraum. Pro Etappe bleiben Suchdatum, Gäste/Zimmer, Währung, Mindeststerne, Mindestbewertung und Suchumgebung während der geöffneten Unterkunftsansicht erhalten. „Reisedaten übernehmen“ setzt abweichende Suchtermine auf den Plan zurück. Andere Städte bleiben über die bestätigte bestehende Ortssuche erreichbar.
- In der Etappenübersicht führen Unterkünfte sowie „Unterkunft nahe einem Reiseort“ in denselben Unterkunftsreiter. Kategorie, Etappe und optionale Ortsreferenz überstehen URL-/History-Navigation; gelöschte, fremde oder ungeeignete Referenzen werden verworfen.
- Ortsnähe: bekannte Nachbarstopps bis 50 km; kanonische Ortsreferenzen aus zugeordneten Flügen/Transfers/Mietwagen; zusätzlich ausdrücklich eingegebene Adressen/Sehenswürdigkeiten. Nicht jeder Planpunkt besitzt eine Position. Keine automatische Auflösung freier Titel, keine behaupteten Gehzeiten oder Routen.
- Optional höchstens acht Kartenorte. Bekannte Koordinaten bleiben die Quelle. Kein Transfer von privaten IDs, Notizen, Buchungsreferenzen oder gespeicherten Gesamtbudgets. Manuelle Stopps erhalten generische Kartenlabels. Auflösungsantworten nach Wechsel/Unmount sind wirkungslos; nur bestätigte freie Ortsauswahl wird im Suchentwurf aufbewahrt.
- Karten-/Listensteuerung, mobile Startansicht Liste, Vergrösserung als nativer Dialog mit Fokus-Rückgabe und Escape. Der Rahmen bleibt beim Vergrössern erhalten. Ein Ansichtswechsel ist ausdrücklich ein Neuladen mit den oben gewählten Suchbedingungen; interne zusätzliche Anbieterfilter werden nicht als synchronisiert ausgegeben. Preis-Badge bezeichnet die Startansicht.
- Die Kartenhöhe berücksichtigt die festen Navigationsleisten auch bei 320 × 568 Pixeln. Der schwebende Zurück-nach-oben-Knopf wird während der Hotelsuche ausgeblendet, damit er keine Filter verdeckt. Die Stay22-Datenschutzhinweise beschreiben zusätzlich Suchumgebung, Filter und optionale Kartenorte.
- Budget und Unterkunftsart verbleiben im originalen Filter. Öffentliche Stay22-Implementierung am 11.11.2026 geprüft: `Data.min/max` sind USD pro Nacht, werden über Nächte und `currency.rate` in die Anzeige umgerechnet. Keine fehlerhafte direkte CHF-Übergabe. Dokumentierte Parameter: https://dev.stay22.com/docs/maps/parameters.

## Nachweise und Review

- 25/25 gezielte Tests für Stay22-URL-/Datenschutzvertrag, fehlende/fremde/gelöschte Reiseorte, geografische Grenze/Datumsgrenze, begrenzte POIs, Ansichtswechsel und Workspace-Navigation erfolgreich.
- Erweiterter `scripts/stay22-browser.mjs`: Desktop Chromium, Mobile Chromium, iPhone WebKit und Small mobile Chromium (320 × 568) erfolgreich. Prüft Etappenentwürfe, A → B → Etappenkarte A, Startdaten, echte Klickpositionen der Rahmenkontrollen, gleiches iframe beim Vergrössern und Schliessen, Fokus-Rückgabe, dokumentierte Filter-/POI-Parameter, Ortssuchtext ohne erfundene Koordinaten, Handoff aus der echten Etappenoberfläche und Browser zurück/vor, Ablehnung/Widerruf und unveränderten lokalen Reisegraphen. Der erste 320-Pixel-Lauf fand eine überdeckte untere Kartenbedienung; Mindesthöhe wurde korrigiert und dieser vollständige Browserlauf danach erfolgreich wiederholt.
- Im Desktoplauf zusätzlich kontrollierte verzögerte Antwort der vorhandenen Ortsbestätigung: Wechsel während der Anfrage, unbestätigter Entwurf bleibt leer, anschliessende erfolgreiche Bestätigung und gemerkter bestätigter Ort. Das ist ein UI-/Protokolltest; kein neuer Test der produktiven Ortsdatenbank. Der Anbieterrahmen dieser automatisierten Tests enthält ausdrücklich keine Hotel-Testangebote.
- Reale, getrennte Chrome-Prüfung im lokalen Vorschautab: Ko Chang mit mindestens vier Sternen zeigt originale Fotos, 4/5- und 5/5-Kategorien, CHF-Summen für sechs Nächte; vergrösserte Originalanzeige; Bangkok in Kartenansicht mit Anbieterpreisen und grünem Ortsmarker. Stay22 verarbeitet die übergebene POI-Liste als `hasPOIs=true`; keine Ergebnisdaten in Jetnity gespeichert. Keine Buchung ausgelöst. Die frühere reale Buchungsweiterleitung ist im Baseline-Nachweis dokumentiert.
- Unabhängiger read-only Reviewer `stay22_codeanalyse`: 25 Tests selbst ausgeführt; zwei P2-Befunde (abgebrochene Ortsbestätigung und wiederholte externe Etappenwahl) gefunden, behoben und erneut gelesen. Keine weiteren belegbaren P1/P2 im geprüften Umfang. Preis-Badge danach als „Startansicht“ präzisiert.
- Vollständiger Lint: 0 Fehler, 195 bestehende Warnungen. Gezielter Lint der finalen Änderung ohne Fehler/Warnungen. Alle fünf Hygieneprüfungen bestanden. TypeScript und abschliessender Production-Build erfolgreich.

## Grenzen und Betriebsstand

Keine neuen Bibliotheken, bezahlten Dienste, Migrationen, RLS-/Auth-Änderungen oder Support-Nachrichten. Die API-Freigabe ist nicht erweitert worden. Kein garantierter billigster Anbieter für dasselbe Zimmer und dieselben Bedingungen. Anbieter-intern veränderte Filter, gespeicherte Favoriten oder abgeschlossene Buchungen werden nicht aus dem fremden Rahmen ausgelesen oder automatisch im Reiseplan bestätigt.

Die produktive Darstellung auf einem physischen iPhone, die Verarbeitung von Kinderaltern/Mehrzimmerbelegung beim Buchungsanbieter sowie Stay22-E-Mail-Verifikation und Auszahlungsdaten bleiben gesonderte offene Punkte. Keine Veröffentlichung auf jetnity.com. Testbare lokale Vorschau: http://127.0.0.1:3972/vorschau.

## Owner-Feinschliff der Darstellung — 11.11.2026, 02:49

Nach ausdrücklicher Bestätigung der Screenshots wurden das zusätzliche „Mit Stay22“-Schild, die erklärenden Absätze unter Suchformular und Ergebnissen, die zusätzliche Ergebnisüberschrift mit Budgeterklärung, die Beschreibung der Reisemarker/des Ansichtswechsels sowie „Anzeige leer oder unvollständig?“ entfernt. Karten-/Listenwahl, Preis-Startansicht und Vergrösserung stehen in einer kompakten Bedienleiste. Erneutes Laden und separates Öffnen bleiben erreichbar. Fehler- und Datenschutzeinstellungen funktionieren unverändert; die ausführlichen Informationen zu Stay22 stehen weiterhin auf `/privacy`.

Der grün hinterlegte „Unterstützt von Stay22“-Hinweis wird mit dem offiziell dokumentierten Parameter `hidebrandlogo=true` ausgeblendet: https://dev.stay22.com/docs/maps/parameters (UI Toggles, am 11.11.2026 geprüft). Keine Überlagerung oder CSS-Manipulation des fremden Inhalts; Kartenattribution bleibt sichtbar. In der realen Chrome-Vorschau geprüft: originale Ergebnisse vorhanden, auffälliger Markenbalken verschwunden. Keine Änderung am Partnertracking oder an den Suchdaten.

Prüfung: 7 bestehende Stay22-Vertragstests erfolgreich, gezielter ESLint ohne Befunde, Exportprüfung erfolgreich und Production-Build erfolgreich. Vorhandene vollständige Browserabläufe Desktop Chromium und Small mobile Chromium (320 × 568) erneut erfolgreich, einschliesslich echter Klickpositionen, Vergrösserung/Fokus, Reiseplanübergabe und Datenschutz-Ablehnung. Weiterhin nur lokale Vorschau; keine Veröffentlichung.
