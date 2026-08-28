# Jetnity – Historical PR Closure Matrix

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Vergleichsbasis: `origin/main` @ `eaa03ad71509d281990e0d34ca359e0750eb9591`

> Alte PRs werden nicht gemergt, nur um die Liste aufzuräumen. Schliessen darf der Technical Lead erst nach dieser Matrix.

---

## 1. Offene PRs am 28.08.2026

Sieben offene PRs. Kein zusätzlicher alter Draft entdeckt.

| PR | Titel | Branch | Ahead/Behind | Mergeable | Closure-Klasse |
| --- | --- | --- | --- | --- | --- |
| #133 | AP-5-S1 Security-UI | `cursor/ap5-s1-security-ui-8b13` | 7 / 0 | MERGEABLE | **ACTIVE** – nicht dieser Slice |
| #88 | Project Sanitation Audit 26.08. | `audit/project-sanitation-inventory-2026-08-26` | 2 / 197 | MERGEABLE | **KEEP-HISTORICAL-OPEN** |
| #52 | ChatGPT TL handoff 24.08. | `docs/chatgpt-technical-lead-handoff-2026-08-24` | 67 / 546 | CONFLICTING | **KEEP-HISTORICAL-OPEN** |
| #50 | Provider Ops S1 merged-status | `cursor/s1-merged-status-f23f` | 3 / 549 | CONFLICTING | **CLOSE-SAFE** |
| #40 | Admin Platform Audit | `audit/admin-platform` | 15 / 555 | CONFLICTING | **KEEP-HISTORICAL-OPEN** |
| #39 | Account Platform Audit | `audit/account-platform` | 11 / 555 | CONFLICTING | **KEEP-HISTORICAL-OPEN** |
| #28 | Trip Collaboration Foundation | `feat/trip-collaboration-foundation` | 1 / 621 | MERGEABLE | **KEEP-FUTURE** |

---

## 2. PR #133 – ACTIVE / Parallel

Nicht historisch. Issue #132. Agent: `Account plattform audit vorbereitung 9`.

Unique auf dem PR: AP-5-S1-Docs plus `lib/auth/account-security-*` und Security-UI.  
Dieser Slice fasst diese Dateien nicht an.

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
| Evidence-Verlust bei Close? | **ja** – die beiden Originaldateien lägen nur auf dem Branch/PR |

**Klasse:** `KEEP-HISTORICAL-OPEN`.  
Nicht mergen: der Branch steht 197 Commits hinter `main` und ist historische Inventur, kein aktueller Vertrag.  
Nicht schliessen, solange die Unique Files nicht dauerhaft archiviert sind.

Unabhängiger TL-Review vom 26.08. (PASS / INTEGRATION DEFERRED) bleibt gültig als damalige Evidence.

---

## 4. PR #52 – Technical-Lead-Handoff 24.08.

| Feld | Wert |
| --- | --- |
| Head | `f1e13db332ce087297dae60d4f1b3c21f321f9ec` |
| Unique Files | 7 Continuity-Snapshots, siehe unten |
| Divergenz | `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md` |
| Auf `main`? | Unique Files **nein**. Build Order existiert auf `main` in späterer kanonischer Fassung |

Unique Files, die nur auf diesem PR liegen:

- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
- `docs/CHATGPT_TAKEOVER_LIVE_VERIFICATION_2026-08-24.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`
- `docs/CURRENT_MULTI_AGENT_TEAM_STATUS_2026-08-24_1833.md`
- `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`
- `docs/NEW_CHAT_START_PROMPT_2026-08-24.md`

`docs/JETNITY_BINDING_BUILD_ORDER.md` wurde später kanonisch auf `main` aufgenommen; die PR-#52-Fassung ist diverged/superseded.

**Klasse:** `KEEP-HISTORICAL-OPEN`.  
Schliessen würde die sieben Unique Snapshots verlieren, sofern sie nicht vorher nach `docs/history/` kopiert werden.  
Nicht mergen: CONFLICTING, 546 hinter `main`, Inhalt als Current Truth durch spätere Start-Here-/Handoff-/Checkpoint-Linie superseded.

---

## 5. PR #50 – Provider Ops S1 merged-status

| Feld | Wert |
| --- | --- |
| Head | `f5a25c949f8bbfb889f87653ba1a08a02f75f6ea` |
| Unique Files | **0** |
| Geänderte Dateien | nur bereits auf `main` vorhandene Continuity-/S1-Dateien, alle **DIVERGED** |

S1 ist über PR #47 und spätere Provider-Slices auf `main`. Die Statuszeilen dieses Drafts sind durch spätere Handoffs/Statusdateien ersetzt.

