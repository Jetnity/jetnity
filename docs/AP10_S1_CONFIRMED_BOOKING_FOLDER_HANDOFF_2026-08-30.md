# Jetnity – AP-10-S1 Confirmed Booking Folder Handoff

Stand: 30. August 2026  
Status: **REVIEW-FIX COMPLETE / LOCAL GATES GREEN / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**

## What is finished

AP-10-S1 bleibt die kontoweite, read-only Übersicht ausdrücklich `booked` bestätigter, buchbarer Items.

Review-Fix gegen CHANGES REQUIRED auf `84829218`:

1. Unbekannter Trip-Status fail-closed (`unvollstaendig`), kein erfundenes `draft`.
2. Deterministischer DB-Schnitt vor Limit 200: neueste `booking_confirmed_at`, dann `id`. Bestätigungszeit nicht in der UI.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/246 |
| Branch | `feat/ap10-s1-confirmed-booking-folder-2026-08-30` |
| Issue | #245 |
| Merge-Base | `30c0493c38cd4bf3ceb904ef443126808c79add6` |
| Behind `origin/main` | **0** |
| Review-Anker | `848292182bf9d8a89a19db651b35222323144a19` |
| Review-Fix Runtime | `87f6f3cf8dde5f1424f6c65fadd4e97eb95b4362` |
| Reviewable Tip | live auf PR #246 |
| Cursor-Agent | `Account plattform audit vorbereitung 23` |
| Cloud-Run | https://cursor.com/agents/bc-ec79a6cd-8076-4ec4-a130-249f9f650420 |

## Tests / Build

Lokal auf `87f6f3cf`:

- Focused 19/19
- `npm test` 2794/2794
- `tsc --noEmit` pass
- lint 0 errors / 135 warnings
- Hygiene-Gates pass
- Production Build pass

Remote auf Review-Anker `84829218` (superseded): Actions #1343 SUCCESS, Vercel `dpl_2ALgtaSrCx5YaLwoENM5yMbUfrjr` READY.

Exact-head CI/Vercel für den Tip nach diesem Stamp live prüfen.

## Review protocol

1. Exact Head gegen `origin/main @ 30c0493c` (0 behind, nur AP-10-S1-Dateien).
2. `tripStatusLesen('cancelled') === null` und unbekannter Status → Error, nicht Empty.
3. Query muss `order(booking_confirmed_at desc)` + `order(id)` **vor** `.limit(200)` haben.
4. Keine Bestätigungszeit, keine Beträge, keine Partnerclaims in der UI.
5. Actions + Vercel auf dem exact head.
6. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

## STOP

**STOP für unabhängigen ChatGPT Technical-Lead Exact-Head-Re-Review.**
