# Unified Workspace 1 – Übergabe an den Technical Lead

Der vom Product Owner gewünschte gemeinsame Konto-/Trip-Rahmen ist auf
`codex/unified-workspace-navigation` implementiert, Basis
`8e667661b490758b25bdd5be720421cea33fda9c`. Es wurde nichts veröffentlicht.

**Review-Fortsetzung 30.10.2026:** Dieser Work/Codex-Chat übernimmt auf ausdrücklichen
Wunsch des Product Owners die Technical-Lead-Rolle für #1092. Zwei unabhängige
read-only Reviews haben auf `690c9183` UI-Regressionsbefunde geliefert; der Root-
Writer hat sie behoben. Neuer lokaler Voll-App-Lauf: **25/25 PASS**, 52 gezielte
Tests PASS, Build PASS; zusätzlich 3/3 echte Chrome-Zoom-Szenarien PASS. Erneute unabhängige Prüfung/CI auf dem neuen Commit bleiben
vor Gesamtfreigabe erforderlich. [Vollständiger Review-Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md).

Vercel-Zugriff funktioniert. Das exakte bisherige Preview von `690c9183` antwortet
unter `/account` mit 503 „Anmeldung derzeit nicht prüfbar“; diesem Branch fehlt
eine Preview-Testkonfiguration. `develop` ist als getrennte Testbranch identifiziert.
Der Product Owner hat die beiden öffentlichen Verbindungswerte nur für dieses
Preview freigegeben. Sie wurden für develop gesetzt und intern zurückgelesen.
Neuer Preview-Build und Konto-Prüfung folgen. Kein Production-Fallback.

## Was der Besucher erhält

Grüne einklappbare Seitenleiste, Namen bei Hover und Tastaturfokus, schmaler
Header mit vorhandenen Reiseaktionen, Kontomenü und eigenständige Mobilnavigation.
Homepage, „Jetzt wichtig“, beide vollständigen Planungswege, Reiseprüfung,
gespeicherte Reise und Freigabegrenzen bleiben erhalten. Keine fachliche
Funktion wurde durch eine Attrappe ersetzt. Beispielreisen im Prüfbericht sind
ausschliesslich synthetische Daten des echten Gast-Workspace.

## Prüfergebnis

- Lokaler Production-Build, Typecheck, Lint und Hygieneprüfungen bestanden.
- 19/19 Browserprüfungen: Desktop, 320/390/768 px, Tastatur, 200 % Wurzelschrift,
  Modus/Deep Link/Zurück/Reload, Gast-Punkt speichern, Reiseänderung erst nach
  Bestätigung, Erhalt von 3 Etappen und 22 Tagen, Auth-Weiterleitung.
- 124/124 gezielte Tests sowie 17/17 vorhandene Route-/Detail-Browsertests im
  Einzelaufruf bestanden.
- **Gesamtlauf nicht grün:** 11 fehlende lokale PostgreSQL-Tests, 1 auch am
  unveränderten Basis-Commit reproduzierter Geometrie-Timeout und 1 beendeter
  Browser-Testprozess (nachher separat 17/17 PASS). Details und Belege im Report.
- Angemeldeter Konto-Workspace, echte Testdatenbank, KI-Backend sowie
  VoiceOver-/Geräteprüfung sind noch nicht abgenommen. Echter Chrome-Zoom wurde
  lokal separat geprüft; er ersetzt keine Prüfung physischer Geräte.

## Erforderliche Fortsetzung

1. Vollständigen Diff und aktuellen Commit unabhängig prüfen; insbesondere
   gemeinsamen Rahmen, ursprüngliche Aktionen, Konto-/Gastgrenzen und A11y.
2. Überschneidung mit dem offenen PR #1082 abgleichen. Keine automatische
   Übernahme oder stilles Verwerfen einer der Arbeiten. Erster unabhängiger Abgleich
   abgeschlossen: nur `TripWorkspace.tsx` gemeinsam, keine überlappenden Hunks.
   Nach der Review-Korrektur ist zusätzlich `BackToTop.tsx` gemeinsam betroffen
   (in #1092 nur Datenattribut); der Geometrievertrag bleibt gemeinsam zu prüfen.
   Reihenfolge: gemeinsamen Rahmen abnehmen, danach #1082 gegen diesen Rahmen
   aktualisieren und in der echten kombinierten Oberfläche prüfen.
3. CI und geeignete geschützte Testvorschau auf dem geprüften Commit abnehmen.
   Konto-/Reiseseiten mit zulässigen Testkonten prüfen; keinen Zugriffsschutz
   umgehen und keine Production-Schreibtests einführen.
4. Alle bestehenden STOP-/HOLD-/Product-Owner-Gates weiter einhalten. Die
   Anbieter-PRs #1084/#1086/#1079/#1091 wurden hier nicht freigeschaltet.
5. Erst der Technical Lead entscheidet nach unabhängiger Abnahme über Ready,
   Merge, Deployment und die Aktualisierung des gemeinsamen Checkpoints #751.

## Unterlagen

- [Auftrag und Erhaltungsmatrix](UNIFIED_WORKSPACE_1_TASK_2026-10-30.md)
- [Vollständiger Report und Screenshots](UNIFIED_WORKSPACE_1_REPORT_2026-10-30.md)
- [Selbstprüfung](UNIFIED_WORKSPACE_1_SELF_REVIEW_2026-10-30.md)
- `scripts/unified-workspace-1/audit.mjs` und `fixture.mjs`

Einzige externe Änderung: zwei ausdrücklich freigegebene Vercel-Preview-Werte
nur für #1092 und die vorhandene develop-Testbranch. Datenbankstruktur,
Auth/RLS, Anbieter-Schlüssel und Live-Stand bleiben unverändert.
