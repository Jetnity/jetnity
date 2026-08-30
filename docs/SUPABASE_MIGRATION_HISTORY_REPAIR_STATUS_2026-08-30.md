# Jetnity – Supabase Migration-History Repair Status

Stand: 30. August 2026  
Status: **TECHNISCH REVIEW-BEREIT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN PRODUCTION-WRITE / KEIN FOLGESLICE**  
Issue: #249  
Draft-PR: #250  
Logical Cursor-Agent: **`Jetnity infrastructure migration repair 2`**  
Cursor-Run: https://cursor.com/agents/bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS und keine Production-Mutation.

## 1. Exact Baseline / Transport

| Feld | Wert |
| --- | --- |
| Task | `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_TASK_2026-08-30.md` |
| Before Image | `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_BEFORE_IMAGE_2026-08-30.md` |
| Branch | `repair/supabase-migration-history-20260829140000-2026-08-30` |
| Slice-cut / Merge-Base `main` | `c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Start-Head | `4fbcfebedc7fa451063a228653f18c16a1e3dd5f` |
| Gated implementation Head | `e61477307dbea3289e752c35bf1c36cd7e89b210` |
| Authoring / reviewable Tip | Evidence-Stamp nach diesem Commit; jeder neuere Tip live auf PR #250 prüfen |
| Traveller-Kontext | **nicht relevant** |
| Production-Mutation durch Cursor | **keine** |
| Development-Mutation durch Cursor | **keine** |

## 2. Umgesetzt in diesem Slice

Fail-closed Repair-Vorbereitung, kein Live-Write:

1. Deterministische History-Repräsentation: eine Repo-Datei = genau ein `schema_migrations.statements`-Element über `array[sqlLiteral(sql)]`, identisch zu `scripts/db/anwenden.ts`.
2. Kanonische Quelle fest verdrahtet: Blob `e25ab1b7efb48157828968993749a25fa30cc660`, Marker-MD5 `414f7318235ac388e97fd74f97536ca1`.
3. Runner `npm run db:migration-history-repair` default = lokale Probe / no-write.
4. Write nur mit `--schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen`.
5. Write-SQL ist eine Transaktion, die ausschließlich `supabase_migrations.schema_migrations.statements` für Version `20260829140000` ersetzt und bei Rowcount ≠ 1 rollbackt.
6. Die Repo-Migration wird niemals als DDL gegen Production oder Development ausgeführt.
7. Development-Flags werden hart abgelehnt.
8. Replay-Verifikation für einen späteren temporären Supabase-Branch ist dokumentiert; Cursor erzeugt/löscht keinen Branch.

## 3. Changed files vs Start-Head `4fbcfebe`

- `lib/rollout/migration-history-repair.ts`
- `lib/rollout/migration-history-repair.test.ts`
- `lib/rollout/ci-schutz.test.ts`
- `scripts/db/migration-history-repair.ts`
- `package.json`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_STATUS_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_SELF_REVIEW_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_HANDOFF_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_REPLAY_VERIFICATION_2026-08-30.md`
- `docs/ACTIVE_WORK_STATUS.md`

Nicht im Diff: Migration SQL, RLS, Grants, Rollen, Funktionen, Trigger, Gate, `develop`, Provider Live, TW-8, AP-7, Auth/Account-Runtime, globale TL-Continuity-Dateien (`JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `DECISIONS.md`, `ROADMAP.md`).

## 4. Tests / Gates auf Implementation Head `e6147730`

| Gate | Ergebnis |
| --- | --- |
| Focused repair + `ci-schutz` | **25/25 pass** |
| `npm run db:migration-history-repair` | lokale Probe PASS; Blob `e25ab1b7…`; Marker-MD5 `414f7318…`; kein Write |
| `--schreiben` ohne Production-Flags | **FAIL-CLOSED** |
| `--entwicklung` | **FAIL-CLOSED** |
| `npm test` | **2813/2813 pass, 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors** / 135 bestehende Repo-Warnings |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `npm run build` | pass |
| `db:rechte` / `db:rls` / `auth:pruefen` | nicht als Live-Write-/Schema-Gate ausgeführt – keine Schema-/Auth-Änderung; Auth-CI-Job separat grün |

## 5. Exact-head Actions / Vercel auf `e6147730`

| Evidence | Ergebnis |
| --- | --- |
| GitHub Actions Run `33312026403` | **SUCCESS** (Typecheck/Lint/Build + Auth-Konfiguration) |
| Vercel Preview `HX4fYJKqWyR33EYDjRZMMRgJcvZY` | **READY** |

Jeder neue Head invalidiert frühere Exact-Head-Gates. Der Docs-Stamp nach diesem Stand muss live erneut gegatet werden.

## 6. Hard boundaries eingehalten

- kein Production-/Development-SQL-Write durch diesen Agenten
- kein Re-Apply von `20260829140000_trip_item_commercial_provenance.sql`
- kein `migration repair --status reverted`
- kein Delete der History-Zeile
- kein Commercial Runtime Gate geöffnet
- kein PITR
- kein temporärer Supabase-Branch
- kein Ready / Merge / Folgeslice

## 7. FIRST NEXT ACTION

**Unabhängiger ChatGPT Technical-Lead Exact-Head-Review.** Nur nach TL-PASS darf der Technical Lead den separat gegateten Production-History-Write ausführen.
