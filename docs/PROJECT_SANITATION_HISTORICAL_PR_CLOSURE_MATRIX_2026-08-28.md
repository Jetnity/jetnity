# Jetnity – Historical PR Closure Matrix

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Vergleichsbasis Review-Fix: `origin/main` @ `51b0c926dbb535c6791b69f1b4b1ee7503f0ebe2`  
Ursprüngliche Authoring-Basis: `eaa03ad71509d281990e0d34ca359e0750eb9591`

> Alte PRs werden nicht gemergt, nur um die Liste aufzuräumen.  
> **PR-Close und Branch-Delete sind getrennte Operationen.** Close löscht den Source-Branch nicht.

---

## 0. Zwei Achsen

| Achse | Frage | Nicht verwechseln mit |
| --- | --- | --- |
| PR-Disposition | Darf der Pull Request geschlossen werden, ohne Unique Files zu verlieren? | Branch-Delete |
| Branch-Retention | Darf der Source-Branch gelöscht werden, ohne Unique Evidence zu verlieren? | PR-Close |

PR-Klassen: `OPEN`, `MERGED`, `CLOSE-SAFE`, `KEEP-FUTURE`, `NEEDS-REVIEW`.  
Branch-Klassen: `ACTIVE`, `DELETE-SAFE`, `HISTORICAL-EVIDENCE`, `FUTURE`, `NEEDS-REVIEW`.

---

## 1. Offene und soeben gemergte PRs am 28.08.2026 (Review-Fix)

Sieben offene PRs plus das integrierte #133. Kein zusätzlicher alter Draft entdeckt.

| PR | Titel | Branch | Ahead/Behind vs `51b0c926` | Mergeable | PR-Disposition | Branch-Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| #135 | Project Sanitation Closure | `cursor/project-sanitation-closure-2966` | nach Review-Fix-Commit | Draft | **OPEN** | `ACTIVE` |
| #133 | AP-5-S1 Security-UI | `cursor/ap5-s1-security-ui-8b13` | 0 / 1 | MERGED | **MERGED** | `DELETE-SAFE` |
| #88 | Project Sanitation Audit 26.08. | `audit/project-sanitation-inventory-2026-08-26` | 2 / 207 | MERGEABLE | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` |
| #52 | ChatGPT TL handoff 24.08. | `docs/chatgpt-technical-lead-handoff-2026-08-24` | 67 / 556 | CONFLICTING / UNKNOWN | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` |
| #50 | Provider Ops S1 merged-status | `cursor/s1-merged-status-f23f` | 3 / 559 | CONFLICTING | **CLOSE-SAFE** | `DELETE-SAFE` |
| #40 | Admin Platform Audit | `audit/admin-platform` | 15 / 565 | CONFLICTING | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` |
| #39 | Account Platform Audit | `audit/account-platform` | 11 / 565 | CONFLICTING | **CLOSE-SAFE** | `HISTORICAL-EVIDENCE` |
| #28 | Trip Collaboration Foundation | `feat/trip-collaboration-foundation` | 1 / 631 | MERGEABLE / UNKNOWN | **KEEP-FUTURE** | `FUTURE` |

---

## 2. PR #133 – MERGED / integriert

Issue #132 **CLOSED / completed**. Agent `Account plattform audit vorbereitung 9` **abgeschlossen**.

Merge: `51b0c926dbb535c6791b69f1b4b1ee7503f0ebe2` am 28.08.2026.  
Branch-Tip `e7500b12` ist Ancestor von `main`. Unique Files gegen `main` = 0.

Dieser Slice fasst Account-/Auth-Runtime und `docs/AP5_S1_*` nicht an.  
ADR-0183 bleibt die S1-Entscheidung.

---

## 3. PR #88 – Project Sanitation Audit 26.08.

| Feld | Wert |
| --- | --- |
| Head | `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8` |
| Merge-Base | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Unique Files | `docs/PROJECT_SANITATION_AUDIT_TASK_2026-08-26.md`, `docs/PROJECT_SANITATION_AUDIT_STATUS_2026-08-26.md` |
| Auf `main`? | nein. Bewusst nicht nach `docs/history/` kopiert |
| Inhalt integriert? | nein als Current Truth; Findings hier neu geprüft |
| Superseded? | als Current Inventory ja; als Historical Evidence nein |
| Evidence-Verlust bei PR-Close? | **nein** – Close löscht den Branch nicht |
| Evidence-Verlust bei Branch-Delete? | **ja**, solange die zwei Dateien nicht dauerhaft archiviert sind |

**Eine Regel:**  
PR-Disposition `CLOSE-SAFE`. Branch-Disposition `HISTORICAL-EVIDENCE`.  
Nicht mergen: der Branch steht 207 Commits hinter aktuellem `main` und ist historische Inventur, kein aktueller Vertrag.  
PR darf später geschlossen werden. Branch-Delete bleibt blockiert, bis Preservation bewiesen ist.  
Dieser Slice führt weder Close noch Delete aus.

Unabhängiger TL-Review vom 26.08. (PASS / INTEGRATION DEFERRED) bleibt gültig als damalige Evidence.

