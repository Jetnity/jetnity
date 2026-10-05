# Jetnity – Project Sanitation Live Inventory / Reconciliation Status

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Branch: `cursor/project-sanitation-closure-2966`  
Draft-PR: [#135](https://github.com/Jetnity/jetnity/pull/135)  
Typ: LIVE RECONCILIATION / NON-DESTRUCTIVE  
ADR: **ADR-0184**

> **Do not blindly trust this file — live verify `origin/main`, PRs, branches and Exact Head first.**

Historische Inventur vom 26.08.2026 bleibt Evidence auf Branch `audit/project-sanitation-inventory-2026-08-26` @ `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8` (heute noch Draft-PR #88). Sie ist **nicht** Current Truth und wurde bewusst nicht nach `docs/history/` kopiert.

---

## 0. Live-Baseline

### 0.1 Authoring-Start (historisch, vor PR #133)

Rekonstruiert am 28. August 2026 gegen `eaa03ad7`.

| Fakt | Damalige Live-Evidence |
| --- | --- |
| `origin/main` | `eaa03ad71509d281990e0d34ca359e0750eb9591` |
| Main-Message | `Merge PR #131: close AP-5 Gate 0 canonical pointers` |
| Offene PRs | 7; nach erstem Draft **8** inkl. #135 |
| Remote-Heads | **135** inkl. `main` |
| Parallel damals | #133 / Issue #132 waren ACTIVE. **Heute MERGED / CLOSED / completed; nicht Current Truth** |

Pre-Rebase Exact-Head-Stamps (`30893fa0`, `4c2e99a5`, Actions `33164083125` / `33164310089`, Vercel `6139730729` / `6139772480`) sind **stale**. Sie gelten nicht als aktueller Gate.

### 0.2 Review-Fix nach PR #133 (aktuell)

Live geprüft am 28. August 2026.

| Fakt | Live-Evidence |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| `origin/main` | `51b0c926dbb535c6791b69f1b4b1ee7503f0ebe2` |
| Main-Message | `Merge PR #133: AP-5-S1 truthful security UI` |
| Merge-Base dieses Branches | `51b0c926` / **0 behind** gegenüber `origin/main` |
| Draft-PR | [#135](https://github.com/Jetnity/jetnity/pull/135) |
| Review-Auslöser | Review `5050411074` CHANGES REQUIRED auf Head `4c2e99a5` |
| Exact Head dieses Review-Fix | `bcf1cb5c1833e6ca565c3cf281b3c900b852e5ef` |
| Merge-Base / Ahead / Behind | `51b0c926` / **5 / 0** |
| Exact-Head GitHub Actions | Run `33165746670` **SUCCESS** auf exakt `bcf1cb5c` |
| Exact-Head Vercel Preview | Deployment `6140045492` / Inspector `2LnmDvHF6XKHintf2u6caa6hQy49` **READY** auf exakt `bcf1cb5c` |
| Review-Threads nach Fix | 1 historische Review `5050411074` auf dem alten Head; 0 neue Inline-Threads |
| Offene PRs | **7:** #135, #88, #52, #50, #40, #39, #28 |
| PR #133 | **MERGED** `51b0c926` |
| Issue #132 | **CLOSED / completed** |
| Agent 9 | **abgeschlossen** |
| Offene Issues | #134, #110, #109, #20 |
| Remote-Heads | **136** inkl. `main` |
| Annotated Tags | **3** |
| `main` Branch Protection | `protected=false` |
| Tracked Files auf `main` | **1252** |
| `docs/` auf `main` | **371** |
| ADR-0183 | AP-5-S1 integriert |
| Sanitation-ADR | **ADR-0184** |
| S1-Task-Datei | `docs/AP5_S1_SECURITY_UI_TRUTH_TASK_2026-08-28.md` **existiert** auf `main` |

PR #87 / TW6-B und AP-5 Gate 0 / PR #129 bleiben gemergt. AP-5-S1 ist jetzt ebenfalls gemergt. Continuity-Dateien auf `main` können hinter diesem Live-Stand zurückliegen; Live-Evidence gewinnt.

---

## 1. Was dieser Slice getan hat

- Live-Inventur von `main`, offenen PRs, Remote-Branches und Tags
- Unique-Content-Diff jedes alten offenen Draft-PRs gegen `origin/main`
- Reklassifikation aller PR-#88-Findings
- Branch-Disposition für alle Remote-Heads
- PR- vs. Branch-Disposition getrennt (Review P1-4)
- Rebase auf `51b0c926`; ADR-0184; S1-Absence-Invariant entfernt
- PR-#88-Originaldateien bewusst nicht kopiert; Unique Inventory-Evidence bleibt auf dem historischen Branch
- Continuity-Zeiger und Generation-3-Rotation-Record

In diesem Slice **nicht** geschehen:

- kein Branch/Tag/PR gelöscht, geschlossen oder gemergt
- keine Runtime-Datei bereinigt
- keine Account-/Auth-Datei von Issue #132 geändert
- integrierte AP-5-S1-Evidence nicht rückwärts geschrieben
- kein Supabase-/Vercel-/Cloud-Write
- keine Migration, kein RLS-/Auth-Write

---

## 2. Offene und gemergte PRs – Kurzstand

Zwei Achsen. Close löscht den Branch nicht.

| PR | Head | Draft | Mergeable | PR-Disposition | Branch-Disposition |
| --- | --- | --- | --- | --- | --- |
| **#135** Project Sanitation Closure | `cursor/project-sanitation-closure-2966` | ja | nach Rebase neu prüfen | **OPEN** – dieser Slice | `ACTIVE` |
| **#133** AP-5-S1 Security-UI | `cursor/ap5-s1-security-ui-8b13` @ `e7500b12` | – | MERGED | **MERGED** | `DELETE-SAFE` (leftover; Tip ist Ancestor von `main`; Unique Files = 0) |
| **#88** Project Sanitation Inventur 26.08. | `audit/project-sanitation-inventory-2026-08-26` @ `a5fbaa6d` | ja | MERGEABLE | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` (2 Unique Files) |
| **#52** TL-Handoff 24.08. | `docs/chatgpt-technical-lead-handoff-2026-08-24` | ja | CONFLICTING / UNKNOWN | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` (7 Unique Files) |
| **#50** S1 merged-status | `cursor/s1-merged-status-f23f` | ja | CONFLICTING | **CLOSE-SAFE** | `DELETE-SAFE` (leftover; Unique Files vs Merge-Base = 0) |
| **#40** Admin Platform Audit | `audit/admin-platform` | ja | CONFLICTING | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` (19 Unique Files) |
| **#39** Account Platform Audit | `audit/account-platform` | ja | CONFLICTING | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` (10 Unique Files) |
| **#28** Trip Collaboration Foundation | `feat/trip-collaboration-foundation` | ja | MERGEABLE / UNKNOWN | **KEEP-FUTURE** | `FUTURE` |

Keine weiteren alten offenen Drafts gefunden. Vollständige Begründung: `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`.

### Eine Regel für #88

PR #88 darf später geschlossen werden, weil Close die Unique Files nicht löscht.  
Branch `audit/project-sanitation-inventory-2026-08-26` bleibt `HISTORICAL-EVIDENCE`, bis die zwei Inventur-Dateien archiviert oder sonst dauerhaft erreichbar sind.  
Branch-Delete bleibt blockiert, bis Preservation bewiesen ist.  
Dieser Slice führt weder Close noch Delete aus.

---

## 3. PR-#88-Findings neu geprüft

Klassifikation jedes alten Fundes:

| Finding | 26.08. Klasse | 28.08. Live | Heutige Klasse |
| --- | --- | --- | --- |
| Getrackte `supabase/.temp/*` trotz `.gitignore` | DELETE-CANDIDATE / P1 | weiterhin 5 Dateien getrackt | **still actionable** |
| Getrackte `supabase/.branches/_current_branch` | DELETE-CANDIDATE | weiterhin getrackt, Inhalt `main` | **still actionable** |
| `pooler-url` Production-Ref + Platzhalterpasswort | P1 Hygiene, kein Live-Secret | 1 Zeile, Platzhalter `[YOUR-PASSWORD]`, Production-Ref vorhanden, **kein** Live-Passwort reproduziert | **still actionable** |
| `public/images/prague.jpg` unreferenziert | DELETE-CANDIDATE | weiterhin getrackt; kein Code-/Docs-Treffer | **still actionable** |
| `CookieConsent` tot + V1-Text + `/privacy` 404 | NEEDS-DECISION / G0-P2-02 | Datei existiert; einzige `check:dead`-Ausnahme; nicht gemountet | **still actionable** |
| V1 Image-Hosts in `next.config.js` (`jetnity.ai`, DALL-E-Blob) | NEEDS-DECISION / P2 | beide Hosts weiterhin nur in der Config | **still actionable** |
| `components.json` Alias `@/hooks` ohne Verzeichnis | NEEDS-DECISION | Alias vorhanden; `hooks/` existiert nicht | **still actionable** |
| ~103 Remote-Branches | P2 | **136** Remote-Heads | **current** – Bestand gewachsen durch spätere gemergte Slices |
| Offene historische Drafts #52/#50/#40/#39/#28 | NEEDS-DECISION | fünf noch offen; plus #88; #133 MERGED; plus aktives #135 | **current** |
| `jetnity-bets` / `jrixsujkzvlvglvcmtia` | DECOMMISSION-CANDIDATE / PO-Gate | nur in Docs, nicht im Produktcode | **historical** + **still actionable** als Cloud-Gate |
| Unique Docs nur auf #39/#40/#52 | P1 Evidence-Verlust | Unique Files weiterhin nicht auf `main`; hängen am **Branch**, nicht am offenen PR | **current** |
| `chore/account-admin-team-prep` Unique Docs | NEEDS-DECISION | 9 Unique Docs, u. a. Homepage-Richtung | **current** |
| V1 Creator/Heatmap/Amadeus-Tabellen | bereits entfernt | bleibt entfernt | **resolved** |
| `@supabase/auth-helpers-*` | bereits entfernt | bleibt entfernt | **resolved** |
| PR #87 als aktive Runtime-Arbeit | ACTIVE 26.08. | PR #87 gemergt | **superseded** |
| Continuity auf `main` hinter #87 | P2 26.08. | später durch viele Continuity-PRs ersetzt | **superseded** als #87-Problem; **current** als allgemeines Continuity-Lag-Risiko |
| P2-TA-06 `documents[0]` | offenes Finding 26.08. | durch PR #113 integriert | **resolved** |
| Hygiene-Checks beweisen keine Asset-/Branch-/Cloud-Sauberkeit | adversarial Lücke | unverändert wahr | **current** |
| `main` Branch Protection aus | P1 Governance | live `protected=false` | **still actionable** |
| Docs-Navigation ohne Index | ARCHIVE-CANDIDATE | `docs/` jetzt 371 Dateien | **still actionable** |
| `check:deps` stale `zod`-Ausnahme | P3 | nicht in diesem Slice verifiziert als geschlossen | **historical** / separat prüfen |
| „Mega Pro“-Kommentar in `check-jetnity-setup.ts` | P3 | nicht in diesem Slice geändert | **historical** |
| Temp-/Duplikat-SHA-Branches | P3 | weiterhin vorhanden | **still actionable** |
| Kein `jetnity-travel`-Ref | positiv 26.08. | weiterhin kein Treffer | **resolved** als Nicht-Fund |
| Archive-Tags | KEEP-HISTORICAL | dieselben 3 Tags | **current** / behalten |
| UI-Audit-Harness / Admin-Platzhalter / Migrationen / ADRs | KEEP | weiterhin nicht löschen | **current** |
| AP-5-S1 / PR #133 | nicht in der 26.08.-Inventur | MERGED; Issue #132 CLOSED; Agent 9 completed | **resolved / integrated** |

Keine Löschung oder Runtime-Reparatur in diesem Slice.

---

## 4. Security-/Privacy-Revalidation

Keine Secrets in diesem Bericht reproduziert.

| ID | Fund | 28.08. | Remediation (später, nicht jetzt) |
| --- | --- | --- | --- |
| S-01 | getrackte `pooler-url` mit Production-Ref + Platzhalter | **still actionable** | `git rm --cached`; kein History-Rewrite |
| S-02 | getrackte `.temp/`-Gruppe kann künftig echte CLI-Secrets aufnehmen | **still actionable** | Untracken, damit Ignore greift |
| S-03 | `main` Branch Protection aus | **still actionable** | eigenes Governance-Gate |
| S-04 | V1 Image-Allowlist | **still actionable** | eigener Runtime-Config-Slice |
| S-05 | CookieConsent / `/privacy` 404 | **still actionable** | Legal-Slice oder Delete; nicht still verdrahten |
| S-06 | Unique Identity-/Admin-Docs nur auf historischen Branches | **still actionable** | PR darf `CLOSE-SAFE` geschlossen werden; **Branch** behalten, bis Evidence gesichert ist |
| S-07 | UI-Audit-JWTs | unverändert Platzhalter | kein Secret |
| S-08 | `.cursor/mcp.json` / `.env.example` | unverändert Platzhalter | sauber |
| S-09 | `jetnity-bets` nicht im Produktcode | unverändert | Cloud-Decommission bleibt PO-Gate |
| S-10 | Hygiene-Checks ≠ AAL2-/RLS-Beweis | unverändert | bleibt QS-/Admin-Thema |

P0: keines. Kein Live-Secret im Tree gefunden.

---

## 5. Branch-Zusammenfassung

Live Remote-Heads: **136** inkl. `main` und dieses Closure-Branches.

| Klasse | Anzahl | Bemerkung |
| --- | --- | --- |
| ACTIVE | 2 | `main`, dieser Closure-Branch |
| DELETE-SAFE | 127 | 114 leftover + 13 stale/dup |
| HISTORICAL-EVIDENCE | 5 | #88/#39/#40/#52-Branches plus `docs/post-pr98-continuity-2026-08-27` |
| FUTURE | 1 | `feat/trip-collaboration-foundation` |
| NEEDS-REVIEW | 1 | `chore/account-admin-team-prep` |
| **Summe** | **136** | |

Vollständige Tabelle: `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`.

---

## 6. Was später gelöscht / geschlossen werden *könnte*

Nur Kandidaten. **Nicht ausgeführt.**  
PR-Close und Branch-Delete sind getrennte Technical-Lead-Freigaben.

### PR-Close-Kandidaten nach Technical-Lead-Liste

1. PR #50 – Unique Files vs Merge-Base = 0. Close verliert keine Evidence.
2. PR #88 – `CLOSE-SAFE`. Close löscht den Branch nicht. Unique Inventur-Dateien bleiben auf `audit/project-sanitation-inventory-2026-08-26`.
3. PR #52, #40, #39 – ebenfalls `CLOSE-SAFE`. Close allein verliert die Unique Docs nicht.
4. PR #28 **nicht** beiläufig schliessen. `KEEP-FUTURE`.

### Branch-Delete-Kandidaten nach eigener Freigabe

1. `DELETE-SAFE` leftover-Branches, deren Tip Ancestor von `main` ist oder deren zugehöriger PR `MERGED` ist und Unique Files = 0. Inklusive `cursor/ap5-s1-security-ui-8b13` und `cursor/s1-merged-status-f23f`.
2. Temp-/Duplikat-SHA-Branches (`do-not-use`/`tmp-noop`, admin-sync-temp*, domain-policy-Duplikate, shadow).
3. `git rm --cached` für `supabase/.temp/*` und `supabase/.branches/_current_branch` (Runtime-Hygiene, kein Branch-Delete).
4. `prague.jpg` entfernen (Runtime-Hygiene).

### Nicht löschen ohne Sicherung (Branch-/Evidence-Retention)

- Branches von #88, #52, #40, #39 – Unique Docs nicht auf `main`
- PR #28 + Branch – Unique Future-Spec + Issue #20 offen
- `chore/account-admin-team-prep` – Unique Homepage-/Shared-Contract-Entwürfe
- `docs/post-pr98-continuity-2026-08-27` – Unique Checkpoint-Datei nicht auf `main`
- Archive-Tags
- Migrationen, ADRs, Acceptance, UI-Audit-Harness, Admin-Platzhalter
- integrierte AP-5-S1-Dateien auf `main`

### Product-Owner-Gates

- Pause/Delete von `jetnity-bets` / jedem Cloud-Projekt
- History-Rewrite
- Vercel-Projektänderung
- Production-Daten-/Schemaänderung
- Cookie-/Privacy-Text, der Nutzer sichtbar wird
- Secret-Rotation (für den aktuellen Platzhalter unbegründet)

---

## 7. Vorgeschlagene spätere Bereinigungsreihenfolge

Nicht starten. Zwei Achsen, zwei Freigaben.

1. Unabhängiger Technical-Lead-Re-Review dieses Closure-PRs.
2. Optional Unique-Content-Sicherung nach `docs/history/` **oder** bewusste Branch-Retention.
3. Nach Landung dieses PRs: PR-Close von #50, danach #88/#52/#40/#39. Branches von #88/#52/#40/#39 bleiben, bis Preservation bewiesen ist.
4. Temp-/Duplikat-Branches löschen.
5. `DELETE-SAFE` leftover in Chargen löschen, inkl. S1-Leftover und #50-Branch.
6. Eigenes Hygiene-PR für Untrack von `.temp`/`.branches`.
7. Eigenes Runtime-Micro-PR für `prague.jpg` / CookieConsent-Entscheidung / V1 Image-Hosts.
8. Optional `docs/EVIDENCE_INDEX.md` ohne Massenverschiebung.
9. Cloud `jetnity-bets` nur nach Product-Owner-Gate.
10. Branch Protection als eigenes Governance-Gate.
11. #28 erst schliessen, wenn Issue #20 bewusst archiviert oder ein Collaboration-Slice die Spec dauerhaft trägt.

---

## 8. Traveller-Kontext

Dieser Slice ändert keine Traveller-/Citizenship-/Document-Logik.  
P2-TA-06 ist integriert. Collaboration bleibt Future (Issue #20).  
Keine Credentials gesammelt oder propagiert.

---

## 9. Explizite Nicht-Aussagen

- Dieser Bericht behauptet nicht, Supabase- oder Vercel-Cloud live mutiert oder vollständig neu inventarisiert zu haben. Cloud-Sätze zu `jetnity-bets` stammen aus Repo-Docs plus der 26.08.-Evidence.
- Unique Docs auf #39/#40/#52/#28/`chore/account-admin-team-prep` wurden auf Existenz und Überschneidung mit `main` geprüft, nicht als neue kanonische Produktverträge übernommen.
- Hygiene grün beweist keine Asset-/Branch-/Cloud-Sauberkeit.
- Unreferenziert bedeutet nicht sicher löschbar ohne History-/Governance-Kontext.
- Dateiexistenz im Tree beweist **nicht** git-diff-Nicht-Änderung. Der Invariant-Test ist read-only Evidence-Lock, kein Diff-Beweis.

---

## 10. STOPP

Nichts gelöscht. Nichts geschlossen. Nichts gemergt. Kein Cloud-Write. Kein Folgeslice.  
PR bleibt Draft. Technical Lead entscheidet die tatsächliche Bereinigung nach frischem Re-Review.
