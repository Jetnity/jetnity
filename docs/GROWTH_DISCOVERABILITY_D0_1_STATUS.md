# Jetnity – D0-1 Index Boundary Contract – Status

Stand: 26. August 2026  
Status: **Independent Technical-Lead PASS / technisch review-bereit / DRAFT / INTEGRATION HOLD**

Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-1-index-boundary-contract`  
Draft-PR: #70  
Task: `docs/GROWTH_DISCOVERABILITY_D0_1_TASK.md`

> **Kein Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für PR #70.**

Kein D0-2/G0-1/D1/G1+ aus diesem Slice.

## 1. Aktuelle Integrationsbaseline

Nach Product-Owner-Freigabe wurde PR #71 (`docs: restore Product Owner merge governance`) nach `main` gemergt.

Aktueller synchronisierter Baseline-Stand:

`main @ 63e8900b5c519f0d1d8b25d011ac9bc963d241c6`

D0-1 wurde danach kontrolliert mit diesem `main` synchronisiert.

Sync-Commit:

`04f3620def31a52972df4e713733016a3c1db431`

Compare gegen `main` nach Sync:

- Status: `ahead`
- Ahead: 9
- Behind: 0
- Merge-Base: `63e8900b5c519f0d1d8b25d011ac9bc963d241c6`
- PR-Diff: 15 erwartete D0-1-Dateien
- `docs/ACTIVE_WORK_STATUS.md` wurde beim Sync **nicht** aus dem alten D0-1-Stand zurückgespielt; die kanonische Governance-/Active-Work-Version von `main` gewinnt.

## 2. Historischer TL-Blocker und Closure

Früherer Review-Blocker:

`P2-D0-1-TL-01`

Root Cause: `planenHatIndexRelevanteParams()` prüfte ursprünglich einen nicht-leeren/getrimmten Wert statt die Präsenz eines von `/planen` akzeptierten Intent-Keys.

Dadurch hätten Varianten wie diese fälschlich indexierbar bleiben können:

- `/planen?idee=`
- `/planen?idee`
- `/planen?idee=%20`
- `/planen?ziel=`
- `/planen?zielId=`

Korrektur auf Runtime-Commit:

`480834e143a8f00cfbb954031cde48e4174e3a20`

Die Entscheidung erfolgt jetzt über Key-Präsenz (`Object.hasOwn`) für `idee`, `ziel`, `zielId`.

Damit gilt:

- keine akzeptierten Intent-Keys → öffentliche `/planen`-Basis;
- vorhandener akzeptierter Key → `noindex, nofollow`, unabhängig von leer / whitespace / Wert / Array;
- unbekannte Params allein bleiben Basis;
- UI-/Übernahmelogik bleibt unverändert.

`P2-D0-1-TL-01` ist geschlossen.

## 3. Implementierter D0-1-Scope

- `/reisen` → `noindex, nofollow`
- `/reisen/[tripId]` → `noindex, nofollow`
- `/reisen` aus Sitemap entfernt
- robots-Allow-Modus schützt Reise-/Auth-/sensitive D0-1-Pfade
- localhost / `*.vercel.app` Kill-Switch bleibt deny-all
- `NEXT_PUBLIC_ALLOW_INDEXING` wird nicht gelockert
- `/planen` Basis bleibt öffentlich
- `/planen` mit vorhandenem `idee`/`ziel`/`zielId` → `noindex, nofollow`
- `/admin/login` → `noindex, nofollow`
- `/unauthorized` → `noindex, nofollow`
- `(admin)`-Layout besitzt App-Router-kompatible `noindex`-Grenze
- toter `app/(admin)/admin/head.tsx` entfernt
- gezielte Index-/robots-/sitemap-Regressionstests ergänzt

Keine Guest-/Account-/Trip-Produktlogik wurde verändert.

## 4. Regressionsevidence

Gezielte D0-1-Tests laut persistierter Agent-Evidence: **19/19**.

Vollständiger Agent-Testlauf auf Presence-Fix: **2013/2013**.

Lokale Production-HTML-Evidence nach Rebuild:

| Route | robots |
| --- | --- |
| `/planen` | `index, follow` |
| `/planen?idee=` | `noindex, nofollow` |
| `/planen?idee=%20` | `noindex, nofollow` |
| `/planen?idee=Bali+mit+Pass+CH` | `noindex, nofollow` |
| `/planen?idee` | `noindex, nofollow` |
| `/planen?ziel=` | `noindex, nofollow` |
| `/reisen` | `noindex, nofollow` |

## 5. Re-Gating nach PR #71

Exact Sync-Head vor diesem Status-Persist:

`04f3620def31a52972df4e713733016a3c1db431`

GitHub Actions:

- Run `32906184803`
- Ergebnis: **SUCCESS**
- vollständiger CI-Workflow inkl. Typecheck, Lint, Tests, Schutz-/Schema-/Hygiene-Gates und Production Build erfolgreich

Vercel Preview:

- Deployment `dpl_B53nErDWJDRJERJ4i26ditVNWsSP`
- Exact Git SHA: `04f3620def31a52972df4e713733016a3c1db431`
- Ergebnis: **READY**

GitHub:

- PR #70 weiterhin Draft
- `mergeable=true`
- Inline-Review-Threads: 0
- Behind `main`: 0

Dieser Status-Persist ändert erneut den PR-Head. Daher werden GitHub Actions und Vercel auf dem **neuen finalen Persist-Head** nochmals exact-head verifiziert, bevor der Product Owner eine Merge-Entscheidung erhält.

## 6. Independent Technical-Lead Re-Review nach Sync

Ergebnis auf Sync-Head `04f3620d...`: **TECHNICAL PASS**.

Re-Review-Schwerpunkte:

- aktueller PR-Diff gegen `main` enthält nur die erwarteten 15 D0-1-Dateien;
- keine Governance-Datei aus PR #71 wird durch den D0-1-Sync zurückgesetzt;
- die D0-1-Runtime-/Test-Blobs entsprechen den bereits fachlich geprüften Implementierungen;
- der einzige Branch-Overlap (`docs/ACTIVE_WORK_STATUS.md`) wurde bewusst zugunsten des aktuellen `main` aufgelöst;
- kein neuer Scope beim Sync;
- keine DB-/Migration-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Tracking-/Secret-/paid-call-/Kostenänderung.

## 7. Geschlossene und offene Findings

Durch D0-1 geschlossen:

- D0-P1-01
- D0-P1-02
- D0-P2-03
- P2-D0-1-TL-01

Bewusst offen / nicht Teil dieses PRs:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; keine Rechtstexte erfinden
- D0-P2-01 – deny-all / Sitemap-/Host-Semantik
- D0-P2-02 – Canonical-/Origin-Contract
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02
- D0-2 / G0-1 / D1 / G1+
- TW-6

## 8. Runtime / DB / Kosten / Security

Keine DB-/Migration-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Secret-/paid-call-Änderung. Kein Tracking. Keine neuen laufenden Kosten.

Production wird durch diesen Draft-PR nicht verändert.

## 9. Governance

Seit PR #71 gilt kanonisch:

> **Technisch fertig = review-bereit. Product Owner entscheidet Ready/Merge.**

Ein Technical-Lead-PASS, grüne CI, Vercel READY, `mergeable=true` oder 0 Review-Threads sind keine Merge-Freigabe.

PR #70 bleibt bis zu einer ausdrücklichen aktuellen Product-Owner-Freigabe Draft / Integration Hold.

## 10. Nächster Schritt

1. finalen Persist-Head live bestimmen;
2. Exact-Head GitHub Actions / Vercel / Ahead-Behind / Threads erneut prüfen;
3. unabhängigen Technical-Lead-Abschluss auf dem finalen Head festhalten;
4. **STOPP und PR #70 dem Product Owner separat zur Entscheidung vorlegen.**

Kein Ready. Kein Merge. Kein nächster Slice aus PR #70 ohne neue kontrollierte Entscheidung.
