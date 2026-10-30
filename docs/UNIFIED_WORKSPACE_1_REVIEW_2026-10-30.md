# Unified Workspace 1 – unabhängiger Review und Nacharbeit

Stand: 30.10.2026, Europe/Zurich. **Teilweise abgeschlossen; keine Ready-/Merge-Freigabe.**
PR: [#1092](https://github.com/Jetnity/jetnity/pull/1092).

## Zuständigkeit und geprüfte Versionen

Der Product Owner hat den bisherigen Writer-Chat zusätzlich als Technical Lead
für diesen Workspace-Umbau eingesetzt. Ein Root-Writer behebt Befunde; unabhängige
read-only Agents liefern Gegenprüfung, keine eigenen Änderungen oder Freigaben.
Anbieterarbeiten, STOP-/HOLD-/Product-Owner-Gates und die gestoppte Sites-
Veröffentlichung bleiben unverändert.

- Basis: `8e667661b490758b25bdd5be720421cea33fda9c`.
- Unabhängiger erster Review: `690c91832a971063396ed70c33d9bc7348e6f388`.
- Erste Korrekturen und zweiter unabhängiger Review: `4fdf1ac6365e9165afa9785aba7acf85e5fd0576`.
- Zweite Korrekturen und abschliessender unabhängiger Quell-/Gastreview:
  `1117b1cd9cb7ab0f2cc9b7c4e2360a3989eaeab3`.
- Geschützte Vorschau dieses Anwendungscodes: `dpl_3RKf4mC8ucX3dcE5NzxcyHUkCdbu`,
  READY, `https://jetnity-a8w3qqkie-jetnity-e1b93c82.vercel.app`.
  Vorschauprüfungen am 30.10.2026; Belege gesichert um **02:40 CET**.
- Lokaler neuer Browserlauf: `http://127.0.0.1:3472`, tatsächliche Next-Anwendung,
  synthetische Gastreise `/reisen/trip-unified-workspace-audit`.
- Ende der sechs Regressionsprüfungen: **30.10.2026 02:14:07 CET**.
  Wiederholter 19-Punkte-Audit: **02:12 CET**; nativer Zoom: **02:15:14 CET**.
- Frische isolierte Chrome-Kontexte; kein persönliches Profil importiert.
  Lokale Dummy-Backendadresse, keine Provider-/KI-/Datenbankaufrufe.

## Unabhängige Befunde und Korrekturen

| Priorität | Befund auf altem Head | Reproduktion und Korrektur |
|---|---|---|
| P2 | Kontomenü von klebender Rücksprungnavigation überlagert | Mobil: Organisieren → Flüge, scrollen, Kontomenü öffnen. Header lag unter der Rücksprungleiste. Header-Ebene angehoben, unterhalb des Drawers. Im neuen Voll-App-Lauf alle sichtbaren Links per Hit-Test und eine echte Navigation geprüft. |
| P2 | Lange Kontomenütexte laufen bei 200 % Schrift seitlich über | 320 px, Wurzelschrift 32 px, Kontomenü öffnen. Früher 254 px Breite / 329 px Inhalt. Jetzt Umbruch und bei starker Vergrösserung Menü im Fluss; neuer Inhalt 270/270 px, linke/rechte Kante 24/296 px. Datenschutzlink tatsächlich geöffnet. |
| P2 | Tastaturfokus springt nach Bereichswahl zurück zum Menü | Drawer öffnen, Vorbereitung per Enter wählen. Allgemeines Schliessen überschrieb den Ziel-Fokus. Jetzt getrennte Behandlung: Navigation lässt Ziel-Fokus bestehen, Escape/Schliessen und Wahl desselben Ziels kehren zum Auslöser zurück. Voll-App-Prüfung bestanden. |
| P3 | Sichtbare Beschriftung „Menü“ auf Telefonen verborgen | Beschriftung wieder sichtbar. Reisetitel erhält schmal eine eigene Zeile. Neue Prüfung kontrolliert Sichtbarkeit, Titelbreite und Seitenüberlauf bei 320 px. |
| P3 | Bestehender „Nach oben“-Knopf im neuen Rahmen verschwunden | Bestehende Komponente wieder im Rahmen, mit Abstand zur mobilen Navigation. Tatsächlicher Klick und Scrollposition 0 geprüft; Knopfunterkante 735 px, Navigationsoberkante 771 px. |
| P2 (zweiter Review) | Detail → gleicher Hauptbereich verliert ursprünglichen Rückkehrfokus | Organisieren → Flüge → Drawer → Organisieren per Enter. Gleiche Ansicht zählt bei offenem Detail als Navigation; der ursprüngliche Flüge-Auslöser erhält wieder den Fokus. Echter Browserlauf bestätigt das bestehende Verhalten. |
| P2 (zweiter Review) | Browser-Zurück lässt den Drawer offen und sperrt den neuen Inhalt | Meine Reisen → synthetische Reise → Menü öffnen → Browser-Zurück. Der Drawer wird bei Pfadwechsel zurückgesetzt; Inert-Zustand und Scroll-Sperre werden freigegeben. Zurück und Vorwärts im echten Verlauf geprüft. |
| Integrationsrisiko | Geometrieabfragen wählen zuerst unsichtbare Desktopnavigation | Alle Kandidaten werden dem bestehenden Sichtbarkeitsfilter übergeben. Mobile Navigation kennzeichnet zusätzlich ihren `bottom`-/`flow`-Zustand für den geteilten Geometrievertrag. |

Die ersten fünf Voll-App-Regressionsprüfungen schlugen vor den Korrekturen fehl
und bestanden danach. Der zweite unabhängige Review bestätigte 5/5 PASS auf
`4fdf1ac`, fand aber die zwei zusätzlichen P2-Fälle. Beide wurden reproduziert
und korrigiert; die erweiterte Suite besteht jetzt mit 6/6 PASS. Der Detailtest
erwartet bewusst den originalen Flüge-Auslöser, nicht einen neuen Fokusvertrag. Der Writer hat zusätzlich Screenshots angesehen: Ein zunächst
zu schmaler Reisetitel und ein nach links versetztes Kontomenü bei grosser Schrift
wurden vor dem letzten Lauf ebenfalls korrigiert. Diese Eigenprüfung ersetzt
die unabhängige Prüfung nicht. Der abschliessende read-only Review auf `1117b1cd`
bestätigt jetzt **keine offenen P0–P3-Befunde im geprüften Code-/Gast-UI-Umfang**:
6/6 Regressionen, 3/3 native Zoom-Szenarien und 35/35 gezielte Tests bestanden.
Das ist weiterhin keine Abnahme angemeldeter Konten oder physischer Geräte.

## Visueller Vorschau-Nachbefund

Die anschliessende Sichtprüfung des tatsächlichen Preview-Screenshots zeigte bei
320 px einen P3: „Vorbereitung“ brach trotz insgesamt passender Navigation nach
dem vorletzten Buchstaben um. Gemessen wurden 33 px Texthöhe bei 16,5 px
Zeilenhöhe. Die lokale Schriftmetrik zeigte diesen Fehler nicht; die vorherige
lokale Regression bestand daher bereits. Die vier Spalten werden jetzt mit
0,9 / 0,9 / 1,1 / 1,1 gewichtet. Beschriftungen, Schriftgrösse, Aktionen und
44-px-Bedienflächen bleiben erhalten; die vorhandenen Flusslayouts bei grosser
Schrift überschreiben diese Spalten weiterhin.

Nach dieser einzelnen CSS-Korrektur: neuer Production-Build/Typprüfung und
Skript-Lint PASS, 6/6 lokale Regressionen (mit ergänzter Wortumbruchprüfung)
und 3/3 echte Zoomprüfungen PASS. Neue unabhängige CSS-Prüfung und Prüfung des
neuen exakten Preview-Heads folgen. Frühere Preview-Belege bleiben ausdrücklich
an `1117b1cd` gebunden.

## Erhalt und Abgleich mit #1082

Der unabhängige Quellreview hat keinen Verlust von Fachlogik und keinen P0/P1
festgestellt. Beide Planungsformulare, „Jetzt wichtig“ mit weiteren Gruppen,
Reiseprüfung, originale Bearbeitungs-/Speicherhandler, URL-Verlauf, Konto-Grenzen
und Provider-Opt-ins bleiben in ihrem bisherigen Eigentümer. Echte Gast-Persistenz,
Titeländerung nach Bestätigung und Reload wurden erneut über die Anwendung geprüft.
Das ist kein Nachweis für angemeldete Kontoschreibpfade oder einen KI-Aufruf.

Beim ersten Abgleich mit #1082, Head `f2ff4928c551125b250706793195ee849fce0ce6`, war
nur `components/trips/TripWorkspace.tsx` gemeinsam geändert. Die Basen enthalten
dasselbe ursprüngliche Datei-Blob; die betroffenen Implementierungshunks sind
getrennt. Seit der Review-Korrektur ist zusätzlich `components/layout/BackToTop.tsx`
gemeinsam betroffen: #1092 ergänzt ein Datenattribut, #1082 erweitert die
Positionierung. Ein Konflikt ist dadurch nicht bewiesen; die spätere gemeinsame
Prüfung muss einen eindeutigen Abstandseigentümer berücksichtigen. Der neue Rahmen
verwirft oder übernimmt #1082 nicht.

Reihenfolge: erst den gemeinsamen Rahmen vollständig prüfen, danach die kompakte
Routen-/Detailarbeit gegen diesen Rahmen aktualisieren und gemeinsam testen.
Insbesondere alle 22 Tage, wiederholte Ziele, `kante`, Zurück/Weiter/Reload,
offene Bearbeitung und Fokusrückkehr müssen dann in `WorkspaceShell` laufen.
Das bisherige #1082-Harness verwendet ohne diesen Rahmen weiterhin die alte
Navigation. Sein PASS darf nicht als Abnahme der kombinierten Oberfläche gelten.

## Neue Prüfungen

| Prüfung | Ergebnis / Grenze |
|---|---|
| Wiederholter vollständiger Gast-Audit | **19/19 PASS**, Breiten 320/390/768/1440, vier Bereiche, Historie, Formulare, Gastschutz, echte Gast-Speicherung, Menü und Recht |
| Neue Review-Regressionsprüfungen | **6/6 PASS**, siehe Tabelle oben; keine Laufzeitfehler oder verbotenen Requests |
| Gezielte Quell-/Browsertests | **52/52 PASS**: Konto-Navigation, Workspace-Modi/-Bedienung, Mobile-Accessibility, Shell, bestehende Route-/Detail-Suite |
| Production-Build inklusive Typprüfung | PASS nach den abschliessenden UI-Korrekturen |
| Lint geänderter Komponenten/Skript | 0 Fehler; 3 vorhandene TripWorkspace-Warnungen (2 Effect-State, 1 Effect-Dependencies) |
| Hygiene | Dead-Code, Exports, Dependencies, API-Schutz und Schema-Bezug PASS; keine Migration |
| 200 % Text | Wurzelschrift 32 px; getrennt vom nativen Zoom geprüft |
| Echter Chrome-Zoom 200 % | **3/3 PASS**: Chrome-Einstellungsoberfläche, neue temporäre Profile; Fenster 1440/780/640 → CSS-Breiten 720/390/320, DPR 1→2, Wurzelschrift unverändert 16 px. Vier Bereiche, Menü, Fokus und Rechtslink geprüft. |
| Geschützte Vorschau `1117b1cd` | **10 eindeutige Prüfungen PASS**; 11 Versuche inklusive eines dokumentierten Synchronisationsfehlers des ersten Verlaufstests und erfolgreicher korrigierter Wiederholung |
| Authentifizierte Kontowege | **BLOCKED: Testkonto fehlt noch**; Preview-Verbindung und Build erfolgreich, normale Jetnity-Anmeldung erreichbar |
| VoiceOver / reale Mobilgeräte | **NICHT GEPRÜFT** |
| Gesamte Testsuite | In dieser Nacharbeit nicht erneut ausgeführt. Der erste lokale Gesamtlauf bleibt mit den dokumentierten 13 Fehlschlägen nicht grün; keine Umdeutung |

Der getrennte erste unabhängige Reviewer führte zusätzlich 31 Tests erfolgreich
aus. Diese Zahl wird nicht zu den 52 Nacharbeitstests addiert, da sich die Abdeckung
überschneidet. Die Browser-Audits hier sind wiederholbare Prüfungen des Writers. Die zusätzliche
abschliessende unabhängige Gegenprüfung ist getrennt oben und in ihren eigenen
Ergebnisdateien dokumentiert; Testzahlen werden nicht als disjunkte Abdeckung addiert.

**Grenze der Zoom-Screenshots:** Bei nativem Chrome-Zoom lieferte die automatische
PNG-Aufnahme einen Ausschnitt statt einer zuverlässigen vollständigen Ansicht.
Writer und unabhängiger Reviewer beobachteten das. Diese PNGs werden deshalb nicht
als visuelle Belege verwendet. Die tatsächlichen Bereichswechsel, Klicks, Fokus-
und Geometriemessungen sind im JSON dokumentiert. Normale Vorschau-Screenshots
und der getrennte Test mit 200 % Wurzelschrift sind davon nicht betroffen.

## Geschützte Vorschau / Konto-Prüfgrenze

Historischer Befund vor der freigegebenen Vorschaukonfiguration:

- Projekt `jetnity-app`, Team `jetnity-e1b93c82`.
- Deployment `dpl_4prSAe1esp1mn31qKUiRDe9Fcdau`, READY, exakt `690c9183…`.
- URL: `https://jetnity-9ohozp97e-jetnity-e1b93c82.vercel.app/account`.
- Authentifizierter Werkzeugabruf erreicht die Anwendung, aber diese antwortet
  mit **503 „Anmeldung derzeit nicht prüfbar“**. `noindex, nofollow` bleibt gesetzt.
- Dem Branch fehlen die beiden öffentlichen Supabase-Verbindungswerte in Preview.
  Es gibt keinen generischen Preview-Eintrag als Ersatz. Production-/Development-
  Werte werden nicht kopiert. Kein Schutz wurde abgeschaltet.

Supabase-Metadaten bestätigen die vorhandene Branch `develop`, Projekt
`yfvbxvijcorffwxbxahl`, als getrennt, nicht standardmässig und ACTIVE_HEALTHY.
Der Product Owner hat am 30.10.2026 ausdrücklich zugestimmt: „Ja, nur Vorschau
#1092 einrichten und prüfen“. Ausschliesslich `NEXT_PUBLIC_SUPABASE_URL` und
`NEXT_PUBLIC_SUPABASE_ANON_KEY` wurden für target `preview`, gitBranch
`codex/unified-workspace-navigation` angelegt. Beide Werte wurden über den
Einzelabruf zurückgelesen und intern mit dem bestehenden develop-URL/anon-Key
verglichen; Übereinstimmung bestätigt. Der Listenabruf lieferte trotz decrypt
noch verschlüsselte Werte und wurde nicht als Inhaltsnachweis gewertet.
Keine Werte im Bericht/Repository; keine Production-/Development-/fremden
Branch-Werte geändert, keine Service-/Provider-Schlüssel übertragen, keine
DB-/Auth-/RLS-Änderung.

**Aktueller Stand:** Der automatisch nach Push erstellte Preview-Build von
`1117b1cd` ist READY. `/account/settings` führt jetzt korrekt zu
`/login?next=/account/settings`, statt der früheren 503-Antwort. Die Prüfung
verwendet zwei neue isolierte Chrome-Kontexte: einen nur für die manuelle Anmeldung
mit einem develop-Testkonto, einen für künstliche Gastdaten. Persönliche Browser-
Cookies wurden nicht übernommen. Vercel-Zugriff erfolgt über eine befristete,
vom Connector erzeugte Freigabe; der Preview-Schutz bleibt aktiv. Zugangstokens
und Cookies werden weder dokumentiert noch veröffentlicht.

Auf diesem exakten Preview wurden Homepage, beide Planungswege, „Jetzt wichtig“,
alle vier Reisebereiche, Desktop-Symbolleiste, 320/390 px, Tastatur, Verlauf,
Bestätigung einer Gast-Titeländerung und Reload mit 3 Etappen/22 Tagen sowie
200 % Wurzelschrift geprüft. Zehn eindeutige Prüfungen bestanden. Ein erster
Verlaufsversuch wartete nicht auf den Zielinhalt und lief in ein Timeout; der
korrigierte Ablauf wartete auf die Reiseüberschrift und bestand Zurück/Vorwärts
einschliesslich freigegebenem Hintergrund. Kein zusätzlicher Produktfehler belegt.

Keine Browser-Laufzeitfehler und keine Provider-/KI-Requestversuche. Ausschliesslich
die Vercel-Vorschau-Toolbar wurde durch die bewusst enge Browser-Netzwerkregel
blockiert. Gastdaten blieben lokal. Die angemeldete Kontoprüfung ist weiterhin
offen, weil noch kein reines develop-Testkonto bestätigt und geprüft wurde. Nach
einem solchen Testkonto wurde gefragt; keine Production-Anmeldung oder
Auth-Umgehung als Ersatz.

Die funktionierende Gastoberfläche erlaubt keinen Schluss auf Konto, Logout,
Reisebegleiter-Backend oder vollständigen Datenerhalt in angemeldeten Konten.
Die Vorschau darf deshalb nicht als vollständiger Produkt-PASS gelten.

## Belege

- [Fehlgeschlagene Regressionen vorher](evidence/unified-workspace-1/review/before-results.json)
- [Korrekturen im Voll-App-Lauf](evidence/unified-workspace-1/review/after-results.json)
- [Zweite Review-Runde vor Korrektur](evidence/unified-workspace-1/review/second-round-before-results.json)
- [Nativer Chrome-Zoom 200 %](evidence/unified-workspace-1/review/native-zoom-results.json)
- [Unabhängige finale Regressionen](evidence/unified-workspace-1/review/independent-regressions.json)
- [Unabhängiger nativer Zoom](evidence/unified-workspace-1/review/independent-native-zoom.json)
- [Geschützte Vorschau: Ergebnisse und Grenzen](evidence/unified-workspace-1/preview/results.json)
- [Vorschau Desktop: Reiseplan](evidence/unified-workspace-1/preview/desktop-route.png)
- [Vorschau Smartphone 320 px: Vorbereitung](evidence/unified-workspace-1/preview/320-vorbereitung.png)
- [Wiederholter 19-Punkte-Audit](evidence/unified-workspace-1/review/full-results.json)
- [Kontomenü vorher überlagert](evidence/unified-workspace-1/review/menu-before.png)
- [Kontomenü nachher über der Rücksprungleiste](evidence/unified-workspace-1/review/menu-after.png)
- [320 px und 200 % Text, geöffnetes Kontomenü](evidence/unified-workspace-1/review/menu-text200.png)
- [320 px, beschriftetes Menü und lesbarer Titel](evidence/unified-workspace-1/review/320-overview.png)
- [Zurück nach oben mit Abstand zur Navigation](evidence/unified-workspace-1/review/back-to-top.png)

Alle Bilder enthalten ausschliesslich die synthetische Gastreise im isolierten
Browser. Keine persönlichen Sitzungen, Konto-/Bankdaten oder Zugangsdaten.

## Nächste Entscheidungen

Unabhängiger Quell-/Gastreview abgeschlossen. CI auf dem exakten Head noch prüfen;
danach angemeldete develop-Kontoprüfung sowie offene VoiceOver-/Geräteprüfungen.
Bis zum belegten
Abschluss bleibt #1092 Draft. Keine automatische Zusammenlegung mit #1082,
keine Provideraktivierung, kein Merge, kein Live-Deployment.
