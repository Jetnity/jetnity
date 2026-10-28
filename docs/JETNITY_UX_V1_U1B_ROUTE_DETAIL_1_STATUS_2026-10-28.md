# UX V1 U1-B Route and Detail 1 — STATUS

28 October 2026. Cursor Generation 1. R2 is folded into the same correction. Stop for independent Technical Lead R3. Not Ready. Not merged. No follow-up slice.

## Session

- Name: Jetnity UX V1 Route and Detail 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- https://cursor.com/agents/bc-767a1802-d279-4557-8dbf-4bd81f95f2ba
- bcId: `bc-767a1802-d279-4557-8dbf-4bd81f95f2ba`
- Branch: `feat/ux-v1-u1b-route-detail-1`
- Mode: `NORMAL`
- Seed: `751123c28da452ae7e20264ec3a47a30f1e0e483`
- Main / merge-base: `b7cadb7688f7bac84df0ea33a7b9ec1f3a9b7c48`
- TASK blob: `78d540737fd6b297ef883a369eb109f07b9bd094` unchanged
- Reviewed candidate that required changes: `e8a0b496a80e0b984f27813802f1f6a66e5a1c11`, tree `358441b64527befa75c111a017ce86b77c42a26c`
- The R1 correction tip SHA and tree are in the PR comment on #1080 for the commit that contains this file. Native App/Auth CI and Preview on that new head are recorded there when they finish, not in this file.

## R1 corrections

The displayed day, its grouped items, the editor, the delete callback, and the integrated day now share one validated effective day. Browser Back from day 11 to the tag-free plan URL shows Tag 1 and `flight-out`. The synthetic remove callback receives `day-1:flight-out`. Forward returns `transfer-11` and `stay-11`. The wide default stays unlabeled.

Zur Route restores the route scroll captured from a visible route interaction. Day, item, next/previous, and detail scrolling do not overwrite that snapshot.

Route, selected day, and selected item stay inside the document at 280, 320, 360, 390, 430, 768, and 1440, at root 16 and root 32. Item copy wraps through inherited `word-break: break-word` on the owned detail slot. No overflow clip. `TripWorkspaceDetail` and `TripIntegratedDay` were not edited.

A deferred save on day 11 keeps the same form, title, date, and one write through Übersicht. The same is true for a deferred draft opened on the unlabeled day 1 after Back: the writer receives day 1 once, and the error is still on that form after Übersicht and a width change. Returning to a plan that had no canonical tag does not invent one. Zur Route keeps a scroll snapshot only when the focused target stays fully visible; otherwise it scrolls the target clear of the sticky header and the bottom bar, including root-32 day 10, keyboard day 20, direct day 20, and the no-day note. The standalone counter keeps nowrap. The measured counter and the date line wrap, without both declarations on one element.

## Local evidence on this correction

U1-B mounted Chrome: 16 tests passed, including the deferred day-11 draft, the deferred default-day draft, vertical reveal for root 32, late keyboard, direct day 20 and the no-day note, and the unchanged route-scroll case. N12 mounted chronology: 10 passed on the unchanged plan surface. U1-A2 geometry: 8 passed. The plan premium source contract passed. `tsc --noEmit` passed. ESLint on the touched files: 0 errors. `npm run build` exited 0.

## Not claimed

Native App/Auth CI and Vercel Preview on the R1 correction head until the PR comment records them. Real browser zoom 200%, a physical device, VoiceOver, Work Production, Ready, or merge. Preview READY is not hosted UI acceptance.