**Klasse:** `CLOSE-SAFE`.  
Schliessen verliert keine Unique Docs, keine ADRs, keine zukünftige Produktarbeit.  
Nicht mergen: CONFLICTING, reiner historischer Status-Stamp.

---

## 6. PR #40 – Admin Platform Audit

| Feld | Wert |
| --- | --- |
| Head | `a316015733b86e2adbd050abb2f77258a99da366` |
| Unique Files | 19 Docs, die auf `main` fehlen |

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

**Klasse:** `KEEP-HISTORICAL-OPEN`.  
Schliessen ohne Archivkopie würde Unique Admin-Architektur-/Infomaniak-/Permission-Evidence verlieren.  
Nicht mergen: CONFLICTING, 555 hinter `main`, würde historische Pläne als Current Truth einspielen.

---

## 7. PR #39 – Account Platform Audit

| Feld | Wert |
| --- | --- |
| Head | `65b08f4718ad74f3157c55a3efb960a4c843408a` |
| Unique Files | 10 Docs, die auf `main` fehlen |
| Divergenz | `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` existiert auf `main` in der P2-TA-03-/PR-#117-Fassung |

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

Der historische Plan auf diesem PR ist durch ADR-0179 / PR #117 **superseded** als Current Truth. Die übrigen Audit-Dateien wurden nicht nach `main` übernommen.

**Klasse:** `KEEP-HISTORICAL-OPEN`.  
P2-TA-03 hat ausdrücklich festgehalten: Datei auf Draft-PR #39 ist historische Evidence, keine Current Truth. Schliessen ohne Archivkopie würde genau diese Evidence verlieren.  
Nicht mergen.

---

## 8. PR #28 – Trip Collaboration Foundation

| Feld | Wert |
| --- | --- |
| Head | `e0132cb576e8231296dc5b290e0afcef88ceb9f4` |
| Unique Files | `docs/CURSOR_TRIP_COLLABORATION_FOUNDATION.md` |
| Zugehöriges Issue | [#20](https://github.com/Jetnity/jetnity/issues/20) **OPEN** – Future Collaboration |

Die einzige Collaboration-Foundation-Spec liegt nur auf diesem PR. Binding Build Order und aktuelle Continuity behandeln Collaboration als spätere, nicht gestartete Arbeit.

**Klasse:** `KEEP-FUTURE`.  
Schliessen würde die einzige versionierte Foundation-Spec und den Issue-#20-Anker abschneiden.  
Nicht mergen und nicht als aktuelle Runtime wieder aufnehmen.

---

## 9. Geschlossene, nicht gemergte PRs

Keine neuen alten Drafts. Bereits geschlossen und nicht mergen:

| PR | Branch | Unique Files vs `main` | Bewertung |
| --- | --- | --- | --- |
| #104 | `cursor/tw7a-hub-card-identity-b13d` | 0 | superseded durch gemergtes PR #106 |
| #99 | `docs/post-pr98-continuity-2026-08-27` | 1: `docs/CHATGPT_PR98_POST_MERGE_CHECKPOINT_2026-08-27.md` | **Branch behalten**, bis der Unique Checkpoint gesichert ist |
| #42 | `cursor/align-handoff-after-pr38-010d` | 0 | superseded Continuity |
| #41 | `cursor/seasonal-merged-status-010d` | 0 | superseded Continuity |
| #36 | `cursor/record-foundation-e-merge-be45` | 0 | superseded Continuity |
| #33 | `cursor/foundation-c-merged-status-f35b` | 0 | superseded Continuity |

PR #99 ist der einzige geschlossene ungemergte PR mit Unique File auf `main`-Diff. Branch-Delete wäre Evidence-Verlust.

---

## 10. Empfohlene TL-Aktionen – nicht ausgeführt

| Reihenfolge | Aktion | Voraussetzung |
| --- | --- | --- |
| 1 | Diesen Closure-PR unabhängig reviewen, Draft lassen bis Exact-Head-PASS | – |
| 2 | PR #50 schliessen | keine |
| 3 | PR #88 offen lassen oder Unique Files bewusst archivieren | ohne Archivkopie kein Close |
| 4 | #52/#40/#39 offen lassen oder Unique Files bewusst nach `docs/history/` kopieren | TL-Entscheidung |
| 5 | #28 offen lassen, bis Issue #20 bewusst archiviert oder ein Collaboration-Slice startet | Product-/TL-Entscheidung |
| 6 | #133 unberührt lassen | Parallelagent 9 |

Keine dieser Aktionen ist durch diesen Author-Slice freigegeben.
