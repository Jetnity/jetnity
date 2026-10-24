# Account Booking Folder Completion 1 — HANDOFF

Date: 2026-10-24
Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**
Session: `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`
https://cursor.com/agents/bc-a34030c7-4c19-4c9f-863f-193cfdfa34da
Actual model: `grok-4.7-high-fast` (requested Grok 4.7 High Fast). Not Auto.
Issue: #997. Draft PR: #1000. Branch: `feat/account-booking-folder-completion-1`.

**STOP / WRITE FREEZE. NOT CODE PASS. NOT READY. NOT MERGED. ISSUE STAYS OPEN. NO FOLLOW-UP.**

The self-review is not Technical-Lead PASS. A later CI or Preview finding is reported and waits. This session does not commit again unless the Technical Lead instructs it.

## Exact git

| Item | Value |
| --- | --- |
| Accepted main / predecessor | `9092b29c2e187bd73d644a3d85670f3ac6436be1` |
| Main tree | `bc39c3b74b5cbab7c15595500ddc70a72de8826b` |
| Merge-base | the same main commit after the normal merge |
| PLAN blob | `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2` (unchanged) |
| TASK V1 blob | `754fc2e0d87ba0755713c174acf60723ab3d1f13` (unchanged) |
| Superseded repair head | `5a28496521c66cb2407f1f897b6c79646df1ea94` |
| Executed proof head | `1574adcb802cc7c0039eb9724e0a8a11191d4ed8` |
| Executed proof tree | `3f5a46d6ccf1ad31acc68bf2edf086d8f2efb1f4` |
| Review head | The commit that contains this HANDOFF. It adds evidence and these docs on the executed proof head. |
| Ahead / behind before this docs commit | 8 / 0 against `9092b29` |
| Mode | `NORMAL` |
| Integration | A → C → B. C is the merged main. No further sibling merge. |

If `origin/main` moves after this push, do not silent-merge. A new head invalidates these gates.

## What this correction owns

- `scripts/account-booking-folder-completion-1/ablauf.ts`
- `scripts/account-booking-folder-completion-1/flaeche.tsx`
- `scripts/account-booking-folder-completion-1/montage.ts`
- `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/`
- `docs/evidence/account-booking-folder-completion-1/NOTES.md`
- the four owned STATUS, REPORT, SELF_REVIEW, and HANDOFF files

Preserved byte-identical: `docs/evidence/account-booking-folder-completion-1/ablauf.json` blob `cd93aeefab08db4a4599df9e1582b3e1ac334691`, `montage.json` blob `7a41748c2595fdb4f04e6d18b35cb3c4139dafab`. The merge commit itself is the clean integration of main and does not resolve an ownership conflict. No booking product runtime file changed after `5a284965`.

The branch delta against main remains the booking-folder delivery: page, account components, `lib/account/buchungen*`, the harness, TASK, PLAN, and these docs.

## Executed versus not verified

Executed on `1574adcb`: focused 32/32; action harness exit 0; montage exit 0 with overflow max 0; typecheck; lint 0 errors and 144 warnings; five guards; production build.

Not executed on this head: local full `npm test`, local PostgreSQL `~*`, hosted PostgREST, hosted RLS, Next App Router, hydration, native device, native zoom, screen reader, and any hosted account read. Native CI `40120501254` remains the green run for `5a284965` only.

## Database, production, provider, cost

No migration, RLS, grant, function, Auth, provider, model, or monthly-cost change in this correction.

## Standing limits

This session does not retry #985 / #982, #917, #913 / #911, #968, #748, #626, Bern #934 / #937, #944, or #585.

## Next actor

Technical Lead, same author and same session, for independent exact-head re-review. Cursor does not mark Ready, merge, close #997, or start a follow-up.
