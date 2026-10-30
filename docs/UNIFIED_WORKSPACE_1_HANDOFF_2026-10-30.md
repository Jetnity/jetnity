# Unified Workspace 1 – Übergabe an den Technical Lead

> **Aktueller visueller Nachtrag, 30.10.2026:** Die ursprüngliche Umsetzung
> entsprach dem Entwurf in den Inhaltsflächen noch nicht ausreichend. Diese
> Nacharbeit ist im [visuellen Abgleich](UNIFIED_WORKSPACE_1_VISUAL_ALIGNMENT_2026-10-30.md)
> mit aktuellem Codeumfang, Nachprüfungen und verbleibenden Gates dokumentiert.
> Frühere Ergebnisse unten bleiben historische Belege. PR #1092 bleibt Draft.

Der vom Product Owner gewünschte gemeinsame Konto-/Trip-Rahmen ist auf
`codex/unified-workspace-navigation` implementiert, Basis
`8e667661b490758b25bdd5be720421cea33fda9c`. Es wurde nichts veröffentlicht.

**Review-Fortsetzung 30.10.2026:** Dieser Work/Codex-Chat übernimmt auf ausdrücklichen
Wunsch des Product Owners die Technical-Lead-Rolle für #1092. Der Anwendungscode
`1117b1cd9cb7ab0f2cc9b7c4e2360a3989eaeab3` wurde nach zwei Korrekturrunden unabhängig
geprüft: keine offenen P0–P3-Befunde im geprüften Code-/Gast-UI-Umfang.
Writer: 25/25 lokale Browserprüfungen, 52 gezielte Tests, Build PASS und 3/3 echte
Chrome-Zoom-Szenarien PASS. Unabhängiger Reviewer: 6/6 Regressionen, 3/3 Zoom und
35/35 gezielte Tests PASS; diese Abdeckungen überschneiden sich.
[Vollständiger Review-Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md).

Die zwei freigegebenen öffentlichen Verbindungswerte wurden ausschliesslich für
Preview/`codex/unified-workspace-navigation` auf die vorhandene develop-Testbranch
gesetzt und zurückgelesen. Exakte Vorschau READY:
https://jetnity-a8w3qqkie-jetnity-e1b93c82.vercel.app

Dort bestehen zehn eindeutige Gast-/UI-Prüfungen. Ein erster Synchronisationsfehler
im Verlaufstest ist als fehlgeschlagener Versuch erhalten; die korrigierte
Wiederholung bestand. `/account/settings` führt jetzt zur normalen Anmeldung;
der frühere 503-Konfigurationsfehler ist behoben. **Angemeldete Kontotests bleiben
BLOCKED bis ein reines develop-Testkonto verfügbar ist.** Dafür steht ein neues,
isoliertes Chrome-Fenster bereit; keine persönlichen Sitzungen wurden übernommen.
Kein Production-Fallback. Bei der abschliessenden visuellen Vorschauprüfung wurde
zusätzlich ein ungünstiger Wortumbruch von „Vorbereitung“ bei 320 px gefunden.
Eine einzelne CSS-Spaltenanpassung ist lokal mit Build, 6/6 Regressionen und 3/3
Zoomprüfungen getestet; unabhängiger Nachreview und neues Preview folgen.
Native Zoom-PNGs sind wegen eines Aufnahmeausschnitts
kein verlässlicher visueller Beleg; echte Interaktionen und Messwerte sind separat
belegt. Keine Ready-/Merge-Freigabe.

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

1. Der unabhängige Quell-/Gastreview von `1117b1cd` ist abgeschlossen. Spätere
   Änderungen erneut ihrem Umfang entsprechend prüfen; reine Evidenz-Nachträge
   sind kein neuer Anwendungscode.
2. Überschneidung mit dem offenen PR #1082 abgleichen. Keine automatische
   Übernahme oder stilles Verwerfen einer der Arbeiten. Erster unabhängiger Abgleich
   abgeschlossen: nur `TripWorkspace.tsx` gemeinsam, keine überlappenden Hunks.
   Nach der Review-Korrektur ist zusätzlich `BackToTop.tsx` gemeinsam betroffen
   (in #1092 nur Datenattribut); der Geometrievertrag bleibt gemeinsam zu prüfen.
   Reihenfolge: gemeinsamen Rahmen abnehmen, danach #1082 gegen diesen Rahmen
   aktualisieren und in der echten kombinierten Oberfläche prüfen.
3. Aktuelle CI abschliessen und angemeldete Konto-/Reiseseiten in der bereits
   eingerichteten geschützten Vorschau mit develop-Testkonto prüfen. Kein
   Zugriffsschutz-Bypass und keine Production-Schreibtests. VoiceOver und
   physische Geräte bleiben getrennte offene Prüfumfänge.
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
