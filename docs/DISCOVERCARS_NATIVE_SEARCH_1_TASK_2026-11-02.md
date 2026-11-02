# DiscoverCars Native Search 1 — Auftrag

Datum: 2. November 2026. Baseline: `05f7652c2560d8b11750d60589c1ab4bd2615d77`,
Mode NORMAL. Branch `feat/discovercars-native-search-1`.
SINGLE_AGENT: Root ist alleiniger Writer, unabhängiger Read-only-Review vor Release.

## Autorisierung und Evidenz

Der Owner genehmigt ausdrücklich „ok. wir bauen es jetzt“ nach der vorgelegten
DiscoverCars-Antwort vom 2. November. Diese bestätigt eingerichteten Search-API-Zugang,
Anzeigerechte für Angebote und Details auf Jetnity sowie die Weiterleitung des
ausgewählten Angebots über das zurückgegebene `url.web`. Die alte Aussage „kein
genehmigter API-Zugang“ ist für diesen Auftrag überholt. Historische Widget-/CMP-
Aufträge werden weder wiederaufgenommen noch pauschal geöffnet.

Keine Antwort auf die E-Mail. Kein Vertragsabschluss, keine Buchung, kein Kauf.
Chrome-JavaScript über Apple Events bleibt auf ausdrücklichen Owner-Wunsch aus.
Normale sichtbare Browserbedienung ist erlaubt. Einladung, Passwort und API-Key
gehören nicht in Git, Logs, Screenshots der Abnahme oder öffentliche Berichte.

## Ziel und Akzeptanz

- Im bestehenden Bereich Mobilität → Mietwagen auf Jetnity suchen, Fahrzeuge
  vergleichen und verfügbare Angebotsdetails lesen; erst die Buchung öffnet den
  konkreten DiscoverCars-Link. Kein neuer Hauptbereich.
- Abhol-/Rückgabestationen aus der offiziellen Ortssuche auswählen. Ein eingegebener
  Ortsname, GeoNames-ID oder Reiseort wird nicht als bestätigte Anbieterstation behandelt.
- Vorhandene Reiseetappen/-daten dienen als erkennbare, überprüfbare Suchhilfe.
  Keine erfundenen Flughafenstationen, Fahrerangaben oder Zeiten.
- Native Darstellung in Jetnity-Farben, klarer Gesamtpreis und Währung, Filter/
  Vergleich nur nach tatsächlich gelieferten Fakten. Keine erfundenen Fahrzeugbilder,
  Bedingungen, Bewertungen, Verfügbarkeiten oder Empfehlungskennzeichen.
- Lade-, Leer-, Teil-, Fehler-, Timeout-, Rate-Limit- und abgelaufene Ergebnisse
  unterscheiden. Veraltete Suche und verspätete Antworten nach Kontextwechsel
  dürfen nicht als aktuelle Angebote erscheinen.
- Vorhandene manuelle Mietwagen und Buchungsstatus bleiben erhalten. Ein Anbieter-
  Klick oder Suchtreffer erzeugt keine bestätigte Buchung.

## Technischer Plan

1. Offizielle Dokumentation im angemeldeten Portal prüfen: Basis-URL, Authentisierung,
   Parameter, Antwortschemas, Preis-/Zeitsemantik, Bedingungen und Anzeigerechte.
   Bis dahin keine geratene Implementierung des Anbietervertrags.
2. Bestehende Rental-Suchnaht und Provider-Transport verwenden, soweit sie den realen
   Vertrag tragen. Anpassungen in `lib/rental-cars`, `lib/server/providers` und
   `app/api/rental-cars`; explizite Freischaltung und serverseitiges Secret.
3. Bestehenden Mietwagenbereich um native Suche, Ergebnisse und Details ergänzen.
   Autocomplete erst auf Eingabe, Angebotssuche erst auf ausdrückliches Absenden.
   Den funktionierenden externen Einstieg als Ausweichweg behalten.
4. Nur bestätigte Suchfelder an den Anbieter senden, keine Reise-IDs, Namen,
   Dokumente oder komplette gespeicherte Reise. Rückgabe-URL und externe Medien
   eng validieren, keine Rohantworten oder Anbieterfehler an den Browser leaken.
5. Timeouts mit Abbruch, begrenzte Antwortgröße, minimale Wiederholungen, lokale
   Stationszeiten gemäß Dokumentation, Begrenzung unter dem Providerkontingent.
   600/min ist Providerlimit, keine Erlaubnis zu unbeschränkten öffentlichen Aufrufen.
6. Serverkonfiguration sicher installieren, gezielte reale Stations-/Angebots-/
   Detailprüfung ohne Buchung. Keine neuen bezahlten Leistungen ohne konkrete
   Freigabe. Neue Datenbanktabellen/-migrationen sind derzeit nicht geplant.

## Prüfung und Release

Vertrags-/Validierungs-, Fehler-/Timeout-/Freshness-/Kontextwechsel-Tests;
Tastatur und 320/390/1440px mit real montierter UI; gezielte regressionsrelevante
Mietwagentests; Typecheck, Lint, fünf Hygienechecks und Build; native PR-CI,
unabhängiger Exact-Head-Review, Preview und Live-Prüfung nach normalem Merge.
Homepage und öffentliche Indexsperre bleiben unverändert.

Dokumentation: Nachweis mit tatsächlich beobachteten Schemas/Prüfungen,
`ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `docs/RENTAL_CARS.md` und
Continuity auf aktuellen Stand bringen. Keine voreilige Fertigmeldung bei fehlender
Dokumentation, Credentials oder unbestätigter realer API-Funktion.

Reviewer: read-only; do not mark Ready; do not merge; do not start a follow-up slice.
Root führt nach bestandener Prüfung den bereits autorisierten Release aus.
