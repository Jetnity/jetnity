# Unified Workspace 1 – Abschlussprüfung und Veröffentlichung

30.10.2026, Europe/Zurich. PR [#1092](https://github.com/Jetnity/jetnity/pull/1092).
Stand dieses Receipts: **Veröffentlichung beauftragt, technische Freigabe noch offen.**
Historische Prüfungen bleiben in Review/Handoff und Visual Alignment dokumentiert.

## Version und Umfang

- Anwendung vor Abschlusskorrektur: `420258dd6722e7079faa8180eb9f6030cb946601`.
- Aktuelles main `d929c6416b1b9349bfe2a3d4a097181c77fd1816` regulär im Branch
  zusammengeführt: Merge-Commit `52f8482a29f607822c38e271a5b18457ee328bca`.
  Keine Konflikte; Anwendungspfade app/components/lib/public/styles waren danach
  gegenüber 420258dd unverändert. Keine Übernahme von PR #1082.
- Einzige anschliessende Runtime-Korrektur: eng begrenzte CSS-Regeln für den
  geöffneten Reisebegleiter. Bei 320 px und 200 % Text wurden lange Wörter und
  Schaltflächen zuvor abgeschnitten. Grid-Minimalbreite, Textumbruch und flexible
  Knopfhöhe beheben dies ohne Handler-/Request-/Speicheränderung.
- „Reise ändern“ und „Reisebegleiter fragen“ verwenden die bestehenden Handler
  im neuen Header. Der Begleiter bleibt auf die bisher unterstützten Kontoreisen
  beschränkt; keine neue Gast-KI-Fähigkeit.

## Abgeschlossene Prüfungen

- [CI auf 420258dd](https://github.com/Jetnity/jetnity/actions/runs/41040719861):
  SUCCESS, 7.656 PASS, 0 FAIL, 2 SKIP. Die früher dokumentierten lokalen
  Umgebungsausfälle bleiben historische Ergebnisse und werden nicht umgedeutet.
- Neuer lokaler Production-Build nach main-Synchronisierung und CSS-Korrektur:
  PASS, ausschliesslich Dummy-Backendwerte. Lokale Anwendung `http://127.0.0.1:3472`.
- Erneuter visueller Gastlauf: sechs Prüfgruppen PASS; Hierarchie, tatsächliche
  Tagesnavigation, wiederholte Ziele/offene Tage, Fokus, 320/390/768 px und
  200 % Wurzelschrift sowie explizit synthetische Farbproben.
- Unabhängige Nachprüfung des echten Reisebegleiters mit synthetischer
  Audit-Kontoreise: sieben Konstellationen (320/390/768/1440 px bei normalem Text;
  320/390/1440 px bei 200 % Wurzelschrift) jeweils Funktion und Darstellung PASS.
  Beide Headerknöpfe, Tastatur, Fokus/Rückkehr, Eingabeerhalt und Moduswechsel
  erhalten. Geöffnet bei 320/200: Dokument 320 px, Formular 272 px,
  null überstehende Textfragmente. Nichts wird zur Fehlerkaschierung verborgen.
- Keine KI-/Provider-/POST-Aufrufe oder Laufzeitfehler in diesen lokalen Läufen.
  Diese Audit-Kontoreise ersetzt keine echte Auth-/Persistenzprüfung.
- Unabhängiger Überschneidungsreview: keine aktuellen Konflikte mit main.
  PR #1082 muss nach einem Merge von #1092 neu angepasst und geprüft werden;
  dessen zusätzliche reiseoptionen-Prop darf nicht ungeprüft übernommen werden.

## Noch erforderliche Abschlussbelege

1. Neues exaktes PR-Head-Receipt mit GitHub-CI und zugehörigem READY-Preview.
2. Anmeldung in der getrennten develop-Testumgebung und echte synthetische
   Kontoreise: Anlegen, Wiederladen, Bearbeiten, Header-Aktionen und Kontonavigation.
3. Erst danach normaler geschützter Merge; Production-Build aus main mit dessen
   Production-Konfiguration, kein Promoten des develop-Previews.
4. Nach Merge: Live-Commit/Deployment, Homepage und Workspace mit Gastdaten
   erneut prüfen. Keine Production-Kontoreise schreiben.

Keine Anbieterfreigabe, Schema-/Auth-/RLS-Änderung, Buchung oder Zahlung.
Physische Geräte, VoiceOver und KI-Antwortqualität sind nicht Gegenstand dieses
Darstellungsnachweises. Bestehende besondere Gates bleiben bestehen.

## Belege

- [Unabhängige Funktions-/Umbruchprüfung](evidence/unified-workspace-1/release/companion-wrap-results.json)
- [Geöffneter Reisebegleiter, 320 px/200 % Text](evidence/unified-workspace-1/release/companion-320-200.png)
- [Beide Headeraktionen, 320 px/200 % Text](evidence/unified-workspace-1/release/header-320-200.png)
- [Erneuter visueller Gastlauf](evidence/unified-workspace-1/release/visual-results.json)
