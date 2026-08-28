# Jetnity – Project Sanitation Live Inventory / Reconciliation Status

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Branch: `cursor/project-sanitation-closure-2966`  
Draft-PR: [#135](https://github.com/Jetnity/jetnity/pull/135)  
Typ: LIVE RECONCILIATION / NON-DESTRUCTIVE

> **Do not blindly trust this file — live verify `origin/main`, PRs, branches and Exact Head first.**

Historische Inventur vom 26.08.2026 bleibt Evidence auf Draft-PR #88 @ `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8`. Sie ist **nicht** Current Truth und wurde bewusst nicht nach `docs/history/` kopiert.

---

## 0. Live-Baseline

Rekonstruiert am 28. August 2026.

| Fakt | Live-Evidence |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| `origin/main` | `eaa03ad71509d281990e0d34ca359e0750eb9591` |
| Main-Message | `Merge PR #131: close AP-5 Gate 0 canonical pointers` |
| Dieser Authoring-Start | exakt aktuelles `origin/main` |
| Offene PRs | **7** |
| Remote-Heads | **135** inkl. `main` |
| Annotated Tags | **3** |
| `main` Branch Protection | `protected=false` |
| Offene Issues | #134, #132, #110, #109, #20 |
| Tracked Files auf `main` | **1237** |
| `docs/` auf `main` | **364** |
| Parallel aktiver Runtime-/Account-PR | **#133** / Issue #132 – nicht angefasst |

PR #87 / TW6-B, das in PR #88 noch als aktive Runtime-Arbeit galt, ist inzwischen gemergt. AP-5 Gate 0 / PR #129 ist ebenfalls gemergt. Continuity-Dateien auf `main` können hinter diesem Live-Stand zurückliegen; Live-Evidence gewinnt.

---

## 1. Was dieser Slice getan hat

- Live-Inventur von `main`, offenen PRs, Remote-Branches und Tags
- Unique-Content-Diff jedes alten offenen Draft-PRs gegen `origin/main`
- Reklassifikation aller PR-#88-Findings
- Branch-Disposition für alle 135 Remote-Heads
- PR-#88-Originaldateien bewusst nicht kopiert; Unique Inventory-Evidence bleibt auf Draft-PR #88
- Continuity-Zeiger und Generation-3-Rotation-Record

In diesem Slice **nicht** geschehen:

- kein Branch/Tag/PR gelöscht, geschlossen oder gemergt
- keine Runtime-Datei bereinigt
- keine Account-/Auth-Datei von Issue #132 geändert
- kein Supabase-/Vercel-/Cloud-Write
- keine Migration, kein RLS-/Auth-Write

---

## 2. Offene PRs – Kurzstand

| PR | Head | Draft | Mergeable | Klasse dieses Slices |
| --- | --- | --- | --- | --- |
| **#133** AP-5-S1 Security-UI | `cursor/ap5-s1-security-ui-8b13` | ja | MERGEABLE | **ACTIVE** – Parallelagent 9; nicht anfassen |
| **#88** Project Sanitation Inventur 26.08. | `audit/project-sanitation-inventory-2026-08-26` @ `a5fbaa6d` | ja | MERGEABLE | `KEEP-HISTORICAL-OPEN` |
| **#52** TL-Handoff 24.08. | `docs/chatgpt-technical-lead-handoff-2026-08-24` | ja | CONFLICTING | `KEEP-HISTORICAL-OPEN` |
| **#50** S1 merged-status | `cursor/s1-merged-status-f23f` | ja | CONFLICTING | `CLOSE-SAFE` |
| **#40** Admin Platform Audit | `audit/admin-platform` | ja | CONFLICTING | `KEEP-HISTORICAL-OPEN` |
| **#39** Account Platform Audit | `audit/account-platform` | ja | CONFLICTING | `KEEP-HISTORICAL-OPEN` |
| **#28** Trip Collaboration Foundation | `feat/trip-collaboration-foundation` | ja | MERGEABLE | `KEEP-FUTURE` |

Keine weiteren alten offenen Drafts gefunden. Vollständige Begründung: `docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md`.

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
| ~103 Remote-Branches | P2 | **135** Remote-Heads | **current** – Bestand gewachsen durch spätere gemergte Slices |
| Offene historische Drafts #52/#50/#40/#39/#28 | NEEDS-DECISION | alle fünf noch offen; plus #88 und aktives #133 | **current** |
| `jetnity-bets` / `jrixsujkzvlvglvcmtia` | DECOMMISSION-CANDIDATE / PO-Gate | nur in Docs, nicht im Produktcode | **historical** + **still actionable** als Cloud-Gate |
| Unique Docs nur auf #39/#40/#52 | P1 Evidence-Verlust | Unique Files weiterhin nicht auf `main` | **current** |
| `chore/account-admin-team-prep` Unique Docs | NEEDS-DECISION | 9 Unique Docs, u. a. Homepage-Richtung | **current** |
| V1 Creator/Heatmap/Amadeus-Tabellen | bereits entfernt | bleibt entfernt | **resolved** |
| `@supabase/auth-helpers-*` | bereits entfernt | bleibt entfernt | **resolved** |
| PR #87 als aktive Runtime-Arbeit | ACTIVE 26.08. | PR #87 gemergt | **superseded** |
| Continuity auf `main` hinter #87 | P2 26.08. | später durch viele Continuity-PRs ersetzt; `ACTIVE_WORK_STATUS.md` kann trotzdem hinter Live zurückliegen | **superseded** als #87-Problem; **current** als allgemeines Continuity-Lag-Risiko |
| P2-TA-06 `documents[0]` | offenes Finding 26.08. | durch PR #113 integriert | **resolved** |
| Hygiene-Checks beweisen keine Asset-/Branch-/Cloud-Sauberkeit | adversarial Lücke | unverändert wahr | **current** |
| `main` Branch Protection aus | P1 Governance | live `protected=false` | **still actionable** |
| Docs-Navigation ohne Index | ARCHIVE-CANDIDATE | `docs/` jetzt 364 Dateien | **still actionable** |
| `check:deps` stale `zod`-Ausnahme | P3 | nicht in diesem Slice verifiziert als geschlossen | **historical** / separat prüfen |
| „Mega Pro“-Kommentar in `check-jetnity-setup.ts` | P3 | nicht in diesem Slice geändert | **historical** |
| Temp-/Duplikat-SHA-Branches | P3 | weiterhin vorhanden | **still actionable** |
| Kein `jetnity-travel`-Ref | positiv 26.08. | weiterhin kein Treffer | **resolved** als Nicht-Fund |
| Archive-Tags | KEEP-HISTORICAL | dieselben 3 Tags | **current** / behalten |
| UI-Audit-Harness / Admin-Platzhalter / Migrationen / ADRs | KEEP | weiterhin nicht löschen | **current** |

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
| S-06 | Unique Identity-/Admin-Docs nur auf stale PRs | **still actionable** | nicht schliessen, bevor Evidence gesichert ist |
| S-07 | UI-Audit-JWTs | unverändert Platzhalter | kein Secret |
| S-08 | `.cursor/mcp.json` / `.env.example` | unverändert Platzhalter | sauber |
| S-09 | `jetnity-bets` nicht im Produktcode | unverändert | Cloud-Decommission bleibt PO-Gate |
| S-10 | Hygiene-Checks ≠ AAL2-/RLS-Beweis | unverändert | bleibt QS-/Admin-Thema |

P0: keines. Kein Live-Secret im Tree gefunden.

---

## 5. Branch-Zusammenfassung

| Klasse | Anzahl | Bemerkung |
| --- | --- | --- |
| ACTIVE | 2 vor diesem Branch; 3 inkl. dieses Slices | `main`, PR #133, dieser Closure-Branch |
| MERGED-HEAD-LEFTOVER | 112 | Ancestor-Tips plus Squash-Reste ohne Unique Files |
| HISTORICAL-EVIDENCE | 6 | offene historische PR-Branches plus `docs/post-pr98-continuity-2026-08-27` |
| STALE / SUPERSEDED | 13 | Temp-/Duplikat-/geschlossene Continuity-Reste |
| FUTURE-WORK | 1 | `feat/trip-collaboration-foundation` |
| UNKNOWN / NEEDS REVIEW | 1 | `chore/account-admin-team-prep` |
| **Summe** | **135** | vor Push dieses Branches |

Vollständige Tabelle: `docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md`.

Nach Push dieses Branches steigt die Remote-Head-Zahl um 1, Klasse ACTIVE.

---

## 6. Was später gelöscht / geschlossen werden *könnte*

Nur Kandidaten. **Nicht ausgeführt.**

### Reversibel nach Technical-Lead-Liste

1. PR #50 schliessen – keine Unique Files.
2. PR #88 offen lassen, bis die Original-Inventur bewusst archiviert ist. Ohne Kopie bleibt #88 `KEEP-HISTORICAL-OPEN`.
3. MERGED-HEAD-LEFTOVER-Branches löschen, deren Tip Ancestor von `main` ist oder deren zugehöriger PR `MERGED` ist und Unique Files = 0.
4. Temp-/Duplikat-SHA-Branches löschen (`do-not-use`/`tmp-noop`, admin-sync-temp*, domain-policy-Duplikate, shadow).
5. `git rm --cached` für `supabase/.temp/*` und `supabase/.branches/_current_branch`.
6. `prague.jpg` entfernen.

### Nicht schliessen / nicht löschen ohne Sicherung

- PR #52, #40, #39 – Unique Docs nicht auf `main`
- PR #28 + Branch – Unique Future-Spec + Issue #20 offen
- `chore/account-admin-team-prep` – Unique Homepage-/Shared-Contract-Entwürfe
- `docs/post-pr98-continuity-2026-08-27` – Unique Checkpoint-Datei nicht auf `main`
- Archive-Tags
- Migrationen, ADRs, Acceptance, UI-Audit-Harness, Admin-Platzhalter

### Product-Owner-Gates

- Pause/Delete von `jetnity-bets` / jedem Cloud-Projekt
- History-Rewrite
- Vercel-Projektänderung
- Production-Daten-/Schemaänderung
- Cookie-/Privacy-Text, der Nutzer sichtbar wird
- Secret-Rotation (für den aktuellen Platzhalter unbegründet)

---

## 7. Vorgeschlagene spätere Bereinigungsreihenfolge

Nicht starten.

1. Unabhängiger Technical-Lead-Review dieses Closure-PRs.
2. Unique-Content-Sicherung oder bewusste Retention von #39, #40, #52, `chore/account-admin-team-prep`, PR-#98-Checkpoint.
3. PR #50 und danach #88 schliessen, sobald dieses PR auf `main` ist.
4. Temp-/Duplikat-Branches löschen.
5. MERGED-HEAD-LEFTOVER in Chargen löschen.
6. Eigenes Hygiene-PR für Untrack von `.temp`/`.branches`.
7. Eigenes Runtime-Micro-PR für `prague.jpg` / CookieConsent-Entscheidung / V1 Image-Hosts.
8. Optional `docs/EVIDENCE_INDEX.md` ohne Massenverschiebung.
9. Cloud `jetnity-bets` nur nach Product-Owner-Gate.
10. Branch Protection als eigenes Governance-Gate.

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

---

## 10. STOPP

Nichts gelöscht. Nichts geschlossen. Nichts gemergt. Kein Cloud-Write. Kein Folgeslice.

Technical Lead entscheidet die tatsächliche Bereinigung.
