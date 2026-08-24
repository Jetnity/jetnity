# Jetnity Admin Slice A – Main-Synchronisierung vor Product-Owner-Freigabe

Stand: 24. August 2026

Status: **Integration Prep – kein Mark Ready, kein Merge**

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`

## Ausgangslage

- Draft-PR: `#44`
- Branch: `feat/admin-control-center-ia`
- bisher technisch geschlossener Slice-A-Stand: PR #44 / Technical Closure PASS
- aktueller `main`: `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5`
- `main` ist seit dem ursprünglichen Slice-A-Base weitergelaufen; vor einer Product-Owner-Freigabe muss Slice A sauber mit dem aktuellen `main` synchronisiert und erneut gegatet werden.

## Auftrag

1. Zuerst `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, die Slice-A Status-/Handoff-/Self-Review-Dateien und PR #44 lesen.
2. `feat/admin-control-center-ia` sauber mit dem **aktuellen** `main` `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5` synchronisieren.
3. Konflikte fachlich auflösen. Keine inzwischen in `main` integrierten Provider-/Audit-/Seasonal-/Route-/Safety-/Account-Wahrheiten zurückdrehen oder durch ältere Admin-Dokumentstände überschreiben.
4. Slice-A-Verhalten unverändert erhalten: ehrliche Control-Center-IA, keine Legacy-Scheinzustände, keine Fake-Notifications/Auto-Execution, korrekte Refund/IP-Block-Copy, Navigation nur UX-Hilfe, bestehende Guards/RLS bleiben Autorität, Break-Glass-Writes bleiben vor persistenter DB-Wirkung gesperrt.
5. Keine Scope-Erweiterung: kein Slice B/C in diesem Branch, keine neue DB/Migration/RLS/Capability, keine Provider-/Ads-/Bexio-/Infomaniak-Aktivierung, keine Homepage-/Account-/Trip-Truth-Änderung.
6. Nach Synchronisierung vollständige lokale Gates ausführen, mindestens: `npm test`, Typecheck, Lint, Hygiene, `check:api-schutz`, Production Build und Admin-UI/Audit-Gates.
7. GitHub Actions CI und Vercel Preview auf **demselben neuen Exact Head** abwarten und belegen.
8. Status/Handoff/Self-Review wahrheitsgemäß auf den neuen Runtime-Head aktualisieren.
9. Danach STOPP für unabhängigen ChatGPT/Technical-Lead-Integrationsreview.

## Stack-Regel

PR #46 / Admin Slice B bleibt während dieses Schritts Draft und unangetastet. Nach sauberer Slice-A-Integration wird Slice B auf den dann aktuellen `main` umgestellt/synchronisiert und erneut exakt gegatet, bevor eine Product-Owner-Entscheidung zu Slice B erfolgt.

## Harte Governance

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Kein Slice C.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.

## Abschlusskriterium dieses Auftrags

Neuer synchronisierter Slice-A Exact Head + lokale Gates grün + GitHub Actions SUCCESS + Vercel READY + dokumentierter Handoff. Danach wartet der Workstream auf den unabhängigen Technical-Lead-Review und die Product-Owner-Entscheidung.