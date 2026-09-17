# Explicit Visit History 1 – Sichtbelege

Stand: 17. September 2026

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

## Gemessen, nicht nur gezeigt

`docs/evidence/explicit-visit-history-1/bericht.json`, `ok: true`:

- **keine fremde Herkunft.** Sämtliche Anfragen aller 14 Aufnahmen gingen an
  `http://127.0.0.1:<port>`. Kein Kartendienst, keine Kachel, kein Geocoder,
  kein Provider.
- **kein horizontaler Überlauf** auf keiner Breite (`overflow: 0`).
- **keine Konsolen- und keine Seitenfehler** (`konsole: []` überall).
- **kleinste Bedienfläche 44 px** über Schaltflächen, Links, Eingaben und
  Auswahlfelder der Hauptfläche.
- **Grenze unter der Füllung sichtbar.** In einem 14-px-Fenster genau über der
  portugiesisch-spanischen Landgrenze – also unter der Füllung eines besuchten
  Landes – liegen 15 verschiedene Farben im gerenderten Bild. Wäre die Grenze
  von der Füllung verschluckt, wären es zwei.

## Zustände der Karte im Fixture `welt`

```
laenderZustaende: { beides: 2, besucht: 2, geplant: 1 }
kennzahlen:       ["Besucht: 4 Länder · 5 Orte", "Geplant: 3 Länder · 7 Orte"]
laenderListe:     ["🇧🇷 Brasilien · Besucht und geplant",
                   "🇮🇹 Italien · Besucht",
                   "🇯🇵 Japan · Geplant",
                   "🇵🇹 Portugal · Besucht und geplant",
                   "🇸🇬 Singapur · Besucht"]
ereignisse:       6
```

Die Zahlen sind die Probe auf die Entdopplung: sechs Ereignisse, davon zweimal
Lissabon, ergeben fünf eindeutige Orte. Vier eindeutige Länder, obwohl fünf
Ereignisse einen Ort tragen – der sechste Eintrag hat keinen Ländercode und
erhöht die Länderzahl deshalb nicht.

## Grenzen dieser Belege

Die Aufnahmen entstehen im Audit-Harness mit festen Fixtures. Sie belegen die
**Darstellung** aller Zustände und die **Bedienbarkeit** der Abläufe auf beiden
Breiten. Sie belegen **nicht** das Schreiben gegen eine echte Datenbank: dafür
fehlte in dieser Umgebung der Supabase-Zugang (siehe
`docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`). Das Schreiben,
die Eigentumsprüfung und jede Check-Bedingung sind stattdessen gegen eine lokal
aufgesetzte PostgreSQL 16 empirisch gemessen (`npm run db:besuche-lokal`,
26/26).

Ein Real-Device-Test auf echter Hardware hat nicht stattgefunden und ist damit
offen.

## Zusätzlich

`npm run audit:account` läuft mit den angepassten Zusagen in WebKit und Chromium
über sechs Breiten: **48/48 grün**. Der Audit prüft dort unter anderem, dass
ohne bestätigte Historie ausschliesslich der Zustand `geplant` eingefärbt wird –
ein geplanter Ort darf nie als Besuch erscheinen.
