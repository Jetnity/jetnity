# Jetnity – Supabase Migration-History Repair Handoff

Stand: 30. August 2026  
Status: **REPAIR PREPARATION COMPLETE / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NO PRODUCTION WRITE**

## What is finished

Vorbereiteter fail-closed Pfad, um den Production-History-Body von `20260829140000` später replay-fähig zu machen, ohne S5-B-DDL erneut anzuwenden.

- Kanonische Quelle: `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`
- Git-Blob unverändert: `e25ab1b7efb48157828968993749a25fa30cc660`
- Before-Marker-MD5 unverändert: `414f7318235ac388e97fd74f97536ca1`
- History-Repräsentation: `array[sqlLiteral(gesamte Datei)]`
- CLI: `npm run db:migration-history-repair`
- Default: lokale Probe, kein Datenbank-Write
- Write bleibt dem Technical Lead nach Exact-Head-PASS vorbehalten

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/250 |
| Branch | `repair/supabase-migration-history-20260829140000-2026-08-30` |
| Issue | #249 |
| Merge-Base | `c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Start-Head | `4fbcfebedc7fa451063a228653f18c16a1e3dd5f` |
| Reviewable Tip | live auf PR #250 prüfen |
| Cursor-Agent | `Jetnity infrastructure migration repair 2` |
| Cloud-Run | https://cursor.com/agents/bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589 |

## Later TL Production write, not this agent

```bash
npm run db:migration-history-repair -- --produktion --projekt-ref qscbgcdmivbbnzrcyegn
npm run db:migration-history-repair -- --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen
```

Nur nach unabhängigem Exact-Head-PASS, erneut bestätigtem Before-Image und Backup-/Restore-Fenster. Cursor führt diese Kommandos nicht aus.

## Review protocol

1. Exact Head gegen `origin/main @ c29ac5de` (nur Repair-Prep-Dateien).
2. Blob `e25ab1b7…` und Marker-MD5 `414f7318…` unverändert.
3. Write-SQL enthält genau ein UPDATE auf `supabase_migrations.schema_migrations.statements`.
4. Write-SQL ohne History-Literal enthält kein DDL.
5. `--schreiben` ohne die übrigen Production-Flags ist unmöglich.
6. Actions + Vercel auf dem exact head.
7. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

## STOP

**STOP für unabhängigen ChatGPT Technical-Lead Exact-Head-Review.**  
Kein Production-Write. Kein temporärer Supabase-Branch. Kein Folgeslice.
