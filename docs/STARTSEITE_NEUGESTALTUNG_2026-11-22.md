# Startseite neu gestaltet – Umfang, Belege, Grenzen (22. November 2026)

Stand: Branch `cursor/startseite-neugestaltung-2ba1`, Auftrag des Product Owners vom 22. November 2026 (PR B). Reine Darstellungsänderung der öffentlichen Startseite `/`. Keine Änderung an Logik, Preisen, Einreisedaten, Login/2FA/Passkeys, Datenbank oder Anbietern. Keine neuen Dienste, keine externen Schriften, keine neuen Bibliotheken.

## Was sich ändert

- **Hero:** Das Bali-Bild füllt die ganze Fläche (`next/image`, `priority`, gleicher Alternativtext). Ein Verlauf in den vorhandenen Markentönen (Tiefgrün, dezenter Lime-Schein) hält die Schrift lesbar. Die Suchkarte (`StartzielForm`, unverändert) schwebt als Glasfläche mit 1-px-Lichtkante über dem Bild. H1, Definition, der Satz «Ohne Konto starten …» und die drei Zusagen stehen ohne Scrollen im ersten Bildschirm (gemessen bei 390×800 und 1440×800; auf Telefonen unter etwa 780 px Höhe rutscht die letzte Zusage unter den Falz, die ersten zwei und die Suchkarte bleiben sichtbar).
- **Bento-Raster «Jetnity sieht, was zusammengehört»:** «Reiseprüfung», «Einreisevorbereitung», «Gesamtkosten» und «Eine Reise statt fünf getrennte Tools» liegen in einem asymmetrischen Raster (7/5 und 5/7 Spalten ab 1024 px, einspaltig auf dem Telefon). Jede Karte behält alle Texte und bekommt eine kleine Oberflächen-Illustration (`components/home/HomeMiniUi.tsx`): Routen-Linie mit Lücke und Lösung, zwei Pass-Karten mit Abzeichen, Preisvergleich als Balken.
- **Details:** 1-px-Lichtkanten, zwei Schattenstufen, Glas nur auf dem Hero und der dunklen Karte. Bewegung nur über `transform` und `opacity`, 200 ms, nur bei `prefers-reduced-motion: no-preference` und nur mit Maus (`hover: hover`). Die Datei `styles/startseite.css` enthält alles; Klassen beginnen mit `hs-` (kein `shadow-` im Namen, weil `white-mint.css` solche Klassen flach setzt).
- **«Nach oben»-Knopf:** Auf Telefonen (bis 639 px) erscheint er nur beim Hochscrollen und geht nach 2,2 s Ruhe wieder weg; rechts sitzt er 8 px vom Rand. Ab 640 px und im Arbeitsbereich bleibt das bisherige Verhalten (ab 400 px Scrollweg dauerhaft sichtbar). Die Regel steht in `lib/layout/nach-oben.ts` und ist getestet. Der Knopf ist im verborgenen Zustand `inert`, `aria-hidden` und `tabIndex=-1`.
- **Schweizer Schreibweise:** `ß` wird zu `ss` in zwei Texten von `lib/seo/final-homepage.ts` («fliessen», «einschliesslich») und im Menü-`aria-label` («Menü schliessen»). Im ausgelieferten Dokument der Startseite steht danach kein `ß` mehr (geprüft in sichtbarem Text und in `aria-label`, `alt`, `title`, `placeholder`).

## SEO- und KI-Schutz (Belege)

Messung mit `javascriptEnabled: false` auf dem Rohdokument, vorher gegen nachher (Skript `snapshot.mjs`/`vergleich.py`, Ergebnis in den Artefakten dieses PR):

- Titel, Canonical, `lang`, alle Meta-Angaben und das JSON-LD (Organization, WebSite) sind byte-gleich.
- 31 Überschriften H1–H6 in gleicher Menge und Schreibung (bis auf `ß`→`ss`), genau eine H1.
- Alle 4 FAQ-Fragen und -Antworten in gleicher Reihenfolge.
- Alle 112 Textblöcke von vorher stehen nachher im Haupttext; neu sind nur zwölf Beschriftungen der Illustrationen (Flug, Fähre, Nacht, Lücke, Lösung, Offizielle Quelle, Frist, Option A/B, Gepäck, Transfer, Übernachtung). Die Illustrationen sind `aria-hidden` und behaupten nichts: keine Zahlen, keine Preise, keine Länder, keine Fristen.
- Link-Ziele unverändert.

**Eine bewusste Abweichung:** Der Abschnitt «Eine Reise statt fünf getrennte Tools» (`HomeWerkzeuge`) steht jetzt im DOM vor «Du beschreibst deine Wünsche» (`HomeBegleitung`), weil er Teil des Bento-Rasters ist. Überschriftenmenge und Text sind gleich, nur diese zwei H2 tauschen die Reihenfolge.

## Messwerte

Lighthouse 13.6, lokal gegen den Production-Build, je drei Läufe (Median). Siehe PR-Beschreibung für die Tabelle. Zwei Befunde, die nicht aus diesem PR stammen:

- **SEO 69 vorher wie nachher:** Die ganze Site ist bewusst `noindex, nofollow` (Owner-Hold, ROADMAP). Das allein kostet die Lighthouse-Prüfung `is-crawlable`. Nicht geändert.
- **Mobil «simuliert» (Lantern):** Mit dem Foto als grösstem sichtbaren Element rechnet Lighthouse den LCP pessimistisch hoch (3,9 s statt 1,2 s). Der gemessene LCP bleibt bei etwa 0,15 s, mit echter Drosselung (DevTools) liegen vorher und nachher bei 98 und 97. Schon der Zustand vorher war nicht stabil: ein Lauf von drei fiel auf 89, sobald der LCP nicht gleichzeitig mit dem ersten Zeichnen lag.

## Bekannte Grenzen

- Grosse Schrift: Bei 200 % Systemschrift und breiter Ersatzschrift läuft nichts über (`lib/ui/white-mint-home-workspace-1/browser.test.ts`). Dafür sind die Masse der Illustrationen in `px` gesetzt (sie sind `aria-hidden` und dekorativ), Zusagen und Ortsmarke dürfen umbrechen.
- Kontrast: Der Text im Hero wurde Pixel für Pixel über dem Foto gemessen (hellste 5 % des Hintergrunds unter dem Text). Kleinster Wert 6,49:1 (H1, 1440 px), kleiner Text mindestens 6,81:1.
- Die Hero-Zusagen und alle Texte bleiben wörtlich; die Illustrationen sind rein dekorativ.
- Echte Geräte: Das Verhalten des Nach-oben-Knopfs wurde mit Playwright und Touch-Emulation geprüft (390 px), nicht auf einem physischen Telefon. Bis dahin gilt die Abnahme auf echter Hardware als offen.
- Entscheidung: ADR-0242 in `DECISIONS.md`; Arbeitsstand in `docs/ACTIVE_WORK_STATUS.md`. Beide Einträge sind erst nach dem Merge von #1277 ergänzt worden, damit sich die beiden PRs keine Datei teilen.
