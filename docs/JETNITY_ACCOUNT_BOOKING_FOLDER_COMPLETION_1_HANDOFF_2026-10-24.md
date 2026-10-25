# Account Booking Folder Completion 1 — HANDOFF

Date: 2026-10-24
Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**
Session: `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`
https://cursor.com/agents/bc-a34030c7-4c19-4c9f-863f-193cfdfa34da
Actual model: `grok-4.7-high-fast` (requested Grok 4.7 High Fast). Not Auto.
Issue: #997. Draft PR: #1000. Branch: `feat/account-booking-folder-completion-1`.

**STOP / WRITE FREEZE. NOT CODE PASS. NOT READY. NOT MERGED. ISSUE STAYS OPEN. NO FOLLOW-UP.**

The self-review is not Technical-Lead PASS. This commit answers B-P2-LAYOUT-06. A later CI or Preview finding waits. This session does not commit again unless the Technical Lead instructs it.

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
| Reviewed head superseded by this preservation | `fe6cca376cf6b01ab3f29ccf881285bd7008aeff`, tree `efde73b48178bd673c4561c5294251bdc6683478` |
| Historical NOTES blob, restored | `5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9` |
| Archived fe6 NOTES blob | `61ee41957c8cf5d7f245dc42f4e269b5d3bf9505` |
| Layout proof head | `824f1bab0a5415a0e8c118004d4b429d58bf47f1` |
| Layout proof tree | `704c9eeaf3016d09c7c92209190228ebcc62d69a` |
| Component blob | `83f7cf960489f2d855647cd52ee34fc4e5eec8b1` |
| Montage script blob | `dd6a3b8c51c80dd016117b0a529f19b2605195ac` |
| Production CSS SHA256 | `9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b` |
| Review head | The commit that contains this HANDOFF. |
| Ahead / behind before this layout docs commit | 12 / 0 against `9092b29` |
| Mode | `NORMAL` |
| Integration | A → C → B. C is the merged main. No further sibling merge. |

If `origin/main` moves after this push, do not silent-merge. A new head invalidates these gates.

## What this preservation commit owns

- `docs/evidence/account-booking-folder-completion-1/NOTES.md`, restored to blob `5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9`
- `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/NOTES-at-fe6cca37.md`, blob `61ee41957c8cf5d7f245dc42f4e269b5d3bf9505`
- the four owned STATUS, REPORT, SELF_REVIEW, and HANDOFF files

The harness files and the V2 JSON/screenshots stay at their `fe6cca37` blobs. `ablauf.json` blob `cd93aeefab08db4a4599df9e1582b3e1ac334691` and `montage.json` blob `7a41748c2595fdb4f04e6d18b35cb3c4139dafab` stay byte-identical. No component, library, app, script, TASK, or PLAN file is in this commit. No new Node, browser, or full-suite run belongs to this head. The `1574adcb` proof and native CI `40140352357` on `fe6cca37` are not gates for the preservation head.

The branch delta against main remains the booking-folder delivery: page, account components, `lib/account/buchungen*`, the harness, TASK, PLAN, and these docs.

## What this layout correction owns

- `components/account/AccountBuchungen.tsx`
- `scripts/account-booking-folder-completion-1/montage.ts`
- `docs/evidence/account-booking-folder-completion-1/v3-layout06-2026-10-25/`
- the four owned STATUS, REPORT, SELF_REVIEW, and HANDOFF files

`BuchungenFilter.tsx` is not in this correction. TASK and PLAN blobs are unchanged. `NOTES.md` remains `5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9`. `ablauf.json` remains `cd93aeefab08db4a4599df9e1582b3e1ac334691`. `montage.json` remains `7a41748c2595fdb4f04e6d18b35cb3c4139dafab`. The v2 archive, including NOTES blob `61ee41957c8cf5d7f245dc42f4e269b5d3bf9505`, is unchanged.

## Executed versus not verified

Executed on `824f1bab`: focused 32/32; action harness exit 0, Chromium 140.0.7339.16, viewport 390×844, root 16px; montage exit 0, 56 measurements, overflow max 0, root 32px only at width 320; typecheck exit 0; lint exit 0, 144 warnings, 0 errors; five guards exit 0; production build exit 0, Next.js 16.4.1, `/account/bookings` dynamic. The build CSS is the digest above. It was produced from this component blob. It is not the reviewer’s PostCSS compilation.

Not executed on this head: local full `npm test`, local PostgreSQL `~*`, hosted PostgREST, hosted RLS, Next App Router, hydration, native device, native zoom, screen reader, and any hosted account read. Earlier native CI is not a gate for this head.

The `1574adcb` runs remain the historical B-P2-PROOF-04 evidence. They are not gates for `824f1bab`. Native CI `40120501254` remains the green run for `5a284965` only.

## Database, production, provider, cost

No migration, RLS, grant, function, Auth, provider, model, or monthly-cost change in this correction.

## Standing limits

This session does not retry #985 / #982, #917, #913 / #911, #968, #748, #626, Bern #934 / #937, #944, or #585.

## Next actor

Technical Lead, same author and same session, for independent exact-head re-review. Cursor does not mark Ready, merge, close #997, or start a follow-up.
