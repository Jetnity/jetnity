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

Implementierung und Freigaben noch ausstehend. Kein Live-PASS aus Generator oder Kontostatus ableiten.
