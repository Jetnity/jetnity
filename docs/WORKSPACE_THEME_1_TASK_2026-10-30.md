# Workspace Theme 1 – Weiss als Standard, Grün per Header-Klick

Owner-Auftrag vom 30.10.2026: Der bestehende gemeinsame Workspace soll standardmässig
hell/weiss erscheinen; ein Klick im Header wechselt zum bereits freigegebenen Grün.
Die Auswahl bleibt in diesem Browser erhalten. Keine Änderung der Reise-/Kontologik.

Basis: main `6b929baec81e6c561142db4e6a9636e1bb30c873`, PR #1092 live und Post-Merge PASS.
Branch: `codex/workspace-light-green-switch`. Root bleibt wie beim vorherigen
Workspace-Auftrag einziger Writer und Technical Lead; unabhängige Prüfung vor Merge.

## Umfang und Abnahme

- Helle vorhandene Markenpalette als Standard, auch bei dunkler Betriebssystemwahl.
- Ein sichtbarer Header-Schalter für Hell/Grün, auf Desktop und Smartphone, per Tastatur.
- Auswahl nur als lokale Darstellungspräferenz; ungültiger/gesperrter Speicher darf
  die Bedienung nicht verhindern. Kein Konto-, Reise- oder Admin-Theme überschreiben.
- Beide vollständigen Planungswege, Jetzt wichtig und alle bestehenden Header-Aktionen
  behalten Zustand und Handler beim Umschalten. Kein Remount der Inhalte.
- Grüne Inhaltsfarben nur bei expliziter Auswahl; allgemeine Layout-/Lesbarkeitsregeln
  gelten für beide Darstellungen. Homepage, öffentliche Rechtseiten und Providerframes
  behalten ihre Farben.
- Browserprüfung: Erstbesuch, Umschalten, Reload, Routenwechsel, gesperrter Speicher,
  beide Planungswege, Mehrort-Gastreise, 320/390/768/1440 px und 200 % Text.

Dateien: WorkspaceShell, neuer lokaler Darstellungshook, workspace.css und
workspace-surfaces.css; Design-/Entscheidungs-/Architektur-/Roadmap-Dokumentation.
Keine neue Abhängigkeit, API, Datenbank, Auth-/RLS-, Provider-, ENV- oder Kostenänderung.
Hauptrisiko: Kontrast/Vererbung alter Inhaltskarten; visuell in beiden Farben prüfen.
Tests: Typecheck, Lint, bestehende relevante Tests, Build/Hygiene und isolierter Browser.
Normaler Merge nur nach Review/CI/Preview; danach Production und Main-CI prüfen.
Reviewer: read-only, do not mark Ready, do not merge, do not start a follow-up slice.
Bestehende Provider-/Owner-/Kosten-Gates und #1082-Separierung bleiben bestehen.
