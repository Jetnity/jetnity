# Trip.com Suchlinks 1 — Umsetzung und Nachweise

Stand: 2026-11-01, Europe/Zurich. Basis: main `628b95ddcffc90261cb3bb3d121eafd9e3ce91ea`.

## Auftrag und Abgrenzung

Der Product Owner hat Umsetzung und reguläre Veröffentlichung beauftragt und am 2026-11-01 ausdrücklich „Offizielle Suchmöglichkeit als ersten Schritt“ gewählt. Ziele und Daten müssen dabei beim Anbieter erneut eingegeben werden. Die im Chat angekündigte erste Variante öffnet die offizielle Suche in einem neuen Tab. Keine automatische Angebotssuche, kein eingebettetes Suchwidget, keine API-Freischaltung und kein Buchungsnachweis.

## Plan vor Codeänderung

- Ziel: einen verlässlichen Trip.com-Einstieg unter Organisieren → Unterkünfte bzw. Flüge anbieten, mit vorhandenem Reisekontext als lokaler Eingabehilfe.
- Dateien: `components/trips/TripComSuche.tsx`, Einhängung in `TripWorkspace.tsx`, öffentliche feste Linkkonstanten und Kontext unter `lib/providers/tripcom/`, zugehörige Tests. Architektur, Roadmap und Entscheidung ergänzen.
- Reisegraph: nur lesen. Aufenthalte bleiben nach Etappen-ID getrennt, auch bei wiederholtem Ziel; vorhandene Hotelzeitraum-Ableitung wiederverwenden. Fehlende Daten bleiben offen. Keine automatische Umwandlung einer Route in Flugsegmente.
- DB, Auth, API, Provider-Schlüssel, Umgebungsvariablen und bestehende Such-/Buchungslogik: keine Änderung. Kein neuer laufender Dienst oder Provider-API-Aufruf.
- Security/Datenschutz: native externe Links mit `noopener noreferrer sponsored`, keine URL aus Nutzereingaben, keine Reisekennung/Personendaten im Link. Keine Trip.com-Scripts, Frames, Bilder, Prefetch oder Tracking auf Jetnity. Anbieter verarbeitet Daten erst nach bewusster Navigation. Bestehende CMP- und Provider-HOLDs bleiben unberührt.
- Risiken: allgemeine Suche statt vorausgefüllter Suche; nachträgliche Änderungen beim Anbieter; Weiterleitung beweist keine Provisionszuordnung. Deutsch/CHF werden im offiziellen Generatorlink angefordert, aber keine Preis-/Verfügbarkeitszusage.
- Tests: Kontext mit mehreren/wiederholten/unbekannten Zielen und fehlenden Daten; fixe Partnerlinks; UI in frischer Gastreise über normalen Weg, 320/390/768/1440 px, Tastatur, 200% Text, beide Themes; vor Klick keine Trip.com-Ressourcen; tatsächlicher Klick zur Suchstartseite. Tests, Typecheck, Lint, Architektur-Checks, Build, CI, unabhängiges Review und Preview vor regulärem Merge; Production-Abgleich danach.

## Offizielle Quellen und Konto-Evidenz

- Generator: https://www.trip.com/partners/tools/deeplink/create, am 2026-11-01 im bestehenden Konto Feirov Global Trading verwendet. Öffentliche Affiliate-ID `11162929`, Site-ID `334618271`.
- Hotels: `https://de.trip.com/hotels/?locale=de-DE&curr=CHF&Allianceid=11162929&SID=334618271&trip_sub1=jetnity-hotels&trip_sub3=D20822433`
- Flüge: `https://de.trip.com/flights/?locale=de-DE&curr=CHF&Allianceid=11162929&SID=334618271&trip_sub1=jetnity-flights&trip_sub3=D20822461`
- Beide URLs sind unveränderte Ausgaben des offiziellen Generators. Ziel-URLs für Deutsch/CHF stammen aus der sichtbaren Navigation der öffentlichen Trip.com-Seite. Keine erfundenen Datums-/Ortsparameter.
- FAQ: https://www.trip.com/partners/help/faq/tools?locale=en_xx — offizielle Tools/Links; generierte Links nicht verändern.
- Handbuch: https://pages.trip.com/affiliates/online/Trip.com%20Affiliate%20Platform%20User%20Guide%20(2501).pdf — Affiliate-Tools erzeugen/veröffentlichen, AID/SID verwenden.
- Suchwidget-Einbettung ist **nicht** Teil dieser Veröffentlichung: erzeugte 320×320-Formate sind nicht als responsive belegt. Die Beobachtung eines Ergebnis-Popups nach Widget-Suche wurde vom Browserwerkzeug wegen ungültiger URL abgelehnt; dieser Zugriff wird nicht umgangen. Prüfung der separaten allgemeinen Suchstartseiten ist kein Ersatznachweis für jenes Popup.

