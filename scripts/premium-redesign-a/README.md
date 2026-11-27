# Premium-Redesign PR A – aktuelle Prüfskripte

Diese Skripte prüfen den Stand von PR A gegen einen lokalen Production-Build (`next build` und `next start`) mit synthetischen Reisen aus `fixtures.ts`. Kein Produktionszugriff, keine Anmeldung, keine Kundendaten, keine externen Dienste. Sie gehören nicht zur Pflicht-CI und ersetzen kein echtes iPhone, kein VoiceOver und kein TalkBack (OFFEN).

Jede Messung steht als PASS, FAIL oder OFFEN im Protokoll. Ein nicht gemessener Wert ist nie PASS. Die Kontrastgrenze ist 4,5 : 1 für alle sichtbaren Texte, auch für grosse Schrift, und wird ungerundet verglichen.

| Skript | Prüft | Ausgabe |
|---|---|---|
| `abnahme.mjs` | alle Ansichten (Startseite, Profil, Reiseplan, Organisieren, Vorbereitung, Einreise, Übersicht, Konto) in Chromium und WebKit, 320/390/430/1440 px, hell und dunkel, 100/150/200 % Schrift: Überlauf, Kopfzeilen-Höhe, Kontrast (`kontrast.mjs`), Reisekopf | PNG je Zustand, `messwerte.json` |
| `kostenkarte.mjs` | W3-Kostenkarte: Überlauf 0 px und jeder Betrag vollständig sichtbar und unverändert, geschlossen und geöffnet, Gast und Konto, zwei Reisen (üblich, sehr lange Beträge) | PNG, `kostenkarte-<label>.json` |
| `dunkelstart.mjs` | Dunkelstart bei verzögerter Hydration für Kopfzeile, Inhalt und Bildnachweis mit ausdrücklicher Geltung (Arbeitsbereich dunkel, öffentliche Seiten hell). Bildtexte, die vor der Hydration nur gezählt werden können, werden zusätzlich **vor der Hydration an den Pixeln gemessen** (Seitenskripte nicht ausgeliefert; einmal mit geladenem Bild, einmal ohne Bilder), mit Liste der gemessenen Einzeltexte, geforderten Bildtexten je Seite und FAIL für jeden gezählten, aber nicht gemessenen Bildtext. Selbsttest, Negativkontrolle (helle Fläche) und Pixel-Negativkontrolle (Text mit zu geringem Kontrast über dem echten Bild) | Protokoll, `dunkelstart.json` |
| `kopf-kontrast.mjs` | Kontrast aller Texte im Reisekopf auf jedem freigegebenen Reisebild (schlechtester Pixel je Zeile) | Protokoll, JSON |
| `bildlizenz.mjs` | Herkunfts-Gate: nur die Allowlist der KI-Illustrationen (`.png`) wird angefragt und gezeigt; Zermatt neutral; kein alter `.jpg`-Pfad angefragt; sichtbarer Hinweis «KI-Illustration», Alt-Text, Open Graph, Twitter, JSON-LD (kein Ortsfoto-Anspruch, das abgeleitete Vorschaubild `hero-bali-og.jpg` als JPEG 1200 × 630 unter 300 KB mit echtem Dateikopf, Inhaltstyp und Gewicht; nie im sichtbaren Bild), ausgelieferte Dateien (Status, Inhaltstyp, Dateikopf, SHA-256 gegen den Nachweis), 404 der alten `.jpg`-Adressen, zentrale Liste `/datenquellen` mit sechs Nachweisen; Chromium und WebKit, 390/1440 px, hell und dunkel. Negativkontrolle: gegen einen Build von `main` (alte Dateinamen, 2,4-MB-PNG als Open-Graph-Bild) scheitern alle 24 Läufe | Protokoll, `bildlizenz.json` |
| `og-bild.mjs` | erzeugt das abgeleitete Vorschaubild `public/images/hero-bali-og.jpg` lokal aus dem unveränderten Original `hero-bali.png` (sharp: Ausschnitt, Skalierung 1200 × 630, eingebrannter Hinweis «KI-Illustration», höchste JPEG-Güte unter 270000 Bytes); `--pruefen` schreibt nichts und prüft Format, Abmessungen und Gewicht der vorhandenen Datei. Keine Bildgenerierung, kein Provider | Datei, Protokoll (Quelle und Ergebnis mit Prüfsummen) |
| `zermatt-uebergabe.mjs` | Dev-Nachweis der Planungs-Übergabe: Zermatt übergibt `geonames:2657928`, nie `2657915` (Zofingen); Startseite, Entdecken, Planung gegen einen Loopback-Fixture aus `lib/places/fixtures/geonames.tsv`, Kontrolle mit der alten Kennung, Ausfall der Ortsquelle. Braucht einen eigenen Build mit Fixture-Adresse (Aufruf im Skriptkopf) | Protokoll, `zermatt-uebergabe.json` |
| `preview-abnahme.mjs` | Abnahme eines **echten** Preview- oder Production-Builds im Browser, ohne Fixture und Mock: Startseite → Zermatt → `/planen?zielId=geonames%3A2657928` (Zermatt im Zielfeld, keine Reise angelegt), Kontrolle `2657915` = Zofingen, `/reisen` (Gast), `/account` und die drei Unterpfade bleiben geschützt (Weiterleitung zur Anmeldung); Chromium und WebKit, 390/1440 px, hell und dunkel; zusätzlich zum Status der sichtbare Text auf Fehlermarken (Digest, «Application error», fehlende Supabase-Variablen), denn eine Fehlerseite kann HTTP 200 liefern; die Anfrage-Kennung `x-vercel-id` je Aufruf für das Laufzeitprotokoll; optional Video (`--video`). Schutzschlüssel einer geschützten Vorschau nur aus der Umgebung (`PREVIEW_BYPASS_SECRET`, `PREVIEW_SHARE_TOKEN`), nie ausgegeben; `--lokal-tls` nur für den lokalen TLS-Vorsatz. Ersetzt keinen Work-Test auf dem iPhone | Protokoll, `preview-abnahme.json`, PNG |
| `interaktion.mjs` | Menü, Darstellung, «Reise ändern», «Begleiter», Profilmenü, Tastatur, 320/430 px, 200 % Schrift, reduzierte Bewegung, Konsole | Protokoll |

