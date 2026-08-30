# Jetnity – Supabase Migration-History Repair Handoff

Stand: 30. August 2026  
Status: **SECOND REVIEW-FIX COMPLETE / LOCAL+REMOTE GATES GREEN ON 4e9b1796 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NO PRODUCTION WRITE**

## What is finished

Fail-closed Repair-Vorbereitung für History `20260829140000`, plus zweiten Review-Fix:

- Blob `e25ab1b7efb48157828968993749a25fa30cc660` und Marker-MD5 `414f7318235ac388e97fd74f97536ca1` unverändert
- exact Policy / Table-ACL / Function-ACL / Gate / Rowcount / RLS / OID
- exact role attributes inkl. CREATEDB, CREATEROLE, REPLICATION, `rolconnlimit=-1`
- exact membership records inkl. grantor / admin_option / inherit_option / set_option
- `docs/ACTIVE_WORK_STATUS.md` = Merge-Base `c29ac5de`
- Default Probe; kein Production-Write durch Cursor

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/250 |
| Branch | `repair/supabase-migration-history-20260829140000-2026-08-30` |
| Issue | #249 |
| Merge-Base | `c29ac5de3e0ab998ff830490a9a3e85299c399e0` |
| Zweiter CHANGES-REQUIRED Head | `f857210428a2d6ef7d1a4e9744c35ea74778fe10` |
| Gated review-fix | `4e9b1796af4f43c4282c5fe5e252f79dd1d6d505` |
| Reviewable Tip | Evidence-Stamp nach diesem Commit; neuere Tips live auf PR #250 |
| Cursor-Agent | `Jetnity infrastructure migration repair 2` |
| Cloud-Run | https://cursor.com/agents/bc-b4f2b6bd-ce40-4ddc-8204-1650eec68589 |

## Later TL Production write, not this agent

```bash
npm run db:migration-history-repair -- --produktion --projekt-ref qscbgcdmivbbnzrcyegn
npm run db:migration-history-repair -- --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen
```

## Tests / Build

Lokal und remote auf `4e9b1796`:

- Focused 27/27; `npm test` 2815/2815
- typecheck / lint 0 errors / Hygiene / Production Build
- Actions `33313923910` SUCCESS
- Vercel `Di5h8BrrgpB1wDBq6NjkbMEDXguo` READY

## Review protocol

1. Exact Head gegen `origin/main @ c29ac5de`; `docs/ACTIVE_WORK_STATUS.md` nicht im Diff.
2. Blob und Marker-MD5 unverändert.
3. Ein UPDATE nur auf `supabase_migrations.schema_migrations.statements`.
4. Role-Fingerprint enthält CREATEDB/CREATEROLE/REPLICATION/connlimit und die drei Membership-Records inkl. grantor/options.
5. Actions + Vercel auf dem exact head.
6. PASS nur durch unabhängigen Technical Lead.

## STOP

**STOP für unabhängigen ChatGPT Technical-Lead Exact-Head-Review.**  
Kein Production-Write. Kein temporärer Supabase-Branch. Kein Folgeslice.
