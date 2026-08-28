# Jetnity – Project Sanitation Closure Task

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Branch: `cursor/project-sanitation-closure-2966`  
Draft-PR: [#135](https://github.com/Jetnity/jetnity/pull/135)  
Typ: AUDIT / RECONCILIATION / NON-DESTRUCTIVE  
ADR: **ADR-0184** (nicht ADR-0183; ADR-0183 bleibt AP-5-S1)

## 1. Zweck

Den heutigen Project-Sanitation-Stand live rekonstruieren und einen sicheren Closure-/Retention-Plan für historische Draft-PRs und Remote-Branches erzeugen.

Dieser Slice darf nichts Destruktives ausführen. Er dokumentiert, was später geschlossen, behalten oder erst nach Technical-Lead-/Product-Owner-Entscheidung gelöscht werden darf.

**Review-Fix `5050411074`:** Rebase auf aktuelles `main` nach PR-#133-Merge, ADR-0184, getrennte PR- vs. Branch-Disposition. Kein Close. Kein Delete.

## 2. Live-Baseline

### 2.1 Authoring-Start dieses Slices (historisch)

Rekonstruiert live, nicht aus Erinnerung:

| Fakt | Live-Evidence |
| --- | --- |
| `origin/main` | `eaa03ad71509d281990e0d34ca359e0750eb9591` |
| Main-Message | `Merge PR #131: close AP-5 Gate 0 canonical pointers` |
| Offene PRs | 7: #133, #88, #52, #50, #40, #39, #28 |
| Remote-Heads | 135 inkl. `main` |
| Tags | 3 annotated: `archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui`, `archive/pre-1-4b-legacy-datenbank` |
| `main` Branch Protection | `protected=false` |
| Parallel damals | Issue #132 / Draft-PR #133 – **historisch**. Heute MERGED / CLOSED / completed |

### 2.2 Review-Fix nach PR #133 (aktuell)

| Fakt | Live-Evidence |
| --- | --- |
| `origin/main` | `51b0c926dbb535c6791b69f1b4b1ee7503f0ebe2` |
| Main-Message | `Merge PR #133: AP-5-S1 truthful security UI` |
| Offene PRs | **7:** #135, #88, #52, #50, #40, #39, #28 |
| PR #133 | **MERGED** |
| Issue #132 | **CLOSED / completed** |
| Agent 9 | **abgeschlossen** |
| Offene Issues | #134, #110, #109, #20 |
| Remote-Heads | **136** inkl. `main` und dieses Closure-Branches |
| ADR-0183 | AP-5-S1 – nicht überschreiben, nicht umnummerieren |
| Sanitation-ADR | **ADR-0184** |

Historische Quelle: Draft-PR #88, Head `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8`, Baseline damals `1d558ef56cc275d429f4076c7a8877c3791947a7`. PR #88 ist Evidence vom 26.08.2026, nicht Current Truth.

## 3. Harte Non-Scope-Regeln

In diesem Slice **nicht**:

- Branches, Tags oder PRs löschen/schliessen/mergen
- Dateien löschen oder Runtime-Code bereinigen
- Account-/Auth-/MFA-/Session-Dateien oder Shared Contracts von Issue #132 ändern
- integrierte AP-5-S1-Evidence auf `main` überschreiben oder rückwärts schreiben
- Supabase, Vercel oder Cloud mutieren
- Migrationen anwenden
- RLS/Ownership/Identity/Auth ändern
- Build Order ändern
- C2, AP-5-Runtime, AP-6, AP-7, Provider, TW, Search, Homepage oder Native starten

Gefundene Cleanup-Kandidaten werden nur dokumentiert. Dieser Review-Fix führt **keine** Close-/Delete-Aktion aus.

## 4. Parallelitätsgrenze zu Agent 9 / AP-5-S1

`Account plattform audit vorbereitung 9` hat Issue #132 / PR #133 **abgeschlossen**. AP-5-S1 ist integriert.

Dieser Agent darf deren Account-/Auth-/Security-UI-Runtime und Shared Contracts nicht anfassen und die integrierte S1-Evidence nicht rückwärts schreiben. Dazu gehören insbesondere:

- `app/account/security/**`
- `components/account/SecurityMFA.tsx`
- `components/auth/MFATotpDialog.tsx`
- `lib/auth/account-security-*`
- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
- `docs/AP5_S1_*`

`docs/AP5_S1_SECURITY_UI_TRUTH_TASK_2026-08-28.md` existiert auf `main` **by design**. Ein Sanitation-Invariant darf deren Abwesenheit nicht mehr behaupten.

Continuity-Zeiger in `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und `ROADMAP.md` dürfen nur Sanitation-Status ergänzen, nicht den integrierten AP-5-S1-Vertrag umschreiben.

## 5. Pflichtarbeit

1. Live-Inventur von `main`, offenen PRs, Remote-Branches und Tags.
2. PR-#88-Findings gegen heutigen `main` neu klassifizieren.
3. Für jeden alten offenen Draft-PR Unique Content, Integrationsstand und **getrennte** PR- bzw. Branch-Disposition bestimmen.
4. Vollständige Remote-Branch-Disposition ohne Löschung.
5. Beweis, welche Branches später löschbar wären, ohne Unique Commits/Docs/ADRs/Handoffs zu verlieren.
6. Versionierte Deliverables und Generation-3-Rotation-Record.
7. Review-Fix: Rebase auf `51b0c926`, ADR-0184, P1-3/P1-4.

## 6. Zwei Achsen: PR-Disposition ≠ Branch-Retention

PR-Close und Branch-Delete sind **getrennte Operationen**. Ein PR-Close löscht den Source-Branch nicht und verliert dadurch allein keine Unique Files.

### 6.1 PR-Disposition

| Klasse | Bedeutung |
| --- | --- |
| `OPEN` | laufender, nicht superseded Workstream-PR |
| `MERGED` | bereits integriert |
| `CLOSE-SAFE` | PR darf später geschlossen werden; Unique Files leben auf dem Branch weiter, bis ein eigener Branch-Schritt sie sichert oder der Branch selbst `DELETE-SAFE` ist |
| `KEEP-FUTURE` | Unique zukünftige Produktarbeit; PR nicht beiläufig schliessen |
| `NEEDS-REVIEW` | Unique Content oder Owner unklar; Technical Lead entscheidet |

Alte PRs werden niemals nur gemergt, um die Liste aufzuräumen.  
Ein historischer/superseded PR darf `CLOSE-SAFE` sein, während sein Branch `HISTORICAL-EVIDENCE` bleibt.  
PRs bleiben **nicht** allein deshalb offen, weil fälschlich angenommen würde, Close lösche Unique Branch-Files.

### 6.2 Branch-/Evidence-Disposition

| Klasse | Bedeutung |
| --- | --- |
| `ACTIVE` | `main` oder laufender nicht superseded Workstream |
| `DELETE-SAFE` | Unique Files = 0 bzw. Inhalt dauerhaft auf `main`/PR-History; später löschbar nach TL-Liste. Proof-Subtypen: leftover (Ancestor/Squash) und stale/dup |
| `HISTORICAL-EVIDENCE` | Unique Docs/Commits, die als Evidence behalten werden müssen. Branch-Delete bleibt blockiert, bis Preservation bewiesen ist |
| `FUTURE` | bewusste spätere Produktarbeit |
| `NEEDS-REVIEW` | Unique Content ohne sicheren Owner |

## 7. Eine Regel für PR #88

- **PR-Disposition:** `CLOSE-SAFE`. Close ≠ Delete. Die zwei Unique Inventur-Dateien bleiben auf `audit/project-sanitation-inventory-2026-08-26`, auch wenn der PR geschlossen wird.
- **Branch-Disposition:** `HISTORICAL-EVIDENCE`, bis die Unique Files archiviert oder sonst dauerhaft erreichbar sind.
- **Branch-Delete:** blockiert, bis Preservation bewiesen ist. Der Evidence-Branch ist nicht `DELETE-SAFE`.
- Dieser Slice schliesst #88 nicht und löscht den Branch nicht.
- #88 ist Historical Evidence vom 26.08.2026, nicht Current Truth.

Dieselbe Achsentrennung gilt für #52, #40 und #39: PR darf später `CLOSE-SAFE` geschlossen werden; der Branch bleibt `HISTORICAL-EVIDENCE`, bis Unique Content gesichert ist.

#28 bleibt `KEEP-FUTURE` + Branch `FUTURE` und wird nicht beiläufig geschlossen.

## 8. Deliverables

- `docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md` – diese Datei
- `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`
- `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`
- `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`
- `docs/PROJECT_SANITATION_CLOSURE_SELF_REVIEW_2026-08-28.md`
- `docs/PROJECT_SANITATION_CLOSURE_HANDOFF_2026-08-28.md`
- `docs/PROJECT_SANITATION_AGENT_ROTATION_RECORD_GENERATION_3_2026-08-28.md`
- read-only Invariant-Test `lib/project-sanitation/closure-invariants.test.ts`

Die Originaldateien von PR #88 bleiben auf dem historischen Branch. Sie werden hier nicht nach `docs/history/` kopiert, damit Production-Projektrefs nicht erneut gestaged werden. Unique Evidence hängt am **Branch**, nicht am offenen PR-Zustand.

## 9. STOPP

Nach Exact-Head-CI/Vercel-Evidence des Review-Fix:

- nicht Ready setzen
- nicht mergen
- nicht aufräumen
- keine PRs schliessen
- keine Branches löschen
- keine Folgearbeit starten

Technical Lead entscheidet danach, welche alten PRs wirklich geschlossen und welche Branches wirklich gelöscht werden dürfen. Das sind zwei getrennte Freigaben.
