# Jetnity – Hotel-Provider-Strategie

**Stand:** 20. August 2026  
**Status:** verbindliche Produkt-/Architekturstrategie für Phase 3.2 und die folgenden Hotelphasen

## Ziel

Jetnity soll nicht von einem einzelnen Hotelanbieter abhängig sein. Die interne Hotelarchitektur bleibt provider-unabhängig. Ein Provider liefert kommerzielle Fakten; Jetnity entscheidet selbst über Quartierlogik, Ranking, Gesamtreise-Fit und Nutzerempfehlung.

Die Reihenfolge der Provider ist eine Integrationsstrategie, keine dauerhafte technische Bindung.

## Priorität der ersten Provider

### 1. Booking.com Demand API – bevorzugter erster kommerzieller Hotelprovider

Booking.com ist die erste Wahl, **sofern Jetnity als Managed Affiliate Partner Zugang erhält**.

Warum es besonders gut zum Jetnity-Modell passt:

- Search/Look/Redirect passt zum Aggregator-Modell: Jetnity sucht und bewertet, die Buchung erfolgt beim Partner.
- Echte Verfügbarkeiten und kommerzielle Preise können in die Jetnity-Hotelpipeline fliessen.
- Jetnity behält die eigene Oberfläche, Quartierlogik und Rangfolge.
- Affiliate-/Redirect-Logik kann getrennt von der Search-Domäne bleiben.
- Der Nutzer soll Jetnity als Produkt erleben; Booking.com ist Daten-/Buchungsquelle, nicht die Produktarchitektur.

Zugang oder Freischaltung darf nicht vorausgesetzt oder erfunden werden. Ohne gültigen Zugang bleibt der Adapter aus.

### 2. HBX / Hotelbeds – technischer Backup-Provider

Falls Booking.com den Zugang noch nicht erteilt oder die Freischaltung zu lange dauert, ist HBX/Hotelbeds der bevorzugte technische Backup-Weg für die erste reale Hotelintegration und Preview-Verifikation.

Ziel ist dabei nicht, Jetnity strategisch an Hotelbeds zu binden, sondern die provider-unabhängige Pipeline mit realen Hoteldaten zu verifizieren.

### 3. Expedia Rapid – spätere zusätzliche kommerzielle Quelle

Expedia Rapid bleibt ein wichtiger Kandidat für eine spätere zweite oder zusätzliche Hotelquelle, insbesondere wenn Jetnity genügend Produktreife, Traffic und Partnerfähigkeit für den entsprechenden Produktionszugang erreicht.

## Langfristiges Ziel: mehrere Quellen, eine Jetnity-Entscheidung

Langfristig soll Jetnity mehrere Hotelquellen normalisieren können. Jetnity darf dann nicht einfach den billigsten Provider bevorzugen.

Die Entscheidung soll unter anderem berücksichtigen:

- Gesamtpreis
- Lage und Quartier-Fit zur konkreten Reise
- erwartete Reisewege, sobald belastbare Routing-Daten vorhanden sind
- Stornierbarkeit und Flexibilität
- Frühstück und enthaltene Leistungen
- Hotelqualität und Bewertungsbasis
- Nutzerpräferenzen
- Gesamtwirkung auf die Reise

Provision, Affiliate-Höhe oder Providername dürfen die fachliche Rangfolge nicht beeinflussen.

Beispiel des gewünschten Produktverhaltens:

> Ein Anbieter kann günstiger sein, aber eine etwas teurere Alternative kann wegen deutlich besserer Lage und geringerer Reisewege die bessere Gesamtentscheidung sein. Jetnity erklärt diesen Unterschied und empfiehlt die für die Reise sinnvollere Option.

## Architekturregeln

- `HotelProvider` bleibt die schmale Search-Naht; kein Provider wird zur Domäne.
- Search und Affiliate-/Booking-Verantwortung bleiben getrennt.
- Provider-spezifische Rohdaten dürfen nicht in UI oder Reisegraph durchsickern.
- Kommerzielle Fakten müssen serverseitig aus einer vertrauenswürdigen Providerantwort stammen; der Browser ist keine Vertrauensquelle.
- Kein Fake-Hotel, kein erfundener Preis, keine erfundene Verfügbarkeit und kein erfundener Deeplink.
- Provider-Secrets sind nur serverseitig erlaubt und werden nie committed oder als `NEXT_PUBLIC_*` exponiert.
- Production-Hotelsuche bleibt aus, bis sie separat geprüft und ausdrücklich freigegeben wurde.
- Ein zweiter Provider wird erst angebunden, wenn er einen nachweisbaren Produkt- oder Coverage-Nutzen bringt; keine Multi-Provider-Komplexität auf Vorrat.

## Aktueller Umsetzungsstand

Phase 3.2c bleibt provider-unabhängig. Die Nachweis-Naht ist an Ziel, Zeitraum, Belegung und Währung gebunden; die Suchanfrage wird vor grosser Allokation begrenzt. Ein echter Adapter wird erst ergänzt, wenn für einen ausgewählten Provider gültige Zugangsdaten vorliegen.

**Verbindliche Reihenfolge:** Booking.com zuerst versuchen → HBX/Hotelbeds als Backup für reale Integration → Expedia Rapid später prüfen → langfristig mehrere Quellen provisionsneutral vergleichen.
