# DiscoverCars Native Search 1 — Vertrag und Prüfnachweis

Stand: 2. November 2026. Branch `feat/discovercars-native-search-1`, Ausgangspunkt main `05f7652c2560d8b11750d60589c1ab4bd2615d77`. Implementierung vorhanden; Preview, unabhängiger Review, native CI und Release noch offen. Kein Gesamtprodukt-/Launch-PASS.

## Offizieller Vertrag

Ilina Beskina bestätigte am 2. November per E-Mail API-Freischaltung, Verknüpfung mit Jetnitys Affiliate-Konto sowie Anzeige und Vergleich individueller Angebote auf Jetnity. Dokumentation wurde im angemeldeten Portal unter `/account/api/docs` und `/account/api/swagger` gelesen. Keine E-Mail-Antwort und keine Buchung ausgelöst. Chrome-JavaScript über Apple Events bleibt aus.

- Origin `https://demandapi.discovercars.com`, serverseitiger Bearer-Key.
- `GET /v2/locations/search?term=…&locale=de-DE`: bestätigte Anbieterstationen.
- `POST /v1/offers`: residence/age, currency, pickup/dropoff in **lokaler Stationszeit**, location_id und show_extras.
- `GET /v1/offers/{offer_id}`: Detaildaten des konkreten Angebots.
- `GET /v1/classifiers/currencies`: CHF/EUR/USD/GBP sind bestätigt.
- Keine Sandbox; Tests verwenden Live-Inventar. Providerkontingent 600 Anfragen/min; Suche üblicherweise 2–10 Sekunden.
- Angebote höchstens 30 Minuten verwenden, danach neue Suche. Keine automatische Fristverlängerung durch Detailabruf.
- Originalwert `url.web` unverändert für Buchung/Attribution weitergeben. Kein selbst gebauter Angebotslink.
- Pflichtsteuern/-gebühren laut Anbieter enthalten. Optionale Extras und einzelne lokale Rückgabegebühren können zusätzlich anfallen.
- Zahlungsstatus ist relevant: `paydeposit` = Zahlung und Kaution, `pay` = Zahlung, `notaccepted` = nicht akzeptiert. Unbekannte Werte werden nicht als Akzeptanz ausgegeben.

## Reale Beobachtung

Bangkok-Ortssuche HTTP 200: zehn Stationen, u.a. Suvarnabhumi 8054. Suche 16.–23. November 2026, 10:00 lokal, 35 Jahre, Wohnsitz CH, CHF: HTTP 201, 147 Angebote. Ein Detailabruf HTTP 200. Ein beobachtetes Angebot: Toyota Yaris, CHF 116.80 für den Zeitraum, yesaway, Bewertung 8.89 aus 175 Bewertungen, Kaution/Selbstbeteiligung CHF 244.59. Das sind datierte Testbeobachtungen, keine dauerhaften Preisversprechen.

Rohantworten und Credentials liegen ausschliesslich temporär ausserhalb Git. Nachweise enthalten keine Schlüssel, Einladungstokens, Kundendaten oder vollständigen geschützten Portalinhalt.

## Datenfluss und Sicherheitsgrenzen

`MietwagenBereich` → `DiscoverCarsMietwagen` → POST `/api/rental-cars/discovercars` → validierter serverseitiger Adapter → gemeinsamer Provider-Transport. Eigene überschaubare Anbieterintegration; historische `/api/rental-cars/search`-Factory bleibt unverändert geschlossen.

