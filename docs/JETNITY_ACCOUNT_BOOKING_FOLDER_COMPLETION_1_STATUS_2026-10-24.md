# Account Booking Folder Completion 1 — STATUS

Date: 2026-10-24. Writer: **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**. Session `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`. Model `grok-4.7-high-fast`. Draft PR #1000. Issue #997 stays open.

**Status: B-P2-LAYOUT-06 wraps the heading and card action. STOP / write freeze for independent Technical-Lead re-review. Not code PASS. Not Ready. Not merged.**

Accepted predecessor: `9092b29c2e187bd73d644a3d85670f3ac6436be1`, tree `bc39c3b74b5cbab7c15595500ddc70a72de8826b`. Accepted PLAN head `2ceb9e3a689d9e64e2ed555833e8b302cd139116`, PLAN blob `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2`, TASK blob `754fc2e0d87ba0755713c174acf60723ab3d1f13`. Both blobs are unchanged. Superseded repair head `5a28496521c66cb2407f1f897b6c79646df1ea94`. Executed proof head `1574adcb802cc7c0039eb9724e0a8a11191d4ed8`, tree `3f5a46d6ccf1ad31acc68bf2edf086d8f2efb1f4`. The review head is the commit that contains this file. Mode `NORMAL`.

The merge of the accepted main into this branch had no conflict. The product read is unchanged by this correction: 50 visible rows plus one sentinel, raw `imatch.***=`, the symbol repeat sentinel, and the applied-address form key. The harness now proves a real second page, the next request, and the committed view.

## Done

- Normal merge of `9092b29`. No rebase, reset, or cherry-pick.
- B-P2-PROOF-04 harness correction and a new evidence directory `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/`.
- Prior `ablauf.json` and `montage.json` left byte-identical.
- Focused 32/32, typecheck, lint, five guards, production build, action harness, and static montage on executed head `1574adcb`. Those runs are not gates for the preservation commit.
- B-P2-PROOF-05: `NOTES.md` restored to blob `5fdde5ee5eb264b051ad7dd24f4c8999e2afeec9` from `5a284965`. The `fe6cca37` NOTES bytes are archived unchanged as blob `61ee41957c8cf5d7f245dc42f4e269b5d3bf9505` at `docs/evidence/account-booking-folder-completion-1/v2-proof04-2026-10-24/NOTES-at-fe6cca37.md`. No runtime, script, TASK, or PLAN file changes in this preservation commit. No new test run.

## Not done

- Technical-Lead exact-head PASS, Ready, or merge.
- Hosted PostgREST, hosted RLS, local `~*`, or Next App Router.
- A local full `npm test` on this head. Native CI was not observed at write time.
- Closing #997 or editing TL-owned global docs.

## B-P2-LAYOUT-06

At 320×700 and root 32px the heading computed to 60px / 72px / −2.4px and the plan link was wider than the card. The heading, titles, hints, and action links now use `overflow-wrap: anywhere` and a full-width action below the `sm` breakpoint. Nothing sets `overflow: hidden`. `BuchungenFilter.tsx` is unchanged.

Executed proof head `824f1bab0a5415a0e8c118004d4b429d58bf47f1`, tree `704c9eeaf3016d09c7c92209190228ebcc62d69a`. Fresh evidence only: `docs/evidence/account-booking-folder-completion-1/v3-layout06-2026-10-25/`. Historical NOTES, `ablauf.json`, `montage.json`, and the v2 directory stay byte-identical.

On that head: focused 32/32; action harness exit 0; montage exit 0, 56 measurements, overflow max 0. At 320/32 the computed H1 is 60px, 72px, −2.4px, weight 600, `overflow-wrap: anywhere`. The plan link is 28px, `rgb(21, 58, 51)`, width 238, right edge 279. Production CSS SHA256 `9fdcfb3304373fe80e813c75b8a05078064bb38eeba3b6f309db2e28d45ccf7b`. That is the local Next build, not the review PostCSS digest `6ea356ae1284e432eae27e9511923cf43550a4f80b34ac63c7235424e1f22af8`. The v2 montage’s overflow 0 did not record a computed heading size and is not relabeled. Typecheck, lint (0 errors, 144 warnings), five guards, and `npm run build` (Next.js 16.4.1, exit 0) ran for this correction. Local full `npm test` did not. Native CI for `84c496c0` and earlier heads is not a gate for this head.

Next actor: Technical Lead, same author and session. A later CI finding waits for an explicit instruction. No further commit from this session unless that instruction arrives.
