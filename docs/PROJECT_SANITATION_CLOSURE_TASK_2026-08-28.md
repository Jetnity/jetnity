# Jetnity – Project Sanitation Closure Task

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Branch: `cursor/project-sanitation-closure-2966`  
Typ: AUDIT / RECONCILIATION / NON-DESTRUCTIVE

## 1. Zweck

Den heutigen Project-Sanitation-Stand live rekonstruieren und einen sicheren Closure-/Retention-Plan für historische Draft-PRs und Remote-Branches erzeugen.

Dieser Slice darf nichts Destruktives ausführen. Er dokumentiert, was später geschlossen, behalten oder erst nach Technical-Lead-/Product-Owner-Entscheidung gelöscht werden darf.

## 2. Live-Baseline bei Auftragserteilung

Rekonstruiert live, nicht aus Erinnerung:

| Fakt | Live-Evidence |
| --- | --- |
| `origin/main` | `eaa03ad71509d281990e0d34ca359e0750eb9591` |
| Main-Message | `Merge PR #131: close AP-5 Gate 0 canonical pointers` |
| Offene PRs | 7: #133, #88, #52, #50, #40, #39, #28 |
| Remote-Heads | 135 inkl. `main` |
| Tags | 3 annotated: `archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui`, `archive/pre-1-4b-legacy-datenbank` |
| `main` Branch Protection | `protected=false` |
| Parallel | Issue #132 / Draft-PR #133 durch `Account plattform audit vorbereitung 9` |

Historische Quelle: Draft-PR #88, Head `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8`, Baseline damals `1d558ef56cc275d429f4076c7a8877c3791947a7`. PR #88 ist Evidence vom 26.08.2026, nicht Current Truth.

## 3. Harte Non-Scope-Regeln

In diesem Slice **nicht**:

- Branches, Tags oder PRs löschen/schliessen/mergen
- Dateien löschen oder Runtime-Code bereinigen
- Account-/Auth-/MFA-/Session-Dateien oder Shared Contracts von Issue #132 ändern
- Supabase, Vercel oder Cloud mutieren
- Migrationen anwenden
- RLS/Ownership/Identity/Auth ändern
- Build Order ändern
- C2, AP-5-Runtime, AP-6, AP-7, Provider, TW, Search, Homepage oder Native starten

Gefundene Cleanup-Kandidaten werden nur dokumentiert.

## 4. Parallelitätsgrenze zu Agent 9

`Account plattform audit vorbereitung 9` besitzt Issue #132 / PR #133.

Dieser Agent darf dessen Account-/Auth-/Security-UI-Runtime und Shared Contracts nicht anfassen. Dazu gehören insbesondere:

- `app/account/security/**`
- `components/account/SecurityMFA.tsx`
- `components/auth/MFATotpDialog.tsx`
- `lib/auth/account-security-*`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
- `docs/AP5_S1_*`

Continuity-Zeiger in `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und `ROADMAP.md` dürfen nur Sanitation-Status ergänzen, nicht den AP-5-S1-Vertrag umschreiben.

## 5. Pflichtarbeit

1. Live-Inventur von `main`, offenen PRs, Remote-Branches und Tags.
2. PR-#88-Findings gegen heutigen `main` neu klassifizieren.
3. Für jeden alten offenen Draft-PR Unique Content, Integrationsstand und Closure-Klasse bestimmen.
4. Vollständige Remote-Branch-Disposition ohne Löschung.
5. Beweis, welche Branches später löschbar wären, ohne Unique Commits/Docs/ADRs/Handoffs zu verlieren.
6. Versionierte Deliverables und Generation-3-Rotation-Record.

## 6. Closure-Klassen für alte PRs

| Klasse | Bedeutung |
| --- | --- |
| `CLOSE-SAFE` | Kein Unique Content ausserhalb dauerhafter History/`main`; Schliessen verliert keine Evidence |
| `KEEP-HISTORICAL-OPEN` | Unique Audit-/Continuity-Evidence, die noch nicht dauerhaft auf `main` liegt oder als PR-Zeiger bleiben soll |
| `KEEP-FUTURE` | Unique zukünftige Produktarbeit; Schliessen würde einen späteren Slice abschneiden |
| `NEEDS-TL-DECISION` | Unique Content oder Owner unklar; Technical Lead entscheidet |

Alte PRs werden niemals nur gemergt, um die Liste aufzuräumen.

## 7. Branch-Klassen

| Klasse | Bedeutung |
| --- | --- |
| `ACTIVE` | `main` oder laufender nicht superseded Workstream |
| `MERGED-HEAD-LEFTOVER` | Inhalt auf `main`; Branch-Tip ist Ancestor oder Squash-Rest ohne Unique Files |
| `HISTORICAL-EVIDENCE` | Unique Docs/Commits, die als Evidence behalten werden müssen |
| `STALE / SUPERSEDED` | Temp-/Duplikat-/geschlossene Continuity-Reste |
| `FUTURE-WORK` | bewusste spätere Produktarbeit |
| `UNKNOWN / NEEDS REVIEW` | Unique Content ohne sicheren Owner |

## 8. Deliverables

- `docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md` – diese Datei
- `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`
- `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`
- `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`
- `docs/PROJECT_SANITATION_CLOSURE_SELF_REVIEW_2026-08-28.md`
- `docs/PROJECT_SANITATION_CLOSURE_HANDOFF_2026-08-28.md`
- `docs/PROJECT_SANITATION_AGENT_ROTATION_RECORD_GENERATION_3_2026-08-28.md`
- read-only Invariant-Test `lib/project-sanitation/closure-invariants.test.ts`

Die Originaldateien von PR #88 bleiben auf dem historischen Branch. Sie werden hier nicht nach `docs/history/` kopiert, damit Production-Projektrefs nicht erneut gestaged werden und #88 Unique Evidence behält.

## 9. STOPP

Nach Exact-Head-CI/Vercel-Evidence:

- nicht Ready setzen
- nicht mergen
- nicht aufräumen
- keine Folgearbeit starten

Technical Lead entscheidet danach, welche alten PRs/Branches wirklich bereinigt werden dürfen.
