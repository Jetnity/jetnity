# Unified Workspace 1 – Übergabe an den Technical Lead

Der vom Product Owner gewünschte gemeinsame Konto-/Trip-Rahmen ist auf
`codex/unified-workspace-navigation` implementiert, Basis
`8e667661b490758b25bdd5be720421cea33fda9c`. Es wurde nichts veröffentlicht.

**Review-Fortsetzung 30.10.2026:** Dieser Work/Codex-Chat übernimmt auf ausdrücklichen
Wunsch des Product Owners die Technical-Lead-Rolle für #1092. Zwei unabhängige
read-only Reviews haben auf `690c9183` UI-Regressionsbefunde geliefert; der Root-
Writer hat sie behoben. Neuer lokaler Voll-App-Lauf: **24/24 PASS**, 52 gezielte
Tests PASS, Build PASS. Erneute unabhängige Prüfung/CI auf dem neuen Commit bleiben
vor Gesamtfreigabe erforderlich. [Vollständiger Review-Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md).

Vercel-Zugriff funktioniert. Das exakte bisherige Preview von `690c9183` antwortet
unter `/account` mit 503 „Anmeldung derzeit nicht prüfbar“; diesem Branch fehlt
eine Preview-Testkonfiguration. `develop` ist als getrennte Testbranch identifiziert.
Die Zustimmung für ausschliesslich zwei öffentliche Verbindungswerte in diesem
Preview ist angefragt; noch keine Einstellung geändert. Kein Production-Fallback.

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
- Angemeldeter Konto-Workspace, echte Testdatenbank, KI-Backend, native
  Browserzoom-/VoiceOver-/Geräteprüfung sind noch nicht unabhängig abgenommen.

## Erforderliche Fortsetzung

1. Vollständigen Diff und aktuellen Commit unabhängig prüfen; insbesondere
   gemeinsamen Rahmen, ursprüngliche Aktionen, Konto-/Gastgrenzen und A11y.
2. Überschneidung mit dem offenen PR #1082 abgleichen. Keine automatische
   Übernahme oder stilles Verwerfen einer der Arbeiten. Erster unabhängiger Abgleich
   abgeschlossen: nur `TripWorkspace.tsx` gemeinsam, keine überlappenden Hunks.
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

Es wurden weder Datenbank-/Vercel-Einstellungen noch Provider-Schlüssel,
Abonnements, Kontodaten oder der bisherige Live-Stand verändert.
