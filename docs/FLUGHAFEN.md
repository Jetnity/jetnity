# Jetnity – Flughafenbasis

**Stand:** 20. August 2026 · Phase 3.1  
**Gilt für:** die lokale, provider-unabhängige Referenz `public.airports` und `/api/search/airports`.

Diese Datei beschreibt, woher Flughafendaten kommen, was in die Suche darf und wie ein Refresh läuft. Die Flugsuche selbst steht in [docs/FLUEGE.md](FLUEGE.md). Entscheidung: ADR-0066 in [DECISIONS.md](../DECISIONS.md).

---

## 1. Was die Basis ist – und was nicht

Die Autocomplete-Suche liest **nur** `public.airports`. Sie hängt nicht an Duffel, nicht an Amadeus und nicht an einer Live-Abfrage gegen OurAirports.

Nicht gebaut:

- ein Airport-Provider-Interface auf Vorrat
- ein vollständiges Weltverzeichnis aller Airfields
- ein Dump im Git oder im CI-Image
- ein Download zur Build-Zeit
- ein Schreibweg aus der öffentlichen Suche

Eine leere Tabelle bleibt eine leere Liste. Ein Fehler bleibt ein Fehler. Beides darf nicht in denselben Zustand fallen ([AGENTS.md](../AGENTS.md) Regel 15, ADR-0037).

---

## 2. Quelle und Lizenz

