# Jetnity – Active Work Status

Stand: 30. August 2026  
Status: **CURRENT / P1 MIGRATION-HISTORY REPAIR PREPARATION / DRAFT PR #250 / NO PRODUCTION WRITE / LIVE-EVIDENCE GEWINNT**

> Diese Datei ist ein Current-State-Pointer, kein historisches Archiv. Vor jedem neuen Slice gilt `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`.

Letzter vollständig verifizierter Runtime-Checkpoint:

`docs/CHATGPT_TL_AP10_S1_POST_MERGE_CHECKPOINT_2026-08-30.md`

Aktiver Infra-Slice:

`docs/SUPABASE_MIGRATION_HISTORY_REPAIR_TASK_2026-08-30.md`

## 1. Aktueller Arbeitsblock

**P1 Supabase Migration-History Repair Preparation** für Version `20260829140000`.

- Branch: `repair/supabase-migration-history-20260829140000-2026-08-30`
- Draft-PR: #250
- Issue: #249
- Logical Cursor-Agent: `Jetnity infrastructure migration repair 2`
- Session: `bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589`
- Start-Head: `4fbcfebedc7fa451063a228653f18c16a1e3dd5f`
- Merge-Base `main`: `c29ac5de3e0ab998ff830490a9a3e85299c399e0`
- Product-Owner-Freigabe für die Reparatur existiert; Cursor hat **keine** Authority für Production-/Development-Mutation
- Ziel dieses Slice: fail-closed Runner/Tests/Evidence, dann STOP für unabhängigen Technical-Lead-Review

Letzte vollständig verifizierte Runtime-Baseline bleibt:

- `main/runtime @ a4d9384e2583ae52733c87006cd578f7489cb656`
- AP-10-S1 Confirmed Booking Folder integriert
- Recovery PR #247 = MERGED
- Parent Issue #245 = CLOSED / completed

Kein Runtime-/Account-/Provider-Slice ist dadurch automatisch freigegeben.

## 2. Bereits umgesetzt in diesem Slice

- Deterministische SQL→History-Body-Repräsentation: eine Datei = ein `statements`-Element
- Fail-closed Runner `npm run db:migration-history-repair` (default Probe)
- Write nur mit `--schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen`
- Tests für Marker-Before-Image, Drift-Stop, Write-SQL-Grenze, Secrets
- Task-scoped Status / Self-Review / Handoff / Replay-Verification
- Canonical Blob unverändert `e25ab1b7efb48157828968993749a25fa30cc660`
- Before-Marker-MD5 unverändert `414f7318235ac388e97fd74f97536ca1`

## 3. Nicht umgesetzt / bewusst verboten

- kein Production- oder Development-SQL-Write
- kein Re-Apply der S5-B-Migration
- kein temporärer Supabase-Branch
- kein `develop` reset/rebase/merge
- kein PITR
- kein Ready / Merge / Folgeslice
- keine Änderung an Schema/RLS/Grants/Rollen/Funktionen/Trigger/Gate
- keine Provider Live / TW-8 / AP-7 / Auth / Account-Runtime
- keine globalen TL-Continuity-Dateien außer diesem Active-Work-Pointer

## 4. PrivacyBee / Differentiation / Account

Unverändert gegenüber dem AP-10-S1-Checkpoint:

- PrivacyBee/AP-6a geparkt bis echte `jetnity.com` Production
- Differentiation Doctrine bleibt binding
- Account-Reifegrad inklusive AP-10-S1 bleibt integriert; dieser Slice ändert keine Account-Runtime

## 5. Offene PRs

Aktiv für diesen Slice: Draft-PR #250.

Historisch/future, nicht dieser Slice: #52, #50, #40, #39, #28.

## 6. Agentenstatus

- `Jetnity infrastructure migration repair 2` – **ACTIVE / authoring, then STOP for TL review** – Session `bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589`
- `Jetnity infrastructure migration audit 1` – STOPPED / completed
- Agent 23 – AP-10-S1 – STOPPED / completed

## 7. Risiken / Gates

- P0: keine bekannten.
- P1: Production-History `20260829140000` bleibt bis zum TL-Write replay-unfähig.
- P2: `main protected=false`.
- Residual: Management-API-Querygröße für den 45 201-Zeichen-Body erst beim späteren TL-Write sichtbar.
- Residual: `develop` Extra-Versionen und S2-Versionsdrift bleiben ein späterer eigener Plan.

Alle besonderen Product-Owner-Gates bleiben bestehen. Dieser Slice autorisiert keinen Production-Write durch Cursor.

## 8. FIRST NEXT ACTION

**Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von PR #250.**

Nur nach TL-PASS darf der Technical Lead:

1. Before-Image live erneut prüfen;
2. Backup-/Restore-Fenster bestätigen;
3. den fail-closed History-Body-Write selbst ausführen;
4. After-Probe und frischen temporären Replay-Branch verifizieren.

Kein Folgeslice durch Cursor. Kein Ready. Kein Merge.

**Live-Evidence gewinnt immer.**
