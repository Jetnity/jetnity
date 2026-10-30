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
- Korrekturen: der Commit, der diesen Nachtrag und `review-regressions.mjs`
  einführt. Der exakte neue Hash wird im PR-Kommentar mit CI/Review verknüpft.
- Lokaler neuer Browserlauf: `http://127.0.0.1:3472`, tatsächliche Next-Anwendung,
  synthetische Gastreise `/reisen/trip-unified-workspace-audit`.
- Ende der Regressionsprüfung: **30.10.2026 01:56:51 CET**.
  Ende des wiederholten 19-Punkte-Audits: **01:56:55 CET**.
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
| Integrationsrisiko | Geometrieabfragen wählen zuerst unsichtbare Desktopnavigation | Alle Kandidaten werden dem bestehenden Sichtbarkeitsfilter übergeben. Mobile Navigation kennzeichnet zusätzlich ihren `bottom`-/`flow`-Zustand für den geteilten Geometrievertrag. |

Die fünf neuen Voll-App-Regressionsprüfungen schlugen vor den Korrekturen fehl
und bestehen danach. Der Writer hat zusätzlich Screenshots angesehen: Ein zunächst
zu schmaler Reisetitel und ein nach links versetztes Kontomenü bei grosser Schrift
wurden vor dem letzten Lauf ebenfalls korrigiert. Diese Eigenprüfung ersetzt
die erneute unabhängige Prüfung des neuen Commits nicht.

## Erhalt und Abgleich mit #1082

Der unabhängige Quellreview hat keinen Verlust von Fachlogik und keinen P0/P1
festgestellt. Beide Planungsformulare, „Jetzt wichtig“ mit weiteren Gruppen,
Reiseprüfung, originale Bearbeitungs-/Speicherhandler, URL-Verlauf, Konto-Grenzen
und Provider-Opt-ins bleiben in ihrem bisherigen Eigentümer. Echte Gast-Persistenz,
Titeländerung nach Bestätigung und Reload wurden erneut über die Anwendung geprüft.
Das ist kein Nachweis für angemeldete Kontoschreibpfade oder einen KI-Aufruf.

Beim Abgleich mit #1082, Head `f2ff4928c551125b250706793195ee849fce0ce6`, ist nur
`components/trips/TripWorkspace.tsx` gemeinsam geändert. Die Basen enthalten
dasselbe ursprüngliche Datei-Blob; die betroffenen Implementierungshunks sind
getrennt. Der neue Rahmen verwirft oder übernimmt #1082 nicht.

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
| Neue Review-Regressionsprüfungen | **5/5 PASS**, siehe Tabelle oben; keine Laufzeitfehler oder verbotenen Requests |
| Gezielte Quell-/Browsertests | **52/52 PASS**: Konto-Navigation, Workspace-Modi/-Bedienung, Mobile-Accessibility, Shell, bestehende Route-/Detail-Suite |
| Production-Build inklusive Typprüfung | PASS nach den abschliessenden UI-Korrekturen |
| Lint geänderter Komponenten/Skript | 0 Fehler; 3 vorhandene TripWorkspace-Warnungen (2 Effect-State, 1 Effect-Dependencies) |
| Hygiene | Dead-Code, Exports, Dependencies, API-Schutz und Schema-Bezug PASS; keine Migration |
| 200 % Text | Wurzelschrift 32 px; kein nativer Browserzoom |
| Authentifizierte Kontowege | **BLOCKED in der Vorschau**, noch keine zulässige Testkonfiguration |
| VoiceOver / reale Mobilgeräte / nativer Zoom | **NICHT GEPRÜFT** |
| Gesamte Testsuite | In dieser Nacharbeit nicht erneut ausgeführt. Der erste lokale Gesamtlauf bleibt mit den dokumentierten 13 Fehlschlägen nicht grün; keine Umdeutung |

Der getrennte erste unabhängige Reviewer führte zusätzlich 31 Tests erfolgreich
aus. Diese Zahl wird nicht zu den 52 Nacharbeitstests addiert, da sich die Abdeckung
überschneidet. Die Browser-Audits hier sind wiederholbare Prüfungen des Writers.

## Geschützte Vorschau / Konto-Prüfgrenze

Read-only bei Vercel geprüft:

- Projekt `jetnity-app`, Team `jetnity-e1b93c82`.
- Deployment `dpl_4prSAe1esp1mn31qKUiRDe9Fcdau`, READY, exakt `690c9183…`.
- URL: `https://jetnity-9ohozp97e-jetnity-e1b93c82.vercel.app/account`.
- Authentifizierter Werkzeugabruf erreicht die Anwendung, aber diese antwortet
  mit **503 „Anmeldung derzeit nicht prüfbar“**. `noindex, nofollow` bleibt gesetzt.
- Dem Branch fehlen die beiden öffentlichen Supabase-Verbindungswerte in Preview.
  Es gibt keinen generischen Preview-Eintrag als Ersatz. Production-/Development-
  Werte werden nicht kopiert. Kein Schutz wurde abgeschaltet.

Supabase-Metadaten weisen die vorhandene Branch `develop` als getrennt und nicht
standardmässig aus. Noch keine Schlüssel abgerufen, Daten gelesen, Testkonten
angelegt oder Einstellungen verändert. Für ausschliesslich diese Preview-Anbindung
ist die zusätzliche Zustimmung angefragt. Noch nicht erteilt zum Zeitpunkt dieses
Nachtrags. Es wird keine erneute Vercel-Anmeldung als Voraussetzung behauptet.

Die funktionierende Gastoberfläche erlaubt keinen Schluss auf Konto, Logout,
Reisebegleiter-Backend oder vollständigen Datenerhalt in angemeldeten Konten.
Die Vorschau darf deshalb nicht als vollständiger Produkt-PASS gelten.

## Belege

- [Fehlgeschlagene Regressionen vorher](evidence/unified-workspace-1/review/before-results.json)
- [Korrekturen im Voll-App-Lauf](evidence/unified-workspace-1/review/after-results.json)
- [Wiederholter 19-Punkte-Audit](evidence/unified-workspace-1/review/full-results.json)
- [Kontomenü vorher überlagert](evidence/unified-workspace-1/review/menu-before.png)
- [Kontomenü nachher über der Rücksprungleiste](evidence/unified-workspace-1/review/menu-after.png)
- [320 px und 200 % Text, geöffnetes Kontomenü](evidence/unified-workspace-1/review/menu-text200.png)
- [320 px, beschriftetes Menü und lesbarer Titel](evidence/unified-workspace-1/review/320-overview.png)
- [Zurück nach oben mit Abstand zur Navigation](evidence/unified-workspace-1/review/back-to-top.png)

Alle Bilder enthalten ausschliesslich die synthetische Gastreise im isolierten
Browser. Keine persönlichen Sitzungen, Konto-/Bankdaten oder Zugangsdaten.

## Nächste Entscheidungen

Erneute unabhängige Prüfung und CI auf dem neuen exakten Head, danach zulässige
Konto-/Preview-Prüfung sowie die offenen Zoom-/Geräteprüfungen. Bis zum belegten
Abschluss bleibt #1092 Draft. Keine automatische Zusammenlegung mit #1082,
keine Provideraktivierung, kein Merge, kein Live-Deployment.
