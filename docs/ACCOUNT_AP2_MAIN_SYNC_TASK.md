# Jetnity Account AP-2 – Main-Synchronisierung nach AP-1-Merge

Stand: 24. August 2026

Status: **DONE – Exact-Head `de5ffd8a` gegated; Technical Integration Closure / PASS; Ready durch Product Owner, wartet auf Merge-Freigabe**

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`

## Verbindlicher Ausgangsstand

- AP-1 / PR #43 wurde mit ausdrücklicher Product-Owner-Freigabe nach `main` gemergt.
- Aktueller `main` zum Zeitpunkt dieses Auftrags: `084f7c87f36f9929f3e4a9deb9d3fedef6e96982`.
- AP-2 / PR #48 ist technisch geschlossen, liegt aber noch auf der alten gestapelten AP-1-Basis.
- AP-2-Branch: `feat/account-ap2`
- bisheriger AP-2 Runtime-Gate: `e9b2f834edc925b12e8b5a667f0e4382642eae8f`
- PR #48 bleibt Draft.

## Auftrag

1. Zuerst `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/ACCOUNT_AP2_STATUS.md`, `docs/ACCOUNT_AP2_HANDOFF.md`, `docs/ACCOUNT_AP2_SELF_REVIEW.md`, `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md`, diesen Auftrag und PR #48 lesen.
2. Den **tatsächlich aktuellen `main`** erneut verifizieren. Falls er seit `084f7c87...` weitergelaufen ist, den neueren Stand verwenden.
3. `feat/account-ap2` sauber auf den aktuellen `main` synchronisieren. Ziel ist, dass AP-1 nur einmal aus `main` kommt und PR #48 danach nur den AP-2-Scope trägt. Keine doppelte/alte AP-1-Historie als Produktänderung stehen lassen.
4. Nach sauberer Synchronisierung PR #48 auf `main` als Base retargeten, sofern der Diff dann ausschließlich den AP-2-Scope plus notwendige konfliktbedingte Dokumentnachzüge zeigt.
5. Konflikte fachlich lösen. Nichts aus aktuellem `main` zurückdrehen: insbesondere Account AP-1, Provider Readiness Audit, Provider Ops S1, Seasonal/Route/Safety/Readiness-Truth und aktuelle Governance-Dokumente bleiben erhalten.
6. AP-2-Verhalten unverändert bewahren: OAuth nur bei belegtem Enablement; sichere `next`-Allowlist; Login/Register über `getUser()`; öffentliche Register-Enumeration neutralisiert; Gast-/Session-/Footer-Navigation konsistent; MFA-Dialog Accessibility gehärtet; AP2-B1 bleibt geschlossen.
7. Keine Scope-Erweiterung: kein AP-3, keine DB/Migration/RLS/Auth-Vertragsänderung außerhalb des bestehenden AP-2-Scopes, keine Traveller-/Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine Secrets/Keys/Kosten, keine Admin-Änderung.
8. Vollständige lokale Gates auf dem neuen Runtime-Head ausführen, mindestens: `npm test`, Typecheck, Lint, Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:schema-bezug`, `check:api-schutz` sofern im aktuellen Projekt vorhanden), `auth:pruefen`, `audit:account`, Production-Build.
9. GitHub Actions und Vercel Preview müssen auf **demselben neuen Exact Runtime Head** erfolgreich/READY sein. Docs-only-Folgecommits sind kein neues Runtime-Gate.
10. Status/Handoff/Self-Review wahrheitsgemäß auf den neuen Stand aktualisieren und klar zwischen Runtime-Head und späterem Docs-only-Head unterscheiden.
11. Danach **STOPP** für unabhängigen ChatGPT/Technical-Lead-Integrationsreview.

## Harte Governance

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Kein AP-3.
- Keine Production-Migration.
- Keine Provider-/Secret-/Kosten-Aktivierung.

## Abschlusskriterium

PR #48 liegt sauber auf aktuellem `main`, enthält nur AP-2-Scope, hat einen neuen exakt belegten Runtime-Head mit lokalen Gates grün, GitHub Actions SUCCESS und Vercel READY. Danach wartet der Workstream auf den unabhängigen Technical-Lead-Review und die Product-Owner-Entscheidung.