# Jetnity – Supabase Migration-History Repair Status

Stand: 30. August 2026  
Status: **TECHNISCH REVIEW-BEREIT NACH ZWEITEM TL CHANGES-REQUIRED / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN PRODUCTION-WRITE / KEIN FOLGESLICE**  
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
| Erster CHANGES-REQUIRED Head | `17c9f4f00fcb01f52b80a5c2c2264fff815c1b6e` |
| Zweiter CHANGES-REQUIRED Head | `f857210428a2d6ef7d1a4e9744c35ea74778fe10` |
| Gated review-fix Head | `4e9b1796af4f43c4282c5fe5e252f79dd1d6d505` |
| Authoring / reviewable Tip | Evidence-Stamp nach diesem Commit; jeder neuere Tip live auf PR #250 prüfen |
| Traveller-Kontext | **nicht relevant** |
| Production-Mutation durch Cursor | **keine** |
| Development-Mutation durch Cursor | **keine** |

## 2. Umgesetzt in diesem Slice

Fail-closed Repair-Vorbereitung, kein Live-Write. Vorherige exact Checks bleiben:

- eine Datei = ein `schema_migrations.statements`-Element via `array[sqlLiteral(sql)]`
- Blob `e25ab1b7efb48157828968993749a25fa30cc660`, Marker-MD5 `414f7318235ac388e97fd74f97536ca1`
- Default Probe / no-write; Write nur mit allen Production-Flags
- exact Policy-/Table-ACL-/Function-ACL-/Gate-/Rowcount-/RLS-/OID-Sets
- `docs/ACTIVE_WORK_STATUS.md` identisch mit Merge-Base

## 3. Review-Fix nach zweitem CHANGES REQUIRED auf `f8572104`

External Preflight, in-transaction Preflight und After-Probe verlangen jetzt zusätzlich die live Production-Rollenattribute und die exakten Membership-Records:

- `jetnity_commercial_runtime`: NOLOGIN, NOINHERIT, nosuper, nocreatedb, nocreaterole, noreplication, nobypassrls, `rolconnlimit=-1`
- `jetnity_commercial_writer`: NOLOGIN, INHERIT, nosuper, nocreatedb, nocreaterole, noreplication, nobypassrls, `rolconnlimit=-1`
- genau 3 Membership-Records inkl. grantor / `admin_option` / `inherit_option` / `set_option`:
  1. runtime <- postgres / grantor `supabase_admin` / admin t / inherit f / set f
  2. writer <- runtime / grantor `postgres` / admin f / inherit f / set t
  3. writer <- postgres / grantor `supabase_admin` / admin t / inherit f / set f

Adversarial Tests decken CREATEDB, CREATEROLE, REPLICATION, connlimit sowie grantor/admin/inherit/set-Drift und extra Memberships ab.

## 4. Changed files vs Start-Head `4fbcfebe`

- `lib/rollout/migration-history-repair.ts`
- `lib/rollout/migration-history-repair.test.ts`
- `lib/rollout/ci-schutz.test.ts`
- `scripts/db/migration-history-repair.ts`
- `package.json`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_STATUS_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_SELF_REVIEW_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_HANDOFF_2026-08-30.md`
- `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_REPLAY_VERIFICATION_2026-08-30.md`

Nicht im Diff gegen Merge-Base: `docs/ACTIVE_WORK_STATUS.md` und alle globalen TL-Continuity-Dateien.

## 5. Tests / Gates auf Review-Fix Head `4e9b1796`

| Gate | Ergebnis |
| --- | --- |
| Focused repair + `ci-schutz` | **27/27 pass** |
| `npm run db:migration-history-repair` | lokale Probe PASS; Blob `e25ab1b7…`; Marker-MD5 `414f7318…`; kein Write |
| `npm test` | **2815/2815 pass, 0 fail** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors** / 135 bestehende Repo-Warnings |
| Hygiene (`check:dead/exports/deps/api-schutz/schema-bezug`) | pass |
| `npm run build` | pass |

## 6. Exact-head Actions / Vercel auf `4e9b1796`

| Evidence | Ergebnis |
| --- | --- |
| GitHub Actions Run `33313923910` | **SUCCESS** |
| Vercel Preview `Di5h8BrrgpB1wDBq6NjkbMEDXguo` | **READY** |

Jeder neue Head invalidiert frühere Exact-Head-Gates. Der Docs-Stamp nach diesem Stand muss live erneut gegatet werden.

## 7. Hard boundaries eingehalten

- kein Production-/Development-SQL-Write
- kein Re-Apply von S5-B-DDL
- kein Gate geöffnet, kein PITR, kein Supabase-Branch
- kein Ready / Merge / Folgeslice

## 8. FIRST NEXT ACTION

**Unabhängiger ChatGPT Technical-Lead Exact-Head-Review.** Nur nach TL-PASS darf der Technical Lead den separat gegateten Production-History-Write ausführen.
