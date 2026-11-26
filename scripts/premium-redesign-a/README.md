# Premium-Redesign PR A – aktuelle Prüfskripte

Diese Skripte prüfen den Stand von PR A gegen einen lokalen Production-Build (`next build` und `next start`) mit synthetischen Reisen aus `fixtures.ts`. Kein Produktionszugriff, keine Anmeldung, keine Kundendaten, keine externen Dienste. Sie gehören nicht zur Pflicht-CI und ersetzen kein echtes iPhone, kein VoiceOver und kein TalkBack (OFFEN).

Jede Messung steht als PASS, FAIL oder OFFEN im Protokoll. Ein nicht gemessener Wert ist nie PASS. Die Kontrastgrenze ist 4,5 : 1 für alle sichtbaren Texte, auch für grosse Schrift, und wird ungerundet verglichen.

| Skript | Prüft | Ausgabe |
|---|---|---|
| `abnahme.mjs` | alle Ansichten (Startseite, Profil, Reiseplan, Organisieren, Vorbereitung, Einreise, Übersicht, Konto) in Chromium und WebKit, 320/390/430/1440 px, hell und dunkel, 100/150/200 % Schrift: Überlauf, Kopfzeilen-Höhe, Kontrast (`kontrast.mjs`), Reisekopf | PNG je Zustand, `messwerte.json` |
| `kostenkarte.mjs` | W3-Kostenkarte: Überlauf 0 px und jeder Betrag vollständig sichtbar und unverändert, geschlossen und geöffnet, Gast und Konto, zwei Reisen (üblich, sehr lange Beträge) | PNG, `kostenkarte-<label>.json` |
| `dunkelstart.mjs` | Dunkelstart bei verzögerter Hydration für Kopfzeile, Inhalt und Bildnachweis mit ausdrücklicher Geltung (Arbeitsbereich dunkel, öffentliche Seiten hell), Selbsttest und Negativkontrolle | Protokoll, `dunkelstart.json` |
| `kopf-kontrast.mjs` | Kontrast aller Texte im Reisekopf auf jedem freigegebenen Reisebild (schlechtester Pixel je Zeile) | Protokoll, JSON |
| `bildlizenz.mjs` | Lizenz-Gate: keine der fünf gesperrten Dateien im Netzwerk, im DOM, in Metadaten oder JSON-LD | Protokoll, `bildlizenz.json` |
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
