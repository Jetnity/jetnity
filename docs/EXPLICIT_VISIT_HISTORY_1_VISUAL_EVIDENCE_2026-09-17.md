# Explicit Visit History 1 – Sichtbelege

Stand: 17. September 2026 (Review-Runde 1 eingearbeitet)

Erzeuger: `node scripts/kartografie/besuchshistorie-belege.mjs`
Bilder und Messwerte: `docs/evidence/explicit-visit-history-1/`

Der Lauf startet den **Produktionsserver** (`next start`) mit
`JETNITY_UI_AUDIT=1` auf einem eigenen Port. Gemessen wird damit der
ausgelieferte Build, nicht der Entwicklungsmodus. Die Fixtures liegen
ausschliesslich im Audit-Harness, nie im Produktspeicher.

## Belegte Zustände

Je Zustand ein Bild bei **390 px** und bei **1280 px**:

| Datei | Was sie zeigt |
| --- | --- |
| `uebersicht-leer-{390,1280}.webp` | leere Historie, leere Planung – ehrlicher Satz statt „0 besucht“ |
| `uebersicht-zustaende-{390,1280}.webp` | besucht, geplant, überlagert und ein Land ohne zeichenbare Fläche |
| `uebersicht-besuch-fehler-{390,1280}.webp` | Historie nicht lesbar, Planung lesbar – Ausfall statt leerer Historie |
| `historie-liste-{390,1280}.webp` | Ereignisliste mit wiederholten Besuchen und Teilgenauigkeit |
| `historie-leer-{390,1280}.webp` | leere Historie plus Formular „Besuchten Ort hinzufügen“ |
| `historie-bearbeiten-{390,1280}.webp` | geöffnetes Bearbeiten-Formular mit übernommenen Werten |
| `historie-widerrufen-{390,1280}.webp` | Rückfrage vor dem Widerruf einer Bestätigung |

Dazu drei Vergrösserungen, weil die Ersatzmarken der Kleinstaaten wenige
Bildpunkte gross sind und eine Zusage über ihre Unterscheidbarkeit man sehen
können muss:

| Datei | Was sie zeigt |
| --- | --- |
| `lupe-suedostasien.webp` | Singapur als Ring (besucht), Hongkong als Doppelring (besucht und geplant) |
| `lupe-mittelmeer.webp` | Malta als gestrichelter Ring (geplant) |
| `lupe-suedamerika.webp` | Brasilien als Fläche mit Schraffur (besucht und geplant) |

## Gemessen, nicht nur gezeigt

`docs/evidence/explicit-visit-history-1/bericht.json`, `ok: true`:

- **keine fremde Herkunft.** Sämtliche Anfragen aller 14 Aufnahmen gingen an
  `http://127.0.0.1:<port>`. Kein Kartendienst, keine Kachel, kein Geocoder,
  kein Provider.
- **kein horizontaler Überlauf** auf keiner Breite (`overflow: 0`).
- **keine Konsolen- und keine Seitenfehler** (`konsole: []` überall).
- **kleinste Bedienfläche 44 px** über Schaltflächen, Links, Eingaben und
  Auswahlfelder der Hauptfläche.
- **Grenze unter der Füllung sichtbar.** In einem Fenster genau über der
  portugiesisch-spanischen Landgrenze – also unter der Füllung eines besuchten
  Landes – liegen 153 verschiedene Farben im gerenderten Bild bei 1280 px und
  66 bei 390 px. Wäre die Grenze von der Füllung verschluckt, wären es zwei.
- **drei Formen für drei Zustände.** Der Lauf liest aus dem Baum, welche Form
  welchem Zustand zugeordnet ist, und verlangt drei verschiedene:
  `{ besucht: 'ring', geplant: 'ring-gestrichelt', beides: 'doppelring' }`.
  Verglichen wird der Formname, nicht die Farbe und nicht die Deckkraft.

## Zustände der Karte im Fixture `welt`

```
laenderZustaende: { beides: 3, besucht: 2, geplant: 2 }
punktMarken:      { besucht: 'ring', geplant: 'ring-gestrichelt', beides: 'doppelring' }
kennzahlen:       ["Besucht: 5 Länder · 6 Orte", "Geplant: 5 Länder · 9 Orte"]
ereignisse:       7
```

Die Zahlen sind die Probe auf die Entdopplung: sieben Ereignisse, davon zweimal
Lissabon, ergeben sechs eindeutige Orte. Fünf eindeutige Länder, obwohl sechs
Ereignisse einen Ort tragen – der siebte Eintrag hat keinen Ländercode und
erhöht die Länderzahl deshalb nicht.

Das Fixture deckt jede Form einmal ab: Brasilien und Portugal als Fläche mit
beiden Zuständen, Italien als volle Fläche, Japan als Schraffur, Singapur als
Ring, Hongkong als Doppelring, Malta als gestrichelter Ring.

## Grenzen dieser Belege

Die Aufnahmen entstehen im Audit-Harness mit festen Fixtures. Sie belegen die
**Darstellung** aller Zustände und die **Bedienbarkeit** der Abläufe auf beiden
Breiten. Sie belegen **nicht** das Schreiben gegen eine echte Datenbank: dafür
fehlte in dieser Umgebung der Supabase-Zugang (siehe
`docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`). Das Schreiben,
der Wahrheitsvertrag, die Eigentumsprüfung und jede Check-Bedingung sind
stattdessen gegen eine lokal aufgesetzte PostgreSQL 16 empirisch gemessen
(`npm run db:besuche-lokal`, 41/41).

Der Harness leitet seit Review-Runde 1 serverseitig ab, so wie das Produkt. Vor
der Umstellung rechnete er die Länderlabel im Browser nach und prüfte damit
einen Weg, den es nicht gibt.

Ein Real-Device-Test auf echter Hardware hat nicht stattgefunden und ist damit
offen.

## Zusätzlich

`npm run audit:account` läuft mit den angepassten Zusagen in WebKit und Chromium
über sechs Breiten: **48/48 grün**. Der Audit prüft dort unter anderem, dass
ohne bestätigte Historie ausschliesslich der Zustand `geplant` eingefärbt wird –
ein geplanter Ort darf nie als Besuch erscheinen.
