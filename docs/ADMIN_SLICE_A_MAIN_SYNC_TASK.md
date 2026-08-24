# Jetnity Admin Slice A – Main-Synchronisierung nach Account AP-1-Merge

Stand: 24. August 2026

Status: **GO ADMIN A SYNC – Draft bleibt Draft**

Verantwortlicher Cursor-Anzeigename: `Admin platform audit`

## Verbindlicher Ausgangsstand

- Account AP-1 / PR #43 wurde mit ausdrücklicher Product-Owner-Freigabe nach `main` gemergt.
- Aktueller `main` zum Zeitpunkt dieses Auftrags: `084f7c87f36f9929f3e4a9deb9d3fedef6e96982`.
- Draft-PR: `#44`
- Branch: `feat/admin-control-center-ia`
- Slice A war auf seinem bisherigen Stand technisch geschlossen / PASS, liegt aber auf einem älteren `main`.
- PR #44 bleibt Draft.

## Auftrag

1. Zuerst `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, die Slice-A Status-/Handoff-/Self-Review-Dateien, diesen Auftrag und PR #44 lesen.
2. Den **tatsächlich aktuellen `main`** erneut verifizieren. Falls er seit `084f7c87...` weitergelaufen ist, den neueren Stand verwenden.
3. `feat/admin-control-center-ia` sauber mit dem aktuellen `main` synchronisieren.
4. Konflikte fachlich auflösen. Nichts aus aktuellem `main` zurückdrehen oder durch ältere Admin-Stände überschreiben: insbesondere Account AP-1, Provider Readiness Audit, Provider Ops S1 sowie Seasonal-/Route-/Safety-/Readiness-Truth und aktuelle Governance-Dokumente bleiben erhalten.
5. Slice-A-Verhalten unverändert erhalten: ehrliche Control-Center-IA, keine Legacy-Scheinzustände, keine Fake-Notifications/Auto-Execution, korrekte Refund/IP-Block-Copy, capability-aware Navigation nur als UX-Hilfe, bestehende Guards/RLS bleiben Autorität, Break-Glass-Writes bleiben vor persistenter DB-Wirkung gesperrt.
6. Keine Scope-Erweiterung: kein Slice B/C in diesem Branch, keine neue DB/Migration/RLS/Capability, kein System Health, keine Provider-/Ads-/Bexio-/Infomaniak-Aktivierung, keine Homepage-/Account-/Trip-/Traveller-/Route-Truth-Änderung.
7. Vollständige lokale Gates auf dem neuen Runtime-Head ausführen, mindestens: `npm test`, Typecheck, Lint, Hygiene, `check:api-schutz`, Production-Build und die vorhandenen Admin-UI/Audit-Gates.
8. GitHub Actions CI und Vercel Preview müssen auf **demselben neuen Exact Runtime Head** SUCCESS/READY sein. Docs-only-Folgecommits sind kein neues Runtime-Gate.
9. Status/Handoff/Self-Review wahrheitsgemäß auf den neuen Runtime-Head aktualisieren und Runtime-/Docs-only-Head klar unterscheiden.
10. Danach **STOPP** für unabhängigen ChatGPT/Technical-Lead-Integrationsreview.

## Parallelitätsregel

Account AP-2 darf parallel seinen eigenen Main-Sync vorbereiten. Keiner der beiden Workstreams darf aus dem anderen Shared Contracts übernehmen oder dessen Scope erweitern. Falls einer zuerst gemergt wird und `main` dadurch weiterläuft, muss der andere vor eigener Product-Owner-Freigabe erneut gegen den dann aktuellen `main` verifiziert werden.

PR #46 / Admin Slice B bleibt währenddessen Draft und unangetastet. Nach sauberer Slice-A-Integration wird Slice B separat auf den dann aktuellen `main` synchronisiert und erneut exakt gegatet.

## Harte Governance

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Kein Slice C.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.

## Abschlusskriterium

Neuer mit aktuellem `main` synchronisierter Slice-A Exact Runtime Head + vollständige lokale Gates grün + GitHub Actions SUCCESS + Vercel READY + dokumentierter Handoff. Danach wartet der Workstream auf den unabhängigen Technical-Lead-Review und die Product-Owner-Entscheidung.