## Ergebnis

Implementiert in PR #1099. Geprüfter Runtime-Head: `b4d02f1659d046cf4bc4c21a458609c96772a315`; spätere Änderungen dieses Berichts betreffen nur Nachweise. Der Owner hat zusätzlich ausdrücklich nur die Vorschau dieses PRs mit der vorhandenen Testdatenbank `develop` freigegeben. Dafür wurden ausschließlich die beiden öffentlichen Supabase-Verbindungswerte auf den Preview-Branch beschränkt gesetzt. Keine Production-Konfiguration, Datenbankstruktur, Auth-Konfiguration oder Provider-Schlüssel geändert.

### Browsernachweise (01.11.2026, Europe/Zurich)

- Exact-Head-Preview: https://jetnity-d4a41wshy-jetnity-e1b93c82.vercel.app — READY, Deployment `dpl_HxX18w7ATXmGFtMHTACqc5LuXf9k`, Commit wie oben. Zugriff im frischen Playwright-Chrome-Kontext über einen zeitlich befristeten offiziellen Vercel-Zugang. Zugangstoken werden nicht veröffentlicht.
- Normaler Einstieg Startseite → Reise planen funktioniert. **Grenze:** Die Testdatenbank liefert für Bangkok keine Ortsauswahl. Die vollständige Neuanlage über das Formular ist deshalb in dieser Vorschau nicht nachgewiesen. Anschließend wurde ein synthetischer Gastentwurf über den bestehenden Browser-Speicher geladen; das ist ausdrücklich Fixture-QA der echten Workspace-Oberfläche, kein erfolgreicher Formular- oder Kontotest.
- Organisieren → Unterkunft/Flüge → Suche ausdrücklich öffnen: PASS. Genau eine passende Trip.com-Karte, auch nach Wechsel zurück. Die bisherigen Bereiche und Suchformulare bleiben erreichbar.
- Synthetische Route Zürich → Bangkok → Ko Chang → Bangkok: beide Bangkok-Aufenthalte bleiben getrennt; Ko Chang ohne Datumszuordnung bleibt offen. Datumsgrenzen enthalten das Jahr 2027. Der Flughinweis bezeichnet den gesamten Reisezeitraum und fordert ausdrücklich die Auswahl der passenden Teilstrecke und ihres Datums. Ein weiterer synthetischer unbekannter Ort führt zu keiner erfundenen Anbieter-Verfügbarkeit. Bei einer einzigen Etappe übernimmt der bestehende Hotelkontext gegebenenfalls den gesamten Reisezeitraum; das ist Eingabehilfe, keine Anbieterinformation.
- 320, 390, 768 und 1440 CSS-Pixel: kein horizontaler Seitenüberlauf, Linkhöhe mindestens 44 px. Helles und grünes Design geprüft. Bei 390 px zusätzlich Root-Schriftgröße 32 statt 16 px (200 % Text, kein Browserzoom): kein horizontaler Überlauf; Inhalte und Link bleiben durch Scrollen erreichbar. Tastatur: Details per Enter öffnen/schließen, Tab erreicht den nativen Suchlink. Kein Real-Device- oder Screenreader-PASS behauptet.
- Netzwerkbeobachtung der Vorschauseite bis zum ersten Partnerklick: keine Trip.com-Anfragen. Keine Trip.com-Scripts, Frames oder eingebetteten Ressourcen im Slice.
- **Hotelweiterleitung PASS:** tatsächlicher Klick aus der Vorschau öffnet die offizielle deutsche Hotelsuche, sichtbar CHF. Vollständige URL enthält unverändert AID/SID und `trip_sub1`/`trip_sub3`. Ortsfeld ist leer, Datum und Belegung kommen von Trip.com; keine automatische Kontextübernahme. Keine Hotelsuche abgesendet, keine Buchung.
- **Flugweiterleitung eingeschränkt geprüft:** der native Klick öffnet den festen offiziellen Link, der automatisierte Browser erhält jedoch `whaleguard block`. Separater normaler Chrome-Aufruf derselben allgemeinen Adresse zeigt die deutsche Flug-Suchmaske mit CHF und eigenen/vorherigen Vorgabewerten. Das ist kein erfolgreicher automatisierter End-to-End-Flugtest. Kein Umgehen einer Browser-Werkzeugsperre, keine Suchanfrage/Buchung. Die frühere blockierte Widget-Ergebnisadresse wurde nicht erneut aufgerufen.
- Weiterleitung und sichtbare Partnerparameter beweisen keine Provisionszuordnung oder spätere Auszahlung.

