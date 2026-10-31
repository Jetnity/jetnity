# Unified Workspace – Abgleich der echten Anwendung mit dem Entwurf

30.10.2026, Europe/Zurich. Nacharbeit im bestehenden PR #1092 gegen
`6a961a6fc67a090cbf35fb997eece7563b2b117d`. Die bisherige technische Prüfung
des Navigationsrahmens war kein Nachweis für die vollständige visuelle Umsetzung.
Der Owner hat die verbleibende Abweichung ausdrücklich beanstandet.

## Ergebnis und Umfang

Die echte Gastanwendung enthält jetzt den kompakten Reisekopf, die grüne
Inhaltsgestaltung und ein durchgehendes Jetzt-wichtig-Panel. Die unveränderte
Reiseprüfung sitzt darin als Fussbereich. Darunter führt eine kompakte Route
in den vorhandenen Tagesplan; die Bereichseinstiege folgen als „Gut organisiert“.
Die Zielinformationen bleiben vollständig darunter erreichbar.

Der Reisekopf zeigt echte Daten einschliesslich Speicherstatus, offenen Angaben
und Löschaktion. Der Überblick erfindet keine Landeszahlen, bestätigten Buchungen,
Reisedaten oder geografischen Karten aus dem Designmuster. Die Route stammt aus
`chronologischeLaeufe`, bewahrt wiederholte Aufenthalte und offene Zuordnungen
und öffnet den ersten tatsächlich zugehörigen Tag mit dem bestehenden Handler.
Beide vollständigen Planungswege und alle Aufmerksamkeit-/Prüfgrenzen bleiben.

Neue Palette ausschliesslich unter `.workspace-shell`; die Homepage bleibt hell
und unverändert. Karten, Leerzustände, Sicherheitsformulare und Fehler verwenden
zusammenpassende Vorder-/Hintergrundfarben. Anbieterframes werden nicht umgefärbt.
Keine neue API, Abhängigkeit, Datenbank-/Authänderung, Provideraktivierung oder
laufende Kosten. Keine Änderung der vorher freigegebenen Preview-Konfiguration.

## Prüfung dieses Standes

- Lokaler Production-Build und TypeScript PASS.
- Gezielter ESLint: 0 Fehler; 3 bereits vorhandene Hook-Warnungen in TripWorkspace.
- 85/85 gezielte Tests, einschliesslich Chronologie, Audit, Präferenzen,
  Reisebegleiter-/Kontogrenzen und vorhandener Chronologie-Browsertests PASS.
- 19/19 echte Gastoberflächen-Prüfungen und 6/6 bestehende Review-Regressionen PASS.
- 6/6 zusätzliche Prüfgruppen: kompakte Hierarchie, tatsächlicher Tageswechsel
  ohne Gastdatenänderung, wiederholtes Ziel/offene Zuordnung, sichtbarer Innenfokus,
  320/390/768 px und 200 % Wurzelschrift, kontrastierende CSS-Zustandspaare PASS.
- 3/3 native Chrome-Zoomprüfungen bei 200 % PASS (Fensterbreite 1440/780/640,
  effektive CSS-Breite 720/390/320). Wurzelschrift unverändert; kein CSS-Zoom.
- Kein Laufzeitfehler und kein KI-/Providerrequest in diesen Läufen.

Alle Läufe verwenden frische isolierte Chrome-Kontexte und künstliche Gastdaten
auf `http://127.0.0.1:3472`. Die CSS-Proben für Konto-/Sicherheitskarten waren
synthetische DOM-Komponentenproben und sind ausdrücklich keine Kontofunktionsprüfung.
Browserprüfungen und Unit-/Integrationstests überschneiden sich.

## Unabhängiger Review

Read-only Reviewer `workspace_source_review` prüfte Quelle und echten Gast-UI.
Vier P2-Gruppen wurden vor Abschluss korrigiert und unabhängig nachgeprüft:
zu dunkle Fehlertexte, helle Restflächen bei aufgehelltem Text, schwacher
Nach-oben-Pfeil sowie durch Zeilenclipping verdeckter Tastaturfokus.
Fehlertext erreicht rund 5,59:1, Nach-oben 13,09:1. Innenfokus 3 px sichtbar.
Route → richtiger Tag, Übersicht → sichtbares h1, zusätzliche unavailable-Hinweise
und Audit-Grenzen bei 320 px/200 % Text bestätigt. Keine offenen P0–P3 aus der
Nacharbeit im geprüften Umfang. Ein zunächst vermutetes Klickproblem wurde als
Testlocator auf den absichtlich inaktiven Modalhintergrund verworfen.

## Belege

- [Desktop – echte Reiseübersicht](evidence/unified-workspace-1/alignment/desktop-overview.png)
- [Smartphone 390 px](evidence/unified-workspace-1/alignment/phone-390.png)
- [Beide Planungswege im neuen Rahmen](evidence/unified-workspace-1/alignment/desktop-planen.png)
- [Sichtbarer Tastaturfokus](evidence/unified-workspace-1/alignment/attention-focus.png)
- [Visueller Abgleich und Kontrastwerte](evidence/unified-workspace-1/alignment/visual-results.json)
- [19-Punkte-Gastprüfung](evidence/unified-workspace-1/alignment/full-results.json)
- [Sechs Regressionen](evidence/unified-workspace-1/alignment/regression-results.json)
- [Nativer 200-%-Zoom](evidence/unified-workspace-1/alignment/native-zoom-results.json)
- [Unabhängige Nachprüfung](evidence/unified-workspace-1/alignment/independent-results.json)

## Grenzen und Freigabe

Angemeldete Kontoflüsse benötigen weiterhin ein reines develop-Testkonto.
Physische Geräte und VoiceOver bleiben ungeprüft. Die früher dokumentierten
Grenzen des Gesamttestlaufs bleiben bestehen; dieser Nachtrag behauptet keinen
neuen vollständigen Suite-PASS. #1082 muss vor einem gemeinsamen Merge gegen den
neuen Rahmen geprüft werden. PR #1092 bleibt Draft, keine Merge-/Livefreigabe.
Exakter veröffentlichter Head, CI und Preview-Nachprüfung folgen im PR-Receipt.
