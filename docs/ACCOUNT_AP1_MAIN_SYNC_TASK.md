# Jetnity Account AP-1 – Main-Synchronisierung vor Product-Owner-Freigabe

Stand: 24. August 2026

Status: **Integration Prep – kein Mark Ready, kein Merge**

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`

## Ausgangslage

- Draft-PR: `#43`
- Branch: `feat/account-ap1`
- bisher technisch geschlossener Runtime-Head: `9cc9b0526683f161f500326a7b72c74abac9c296`
- aktueller `main`: `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5`
- `main` ist seit dem ursprünglichen AP-1-Base weitergelaufen; AP-1 muss deshalb vor einer Product-Owner-Freigabe sauber synchronisiert und erneut gegatet werden.

## Auftrag

1. Zuerst `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, die AP-1 Status-/Handoff-/Self-Review-Dateien und PR #43 lesen.
2. `feat/account-ap1` sauber mit dem **aktuellen** `main` `f92e0c9e2e6ddbe73b1cc2c59d7ba5521a0115c5` synchronisieren.
3. Konflikte fachlich auflösen. Keine bereits in `main` integrierten Provider-/Audit-/Seasonal-/Route-/Safety-Wahrheiten zurückdrehen oder mit alten AP-1-Dokumentständen überschreiben.
4. AP-1-Verhalten unverändert erhalten: Account-Shell, persönliche Übersicht, Reise-fortsetzen-CTA, Account-Navigation und `/account/security`.
5. Keine Scope-Erweiterung: keine AP-2-/AP-3-Implementierung, keine DB-/Migration-/RLS-/Traveller-/Billing-/Provider-/Homepage-Änderung.
6. Nach Synchronisierung vollständige lokale Gates ausführen, mindestens: `npm test`, Typecheck, Lint, Hygiene, Auth-/API-Schutz soweit im Repo vorgesehen, Production Build und Account-UI/Audit-Gates.
7. GitHub Actions CI und Vercel Preview auf **demselben neuen Exact Head** abwarten und belegen.
8. Status/Handoff/Self-Review wahrheitsgemäß auf den neuen Runtime-Head aktualisieren.
9. Danach STOPP für unabhängigen ChatGPT/Technical-Lead-Integrationsreview.

## Stack-Regel

PR #48 / AP-2 bleibt während dieses Schritts unangetastet und Draft. Erst nach sauberer AP-1-Integration wird AP-2 auf den dann aktuellen `main` synchronisiert.

## Harte Governance

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Kein AP-3.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.

## Abschlusskriterium dieses Auftrags

Neuer synchronisierter AP-1 Exact Head + lokale Gates grün + GitHub Actions SUCCESS + Vercel READY + dokumentierter Handoff. Danach wartet der Workstream auf den unabhängigen Technical-Lead-Review und die Product-Owner-Entscheidung.