---

## 4. PR #52 – Technical-Lead-Handoff 24.08.

| Feld | Wert |
| --- | --- |
| Head | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` |
| Unique Files | 7 Continuity-Snapshots, siehe unten |
| Divergenz | `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md` |
| Auf `main`? | Unique Files **nein**. Build Order existiert auf `main` in späterer kanonischer Fassung |
| Evidence-Verlust bei PR-Close? | **nein** |
| Evidence-Verlust bei Branch-Delete? | **ja**, ohne Archivkopie |

Unique Files, die nur auf diesem Branch liegen:

- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
- `docs/CHATGPT_TAKEOVER_LIVE_VERIFICATION_2026-08-24.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`
- `docs/CURRENT_MULTI_AGENT_TEAM_STATUS_2026-08-24_1833.md`
- `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`
- `docs/NEW_CHAT_START_PROMPT_2026-08-24.md`

`docs/JETNITY_BINDING_BUILD_ORDER.md` wurde später kanonisch auf `main` aufgenommen; die PR-#52-Fassung ist diverged/superseded.

**PR-Disposition:** `CLOSE-SAFE`.  
**Branch-Disposition:** `HISTORICAL-EVIDENCE`.  
Nicht mergen: CONFLICTING, 556 hinter aktuellem `main`, Inhalt als Current Truth durch spätere Start-Here-/Handoff-/Checkpoint-Linie superseded.

---

## 5. PR #50 – Provider Ops S1 merged-status

| Feld | Wert |
| --- | --- |
| Head | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` |
| Unique Files vs Merge-Base, nicht auf `main` | **0** |
| Geänderte Dateien | nur bereits auf `main` vorhandene Continuity-/S1-Dateien, alle **DIVERGED** |

Zwei Dateien existieren noch im Branch-Tree, aber nicht mehr auf `main` (`app/(admin)/admin/head.tsx`, `components/admin/home/AdminSetupGuide.tsx`). Sie wurden von diesem Branch gegenüber seiner Merge-Base **nicht hinzugefügt**; `main` hat sie später entfernt. Das zählt nicht als Unique Content dieses Drafts.

S1 ist über PR #47 und spätere Provider-Slices auf `main`. Die Statuszeilen dieses Drafts sind durch spätere Handoffs/Statusdateien ersetzt.

**PR-Disposition:** `CLOSE-SAFE`.  
**Branch-Disposition:** `DELETE-SAFE`.  
Schliessen verliert keine Unique Docs. Branch-Delete darf später in derselben Leftover-Charge erfolgen.  
Nicht mergen: CONFLICTING, reiner historischer Status-Stamp.

---

## 6. PR #40 – Admin Platform Audit

| Feld | Wert |
| --- | --- |
| Head | `a316015733b86e2adbd050abb2f77258a99da366` |
| Unique Files | 19 Docs, die auf `main` fehlen |
| Evidence-Verlust bei PR-Close? | **nein** |
| Evidence-Verlust bei Branch-Delete? | **ja**, ohne Archivkopie |

Unique, nicht auf `main`:

- `docs/ADMIN_PLATFORM_AUDIT.md`
- `docs/ADMIN_PLATFORM_AUDIT_SELF_REVIEW.md`
- `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md`
- `docs/ADMIN_PLATFORM_TARGET_ARCHITECTURE.md`
- `docs/ADMIN_PLATFORM_PRODUCT_MODEL.md`
- `docs/ADMIN_PLATFORM_PERMISSION_SECURITY_MATRIX.md`
- `docs/ADMIN_PLATFORM_SYSTEM_HEALTH_REQUIREMENTS.md`
- `docs/ADMIN_PLATFORM_COPILOT_PRO_AUTONOMY.md`
- `docs/ADMIN_PLATFORM_INFOMANIAK_DOMAIN_MAIL.md`
- `docs/ADMIN_PLATFORM_MUST_SHOULD_LATER.md`
- `docs/ADMIN_PLATFORM_ACCOUNT_CONFLICTS.md`
- `docs/ADMIN_PLATFORM_EVIDENCE_MATRIX.md`
- `docs/ADMIN_PLATFORM_HANDOFF.md`
- `docs/ADMIN_PLATFORM_WORKSTREAM_STATUS.md`
- `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`
- `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md`
- `docs/CURSOR_ADMIN_PLATFORM_AUDIT_TASK.md`
- `docs/MULTI_AGENT_WORKSTREAMS.md`
- `docs/PR40_CHATGPT_ADMIN_AUDIT_REVIEW.md`

Später auf `main` integriert wurden Admin-Slices A–C plus Growth-Control-Audit, aber **nicht** dieser ursprüngliche Audit-Korpus. Die gleichnamigen späteren Slice-Dateien (`ADMIN_PLATFORM_SLICE_A_*` usw.) ersetzen den historischen Plan nicht byte-identisch.

**PR-Disposition:** `CLOSE-SAFE`.  
**Branch-Disposition:** `HISTORICAL-EVIDENCE`.  
Nicht mergen: CONFLICTING, 565 hinter aktuellem `main`, würde historische Pläne als Current Truth einspielen.

