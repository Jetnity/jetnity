# Supabase Migration-History Replay Defect – Gate 0 Handoff

Stand: 29. August 2026  
Status: **DRAFT / AUDIT-ONLY / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Logical Cursor-Agent: **`Jetnity infrastructure migration audit 1`**  
Generation: **1**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/218

> No relevant Jetnity progress may exist only in chat memory. Dieser Handoff ist die Übergabe-Evidence dieses Audit-Blocks.

## 1. Was dieser Block ist

Read-only Infra-Audit der bereits beobachteten Supabase History-/Replay-Störung um `trip_item_commercial_provenance`.

Kein Repair. Keine Mutation. Kein Ready. Kein Merge. Parallel zu AP-7-S3 und von dessen Dateien getrennt.

## 2. Transport

| Feld | Wert |
| --- | --- |
| Branch | `audit/supabase-migration-history-replay-defect-2026-08-29` |
| Task-Baseline / live `origin/main` | `b2857117741aad47a2bca3d198e5a0a88b4a0415` |
| Drift vor diesem Stamp | **0 behind / 1 ahead** (Task-Commit `26c4dc6e`) |
| Merge-Base | `b2857117` |
| Exact Head | Stamp-Commit dieses Handoffs; live an PR #218 lesen |
| Cloud-Run | https://cursor.com/agents/bc-a53a673c-56d1-4729-ae27-6ce4cf8a75b3 |
| Observed UI title | `Supabase migrationshistorie audit` — nicht als umbenannt behauptet |
| Parallel | AP-7-S3 #215 nicht angefasst |

## 3. Zuerst lesen

1. `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_TASK_2026-08-29.md`
2. `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_FINDINGS_2026-08-29.md`
3. `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_LIVE_EVIDENCE_2026-08-29.md`
4. `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_RECOMMENDATION_2026-08-29.md`
5. `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_SELF_REVIEW_2026-08-29.md`
6. Historische S5-B-Apply-Evidence: `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md`
7. Historischer Hinweis auf die Störung: `docs/CHATGPT_TL_AP7_S2_PRODUCTION_CLOSURE_2026-08-29.md` §6

Nicht als Current-Truth dieses Blocks lesen: ältere Sätze „Development wurde auf Production-Tip resetet und ist kataloggleich“. Live ist `develop` **ohne** S5-B-Objekte.

Globale Current-State-Dateien (`JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`) wurden absichtlich nicht aktualisiert.

## 4. Verdict für den Technical Lead

**Production-S5-B-Katalog ist vorhanden und write-closed. Production-History von `20260829140000` ist nicht replay-fähig, weil Statement 0 ein Prosa-Marker ist.**

Das erklärt den Statement-0-Replay-Fehler, ohne ein Production-Objektloch zu behaupten.

`develop` ist gegenüber Production bei S5-B **echt driftig** (Objekte fehlen). Zusätzlich bleiben C1- und S2-Versionsnamen-Drifts.

Kleinste spätere Reparatur: History-Body ersetzen, nicht re-applyen, neuen Preview-Replay beweisen. PO-Gate + Backup Pflicht. Offizielle `migration repair` CLI ersetzt keinen Body.

## 5. Tests / CI / Preview

Diese Session: read-only Supabase-Probes. Kein Runtime-Testlauf, kein Production-Build.

Task-Head `26c4dc6e`: Actions `33275873564` SUCCESS, Vercel `AMUALJ3wHKd7ZMhZje52XP5P4EZC` SUCCESS. **Ungültig** für den Stamp-Head.

## 6. Hard boundaries gehalten

Keine Supabase-Mutation. Keine AP-7-S3-/Account-Traveller-Runtime. Keine Account-Navigation. Keine Shared Traveller Contracts. Keine globalen Current-State-Edits. Kein Provider-Live. Kein TW-8. Kein Ready/Merge. Kein Repair gestartet.

## 7. Exakter nächster Schritt

1. Independent Technical-Lead Exact-Head-Review von #218.
2. Exact-Head CI + Vercel des Stamp-Heads lesen.
3. PASS oder CHANGES REQUIRED.
4. Repair nur als **neuer** versionierter Slice nach Precheck und PO-Gate, andere Session.

Cursor stoppt hier.
