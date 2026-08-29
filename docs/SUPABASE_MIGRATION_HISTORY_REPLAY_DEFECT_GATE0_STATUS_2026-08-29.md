# Supabase Migration-History Replay Defect – Gate 0 Status

Stand: 29. August 2026  
Status: **AUTHORING COMPLETE / AUDIT-ONLY / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Workstream: Infrastructure / Supabase migration history  
Logical Cursor-Agent: **`Jetnity infrastructure migration audit 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/218  
Issue: [#216](https://github.com/Jetnity/jetnity/issues/216)  
Task: `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_TASK_2026-08-29.md`

> Live-Evidence gewinnt. Dieses Self-Authoring ist kein PASS. Kein Ready. Kein Merge. Kein Repair-Folgeslice.

`docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md` und andere globale Current-State-Dateien wurden nicht geändert.

## 0. Naming evidence

| Feld | Wert |
| --- | --- |
| Zugewiesener logischer Name | `Jetnity infrastructure migration audit 1` |
| Preferred visible title | `Jetnity infrastructure migration audit 1` |
| Observed Cursor run title | `Supabase migrationshistorie audit` |
| Cloud-Run | https://cursor.com/agents/bc-a53a673c-56d1-4729-ae27-6ce4cf8a75b3 |
| Exact Run-ID | `bc-a53a673c-56d1-4729-ae27-6ce4cf8a75b3` |
| Rename-/Title-Fähigkeit | **keine** in den verfügbaren Cursor-Namespaces |
| Regel | `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md` |
| Generation | **1 bleibt 1.** |

Dieser Agent behauptet nicht, die sichtbare UI sei umbenannt.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline | `main @ b2857117741aad47a2bca3d198e5a0a88b4a0415` |
| `origin/main` Re-Fetch vor Handoff | `b2857117741aad47a2bca3d198e5a0a88b4a0415` |
| Drift gegen live `main` | **0 behind / 1 ahead** vor diesem Stamp (nur Task-Commit `26c4dc6e`). Dieser Stamp erzeugt einen neueren Head |
| Merge-Base | `b2857117741aad47a2bca3d198e5a0a88b4a0415` |
| Branch | `audit/supabase-migration-history-replay-defect-2026-08-29` |
| Draft-PR | #218 OPEN / Draft / MERGEABLE |
| Parallel | AP-7-S3 Draft-PR #215 unberührt |
| `main` Branch Protection | live `protected=false` |
| Supabase | **read-only** Production + Development; **keine** Mutation |
| Browser / Real-Device | nein – Infra-Audit |
| Mutating Runtime | keine |

Task-Head-Gates gelten nicht automatisch für den Stamp-Head.

## 2. Task / Scope / Non-Scope

**Scope:** unabhängige Rekonstruktion der History-/Replay-Störung um `trip_item_commercial_provenance`; Klassifikation History vs Schema-Drift; kleinste sichere spätere Reparaturstrategie; Status/Handoff/Self-Review.

**Non-Scope (hart, eingehalten):** kein Production-/Development-Apply/Reset/Rebase/Repair; kein History-Edit; kein Schema/RLS/Grant/Auth; keine AP-7-S3-/Account-Traveller-Runtime; keine Account-Navigation; keine Shared Traveller Contracts; keine globalen Current-State-Dateien; kein Provider-Live/TW-8/Payments/Branch Protection/Public Launch; kein Repair-Folgeslice; kein Ready/Merge.

## 3. Current Truth — Kurzfassung

Production-Katalog trägt S5-B. Production-History von `20260829140000` speichert einen 234-Zeichen-Prosa-Marker als einziges Statement. Das ist die Ursache, warum ein Statement-0-Replay scheitern muss.

Development hat die Version und die S5-B-Objekte nicht. Das ist Environment-Drift als Folge, nicht ein Production-Objektverlust.

Empfohlene spätere Reparatur: History-Body ersetzen, Katalog nicht re-applyen, neuen Preview-Replay beweisen. PO-Gate + Backup Pflicht.

## 4. Dateien dieses Stamps

Neue audit-spezifische Dateien:

- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_FINDINGS_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_LIVE_EVIDENCE_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_RECOMMENDATION_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_STATUS_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_HANDOFF_2026-08-29.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_SELF_REVIEW_2026-08-29.md`

Task-Datei lag bereits auf dem Branch (`26c4dc6e`).

## 5. Tests / CI / Preview

Lokal in dieser Session:

- read-only Supabase SELECT/GET-Probes, 2026-08-29T21:25:47Z und 21:28:00Z
- kein `npm test`, kein Production-Build, keine Hygiene – Docs-only, keine Runtime-Änderung

Bereits gelaufene Gates des Task-Heads `26c4dc6e` (gelten nicht für den neueren Stamp-Head):

- GitHub Actions `33275873564` **SUCCESS**
- Vercel Preview `AMUALJ3wHKd7ZMhZje52XP5P4EZC` **SUCCESS**

Reviewer muss Exact-Head-CI/Vercel nach diesem Stamp neu lesen.

## 6. Risks

- P0 Production-Runtime: keine bekannten.
- P1 Replay/Rebase: Production Statement 0 ist kein SQL; jeder Reset/Replay-Branch aus Production bleibt unsicher.
- P2 `develop` fehlt S5-B komplett; zusätzliche Versionsdrift C1 + S2-Namen.
- P2 Governance: `main protected=false`.
- P3 Analytics konnte den originalen Branch-Action-Fehlertext nicht liefern.

## 7. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #218.

Nicht Ready. Nicht mergen. Keinen Repair-Slice aus diesem Agenten starten.