### Technische Prüfung

- Unabhängiger Read-only-Code-Review des Runtime-Heads: PASS, keine P0/P1/P2-Befunde im Slice; 15 fokussierte Kontext-/URL-/Datumsprüfungen PASS.
- Lokal: Typecheck, Lint (0 Fehler; bestehende Warnungen), Production-Build und die fünf Hygiene-/API-/Schema-Checks PASS.
- Lokaler Gesamtlauf: **7.673 Tests; 7.654 PASS, 14 FAIL, 5 SKIP**. 11 Fehler erfordern hier nicht installierte lokale PostgreSQL-Binaries. Zwei unveränderte Viator-Harness-Assertions scheitern nach ArrowDown auf einem nativen Select; der Harness enthält keinen Trip.com-/TripWorkspace-Code. Ein unveränderter UX-U1-A2-Test wartet nach zusätzlichem seitlichem Padding erfolglos auf `data-shell-nav="flow"`. Das ist kein belegter Font-Ladefehler. Beide Browserfehlergruppen wurden einzeln erneut beobachtet; Ursachen bleiben außerhalb dieses Slice offen. Keine Tests geändert oder abgeschwächt.
- Baseline-main `628b95d`: GitHub-CI 41250672493 PASS, 7.774 bestandene Tests und 2 explizite Auslassungen. Dies ersetzt nicht die erforderliche CI des aktuellen PR-Heads. Der endgültige CI-, Merge- und Production-Status wird im PR mit dem jeweiligen Commit dokumentiert. Kein Live-PASS aus Generator oder Kontostatus ableiten.

### Belege und verbleibender Umfang

Bereinigte Screenshots liegen im lokalen Übergabeordner `outputs/tripcom-integration-2026-11-01/`: `official-hotel-link.jpg`, `official-flight-link.jpg`, `preview-normal-entry-no-places.png`, `preview-hotel-desktop.png`, `preview-hotel-actual-click.png`, `preview-flight-white-320.png`, `preview-flight-white-390.png`, `preview-flight-white-768.png`, `preview-flight-white-1440.png`, `preview-flight-green-390.png`, `preview-flight-green-200percent-text.png`, `flight-provider-visible-chrome.jpg`. Keine persönlichen Sitzungsprotokolle oder Zugangstoken sind Teil der Übergabe.

Automatische Ziel-/Datumsübernahme, native Angebote, eingebettetes Suchwidget, Provider-API, Buchungsimport und bestätigte Provision bleiben ausdrücklich außerhalb dieser Veröffentlichung. Bank-/Auszahlungsfreigaben werden damit ebenfalls nicht bestätigt. Keine neuen laufenden Dienste oder API-Kosten.
