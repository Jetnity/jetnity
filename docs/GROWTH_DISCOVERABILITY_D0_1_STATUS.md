# Jetnity – D0-1 Index Boundary Contract – Status

Stand: 25. August 2026  
Status: **INTEGRIERT / Product-Owner-freigegeben / Technical-Lead PASS**

Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-1-index-boundary-contract`  
PR: #70 – **MERGED**  
Task: `docs/GROWTH_DISCOVERABILITY_D0_1_TASK.md`

## 1. Finaler Integrationsstand

Finaler freigegebener PR-Head:

`549f3de1a44020641d1cad2c13a6a1a08086847d`

Merge-Commit auf `main`:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Product Owner hat PR #70 ausdrücklich aktuell zum Merge freigegeben.

Vercel Production nach Merge:

- Deployment `dpl_7Qvwxrtc7NHQCWLLzrdmNsfFKfjt`;
- Git SHA `083eda22189e1dad8bd70413889d2486755d7fe6`;
- Target `production`;
- Status `READY`;
- Alias enthält `jetnity-app.vercel.app`.

## 2. Finale Exact-Head-Evidence vor Merge

Auf `549f3de1a44020641d1cad2c13a6a1a08086847d`:

- Compare gegen damaliges `main @ 63e8900b5c519f0d1d8b25d011ac9bc963d241c6`: 10 ahead / 0 behind;
- Merge-Base = damaliges aktuelles `main`;
- 15 erwartete D0-1-Dateien;
- GitHub Actions Run `32906411630`: **SUCCESS**;
- CI: Auth-Konfiguration, Setup, Typecheck, Lint, Tests, Admin-API-Schutz, Schema-Bezug, Dead Code, Exports, Dependencies, Production Build: **SUCCESS**;
- Vercel Preview `dpl_CNJ2iLyGM9e6AA5UdGX47PCta6zd`: **READY**;
- Inline-Review-Threads: 0;
- unabhängiger Technical-Lead Final Re-Review: **TECHNICAL PASS / review-bereit**;
- frühere Agent-Evidence: gezielte D0-1-Tests 19/19, vollständiger `npm test` 2013/2013.

## 3. Historischer TL-Blocker und Closure

Früherer Review-Blocker:

`P2-D0-1-TL-01`

Root Cause: `planenHatIndexRelevanteParams()` prüfte ursprünglich einen nicht-leeren/getrimmten Wert statt die Präsenz eines von `/planen` akzeptierten Intent-Keys.

Dadurch wären unter anderem `/planen?idee=`, key-only-, Whitespace-, `ziel=`- und `zielId=`-Varianten fälschlich indexierbar geblieben.

Runtime-Korrektur:

`480834e143a8f00cfbb954031cde48e4174e3a20`

Die Entscheidung erfolgt seitdem über Key-Präsenz (`Object.hasOwn`) für `idee`, `ziel`, `zielId`.

Damit gilt:

- keine akzeptierten Intent-Keys → öffentliche `/planen`-Basis;
- vorhandener akzeptierter Key → `noindex, nofollow`, unabhängig von leer / whitespace / Wert / Array;
- unbekannte Params allein bleiben Basis;
- UI-/Übernahmelogik bleibt unverändert.

`P2-D0-1-TL-01` ist geschlossen.

## 4. Integrierter D0-1-Scope

- `/reisen` → `noindex, nofollow`;
- `/reisen/[tripId]` → `noindex, nofollow`;
- `/reisen` aus Sitemap entfernt;
- robots-Allow-Modus schützt Reise-/Auth-/sensitive D0-1-Pfade;
- localhost / `*.vercel.app` Kill-Switch bleibt deny-all;
- `NEXT_PUBLIC_ALLOW_INDEXING` wurde nicht gelockert;
- `/planen` Basis bleibt öffentlich;
- `/planen` mit vorhandenem `idee`/`ziel`/`zielId` → `noindex, nofollow`;
- `/admin/login` → `noindex, nofollow`;
- `/unauthorized` → `noindex, nofollow`;
- `(admin)`-Layout besitzt App-Router-kompatible `noindex`-Grenze;
- toter `app/(admin)/admin/head.tsx` entfernt;
- gezielte Index-/robots-/sitemap-Regressionstests integriert.

Keine Guest-/Account-/Trip-Produktlogik wurde verändert.

## 5. Geschlossene Findings

Durch D0-1 geschlossen:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

## 6. Bewusst offene Findings

Nicht Teil von D0-1 und weiterhin offen:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; keine Rechtstexte erfinden;
- D0-P2-01 – deny-all / Sitemap-/Host-Semantik;
- D0-P2-02 – Canonical-/Origin-Contract;
- D0-P2-04 – hreflang / Locale;
- D0-P2-05 – JSON-LD / Entity Foundation;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

## 7. Runtime / DB / Kosten / Security

D0-1 enthält keine DB-/Production-Migration-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Secret-/paid-call-Änderung. Kein Tracking. Keine neuen laufenden Kosten.

## 8. Governance

PR #70 wurde erst nach ausdrücklicher aktueller Product-Owner-Freigabe gemergt.

Kanonisch gilt seit PR #71:

> **Technisch fertig = review-bereit. Product Owner entscheidet Ready/Merge.**

## 9. Nächster Schritt

D0-1 ist **geschlossen**. Kein weiterer Runtime-Change gehört in diesen Slice.

Post-D0-1-Continuity:

`docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`

Nach abgeschlossenem Continuity-Slice ist der naheliegende konfliktarme Candidate **D0-2 – Canonical / Origin / robots-sitemap Consistency**. D0-2 wird als eigener Task/Status/Branch/Draft-PR vorbereitet und nicht aus D0-1 heraus fortgesetzt.