---

## 7. PR #39 – Account Platform Audit

| Feld | Wert |
| --- | --- |
| Head | `65b08f4718ad74f3157c55a3efb960a4c843408a` |
| Unique Files | 10 Docs, die auf `main` fehlen |
| Divergenz | `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` existiert auf `main` in der P2-TA-03-/PR-#117-Fassung |
| Evidence-Verlust bei PR-Close? | **nein** |
| Evidence-Verlust bei Branch-Delete? | **ja**, ohne Archivkopie |

Unique, nicht auf `main`:

- `docs/ACCOUNT_PLATFORM_AUDIT.md`
- `docs/ACCOUNT_PLATFORM_EVIDENCE_MATRIX.md`
- `docs/ACCOUNT_PLATFORM_HANDOFF.md`
- `docs/ACCOUNT_PLATFORM_REVIEW_DECISIONS_I1_I5.md`
- `docs/ACCOUNT_PLATFORM_TARGET_ARCHITECTURE.md`
- `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`
- `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md`
- `docs/CURSOR_ADMIN_PLATFORM_AUDIT_TASK.md`
- `docs/MULTI_AGENT_WORKSTREAMS.md`
- `docs/PR39_CHATGPT_ACCOUNT_AUDIT_REVIEW.md`

Der historische Plan auf diesem PR ist durch ADR-0179 / PR #117 **superseded** als Current Truth. Die übrigen Audit-Dateien wurden nicht nach `main` übernommen. P2-TA-03 hat ausdrücklich festgehalten: Datei auf Draft-PR #39 ist historische Evidence, keine Current Truth.

**PR-Disposition:** `CLOSE-SAFE`.  
**Branch-Disposition:** `HISTORICAL-EVIDENCE`.  
Nicht mergen.

---

## 8. PR #28 – Trip Collaboration Foundation

| Feld | Wert |
| --- | --- |
| Head | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` |
| Unique Files | `docs/CURSOR_TRIP_COLLABORATION_FOUNDATION.md` |
| Zugehöriges Issue | [#20](https://github.com/Jetnity/jetnity/issues/20) **OPEN** – Future Collaboration |

Die einzige Collaboration-Foundation-Spec liegt nur auf diesem Branch/PR. Binding Build Order und aktuelle Continuity behandeln Collaboration als spätere, nicht gestartete Arbeit.

**PR-Disposition:** `KEEP-FUTURE`.  
**Branch-Disposition:** `FUTURE`.  
Nicht beiläufig schliessen. Nicht mergen und nicht als aktuelle Runtime wieder aufnehmen.

---

## 9. Geschlossene, nicht gemergte PRs

Keine neuen alten Drafts. Bereits geschlossen und nicht mergen:

| PR | Branch | Unique Files vs `main` | Bewertung |
| --- | --- | --- | --- |
| #104 | `cursor/tw7a-hub-card-identity-b13d` | 0 | superseded durch gemergtes PR #106 |
| #99 | `docs/post-pr98-continuity-2026-08-27` | 1: `docs/CHATGPT_PR98_POST_MERGE_CHECKPOINT_2026-08-27.md` | **PR bereits geschlossen.** Branch behalten, bis der Unique Checkpoint gesichert ist |
| #42 | `cursor/align-handoff-after-pr38-010d` | 0 | superseded Continuity |
| #41 | `cursor/seasonal-merged-status-010d` | 0 | superseded Continuity |
| #36 | `cursor/record-foundation-e-merge-be45` | 0 | superseded Continuity |
| #33 | `cursor/foundation-c-merged-status-f35b` | 0 | superseded Continuity |

PR #99 ist der Beweis, dass PR-Close und Branch-Retention bereits getrennt existieren: der PR ist geschlossen, der Unique Checkpoint lebt auf dem Branch.

---

## 10. Empfohlene TL-Aktionen – nicht ausgeführt

| Reihenfolge | Aktion | Achse | Voraussetzung |
| --- | --- | --- | --- |
| 1 | Diesen Closure-PR unabhängig reviewen, Draft lassen bis Exact-Head-PASS | Review | – |
| 2 | PR #50 schliessen | PR-Close | keine Unique Files |
| 3 | PR #88/#52/#40/#39 schliessen | PR-Close | Branches bleiben `HISTORICAL-EVIDENCE` |
| 4 | Unique Files von #88/#52/#40/#39 bewusst archivieren **oder** Branches bewusst behalten | Branch-Retention | TL-Entscheidung |
| 5 | Erst danach betreffende Branches löschen | Branch-Delete | Preservation bewiesen |
| 6 | #28 offen lassen, bis Issue #20 bewusst archiviert oder ein Collaboration-Slice startet | PR-Keep | Product-/TL-Entscheidung |
| 7 | #133 nicht erneut öffnen; S1-Leftover-Branch später in Leftover-Charge | bereits MERGED | – |

Keine dieser Aktionen ist durch diesen Author-Slice oder diesen Review-Fix freigegeben.