| Feld | Wert |
| --- | --- |
| Datensatz | [OurAirports Open Data](https://ourairports.com/data/) |
| Verteilung | [davidmegginson/ourairports-data](https://github.com/davidmegginson/ourairports-data) |
| Dateien | `airports.csv`, `countries.csv`, `regions.csv` |
| Lizenz | Public Domain. OurAirports stellt die CSV-Dateien ausdrücklich als gemeinfrei bereit; der Betreiber (David Megginson) verzichtet auf urheberrechtliche Ansprüche an diesen Daten. |
| Kosten | keine Lizenzkosten, kein API-Schlüssel, kein laufender Anbietervertrag |

Jetnity speichert eine **gefilterte Kopie**. Die Nutzersuche trifft niemals den Upstream.

Die Public-Domain-Zusage gilt für die OurAirports-CSV-Dateien. Wikipedia-Links in der Quelle werden nicht importiert. Namen und Geokoordinaten können fehlerhaft sein; der Import verwirft unplausible Koordinaten und ungültige Codes.

---

## 3. Filter

In `public.airports` kommt nur, was für eine kommerzielle Flugsuche relevant ist:

1. gültiger IATA-Code (`^[A-Z]{3}$`)
2. `large_airport` oder `medium_airport`, **oder**
3. `small_airport` mit `scheduled_service=yes`

Helipads, geschlossene Plätze, private Felder ohne IATA und Zehntausende irrelevanter Airfields bleiben draussen. Bei doppeltem IATA oder ICAO gewinnt die höhere Klasse.

Gespeichert werden IATA, ICAO (soweit eindeutig), offizieller Name, Stadt, Region, Land, Landescode, Koordinaten, Keywords und Klasse.

---

## 4. Suche

`GET /api/search/airports?q=` liest die lokale Tabelle und rangiert in Prozess:

1. genauer IATA-Treffer
2. genauer ICAO-Treffer
3. Code-Präfix
4. Stadt, dann Name (exakt, Anfang, Teil)
5. Keywords, Region, Land
6. Klassenbonus (`large` vor `medium` vor `small`)

Umlaute werden gefaltet (`Zürich` trifft `Zurich`). Städte mit mehreren Flughäfen bleiben mehrere Treffer (London: LHR und LGW; New York: JFK und EWR; Tokio: HND und NRT). Gleichnamige Städte bleiben über Land/Region unterscheidbar.

Die Abfrage holt höchstens 80 Zeilen, die Antwort höchstens 12 Optionen. Sonderzeichen, die PostgREST-`.or()` oder `LIKE` zerlegen würden, werden vorher entfernt.

---

## 5. Import

Der einzige Schreibweg liegt im Repository und läuft von Hand:

```bash
npm run airports:importieren
npm run airports:importieren -- --datei lib/airports/fixtures
npm run airports:importieren -- --schreiben --entwicklung
npm run airports:importieren -- --schreiben --entwicklung --bereinigen
```

Ohne `--schreiben --entwicklung` ist jeder Lauf eine Probe: Quelle lesen, validieren, zählen, nichts schreiben. `--schreiben` allein reicht nicht.

Vor dem Development-Schreiben ruft das Skript `ziel()` auf. Zeigt `SUPABASE_PROJECT_REF` auf ein eigenständiges Projekt statt auf einen Branch, bricht der Lauf ab. Production-Schreiben ist ein zweiter Weg (`--schreiben --produktion --projekt-ref`) und steht in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md).

`--bereinigen` löscht Zeilen, deren IATA nicht mehr in der gefilterten Menge liegt. Ohne dieses Flag bleibt historischer Ballast stehen und wird nur überschrieben, wenn derselbe IATA wiederkommt.

Der Import upsertet idempotent über `airports_iata_unique`. Vor jedem Stapel werden ICAO-Werte, die sonst mit einer anderen IATA kollidieren würden, auf `null` gesetzt.

Die Logik (`lib/airports/importieren.ts`) ist ohne Netzwerk prüfbar. Tests laden nur die kleinen Fixtures unter `lib/airports/fixtures/`. Der vollständige Upstream-Dump liegt nicht im Repository und nicht im Testlauf.

`npm run build`, `prebuild` und die CI rufen den Import nicht auf. Ein Lauf ohne Internetzugang zum Datenlieferanten bleibt grün.

---

## 6. Development befüllen

1. Migration `20260820110000_airports_referenz.sql` nur auf dem Development-Branch anwenden (`npm run db:anwenden`).
2. Typen neu erzeugen (`npm run db:typen`).
3. Import schreiben: `npm run airports:importieren -- --schreiben --entwicklung`.
4. Anzahl und Pflichtcodes prüfen. Die Pflichtcodes sind mindestens ZRH, GVA, BSL, LHR, LGW, JFK, EWR, DXB, BKK, HND, NRT.

Erster Development-Import am 20. August 2026: **5332** Zeilen (1169 large, 3396 medium, 767 small mit Linienverkehr), 80604 OurAirports-Zeilen verworfen. Vorher 0. Production unverändert.

Production bleibt unverändert, bis der kontrollierte Rollout in [PRODUCTION_ROLLOUT.md](PRODUCTION_ROLLOUT.md) ausdrücklich freigegeben und von Hand ausgeführt wird. Schema und Inhalt bleiben getrennte Handlungen. Production-Schreiben braucht `--schreiben --produktion --projekt-ref`. `--bereinigen` ist dort abgelehnt, damit die 40 historischen Zeilen nicht still entfallen.

---

## 7. Refresh-Strategie

| Anlass | Handlung |
| --- | --- |
| Quartalsweise oder wenn ein kommerzieller Flughafen in der Suche fehlt | Probe, dann `--schreiben --entwicklung` gegen Development |
| Nach einem Upstream-Formatbruch | Fixtures und Parser anpassen, Tests zuerst, erst dann schreiben |
| Vor einer späteren Production-Befüllung | eigene Freigabe; zuerst Development, dann derselbe Import gegen einen freigegebenen Weg |

Kein Cron, kein `pg_net`, kein Request-Pfad. Ein Refresh ist eine bewusste Handlung mit Protokoll (Anzahl vorher/nachher, Pflichtcodes).

Ändert OurAirports das CSV-Format so, dass der Parser scheitert, bleibt der letzte gültige Bestand stehen. Die Suche degradiert nicht auf einen Live-Fallback.