- Flag `JETNITY_DISCOVERCARS_SEARCH_ENABLED=1` **und** `DISCOVERCARS_API_KEY` erforderlich. Bei Ausfall bleibt ein externer Suchweg verfügbar.
- Öffentlicher Gast-Endpunkt für reine Suche, kein DB-/Konto-/Adminzugriff. Originprüfung, begrenztes JSON, strikter Eingabevertrag, keine vollständigen Reisen.
- Pro Instanz und pseudonymisierter IP: Orte 30/min + 600/Tag, Suche 10/10min + 40/Tag, Details 30/10min + 120/Tag. Maximal 10 000 Kennungen; Tagesreset. Dies ist **kein verteilter globaler Account-Limiter**; zusätzlich gilt das Providerkontingent.
- Transport: feste HTTPS-Origin, Secret-Header nur serverseitig, kein Redirect-Follow, kein Retry, 18 Sekunden Timeout, maximal 2 MiB Antwort. Keine Rohfehler im Client.
- Antwortschema lässt nur Darstellungsdaten durch. Keine Vermieter-E-Mail/Telefon-/internen Daten. Nur erlaubte DiscoverCars-Bild-, Angebots- und Bedingungs-URLs; Bilder direkt ohne Erweiterung des Next-Image-Optimizers.
- HMAC-Detailtoken bindet Angebots-ID, Währung und Ablaufzeit. Falsche/abgelaufene Tokens erreichen den Anbieter nicht. Preiswährung und Angebots-ID werden erneut geprüft.
- Suchangabenänderung/Bereichswechsel verwirft alte Ergebnisse und bricht Anfragen ab. Detailfehler ist kein leeres Angebot. Suche/Weiterleitung erzeugt keine Buchung und schreibt keine Reise.
- Providerbilder werden erst für angeforderte Ergebnisse geladen; Suchhinweis benennt die Übermittlung der Suchangaben. Widget-Ausweichweg behält seine bestehenden Einwilligungsregeln.
- Homepage, öffentliche Indexierungssperre, Auth und Datenbank bleiben unverändert. Keine Migration, kein neuer Dienst, kein bezahlter Vertrag.

## Prüfstand

- Installation, TypeScript, Production-Build erfolgreich.
- Gezielte DiscoverCars-/Rental-Tests: 101 Tests bestanden.
- Regression manuelle Flüge und bestehendes Security-Inventar nach Behebung des Image-Imports: 54 Tests bestanden.
- Lint: keine Fehler; bestehende 192 Warnungen im Gesamtprojekt. Neue Module ohne Warnungen.
- Fünf Hygieneprüfungen erfolgreich: dead, exports, deps, api-schutz, schema-bezug.
- Erster Gesamttest: 7 781 Tests, 7 764 bestanden, 13 fehlgeschlagen, 4 übersprungen. Drei durch diese Änderung ausgelöste Fehler (alte SSR-Erwartung, neuer Next-Image-Import im SSR-Harness und Security-Inventar) sind gezielt behoben und nachgeprüft. Übrige lokale Fehler betreffen PG16-Pflicht bei vorhandenem PG17, geerbte DB-Umgebung und zwei bestehende Workspace-Geometrieprüfungen. Vollständige native PR-CI bleibt Freigabegate; diese Liste ist kein behaupteter Gesamttest-PASS.
- Montierter Browseraudit: Desktop 1440 sowie 390/320, Tastatur, Filter, Vergleich, Details/Escape-Fokus, Eingabeänderung, leere/fehlerhafte/abgelaufene Ergebnisse, verspätete Antworten und unveränderte Gastreise. Laufender Nachweis; keine echte Hardware-Abnahme behauptet.

## Release und verbleibende Grenzen

Vor Release: unabhängiger Review am exakten Head, grüne native CI, Vorschau mit sicher hinterlegten branchbezogenen Variablen, reale Suche/Details auf diesem Build. Nach normalem Merge: Production-Flag/Key und tatsächliche Domain verifizieren. Kein Release-PASS vor diesen Nachweisen.

Keine Buchungs-API, keine automatische Reservierung, kein Booking-Callback und keine neue Speicherung ausgewählter Fahrzeuge. Bereits manuell erfasste Mietwagen bleiben erhalten. Manche Vermieterangaben liegen in Originalsprache vor. Das bisherige globale V1-/Launch- und übrige Provider-/Truth-Gating wird durch diesen Slice nicht aufgehoben.