Hilfsmodule:

| Datei | Zweck |
|---|---|
| `kontrast.mjs` | Kontrastmessung: einfarbiger Grund aus der gemischten Hintergrundfarbe, Bildgrund pixelgenau an den Buchstabenpixeln (drei Aufnahmen: ohne Text, schwarzer Text, weisser Text) |
| `fixtures.ts` | synthetische Reisen (`thailand`, `lissabon`, `kosten`) |
| `konto-harness.mjs` | Prüfstand für `/account` und `/reisen/konto` mit den echten Komponenten (die Route liegt hinter der Anmeldung und wird nicht umgangen); liest das CSS beim Start, nach CSS-Änderungen neu starten |
| `tls-proxy.mjs` | TLS-Vorsatz für WebKit (der Build sendet `upgrade-insecure-requests`; die CSP bleibt unverändert) |

## Historische Audit-Skripte

Die folgenden Skripte prüfen frühere Stände und suchen Bedienelemente, die mit PR A entfallen sind («Navigation öffnen», «Menü öffnen», `[data-workspace-aktionen]`, Kostenleiste, Hell/Dunkel in der Kopfzeile). Sie sind als historisch gekennzeichnet und nicht an PR A angepasst, ausser wo ein Ablauf am 27.11. gebraucht wird:

- `scripts/unified-workspace-1/*.mjs`
- `scripts/ux-u1a3-header-density-1/audit.mjs`
- `scripts/trip-workspace-premium-experience-3-audit.mjs`
- `scripts/final-homepage-premium-experience-2-audit.mjs`
- `scripts/mobile-accessibility-1-audit.mjs` (Menü-Knopf an «Menü» angepasst, sonst Stand der Entstehung)

Für den aktuellen Stand gelten die Skripte der Tabelle oben.
