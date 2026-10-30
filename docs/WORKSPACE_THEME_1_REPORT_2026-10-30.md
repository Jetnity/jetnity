# Workspace Theme 1 – Prüfbericht

Stand: 30.10.2026. Auftrag: standardmässig helle Jetnity-Darstellung, Umschaltung
zum grünen Workspace mit einem Klick im Header. Basis: PR #1092, main
`6b929baec81e6c561142db4e6a9636e1bb30c873`.

## Umsetzung

Der beschriftete Header-Schalter bietet „Grün“ bzw. „Hell“. Er ist auch mobil
sichtbar, mindestens 44px hoch und per Tastatur bedienbar. Die Farbauswahl ist
eine optionale lokale Browserpräferenz. Erstbesuch und ungültige Präferenz ergeben
Hell, auch bei dunkler Systemeinstellung. Ein Speicherfehler lässt den aktuellen
Wechsel zu; eine dauerhafte Speicherung kann dann nicht zugesichert werden.

Beide Ansichten verwenden denselben Komponentenbaum, dieselben Daten und Handler.
Die grünen Farbregeln sind auf die explizite Auswahl beschränkt. Keine Änderungen
an Homepage, Anbieterframes, Auth, API, Datenbank, ENV oder Reise-/Kontoverträgen.

## Lokale Browserprüfung

30.10.2026, 12:14:11 UTC (13:14:11 CET). Frischer isolierter Chromium-Kontext,
`http://127.0.0.1:3472`, nur synthetische Gastdaten; kein persönliches Profil.
Sieben Prüfgruppen bestanden, keine Browserfehler und keine externen/Provider-
Requests beobachtet. Die Überwachung hätte fremde Ursprünge und Provider-/Modell-
API-Aufrufe blockiert.

1. PASS: Heller Erstbesuch trotz dunkler Systempräferenz; beide Planungswege
   sichtbar; eingetragener Freitext bleibt beim Umschalten erhalten.
2. PASS: Beide Farbentscheidungen überstehen Reload; Grün bleibt beim Seitenwechsel.
3. PASS: Mehrort-Gastreise, „Jetzt wichtig“, Header-Aktion „Reise ändern“ und
   gespeicherter Reiseinhalt bleiben beim Wechsel unverändert.
4. PASS: 1440/768/390/320px in beiden Ansichten; kein horizontaler Überlauf.
   Schalter per Enter/Leertaste mit sichtbarem Fokus. Textvergrösserung 16→32px
   an der Wurzel bei 320px, kein Überlauf. Dies ist kein nativer Browserzoomtest.
5. PASS: Gespeichertes Grün färbt die öffentliche Homepage nicht um.
6. PASS: Ungültiger gespeicherter Wert ergibt Hell.
7. PASS: Gesperrter Präferenzspeicher verhindert beide Wechsel nicht.

Bereinigte lokale Belege liegen im Arbeitsverzeichnis unter
`outputs/jetnity-workspace-theme-2026-10-30/`: `theme-results.json`,
`planen-{light,green}-desktop.png`, `overview-{light,green}-{1440,768,390,320}.png`
und `overview-{light,green}-320-text200.png`. Die Screenshots enthalten nur die
künstliche Reise. Ein anfänglich fehlender lokaler Verbindungsplatzhalter wurde
vor dem gültigen Lauf durch rein synthetische localhost-Werte ersetzt.

## Review und technische Prüfungen

Unabhängiger read-only Quellreview fand einen P2: aus dem alten dunklen Reisekopf
übernommene weisse Speicher-/Löschtexte wären im hellen Design schlecht lesbar.
Begrenzt auf diesen Slot korrigiert. Ein anschliessender Kontrastbefund wurde
durch `ink-900` für den hellen Nebentext behoben: ca. 6,21:1 auf `surface-75`,
5,94:1 auf `surface-100`. Grüne Ansicht und dunkle Aktionsbuttons bleiben erhalten.

Typecheck, Lint (0 Fehler, 178 bestehende Warnungen), Production-Build,
Setup-/Betriebsmodus-/API-Schutz-/Schema-/Dead-Code-/Export-/Paketprüfungen bestanden.
Die vollständige Testsuite, der finale Commit-Review, CI und die exakte Vercel-
Vorschau werden im PR-Abnahmebeleg dokumentiert. Dieser Bericht allein ist kein
Merge- oder Production-PASS.

## Grenzen

Kein neuer angemeldeter Kontoschreibtest und keine echte Handy-/VoiceOver-Abnahme.
Die Kontoverträge sind unverändert; die vorherige develop-Abnahme bleibt Beleg
für PR #1092, nicht ein vorgetäuschter neuer Theme-Test. Bei gespeichertem Grün
kann vor der Hydrierung kurz die helle Serverdarstellung sichtbar sein. Keine
zusätzlichen Tracking- oder Kontodaten werden für diese Präferenz verwendet.

Die offenen Anbieter-/Owner-Gates und der kombinierte Abgleich mit #1082 werden
durch diesen Darstellungsauftrag nicht aufgehoben.
